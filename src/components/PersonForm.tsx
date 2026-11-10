import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { useAction, useNavigate } from "@solidjs/router";
import {
  deletePersonAction,
  savePersonAction,
  type ActionResult,
} from "~/lib/actions";
import { CATEGORIES } from "~/lib/categories";
import type { PersonData } from "~/lib/queries";
import { formatBirthday, formatPhone } from "~/lib/format";

const AUTOSAVE_MS = 3000;

export function PersonForm(props: { data: PersonData; doneHref: string }) {
  const save = useAction(savePersonAction);
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = createSignal(false);
  const p = () => props.data.person;
  const [status, setStatus] = createSignal<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [error, setError] = createSignal("");
  const [dirty, setDirty] = createSignal(false);
  let formEl!: HTMLFormElement;
  let timer: ReturnType<typeof setTimeout> | undefined;

  // setDirty(false) at the start means edits typed mid-request re-dirty the
  // form, and the dirty() check below saves them in a catch-up pass.
  const performSave = async (): Promise<boolean> => {
    clearTimeout(timer);
    setDirty(false);
    setStatus("saving");
    let res: ActionResult;
    try {
      res = await save(new FormData(formEl));
    } catch {
      res = { error: "Couldn't save — check your connection and try again." };
    }
    if (res.error) {
      setError(res.error);
      setStatus("error");
      return false;
    }
    if (dirty()) return performSave();
    setStatus("saved");
    return true;
  };

  const queueSave = () => {
    setDirty(true);
    setError("");
    if (status() === "saving") return; // in-flight save catches up on settle
    setStatus("idle");
    clearTimeout(timer);
    timer = setTimeout(() => void performSave(), AUTOSAVE_MS);
  };

  const onDone = async (e: MouseEvent) => {
    if (!dirty() && status() !== "saving" && status() !== "error") return;
    e.preventDefault();
    if (await performSave()) navigate(props.doneHref);
  };

  // last keystrokes may not have cleared the 3s debounce yet
  const onPageHide = () => {
    if (!dirty() || status() === "saving") return;
    navigator.sendBeacon(formEl.action, new FormData(formEl));
  };
  onMount(() => {
    window.addEventListener("pagehide", onPageHide);
    onCleanup(() => window.removeEventListener("pagehide", onPageHide));
  });
  onCleanup(() => clearTimeout(timer));

  return (
    <>
      <form
        ref={(el) => (formEl = el)}
        method="post"
        action={savePersonAction}
        class="card mt-4 animate-rise space-y-6 p-5 sm:p-6"
        onSubmit={(e) => e.preventDefault()}
        onInput={queueSave}
        onChange={queueSave}
      >
        <input type="hidden" name="id" value={p().id} />

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label" for="f-name">
              Name
            </label>
            <input
              class="input"
              id="f-name"
              name="name"
              value={p().name}
              maxlength="40"
              required
            />
          </div>
          <div>
            <label class="label" for="f-birthday">
              Birthday (month-day)
            </label>
            <input
              class="input"
              id="f-birthday"
              name="birthday"
              value={p().birthday ?? ""}
              placeholder="04-09"
              inputmode="numeric"
              onInput={(e) =>
                (e.currentTarget.value = formatBirthday(e.currentTarget.value))
              }
            />
          </div>
          <Show when={props.data.isSelf}>
            <div>
              <label class="label" for="f-email">
                Email (for reminders)
              </label>
              <input
                class="input"
                id="f-email"
                name="email"
                type="email"
                inputmode="email"
                autocomplete="off"
                value={p().email ?? ""}
                placeholder="Optional, where nudges land"
              />
            </div>
            <div>
              <label class="label" for="f-phone">
                Phone
              </label>
              <input
                class="input"
                id="f-phone"
                name="phone"
                type="tel"
                inputmode="tel"
                autocomplete="off"
                value={p().phone ?? ""}
                onInput={(e) =>
                  (e.currentTarget.value = formatPhone(e.currentTarget.value))
                }
              />
            </div>
          </Show>
          <div>
            <span class="label">Section</span>
            <label class="flex min-h-11 items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                name="isKid"
                class="size-5 accent-black"
                checked={p().isKid}
              />
              Kid (groups them under “Kids”)
            </label>
          </div>
        </div>

        <div>
          <label class="label" for="f-into">
            Into right now{" "}
            <span class="normal-case">
              ({new Date().getFullYear()}, keeps last year's note too)
            </span>
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
          <p class="-mt-2 text-sm text-muted">
            Leave anything blank you'd rather skip.
          </p>
          <For each={CATEGORIES}>
            {(cat) => (
              <div>
                <label class="label" for={`cat_${cat.key}`}>
                  {cat.label}
                </label>
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
          <noscript>
            <button type="submit" class="btn btn-primary">
              Save
            </button>
          </noscript>
          <a href={props.doneHref} class="btn btn-ghost" onClick={onDone}>
            Done
          </a>
          <Show when={status() === "saving"}>
            <span class="chip" role="status">
              Saving…
            </span>
          </Show>
          <Show when={status() === "saved"}>
            <span class="chip bg-mint" role="status">
              Saved ✓
            </span>
          </Show>
          <Show when={status() === "error"}>
            <p class="w-full text-sm font-bold text-plum" role="alert">
              {error()}
            </p>
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
          <form
            method="post"
            action={deletePersonAction}
            class="flex items-center gap-2"
          >
            <input type="hidden" name="id" value={p().id} />
            <span class="text-sm font-bold text-plum">
              Delete {p().name} and everything on their list?
            </span>
            <button type="submit" class="chip bg-peach">
              yes, delete
            </button>
            <button
              type="button"
              class="chip opacity-60"
              onClick={() => setConfirmDelete(false)}
            >
              keep
            </button>
          </form>
        </Show>
      </div>
    </>
  );
}
