import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { PatchRequestDTOSchema, UpgradeProposalDTOSchema, PatchRequestDTO, UpgradeProposalDTO } from '@aca/shared-types';
import { Throttler, defaultThrottler } from '@aca/utils';

const DEFAULT_RETRY = 2;
const RETRY_BASE_MS = 250;

@Injectable()
export class LLMService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(LLMService.name);

  constructor(private readonly configService: ConfigService, private readonly throttler: Throttler = defaultThrottler) {
    // Prefer explicit OPENAI_API_KEY, fallback to legacy LLM_API_KEY if present.
    const apiKey = this.configService.get<string>('OPENAI_API_KEY') ?? this.configService.get<string>('LLM_API_KEY');

    if (!apiKey) {
      // No key configured: keep a client constructed without a key so tests that mock the SDK continue to work.
      this.logger.warn('No OpenAI API key configured (OPENAI_API_KEY or LLM_API_KEY). LLM calls will fail unless provided at runtime.');
      this.openai = new OpenAI({});
    } else {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async generatePatch(request: PatchRequestDTO): Promise<UpgradeProposalDTO[]> {
    // validate input
    PatchRequestDTOSchema.parse(request);

    // Build a safe system prompt asking for JSON array output matching UpgradeProposalDTO
    const system = `You are a safe code-review assistant. Respond ONLY with a JSON array matching UpgradeProposalDTO: [{\"filePath\":string, \"proposedContent\":string, \"rationale\":string}]`;
    const user = `File: ${request.filePath}\nGoal: ${request.goal}\nCurrent content:\n${request.currentContent}`;

    // rate-limit LLM calls
    await this.throttler.acquire();

    // perform the OpenAI call with a small retry/backoff strategy for transient errors
    const resp = await this.callOpenAIWithRetry(
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: 1500,
      },
      DEFAULT_RETRY,
    );

    // Extract text content - depends on SDK response shape
    // Extract the assistant message content. SDK may place text under choices[0].message.content
    // Use a defensive any cast to avoid strict SDK typing issues in tests.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyResp: any = resp;
    const content = anyResp?.choices?.[0]?.message?.content ?? '';

    const cleaned = this.extractJson(content as string);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      throw new Error('LLM did not return valid JSON');
    }

    // Validate using Zod schema
    const proposals = UpgradeProposalDTOSchema.array().parse(parsed);
    return proposals as UpgradeProposalDTO[];
  }

  // Helper: perform OpenAI call with retries on transient failures
  // we accept an `any` payload since the SDK types vary across versions and tests mock the module.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async callOpenAIWithRetry(payload: any, retries = DEFAULT_RETRY): Promise<any> {
    let attempt = 0;
    let lastErr: unknown = null;

    while (attempt <= retries) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // @ts-ignore - delegate to the SDK; tests mock this path
        const res = await this.openai.chat.completions.create(payload);
        return res;
      } catch (err) {
        lastErr = err;
        attempt += 1;
        const waitMs = RETRY_BASE_MS * Math.pow(2, attempt - 1);
        this.logger.warn(`OpenAI call failed on attempt ${attempt}/${retries + 1}: ${String(err)}; retrying in ${waitMs}ms`);
        // last attempt will fall through and throw
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }

    this.logger.error('OpenAI calls exhausted retries', lastErr as any);
    throw new Error('OpenAI request failed after retries');
  }

  // Helper: extract a JSON payload from LLM content.
  // - Prefer fenced code blocks (```json or ```),
  // - then inline code fences (`...`),
  // - then try to extract from the first '['..']' or '{'..'}' pair.
  private extractJson(text: string): string {
    if (!text) return text;

    // 1) fenced code block ```json or ```
    const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const fenceMatch = text.match(fenceRegex);
    if (fenceMatch && fenceMatch[1]) {
      return fenceMatch[1].trim();
    }

    // 2) inline code `...`
    const inlineRegex = /`([^`]+)`/;
    const inlineMatch = text.match(inlineRegex);
    if (inlineMatch && inlineMatch[1]) {
      return inlineMatch[1].trim();
    }

    // 3) try to find a JSON array or object by locating the first bracket and last matching bracket
    const firstArray = text.indexOf('[');
    const firstObj = text.indexOf('{');

    if (firstArray !== -1) {
      const lastArray = text.lastIndexOf(']');
      if (lastArray > firstArray) return text.slice(firstArray, lastArray + 1).trim();
    }

    if (firstObj !== -1) {
      const lastObj = text.lastIndexOf('}');
      if (lastObj > firstObj) return text.slice(firstObj, lastObj + 1).trim();
    }

    // fallback: return original text
    return text.trim();
  }

}
