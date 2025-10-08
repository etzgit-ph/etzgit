export type ProposalDetail = {
  id: string; // uuid
  path: string;
  oldContent: string;
  newContent: string;
  rationale?: string;
  author?: string;
  createdAt: string; // ISO
};

export type ProposalResponse = {
  type: 'proposal';
  payload: ProposalDetail;
};

export type ChatResponse = {
  type: 'chat';
  payload: { text: string };
};

export type OpenaiResponse = ProposalResponse | ChatResponse;

export type UpgradeCommandDto = {
  type: 'dependency' | 'refactor' | 'security';
  target: string; // e.g., 'next' or 'apps/web/'
  action: string; // e.g., 'upgrade-major-version' or 'apply-eslint-fix'
};

export type DebugCommandDto = {
  type: 'refactor' | 'debug';
  target: string; // file or test path
  action: string;
};
