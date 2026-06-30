"use client";

import { LocaleProvider } from "./LocaleProvider";
import { TopNav } from "./TopNav";
import {
  AccountabilitySection,
  AiDaySection,
  BigIdeaSection,
  ClosingSection,
  HeroSection,
  HowItWorksSection,
  ModulesSection,
  ObjectModelSection,
  ProblemSection,
  ResponseSection,
  SiteFooter,
  TimelineSection,
  TrustSection,
} from "./sections";

// The HOS explainer landing page: a bilingual (EN/ES), 12-year-old-readable
// walkthrough of what HOS is and every module it will offer, with Remotion
// animations and high-fidelity product mockups.
export function LandingPage() {
  return (
    <LocaleProvider defaultLang="en">
      <div className="hos-landing min-h-screen">
        <TopNav />
        <main>
          <HeroSection />
          <ProblemSection />
          <BigIdeaSection />
          <HowItWorksSection />
          <ModulesSection />
          <AiDaySection />
          <TimelineSection />
          <ResponseSection />
          <AccountabilitySection />
          <ObjectModelSection />
          <TrustSection />
          <ClosingSection />
        </main>
        <SiteFooter />
      </div>
    </LocaleProvider>
  );
}
