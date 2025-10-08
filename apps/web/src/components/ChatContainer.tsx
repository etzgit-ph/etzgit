import React, { useState } from 'react';
import { ProposalDetail, OpenaiResponse } from '../../../../packages/shared-types/src/command';
import ProposalReview from './ProposalReview';

export default function ChatContainer({ initialNotice, initialPendingProposal }: { initialNotice?: string; initialPendingProposal?: any } = {}) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [pendingProposal, setPendingProposal] = useState<ProposalDetail | null>(null);

  React.useEffect(() => {
    if (initialNotice) setMessages((m) => [...m, initialNotice]);
  }, [initialNotice]);

  React.useEffect(() => {
    if (initialPendingProposal) setPendingProposal(initialPendingProposal as ProposalDetail);
  }, [initialPendingProposal]);

  async function sendPrompt() {
    const res = await fetch('/openai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: input }),
    });

    const data: OpenaiResponse = await res.json();
    if (data.type === 'proposal') {
      setPendingProposal(data.payload);
    } else if (data.type === 'chat') {
      setMessages((m) => [...m, data.payload.text]);
    }
    setInput('');
  }

  async function handleApprove(id: string) {
    // call approval endpoint and show success message with branch
    const res = await fetch('/openai/approve-proposal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, path: pendingProposal?.path, newContent: pendingProposal?.newContent }),
    });
    const data = await res.json();
    setPendingProposal(null);
    if (data.success) {
      setMessages((m) => [
        ...m,
        `✅ Proposal approved! Branch: ${data.branch || 'unknown'}${data.prUrl ? ` | PR: ${data.prUrl}` : ''}`,
      ]);
    } else {
      setMessages((m) => [...m, '❌ Approval failed.']);
    }
  }

  function handleCancel(id: string) {
    setPendingProposal(null);
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Chat</h2>
      {pendingProposal ? (
        <ProposalReview proposal={pendingProposal} onApprove={() => handleApprove(pendingProposal.id)} onCancel={() => handleCancel(pendingProposal.id)} />
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} style={{ width: '60%' }} />
            <button onClick={sendPrompt}>Send</button>
          </div>
          <div>
            {messages.map((m, i) => (
              <div key={i} style={{ padding: 8, border: '1px solid #eee', marginBottom: 6 }}>
                {m}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
