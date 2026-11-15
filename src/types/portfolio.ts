export type ProjectCategory =
  | 'Motion Graphics'
  | 'Brand Identity'
  | '3D & Title Design'
  | 'Social & Marketing';

export interface PortfolioStat {
  id: string;
  number: number;
  suffix: string;
  label: string;
  detail: string;
}

export interface PortfolioService {
  id: string;
  number: string;
  title: string;
  description: string;
  deliverables: string;
}

export interface PortfolioSkill {
  id: string;
  name: string;
  category: string;
  level: number;
}

export interface ExperienceItem {
  id: string;
  period: string;
  role: string;
  organization: string;
  location: string;
  summary: string;
}

export interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  year: string;
  credentialUrl: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  organization: string;
  quote: string;
  outcome: string;
}

export interface ProjectResultMetric {
  label: string;
  percent: number;
}

export interface PortfolioProfile {
  name: string;
  hero3DWordmark: string;
  role: string;
  location: string;
  phone: string;
  email: string;
  portfolioDriveUrl: string;
  availability: string;
  heroHeadline: string;
  heroSubheadline: string;
  aboutHeading: string;
  aboutLeadParagraph: string;
  aboutBio: string;
  scrollFillStatement: string;
  portraitImage: string;
  scrubVideoUrl: string;
  scrubVideoPoster: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  category: ProjectCategory;
  year: string;
  client: string;
  summary: string;
  goal: string;
  approach: string;
  results: string;
  resultMetrics: ProjectResultMetric[];
  deliverables: string;
  coverImage: string;
  mockupType: 'laptop' | 'phone';
  videoUrl: string;
  externalUrl: string;
  featured: boolean;
  createdAt: string;
}

export interface PublicPortfolioData {
  profile: PortfolioProfile;
  stats: PortfolioStat[];
  services: PortfolioService[];
  skills: PortfolioSkill[];
  experience: ExperienceItem[];
  projects: PortfolioProject[];
  certifications: CertificationItem[];
  testimonials: TestimonialItem[];
}

export type MessageStatus = 'unread' | 'read' | 'archived';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: MessageStatus;
  createdAt: string;
}
