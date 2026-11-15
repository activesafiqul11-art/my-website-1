import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import {
  clearSessionCookie,
  getSessionFromRequest,
  hashPassword,
  requireAdmin,
  setSessionCookie,
  verifyCredentials,
} from './server/auth.ts';
import {
  addProject,
  createContactMessage,
  deleteMessage,
  deleteProject,
  getAllMessages,
  getPasswordHashOverride,
  getPublicPortfolio,
  setPasswordHashOverride,
  updateMessageStatus,
  updatePortfolioInfo,
  updateProject,
} from './server/store.ts';
import { contactSubmissionSchema } from './src/lib/validation.ts';
import type { MessageStatus, ProjectCategory } from './src/types/portfolio.ts';

const VALID_CATEGORIES = new Set<ProjectCategory>([
  'Motion Graphics',
  'Brand Identity',
  '3D & Title Design',
  'Social & Marketing',
]);

const VALID_MESSAGE_STATUS = new Set<MessageStatus>(['unread', 'read', 'archived']);

// In-memory sliding-window rate limiter for contact submissions
const contactRateBuckets = new Map<string, number[]>();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (contactRateBuckets.get(ip) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS,
  );
  if (timestamps.length >= RATE_MAX_REQUESTS) {
    contactRateBuckets.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  contactRateBuckets.set(ip, timestamps);
  return false;
}

