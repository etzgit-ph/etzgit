export interface PatchRequestDTO {
  filePath: string;
  currentContent: string;
  goal: string;
}

export interface UpgradeProposalDTO {
  filePath: string;
  proposedContent: string;
  rationale: string;
}
