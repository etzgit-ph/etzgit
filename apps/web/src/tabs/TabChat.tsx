import React from 'react';
import ChatContainer from '../components/ChatContainer';

export default function TabChat({ initialNotice, initialPendingProposal }: { initialNotice?: string; initialPendingProposal?: any }) {
  return <ChatContainer initialNotice={initialNotice} initialPendingProposal={initialPendingProposal} />;
}
