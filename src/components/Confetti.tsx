/** Scattered pastel confetti dots — Hatch's signature decoration. Never a pattern. */

const PRESETS: Array<Array<{ x: string; y: string; s: number; c: string }>> = [
  [
    { x: "4%", y: "12%", s: 8, c: "#ff99cc" },
    { x: "88%", y: "6%", s: 6, c: "#7bbbff" },
    { x: "94%", y: "38%", s: 10, c: "#ffcc99" },
    { x: "8%", y: "78%", s: 6, c: "#99ffcc" },
    { x: "78%", y: "88%", s: 8, c: "#ff99cc" },
    { x: "38%", y: "4%", s: 6, c: "#99ffcc" },
  ],
  [
    { x: "6%", y: "30%", s: 10, c: "#7bbbff" },
    { x: "90%", y: "16%", s: 6, c: "#99ffcc" },
    { x: "84%", y: "70%", s: 8, c: "#ffcc99" },
    { x: "16%", y: "86%", s: 6, c: "#ff99cc" },
    { x: "50%", y: "8%", s: 8, c: "#ffcc99" },
  ],
  [
    { x: "10%", y: "8%", s: 6, c: "#ffcc99" },
    { x: "92%", y: "26%", s: 8, c: "#99ffcc" },
    { x: "70%", y: "90%", s: 6, c: "#7bbbff" },
    { x: "4%", y: "62%", s: 8, c: "#ff99cc" },
  ],
];

export function Confetti(props: { preset?: number; class?: string }) {
  const dots = PRESETS[(props.preset ?? 0) % PRESETS.length];
  return (
    <div class={`pointer-events-none absolute inset-0 overflow-hidden ${props.class ?? ""}`} aria-hidden="true">
      {dots.map((d) => (
        <span
          style={{
            position: "absolute",
            left: d.x,
            top: d.y,
            width: `${d.s}px`,
            height: `${d.s}px`,
            "border-radius": "50%",
            background: d.c,
          }}
        />
      ))}
    </div>
  );
}
