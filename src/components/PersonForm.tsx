import { createSignal, For, Show } from "solid-js";
import { useSubmission } from "@solidjs/router";
import { deletePersonAction, savePersonAction, type ActionResult } from "~/lib/actions";
import { CATEGORIES } from "~/lib/categories";
import type { PersonData } from "~/lib/queries";

export function PersonForm(props: { data: PersonData; doneHref: string }) {
  const sub = useSubmission(savePersonAction);
  const result = () => sub.result as ActionResult | undefined;
  const [confirmDelete, setConfirmDelete] = createSignal(false);
  const p = () => props.data.person;

  return (
    <>
    <form method="post" action={savePersonAction} class="card mt-4 animate-rise space-y-6 p-5 sm:p-6">
      <input type="hidden" name="id" value={p().id} />

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label" for="f-name">Name</label>
          <input class="input" id="f-name" name="name" value={p().name} maxlength="40" required />
        </div>
        <div>
          <label class="label" for="f-birthday">Birthday (month-day)</label>
          <input
            class="input"
            id="f-birthday"
            name="birthday"
            value={p().birthday ?? ""}
            placeholder="04-09"
            inputmode="numeric"
            pattern="\d{2}-\d{2}"
          />
        </div>
        <div>
          <label class="label" for="f-email">Email (for reminders)</label>
          <input
            class="input"
            id="f-email"
            name="email"
            type="email"
            inputmode="email"
            autocomplete="off"
            value={p().email ?? ""}
            placeholder="Optional — where nudges land"
          />
        </div>
        <div>
          <label class="label" for="f-phone">Phone</label>
          <input
            class="input"
            id="f-phone"
            name="phone"
            type="tel"
            inputmode="tel"
            autocomplete="off"
            value={p().phone ?? ""}
            placeholder="(555) 123-4567 — for future texts"
          />
        </div>
        <div>
          <span class="label">Section</span>
          <label class="flex min-h-11 items-center gap-2 text-sm font-bold">
            <input type="checkbox" name="isKid" class="size-5 accent-black" checked={p().isKid} />
            Kid (groups them under “Kids”)
          </label>
        </div>
      </div>

      <div>
        <label class="label" for="f-into">
          Into right now <span class="normal-case">({new Date().getFullYear()} — keeps last year's note too)</span>
        </label>
        <textarea
          class="input"
          id="f-into"
          name="into_now"
          placeholder="What are they excited about these days?"
          maxlength="300"
        >
          {props.data.interest}
        </textarea>
      </div>

      <fieldset class="space-y-4">
        <legend class="font-display text-lg font-semibold">Favorites</legend>
        <p class="-mt-2 text-sm text-muted">Leave anything blank you'd rather skip.</p>
        <For each={CATEGORIES}>
          {(cat) => (
            <div>
              <label class="label" for={`cat_${cat.key}`}>{cat.label}</label>
              <textarea
                class="input"
                id={`cat_${cat.key}`}
                name={`cat_${cat.key}`}
                placeholder={cat.placeholder}
                maxlength="300"
              >
                {props.data.favorites[cat.key] ?? ""}
              </textarea>
            </div>
          )}
        </For>
      </fieldset>

      <div class="flex flex-wrap items-center gap-3">
        <button type="submit" class="btn btn-primary" disabled={sub.pending}>
          {sub.pending ? "Saving…" : "Save"}
        </button>
        <a href={props.doneHref} class="btn btn-ghost">
          Done
        </a>
        <Show when={result()?.ok}>
          <span class="chip bg-mint" role="status">Saved ✓</span>
        </Show>
        <Show when={result()?.error}>
          <p class="w-full text-sm font-bold text-plum" role="alert">{result()!.error}</p>
        </Show>
      </div>
    </form>

    <div class="mt-2 px-1">
      <Show
        when={confirmDelete()}
        fallback={
          <button
            type="button"
            class="text-xs text-slate underline decoration-dotted hover:text-plum"
            onClick={() => setConfirmDelete(true)}
          >
            remove {p().name} from the chart
          </button>
        }
      >
        <form method="post" action={deletePersonAction} class="flex items-center gap-2">
          <input type="hidden" name="id" value={p().id} />
          <span class="text-sm font-bold text-plum">
            Delete {p().name} and everything on their list?
          </span>
          <button type="submit" class="chip bg-peach">yes, delete</button>
          <button type="button" class="chip opacity-60" onClick={() => setConfirmDelete(false)}>keep</button>
        </form>
      </Show>
    </div>
    </>
  );
}
