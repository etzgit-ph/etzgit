import { z } from 'zod';

export const OpenAISchema = z.object({
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_DEFAULT_MODEL: z.string().min(1).optional(),
});

export type OpenAIConfig = z.infer<typeof OpenAISchema>;
