import motionReelImg from '@/src/assets/images/portfolio_motion_reel_cover_1794637861770.jpg';
import brandIdentityImg from '@/src/assets/images/portfolio_brand_identity_1794637862883.jpg';
import posterTypographyImg from '@/src/assets/images/portfolio_3d_typography_1794637862897.jpg';
import studioPortraitImg from '@/src/assets/images/designer_studio_portrait_1794637863696.jpg';

export const PRESET_IMAGES: Record<string, { label: string; src: string }> = {
  'preset:motion_reel': {
    label: 'Kinetic 3D Ribbon Frame',
    src: motionReelImg,
  },
  'preset:brand_identity': {
    label: 'Editorial Brand Identity Monograph',
    src: brandIdentityImg,
  },
  'preset:poster_typography': {
    label: 'Geometric Exhibition Poster',
    src: posterTypographyImg,
  },
  'preset:studio_portrait': {
    label: 'Studio Workspace Portrait',
    src: studioPortraitImg,
  },
};

function detectBaseDirUrl(): string {
  if (typeof window === 'undefined') return '/';
  const { origin, pathname } = window.location;
  const cleanedPath = pathname
    .replace(/\/projects\/[^/]*\/?$/, '/')
    .replace(/\/admin\/?$/, '/')
    .replace(/\/index\.html$/, '/');
  const dirPath = cleanedPath.endsWith('/') ? cleanedPath : `${cleanedPath}/`;
  return `${origin}${dirPath}`;
}

const INITIAL_BASE_DIR_URL = detectBaseDirUrl();

export function resolvePublicAsset(assetPath: string | undefined | null): string {
  const raw = (assetPath || '').trim();
  if (!raw) return '';
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  const trimmed = raw.replace(/^\/+/, '');
  if (typeof window !== 'undefined') {
    try {
      return new URL(trimmed, INITIAL_BASE_DIR_URL).href;
    } catch {
      return `/${trimmed}`;
    }
  }
  return `/${trimmed}`;
}

export function resolveMediaUrl(value: string | undefined | null): string {
  if (!value) return motionReelImg;
  if (value in PRESET_IMAGES) {
    return PRESET_IMAGES[value].src;
  }
  return resolvePublicAsset(value);
}

export type ParsedVideo =
  | { kind: 'direct'; src: string }
  | { kind: 'iframe'; src: string }
  | { kind: 'none' };

export function parseVideoSource(rawUrl: string | undefined | null): ParsedVideo {
  const url = (rawUrl || '').trim();
  if (!url) return { kind: 'none' };

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
    return { kind: 'direct', src: url };
  }

  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/,
  );
  if (ytMatch?.[1]) {
    return { kind: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0` };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch?.[1]) {
    return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  // Google Drive file link
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch?.[1]) {
    return { kind: 'iframe', src: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
  }

  return { kind: 'none' };
}
