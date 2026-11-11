import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { useAction, useBeforeLeave, useNavigate } from "@solidjs/router";
import {
  deletePersonAction,
  savePersonAction,
  type ActionResult,
} from "~/lib/actions";
import { CATEGORIES, FAVORITE_COLOR_HEX } from "~/lib/categories";
import type { PersonData } from "~/lib/queries";
import { formatBirthday, formatPhone } from "~/lib/format";

const AUTOSAVE_MS = 500;

type SaveStatus = "idle" | "saving" | "saved" | "error";

function FieldSaveHint(props: {
  field: string;
  active: () => string;
  status: () => SaveStatus;
}) {
  return (
    <Show
      when={
        props.active() === props.field &&
        (props.status() === "saving" || props.status() === "saved")
      }
    >
      <p class="mt-1" role="status">
        <Show
          when={props.status() === "saving"}
          fallback={<span class="chip bg-mint text-xs">Saved ✓</span>}
        >
          <span class="chip bg-sky text-xs animate-pulse">Saving…</span>
        </Show>
      </p>
    </Show>
  );
}

export function PersonForm(props: { data: PersonData; doneHref: string }) {
  const save = useAction(savePersonAction);
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = createSignal(false);
  const p = () => props.data.person;
  const [activeField, setActiveField] = createSignal("");
  const [status, setStatus] = createSignal<SaveStatus>("idle");
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

  const queueSave = (field?: string) => {
    setDirty(true);
    if (field) setActiveField(field);
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

  // unsaved text must survive any exit: SPA link navigations fire
  // beforeLeave, tab closes and reloads fire pagehide. sendBeacon is
  // fire-and-forget and survives the unload.
  const flush = () => {
    if (!dirty() || !formEl) return;
    navigator.sendBeacon(formEl.action, new FormData(formEl));
  };
  useBeforeLeave(flush);
  onMount(() => {
    window.addEventListener("pagehide", flush);
    onCleanup(() => window.removeEventListener("pagehide", flush));
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
        onInput={(e) => queueSave((e.target as HTMLInputElement).name)}
        onChange={(e) => queueSave((e.target as HTMLInputElement).name)}
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
            <FieldSaveHint field="name" active={activeField} status={status} />
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
            <FieldSaveHint
              field="birthday"
              active={activeField}
              status={status}
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
              <FieldSaveHint
                field="email"
                active={activeField}
                status={status}
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
              <FieldSaveHint
                field="phone"
                active={activeField}
                status={status}
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
            <FieldSaveHint field="isKid" active={activeField} status={status} />
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
          <FieldSaveHint
            field="into_now"
            active={activeField}
            status={status}
          />
        </div>

        <fieldset class="space-y-4">
          <legend class="font-display text-lg font-semibold">Favorites</legend>
          <p class="-mt-2 text-sm text-muted">
            Leave anything blank you'd rather skip.
          </p>
          <For each={CATEGORIES}>
            {(cat) => {
              const opts = "options" in cat ? cat.options : undefined;
              const current = props.data.favorites[cat.key] ?? "";
              const known = opts?.includes(current) ?? false;
              return (
                <div>
                  {opts ? (
                    <fieldset
                      class="flex flex-wrap gap-2"
                      aria-label={cat.label}
                    >
                      <span class="label w-full">{cat.label}</span>
                      <For each={opts}>
                        {(opt) => (
                          <label class="chip chip-pick">
                            <input
                              type="radio"
                              class="sr-only"
                              name={`cat_${cat.key}`}
                              value={opt}
                              checked={current === opt}
                            />
                            <span
                              class="size-3.5 rounded-full border border-ink/25"
                              style={{ background: FAVORITE_COLOR_HEX[opt] }}
                            />
                            {opt}
                          </label>
                        )}
                      </For>
                      <label class="chip chip-pick">
                        {/* radios can't be unchecked; this is the clearing path */}
                        <input
                          type="radio"
                          class="sr-only"
                          name={`cat_${cat.key}`}
                          value=""
                          checked={!known}
                        />
                        skip
                      </label>
                    </fieldset>
                  ) : (
                    <>
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
                        {current}
                      </textarea>
                    </>
                  )}
                  <FieldSaveHint
                    field={`cat_${cat.key}`}
                    active={activeField}
                    status={status}
                  />
                </div>
              );
            }}
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
