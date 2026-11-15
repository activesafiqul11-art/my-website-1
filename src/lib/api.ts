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

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'Request failed');
  }
  return data as T;
}

export function fetchPublicPortfolio(): Promise<PublicPortfolioData> {
  return requestJson<PublicPortfolioData>('/api/portfolio');
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

export function fetchAdminSession(): Promise<{ authenticated: boolean; username?: string }> {
  return requestJson('/api/admin/session');
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
