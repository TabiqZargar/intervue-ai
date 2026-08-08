import type { Metadata } from "next";
import { getCandidates } from "@/lib/candidates";
import { InterviewClient } from "@/components/interview/InterviewClient";

export const metadata: Metadata = {
  title: "Interview",
  description:
    "Adaptive AI technical interview based on your AI engineering learning journey.",
};

export default function InterviewPage() {
  const candidates = getCandidates();
  return <InterviewClient candidates={candidates} />;
}
