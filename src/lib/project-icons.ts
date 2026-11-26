const PROJECT_STYLES = [
  { icon: 'fa-solid fa-rocket', gradient: 'from-[#0C66E4] to-[#579DFF]' },
  { icon: 'fa-solid fa-diagram-project', gradient: 'from-violet-600 to-indigo-400' },
  { icon: 'fa-solid fa-cubes', gradient: 'from-emerald-600 to-teal-400' },
  { icon: 'fa-solid fa-code', gradient: 'from-sky-600 to-cyan-400' },
  { icon: 'fa-solid fa-briefcase', gradient: 'from-amber-500 to-orange-400' },
  { icon: 'fa-solid fa-bolt', gradient: 'from-rose-600 to-pink-400' },
  { icon: 'fa-solid fa-compass', gradient: 'from-blue-600 to-indigo-400' },
  { icon: 'fa-solid fa-gem', gradient: 'from-fuchsia-600 to-purple-400' },
];

export function getProjectVisual(seed?: string) {
  const str = (seed || 'TASK').toUpperCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PROJECT_STYLES[Math.abs(hash) % PROJECT_STYLES.length];
}
