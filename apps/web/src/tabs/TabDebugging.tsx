import React, { useEffect, useState } from 'react';

export default function TabDebugging({ onCommand, isSubmitting }: { onCommand?: (cmd: any) => void; isSubmitting?: boolean }) {
  const [failing, setFailing] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/diagnostics/failing-tests', {
          headers: { Authorization: 'Bearer test-secret' },
        });
        if (res.ok) {
          setFailing(await res.json());
          return;
        }
      } catch (e) {
        // ignore
      }
      // fallback
      setFailing(['apps/api/src/some-test.spec.ts', 'apps/web/src/components/Widget.test.tsx']);
    }
    load();
  }, []);

  function generateFix(path: string) {
    const dto = { type: 'refactor', target: path, action: 'generate-fix' };
    if (onCommand) onCommand(dto);
    else console.log('Debug command', dto);
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>AI Debugging & Analysis</h2>
      <p>Debugging and analysis tools coming soon.</p>
      <ul>
        {failing.map((f) => (
          <li key={f} style={{ marginBottom: 8 }}>
            {f} <button onClick={() => generateFix(f)} disabled={isSubmitting}>Generate Fix Proposal</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
