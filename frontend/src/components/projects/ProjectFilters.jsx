import { motion } from 'framer-motion';
import './ProjectFilters.css';
import { Search, X } from 'lucide-react';

const FILTERS = [
  { key: 'all', label: 'All Projects' },
  { key: 'synced', label: 'Synced' },
  { key: 'processing', label: 'Processing' },
  { key: 'attention', label: 'Needs Attention' },
];

export default function ProjectFilters({ search, setSearch, filter, setFilter, count }) {
  return (
    <div className="filters-bar">
      <div className="search-input-wrap">
        <Search />
        <input
          className="search-input"
          placeholder="Search projects by name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="clear-btn" onClick={() => setSearch('')} aria-label="Clear search">
            <X size={14} />
          </button>
        )}
      </div>
      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <motion.button
            key={f.key}
            className={`filter-tab${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            layout
          >
            {f.label}
          </motion.button>
        ))}
      </div>
      <div className="project-count">{count} projects</div>
    </div>
  );
}
