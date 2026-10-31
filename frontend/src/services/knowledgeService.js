export async function getKnowledgeSources() { return []; }
export async function uploadDocument(file) { return { id: Date.now(), name: file?.name }; }
export async function connectRepository(repo) { return repo; }
export default { getKnowledgeSources, uploadDocument, connectRepository };
