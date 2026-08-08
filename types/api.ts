import type { InterviewMessage } from "@/types/interview";

export interface InterviewRequest {
  candidateId: string;
  message: string;
}

export interface InterviewResponse {
  sessionId: string;
  message: InterviewMessage;
}
