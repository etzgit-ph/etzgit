import { describe, it, expect } from 'vitest';
import { PatchRequestDTOSchema, UpgradeProposalDTOSchema } from './agent.schema';

describe('Agent DTO Zod Schemas', () => {
  it('should validate PatchRequestDTO', () => {
    expect(() => PatchRequestDTOSchema.parse({
      filePath: 'apps/api/src/main.ts',
      currentContent: '',
      goal: 'Update',
    })).not.toThrow();
  });

  it('should fail validation for missing required field', () => {
    expect(() => PatchRequestDTOSchema.parse({
      currentContent: '',
      goal: 'Update',
    })).toThrow();
  });

  it('should validate UpgradeProposalDTO', () => {
    expect(() => UpgradeProposalDTOSchema.parse({
      filePath: 'apps/api/src/main.ts',
      proposedContent: '',
      rationale: 'Reason',
    })).not.toThrow();
  });
});
