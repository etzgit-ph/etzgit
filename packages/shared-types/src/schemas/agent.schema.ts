import { z } from 'zod';

export const PatchRequestDTOSchema = z.object({
  filePath: z.string().min(1),
  currentContent: z.string(),
  goal: z.string(),
});

export const UpgradeProposalDTOSchema = z.object({
  filePath: z.string().min(1),
  proposedContent: z.string(),
  rationale: z.string(),
});
