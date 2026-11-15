import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  CertificationItem,
  ContactMessage,
  ExperienceItem,
  MessageStatus,
  PortfolioProfile,
  PortfolioProject,
  PortfolioService,
  PortfolioSkill,
  PortfolioStat,
  PublicPortfolioData,
  TestimonialItem,
} from '../src/types/portfolio.ts';

interface StoredDatabase extends PublicPortfolioData {
  messages: ContactMessage[];
  passwordHashOverride: string | null;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'portfolio.json');

const DEFAULT_DATA: StoredDatabase = {
  profile: {
    name: 'Md. Safiqul Islam',
    hero3DWordmark: 'SAFIQUL',
    role: 'Graphic Designer | Motion Graphics Designer',
    location: 'Gaibandha Sadar, Gaibandha, Bangladesh',
    phone: '01946930081',
    email: 'activesafiqul11@gmail.com',
    portfolioDriveUrl:
      'https://drive.google.com/drive/folders/1o1gUWY25ibaOkM2LZTbEU7BlWHoLuXV1',
    availability: 'Available for freelance commissions and studio collaborations',
    heroHeadline: 'Motion & visual systems built to move audiences.',
    heroSubheadline:
      'Graphic designer and motion strategist crafting kinetic identities, social campaigns, data-informed creative systems, and 3D visual storytelling.',
    aboutHeading: 'Precision in static frames. Momentum in every transition.',
    aboutLeadParagraph:
      'Every visual campaign succeeds when graphic discipline meets rhythmic motion. From brand identity foundations to scroll-stopping social reels and measurable digital growth, every frame is engineered for clarity.',
    aboutBio:
      'Based in Gaibandha Sadar, Bangladesh, I work across graphic design, motion graphics, and digital creative strategy—bridging structured typographic systems with fluid 2D and 3D animation, modern AI-assisted production workflows, and performance analytics.',
    scrollFillStatement: 'DESIGN IN MOTION · DATA-DRIVEN CREATIVE',
    portraitImage: '/assets/aistudio/Professional_Teal-Ring_Portrait_d957de68.png',
    scrubVideoUrl: '/assets/showreel-scrub.mp4',
    scrubVideoPoster: 'preset:motion_reel',
  },
  stats: [
    {
      id: 'stat-projects',
      number: 65,
      suffix: '+',
      label: 'Delivered Projects',
      detail: 'Identity & motion campaigns',
    },
    {
      id: 'stat-reels',
      number: 140,
      suffix: '+',
      label: 'Motion Sequences',
      detail: 'Title cards, explainers & reels',
    },
    {
      id: 'stat-reach',
      number: 420,
      suffix: 'K',
      label: 'Campaign Reach',
      detail: 'Across client social channels',
    },
    {
      id: 'stat-retention',
      number: 98,
      suffix: '%',
      label: 'Client Satisfaction',
      detail: 'On-time milestone delivery',
    },
  ],
  services: [
    {
      id: 'srv-01',
      number: '01.',
      title: 'Social Media Strategy',
      description:
        'Platform-native motion reels, campaign calendars, visual storytelling arcs, and high-retention creative hooks built for organic and paid reach.',
      deliverables: 'Reels & Shorts Systems · Content Pillars · Campaign Art Direction',
    },
    {
      id: 'srv-02',
      number: '02.',
      title: 'AI for Marketing',
      description:
        'Integrating generative concept prototyping, rapid ad-variant production, and intelligent creative workflows into studio-grade marketing pipelines.',
      deliverables: 'Rapid Concepting · Creative Automation · Ad Variant Systems',
    },
    {
      id: 'srv-03',
      number: '03.',
      title: 'Web Analytics',
      description:
        'Tracking creative performance, funnel conversion metrics, and audience retention signals so every visual iteration drives measurable growth.',
      deliverables: 'GA4 Dashboards · Creative Attribution · Conversion Audits',
    },
    {
      id: 'srv-04',
      number: '04.',
      title: 'Training',
      description:
        'Hands-on workshops and team coaching on motion graphics craft, brand consistency, and modern AI-assisted visual production.',
      deliverables: 'Studio Workshops · Team Playbooks · Practical Mentorship',
    },
  ],
  skills: [
    { id: 'sk-1', name: 'Motion Graphics & After Effects', category: 'Motion Craft', level: 95 },
    { id: 'sk-2', name: 'Brand Identity & Typography', category: 'Graphic Design', level: 92 },
    { id: 'sk-3', name: '3D Visuals & Blender / R3F', category: 'Spatial Design', level: 84 },
    { id: 'sk-4', name: 'Social Media Strategy', category: 'Marketing', level: 88 },
    { id: 'sk-5', name: 'AI Creative Workflows', category: 'Automation', level: 86 },
    { id: 'sk-6', name: 'Web Analytics & Attribution', category: 'Measurement', level: 82 },
  ],
  experience: [
    {
      id: 'exp-1',
      period: '2024 — Present',
      role: 'Lead Graphic & Motion Graphics Designer',
      organization: 'Independent Studio Practice',
      location: 'Gaibandha, Bangladesh',
      summary:
        'Directing brand identity packages, kinetic title systems, social video campaigns, and AI-accelerated creative production for regional and international clients.',
    },
    {
      id: 'exp-2',
      period: '2022 — 2024',
      role: 'Motion & Social Creative Specialist',
      organization: 'Digital Media & Growth Collaborations',
      location: 'Dhaka / Remote',
      summary:
        'Produced high-retention promotional reels, campaign style frames, and analytics-backed creative variations across multi-channel launches.',
    },
    {
      id: 'exp-3',
      period: '2020 — 2022',
      role: 'Graphic Designer & Print Visualizer',
      organization: 'Regional Brand & Print Commissions',
      location: 'Gaibandha Sadar',
      summary:
        'Designed logomarks, exhibition posters, packaging layouts, and print-ready brand collateral with disciplined Swiss grid typography.',
    },
  ],
  projects: [
    {
      id: 'proj-kinetic-reel',
      title: 'Kinetic Ribbon & Studio Title System',
      category: 'Motion Graphics',
      year: '2026',
      client: 'Monolith Media Lab',
      summary:
        'A 45-second modular title package and broadcast bumper built around brushed metallic ribbons, high-contrast lighting, and rhythmic typography.',
      goal: 'Establish a recognizable, premium motion language for product announcements and weekly video broadcasts.',
      approach:
        'Designed 3D extruded ribbon keyframes in Blender and composited modular After Effects typography templates synchronized to rhythmic percussion.',
      results:
        'Increased average 30-second video retention across launch promos and unified 14 recurring broadcast segments under one toolkit.',
      resultMetrics: [
        { label: 'Average 30s Viewer Retention', percent: 84 },
        { label: 'Template Production Speedup', percent: 72 },
        { label: 'Brand Recall Consistency', percent: 94 },
      ],
      deliverables: '16:9 Broadcast Master · Social Cutdowns · Style Frames',
      coverImage: 'preset:motion_reel',
      mockupType: 'laptop',
      videoUrl: '',
      externalUrl:
        'https://drive.google.com/drive/folders/1o1gUWY25ibaOkM2LZTbEU7BlWHoLuXV1',
      featured: true,
      createdAt: '2026-09-12T10:00:00.000Z',
    },
    {
      id: 'proj-maeson-identity',
      title: 'Maeson Architectural Brand System',
      category: 'Brand Identity',
      year: '2026',
      client: 'Maeson Creative Direction',
      summary:
        'Comprehensive identity monograph featuring blind-embossed stationery, Swiss-inspired grid proportions, and custom typographic hierarchy.',
      goal: 'Reposition an architectural consultancy with a timeless tactile identity across print stationery and digital case studies.',
      approach:
        'Built a strict modular layout grid, paired geometric display typography with editorial serif captions, and produced physical print proofs.',
      results:
        'Delivered a complete 48-page digital and print brand book adopted across three regional studio offices.',
      resultMetrics: [
        { label: 'Proposal Win-Rate Lift', percent: 68 },
        { label: 'Cross-Channel Brand Alignment', percent: 96 },
      ],
      deliverables: 'Brand Monograph · Print Stationery · Digital Guidelines',
      coverImage: 'preset:brand_identity',
      mockupType: 'laptop',
      videoUrl: '',
      externalUrl:
        'https://drive.google.com/drive/folders/1o1gUWY25ibaOkM2LZTbEU7BlWHoLuXV1',
      featured: false,
      createdAt: '2026-07-20T10:00:00.000Z',
    },
    {
      id: 'proj-abstract-poster',
      title: 'Vermilion Geometric Campaign Series',
      category: 'Social & Marketing',
      year: '2025',
      client: 'Dhaka Design Showcase',
      summary:
        'Multi-format exhibition poster and mobile social campaign exploring architectural contrast, sharp diagonals, and kinetic mobile stories.',
      goal: 'Drive event registrations through high-contrast visual posters adapted cleanly for both physical gallery walls and mobile feeds.',
      approach:
        'Created a unified geometric vector system exported into vertical mobile stories, feed carousels, and A1 exhibition prints.',
      results:
        'Generated strong click-through engagement across social teasers and sold out early-bird workshop seating.',
      resultMetrics: [
        { label: 'Social Story Completion', percent: 79 },
        { label: 'Registration Target Reached', percent: 100 },
      ],
      deliverables: 'A1 Print Posters · Mobile Reels · Social Carousels',
      coverImage: 'preset:poster_typography',
      mockupType: 'phone',
      videoUrl: '',
      externalUrl:
        'https://drive.google.com/drive/folders/1o1gUWY25ibaOkM2LZTbEU7BlWHoLuXV1',
      featured: false,
      createdAt: '2025-11-05T10:00:00.000Z',
    },
    {
      id: 'proj-dimensional-logo',
      title: 'Dimensional Logo Motion & Stinger Pack',
      category: '3D & Title Design',
      year: '2026',
      client: 'Northline Productions',
      summary:
        'Custom 3D extruded emblem animation with procedural studio reflections and clean camera-dolly transitions for mobile and desktop streams.',
      goal: 'Replace flat static bumpers with a crisp, fast-loading 3D motion reveal tailored for vertical and widescreen formats.',
      approach:
        'Modeled beveled metallic geometry with calibrated studio HDR reflections and delivered transparent ProRes + MP4 stingers.',
      results:
        'Cut editor turnaround time per episode while lifting intro watch-through rates across vertical video channels.',
      resultMetrics: [
        { label: 'Intro Watch-Through Rate', percent: 89 },
        { label: 'Export Size Efficiency', percent: 85 },
      ],
      deliverables: '3D Logo Reveal · Alpha Matte Pack · Mobile Cutdowns',
      coverImage: 'preset:motion_reel',
      mockupType: 'phone',
      videoUrl: '',
      externalUrl:
        'https://drive.google.com/drive/folders/1o1gUWY25ibaOkM2LZTbEU7BlWHoLuXV1',
      featured: false,
      createdAt: '2026-04-18T10:00:00.000Z',
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      title: 'Motion Design & Kinetic Typography Specialization',
      issuer: 'School of Motion / Studio Curriculum',
      year: '2025',
      credentialUrl:
        'https://drive.google.com/drive/folders/1o1gUWY25ibaOkM2LZTbEU7BlWHoLuXV1',
    },
    {
      id: 'cert-2',
      title: 'Google Analytics 4 & Digital Measurement',
      issuer: 'Google Skillshop',
      year: '2025',
      credentialUrl:
        'https://drive.google.com/drive/folders/1o1gUWY25ibaOkM2LZTbEU7BlWHoLuXV1',
    },
    {
      id: 'cert-3',
      title: 'Generative AI for Creative & Marketing Workflows',
      issuer: 'Professional Creative Certification',
      year: '2026',
      credentialUrl:
        'https://drive.google.com/drive/folders/1o1gUWY25ibaOkM2LZTbEU7BlWHoLuXV1',
    },
  ],
  testimonials: [
    {
      id: 'test-1',
      name: 'Tariqul Hasan',
      role: 'Creative Producer',
      organization: 'Monolith Media Lab',
      quote:
        'Safiqul brought both structural graphic discipline and sharp motion timing to our broadcast package. Every revision came back faster and cleaner than expected.',
      outcome: 'Delivered 14 modular broadcast motion templates ahead of launch.',
    },
    {
      id: 'test-2',
      name: 'Nusrat Jahan',
      role: 'Brand Strategist',
      organization: 'Northline Productions',
      quote:
        'Rarely do you find a designer who understands typography grids, 3D motion, and social retention metrics in one workflow.',
      outcome: 'Unified brand identity and mobile video stingers across 4 channels.',
    },
    {
      id: 'test-3',
      name: 'Mahmudul Karim',
      role: 'Marketing Lead',
      organization: 'Apex Retail Collective',
      quote:
        'From campaign strategy to final animated ad sets, his creative system helped our team launch twice as fast with clear visual consistency.',
      outcome: '2x faster campaign turnaround across quarterly launches.',
    },
  ],
  messages: [],
  passwordHashOverride: null,
};

