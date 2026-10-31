import { Search, Bell, Sparkles } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-breadcrumb">
        <span className="crumb-muted">Workspace</span>
        <span className="crumb-sep">›</span>
        <span className="crumb-active">Projects</span>
      </div>
      <div className="topbar-right">
        <div className="global-search">
          <Search size={13} />
          <input placeholder="Search memory, projects, files..." />
          <span className="kbd">⌘ K</span>
        </div>
        <button className="analyze-btn">
          <Sparkles size={13} /> Analyze repository
        </button>
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={16} />
          <span className="notif-dot" />
        </button>
        <div className="topbar-avatar">MP</div>
      </div>
    </header>
  );
}
