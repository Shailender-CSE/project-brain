export const dashboardStats = {
  repositories: 8,
  documents: 124,
  commits: 2847,
  coverage: 78,
};

export const knowledgeOverview = {
  totalRepositories: 8,
  totalFilesIndexed: 124,
  totalCommitsProcessed: 2847,
  lastSuccessfulSync: 'Today, 09:42 AM',
  indexingProgress: 78,
};

export const recentActivities = [
  { id: 'a1', type: 'repo', title: 'Repository connected', description: 'Connected banking-application to Brain AI', target: 'banking-application', time: '5 minutes ago', status: 'success' },
  { id: 'a2', type: 'commit', title: 'Commits indexed', description: 'Indexed 128 historical commits', target: 'e-commerce-platform', time: '1 hour ago', status: 'success' },
  { id: 'a3', type: 'document', title: 'Documents uploaded', description: 'Uploaded 6 architecture documents', target: 'healthcare-portal', time: '3 hours ago', status: 'success' },
  { id: 'a4', type: 'sync', title: 'Knowledge base synchronized', description: 'Full re-index completed successfully', target: 'analytics-dashboard', time: 'Yesterday', status: 'success' },
  { id: 'a5', type: 'ai', title: 'AI analysis completed', description: 'Generated onboarding summary for new engineers', target: 'banking-application', time: '2 days ago', status: 'info' },
];

export const recentCommits = [
  { id: 'c1', message: 'feat: add transaction retry logic for failed payments', repo: 'banking-application', author: 'Alex Morgan', hash: 'a1b2c3d', date: 'Oct 28, 2026', branch: 'main' },
  { id: 'c2', message: 'fix: resolve cart total rounding issue', repo: 'e-commerce-platform', author: 'Sam Rivera', hash: 'e4f5g6h', date: 'Oct 27, 2026', branch: 'develop' },
  { id: 'c3', message: 'docs: update API integration guide', repo: 'healthcare-portal', author: 'Alex Morgan', hash: 'i7j8k9l', date: 'Oct 26, 2026', branch: 'main' },
  { id: 'c4', message: 'refactor: optimize commit indexing pipeline', repo: 'analytics-dashboard', author: 'Sam Rivera', hash: 'm0n1o2p', date: 'Oct 25, 2026', branch: 'feature/indexing' },
  { id: 'c5', message: 'chore: bump dependency versions', repo: 'banking-application', author: 'Alex Morgan', hash: 'q3r4s5t', date: 'Oct 24, 2026', branch: 'main' },
];

export const knowledgeSources = [
  { id: 's1', name: 'GitHub Repositories', type: 'github', items: 8, status: 'Synced' },
  { id: 's2', name: 'Architecture Documents', type: 'document', items: 42, status: 'Synced' },
  { id: 's3', name: 'API Specifications', type: 'document', items: 18, status: 'Synced' },
  { id: 's4', name: 'Engineering Notes', type: 'document', items: 64, status: 'Processing' },
];

export default {
  dashboardStats,
  knowledgeOverview,
  recentActivities,
  recentCommits,
  knowledgeSources,
};