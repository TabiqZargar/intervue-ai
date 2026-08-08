import type { ConversationTurn, InterviewSession } from "@/types/interview";

/**
 * In-memory interview session store. Persistence is not required by the
 * hackathon; a Map is sufficient. Sessions are stored immutably so no two
 * sessions ever share mutable state.
 */
export interface MemoryStore {
  createSession(session: InterviewSession): InterviewSession;
  getSession(sessionId: string): InterviewSession | undefined;
  updateSession(session: InterviewSession): InterviewSession;
  appendTurn(
    sessionId: string,
    turn: ConversationTurn,
  ): InterviewSession | undefined;
  completeSession(
    sessionId: string,
    completedAt: string,
  ): InterviewSession | undefined;
  deleteSession(sessionId: string): boolean;
  clear(): void;
}

export function createMemory(): MemoryStore {
  const sessions = new Map<string, InterviewSession>();

  return {
    createSession(session) {
      sessions.set(session.sessionId, session);
      return session;
    },

    getSession(sessionId) {
      return sessions.get(sessionId);
    },

    updateSession(session) {
      sessions.set(session.sessionId, session);
      return session;
    },

    appendTurn(sessionId, turn) {
      const session = sessions.get(sessionId);
      if (!session) {
        return undefined;
      }
      const updated: InterviewSession = {
        ...session,
        turns: [...session.turns, turn],
      };
      sessions.set(sessionId, updated);
      return updated;
    },

    completeSession(sessionId, completedAt) {
      const session = sessions.get(sessionId);
      if (!session) {
        return undefined;
      }
      const updated: InterviewSession = {
        ...session,
        status: "completed",
        currentQuestionIndex: session.plan.questions.length,
        completedAt,
      };
      sessions.set(sessionId, updated);
      return updated;
    },

    deleteSession(sessionId) {
      return sessions.delete(sessionId);
    },

    clear() {
      sessions.clear();
    },
  };
}
