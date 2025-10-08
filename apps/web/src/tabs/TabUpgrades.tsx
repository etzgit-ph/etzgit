import React from 'react';

export default function TabUpgrades({ onCommand, isSubmitting }: { onCommand?: (cmd: any) => void; isSubmitting?: boolean }) {
  function selectUpgrade() {
    const dto = { type: 'dependency', target: 'next', action: 'upgrade-major-version' };
    if (onCommand) onCommand(dto);
    else console.log('Upgrade command', dto);
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>AI Suggested Upgrades</h2>
      <p>Suggested upgrades UI coming soon.</p>
      <button onClick={selectUpgrade} disabled={isSubmitting}>Simulate: Upgrade Next.js</button>
    </div>
  );
}
