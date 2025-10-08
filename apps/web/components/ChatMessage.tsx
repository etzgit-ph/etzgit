import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from '@etzgit-ph/shared-types/src/chat';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface Props {
  message: ChatMessage;
}

export const ChatMessageComponent: React.FC<Props> = ({ message }) => {
  return (
    <div
      className={`my-2 p-3 rounded-lg ${
        message.role === 'user'
          ? 'bg-blue-50 text-right'
          : message.role === 'assistant'
            ? 'bg-gray-100 text-left'
            : 'bg-gray-200 text-left'
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" {...props}>
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {message.content}
      </ReactMarkdown>
    </div>
  );
};
