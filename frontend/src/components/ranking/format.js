export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

export const formatValue = (v) => Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
