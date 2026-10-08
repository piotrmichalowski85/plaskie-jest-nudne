export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 text-[var(--moss-dark)]">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#1f4128"/><circle cx="46" cy="20" r="7" fill="#e8b84a"/><path d="M4 52 L20 26 L28 38 L38 20 L60 52 Z" fill="#6fa27d"/><path d="M4 52 L16 40 L26 48 L36 36 L48 48 L60 52 Z" fill="#c9d9c6" opacity=".9"/></svg>
      <span className="display whitespace-nowrap text-[1.2rem] sm:text-[1.45rem] tracking-[.05em] translate-y-[2px]">Płaskie jest nudne</span>
    </span>
  );
}
