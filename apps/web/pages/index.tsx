import React, { useEffect, useState } from 'react';

type Status = {
  version?: string;
  commitHash?: string;
  uptime?: number;
  lastAutonomousPR?: { url?: string; number?: number; title?: string } | null;
  repoClean?: boolean | null;
} | null;

export default function Home() {
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    async function load() {
      try {
        const base =
          (process && process.env && process.env.NEXT_PUBLIC_API_URL) ||
          (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_API_URL) ||
          '';
        const url = base ? `${base.replace(/\/$/, '')}/api/v1/status` : '/api/v1/status';
        const res = await fetch(url);
        if (res.ok) {
          setStatus(await res.json());
          return;
        }
      } catch (e) {
        // ignore
      }

      // fallback: try to fetch VERSION.txt
      try {
        const v = await fetch('/VERSION.txt');
        if (v.ok) setStatus({ version: await v.text() });
      } catch (e) {}
    }
    load();
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Agent Status</h1>
      {status ? (
        <div>
          <p>
            <strong>Version:</strong> {status.version ?? 'unknown'}
          </p>
          <p>
            <strong>Commit:</strong> {status.commitHash ?? 'unknown'}
          </p>
          <p>
            <strong>Repo clean:</strong> {String(status.repoClean ?? 'unknown')}
          </p>
          {status.lastAutonomousPR ? (
            <p>
              <strong>Last Autonomous PR:</strong>{' '}
              <a href={status.lastAutonomousPR.url} target="_blank" rel="noreferrer">
                {status.lastAutonomousPR.title ?? status.lastAutonomousPR.url}
              </a>
            </p>
          ) : null}
          <pre>{JSON.stringify(status, null, 2)}</pre>
        </div>
      ) : (
        <p>Unable to fetch status. Ensure the API is running.</p>
      )}
    </main>
  );
}
