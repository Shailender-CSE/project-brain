import { useParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as projectService from '../services/projectService';

export default function ProjectKnowledge() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (projectId) {
      projectService.getProject(projectId).then(setProject).catch(() => setProject(null));
    }
  }, [projectId]);

  return (
    <div>
      <h1 className="page-title">Project Knowledge</h1>
      <p className="page-subtitle">
        {project ? project.name : (projectId ? `Project ${projectId}` : 'Select a project')}
      </p>
      <div className="empty-state">
        <BookOpen size={40} />
        <h3>Knowledge base</h3>
        <p>Document and repository management lives here (separate module).</p>
      </div>
    </div>
  );
}
