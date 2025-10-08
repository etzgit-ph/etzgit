import React, { useRef, useEffect, useState } from 'react';
import { ChatInput } from './ChatInput';
import { ChatMessageComponent } from './ChatMessage';
import { ChatMessage } from '../../../packages/shared-types/src/chat';

export const ChatContainer: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (input: string) => {
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);
    const historyForAPI = [...messages, newUserMessage].map(({ role, content, id }) => ({
      role,
      content,
      id,
    }));
    try {
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, history: historyForAPI }),
      });
      if (!response.ok) throw new Error('Backend failed to process the request.');
      const data = await response.json();
      const newAiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
      };
      setMessages((prev) => [...prev, newAiMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'error',
          role: 'assistant',
          content: "Sorry, I can't connect to the service right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <ChatMessageComponent key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
      {loading && <div className="p-2 text-center text-gray-500">Waiting for AI response...</div>}
    </div>
  );
};
