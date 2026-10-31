import { GitCommit } from 'lucide-react';

export default function CommitHistory() {
  return (
    <div>
      <h1 className="page-title">Commit History</h1>
      <p className="page-subtitle">Recent repository commits (separate module).</p>
      <div className="empty-state">
        <GitCommit size={40} />
        <h3>Coming soon</h3>
        <p>Commit tracking lives here.</p>
      </div>
    </div>
  );
}
