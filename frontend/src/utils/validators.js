export function validateProjectName(name, existingNames = [], currentName = '') {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'Project name is required.';
  const duplicate = existingNames.some(
    (n) => n.trim().toLowerCase() === trimmed.toLowerCase() && n.trim().toLowerCase() !== (currentName || '').trim().toLowerCase()
  );
  if (duplicate) return 'A project with this name already exists.';
  return '';
}

export default validateProjectName;
