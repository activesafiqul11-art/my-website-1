import { PUBLIC_PORTFOLIO_FALLBACK } from '../data/defaultPortfolio';
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
} from '../types/portfolio';

let staticHostMode = false;

export function isStaticHostMode(): boolean {
  return staticHostMode;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (res.status === 404 || res.status === 405) {
      staticHostMode = true;
    }
    throw new Error('Backend API is not available in static hosting mode.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'Request failed');
  }
  return data as T;
}

export async function fetchPublicPortfolio(): Promise<PublicPortfolioData> {
  try {
    const res = await fetch('/api/portfolio', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      staticHostMode = true;
      return structuredClone(PUBLIC_PORTFOLIO_FALLBACK);
    }
    const data = (await res.json()) as PublicPortfolioData;
    if (!data?.profile || !Array.isArray(data?.projects)) {
      staticHostMode = true;
      return structuredClone(PUBLIC_PORTFOLIO_FALLBACK);
    }
    staticHostMode = false;
    return data;
  } catch {
    staticHostMode = true;
    return structuredClone(PUBLIC_PORTFOLIO_FALLBACK);
  }
}

export function submitContactInquiry(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
}): Promise<{ ok: boolean }> {
  return requestJson('/api/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminSession(): Promise<{
  authenticated: boolean;
  username?: string;
  staticHost?: boolean;
}> {
  if (staticHostMode) {
    return { authenticated: false, staticHost: true };
  }
  try {
    return await requestJson('/api/admin/session');
  } catch {
    if (staticHostMode) {
      return { authenticated: false, staticHost: true };
    }
    return { authenticated: false };
  }
}

export function loginAdmin(
  username: string,
  password: string,
): Promise<{ authenticated: boolean; username: string }> {
  return requestJson('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function logoutAdmin(): Promise<{ ok: boolean }> {
  return requestJson('/api/admin/logout', {
    method: 'POST',
  });
}

export function updateAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean }> {
  return requestJson('/api/admin/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function saveAdminProfile(payload: {
  profile: PortfolioProfile;
  stats: PortfolioStat[];
  services: PortfolioService[];
  skills: PortfolioSkill[];
  experience: ExperienceItem[];
  certifications: CertificationItem[];
  testimonials: TestimonialItem[];
}): Promise<PublicPortfolioData> {
  return requestJson('/api/admin/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function createAdminProject(
  project: Omit<PortfolioProject, 'id' | 'createdAt'>,
): Promise<PortfolioProject> {
  return requestJson('/api/admin/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  });
}

export function updateAdminProject(
  id: string,
  project: Partial<Omit<PortfolioProject, 'id' | 'createdAt'>>,
): Promise<PortfolioProject> {
  return requestJson(`/api/admin/projects/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(project),
  });
}

export function deleteAdminProject(id: string): Promise<{ ok: boolean }> {
  return requestJson(`/api/admin/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function fetchAdminMessages(): Promise<{ messages: ContactMessage[] }> {
  return requestJson('/api/admin/messages');
}

export function updateAdminMessageStatus(
  id: string,
  status: MessageStatus,
): Promise<ContactMessage> {
  return requestJson(`/api/admin/messages/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function deleteAdminMessage(id: string): Promise<{ ok: boolean }> {
  return requestJson(`/api/admin/messages/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