let writeQueue: Promise<void> = Promise.resolve();

function normalizeStat(raw: unknown, idx: number): PortfolioStat {
  const s = (raw ?? {}) as Record<string, unknown>;
  if (typeof s.number === 'number') {
    return {
      id: typeof s.id === 'string' ? s.id : `stat-${idx + 1}`,
      number: s.number,
      suffix: typeof s.suffix === 'string' ? s.suffix : '',
      label: typeof s.label === 'string' ? s.label : '',
      detail: typeof s.detail === 'string' ? s.detail : '',
    };
  }
  const valueStr = typeof s.value === 'string' ? s.value.trim() : '0';
  const match = valueStr.match(/^(\d+(?:\.\d+)?)(.*)$/);
  return {
    id: typeof s.id === 'string' ? s.id : `stat-${idx + 1}`,
    number: match ? Number(match[1]) : 0,
    suffix: match ? match[2].trim() : '',
    label: typeof s.label === 'string' ? s.label : '',
    detail: typeof s.detail === 'string' ? s.detail : '',
  };
}

function normalizeProject(raw: unknown, idx: number): PortfolioProject {
  const p = (raw ?? {}) as Record<string, unknown>;
  return {
    id: typeof p.id === 'string' ? p.id : `proj-${idx + 1}`,
    title: typeof p.title === 'string' ? p.title : 'Untitled Project',
    category: (typeof p.category === 'string' ? p.category : 'Motion Graphics') as PortfolioProject['category'],
    year: typeof p.year === 'string' ? p.year : '2026',
    client: typeof p.client === 'string' ? p.client : 'Client',
    summary: typeof p.summary === 'string' ? p.summary : '',
    goal:
      typeof p.goal === 'string' && p.goal.trim()
        ? p.goal
        : 'Deliver a high-clarity visual and motion system aligned with brand objectives.',
    approach:
      typeof p.approach === 'string' && p.approach.trim()
        ? p.approach
        : 'Combined structured typographic grids with calibrated motion curves and studio lighting.',
    results:
      typeof p.results === 'string' && p.results.trim()
        ? p.results
        : 'Shipped multi-format production assets across desktop, broadcast, and mobile channels.',
    resultMetrics: Array.isArray(p.resultMetrics)
      ? p.resultMetrics.map((m: Record<string, unknown>) => ({
          label: typeof m?.label === 'string' ? m.label : 'Outcome',
          percent: typeof m?.percent === 'number' ? Math.max(0, Math.min(100, m.percent)) : 80,
        }))
      : [
          { label: 'Visual Clarity & Retention', percent: 90 },
          { label: 'Asset Delivery Readiness', percent: 100 },
        ],
    deliverables: typeof p.deliverables === 'string' ? p.deliverables : '',
    coverImage: typeof p.coverImage === 'string' ? p.coverImage : 'preset:motion_reel',
    mockupType: p.mockupType === 'phone' ? 'phone' : 'laptop',
    videoUrl: typeof p.videoUrl === 'string' ? p.videoUrl : '',
    externalUrl: typeof p.externalUrl === 'string' ? p.externalUrl : '',
    featured: Boolean(p.featured),
    createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date().toISOString(),
  };
}

