import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useReducedMotion } from 'framer-motion';

export default function WelcomeSection() {
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <motion.section
      className="dash-welcome"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div>
        <p className="dash-greeting">{greeting}, {user?.name?.split(' ')[0] || 'there'}</p>
        <h1 className="dash-title">Welcome back to Project Brain AI</h1>
        <p className="dash-subtitle">Your team's collective engineering knowledge, all in one place.</p>
      </div>
      <div className="dash-welcome-meta">
        <div className="dash-date-chip">
          <Calendar size={14} />
          <span>{dateStr}</span>
        </div>
        <div className="dash-live-chip">
          <span className="dash-live-dot" />
          <span>Live workspace</span>
        </div>
      </div>
    </motion.section>
  );
}
