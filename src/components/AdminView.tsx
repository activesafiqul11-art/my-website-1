import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Archive,
  ArrowLeft,
  Check,
  Edit3,
  Lock,
  LogOut,
  Mail,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  createAdminProject,
  deleteAdminMessage,
  deleteAdminProject,
  fetchAdminMessages,
  fetchAdminSession,
  loginAdmin,
  logoutAdmin,
  saveAdminProfile,
  updateAdminMessageStatus,
  updateAdminPassword,
  updateAdminProject,
} from '../lib/api';
import { PRESET_IMAGES } from '../lib/media';
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
  ProjectCategory,
  PublicPortfolioData,
  TestimonialItem,
} from '../types/portfolio';
import { ResilientImage } from './ResilientImage';

interface AdminViewProps {
  portfolio: PublicPortfolioData;
  onPortfolioUpdated: (data: PublicPortfolioData) => void;
  onExitAdmin: () => void;
}

type AdminTab = 'messages' | 'projects' | 'profile' | 'sections' | 'security';

const CATEGORIES: ProjectCategory[] = [
  'Motion Graphics',
  'Brand Identity',
  '3D & Title Design',
  'Social & Marketing',
];

const EMPTY_PROJECT: Omit<PortfolioProject, 'id' | 'createdAt'> = {
  title: '',
  category: 'Motion Graphics',
  year: String(new Date().getFullYear()),
  client: '',
  summary: '',
  goal: '',
  approach: '',
  results: '',
  resultMetrics: [
    { label: 'Visual Retention', percent: 88 },
    { label: 'Delivery Consistency', percent: 95 },
  ],
  deliverables: '',
  coverImage: 'preset:motion_reel',
  mockupType: 'laptop',
  videoUrl: '',
  externalUrl: '',
  featured: false,
};