async function ensureDbFile(): Promise<StoredDatabase> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const rawProfile = (parsed.profile ?? {}) as Record<string, unknown>;

    return {
      profile: {
        ...DEFAULT_DATA.profile,
        ...rawProfile,
        hero3DWordmark:
          typeof rawProfile.hero3DWordmark === 'string' && rawProfile.hero3DWordmark.trim()
            ? rawProfile.hero3DWordmark
            : DEFAULT_DATA.profile.hero3DWordmark,
        scrubVideoUrl:
          typeof rawProfile.scrubVideoUrl === 'string'
            ? rawProfile.scrubVideoUrl
            : DEFAULT_DATA.profile.scrubVideoUrl,
        scrubVideoPoster:
          typeof rawProfile.scrubVideoPoster === 'string'
            ? rawProfile.scrubVideoPoster
            : DEFAULT_DATA.profile.scrubVideoPoster,
      } as PortfolioProfile,
      stats: Array.isArray(parsed.stats)
        ? parsed.stats.map(normalizeStat)
        : DEFAULT_DATA.stats,
      services: Array.isArray(parsed.services)
        ? (parsed.services as PortfolioService[])
        : DEFAULT_DATA.services,
      skills: Array.isArray(parsed.skills)
        ? (parsed.skills as PortfolioSkill[])
        : DEFAULT_DATA.skills,
      experience: Array.isArray(parsed.experience)
        ? (parsed.experience as ExperienceItem[])
        : DEFAULT_DATA.experience,
      projects: Array.isArray(parsed.projects)
        ? parsed.projects.map(normalizeProject)
        : DEFAULT_DATA.projects,
      certifications: Array.isArray(parsed.certifications)
        ? (parsed.certifications as CertificationItem[])
        : DEFAULT_DATA.certifications,
      testimonials: Array.isArray(parsed.testimonials)
        ? (parsed.testimonials as TestimonialItem[])
        : DEFAULT_DATA.testimonials,
      messages: Array.isArray(parsed.messages)
        ? (parsed.messages as ContactMessage[]).map((m) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            subject:
              typeof (m as unknown as Record<string, unknown>).subject === 'string'
                ? String((m as unknown as Record<string, unknown>).subject)
                : String((m as unknown as Record<string, unknown>).projectType || 'Project Inquiry'),
            message: m.message,
            status: m.status || 'unread',
            createdAt: m.createdAt,
          }))
        : [],
      passwordHashOverride:
        typeof parsed.passwordHashOverride === 'string' ? parsed.passwordHashOverride : null,
    };
  } catch {
    await writeDbAtomic(DEFAULT_DATA);
    return structuredClone(DEFAULT_DATA);
  }
}

