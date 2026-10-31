import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div>
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">Application settings (postponed).</p>
      <div className="empty-state">
        <SettingsIcon size={40} />
        <h3>Coming soon</h3>
        <p>Settings will be available later.</p>
      </div>
    </div>
  );
}