export function AdminView({ portfolio, onPortfolioUpdated, onExitAdmin }: AdminViewProps) {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('messages');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messageFilter, setMessageFilter] = useState<'all' | MessageStatus>('all');
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [projectDraft, setProjectDraft] = useState<Omit<PortfolioProject, 'id' | 'createdAt'>>(
    EMPTY_PROJECT,
  );
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [savingProject, setSavingProject] = useState(false);

  const [profileDraft, setProfileDraft] = useState<PortfolioProfile>(portfolio.profile);
  const [statsDraft, setStatsDraft] = useState<PortfolioStat[]>(portfolio.stats);
  const [servicesDraft, setServicesDraft] = useState<PortfolioService[]>(portfolio.services);
  const [skillsDraft, setSkillsDraft] = useState<PortfolioSkill[]>(portfolio.skills);
  const [experienceDraft, setExperienceDraft] = useState<ExperienceItem[]>(portfolio.experience);
  const [certsDraft, setCertsDraft] = useState<CertificationItem[]>(portfolio.certifications);
  const [testimonialsDraft, setTestimonialsDraft] = useState<TestimonialItem[]>(
    portfolio.testimonials,
  );
  const [savingAll, setSavingAll] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setProfileDraft(portfolio.profile);
    setStatsDraft(portfolio.stats);
    setServicesDraft(portfolio.services);
    setSkillsDraft(portfolio.skills);
    setExperienceDraft(portfolio.experience);
    setCertsDraft(portfolio.certifications);
    setTestimonialsDraft(portfolio.testimonials);
  }, [portfolio]);

  useEffect(() => {
    let active = true;
    fetchAdminSession()
      .then((res) => {
        if (!active) return;
        setAuthenticated(Boolean(res.authenticated));
      })
      .catch(() => {
        if (active) setAuthenticated(false);
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    setLoadingMessages(true);
    fetchAdminMessages()
      .then((res) => setMessages(res.messages))
      .catch((err) => setErrorBanner(err instanceof Error ? err.message : 'Unable to load messages'))
      .finally(() => setLoadingMessages(false));
  }, [authenticated]);

  function notify(msg: string) {
    setErrorBanner(null);
    setStatusBanner(msg);
    window.setTimeout(() => setStatusBanner(null), 3500);
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      await loginAdmin(usernameInput, passwordInput);
      setAuthenticated(true);
      setPasswordInput('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await logoutAdmin().catch(() => {});
    setAuthenticated(false);
    setMessages([]);
  }

  async function handleSaveAllSections(e?: FormEvent) {
    if (e) e.preventDefault();
    setSavingAll(true);
    setErrorBanner(null);
    try {
      const updated = await saveAdminProfile({
        profile: profileDraft,
        stats: statsDraft,
        services: servicesDraft,
        skills: skillsDraft,
        experience: experienceDraft,
        certifications: certsDraft,
        testimonials: testimonialsDraft,
      });
      onPortfolioUpdated(updated);
      notify('All portfolio changes saved.');
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSavingAll(false);
    }
  }

  function startNewProject() {
    setEditingId(null);
    setProjectDraft({
      ...EMPTY_PROJECT,
      externalUrl: portfolio.profile.portfolioDriveUrl,
    });
    setShowProjectForm(true);
  }

  function startEditProject(proj: PortfolioProject) {
    setEditingId(proj.id);
    setProjectDraft({
      title: proj.title,
      category: proj.category,
      year: proj.year,
      client: proj.client,
      summary: proj.summary,
      goal: proj.goal,
      approach: proj.approach,
      results: proj.results,
      resultMetrics: proj.resultMetrics ?? [],
      deliverables: proj.deliverables,
      coverImage: proj.coverImage,
      mockupType: proj.mockupType ?? 'laptop',
      videoUrl: proj.videoUrl,
      externalUrl: proj.externalUrl,
      featured: proj.featured,
    });
    setShowProjectForm(true);
  }

  function handleFileAsDataUrl(
    e: ChangeEvent<HTMLInputElement>,
    maxMb: number,
    onResult: (dataUrl: string) => void,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) {
      setErrorBanner(`File must be under ${maxMb} MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onResult(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveProject(e: FormEvent) {
    e.preventDefault();
    setSavingProject(true);
    setErrorBanner(null);
    try {
      if (editingId) {
        const updatedProj = await updateAdminProject(editingId, projectDraft);
        const nextProjects = portfolio.projects.map((p) => {
          if (p.id === updatedProj.id) return updatedProj;
          return projectDraft.featured ? { ...p, featured: false } : p;
        });
        onPortfolioUpdated({ ...portfolio, projects: nextProjects });
        notify('Project updated.');
      } else {
        const created = await createAdminProject(projectDraft);
        const existing = projectDraft.featured
          ? portfolio.projects.map((p) => ({ ...p, featured: false }))
          : portfolio.projects;
        onPortfolioUpdated({ ...portfolio, projects: [created, ...existing] });
        notify('New project added.');
      }
      setShowProjectForm(false);
      setEditingId(null);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Unable to save project.');
    } finally {
      setSavingProject(false);
    }
  }

  async function handleDeleteProject(id: string) {
    setErrorBanner(null);
    try {
      await deleteAdminProject(id);
      onPortfolioUpdated({
        ...portfolio,
        projects: portfolio.projects.filter((p) => p.id !== id),
      });
      notify('Project removed.');
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Failed to delete project.');
    }
  }

  async function handleMessageStatus(id: string, status: MessageStatus) {
    try {
      const updated = await updateAdminMessageStatus(id, status);
      setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Unable to update message.');
    }
  }

  async function handleDeleteMessage(id: string) {
    try {
      await deleteAdminMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      notify('Message deleted.');
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Unable to delete message.');
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setErrorBanner(null);
    if (newPassword !== confirmPassword) {
      setErrorBanner('New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await updateAdminPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      notify('Admin password updated.');
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setSavingPassword(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center px-6">
        <p className="text-sm text-[#A1A1AA]">Verifying session...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111115] p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <Lock className="h-4 w-4 text-[#E5A93C]" />
              <h1 className="font-display text-xl font-semibold text-[#F4F4F0]">
                Studio Sign In
              </h1>
            </div>
            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 text-xs text-[#A1A1AA] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Portfolio</span>
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-username" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F4F4F0] focus:border-[#E5A93C] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F4F4F0] focus:border-[#E5A93C] focus:outline-none"
              />
            </div>

            {loginError && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-300"
              >
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full rounded-lg bg-[#E5A93C] px-4 py-2.5 text-xs font-semibold text-[#09090B] hover:bg-[#ebb655] disabled:opacity-60 transition-colors"
            >
              {loggingIn ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const unreadCount = messages.filter((m) => m.status === 'unread').length;
  const filteredMessages =
    messageFilter === 'all' ? messages : messages.filter((m) => m.status === messageFilter);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F4F4F0]">
      <header className="border-b border-white/10 bg-[#0D0D10]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-4">
          <span className="font-display text-lg font-semibold tracking-tight">Studio Admin</span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-xs font-medium text-[#D4D4D8] hover:text-white transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>View Portfolio</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-2 text-xs font-medium text-[#F4F4F0] hover:bg-white/15 transition-colors whitespace-nowrap"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-[#141418] p-1 border border-white/10">
            {[
              { id: 'messages' as const, label: `Messages (${unreadCount} unread)` },
              { id: 'projects' as const, label: `Projects (${portfolio.projects.length})` },
              { id: 'profile' as const, label: 'Profile, 3D & Video' },
              { id: 'sections' as const, label: 'Stats, Skills & Timeline' },
              { id: 'security' as const, label: 'Password' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#E5A93C] text-[#09090B]'
                    : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {statusBanner && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs text-emerald-300">
              <Check className="h-3.5 w-3.5" />
              <span>{statusBanner}</span>
            </div>
          )}
          {errorBanner && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs text-red-300">
              {errorBanner}
            </div>
          )}
        </div>

        {/* TAB 1: MESSAGES */}
        {activeTab === 'messages' && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold">Client Inquiries</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Messages submitted through Get in Touch are stored securely here.
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-[#141418] p-1 border border-white/10">
                {(['all', 'unread', 'read', 'archived'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setMessageFilter(status)}
                    className={`rounded-md px-3 py-1 text-xs capitalize transition-colors ${
                      messageFilter === status
                        ? 'bg-white text-[#09090B] font-medium'
                        : 'text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {loadingMessages ? (
              <p className="text-sm text-[#A1A1AA]">Loading messages...</p>
            ) : filteredMessages.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#111115] p-12 text-center">
                <Mail className="mx-auto h-6 w-6 text-[#52525B] mb-2" />
                <p className="text-sm text-[#A1A1AA]">No messages in this view yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-xl border p-5 transition-colors ${
                      msg.status === 'unread'
                        ? 'border-[#E5A93C]/40 bg-[#151412]'
                        : 'border-white/10 bg-[#111115]'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
                          <span className="font-mono text-[#E5A93C]">{msg.id}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize font-medium text-[#F4F4F0]">
                            Status: {msg.status}
                          </span>
                        </div>
                        <h3 className="mt-2 font-display text-lg font-semibold text-[#F4F4F0]">
                          {msg.subject}
                        </h3>
                        <p className="text-xs text-[#A1A1AA] mt-0.5">
                          From {msg.name} ({msg.email})
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {msg.status !== 'read' && (
                          <button
                            type="button"
                            onClick={() => handleMessageStatus(msg.id, 'read')}
                            className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-[#D4D4D8] hover:text-white"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Mark Read</span>
                          </button>
                        )}
                        {msg.status !== 'archived' && (
                          <button
                            type="button"
                            onClick={() => handleMessageStatus(msg.id, 'archived')}
                            className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-[#D4D4D8] hover:text-white"
                          >
                            <Archive className="h-3.5 w-3.5" />
                            <span>Archive</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          aria-label="Delete message"
                          className="inline-flex items-center justify-center rounded-md border border-red-500/30 p-1.5 text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-[#D4D4D8] whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: PROJECTS */}
        {activeTab === 'projects' && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold">Portfolio Projects</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Manage case studies, 3D device mockup preferences, goals, approaches, and results.
                </p>
              </div>
              <button
                type="button"
                onClick={startNewProject}
                className="inline-flex items-center gap-2 rounded-lg bg-[#E5A93C] px-4 py-2 text-xs font-semibold text-[#09090B] hover:bg-[#ebb655]"
              >
                <Plus className="h-4 w-4" />
                <span>Add Project</span>
              </button>
            </div>

            {showProjectForm && (
              <form
                onSubmit={handleSaveProject}
                className="rounded-2xl border border-[#E5A93C]/40 bg-[#121216] p-6 space-y-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">
                    {editingId ? 'Edit Project' : 'New Project'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowProjectForm(false)}
                    className="text-xs text-[#A1A1AA] hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-[#A1A1AA] mb-1.5">Project Title</label>
                    <input
                      type="text"
                      required
                      value={projectDraft.title}
                      onChange={(e) => setProjectDraft({ ...projectDraft, title: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#A1A1AA] mb-1.5">Category</label>
                    <select
                      value={projectDraft.category}
                      onChange={(e) =>
                        setProjectDraft({
                          ...projectDraft,
                          category: e.target.value as ProjectCategory,
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#A1A1AA] mb-1.5">Client</label>
                    <input
                      type="text"
                      value={projectDraft.client}
                      onChange={(e) => setProjectDraft({ ...projectDraft, client: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#A1A1AA] mb-1.5">Year</label>
                    <input
                      type="text"
                      value={projectDraft.year}
                      onChange={(e) => setProjectDraft({ ...projectDraft, year: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1.5">Summary</label>
                  <textarea
                    rows={2}
                    required
                    value={projectDraft.summary}
                    onChange={(e) => setProjectDraft({ ...projectDraft, summary: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs text-[#A1A1AA] mb-1.5">Goal</label>
                    <textarea
                      rows={3}
                      value={projectDraft.goal}
                      onChange={(e) => setProjectDraft({ ...projectDraft, goal: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#A1A1AA] mb-1.5">Approach</label>
                    <textarea
                      rows={3}
                      value={projectDraft.approach}
                      onChange={(e) =>
                        setProjectDraft({ ...projectDraft, approach: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#A1A1AA] mb-1.5">Results</label>
                    <textarea
                      rows={3}
                      value={projectDraft.results}
                      onChange={(e) =>
                        setProjectDraft({ ...projectDraft, results: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs text-[#A1A1AA] mb-1.5">Deliverables</label>
                    <input
                      type="text"
                      value={projectDraft.deliverables}
                      onChange={(e) =>
                        setProjectDraft({ ...projectDraft, deliverables: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#A1A1AA] mb-1.5">3D Detail Mockup</label>
                    <select
                      value={projectDraft.mockupType}
                      onChange={(e) =>
                        setProjectDraft({
                          ...projectDraft,
                          mockupType: e.target.value === 'phone' ? 'phone' : 'laptop',
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                    >
                      <option value="laptop">3D Laptop Mockup</option>
                      <option value="phone">3D Phone Mockup</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#A1A1AA] mb-1.5">
                      External / Drive Link
                    </label>
                    <input
                      type="url"
                      value={projectDraft.externalUrl}
                      onChange={(e) =>
                        setProjectDraft({ ...projectDraft, externalUrl: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-[#A1A1AA] mb-1.5">
                      Cover Image (Preset, URL, or Upload)
                    </label>
                    <div className="space-y-2">
                      <select
                        value={
                          projectDraft.coverImage in PRESET_IMAGES
                            ? projectDraft.coverImage
                            : 'custom'
                        }
                        onChange={(e) => {
                          if (e.target.value !== 'custom') {
                            setProjectDraft({ ...projectDraft, coverImage: e.target.value });
                          }
                        }}
                        className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                      >
                        {Object.entries(PRESET_IMAGES).map(([key, item]) => (
                          <option key={key} value={key}>
                            {item.label}
                          </option>
                        ))}
                        <option value="custom">Custom URL / Uploaded Image</option>
                      </select>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={projectDraft.coverImage}
                          onChange={(e) =>
                            setProjectDraft({ ...projectDraft, coverImage: e.target.value })
                          }
                          className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-xs"
                        />
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-[#D4D4D8] hover:text-white whitespace-nowrap shrink-0">
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileAsDataUrl(e, 3, (url) =>
                                setProjectDraft({ ...projectDraft, coverImage: url }),
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#A1A1AA] mb-1.5">
                      Video / Reel URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={projectDraft.videoUrl}
                      onChange={(e) =>
                        setProjectDraft({ ...projectDraft, videoUrl: e.target.value })
                      }
                      placeholder="https://..."
                      className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2.5 text-xs text-[#D4D4D8] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={projectDraft.featured}
                    onChange={(e) =>
                      setProjectDraft({ ...projectDraft, featured: e.target.checked })
                    }
                    className="h-4 w-4 accent-[#E5A93C]"
                  />
                  <span>Feature as lead Bento showcase item</span>
                </label>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowProjectForm(false)}
                    className="rounded-lg border border-white/15 px-4 py-2 text-xs text-[#D4D4D8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProject}
                    className="rounded-lg bg-[#E5A93C] px-5 py-2 text-xs font-semibold text-[#09090B] disabled:opacity-60"
                  >
                    {savingProject ? 'Saving...' : editingId ? 'Update Project' : 'Create Project'}
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {portfolio.projects.map((project) => (
                <div
                  key={project.id}
                  className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#111115] overflow-hidden"
                >
                  <div className="aspect-[16/9] w-full bg-[#09090B] overflow-hidden">
                    <ResilientImage
                      src={project.coverImage}
                      alt={project.title}
                      fallbackTitle={project.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                        <span className="text-[#E5A93C]">{project.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{project.year}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{project.mockupType} 3D</span>
                      </div>
                      <h3 className="mt-1.5 font-display text-lg font-semibold">{project.title}</h3>
                      <p className="mt-1.5 text-xs text-[#A1A1AA] line-clamp-2">{project.summary}</p>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => startEditProject(project)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs text-[#D4D4D8] hover:text-white"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(project.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: PROFILE, 3D WORDMARK & SCRUB VIDEO */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveAllSections} className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold">Profile, 3D Hero &amp; Scrub Video</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  All public sections load dynamically from this database configuration.
                </p>
              </div>
              <button
                type="submit"
                disabled={savingAll}
                className="rounded-lg bg-[#E5A93C] px-5 py-2.5 text-xs font-semibold text-[#09090B] hover:bg-[#ebb655] disabled:opacity-60"
              >
                {savingAll ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111115] p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold">Identity &amp; 3D Stage</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileDraft.name}
                    onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1.5">
                    Hero Extruded 3D Gold Wordmark
                  </label>
                  <input
                    type="text"
                    required
                    value={profileDraft.hero3DWordmark}
                    onChange={(e) =>
                      setProfileDraft({ ...profileDraft, hero3DWordmark: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1.5">Role / Title</label>
                  <input
                    type="text"
                    value={profileDraft.role}
                    onChange={(e) => setProfileDraft({ ...profileDraft, role: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1.5">Location</label>
                  <input
                    type="text"
                    value={profileDraft.location}
                    onChange={(e) =>
                      setProfileDraft({ ...profileDraft, location: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1.5">Phone</label>
                  <input
                    type="text"
                    value={profileDraft.phone}
                    onChange={(e) => setProfileDraft({ ...profileDraft, phone: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1.5">Email</label>
                  <input
                    type="email"
                    value={profileDraft.email}
                    onChange={(e) => setProfileDraft({ ...profileDraft, email: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-[#A1A1AA] mb-1.5">
                    Google Drive Portfolio URL
                  </label>
                  <input
                    type="url"
                    value={profileDraft.portfolioDriveUrl}
                    onChange={(e) =>
                      setProfileDraft({ ...profileDraft, portfolioDriveUrl: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111115] p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold">
                Hero, Scroll-Reveal &amp; Scrubbed Video
              </h3>
              <div>
                <label className="block text-xs text-[#A1A1AA] mb-1.5">Hero Headline</label>
                <input
                  type="text"
                  value={profileDraft.heroHeadline}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, heroHeadline: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A1A1AA] mb-1.5">Hero Subheadline</label>
                <textarea
                  rows={2}
                  value={profileDraft.heroSubheadline}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, heroSubheadline: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A1A1AA] mb-1.5">
                  Large Outlined Scroll-Fill Statement
                </label>
                <input
                  type="text"
                  value={profileDraft.scrollFillStatement}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, scrollFillStatement: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A1A1AA] mb-1.5">
                  About Scroll-Reveal Paragraph
                </label>
                <textarea
                  rows={3}
                  value={profileDraft.aboutLeadParagraph}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, aboutLeadParagraph: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A1A1AA] mb-1.5">About Bio</label>
                <textarea
                  rows={3}
                  value={profileDraft.aboutBio}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, aboutBio: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1.5">
                    Scroll-Scrubbed MP4 Video URL (or Upload MP4 up to 10MB)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={profileDraft.scrubVideoUrl}
                      onChange={(e) =>
                        setProfileDraft({ ...profileDraft, scrubVideoUrl: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-xs"
                    />
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-[#D4D4D8] hover:text-white whitespace-nowrap shrink-0">
                      <Upload className="h-3.5 w-3.5" />
                      <span>MP4</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        className="hidden"
                        onChange={(e) =>
                          handleFileAsDataUrl(e, 10, (url) =>
                            setProfileDraft({ ...profileDraft, scrubVideoUrl: url }),
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1.5">
                    Designer Portrait Image
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={profileDraft.portraitImage}
                      onChange={(e) =>
                        setProfileDraft({ ...profileDraft, portraitImage: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-xs"
                    />
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-[#D4D4D8] hover:text-white whitespace-nowrap shrink-0">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileAsDataUrl(e, 3, (url) =>
                            setProfileDraft({ ...profileDraft, portraitImage: url }),
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 4: STATS, SKILLS, SERVICES, EXPERIENCE, CERTS & TESTIMONIALS */}
        {activeTab === 'sections' && (
          <form onSubmit={handleSaveAllSections} className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold">
                  Stats, Services, Skills, Experience &amp; Proof
                </h2>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Edit numbers, suffixes (+, %, K), services, skills, timeline, certifications, and testimonials.
                </p>
              </div>
              <button
                type="submit"
                disabled={savingAll}
                className="rounded-lg bg-[#E5A93C] px-5 py-2.5 text-xs font-semibold text-[#09090B] hover:bg-[#ebb655] disabled:opacity-60"
              >
                {savingAll ? 'Saving...' : 'Save All Sections'}
              </button>
            </div>

            {/* Stats */}
            <div className="rounded-2xl border border-white/10 bg-[#111115] p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold">Odometer Stats (Number, Suffix, Label)</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {statsDraft.map((st, idx) => (
                  <div key={st.id} className="rounded-xl border border-white/10 bg-[#09090B] p-4 space-y-2.5">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={st.number}
                        onChange={(e) => {
                          const next = [...statsDraft];
                          next[idx] = { ...st, number: Number(e.target.value) || 0 };
                          setStatsDraft(next);
                        }}
                        placeholder="Number"
                        className="rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-sm font-mono"
                      />
                      <input
                        type="text"
                        value={st.suffix}
                        onChange={(e) => {
                          const next = [...statsDraft];
                          next[idx] = { ...st, suffix: e.target.value };
                          setStatsDraft(next);
                        }}
                        placeholder="Suffix (+, %, K)"
                        className="rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-sm font-mono"
                      />
                      <input
                        type="text"
                        value={st.label}
                        onChange={(e) => {
                          const next = [...statsDraft];
                          next[idx] = { ...st, label: e.target.value };
                          setStatsDraft(next);
                        }}
                        placeholder="Label"
                        className="rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-sm"
                      />
                    </div>
                    <input
                      type="text"
                      value={st.detail}
                      onChange={(e) => {
                        const next = [...statsDraft];
                        next[idx] = { ...st, detail: e.target.value };
                        setStatsDraft(next);
                      }}
                      placeholder="Short context"
                      className="w-full rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-xs text-[#A1A1AA]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="rounded-2xl border border-white/10 bg-[#111115] p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold">Services</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {servicesDraft.map((srv, idx) => (
                  <div key={srv.id} className="rounded-xl border border-white/10 bg-[#09090B] p-4 space-y-2.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={srv.number}
                        onChange={(e) => {
                          const next = [...servicesDraft];
                          next[idx] = { ...srv, number: e.target.value };
                          setServicesDraft(next);
                        }}
                        className="w-16 rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-xs font-mono"
                      />
                      <input
                        type="text"
                        value={srv.title}
                        onChange={(e) => {
                          const next = [...servicesDraft];
                          next[idx] = { ...srv, title: e.target.value };
                          setServicesDraft(next);
                        }}
                        className="flex-1 rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-sm font-medium"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={srv.description}
                      onChange={(e) => {
                        const next = [...servicesDraft];
                        next[idx] = { ...srv, description: e.target.value };
                        setServicesDraft(next);
                      }}
                      className="w-full rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      value={srv.deliverables}
                      onChange={(e) => {
                        const next = [...servicesDraft];
                        next[idx] = { ...srv, deliverables: e.target.value };
                        setServicesDraft(next);
                      }}
                      className="w-full rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-xs text-[#A1A1AA]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="rounded-2xl border border-white/10 bg-[#111115] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Skills &amp; Progress Rings</h3>
                <button
                  type="button"
                  onClick={() =>
                    setSkillsDraft([
                      ...skillsDraft,
                      { id: `sk-${Date.now()}`, name: 'New Skill', category: 'Craft', level: 85 },
                    ])
                  }
                  className="text-xs text-[#E5A93C] hover:underline"
                >
                  + Add Skill
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {skillsDraft.map((sk, idx) => (
                  <div key={sk.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#09090B] p-3">
                    <input
                      type="text"
                      value={sk.name}
                      onChange={(e) => {
                        const next = [...skillsDraft];
                        next[idx] = { ...sk, name: e.target.value };
                        setSkillsDraft(next);
                      }}
                      className="flex-1 rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      value={sk.category}
                      onChange={(e) => {
                        const next = [...skillsDraft];
                        next[idx] = { ...sk, category: e.target.value };
                        setSkillsDraft(next);
                      }}
                      className="w-24 rounded border border-white/10 bg-[#121216] px-2 py-1.5 text-xs"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={sk.level}
                      onChange={(e) => {
                        const next = [...skillsDraft];
                        next[idx] = { ...sk, level: Math.max(0, Math.min(100, Number(e.target.value) || 0)) };
                        setSkillsDraft(next);
                      }}
                      className="w-16 rounded border border-white/10 bg-[#121216] px-2 py-1.5 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setSkillsDraft(skillsDraft.filter((item) => item.id !== sk.id))}
                      className="p-1.5 text-red-300 hover:bg-red-500/10 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Experience Timeline */}
            <div className="rounded-2xl border border-white/10 bg-[#111115] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Experience Timeline</h3>
                <button
                  type="button"
                  onClick={() =>
                    setExperienceDraft([
                      ...experienceDraft,
                      {
                        id: `exp-${Date.now()}`,
                        period: '2026',
                        role: 'Role',
                        organization: 'Organization',
                        location: 'Bangladesh',
                        summary: 'Summary',
                      },
                    ])
                  }
                  className="text-xs text-[#E5A93C] hover:underline"
                >
                  + Add Milestone
                </button>
              </div>
              <div className="space-y-3">
                {experienceDraft.map((ex, idx) => (
                  <div key={ex.id} className="rounded-xl border border-white/10 bg-[#09090B] p-4 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        type="text"
                        value={ex.period}
                        onChange={(e) => {
                          const next = [...experienceDraft];
                          next[idx] = { ...ex, period: e.target.value };
                          setExperienceDraft(next);
                        }}
                        className="rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-xs font-mono"
                      />
                      <input
                        type="text"
                        value={ex.role}
                        onChange={(e) => {
                          const next = [...experienceDraft];
                          next[idx] = { ...ex, role: e.target.value };
                          setExperienceDraft(next);
                        }}
                        className="rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        value={ex.organization}
                        onChange={(e) => {
                          const next = [...experienceDraft];
                          next[idx] = { ...ex, organization: e.target.value };
                          setExperienceDraft(next);
                        }}
                        className="rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-xs"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ex.location}
                          onChange={(e) => {
                            const next = [...experienceDraft];
                            next[idx] = { ...ex, location: e.target.value };
                            setExperienceDraft(next);
                          }}
                          className="flex-1 rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setExperienceDraft(experienceDraft.filter((item) => item.id !== ex.id))
                          }
                          className="p-1.5 text-red-300 hover:bg-red-500/10 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={ex.summary}
                      onChange={(e) => {
                        const next = [...experienceDraft];
                        next[idx] = { ...ex, summary: e.target.value };
                        setExperienceDraft(next);
                      }}
                      className="w-full rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications & Testimonials */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#111115] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">Certifications</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setCertsDraft([
                        ...certsDraft,
                        {
                          id: `cert-${Date.now()}`,
                          title: 'Certification Title',
                          issuer: 'Issuer',
                          year: '2026',
                          credentialUrl: '',
                        },
                      ])
                    }
                    className="text-xs text-[#E5A93C] hover:underline"
                  >
                    + Add
                  </button>
                </div>
                {certsDraft.map((cert, idx) => (
                  <div key={cert.id} className="rounded-xl border border-white/10 bg-[#09090B] p-3.5 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cert.title}
                        onChange={(e) => {
                          const next = [...certsDraft];
                          next[idx] = { ...cert, title: e.target.value };
                          setCertsDraft(next);
                        }}
                        className="flex-1 rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setCertsDraft(certsDraft.filter((c) => c.id !== cert.id))}
                        className="p-1.5 text-red-300 hover:bg-red-500/10 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) => {
                          const next = [...certsDraft];
                          next[idx] = { ...cert, issuer: e.target.value };
                          setCertsDraft(next);
                        }}
                        className="rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        value={cert.year}
                        onChange={(e) => {
                          const next = [...certsDraft];
                          next[idx] = { ...cert, year: e.target.value };
                          setCertsDraft(next);
                        }}
                        className="rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#111115] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">Testimonials</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setTestimonialsDraft([
                        ...testimonialsDraft,
                        {
                          id: `test-${Date.now()}`,
                          name: 'Client Name',
                          role: 'Role',
                          organization: 'Company',
                          quote: 'Feedback quote',
                          outcome: 'Measured outcome',
                        },
                      ])
                    }
                    className="text-xs text-[#E5A93C] hover:underline"
                  >
                    + Add
                  </button>
                </div>
                {testimonialsDraft.map((t, idx) => (
                  <div key={t.id} className="rounded-xl border border-white/10 bg-[#09090B] p-3.5 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={t.name}
                        onChange={(e) => {
                          const next = [...testimonialsDraft];
                          next[idx] = { ...t, name: e.target.value };
                          setTestimonialsDraft(next);
                        }}
                        className="rounded border border-white/10 bg-[#121216] px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        value={t.role}
                        onChange={(e) => {
                          const next = [...testimonialsDraft];
                          next[idx] = { ...t, role: e.target.value };
                          setTestimonialsDraft(next);
                        }}
                        className="rounded border border-white/10 bg-[#121216] px-2 py-1 text-xs"
                      />
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={t.organization}
                          onChange={(e) => {
                            const next = [...testimonialsDraft];
                            next[idx] = { ...t, organization: e.target.value };
                            setTestimonialsDraft(next);
                          }}
                          className="flex-1 rounded border border-white/10 bg-[#121216] px-2 py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setTestimonialsDraft(testimonialsDraft.filter((item) => item.id !== t.id))
                          }
                          className="p-1 text-red-300 hover:bg-red-500/10 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={t.quote}
                      onChange={(e) => {
                        const next = [...testimonialsDraft];
                        next[idx] = { ...t, quote: e.target.value };
                        setTestimonialsDraft(next);
                      }}
                      className="w-full rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      value={t.outcome}
                      onChange={(e) => {
                        const next = [...testimonialsDraft];
                        next[idx] = { ...t, outcome: e.target.value };
                        setTestimonialsDraft(next);
                      }}
                      placeholder="Outcome"
                      className="w-full rounded border border-white/10 bg-[#121216] px-2.5 py-1.5 text-xs text-[#E5A93C]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* TAB 5: PASSWORD */}
        {activeTab === 'security' && (
          <form
            onSubmit={handleChangePassword}
            className="max-w-lg rounded-2xl border border-white/10 bg-[#111115] p-6 space-y-4"
          >
            <h2 className="font-display text-xl font-semibold">Update Admin Password</h2>
            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1.5">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1.5">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1.5">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={savingPassword}
              className="rounded-lg bg-[#E5A93C] px-5 py-2.5 text-xs font-semibold text-[#09090B] hover:bg-[#ebb655] disabled:opacity-60"
            >
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
