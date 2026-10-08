const H = 7;
const V = 12;

const build = () => {
  const pts = [];
  for (let i = 0; i < H; i++) pts.push({ left: `${(i / (H - 1)) * 100}%`, top: "0%" });
  for (let i = 1; i < V - 1; i++) pts.push({ left: "100%", top: `${(i / (V - 1)) * 100}%` });
  for (let i = H - 1; i >= 0; i--) pts.push({ left: `${(i / (H - 1)) * 100}%`, top: "100%" });
  for (let i = V - 2; i > 0; i--) pts.push({ left: "0%", top: `${(i / (V - 1)) * 100}%` });
  return pts;
};

const POINTS = build();

export const MarqueeBulbs = () => (
  <div className="absolute inset-[5px] pointer-events-none z-20" aria-hidden>
    {POINTS.map((p, i) => (
      <span key={i} className={`rk-bulb ${i % 2 ? "rk-bulb-b" : ""}`} style={{ left: p.left, top: p.top }} />
    ))}
  </div>
);
