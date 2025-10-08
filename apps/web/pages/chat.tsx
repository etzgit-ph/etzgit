import React, { useState } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);
    const historyForAPI = messages.map(({ role, content }) => ({ role, content }));
    try {
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, history: historyForAPI }),
      });
      if (!response.ok) throw new Error('Backend failed to process the request.');
      const data = await response.json();
      const newAiMessage: Message = {
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
      setInput('');
    }
  };

  return (
    <main
      style={{ fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 600, margin: '0 auto' }}
    >
      <h1>OpenAI Chat</h1>
      <div style={{ marginBottom: 16 }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{ margin: '8px 0', textAlign: msg.role === 'user' ? 'right' : 'left' }}
          >
            <span style={{ fontWeight: msg.role === 'user' ? 'bold' : 'normal' }}>
              {msg.role === 'user' ? 'You' : 'AI'}:
            </span>{' '}
            <span>{msg.content}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{ flex: 1, padding: 8 }}
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{ padding: '8px 16px' }}
        >
          Send
        </button>
      </div>
      {loading && <p>Waiting for AI response...</p>}
    </main>
  );
}