async function writeDbAtomic(data: StoredDatabase): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmpPath = `${DB_PATH}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmpPath, DB_PATH);
}

function enqueueMutation<T>(fn: (db: StoredDatabase) => Promise<T> | T): Promise<T> {
  const result = writeQueue.then(async () => {
    const db = await ensureDbFile();
    const out = await fn(db);
    await writeDbAtomic(db);
    return out;
  });
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export async function getPublicPortfolio(): Promise<PublicPortfolioData> {
  const db = await ensureDbFile();
  return {
    profile: db.profile,
    stats: db.stats,
    services: db.services,
    skills: db.skills,
    experience: db.experience,
    projects: db.projects,
    certifications: db.certifications,
    testimonials: db.testimonials,
  };
}

export async function getPasswordHashOverride(): Promise<string | null> {
  const db = await ensureDbFile();
  return db.passwordHashOverride;
}

export async function setPasswordHashOverride(hash: string): Promise<void> {
  await enqueueMutation((db) => {
    db.passwordHashOverride = hash;
  });
}

export async function updatePortfolioInfo(payload: {
  profile: Partial<PortfolioProfile>;
  stats?: PortfolioStat[];
  services?: PortfolioService[];
  skills?: PortfolioSkill[];
  experience?: ExperienceItem[];
  certifications?: CertificationItem[];
  testimonials?: TestimonialItem[];
}): Promise<PublicPortfolioData> {
  return enqueueMutation((db) => {
    db.profile = {
      ...db.profile,
      ...payload.profile,
    };
    if (Array.isArray(payload.stats)) db.stats = payload.stats;
    if (Array.isArray(payload.services)) db.services = payload.services;
    if (Array.isArray(payload.skills)) db.skills = payload.skills;
    if (Array.isArray(payload.experience)) db.experience = payload.experience;
    if (Array.isArray(payload.certifications)) db.certifications = payload.certifications;
    if (Array.isArray(payload.testimonials)) db.testimonials = payload.testimonials;

    return {
      profile: db.profile,
      stats: db.stats,
      services: db.services,
      skills: db.skills,
      experience: db.experience,
      projects: db.projects,
      certifications: db.certifications,
      testimonials: db.testimonials,
    };
  });
}

export async function addProject(
  input: Omit<PortfolioProject, 'id' | 'createdAt'>,
): Promise<PortfolioProject> {
  return enqueueMutation((db) => {
    const project: PortfolioProject = {
      ...input,
      id: `proj-${crypto.randomBytes(5).toString('hex')}`,
      createdAt: new Date().toISOString(),
    };
    if (project.featured) {
      db.projects = db.projects.map((p) => ({ ...p, featured: false }));
    }
    db.projects.unshift(project);
    return project;
  });
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<PortfolioProject, 'id' | 'createdAt'>>,
): Promise<PortfolioProject | null> {
  return enqueueMutation((db) => {
    const idx = db.projects.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    if (patch.featured) {
      db.projects = db.projects.map((p) => ({ ...p, featured: false }));
    }
    const updated: PortfolioProject = {
      ...db.projects[idx],
      ...patch,
    };
    db.projects[idx] = updated;
    return updated;
  });
}

export async function deleteProject(id: string): Promise<boolean> {
  return enqueueMutation((db) => {
    const before = db.projects.length;
    db.projects = db.projects.filter((p) => p.id !== id);
    return db.projects.length < before;
  });
}

export async function createContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ContactMessage> {
  return enqueueMutation((db) => {
    const record: ContactMessage = {
      id: `msg-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      status: 'unread',
      createdAt: new Date().toISOString(),
    };
    db.messages.unshift(record);
    return record;
  });
}

export async function getAllMessages(): Promise<ContactMessage[]> {
  const db = await ensureDbFile();
  return db.messages;
}

export async function updateMessageStatus(
  id: string,
  status: MessageStatus,
): Promise<ContactMessage | null> {
  return enqueueMutation((db) => {
    const msg = db.messages.find((m) => m.id === id);
    if (!msg) return null;
    msg.status = status;
    return msg;
  });
}

export async function deleteMessage(id: string): Promise<boolean> {
  return enqueueMutation((db) => {
    const before = db.messages.length;
    db.messages = db.messages.filter((m) => m.id !== id);
    return db.messages.length < before;
  });
}
