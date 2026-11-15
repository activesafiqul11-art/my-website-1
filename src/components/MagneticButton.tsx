import { useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

interface MagneticButtonProps {
  label: string;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  arrowType?: 'right' | 'up-right' | 'none';
  cursorLabel?: string;
  className?: string;
  children?: ReactNode;
}

export function MagneticButton({
  label,
  href,
  target,
  rel,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'primary',
  arrowType = 'right',
  cursorLabel = 'Open',
  className = '',
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    setOffset({
      x: Math.max(-12, Math.min(12, dx * 0.22)),
      y: Math.max(-10, Math.min(10, dy * 0.22)),
    });
  };

  const handlePointerLeave = () => {
    setHovered(false);
    setOffset({ x: 0, y: 0 });
  };

  const isPrimary = variant === 'primary';
  const baseClasses = `group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-lg px-5 py-3 text-xs font-semibold transition-transform duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B] whitespace-nowrap shrink-0 ${
    isPrimary
      ? 'bg-[#F4F4F0] text-[#09090B]'
      : 'border border-white/15 bg-[#121216] text-[#F4F4F0]'
  } ${disabled ? 'opacity-60 pointer-events-none' : ''} ${className}`;

  const ArrowIcon = arrowType === 'up-right' ? ArrowUpRight : ArrowRight;

  const innerContent = (
    <>
      {/* Gold Clip-Path Fill Sweep */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#E5A93C] transition-[clip-path] duration-300"
        style={{
          clipPath: hovered ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* Rolling Dual-Label Text */}
      <span className="relative z-10 h-4 overflow-hidden inline-flex flex-col justify-start">
        <span
          className={`block leading-4 transition-transform duration-300 ${
            hovered ? '-translate-y-full' : 'translate-y-0'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {label}
        </span>
        <span
          aria-hidden="true"
          className={`block leading-4 text-[#09090B] transition-transform duration-300 ${
            hovered ? '-translate-y-full' : 'translate-y-0'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {label}
        </span>
      </span>

      {/* Sliding Dual Arrow Icon */}
      {arrowType !== 'none' && (
        <span className="relative z-10 h-3.5 w-3.5 overflow-hidden inline-flex items-center justify-center">
          <ArrowIcon
            className={`h-3.5 w-3.5 absolute transition-transform duration-300 ${
              hovered ? 'translate-x-4 opacity-0' : 'translate-x-0 opacity-100'
            }`}
          />
          <ArrowIcon
            className={`h-3.5 w-3.5 absolute text-[#09090B] transition-transform duration-300 ${
              hovered ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
            }`}
          />
        </span>
      )}
    </>
  );

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={handlePointerLeave}
      className="inline-block will-change-transform"
      style={{
        transform: `translate3d(${offset.x.toFixed(1)}px, ${offset.y.toFixed(1)}px, 0)`,
        transition: hovered
          ? 'transform 100ms ease-out'
          : 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {href ? (
        <a
          href={href}
          target={target}
          rel={rel}
          data-cursor={cursorLabel}
          className={baseClasses}
        >
          {innerContent}
        </a>
      ) : (
        <button
          type={type}
          onClick={onClick}
          disabled={disabled}
          data-cursor={cursorLabel}
          className={baseClasses}
        >
          {innerContent}
        </button>
      )}
    </div>
  );
}
