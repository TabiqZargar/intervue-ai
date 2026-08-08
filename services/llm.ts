import type {
  GeneratedQuestion,
  InterviewerPromptInput,
  LlmCallResult,
  LlmChatMessage,
  LlmConfig,
  LlmConfigResult,
  LlmServiceErrorCode,
} from "@/types/llm";
import type { QuestionPurpose } from "@/types/planner";

/**
 * Configurable runtime LLM service over an OpenAI-compatible chat-completions
 * API. The provider/model is selected at deployment through server-side
 * environment variables; the transport is injectable for testing.
 *
 * Exactly one model call is made per generated question (see
 * generateInterviewQuestion). Prompts are compact: only the candidate profile,
 * the single planned question, its curriculum objective, and a bounded recent
 * conversation window are ever sent.
 */

export interface ChatCompletionRequest {
  model: string;
  messages: LlmChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  choices: Array<{ message: { content: string } }>;
}

/**
 * Injectable transport. Implementations should throw ProviderHttpError for
 * non-2xx provider responses; other rejections are mapped to typed errors by
 * the client. The default is a fetch-based transport.
 */
export type ChatTransport = (
  request: ChatCompletionRequest,
  config: LlmConfig,
) => Promise<ChatCompletionResponse>;

/** Signals a non-2xx provider response. */
export class ProviderHttpError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`LLM provider returned HTTP ${status}`);
    this.name = "ProviderHttpError";
    this.status = status;
  }
}

export const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Reads runtime configuration from environment variables. All three of
 * LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL are required; LLM_TIMEOUT_MS is
 * optional and defaults to 30 seconds.
 */