function cleanStr(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

async function startServer() {
  const app = express();
  const port = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '25mb' }));

  // Public Portfolio Data (never includes messages or admin credentials)
  app.get('/api/portfolio', async (_req, res) => {
    try {
      const data = await getPublicPortfolio();
      res.json(data);
    } catch {
      res.status(500).json({ error: 'Unable to load portfolio data' });
    }
  });

  // Public Contact Form Submission -> Zod validation + honeypot + rate limit -> saved to DB only
  app.post('/api/contact', async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      if (isRateLimited(clientIp)) {
        res.status(429).json({
          error: 'Too many messages sent recently. Please wait a few minutes and try again.',
        });
        return;
      }

      const parsed = contactSubmissionSchema.safeParse(req.body);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0]?.message || 'Please check your form details.';
        res.status(400).json({ error: firstIssue });
        return;
      }

      // Honeypot check: bots filling hidden "website" field get silent success without saving
      if (parsed.data.website && parsed.data.website.trim().length > 0) {
        res.status(200).json({ ok: true });
        return;
      }

      await createContactMessage({
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
      });

      // Browser receives only a success status
      res.status(201).json({ ok: true });
    } catch {
      res.status(500).json({ error: 'Failed to send your message. Please try again.' });
    }
  });

  // Admin Session Check
  app.get('/api/admin/session', (req, res) => {
    const session = getSessionFromRequest(req);
    if (!session) {
      res.json({ authenticated: false });
      return;
    }
    res.json({ authenticated: true, username: session.username });
  });

  // Admin Login
  app.post('/api/admin/login', async (req, res) => {
    const username = cleanStr(req.body?.username, 120);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    const overrideHash = await getPasswordHashOverride();
    const ok = verifyCredentials(username, password, overrideHash);
    if (!ok) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    setSessionCookie(req, res, username);
    res.json({ authenticated: true, username });
  });

  // Admin Logout
  app.post('/api/admin/logout', (req, res) => {
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  // Protected: Update Admin Password
  app.post('/api/admin/password', requireAdmin, async (req, res) => {
    const currentPassword =
      typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    const adminUser = (req as express.Request & { adminUser?: string }).adminUser || '';

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    const overrideHash = await getPasswordHashOverride();
    if (!verifyCredentials(adminUser, currentPassword, overrideHash)) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    await setPasswordHashOverride(hashPassword(newPassword));
    res.json({ ok: true });
  });

  // Protected: Update All Portfolio Sections
  app.put('/api/admin/profile', requireAdmin, async (req, res) => {
    try {
      const p = req.body?.profile ?? {};
      const stats = Array.isArray(req.body?.stats) ? req.body.stats : undefined;
      const services = Array.isArray(req.body?.services) ? req.body.services : undefined;
      const skills = Array.isArray(req.body?.skills) ? req.body.skills : undefined;
      const experience = Array.isArray(req.body?.experience) ? req.body.experience : undefined;
      const certifications = Array.isArray(req.body?.certifications)
        ? req.body.certifications
        : undefined;
      const testimonials = Array.isArray(req.body?.testimonials)
        ? req.body.testimonials
        : undefined;

      const updated = await updatePortfolioInfo({
        profile: {
          name: cleanStr(p.name, 120) || 'Md. Safiqul Islam',
          hero3DWordmark: cleanStr(p.hero3DWordmark, 24) || 'SAFIQUL',
          role: cleanStr(p.role, 160),
          location: cleanStr(p.location, 180),
          phone: cleanStr(p.phone, 60),
          email: cleanStr(p.email, 160),
          portfolioDriveUrl: cleanStr(p.portfolioDriveUrl, 500),
          availability: cleanStr(p.availability, 200),
          heroHeadline: cleanStr(p.heroHeadline, 220),
          heroSubheadline: cleanStr(p.heroSubheadline, 500),
          aboutHeading: cleanStr(p.aboutHeading, 220),
          aboutLeadParagraph: cleanStr(p.aboutLeadParagraph, 800),
          aboutBio: cleanStr(p.aboutBio, 2000),
          scrollFillStatement: cleanStr(p.scrollFillStatement, 120),
          portraitImage:
            cleanStr(p.portraitImage, 4_000_000) ||
            '/assets/aistudio/Professional_Teal-Ring_Portrait_d957de68.png',
          scrubVideoUrl: cleanStr(p.scrubVideoUrl, 16_000_000),
          scrubVideoPoster: cleanStr(p.scrubVideoPoster, 4_000_000) || 'preset:motion_reel',
        },
        stats: stats?.map((s: Record<string, unknown>, i: number) => ({
          id: cleanStr(s.id, 60) || `stat-${i + 1}`,
          number: Number.isFinite(Number(s.number)) ? Number(s.number) : 0,
          suffix: cleanStr(s.suffix, 12),
          label: cleanStr(s.label, 80),
          detail: cleanStr(s.detail, 120),
        })),
        services: services?.map((srv: Record<string, unknown>, i: number) => ({
          id: cleanStr(srv.id, 60) || `srv-${i + 1}`,
          number: cleanStr(srv.number, 20) || `0${i + 1}.`,
          title: cleanStr(srv.title, 120),
          description: cleanStr(srv.description, 400),
          deliverables: cleanStr(srv.deliverables, 200),
        })),
        skills: skills?.map((sk: Record<string, unknown>, i: number) => ({
          id: cleanStr(sk.id, 60) || `sk-${i + 1}`,
          name: cleanStr(sk.name, 100),
          category: cleanStr(sk.category, 60),
          level: Math.max(0, Math.min(100, Number(sk.level) || 0)),
        })),
        experience: experience?.map((ex: Record<string, unknown>, i: number) => ({
          id: cleanStr(ex.id, 60) || `exp-${i + 1}`,
          period: cleanStr(ex.period, 60),
          role: cleanStr(ex.role, 120),
          organization: cleanStr(ex.organization, 120),
          location: cleanStr(ex.location, 120),
          summary: cleanStr(ex.summary, 500),
        })),
        certifications: certifications?.map((cert: Record<string, unknown>, i: number) => ({
          id: cleanStr(cert.id, 60) || `cert-${i + 1}`,
          title: cleanStr(cert.title, 160),
          issuer: cleanStr(cert.issuer, 120),
          year: cleanStr(cert.year, 20),
          credentialUrl: cleanStr(cert.credentialUrl, 500),
        })),
        testimonials: testimonials?.map((t: Record<string, unknown>, i: number) => ({
          id: cleanStr(t.id, 60) || `test-${i + 1}`,
          name: cleanStr(t.name, 100),
          role: cleanStr(t.role, 100),
          organization: cleanStr(t.organization, 120),
          quote: cleanStr(t.quote, 600),
          outcome: cleanStr(t.outcome, 200),
        })),
      });

      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Failed to update profile information.' });
    }
  });

  // Protected: Add Project
  app.post('/api/admin/projects', requireAdmin, async (req, res) => {
    try {
      const title = cleanStr(req.body?.title, 160);
      const rawCat = cleanStr(req.body?.category, 60) as ProjectCategory;
      const category: ProjectCategory = VALID_CATEGORIES.has(rawCat)
        ? rawCat
        : 'Motion Graphics';
      const year = cleanStr(req.body?.year, 16) || String(new Date().getFullYear());
      const client = cleanStr(req.body?.client, 120) || 'Studio Commission';
      const summary = cleanStr(req.body?.summary, 1200);
      const goal = cleanStr(req.body?.goal, 800);
      const approach = cleanStr(req.body?.approach, 1000);
      const results = cleanStr(req.body?.results, 800);
      const resultMetrics = Array.isArray(req.body?.resultMetrics)
        ? req.body.resultMetrics.map((m: Record<string, unknown>) => ({
            label: cleanStr(m?.label, 100) || 'Outcome',
            percent: Math.max(0, Math.min(100, Number(m?.percent) || 0)),
          }))
        : [
            { label: 'Visual Clarity & Retention', percent: 90 },
            { label: 'Delivery Readiness', percent: 100 },
          ];
      const deliverables = cleanStr(req.body?.deliverables, 220);
      const coverImage = cleanStr(req.body?.coverImage, 4_000_000) || 'preset:motion_reel';
      const mockupType = req.body?.mockupType === 'phone' ? 'phone' : 'laptop';
      const videoUrl = cleanStr(req.body?.videoUrl, 600);
      const externalUrl = cleanStr(req.body?.externalUrl, 600);
      const featured = Boolean(req.body?.featured);

      if (!title || !summary) {
        res.status(400).json({ error: 'Project title and summary are required.' });
        return;
      }

      const project = await addProject({
        title,
        category,
        year,
        client,
        summary,
        goal,
        approach,
        results,
        resultMetrics,
        deliverables,
        coverImage,
        mockupType,
        videoUrl,
        externalUrl,
        featured,
      });

      res.status(201).json(project);
    } catch {
      res.status(500).json({ error: 'Failed to create project.' });
    }
  });

  // Protected: Update Project
  app.put('/api/admin/projects/:id', requireAdmin, async (req, res) => {
    try {
      const id = cleanStr(req.params.id, 80);
      const rawCat = cleanStr(req.body?.category, 60) as ProjectCategory;
      const patch = {
        ...(req.body?.title !== undefined ? { title: cleanStr(req.body.title, 160) } : {}),
        ...(VALID_CATEGORIES.has(rawCat) ? { category: rawCat } : {}),
        ...(req.body?.year !== undefined ? { year: cleanStr(req.body.year, 16) } : {}),
        ...(req.body?.client !== undefined ? { client: cleanStr(req.body.client, 120) } : {}),
        ...(req.body?.summary !== undefined ? { summary: cleanStr(req.body.summary, 1200) } : {}),
        ...(req.body?.goal !== undefined ? { goal: cleanStr(req.body.goal, 800) } : {}),
        ...(req.body?.approach !== undefined ? { approach: cleanStr(req.body.approach, 1000) } : {}),
        ...(req.body?.results !== undefined ? { results: cleanStr(req.body.results, 800) } : {}),
        ...(Array.isArray(req.body?.resultMetrics)
          ? {
              resultMetrics: req.body.resultMetrics.map((m: Record<string, unknown>) => ({
                label: cleanStr(m?.label, 100) || 'Outcome',
                percent: Math.max(0, Math.min(100, Number(m?.percent) || 0)),
              })),
            }
          : {}),
        ...(req.body?.deliverables !== undefined
          ? { deliverables: cleanStr(req.body.deliverables, 220) }
          : {}),
        ...(req.body?.coverImage !== undefined
          ? { coverImage: cleanStr(req.body.coverImage, 4_000_000) || 'preset:motion_reel' }
          : {}),
        ...(req.body?.mockupType !== undefined
          ? { mockupType: (req.body.mockupType === 'phone' ? 'phone' : 'laptop') as 'phone' | 'laptop' }
          : {}),
        ...(req.body?.videoUrl !== undefined ? { videoUrl: cleanStr(req.body.videoUrl, 600) } : {}),
        ...(req.body?.externalUrl !== undefined
          ? { externalUrl: cleanStr(req.body.externalUrl, 600) }
          : {}),
        ...(req.body?.featured !== undefined ? { featured: Boolean(req.body.featured) } : {}),
      };

      const updated = await updateProject(id, patch);
      if (!updated) {
        res.status(404).json({ error: 'Project not found.' });
        return;
      }
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Failed to update project.' });
    }
  });

  // Protected: Delete Project
  app.delete('/api/admin/projects/:id', requireAdmin, async (req, res) => {
    const id = cleanStr(req.params.id, 80);
    const deleted = await deleteProject(id);
    if (!deleted) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    res.json({ ok: true });
  });

  // Protected: Get Contact Messages
  app.get('/api/admin/messages', requireAdmin, async (_req, res) => {
    const messages = await getAllMessages();
    res.json({ messages });
  });

  // Protected: Update Message Status
  app.patch('/api/admin/messages/:id', requireAdmin, async (req, res) => {
    const id = cleanStr(req.params.id, 80);
    const status = cleanStr(req.body?.status, 30) as MessageStatus;
    if (!VALID_MESSAGE_STATUS.has(status)) {
      res.status(400).json({ error: 'Invalid status.' });
      return;
    }
    const updated = await updateMessageStatus(id, status);
    if (!updated) {
      res.status(404).json({ error: 'Message not found.' });
      return;
    }
    res.json(updated);
  });

  // Protected: Delete Message
  app.delete('/api/admin/messages/:id', requireAdmin, async (req, res) => {
    const id = cleanStr(req.params.id, 80);
    const deleted = await deleteMessage(id);
    if (!deleted) {
      res.status(404).json({ error: 'Message not found.' });
      return;
    }
    res.json({ ok: true });
  });

  if (isProd) {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use('/projects/assets', express.static(path.join(distPath, 'assets')));
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
