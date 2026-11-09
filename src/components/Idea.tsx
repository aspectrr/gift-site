import { createSignal, Show } from "solid-js";
import { useSubmission } from "@solidjs/router";
import { deleteIdeaAction, toggleBoughtAction, addIdeaAction, type ActionResult } from "~/lib/actions";
import type { IdeaDTO } from "~/lib/queries";

function domain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
}

export function IdeaRow(props: { idea: IdeaDTO; isSelf: boolean; personName: string }) {
  const toggle = useSubmission(toggleBoughtAction);
  const del = useSubmission(deleteIdeaAction);
  const [confirming, setConfirming] = createSignal(false);

  return (
    <li class="card p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-display text-lg font-semibold leading-snug">{props.idea.title}</span>
            <Show when={props.idea.size === "big"}>
              <span class="chip border border-gold/40 bg-transparent text-muted" title="Bigger gift">
                big
              </span>
            </Show>
          </div>
          <Show when={props.idea.note}>
            <p class="mt-1 text-sm text-muted">{props.idea.note}</p>
          </Show>
          <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <Show
              when={props.idea.url}
              fallback={<span class="text-xs text-muted">added by {props.idea.addedByName}</span>}
            >
              <a
                href={props.idea.url!}
                target="_blank"
                rel="noopener"
                class="chip border border-line hover:border-accent"
              >
                🔗 {domain(props.idea.url!)}
              </a>
              <span class="text-xs text-muted">added by {props.idea.addedByName}</span>
            </Show>
          </div>
        </div>

        <div class="flex shrink-0 flex-col items-end gap-2">
          <Show
            when={!props.isSelf}
            fallback={
              <Show when={confirming()}>
                <form method="post" action={deleteIdeaAction} class="flex items-center gap-1.5">
                  <input type="hidden" name="ideaId" value={props.idea.id} />
                  <button type="submit" class="chip border border-accent text-accent" disabled={del.pending}>
                    delete for real
                  </button>
                  <button type="button" class="chip opacity-60" onClick={() => setConfirming(false)}>
                    keep
                  </button>
                </form>
              </Show>
            }
          >
            <form method="post" action={toggleBoughtAction}>
              <input type="hidden" name="ideaId" value={props.idea.id} />
              <button
                type="submit"
                class="chip border transition"
                classList={{
                  "border-line text-muted hover:border-accent": !props.idea.bought,
                  "border-sage bg-sage/15 text-ink": props.idea.bought,
                }}
                disabled={toggle.pending}
                title={props.idea.bought ? "Bought — tap to undo" : "Mark as bought (hidden from " + props.personName + ")"}
              >
                {props.idea.bought ? "Bought ✓ (undo)" : "Mark bought"}
              </button>
            </form>
          </Show>
          <Show when={props.isSelf}>
            <Show
              when={confirming()}
              fallback={
                <button
                  type="button"
                  class="text-xs text-muted/70 underline decoration-dotted hover:text-accent"
                  onClick={() => setConfirming(true)}
                >
                  remove
                </button>
              }
            >
              <form method="post" action={deleteIdeaAction} class="flex items-center gap-1.5">
                <input type="hidden" name="ideaId" value={props.idea.id} />
                <button type="submit" class="chip border border-accent text-accent" disabled={del.pending}>
                  delete
                </button>
                <button type="button" class="chip opacity-60" onClick={() => setConfirming(false)}>
                  keep
                </button>
              </form>
            </Show>
          </Show>
        </div>
      </div>
      <Show when={(toggle.result as ActionResult | undefined)?.error === "self"}>
        <p class="mt-2 text-xs font-bold text-accent" role="alert">
          You can't mark gifts on your own list.
        </p>
      </Show>
    </li>
  );
}

export function IdeaForm(props: { personId: number; year: number; personName: string }) {
  const sub = useSubmission(addIdeaAction);
  const result = () => sub.result as ActionResult | undefined;
  return (
    <form method="post" action={addIdeaAction} class="card mt-4 space-y-4 p-4 sm:p-5">
      <input type="hidden" name="personId" value={props.personId} />
      <input type="hidden" name="year" value={props.year} />
      <div>
        <label class="label" for="idea-title">Gift idea</label>
        <input
          class="input"
          id="idea-title"
          name="title"
          placeholder="e.g. Wendy the Frog Squishmallow"
          maxlength="140"
          required
        />
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label" for="idea-url">Link (optional)</label>
          <input
            class="input"
            id="idea-url"
            name="url"
            type="url"
            inputmode="url"
            placeholder="https://…"
            autocomplete="off"
          />
        </div>
        <div>
          <span class="label">Size</span>
          <div class="flex gap-2">
            <label class="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-line text-sm font-bold has-checked:border-accent has-checked:bg-accent-soft">
              <input type="radio" name="size" value="small" checked class="accent-[var(--accent)]" />
              Small
            </label>
            <label class="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-line text-sm font-bold has-checked:border-accent has-checked:bg-accent-soft">
              <input type="radio" name="size" value="big" class="accent-[var(--accent)]" />
              Bigger
            </label>
          </div>
        </div>
      </div>
      <div>
        <label class="label" for="idea-note">Note (optional)</label>
        <textarea
          class="input"
          id="idea-note"
          name="note"
          placeholder="Size, color, where you saw it…"
          maxlength="300"
        />
      </div>
      <div class="flex items-center gap-3">
        <button type="submit" class="btn btn-primary" disabled={sub.pending}>
          {sub.pending ? "Adding…" : `Add to ${props.personName}'s list`}
        </button>
        <Show when={result()?.ok}>
          <span class="chip border border-sage bg-sage/15">Added ✓ add another?</span>
        </Show>
      </div>
      <Show when={result()?.error}>
        <p class="text-sm font-bold text-accent" role="alert">
          {result()!.error}
        </p>
      </Show>
    </form>
  );
}
