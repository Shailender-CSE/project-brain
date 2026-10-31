export function formatDate(iso, options = { year: 'numeric', month: 'short', day: 'numeric' }) {
  try {
    return new Date(iso).toLocaleDateString(undefined, options);
  } catch (e) {
    return iso;
  }
}

export default formatDate;
