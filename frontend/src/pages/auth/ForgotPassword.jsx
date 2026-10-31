import { FolderKanban } from 'lucide-react';

export default function ForgotPassword() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="empty-state">
        <FolderKanban size={40} />
        <h3>Forgot Password</h3>
        <p>Handled by the auth team.</p>
      </div>
    </div>
  );
}
