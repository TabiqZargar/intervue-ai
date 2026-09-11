import {
  extractJsonObject,
  purposeFocus,
  type LlmClient,
} from "@/services/llm";
import type {
  AnswerEvaluation,
  AnswerLevel,
  CombinedEvaluationResult,
  CombinedPromptInput,
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

/**
 * Evaluates the candidate's answer AND phrases the next interview question in
 * a single LLM call. Merging the two steps halves the number of provider
 * round-trips per answer, which is the largest win against perceived
 * evaluation latency. The deterministic engine still owns progression: it
 * decides, from the returned evaluation, whether to use the follow-up text or
 * the next planned question text.
 */
export async function evaluateAndGenerateNext(
  input: CombinedPromptInput,
  client: LlmClient,
): Promise<LlmCallResult<CombinedEvaluationResult>> {
  const result = await client.chat(buildCombinedMessages(input), {
    temperature: 0.3,
    operation: "evaluate_and_generate",
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
        message: "LLM combined output was not valid JSON",
      },
    };
  }
  if (typeof parsed !== "object") {
    return {
      ok: false,
      error: {
        code: "invalid-output",
        message: "LLM combined output did not match the expected schema",
      },
    };
  }

  const obj = parsed as Record<string, unknown>;
  const evaluation = parseAnswerEvaluation(obj.evaluation);
  if (!evaluation) {
    return {
      ok: false,
      error: {
        code: "invalid-output",
        message: "LLM evaluation output did not match the expected schema",
      },
    };
  }

  const followUp =
    typeof obj.followUpQuestionText === "string" &&
    obj.followUpQuestionText.trim() !== ""
      ? obj.followUpQuestionText.trim()
      : null;
  const next =
    typeof obj.nextQuestionText === "string" && obj.nextQuestionText.trim() !== ""
      ? obj.nextQuestionText.trim()
      : null;
  if (evaluation.followUpRecommended && followUp === null) {
    return {
      ok: false,
      error: {
        code: "invalid-output",
        message:
          "LLM combined output recommended a follow-up without its question text",
      },
    };
  }
  if (next === null) {
    return {
      ok: false,
      error: {
        code: "invalid-output",
        message: "LLM combined output did not include a next question",
      },
    };
  }

  return {
    ok: true,
    value: { evaluation, followUpQuestionText: followUp, nextQuestionText: next },
  };
}

const COMBINED_SYSTEM_PROMPT = [
  "You are a technical interviewer conducting a hands-on AI engineering interview.",
  "In a single response, do two things:",
  "1) Impartially evaluate the candidate's answer ONLY against the stated curriculum objective and the question that was asked.",
  "2) Phrase the next interview question in natural conversational language, matched to its difficulty.",
  "Judging fair: a technically valid alternative approach must not be marked wrong merely because it differs from one expected implementation.",
  "Do not judge unrelated topics and do not invent requirements.",
  "Do not mention the curriculum, objective labels, internal planning terminology, or that you are an AI.",
  "Do not quote the objective verbatim when phrasing the next question.",
  "Do not reveal hidden reasoning.",
  "Provide concise reasons only; do not include private reasoning or step-by-step thinking.",
  "Respond with JSON only.",
].join("\n");

const COMBINED_SCHEMA_INSTRUCTION = [
  "Assess the answer strictly against the stated objective and the question asked.",
  "Keep strengths and gaps concise (at most 2-3 items each).",
  "When a follow-up on the current topic is warranted, put its text in followUpQuestionText; otherwise set it to null.",
  "Always phrase exactly ONE next question about the next objective at its difficulty and put it in nextQuestionText.",
  'Respond with JSON only, matching exactly: {"evaluation":{"overall":"strong"|"adequate"|"weak","score":1-5,"correctness":1-5,"depth":1-5,"reasoning":1-5,"communication":1-5,"strengths":[...],"gaps":[...],"followUpRecommended":true|false,"followUpReason":"..."},"followUpQuestionText":null|"...","nextQuestionText":"..."}',
].join(" ");

export function buildCombinedMessages(
  input: CombinedPromptInput,
): LlmChatMessage[] {
  const { evalPlannedQuestion: curQ, generatedQuestion, candidateAnswer } = input;
  const nextQ = input.plannedQuestion;
  const parts: string[] = [];

  parts.push("## Question asked");
  parts.push(generatedQuestion.text);
  parts.push("");
  parts.push("## Curriculum objective to judge against");
  parts.push(`Topic: ${curQ.curriculumTitle}`);
  parts.push(`Objective: ${curQ.objective}`);
  if (input.evalCurriculumDay.tools.length > 0) {
    parts.push(`Relevant tools: ${input.evalCurriculumDay.tools.join(", ")}`);
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
  parts.push("## Next question specification");
  parts.push(`- number: ${nextQ.questionNumber}`);
  parts.push(`- topic: ${nextQ.curriculumTitle}`);
  parts.push(`- objective: ${nextQ.objective}`);
  parts.push(`- difficulty: ${nextQ.difficulty}`);
  if (input.nextCurriculumDay.tools.length > 0) {
    parts.push(`- relevant tools: ${input.nextCurriculumDay.tools.join(", ")}`);
  }
  const focus = purposeFocus(nextQ.purpose);
  if (focus) {
    parts.push(`- focus: ${focus}`);
  }

  parts.push("");
  parts.push(COMBINED_SCHEMA_INSTRUCTION);

  return [
    { role: "system", content: COMBINED_SYSTEM_PROMPT },
    { role: "user", content: parts.join("\n") },
  ];
}

export async function evaluateAnswer(
  input: EvaluatorPromptInput,
  client: LlmClient,
): Promise<LlmCallResult<AnswerEvaluation>> {
  const result = await client.chat(buildEvaluatorMessages(input), {
    temperature: 0.2,
    operation: "evaluation",
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
