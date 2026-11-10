/**
 * "Dot" — the app mascot. A hand-drawn sky-blue speech bubble wearing pink
 * headphones. Pose changes per onboarding screen.
 */

export type MascotPose = "wave" | "think" | "point" | "cheer" | "wink";

const INK = "#000000";
const SKY = "#7bbbff";
const PINK = "#ff99cc";
const MINT = "#99ffcc";

function Eyes(props: { pose: MascotPose }) {
  if (props.pose === "wink") {
    return (
      <g>
        <circle cx={56} cy={54} r={3.6} fill={INK} />
        <path
          d="M78 54 q6 -6 12 0"
          stroke={INK}
          stroke-width="3"
          fill="none"
          stroke-linecap="round"
        />
      </g>
    );
  }
  if (props.pose === "think") {
    return (
      <g>
        <circle cx={56} cy={50} r={3.6} fill={INK} />
        <circle cx={84} cy={50} r={3.6} fill={INK} />
      </g>
    );
  }
  return (
    <g>
      <circle cx={56} cy={54} r={3.6} fill={INK} />
      <circle cx={84} cy={54} r={3.6} fill={INK} />
      <circle cx={57.2} cy={52.8} r={1.1} fill="#fff" />
      <circle cx={85.2} cy={52.8} r={1.1} fill="#fff" />
    </g>
  );
}

function Mouth(props: { pose: MascotPose }) {
  if (props.pose === "think") {
    return (
      <path
        d="M63 71 q4 -3 8 0 q4 3 8 0"
        stroke={INK}
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
      />
    );
  }
  if (props.pose === "cheer") {
    return (
      <path
        d="M58 66 q12 16 24 0 z"
        fill="#26153f"
        stroke={INK}
        stroke-width="3"
        stroke-linejoin="round"
      />
    );
  }
  return (
    <path
      d="M60 68 q10 9 20 0"
      stroke={INK}
      stroke-width="3"
      fill="none"
      stroke-linecap="round"
    />
  );
}

function Arms(props: { pose: MascotPose }) {
  switch (props.pose) {
    case "wave":
      return (
        <g>
          <path
            d="M104 64 q14 -8 18 -22"
            stroke={INK}
            stroke-width="3.5"
            fill="none"
            stroke-linecap="round"
          />
          <circle
            cx={124}
            cy={38}
            r={7}
            fill={SKY}
            stroke={INK}
            stroke-width="3"
          />
          <path
            d="M117 27 q3 -4 8 -3 M120 21 q2 -3 6 -3"
            stroke={PINK}
            stroke-width="3"
            fill="none"
            stroke-linecap="round"
          />
        </g>
      );
    case "cheer":
      return (
        <g>
          <path
            d="M30 62 q-14 -8 -14 -24"
            stroke={INK}
            stroke-width="3.5"
            fill="none"
            stroke-linecap="round"
          />
          <circle
            cx={16}
            cy={34}
            r={7}
            fill={SKY}
            stroke={INK}
            stroke-width="3"
          />
          <path
            d="M108 62 q14 -8 14 -24"
            stroke={INK}
            stroke-width="3.5"
            fill="none"
            stroke-linecap="round"
          />
          <circle
            cx={122}
            cy={34}
            r={7}
            fill={SKY}
            stroke={INK}
            stroke-width="3"
          />
        </g>
      );
    case "point":
      return (
        <g>
          <path
            d="M106 72 q14 2 20 -8"
            stroke={INK}
            stroke-width="3.5"
            fill="none"
            stroke-linecap="round"
          />
          <circle
            cx={128}
            cy={61}
            r={7}
            fill={SKY}
            stroke={INK}
            stroke-width="3"
          />
        </g>
      );
    default:
      return null;
  }
}

function Sparkles(props: { pose: MascotPose }) {
  if (props.pose !== "cheer" && props.pose !== "wink") return null;
  return (
    <g stroke-width="3" stroke-linecap="round">
      <path d="M22 22 l0 10 M17 27 l10 0" stroke={MINT} />
      <path d="M118 100 l0 8 M114 104 l8 0" stroke={PINK} />
    </g>
  );
}

export function Mascot(props: {
  pose: MascotPose;
  size?: number;
  class?: string;
}) {
  const s = () => props.size ?? 120;
  return (
    <svg
      viewBox="0 0 140 120"
      width={s()}
      height={s() * (120 / 140)}
      class={props.class}
      role="img"
      aria-label={`Dot the mascot, ${props.pose}`}
    >
      {/* bubble body with tail */}
      <path
        d="M34 28 C 50 20, 92 20, 106 30 C 116 38, 118 62, 112 78 C 106 94, 90 100, 70 100 C 64 100, 60 103, 56 107 L 50 113 C 48 108, 47 102, 48 98 C 36 96, 27 88, 25 70 C 23 52, 25 33, 34 28 Z"
        fill={SKY}
        stroke={INK}
        stroke-width="3"
        stroke-linejoin="round"
      />
      {/* blush */}
      <circle cx={46} cy={64} r={5} fill={PINK} opacity={0.75} />
      <circle cx={94} cy={64} r={5} fill={PINK} opacity={0.75} />
      <Eyes pose={props.pose} />
      <Mouth pose={props.pose} />
      {/* headphones: pink band outlined in ink + cups */}
      <path
        d="M33 40 C 40 12, 100 12, 107 40"
        stroke={INK}
        stroke-width="10"
        fill="none"
        stroke-linecap="round"
      />
      <path
        d="M33 40 C 40 12, 100 12, 107 40"
        stroke={PINK}
        stroke-width="5"
        fill="none"
        stroke-linecap="round"
      />
      <circle
        cx={34}
        cy={44}
        r={10}
        fill={PINK}
        stroke={INK}
        stroke-width="3"
      />
      <circle
        cx={106}
        cy={44}
        r={10}
        fill={PINK}
        stroke={INK}
        stroke-width="3"
      />
      <Arms pose={props.pose} />
      <Sparkles pose={props.pose} />
    </svg>
  );
}
