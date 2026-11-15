import type { PublicPortfolioData } from '../types/portfolio';

export const PUBLIC_PORTFOLIO_FALLBACK: PublicPortfolioData = {
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
};
