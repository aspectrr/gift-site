import { createMemo, createSignal, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { useSubmission } from "@solidjs/router";
import { addPersonAction, type ActionResult } from "~/lib/actions";
import { matches } from "~/lib/search";
import { CATEGORY_LABELS } from "~/lib/categories";
import type { FamilyData, MemberDTO } from "~/lib/queries";
import { Avatar } from "./Avatar";
import { Mascot } from "./Mascot";

function haystack(m: MemberDTO): string {
  return [m.name, m.interestsNow, ...Object.values(m.favorites), ...m.ideas.map((i) => i.title)].join(" ");
}

function whenLabel(days: number): string {
  if (days === 0) return "today 🎂";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

function PersonCard(props: { member: MemberDTO; days?: number; index: number }) {
  return (
    <A
      href={`/people/${props.member.id}`}
      class="card block p-4 transition active:scale-[0.99] hover:bg-cream"
      style={{ "animation-delay": `${Math.min(props.index, 12) * 35}ms` }}
    >
      <div class="flex items-start gap-3">
        <Avatar name={props.member.name} color={props.member.color} />
        <div class="min-w-0 flex-1">
          <h3 class="truncate font-display text-xl leading-tight text-ink">{props.member.name}</h3>
          <p class="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-slate">
            {props.member.interestsNow ||
              (Object.keys(props.member.favorites).length > 0
                ? favoritePreview(props.member)
                : "Nothing on the chart yet.")}
          </p>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <Show when={props.member.ideas.length > 0}>
              <span class="chip">{props.member.ideas.length} idea{props.member.ideas.length === 1 ? "" : "s"}</span>
            </Show>
            <Show when={props.days !== undefined}>
              <span class="chip border-ink bg-peach">🎂 {whenLabel(props.days!)}</span>
            </Show>
            <Show when={props.member.ideas.length === 0 && props.days === undefined}>
              <span class="chip opacity-60">tap to fill in</span>
            </Show>
          </div>
        </div>
      </div>
    </A>
  );
}

function favoritePreview(m: MemberDTO): string {
  const first = Object.entries(m.favorites)[0];
  return first ? `${CATEGORY_LABELS[first[0]] ?? first[0]}: ${first[1]}` : "";
}

const SECTION_DOTS = ["bg-sky", "bg-bubblegum", "bg-peach", "bg-mint"];

function Section(props: { title: string; members: MemberDTO[]; birthdays: Map<number, number>; offset: number }) {
  return (
    <section class="mt-8">
      <h2 class="mb-3 flex items-center gap-2 font-display text-2xl text-ink">
        <span class={`inline-block h-3 w-3 rounded-full border border-ink ${SECTION_DOTS[props.offset % 4]}`} aria-hidden="true" />
        {props.title} <span class="font-body text-sm font-bold text-slate">({props.members.length})</span>
      </h2>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <For each={props.members}>
          {(m, i) => (
            <div class="animate-rise">
              <PersonCard member={m} days={props.birthdays.get(m.id)} index={props.offset + i()} />
            </div>
          )}
        </For>
      </div>
    </section>
  );
}

const AddSomeone = () => {
  const sub = useSubmission(addPersonAction);
  const result = () => sub.result as ActionResult | undefined;
  return (
    <details class="mt-10">
      <summary class="btn btn-ghost w-full sm:w-auto">＋ Add someone</summary>
      <form method="post" action={addPersonAction} class="card mt-3 flex flex-wrap items-end gap-3 p-4">
        <div class="min-w-48 flex-1">
          <label class="label" for="add-name">Name</label>
          <input class="input" id="add-name" name="name" placeholder="Grandpa Joe…" maxlength="40" required />
        </div>
        <label class="flex min-h-11 items-center gap-2 text-sm font-bold text-ink">
          <input type="checkbox" name="isKid" class="size-5 accent-black" />
          Kid
        </label>
        <button type="submit" class="btn btn-primary" disabled={sub.pending}>
          {sub.pending ? "Adding…" : "Add"}
        </button>
        <Show when={result()?.error === "exists"}>
          <p class="w-full text-sm font-bold text-plum" role="alert">
            That name is already on the chart.
          </p>
        </Show>
      </form>
    </details>
  );
};

export function PeopleDirectory(props: { family: FamilyData }) {
  const [q, setQ] = createSignal("");
  const birthdays = new Map(props.family.upcoming.map((u) => [u.id, u.days]));

  const filtered = createMemo(() => {
    const query = q();
    const list = props.family.members.filter((m) => (query ? matches(haystack(m), query) : true));
    return { adults: list.filter((m) => !m.isKid), kids: list.filter((m) => m.isKid) };
  });
  const total = () => filtered().adults.length + filtered().kids.length;

  return (
    <div>
      <Show when={props.family.upcoming.length > 0}>
        <nav aria-label="Upcoming birthdays" class="-mx-4 mb-6 overflow-x-auto px-4 pb-1">
          <div class="flex gap-2">
            <For each={props.family.upcoming}>
              {(u) => (
                <A
                  href={`/people/${u.id}`}
                  class="chip py-1.5 transition hover:bg-mint"
                  classList={{ "bg-mint": u.days === 0 }}
                >
                  <Avatar name={u.name} color={u.color} size="sm" />
                  <span>
                    {u.name} · {u.label} · {whenLabel(u.days)}
                  </span>
                </A>
              )}
            </For>
          </div>
        </nav>
      </Show>

      <div class="sticky top-14 z-30 -mx-4 bg-cream/90 px-4 py-3 backdrop-blur-md">
        <label class="relative block max-w-md">
          <span class="sr-only">Search the chart</span>
          <svg
            class="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            class="input rounded-xl pl-11"
            type="search"
            placeholder={`Search ${props.family.members.length} people — "coffee", "Zelda"…`}
            value={q()}
            onInput={(e) => setQ(e.currentTarget.value)}
          />
        </label>
      </div>

      <Show
        when={total() > 0}
        fallback={
          <div class="card mt-8 p-8 text-center">
            <div class="flex justify-center"><Mascot pose="think" size={110} /></div>
            <p class="mt-2 font-display text-2xl text-ink">No one matches “{q()}”</p>
            <p class="mx-auto mt-2 max-w-sm text-left text-sm text-slate">
              Search checks names, favorites, interests, and gift ideas — try fewer words.
            </p>
          </div>
        }
      >
        <Show when={filtered().adults.length > 0}>
          <Section title="Grown-ups" members={filtered().adults} birthdays={birthdays} offset={0} />
        </Show>
        <Show when={filtered().kids.length > 0}>
          <Section title="Kids" members={filtered().kids} birthdays={birthdays} offset={filtered().adults.length} />
        </Show>
      </Show>

      <Show when={q()}>
        <p class="mt-4 text-center text-xs text-slate">
          {total()} of {props.family.members.length} shown
        </p>
      </Show>

      <AddSomeone />
    </div>
  );
}
