import { createSignal, For, Show } from "solid-js";
import { useSubmission } from "@solidjs/router";
import { joinAction, pickAction, type ActionResult } from "~/lib/actions";
import type { FamilyData } from "~/lib/queries";
import { Avatar } from "./Avatar";

export function WhoPicker(props: { family: FamilyData }) {
  const join = useSubmission(joinAction);
  const pick = useSubmission(pickAction);
  const [typed, setTyped] = createSignal("");

  const result = () => join.result as ActionResult | undefined;
  const existsMatch = () => (result() && "match" in result()! ? result()!.match : undefined);

  return (
    <div class="mx-auto max-w-lg animate-rise">
      <div class="card p-6 sm:p-8">
        <h1 class="font-display text-3xl font-semibold tracking-tight">
          {props.family.members.length === 0 ? "You're the first one here 🎉" : "Who's here?"}
        </h1>
        <p class="mt-2 text-muted">
          {props.family.members.length === 0
            ? "Add your name to start the family chart. Everyone else joins the same way."
            : "Pick your name — this phone will remember you."}
        </p>

        <Show when={props.family.members.length > 0}>
          <div class="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <For each={props.family.members.slice(0, 21)}>
              {(m) => (
                <form method="post" action={pickAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    type="submit"
                    class="flex w-full items-center gap-2.5 rounded-2xl border border-line bg-bg px-3 py-3 text-left transition active:scale-[0.98] hover:border-accent hover:bg-accent-soft"
                    disabled={pick.pending}
                  >
                    <Avatar name={m.name} color={m.color} size="sm" />
                    <span class="truncate text-sm font-bold">{m.name}</span>
                  </button>
                </form>
              )}
            </For>
          </div>

          <div class="mt-7 flex items-center gap-3 text-xs font-bold text-muted" role="separator">
            <span class="h-px flex-1 bg-line" />
            or
            <span class="h-px flex-1 bg-line" />
          </div>
        </Show>

        <form method="post" action={joinAction} class="mt-5 flex gap-2">
          <input
            class="input flex-1"
            name="name"
            placeholder="Type your name…"
            value={typed()}
            onInput={(e) => setTyped(e.currentTarget.value)}
            autocomplete="given-name"
            maxlength="40"
            required
          />
          <button type="submit" class="btn btn-primary px-5" disabled={join.pending}>
            {join.pending ? "…" : "That's me"}
          </button>
        </form>

        <Show when={existsMatch()}>
          {(match) => (
            <div class="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-gold/50 bg-accent-soft px-4 py-3" role="alert">
              <p class="text-sm font-bold">
                {match().name} is already on the chart — that you?
              </p>
              <form method="post" action={pickAction}>
                <input type="hidden" name="id" value={match().id} />
                <button type="submit" class="btn btn-primary min-h-0 py-2" disabled={pick.pending}>
                  Yes
                </button>
              </form>
            </div>
          )}
        </Show>

        <Show when={result()?.error === "empty"}>
          <p class="mt-3 text-sm font-bold text-accent" role="alert">
            Type a name first — even a nickname works.
          </p>
        </Show>
      </div>
      <p class="mt-4 text-center text-xs text-muted">
        Names are stored exactly as typed. Change yours anytime from your page.
      </p>
    </div>
  );
}
