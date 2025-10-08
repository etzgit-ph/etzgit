import React, { useState } from 'react';
import CodeProposalDiff from './CodeProposalDiff';
import { ProposalDetail } from '../../../../packages/shared-types/src/command';

type Props = {
  proposal: ProposalDetail;
  onApprove: (id: string) => void;
  onCancel: (id: string) => void;
};

export default function ProposalReview({ proposal, onApprove, onCancel }: Props) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div style={{ position: 'relative', padding: 24, background: '#fff', border: '1px solid #ddd' }}>
      <h3>AI Proposal</h3>
      <p><strong>Rationale:</strong> {proposal.rationale}</p>
      <CodeProposalDiff oldContent={proposal.oldContent} newContent={proposal.newContent} />

      <div style={{ marginTop: 12 }}>
        {confirming ? (
          <>
            <button onClick={() => onApprove(proposal.id)} style={{ background: 'green', color: '#fff' }}>Confirm Approve</button>
            <button onClick={() => setConfirming(false)} style={{ marginLeft: 8 }}>Back</button>
          </>
        ) : (
          <>
            <button onClick={() => setConfirming(true)} style={{ background: 'red', color: '#fff' }}>Approve & Commit</button>
            <button onClick={() => onCancel(proposal.id)} style={{ marginLeft: 8 }}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}
