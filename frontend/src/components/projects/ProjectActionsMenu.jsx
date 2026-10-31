import { useState, useRef, useEffect } from 'react';
import { MoreVertical, BookOpen, Settings, Eye, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProjectActionsMenu({ onExplore, onManageSources, onViewDetails, onRemove }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const items = [
    { label: 'Explore Knowledge', icon: BookOpen, onClick: onExplore },
    { label: 'Manage Knowledge Sources', icon: Settings, onClick: onManageSources },
    { label: 'View Project Details', icon: Eye, onClick: onViewDetails },
    { label: 'Remove from Brain AI', icon: Trash2, onClick: onRemove, danger: true },
  ];

  return (
    <div className="menu-wrap" ref={ref}>
      <button className="menu-btn" onClick={() => setOpen((v) => !v)} aria-label="More options">
        <MoreVertical size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="menu-dropdown"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={`menu-item${item.danger ? ' danger' : ''}`}
                  onClick={() => { setOpen(false); item.onClick(); }}
                >
                  <Icon size={14} /> {item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
