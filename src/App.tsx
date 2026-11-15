import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, RotateCcw } from 'lucide-react';
import { fetchPublicPortfolio, isStaticHostMode } from './lib/api';
import type { PortfolioProject, ProjectCategory, PublicPortfolioData } from './types/portfolio';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CustomCursor } from './components/CustomCursor';
import { MagneticButton } from './components/MagneticButton';
import {
  KineticHeroHeadline,
  ScrollFillText,
  ScrollRevealParagraph,
  SectionHeading,
  VelocityMarquee,
} from './components/TypographyEffects';
import { OdometerStatCard, SkillProgressRing } from './components/NumberEffects';
import { ScrollVideoScrubSection } from './components/ScrollVideoScrubSection';
import { TiltProjectCard } from './components/TiltProjectCard';
import { ProjectDetailPage } from './components/ProjectDetailPage';
import { ContactSection } from './components/ContactSection';
import { ResilientImage } from './components/ResilientImage';
import { AdminView } from './components/AdminView';

gsap.registerPlugin(ScrollTrigger);

const HeroSceneR3F = lazy(() => import('./components/HeroSceneR3F'));

const FILTER_OPTIONS: ('All' | ProjectCategory)[] = [
  'All',
  'Motion Graphics',
  'Brand Identity',
  '3D & Title Design',
  'Social & Marketing',
];

