export function resolveTextColor(type = "default") {
  const map = {
    default: "var(--color-text)",
    muted: "var(--color-text-muted)",
    inverse: "var(--color-text-inverse)",
    primary: "var(--color-primary)",
  };

  return {
    "--text-color": map[type] || map.default,
  };
}
