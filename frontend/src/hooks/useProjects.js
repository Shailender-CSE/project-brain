import { useProjects as useProjectsContext } from '../context/ProjectContext';

export function useProjects() {
  return useProjectsContext();
}

export default useProjects;
