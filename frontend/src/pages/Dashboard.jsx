import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import WelcomeSection from '../components/dashboard/WelcomeSection';
import OverviewStats from '../components/dashboard/OverviewStats';
import KnowledgeOverview from '../components/dashboard/KnowledgeOverview';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';
import RecentCommits from '../components/dashboard/RecentCommits';
import KnowledgeSourcesOverview from '../components/dashboard/KnowledgeSourcesOverview';
import './Dashboard.css';

export default function Dashboard() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="dashboard"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <WelcomeSection />
      <OverviewStats />
      <div className="dashboard-grid">
        <KnowledgeOverview />
        <QuickActions />
      </div>
      <div className="dashboard-grid dashboard-grid-2">
        <RecentActivity />
        <RecentCommits />
      </div>
      <KnowledgeSourcesOverview />
    </motion.div>
  );
}
