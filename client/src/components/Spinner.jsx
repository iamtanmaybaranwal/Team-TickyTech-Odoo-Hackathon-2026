export default function Spinner({ size = 24 }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-surface-border border-t-accent"
      style={{ width: size, height: size }}
    />
  );
}
