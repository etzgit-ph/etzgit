import React, { useState } from 'react';
import TabChat from '../tabs/TabChat';
import TabUpgrades from '../tabs/TabUpgrades';
import TabDebugging from '../tabs/TabDebugging';
import TabSecrets from '../tabs/TabSecrets';

export default function TabNavigation() {
  const [active, setActive] = useState<'chat' | 'upgrades' | 'debugging' | 'secrets'>('chat');
  const [initialNotice, setInitialNotice] = useState<string | undefined>(undefined);
  const [initialPendingProposal, setInitialPendingProposal] = useState<any | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>(undefined);

  async function sendStructuredCommand(cmd: any) {
    setIsSubmitting(true);
    setStatusMessage('Submitting structured command...');
    try {
      const res = await fetch('/api/openai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cmd),
      });

      if (res.ok) {
        const body = await res.json().catch(() => null);
        if (body && body.type === 'proposal') {
          // pass the proposal directly to chat
          setInitialNotice('AI generated a proposal — review below.');
          setActive('chat');
          setInitialPendingProposal(body.payload);
          setStatusMessage('Proposal ready');
          setIsSubmitting(false);
          return;
        }

        setInitialNotice('AI is generating a proposal. Check the Chat tab.');
        setActive('chat');
        setStatusMessage('AI is generating a proposal');
      } else {
        setInitialNotice('Failed to submit command');
        setActive('chat');
        setStatusMessage('Failed to submit command');
      }
    } catch (err) {
      setInitialNotice('Network error submitting command');
      setActive('chat');
      setStatusMessage('Network error submitting command');
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderActive() {
    switch (active) {
      case 'chat':
        return <TabChat initialNotice={initialNotice} initialPendingProposal={initialPendingProposal} />;
      case 'upgrades':
        return <TabUpgrades onCommand={sendStructuredCommand} />;
      case 'debugging':
        return <TabDebugging onCommand={sendStructuredCommand} />;
      case 'secrets':
        return <TabSecrets />;
      default:
        return null;
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: 12, borderBottom: '1px solid #ddd', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setActive('chat')} disabled={isSubmitting}>Chat</button>
          <button onClick={() => setActive('upgrades')} disabled={isSubmitting}>AI Suggested Upgrades</button>
          <button onClick={() => setActive('debugging')} disabled={isSubmitting}>AI Debugging</button>
          <button onClick={() => setActive('secrets')} disabled={isSubmitting}>Secrets</button>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          {statusMessage ? <small>{statusMessage}</small> : null}
        </div>
      </nav>
      <main style={{ flex: 1 }}>{renderActive()}</main>
    </div>
  );
}