export function resolveLlmConfig(
  env: Record<string, string | undefined> = process.env,
): LlmConfigResult {
  const baseUrl = env.LLM_BASE_URL;
  const apiKey = env.LLM_API_KEY;
  const model = env.LLM_MODEL;

  if (!baseUrl || !apiKey || !model) {
    return {
      ok: false,
      error: {
        code: "not-configured",
        message:
          "LLM service is not configured: LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL must be set",
      },
    };
  }

  return {
    ok: true,
    config: {
      baseUrl,
      apiKey,
      model,
      timeoutMs: parsePositiveInt(env.LLM_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    },
  };
}

export interface LlmClient {
  /** Resolved config, or null when environment configuration is incomplete. */
  config: LlmConfig | null;
  chat(
    messages: LlmChatMessage[],
    options?: { temperature?: number },
  ): Promise<LlmCallResult<string>>;
}

export interface CreateLlmClientOptions {
  config?: LlmConfig;
  transport?: ChatTransport;
  /** Override for environment variables; defaults to process.env. */
  env?: Record<string, string | undefined>;
}

export function createLlmClient(
  options: CreateLlmClientOptions = {},
): LlmClient {
  const configResult: LlmConfigResult = options.config
    ? { ok: true, config: options.config }
    : resolveLlmConfig(options.env ?? process.env);
  const transport = options.transport ?? fetchTransport;

  return {
    config: configResult.ok ? configResult.config : null,

    async chat(messages, chatOptions) {
      if (!configResult.ok) {
        return { ok: false, error: configResult.error };
      }

      const request: ChatCompletionRequest = {
        model: configResult.config.model,
        messages,
        temperature: chatOptions?.temperature,
      };

      try {
        const response = await transport(request, configResult.config);
        return parseChatContent(response);
      } catch (err) {
        return mapTransportError(err, configResult.config.timeoutMs);
      }
    },
  };
}

/**
 * Default fetch-based transport. Calls POST {baseUrl}/chat/completions with a
 * Bearer token. Never reads the response body into a returned error so
 * provider messages cannot leak secrets.
 */
export async function fetchTransport(
  request: ChatCompletionRequest,
  config: LlmConfig,
): Promise<ChatCompletionResponse> {
  const controller = new AbortController();
  const timer: ReturnType<typeof setTimeout> = setTimeout(
    () => controller.abort(),
    config.timeoutMs,
  );

  try {
    const baseUrl = config.baseUrl.replace(/\/+$/, "");
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ProviderHttpError(response.status);
    }

    try {
      return (await response.json()) as ChatCompletionResponse;
    } catch {
      throw new Error("malformed JSON response body");
    }
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Generates one natural-language interview question from a planned question
 * specification. One LLM call, no more.
 */
export async function generateInterviewQuestion(
  input: InterviewerPromptInput,
  client: LlmClient,
): Promise<LlmCallResult<GeneratedQuestion>> {
  const result = await client.chat(buildInterviewerMessages(input), {
    temperature: 0.7,
  });
  if (!result.ok) {
    return result;
  }

  const parsed = extractJsonObject(result.value);
  if (parsed === null) {
    return {
      ok: false,
      error: {
        code: "malformed-json",
        message: "LLM question output was not valid JSON",
      },
    };
  }

  const question = parseGeneratedQuestion(parsed);
  if (!question) {
    return {
      ok: false,
      error: {
        code: "invalid-output",
        message: "LLM question output did not match the expected schema",
      },
    };
  }

  return { ok: true, value: question };
}

const INTERVIEWER_SYSTEM_PROMPT = [
  "You are a technical interviewer conducting a hands-on AI engineering interview.",
  "Ask ONE realistic, focused technical interview question in natural conversational language, matched to the requested difficulty.",
  "Do not mention the curriculum, the objective label, internal planning terminology, or that you are an AI.",
  "Do not quote the objective verbatim; frame the question around the underlying topic.",
  "Do not ask multiple unrelated questions at once.",
  "Do not reveal hidden reasoning.",
  "Respond with JSON only.",
].join("\n");

/** Maximum number of prior turns included in a prompt window. */
const MAX_CONVERSATION_TURNS = 6;

export function buildInterviewerMessages(
  input: InterviewerPromptInput,
): LlmChatMessage[] {
  const { plannedQuestion: q, candidateProfile, experienceLevel } = input;
  const parts: string[] = [];

  parts.push("## Candidate");
  parts.push(`- role: ${candidateProfile.jobRole}`);
  parts.push(
    `- experience: ${candidateProfile.yearsExperience} years (${experienceLevel})`,
  );
  parts.push(`- education: ${candidateProfile.education}`);
  parts.push("");
  parts.push("## Question specification");
  parts.push(`- number: ${q.questionNumber}`);
  parts.push(`- topic: ${q.curriculumTitle}`);
  parts.push(`- objective: ${q.objective}`);
  parts.push(`- difficulty: ${q.difficulty}`);
  if (input.curriculumDay.tools.length > 0) {
    parts.push(`- relevant tools: ${input.curriculumDay.tools.join(", ")}`);
  }
  const focus = purposeFocus(q.purpose);
  if (focus) {
    parts.push(`- focus: ${focus}`);
  }
  if (input.priorEvaluation) {
    parts.push("");
    parts.push("## Previous answer context");
    parts.push(
      `The candidate just answered the previous question. Assessment: overall ${input.priorEvaluation.overall}.`,
    );
    if (input.priorEvaluation.followUpRecommended) {
      parts.push(
        `Suggested follow-up area: ${input.priorEvaluation.followUpReason}`,
      );
    }
    parts.push(
      "Ask a follow-up question that explores that area. Do not repeat the previous question.",
    );
  }

  const recent = input.conversation.slice(-MAX_CONVERSATION_TURNS);
  if (recent.length > 0) {
    parts.push("");
    parts.push("## Recent conversation");
    for (const turn of recent) {
      parts.push(`Q${turn.questionNumber}: ${truncate(turn.answer, 400)}`);
    }
  }

  parts.push("");
  parts.push(
    `Generate exactly ONE natural technical interview question (number ${q.questionNumber}) about this objective at ${q.difficulty} difficulty.`,
  );
  parts.push(
    `Respond with JSON only: {"questionNumber": ${q.questionNumber}, "text": "your question"}`,
  );

  return [
    { role: "system", content: INTERVIEWER_SYSTEM_PROMPT },
    { role: "user", content: parts.join("\n") },
  ];
}

function purposeFocus(purpose: QuestionPurpose): string {
  switch (purpose) {
    case "probe":
      return "dig deeper into a topic the candidate may be shaky on";
    case "stretch":
      return "challenge the candidate on an area of strength";
    case "follow-up":
      return "explore a follow-up angle on the previous topic";
    default:
      return "";
  }
}

function parseGeneratedQuestion(raw: unknown): GeneratedQuestion | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  const { questionNumber, text } = obj;
  if (
    typeof questionNumber !== "number" ||
    !Number.isInteger(questionNumber) ||
    questionNumber < 1
  ) {
    return null;
  }
  if (typeof text !== "string" || text.trim() === "") {
    return null;
  }
  return { questionNumber, text: text.trim() };
}

function parseChatContent(response: unknown): LlmCallResult<string> {
  const content = (
    response as { choices?: Array<{ message?: { content?: unknown } }> }
  )?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") {
    return {
      ok: false,
      error: {
        code: "invalid-output",
        message: "LLM returned an empty or malformed response body",
      },
    };
  }
  return { ok: true, value: content };
}

function mapTransportError(
  err: unknown,
  timeoutMs: number,
): LlmCallResult<string> {
  if (err instanceof ProviderHttpError) {
    return {
      ok: false,
      error: {
        code: "http",
        message: `LLM provider returned HTTP ${err.status}`,
      },
    };
  }
  if (err instanceof Error && err.name === "AbortError") {
    return {
      ok: false,
      error: {
        code: "timeout",
        message: `LLM request timed out after ${timeoutMs}ms`,
      },
    };
  }
  return {
    ok: false,
    error: {
      code: "network",
      message: "failed to reach the LLM provider",
    },
  };
}

/**
 * Extracts a JSON object from an LLM response, tolerating markdown code fences
 * and surrounding prose. Returns null when no JSON object can be parsed.
 */
export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1]!.trim() : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end <= start) {
      return null;
    }
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`;
}

/** Convenience error helper so services return consistent typed errors. */
export function llmError(
  code: LlmServiceErrorCode,
  message: string,
): { ok: false; error: { code: LlmServiceErrorCode; message: string } } {
  return { ok: false, error: { code, message } };
}
