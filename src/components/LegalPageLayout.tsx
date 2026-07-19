import type { ReactNode } from 'react';
import HeaderV2 from '@/components/v2/HeaderV2';
import FooterV2 from '@/components/v2/FooterV2';
import { useSEO } from '@/hooks/useSEO';

export interface LegalPageSection {
  title?: string;
  paragraphs?: ReactNode[];
  bullets?: ReactNode[];
  ordered?: ReactNode[];
}

interface LegalPageLayoutProps {
  title: string;
  updatedAt?: string;
  description: string;
  sections: LegalPageSection[];
}

const LegalPageLayout = ({ title, updatedAt, description, sections }: LegalPageLayoutProps) => {
  useSEO({
    title: `${title} · Fauves`,
    description,
  });

  return (
    <div className="legal-page min-h-[100svh] bg-[#111416] text-white">
      <style>{`
        .legal-page {
          --footer-text-color: rgba(255,255,255,.45);
          --footer-hover-color: #fff;
          --footer-border-color: rgba(255,255,255,.08);
          --footer-social-color: rgba(255,255,255,.35);
          --footer-social-hover: #fff;
          --footer-logo-color: #fff;
          --cta-gradient-start: #5c73ff;
          --cta-gradient-end: #ff6a3d;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .legal-page-content {
          font-size: 16px;
          font-weight: 450;
          line-height: 1.62;
          color: rgba(255,255,255,.78);
        }
        .legal-page-content section + section {
          margin-top: 2rem;
        }
        .legal-page-content h2 {
          margin: 0 0 .85rem;
          color: #fff;
          font-size: 1.35rem;
          font-weight: 650;
          letter-spacing: -.025em;
        }
        .legal-page-content p {
          margin: 0 0 1rem;
        }
        .legal-page-content ul,
        .legal-page-content ol {
          margin: .25rem 0 1.2rem;
          padding-left: 1.55rem;
        }
        .legal-page-content li {
          margin: .35rem 0;
          padding-left: .25rem;
        }
        .legal-page-content a {
          color: #a9aaff;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        @media (max-width: 640px) {
          .legal-page-content {
            font-size: 15px;
          }
          .legal-page-content h2 {
            font-size: 1.2rem;
          }
        }
      `}</style>

      <HeaderV2
        transparent
        theme="dark"
        scrollTransition={false}
        blueGlow={false}
        contentMaxWidth="1120px"
        explorarText="Descobrir eventos"
      />

      <main className="mx-auto w-full max-w-[720px] px-5 pb-16 pt-36 sm:px-7 sm:pt-40">
        <header>
          <h1 className="max-w-[680px] text-[clamp(2.3rem,4.4vw,3.25rem)] font-semibold leading-[1.12] tracking-[-0.045em] text-white">
            {title}
          </h1>
          {updatedAt && (
            <p className="mt-5 text-[15px] font-semibold text-white/55">{updatedAt}</p>
          )}
        </header>

        <div className="my-12 h-px w-full bg-white/[0.09] sm:my-14" />

        <article className="legal-page-content">
          {sections.map((section, index) => (
            <section key={`${section.title ?? 'intro'}-${index}`}>
              {section.title && <h2>{section.title}</h2>}
              {section.paragraphs?.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex}>{paragraph}</p>
              ))}
              {section.bullets && (
                <ul>
                  {section.bullets.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                </ul>
              )}
              {section.ordered && (
                <ol>
                  {section.ordered.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                </ol>
              )}
            </section>
          ))}
        </article>
      </main>

      <FooterV2 maxWidth="900px" variant="home" />
    </div>
  );
};

export default LegalPageLayout;
