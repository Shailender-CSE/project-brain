import { FolderKanban } from 'lucide-react';

export default function Signup() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="empty-state">
        <FolderKanban size={40} />
        <h3>Signup</h3>
        <p>Authentication is handled by another team member.</p>
      </div>
    </div>
  );
}
