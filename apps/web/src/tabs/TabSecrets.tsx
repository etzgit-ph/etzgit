import React, { useState } from 'react';
import { SecretsUpdateDto } from '../../../../packages/shared-types/src/secrets';

export default function TabSecrets() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [githubPat, setGithubPat] = useState('');
  const [env, setEnv] = useState<'dev' | 'staging' | 'prod'>('dev');
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const dto: SecretsUpdateDto = { openaiApiKey: openaiKey, githubPat, environment: env };

    try {
      const res = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-placeholder' },
        body: JSON.stringify(dto),
      });
      if (res.ok) setStatus('Saved successfully');
      else setStatus('Failed to save');
    } catch (err) {
      setStatus('Network error');
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Secrets Management</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>OpenAI API Key</label>
          <br />
          <input type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} style={{ width: '60%' }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>GitHub PAT</label>
          <br />
          <input type="password" value={githubPat} onChange={(e) => setGithubPat(e.target.value)} style={{ width: '60%' }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Environment</label>
          <br />
          <select value={env} onChange={(e) => setEnv(e.target.value as any)}>
            <option value="dev">dev</option>
            <option value="staging">staging</option>
            <option value="prod">prod</option>
          </select>
        </div>
        <button type="submit">Save Secrets</button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
}
