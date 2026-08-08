import type { Metadata } from "next";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Comparison } from "@/components/landing/Comparison";
import { WhatYouGet } from "@/components/landing/WhatYouGet";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: { absolute: "Intervue AI — AI Technical Interviewer" },
  description:
    "Intervue AI conducts a personalized technical interview for the ABTalks AI Cohort — adaptive questions and actionable feedback based on your learning journey.",
};

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <LandingHeader />
      <main className="flex flex-1 flex-col">
        <Hero />
        <HowItWorks />
        <Comparison />
        <WhatYouGet />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
