import { useState } from 'react';
import { Film } from 'lucide-react';
import { resolveMediaUrl } from '../lib/media';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: ResilientImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveMediaUrl(src);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#17171B] via-[#111114] to-[#0C0C0E] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Film className="h-7 w-7 text-[#E5A93C]/70 mb-2" strokeWidth={1.5} />
        <span className="text-xs font-medium text-[#A1A1AA] line-clamp-2 max-w-[22ch]">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
