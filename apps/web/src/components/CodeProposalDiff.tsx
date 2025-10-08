import React from 'react';

type Props = {
  oldContent: string;
  newContent: string;
};

export default function CodeProposalDiff({ oldContent, newContent }: Props) {
  // Simple line-by-line diff renderer (minimal). For production, use a dedicated library.
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const max = Math.max(oldLines.length, newLines.length);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <div>
        <h4>Old</h4>
        <pre style={{ background: '#fff7f7', padding: 12 }}>
          {oldLines.map((l, i) => (
            <div key={i} style={{ color: newLines[i] === l ? '#444' : '#b00' }}>-{l}</div>
          ))}
        </pre>
      </div>
      <div>
        <h4>New</h4>
        <pre style={{ background: '#f7fff7', padding: 12 }}>
          {newLines.map((l, i) => (
            <div key={i} style={{ color: oldLines[i] === l ? '#444' : '#080' }}>+{l}</div>
          ))}
        </pre>
      </div>
    </div>
  );
}
