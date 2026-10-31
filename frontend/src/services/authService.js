export async function login(credentials) { return { token: 'mock', user: null }; }
export async function signup(data) { return { token: 'mock', user: null }; }
export async function logout() { return true; }
export default { login, signup, logout };
