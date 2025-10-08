import { z } from 'zod';

export const OpenAISchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_DEFAULT_MODEL: z.string().min(1, 'OPENAI_DEFAULT_MODEL is required'),
});

export type OpenAIEnv = z.infer<typeof OpenAISchema>;
