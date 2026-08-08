/**
 * Domain types for the adaptive interview.
 * The behaviors that produce these values (planner, engine, evaluator,
 * LLM service, API route) are implemented in later prompts.
 */

export type MessageRole = "assistant" | "user";

export interface InterviewMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface InterviewQuestion {
  id: string;
  day: number;
  topic: string;
  prompt: string;
  skills?: string[];
}

export type InterviewStatus = "in-progress" | "completed";

export interface InterviewSession {
  id: string;
  candidateId: string;
  curriculumId: string;
  status: InterviewStatus;
  currentQuestionIndex: number;
  messages: InterviewMessage[];
  startedAt: string;
}

export interface StartInterviewRequest {
  candidateId: string;
  curriculumId: string;
}

export interface InterviewResponse {
  sessionId: string;
  done: boolean;
  message: InterviewMessage;
}

export interface QuestionFeedback {
  questionId: string;
  score: number;
  comment: string;
}

export interface InterviewFeedback {
  candidateId: string;
  overallScore: number;
  summary: string;
  strengths: string[];
  areasToImprove: string[];
  perQuestion: QuestionFeedback[];
}
