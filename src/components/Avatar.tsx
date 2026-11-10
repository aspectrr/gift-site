const COLOR_CLASS: Record<string, string> = {
  mint: "bg-mint",
  sky: "bg-sky",
  bubblegum: "bg-bubblegum",
  peach: "bg-peach",
  lavender: "bg-lavender",
  butter: "bg-butter",
  coral: "bg-coral",
  teal: "bg-teal",
};

const SIZES = {
  sm: "h-8 w-8 text-sm",
  md: "h-12 w-12 text-lg",
  lg: "h-16 w-16 text-2xl",
} as const;

export function Avatar(props: {
  name: string;
  color: string;
  size?: keyof typeof SIZES;
}) {
  return (
    <span
      class={`flex shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink font-display font-normal text-ink ${COLOR_CLASS[props.color] ?? COLOR_CLASS.mint} ${SIZES[props.size ?? "md"]}`}
      aria-hidden="true"
    >
      {props.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
