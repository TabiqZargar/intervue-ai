import { Redis } from "@upstash/redis";
import type { ConversationTurn, InterviewSession } from "@/types/interview";

/**
 * Interview session store abstraction.
 *
 * Sessions are stored as opaque JSON values under a namespaced key so the
 * engine and service never depend on storage details. All operations are
 * asynchronous so the store can be a remote cache (Upstash Redis) or the local
 * in-memory fallback. Immutable update semantics are preserved: a read-modify-
 * write never shares mutable state between sessions.
 *
 * Failure contract: storage failures throw a typed `MemoryStoreError`; "session
 * not found" is always signalled with `undefined` (never thrown). This lets the
 * engine map an outage to a controlled 500 while still distinguishing a genuine
 * 404, so a Redis outage is never misreported as "session no longer active".
 */
export interface MemoryStore {
  createSession(session: InterviewSession): Promise<InterviewSession>;
  getSession(sessionId: string): Promise<InterviewSession | undefined>;
  updateSession(session: InterviewSession): Promise<InterviewSession>;
  appendTurn(
    sessionId: string,
    turn: ConversationTurn,
  ): Promise<InterviewSession | undefined>;
  completeSession(
    sessionId: string,
    completedAt: string,
  ): Promise<InterviewSession | undefined>;
  deleteSession(sessionId: string): Promise<boolean>;
  clear(): Promise<void>;
}

/** Safe, user-facing message for storage failures. Never includes store details. */
export const SESSION_STORE_UNAVAILABLE =
  "interview session store is temporarily unavailable";

/**
 * Typed storage failure. The message is deliberately generic (it may be shown
 * or mapped by the API); the underlying cause is kept for server-side logs and
 * is never surfaced to clients.
 */
export class MemoryStoreError extends Error {
  readonly code: "storage-failure";
  constructor(message: string = SESSION_STORE_UNAVAILABLE, cause?: unknown) {
    super(message);
    this.name = "MemoryStoreError";
    this.code = "storage-failure";
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}

/**
 * Property-based guard for `MemoryStoreError`. Uses the `code` field rather
 * than `instanceof` so it keeps working when a bundler or dual CJS/ESM module
 * graph produces more than one copy of the error class.
 */
export function isMemoryStoreError(error: unknown): error is MemoryStoreError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "storage-failure"
  );
}

/**
 * Thrown at store construction when the deployment is production and the
 * required Upstash Redis configuration is missing: the app must fail fast
 * rather than silently run on process memory.
 */
export class SessionStoreConfigurationError extends Error {
  readonly code: "not-configured";
  constructor(message: string) {
    super(message);
    this.name = "SessionStoreConfigurationError";
    this.code = "not-configured";
  }
}

/** Property-based guard for `SessionStoreConfigurationError` (same rationale as `isMemoryStoreError`). */
export function isSessionStoreConfigurationError(
  error: unknown,
): error is SessionStoreConfigurationError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "not-configured"
  );
}

export const SESSION_KEY_PREFIX = "intervue-ai:session:";

function sessionKey(sessionId: string): string {
  return `${SESSION_KEY_PREFIX}${sessionId}`;
}

/**
 * In-memory session store (local development fallback). Sessions are stored
 * immutably so no two sessions ever share mutable state.
 */
export function createMemory(): MemoryStore {
  const sessions = new Map<string, InterviewSession>();

  return {
    async createSession(session) {
      sessions.set(session.sessionId, session);
      return session;
    },

    async getSession(sessionId) {
      return sessions.get(sessionId);
    },

    async updateSession(session) {
      sessions.set(session.sessionId, session);
      return session;
    },

    async appendTurn(sessionId, turn) {
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

    async completeSession(sessionId, completedAt) {
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

    async deleteSession(sessionId) {
      return sessions.delete(sessionId);
    },

    async clear() {
      sessions.clear();
    },
  };
}

/**
 * Redis-backed session store. Sessions are JSON values under
 * `intervue-ai:session:<sessionId>`. Every command is wrapped so a transport
 * failure surfaces as a typed `MemoryStoreError` instead of a raw rejection.
 */
export function createRedisSessionStore(redis: Redis): MemoryStore {
  async function readSession(
    sessionId: string,
  ): Promise<InterviewSession | undefined> {
    const raw = await run(() => redis.get<string>(sessionKey(sessionId)));
    if (raw == null) {
      return undefined;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        typeof (parsed as { sessionId?: unknown }).sessionId !== "string"
      ) {
        throw new Error("session payload is not a session object");
      }
      return parsed as InterviewSession;
    } catch (cause) {
      throw new MemoryStoreError(
        "stored interview session could not be read",
        cause,
      );
    }
  }

  async function writeSession(session: InterviewSession): Promise<void> {
    await run(() => redis.set(sessionKey(session.sessionId), JSON.stringify(session)));
  }

  return {
    async createSession(session) {
      await writeSession(session);
      return session;
    },

    async getSession(sessionId) {
      return readSession(sessionId);
    },

    async updateSession(session) {
      await writeSession(session);
      return session;
    },

    async appendTurn(sessionId, turn) {
      const session = await readSession(sessionId);
      if (!session) {
        return undefined;
      }
      const updated: InterviewSession = {
        ...session,
        turns: [...session.turns, turn],
      };
      await writeSession(updated);
      return updated;
    },

    async completeSession(sessionId, completedAt) {
      const session = await readSession(sessionId);
      if (!session) {
        return undefined;
      }
      const updated: InterviewSession = {
        ...session,
        status: "completed",
        currentQuestionIndex: session.plan.questions.length,
        completedAt,
      };
      await writeSession(updated);
      return updated;
    },

    async deleteSession(sessionId) {
      const deleted = await run(() => redis.del(sessionKey(sessionId)));
      return deleted > 0;
    },

    async clear() {
      const keys = await run(() => redis.keys(`${SESSION_KEY_PREFIX}*`));
      if (keys.length > 0) {
        await run(() => redis.del(...keys));
      }
    },
  };
}

async function run<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (cause) {
    throw new MemoryStoreError(SESSION_STORE_UNAVAILABLE, cause);
  }
}

export interface SessionStoreOptions {
  /** Explicit store injection (tests / callers that already own a store). */
  store?: MemoryStore;
  /** Explicit Redis client injection (tests). */
  redis?: Redis;
}

/**
 * Store factory with explicit environment detection:
 * - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` present → Redis.
 * - Absent in production → throw (never silently use memory in production).
 * - Absent otherwise (local development) → in-memory fallback.
 */
export function createSessionStore(options: SessionStoreOptions = {}): MemoryStore {
  if (options.store) {
    return options.store;
  }
  if (options.redis) {
    return createRedisSessionStore(options.redis);
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return createRedisSessionStore(
      new Redis({
        url,
        token,
        // Sessions are stored as opaque JSON strings and parsed by the store
        // itself (readSession), so the client must not auto-deserialize `get`
        // results (the default is `true`): `readSession` would otherwise call
        // `JSON.parse` on an already-parsed object and fail with a SyntaxError.
        automaticDeserialization: false,
      }),
    );
  }

  if (process.env.NODE_ENV === "production") {
    throw new SessionStoreConfigurationError(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in production; refusing to fall back to in-memory session storage",
    );
  }

  return createMemory();
}
