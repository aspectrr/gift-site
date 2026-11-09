const COLOR_CLASS: Record<string, string> = {
  cranberry: "bg-cranberry",
  sage: "bg-sage",
  gold: "bg-gold",
  plum: "bg-plum",
  teal: "bg-teal",
  terracotta: "bg-terracotta",
  blue: "bg-blue",
  pink: "bg-pink",
};

const SIZES = {
  sm: "h-8 w-8 text-sm",
  md: "h-12 w-12 text-lg",
  lg: "h-16 w-16 text-2xl",
} as const;

export function Avatar(props: { name: string; color: string; size?: keyof typeof SIZES }) {
  return (
    <span
      class={`flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-[#fffdf9] ring-2 ring-paper ${COLOR_CLASS[props.color] ?? COLOR_CLASS.cranberry} ${SIZES[props.size ?? "md"]}`}
      aria-hidden="true"
    >
      {props.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
