import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Check, Mail, MapPin, Phone } from 'lucide-react';
import { isStaticHostMode, submitContactInquiry } from '../lib/api';
import { contactSubmissionSchema } from '../lib/validation';
import type { PortfolioProfile } from '../types/portfolio';
import { MagneticButton } from './MagneticButton';
import { SectionHeading } from './TypographyEffects';

interface ContactSectionProps {
  profile: PortfolioProfile;
}

export function ContactSection({ profile }: ContactSectionProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [mailtoFallback, setMailtoFallback] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMailtoFallback(null);

    const parsed = contactSubmissionSchema.safeParse({
      name,
      email,
      subject,
      message,
      website,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Please check your form details.');
      return;
    }

    const buildMailto = () =>
      `mailto:${encodeURIComponent(profile.email)}?subject=${encodeURIComponent(
        parsed.data.subject,
      )}&body=${encodeURIComponent(
        `Name: ${parsed.data.name}\nEmail: ${parsed.data.email}\n\n${parsed.data.message}`,
      )}`;

    if (isStaticHostMode()) {
      setMailtoFallback(buildMailto());
      setError('Static hosting detected. Use the button below to send directly via your email app.');
      return;
    }

    setSubmitting(true);
    try {
      await submitContactInquiry(parsed.data);
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setWebsite('');
    } catch (err) {
      if (isStaticHostMode()) {
        setMailtoFallback(buildMailto());
      }
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="contact" className="border-t border-white/10 py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Column: Direct Contact Details */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <SectionHeading
                kicker="Get in Touch"
                title="Discuss a brand identity, motion, or strategy brief"
              />
              <p className="text-sm leading-relaxed text-[#A1A1AA]">
                {profile.availability}. Share your goals, timeline, or project brief and I will
                respond directly.
              </p>
            </div>

            <div className="space-y-4 border-t border-white/10 pt-6 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-[#E5A93C] shrink-0" />
                <div>
                  <div className="text-xs text-[#71717A]">Location</div>
                  <div className="text-[#F4F4F0]">{profile.location}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-[#E5A93C] shrink-0" />
                <div>
                  <div className="text-xs text-[#71717A]">Phone</div>
                  <a
                    href={`tel:${profile.phone}`}
                    className="font-mono text-[#F4F4F0] hover:text-[#E5A93C] transition-colors tabular-nums"
                  >
                    {profile.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-[#E5A93C] shrink-0" />
                <div>
                  <div className="text-xs text-[#71717A]">Email</div>
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-[#F4F4F0] hover:text-[#E5A93C] transition-colors break-all"
                  >
                    {profile.email}
                  </a>
                </div>
              </div>

              {profile.portfolioDriveUrl && (
                <div className="pt-2">
                  <a
                    href={profile.portfolioDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="Open"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#121216] px-4 py-2.5 text-xs font-medium text-[#F4F4F0] hover:border-[#E5A93C]/50 hover:text-[#E5A93C] transition-colors whitespace-nowrap"
                  >
                    <span>Browse Google Drive Portfolio</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Zod-validated Contact Form with Honeypot */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-white/10 bg-[#111115] p-6 sm:p-8">
              {submitted ? (
                <div className="py-10 text-center space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E5A93C]/15 text-[#E5A93C]">
                    <Check className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-[#F4F4F0]">
                    Message sent
                  </h3>
                  <p className="mx-auto max-w-md text-sm text-[#A1A1AA]">
                    Thank you for reaching out. Your inquiry has been received and I will reply
                    shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-2 inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-[#F4F4F0] hover:bg-white/5 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {/* Honeypot field hidden from human visitors */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="contact-website">Website</label>
                    <input
                      id="contact-website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="contact-name" className="block text-xs font-medium text-[#A1A1AA] mb-2">
                        Name
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F4F4F0] placeholder:text-[#52525B] focus:border-[#E5A93C] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-xs font-medium text-[#A1A1AA] mb-2">
                        Email
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F4F4F0] placeholder:text-[#52525B] focus:border-[#E5A93C] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block text-xs font-medium text-[#A1A1AA] mb-2">
                      Subject
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Motion graphics campaign, brand system, or workshop"
                      className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F4F4F0] placeholder:text-[#52525B] focus:border-[#E5A93C] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-medium text-[#A1A1AA] mb-2">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share your goals, timeline, and deliverables..."
                      className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F4F4F0] placeholder:text-[#52525B] focus:border-[#E5A93C] focus:outline-none resize-y"
                    />
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200 space-y-2"
                    >
                      <p>{error}</p>
                      {mailtoFallback && (
                        <a
                          href={mailtoFallback}
                          className="inline-flex items-center gap-1.5 rounded-md bg-[#E5A93C] px-3 py-1.5 font-semibold text-[#09090B] hover:bg-[#ebb655] transition-colors"
                        >
                          <span>Open in Email App</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <span className="text-xs text-[#71717A]">
                      Direct response within 24 hours
                    </span>
                    <MagneticButton
                      type="submit"
                      disabled={submitting}
                      label={submitting ? 'Sending...' : 'Send Message'}
                      cursorLabel="Send"
                    />
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
