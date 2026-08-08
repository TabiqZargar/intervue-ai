/**
 * API types for POST /api/interview — the required endpoint.
 *
 * First request (new session):
 *   { "sessionId": "abc-123", "candidate": { ...candidate object... } }
 * First response:
 *   { "reply": "...", "done": false }
 *
 * Subsequent requests:
 *   { "sessionId": "abc-123", "message": "candidate answer" }
 * Response:
 *   { "reply": "...", "done": false }
 *
 * Final response:
 *   { "reply": "Interview completed.", "done": true, "feedback": {
 *       "summary": "...", "strengths": [], "gaps": [], "next": []
 *     } }
 */
import type { Candidate } from "@/types/candidate";
import type { FinalFeedback } from "@/types/interview";

export interface InterviewStartRequest {
  sessionId: string;
  candidate: Candidate;
}

export interface InterviewContinueRequest {
  sessionId: string;
  message: string;
}

export type InterviewApiRequest = InterviewStartRequest | InterviewContinueRequest;

/** Normal response: a natural interviewer reply and a new question to answer. */
export interface InterviewReplyResponse {
  reply: string;
  done: false;
}

/** Final response: the interview is complete and aggregate feedback is ready. */
export interface InterviewFinalResponse {
  reply: string;
  done: true;
  feedback: FinalFeedback;
}

export type InterviewApiResponse =
  | InterviewReplyResponse
  | InterviewFinalResponse;

export interface InterviewErrorResponse {
  error: string;
}

/** A typed HTTP outcome produced by the interview service and mapped by the route. */
export interface InterviewServiceResult {
  status: number;
  body: InterviewApiResponse | InterviewErrorResponse;
}
