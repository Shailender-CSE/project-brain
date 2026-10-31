import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, BookOpen, Bot, GitBranch, MessageSquare, ChevronDown, MoreHorizontal, Circle } from 'lucide-react';

const workspaceNav = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', path: '/projects', icon: FolderKanban },
  { label: 'Knowledge', path: '/knowledge', icon: BookOpen },
  { label: 'Assistant', path: '/assistant', icon: Bot },
];

const intelligenceNav = [
  { label: 'Knowledge graph', path: '/project-knowledge', icon: GitBranch },
  { label: 'Recent answers', path: '/assistant', icon: MessageSquare },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">PB</div>
        <div>
          <div className="sidebar-logo-title">PROJECT BRAIN</div>
          <div className="sidebar-logo-sub">DELIVERY MEMORY SYSTEM</div>
        </div>
      </div>

      <button className="workspace-selector">
        <span className="workspace-dot" />
        <span>Innovista workspace</span>
        <ChevronDown size={12} />
      </button>

      <div className="sidebar-section">
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="sidebar-nav">
          {workspaceNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path + item.label} to={item.path} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Icon size={14} />
                <span>{item.label}</span>
                {item.label === 'Assistant' && <span className="assistant-dot" />}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">INTELLIGENCE</div>
        <nav className="sidebar-nav">
          {intelligenceNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path + item.label} to={item.path} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Icon size={14} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="system-status">
          <Circle size={8} className="status-online" />
          <div>
            <div className="system-status-title">Memory engine online</div>
            <div className="system-status-sub">Last indexed 2m ago</div>
          </div>
        </div>
        <div className="user-profile">
          <div className="user-avatar">MP</div>
          <div className="user-info">
            <div className="user-name">Maya Patel</div>
            <div className="user-role">Product engineer</div>
          </div>
          <button className="user-menu-btn" aria-label="User menu"><MoreHorizontal size={14} /></button>
        </div>
      </div>
    </aside>
  );
}