function parseRoute(pathname: string, hash = ''): {
  mode: 'home' | 'admin' | 'project';
  projectId: string | null;
} {
  const hashRoute = hash.replace(/^#/, '');
  if (hashRoute.startsWith('/admin') || pathname.endsWith('/admin') || pathname === '/admin') {
    return { mode: 'admin', projectId: null };
  }
  const hashProj = hashRoute.match(/^\/projects\/([^/]+)/);
  if (hashProj?.[1]) {
    return { mode: 'project', projectId: decodeURIComponent(hashProj[1]) };
  }
  const projMatch = pathname.match(/\/projects\/([^/]+)/);
  if (projMatch?.[1]) {
    return { mode: 'project', projectId: decodeURIComponent(projMatch[1]) };
  }
  return { mode: 'home', projectId: null };
}

export default function App() {
  const [route, setRoute] = useState(() =>
    typeof window !== 'undefined'
      ? parseRoute(window.location.pathname, window.location.hash)
      : { mode: 'home' as const, projectId: null },
  );

  const [portfolio, setPortfolio] = useState<PublicPortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<'All' | ProjectCategory>('All');
  const [projectBuildKey, setProjectBuildKey] = useState(0);
  const [globalScrollProgress, setGlobalScrollProgress] = useState(0);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const onRouteChange = () => {
      setRoute(parseRoute(window.location.pathname, window.location.hash));
    };
    window.addEventListener('popstate', onRouteChange);
    window.addEventListener('hashchange', onRouteChange);
    return () => {
      window.removeEventListener('popstate', onRouteChange);
      window.removeEventListener('hashchange', onRouteChange);
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchPublicPortfolio()
      .then((data) => {
        if (active) setPortfolio(data);
      })
      .catch((err) => {
        if (active) setLoadError(err instanceof Error ? err.message : 'Unable to load portfolio');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Lenis smooth scrolling + GSAP ScrollTrigger sync + global scroll progress for 3D camera path
  useEffect(() => {
    if (route.mode !== 'home' || loading) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const onWindowScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const p = docHeight > 0 ? Math.max(0, Math.min(1, window.scrollY / docHeight)) : 0;
      setGlobalScrollProgress(p);
    };
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    onWindowScroll();

    if (reduced) {
      return () => window.removeEventListener('scroll', onWindowScroll);
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      window.removeEventListener('scroll', onWindowScroll);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [route.mode, loading]);

  function navigateTo(path: string) {
    if (isStaticHostMode()) {
      const nextHash = path === '/' ? '#/' : `#${path}`;
      if (window.location.hash !== nextHash) {
        window.location.hash = nextHash;
      }
      setRoute(parseRoute(window.location.pathname, nextHash));
    } else {
      if (window.location.pathname !== path || window.location.hash) {
        window.history.pushState({}, '', path);
      }
      setRoute(parseRoute(path, ''));
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  const filteredProjects = useMemo(() => {
    if (!portfolio) return [];
    if (selectedCategory === 'All') return portfolio.projects;
    return portfolio.projects.filter((p) => p.category === selectedCategory);
  }, [portfolio, selectedCategory]);

  const activeProjectDetail: PortfolioProject | null = useMemo(() => {
    if (route.mode !== 'project' || !route.projectId || !portfolio) return null;
    return portfolio.projects.find((p) => p.id === route.projectId) ?? null;
  }, [route, portfolio]);

  const marqueeItems = useMemo(() => {
    if (!portfolio) return [];
    return [
      ...portfolio.services.map((s) => s.title),
      ...portfolio.skills.map((s) => s.name),
    ];
  }, [portfolio]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center px-6">
        <p className="font-mono text-xs tracking-wide text-[#A1A1AA]">Loading portfolio...</p>
      </div>
    );
  }

  if (loadError || !portfolio) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center px-6 text-center space-y-4">
        <p className="text-sm text-red-300">{loadError || 'Portfolio could not be loaded.'}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-[#E5A93C] px-4 py-2 text-xs font-semibold text-[#09090B]"
        >
          Reload
        </button>
      </div>
    );
  }

  if (route.mode === 'admin') {
    return (
      <MotionConfig reducedMotion="user">
        <AdminView
          portfolio={portfolio}
          onPortfolioUpdated={(next) => setPortfolio(next)}
          onExitAdmin={() => navigateTo('/')}
        />
      </MotionConfig>
    );
  }

  const { profile, stats, services, skills, experience, certifications, testimonials } = portfolio;

  return (
    <MotionConfig reducedMotion="user">
      <CustomCursor />

      <AnimatePresence mode="wait">
        {route.mode === 'project' && activeProjectDetail ? (
          <ProjectDetailPage
            key={activeProjectDetail.id}
            project={activeProjectDetail}
            onBack={() => navigateTo('/')}
          />
        ) : (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="min-h-screen bg-[#09090B] text-[#F4F4F0]"
          >
            {/* Top Bar Contract: 3 Zones (Wordmark — 4 Links — 1 Primary CTA) */}
            <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09090B]/95">
              <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-6 py-4">
                <a
                  href="#top"
                  className="font-display var-weight-hover text-base sm:text-lg tracking-tight text-[#F4F4F0] whitespace-nowrap shrink-0"
                >
                  {profile.name}
                </a>

                <nav
                  aria-label="Primary navigation"
                  className="hidden md:flex items-center gap-7 text-sm text-[#A1A1AA]"
                >
                  <a
                    href="#services"
                    className="var-weight-hover hover:text-[#F4F4F0] whitespace-nowrap shrink-0"
                  >
                    Services
                  </a>
                  <a
                    href="#skills"
                    className="var-weight-hover hover:text-[#F4F4F0] whitespace-nowrap shrink-0"
                  >
                    Skills
                  </a>
                  <a
                    href="#works"
                    className="var-weight-hover hover:text-[#F4F4F0] whitespace-nowrap shrink-0"
                  >
                    Projects
                  </a>
                  <a
                    href="#about"
                    className="var-weight-hover hover:text-[#F4F4F0] whitespace-nowrap shrink-0"
                  >
                    About
                  </a>
                </nav>

                <div className="flex items-center shrink-0">
                  <MagneticButton
                    label="Start a Project"
                    href="#contact"
                    cursorLabel="Contact"
                    arrowType="right"
                  />
                </div>
              </div>
            </header>

            <main id="top">
              {/* HERO SECTION + R3F 3D SCENE */}
              <section className="py-12 lg:py-20">
                <div className="mx-auto max-w-[1200px] px-6">
                  <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch">
                    <div className="lg:col-span-5 flex flex-col justify-between py-2">
                      <div className="space-y-6">
                        <p className="text-xs font-medium tracking-wide text-[#E5A93C]">
                          {profile.role} · {profile.location}
                        </p>

                        <KineticHeroHeadline
                          text={profile.heroHeadline}
                          className="text-4xl font-semibold leading-[1.08] tracking-tight text-[#F4F4F0] sm:text-5xl"
                        />

                        <p className="text-base leading-relaxed text-[#A1A1AA] max-w-[52ch]">
                          {profile.heroSubheadline}
                        </p>
                      </div>

                      <div className="mt-10 flex flex-wrap items-center gap-4">
                        <MagneticButton
                          label="Explore Projects"
                          href="#works"
                          cursorLabel="Explore"
                          arrowType="right"
                        />

                        {profile.portfolioDriveUrl && (
                          <MagneticButton
                            label="Drive Archive"
                            href={profile.portfolioDriveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="secondary"
                            arrowType="up-right"
                            cursorLabel="Open"
                          />
                        )}
                      </div>
                    </div>

                    {/* Lazy-Loaded R3F 3D Scene */}
                    <div className="lg:col-span-7 min-h-[380px] sm:min-h-[450px] lg:min-h-[500px]">
                      <ErrorBoundary
                        fallback={
                          <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0D0D10]">
                            <ResilientImage
                              src={profile.scrubVideoPoster}
                              alt={profile.hero3DWordmark}
                              fallbackTitle={profile.hero3DWordmark}
                              className="h-full w-full object-cover opacity-85"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-transparent to-transparent" />
                            <div className="absolute bottom-5 left-5">
                              <div className="text-xs font-mono text-[#E5A93C]">3D STUDIO REEL</div>
                              <div className="font-display text-2xl font-semibold text-[#F4F4F0]">
                                {profile.hero3DWordmark}
                              </div>
                            </div>
                          </div>
                        }
                      >
                        <Suspense
                          fallback={
                            <div className="h-full w-full rounded-2xl border border-white/10 bg-[#111115] flex items-center justify-center">
                              <span className="font-mono text-xs text-[#A1A1AA]">
                                Initializing 3D studio stage...
                              </span>
                            </div>
                          }
                        >
                          <HeroSceneR3F
                            wordmark={profile.hero3DWordmark}
                            scrollProgress={globalScrollProgress}
                            fallbackImage={profile.scrubVideoPoster}
                          />
                        </Suspense>
                      </ErrorBoundary>
                    </div>
                  </div>

                  {/* STATS SECTION: Staggered Odometer Counters */}
                  <div className="mt-14 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 lg:grid-cols-4 lg:gap-8">
                    {stats.map((stat, idx) => (
                      <OdometerStatCard key={stat.id} stat={stat} index={idx} />
                    ))}
                  </div>
                </div>
              </section>

              {/* VELOCITY-BASED MARQUEE */}
              <VelocityMarquee items={marqueeItems} />

              {/* ABOUT SECTION: Outlined Scroll-Fill + Dim-to-Bright Paragraph + Portrait */}
              <section id="about" className="border-t border-white/10 py-20 lg:py-28 bg-[#0D0D10]">
                <div className="mx-auto max-w-[1200px] px-6 space-y-14">
                  <ScrollFillText text={profile.scrollFillStatement} />

                  <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
                    <div className="lg:col-span-5">
                      <div className="aspect-square max-w-[440px] mx-auto lg:mx-0 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0B111A]">
                        <ResilientImage
                          src={profile.portraitImage}
                          alt={profile.name}
                          fallbackTitle={profile.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-7 space-y-6">
                      <SectionHeading kicker="About" title={profile.aboutHeading} />

                      <ScrollRevealParagraph
                        text={profile.aboutLeadParagraph}
                        className="text-lg sm:text-xl font-medium text-[#F4F4F0]"
                      />

                      <p className="text-sm sm:text-base leading-relaxed text-[#A1A1AA] max-w-[62ch]">
                        {profile.aboutBio}
                      </p>

                      {profile.portfolioDriveUrl && (
                        <div className="pt-2">
                          <MagneticButton
                            label="Open Google Drive Portfolio"
                            href={profile.portfolioDriveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            arrowType="up-right"
                            cursorLabel="Open"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* SERVICES SECTION */}
              <section id="services" className="border-t border-white/10 py-20 lg:py-28">
                <div className="mx-auto max-w-[1200px] px-6 space-y-12">
                  <SectionHeading
                    kicker="Services"
                    title="Strategy, AI-assisted production, analytics, and training"
                  />

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {services.map((srv, idx) => (
                      <motion.div
                        key={srv.id}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{
                          duration: 0.45,
                          delay: idx * 0.06,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="rounded-2xl border border-white/10 bg-[#111115] p-6 sm:p-7 flex flex-col justify-between space-y-5 hover:border-[#E5A93C]/40 transition-colors"
                      >
                        <div>
                          <span className="font-mono text-xs text-[#E5A93C] tabular-nums">
                            {srv.number}
                          </span>
                          <h3 className="mt-2 font-display var-heading-hover text-xl font-semibold text-[#F4F4F0]">
                            {srv.title}
                          </h3>
                          <p className="mt-2.5 text-sm leading-relaxed text-[#A1A1AA]">
                            {srv.description}
                          </p>
                        </div>
                        <p className="pt-4 border-t border-white/10 text-xs text-[#D4D4D8]">
                          {srv.deliverables}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* GSAP SCROLL-SCRUBBED MP4 VIDEO SECTION */}
              <ScrollVideoScrubSection
                videoUrl={profile.scrubVideoUrl}
                posterImage={profile.scrubVideoPoster}
              />

              {/* SKILLS SECTION: Animated Progress Rings & Bars */}
              <section id="skills" className="border-t border-white/10 py-20 lg:py-28">
                <div className="mx-auto max-w-[1200px] px-6 space-y-12">
                  <SectionHeading
                    kicker="Skills & Proficiency"
                    title="Creative tools, motion engineering, and measurement craft"
                  />

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {skills.map((skill, idx) => (
                      <SkillProgressRing
                        key={skill.id}
                        label={skill.name}
                        category={skill.category}
                        level={skill.level}
                        index={idx}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* EXPERIENCE TIMELINE SECTION */}
              <section id="experience" className="border-t border-white/10 py-20 lg:py-28 bg-[#0D0D10]">
                <div className="mx-auto max-w-[1200px] px-6 space-y-12">
                  <SectionHeading
                    kicker="Experience"
                    title="Career milestones across motion, branding, and media"
                  />

                  <div className="space-y-4">
                    {experience.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{
                          duration: 0.45,
                          delay: idx * 0.06,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-[#111115] p-6 md:grid-cols-12 md:items-start"
                      >
                        <div className="md:col-span-3 space-y-1">
                          <div className="font-mono text-xs text-[#E5A93C] tabular-nums">
                            {item.period}
                          </div>
                          <div className="text-xs text-[#71717A]">{item.location}</div>
                        </div>
                        <div className="md:col-span-9 space-y-1.5">
                          <h3 className="font-display var-heading-hover text-lg font-semibold text-[#F4F4F0]">
                            {item.role}
                          </h3>
                          <div className="text-xs font-medium text-[#D4D4D8]">
                            {item.organization}
                          </div>
                          <p className="pt-1 text-sm leading-relaxed text-[#A1A1AA]">
                            {item.summary}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* SELECTED PROJECTS GRID (Opens Detail Page with 3D Mockup) */}
              <section id="works" className="border-t border-white/10 py-20 lg:py-28">
                <div className="mx-auto max-w-[1200px] px-6">
                  <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
                    <SectionHeading
                      kicker="Projects"
                      title="Selected case studies and 3D creative deliverables"
                    />

                    <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
                      <button
                        type="button"
                        onClick={() => setProjectBuildKey((k) => k + 1)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#121216] px-3 py-1.5 text-xs font-medium text-[#A1A1AA] hover:border-[#E5A93C]/50 hover:text-[#F4F4F0] transition-colors whitespace-nowrap shrink-0"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-[#E5A93C]" />
                        <span>Replay Build</span>
                      </button>

                      <div
                        role="tablist"
                        aria-label="Filter projects by category"
                        className="flex flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-[#121216] p-1"
                      >
                        {FILTER_OPTIONS.map((category) => {
                          const active = selectedCategory === category;
                          return (
                            <button
                              key={category}
                              type="button"
                              role="tab"
                              aria-selected={active}
                              onClick={() => setSelectedCategory(category)}
                              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                                active
                                  ? 'bg-[#E5A93C] text-[#09090B]'
                                  : 'text-[#A1A1AA] hover:text-[#F4F4F0]'
                              }`}
                            >
                              {category}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {filteredProjects.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-[#111115] p-12 text-center">
                      <p className="text-sm text-[#A1A1AA]">
                        No projects found in this category yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {filteredProjects.map((project, index) => {
                        const isLead =
                          project.featured || (index === 0 && selectedCategory === 'All');
                        return (
                          <TiltProjectCard
                            key={`${project.id}-${projectBuildKey}`}
                            project={project}
                            isLead={isLead}
                            index={index}
                            buildKey={projectBuildKey}
                            onOpen={(p) => navigateTo(`/projects/${encodeURIComponent(p.id)}`)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              {/* CERTIFICATIONS & TESTIMONIALS */}
              <section className="border-t border-white/10 py-20 lg:py-28 bg-[#0D0D10]">
                <div className="mx-auto max-w-[1200px] px-6 space-y-20">
                  {/* Certifications */}
                  <div className="space-y-10">
                    <SectionHeading
                      kicker="Certifications"
                      title="Verified credentials in motion, analytics, and creative workflows"
                    />
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                      {certifications.map((cert) => (
                        <div
                          key={cert.id}
                          className="rounded-2xl border border-white/10 bg-[#111115] p-6 flex flex-col justify-between space-y-4"
                        >
                          <div>
                            <div className="font-mono text-xs text-[#E5A93C] tabular-nums">
                              {cert.year}
                            </div>
                            <h3 className="mt-2 font-display text-lg font-semibold text-[#F4F4F0]">
                              {cert.title}
                            </h3>
                            <p className="mt-1.5 text-xs text-[#A1A1AA]">{cert.issuer}</p>
                          </div>
                          {cert.credentialUrl && (
                            <a
                              href={cert.credentialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-cursor="Open"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D4D4D8] hover:text-[#E5A93C] transition-colors"
                            >
                              <span>Verify Credential</span>
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Testimonials */}
                  <div className="space-y-10 border-t border-white/10 pt-16">
                    <SectionHeading
                      kicker="Testimonials"
                      title="Client perspectives and creative outcomes"
                    />
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      {testimonials.map((t) => (
                        <blockquote
                          key={t.id}
                          className="rounded-2xl border border-white/10 bg-[#111115] p-6 flex flex-col justify-between space-y-5"
                        >
                          <p className="text-sm leading-relaxed text-[#D4D4D8]">
                            “{t.quote}”
                          </p>
                          <div className="space-y-2 border-t border-white/10 pt-4">
                            <div className="text-xs text-[#E5A93C]">{t.outcome}</div>
                            <div className="text-xs text-[#A1A1AA]">
                              <span className="font-semibold text-[#F4F4F0]">{t.name}</span>
                              <span className="mx-1.5" aria-hidden="true">
                                ·
                              </span>
                              <span>
                                {t.role}, {t.organization}
                              </span>
                            </div>
                          </div>
                        </blockquote>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* GET IN TOUCH SECTION */}
              <ContactSection profile={profile} />
            </main>

            {/* Footer with low-contrast corner Admin link only */}
            <footer className="border-t border-white/10 py-8">
              <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-4 px-6 text-xs text-[#71717A] sm:flex-row sm:items-center">
                <div>
                  <span>
                    © {new Date().getFullYear()} {profile.name}
                  </span>
                  <span className="mx-2" aria-hidden="true">
                    ·
                  </span>
                  <span>{profile.location}</span>
                </div>

                <div className="flex flex-wrap items-center gap-5">
                  <a href="#services" className="hover:text-[#F4F4F0] transition-colors">
                    Services
                  </a>
                  <a href="#works" className="hover:text-[#F4F4F0] transition-colors">
                    Projects
                  </a>
                  <a href="#contact" className="hover:text-[#F4F4F0] transition-colors">
                    Contact
                  </a>
                  <a
                    href={isStaticHostMode() ? '#/admin' : '/admin'}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo('/admin');
                    }}
                    className="text-[11px] text-[#3F3F46] hover:text-[#71717A] transition-colors"
                  >
                    Admin
                  </a>
                </div>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
