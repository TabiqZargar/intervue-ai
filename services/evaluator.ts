import { extractJsonObject } from "@/services/llm";
import type { LlmClient } from "@/services/llm";
import type {
  AnswerEvaluation,
  AnswerLevel,
  EvaluatorPromptInput,
  LlmCallResult,
  LlmChatMessage,
  SubScore,
} from "@/types/llm";

/**
 * Deterministic interface around an LLM answer evaluator. The evaluator
 * judges the candidate's answer ONLY against the stated curriculum objective
 * and the question asked. Exactly one LLM call per evaluation.
 *
 * The evaluator does NOT control the interview: it only produces a
 * followUpRecommended signal the engine may later use. The deterministic
 * engine still owns question count, progression, and completion.
 */

const EVALUATOR_SYSTEM_PROMPT = [
  "You are an impartial evaluator for a hands-on AI engineering interview.",
  "Judge the candidate's answer ONLY against the provided curriculum objective and the question that was asked.",
  "Do not judge unrelated topics and do not invent requirements.",
  "A technically valid alternative approach must not be marked wrong merely because it differs from one expected implementation.",
  "Provide concise reasons only; do not include private reasoning or step-by-step thinking.",
  "Respond with JSON only.",
].join("\n");

const SCHEMA_INSTRUCTION = [
  "Assess the answer strictly against the stated objective and the question asked.",
  "Keep strengths and gaps concise (at most 2-3 items each).",
  'Respond with JSON only, matching exactly: {"overall":"strong"|"adequate"|"weak","score":1-5,"correctness":1-5,"depth":1-5,"reasoning":1-5,"communication":1-5,"strengths":[...],"gaps":[...],"followUpRecommended":true|false,"followUpReason":"..."}',
].join(" ");

/** Maximum number of prior turns included in a prompt window. */
const MAX_CONVERSATION_TURNS = 6;

export async function evaluateAnswer(
  input: EvaluatorPromptInput,
  client: LlmClient,
): Promise<LlmCallResult<AnswerEvaluation>> {
  const result = await client.chat(buildEvaluatorMessages(input), {
    temperature: 0.2,
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
        message: "LLM evaluation output was not valid JSON",
      },
    };
  }

  const evaluation = parseAnswerEvaluation(parsed);
  if (!evaluation) {
    return {
      ok: false,
      error: {
        code: "invalid-output",
        message: "LLM evaluation output did not match the expected schema",
      },
    };
  }

  return { ok: true, value: evaluation };
}

export function buildEvaluatorMessages(
  input: EvaluatorPromptInput,
): LlmChatMessage[] {
  const { plannedQuestion: q, generatedQuestion, candidateAnswer } = input;
  const parts: string[] = [];

  parts.push("## Question asked");
  parts.push(generatedQuestion.text);
  parts.push("");
  parts.push("## Curriculum objective to judge against");
  parts.push(`Topic: ${q.curriculumTitle}`);
  parts.push(`Objective: ${q.objective}`);
  if (input.curriculumDay.tools.length > 0) {
    parts.push(`Relevant tools: ${input.curriculumDay.tools.join(", ")}`);
  }
  parts.push("");
  parts.push("## Candidate answer");
  parts.push(
    candidateAnswer.trim() === ""
      ? "(no answer submitted)"
      : truncate(candidateAnswer, 2000),
  );

  const recent = input.conversation.slice(-MAX_CONVERSATION_TURNS);
  if (recent.length > 0) {
    parts.push("");
    parts.push("## Recent conversation (context only)");
    for (const turn of recent) {
      parts.push(`Q${turn.questionNumber}: ${truncate(turn.answer, 400)}`);
    }
  }

  parts.push("");
  parts.push(SCHEMA_INSTRUCTION);

  return [
    { role: "system", content: EVALUATOR_SYSTEM_PROMPT },
    { role: "user", content: parts.join("\n") },
  ];
}

const OVERALL_VALUES: readonly AnswerLevel[] = [
  "strong",
  "adequate",
  "weak",
];

export function parseAnswerEvaluation(raw: unknown): AnswerEvaluation | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const obj = raw as Record<string, unknown>;

  if (!isAnswerLevel(obj.overall)) {
    return null;
  }
  if (
    !isSubScore(obj.score) ||
    !isSubScore(obj.correctness) ||
    !isSubScore(obj.depth) ||
    !isSubScore(obj.reasoning) ||
    !isSubScore(obj.communication)
  ) {
    return null;
  }
  if (!isStringArray(obj.strengths) || !isStringArray(obj.gaps)) {
    return null;
  }
  if (typeof obj.followUpRecommended !== "boolean") {
    return null;
  }
  if (typeof obj.followUpReason !== "string") {
    return null;
  }

  return {
    overall: obj.overall,
    score: obj.score,
    correctness: obj.correctness,
    depth: obj.depth,
    reasoning: obj.reasoning,
    communication: obj.communication,
    strengths: obj.strengths.slice(0, 5),
    gaps: obj.gaps.slice(0, 5),
    followUpRecommended: obj.followUpRecommended,
    followUpReason: obj.followUpReason,
  };
}

function isAnswerLevel(value: unknown): value is AnswerLevel {
  return (
    typeof value === "string" &&
    (OVERALL_VALUES as readonly string[]).includes(value)
  );
}

function isSubScore(value: unknown): value is SubScore {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`;
}
