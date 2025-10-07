import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { PatchRequestDTOSchema, UpgradeProposalDTOSchema, PatchRequestDTO, UpgradeProposalDTO } from '@aca/shared-types';

@Injectable()
export class LLMService {
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('LLM_API_KEY'),
    });
  }

  async generatePatch(request: PatchRequestDTO): Promise<UpgradeProposalDTO[]> {
    // validate input
    PatchRequestDTOSchema.parse(request);

    // Build a safe system prompt asking for JSON array output matching UpgradeProposalDTO
    const system = `You are a safe code-review assistant. Respond ONLY with a JSON array matching UpgradeProposalDTO: [{\"filePath\":string, \"proposedContent\":string, \"rationale\":string}]`;
    const user = `File: ${request.filePath}\nGoal: ${request.goal}\nCurrent content:\n${request.currentContent}`;

    const resp = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 1500,
    });

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
