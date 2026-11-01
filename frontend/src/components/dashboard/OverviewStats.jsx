import { motion } from 'framer-motion';
import { Github, FileText, GitCommit, PieChart } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { useState, useEffect } from 'react';
import apiRequest from '../../services/api.js';

function CountUp({ value, suffix = '', reduce }) {
  const [display, setDisplay] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) { setDisplay(value); return; }
    let raf;
    const start = performance.now();
    const duration = 900;
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(value * progress));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);
  return <>{display.toLocaleString()}{suffix}</>;
}

export default function OverviewStats() {
  const reduce = useReducedMotion();
  const [stats, setStats] = useState({ repositories: 0, documents: 0, commits: 0, coverage: 0 });

  useEffect(() => {
    apiRequest('/api/dashboard')
      .then((data) => { if (data?.stats) setStats(data.stats); })
      .catch(() => {}); // non-fatal: show zeros if backend unreachable
  }, []);

  const cards = [
    { label: 'Connected Repositories', value: stats.repositories, icon: Github, trend: 'From vector DB', color: 'primary' },
    { label: 'Indexed Documents', value: stats.documents, icon: FileText, trend: 'Fully indexed', color: 'secondary' },
    { label: 'Commits Analyzed', value: stats.commits, icon: GitCommit, trend: 'Live data', color: 'primary' },
    { label: 'Knowledge Coverage', value: stats.coverage, icon: PieChart, trend: 'Calculated', color: 'secondary', suffix: '%' },
  ];

  return (
    <motion.section
      className="stats-grid"
      initial={reduce ? false : 'hidden'}
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduce ? 0 : 0.08 } },
      }}
    >
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            className="stat-card"
            variants={reduce ? {} : { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
            whileHover={reduce ? {} : { y: -3 }}
            transition={{ duration: 0.25 }}
          >
            <div className="stat-card-top">
              <div className={`stat-icon stat-icon-${c.color}`}>
                <Icon size={18} />
              </div>
              <span className="stat-trend">{c.trend}</span>
            </div>
            <div className="stat-value">
              <CountUp value={c.value} suffix={c.suffix || ''} reduce={reduce} />
            </div>
            <div className="stat-label">{c.label}</div>
            {c.label === 'Knowledge Coverage' && (
              <div className="stat-progress">
                <div className="stat-progress-bar" style={{ width: `${c.value}%` }} />
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.section>
  );
}
