import { Globe, GitBranch } from 'lucide-react';

/**
 * ScopeSelector — shared across Chat, Impact, and Knowledge Risk tabs.
 * Props:
 *   scope        string  "" = All data, or "owner/repo"
 *   onChange     fn(scope: string)
 *   repositories array   [{name, id}] from /api/knowledge/sources
 */
export default function ScopeSelector({ scope, onChange, repositories = [] }) {
  return (
    <div className="scope-selector">
      <span className="scope-label">
        {scope ? <GitBranch size={12} /> : <Globe size={12} />}
        Scope:
      </span>
      <select
        className="scope-select"
        value={scope}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Analysis scope"
      >
        <option value="">All data</option>
        {repositories.map((r) => (
          <option key={r.id || r.name} value={r.name}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  );
}
