import { createEffect, createSignal, For, Show, Switch, Match } from "solid-js";
import { useAction, useSubmission } from "@solidjs/router";
import { joinAction, pickAction, type ActionResult } from "~/lib/actions";
import { formatBirthday, formatPhone } from "~/lib/format";
import type { FamilyData } from "~/lib/queries";
import { Avatar } from "./Avatar";
import { Mascot } from "./Mascot";
import { Confetti } from "./Confetti";

type Step = "welcome" | "name" | "birthday" | "phone" | "tour";
const TOUR = [
  {
    pose: "point" as const,
    title: "Here's everyone",
    body: "Birthdays ride along the top, and search finds anyone by anything. Try “coffee” or “Zelda”. Grown-ups and kids each get their own section.",
  },
  {
    pose: "cheer" as const,
    title: "Your page is your list",
    body: "Favorites, what you're into right now, and gift ideas with links. Fill in as much or as little as you like. It saves everyone guesswork.",
  },
  {
    pose: "wink" as const,
    title: "Secret shopper marks",
    body: "Anyone can mark one of your ideas “bought” so there are no duplicate gifts. You never see the marks. That's the point.",
  },
  {
    pose: "wave" as const,
    title: "We've got your back",
    body: "Before Christmas and every birthday, we'll nudge everyone to update their list. Add ideas any time of year.",
  },
];

const StepDots = (props: { total: number; current: number }) => (
  <div class="flex justify-center gap-1.5" aria-hidden="true">
    <For each={[...Array(props.total).keys()]}>
      {(i) => (
        <span
          class="h-2 w-2 rounded-full border border-ink"
          style={{
            background: i === props.current ? "#99ffcc" : "transparent",
          }}
        />
      )}
    </For>
  </div>
);

export function Onboarding(props: { family: FamilyData; onDone: () => void }) {
  const join = useSubmission(joinAction);
  const pick = useSubmission(pickAction);

  const firstRun = () => props.family.members.length === 0;
  const [step, setStep] = createSignal<Step>(firstRun() ? "name" : "welcome");
  const [tourIdx, setTourIdx] = createSignal(0);
  const [name, setName] = createSignal("");
  const [birthday, setBirthday] = createSignal("");
  const [phone, setPhone] = createSignal("");

  const joinResult = () => join.result as ActionResult | undefined;
  const existsMatch = () =>
    "match" in (joinResult() ?? {}) ? joinResult()!.match : undefined;

  // useSubmission gives reactive pending/result; useAction gives the callable submitter.
  // Calling the submission proxy directly throws "not a function" before the first submit.
  const joinFn = useAction(joinAction);

  // action outcomes
  createEffect(() => {
    const r = joinResult();
    if (r && "ok" in r) setStep("tour");
    else if (r?.error === "exists") setStep("name");
    else if (r?.error === "birthday") setStep("birthday");
  });
  createEffect(() => {
    if (pick.result && "ok" in pick.result) props.onDone();
  });

  const submitJoin = () => {
    const fd = new FormData();
    fd.set("name", name());
    fd.set("birthday", birthday());
    fd.set("phone", phone());
    void joinFn(fd);
  };

  return (
    <div class="relative mx-auto max-w-lg px-1 pb-8">
      <Confetti preset={1} class="-mx-5 -my-4 h-[130%]" />

      <Switch>
        {/* Welcome: existing family */}
        <Match when={step() === "welcome"}>
          <div class="animate-rise text-center">
            <div class="flex justify-center">
              <Mascot pose="wave" size={140} />
            </div>
            <h1 class="mt-2 font-display text-4xl tracking-tight text-ink">
              Hi, I'm <span class="swash">Dot</span>!
            </h1>
            <p class="mt-2 text-slate">
              Who's here today? Pick your name. This phone remembers you.
            </p>
          </div>
          <div class="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <For each={props.family.members.slice(0, 21)}>
              {(m) => (
                <form method="post" action={pickAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    type="submit"
                    class="flex w-full items-center gap-2.5 rounded-2xl border border-ink bg-paper px-3 py-3 text-left transition active:scale-[0.98] hover:bg-mint"
                    disabled={pick.pending}
                  >
                    <Avatar name={m.name} color={m.color} size="sm" />
                    <span class="truncate text-sm font-bold text-ink">
                      {m.name}
                    </span>
                  </button>
                </form>
              )}
            </For>
          </div>
          <button
            type="button"
            class="btn btn-primary mt-5 w-full"
            onClick={() => setStep("name")}
          >
            None of these. I'm new!
          </button>
        </Match>

        {/* Step: name */}
        <Match when={step() === "name"}>
          <div class="card animate-rise p-6 sm:p-8">
            <div class="flex justify-center">
              <Mascot pose="wave" />
            </div>
            <h1 class="mt-2 text-center font-display text-3xl text-ink">
              {firstRun() ? (
                <>
                  You're the <span class="swash">first one</span> here!
                </>
              ) : (
                <>
                  What's your <span class="swash">name</span>?
                </>
              )}
            </h1>
            <p class="mt-2 text-center text-slate">
              Nicknames work fine. It's just for family.
            </p>
            <form
              class="mt-5 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (name().trim()) setStep("birthday");
              }}
            >
              <input
                class="input flex-1"
                placeholder="Type your name…"
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                autocomplete="given-name"
                maxlength="40"
                autofocus
              />
              <button type="submit" class="btn btn-primary px-5">
                Next
              </button>
            </form>
            <Show when={!name().trim()}>
              <p class="mt-3 text-center text-xs text-slate">
                Tap Next once you've typed something.
              </p>
            </Show>

            <Show when={existsMatch()}>
              {(match) => (
                <div
                  class="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-ink bg-peach px-4 py-3"
                  role="alert"
                >
                  <p class="text-sm font-bold text-ink">
                    {match().name} is already on the chart. That you?
                  </p>
                  <form method="post" action={pickAction}>
                    <input type="hidden" name="id" value={match().id} />
                    <button
                      type="submit"
                      class="btn btn-primary min-h-0 py-2"
                      disabled={pick.pending}
                    >
                      Yes
                    </button>
                  </form>
                </div>
              )}
            </Show>

            <Show when={!firstRun() && step() === "name" && !existsMatch()}>
              <button
                type="button"
                class="mt-4 w-full text-center text-xs text-slate underline decoration-dotted"
                onClick={() => setStep("welcome")}
              >
                ← back to the names
              </button>
            </Show>
          </div>
        </Match>

        {/* Step: birthday */}
        <Match when={step() === "birthday"}>
          <div class="card animate-rise p-6 sm:p-8">
            <div class="flex justify-center">
              <Mascot pose="think" />
            </div>
            <h1 class="mt-2 text-center font-display text-3xl text-ink">
              When's your <span class="swash">birthday</span>?
            </h1>
            <p class="mt-2 text-center text-slate">
              Month and day is plenty. I'll remind everyone a week before. No
              year, we promise.
            </p>
            <form
              class="mt-5 flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setStep("phone");
              }}
            >
              <input
                class="input flex-1"
                placeholder="04-09"
                inputmode="numeric"
                pattern="\d{2}-\d{2}"
                value={birthday()}
                onInput={(e) =>
                  setBirthday(formatBirthday(e.currentTarget.value))
                }
              />
              <button type="submit" class="btn btn-primary px-5">
                Next
              </button>
              <button
                type="button"
                class="btn btn-ghost"
                onClick={() => setStep("phone")}
              >
                Skip
              </button>
            </form>
            <Show when={joinResult()?.error === "birthday"}>
              <p
                class="mt-3 text-center text-sm font-bold text-ink"
                role="alert"
              >
                Hmm, that doesn't look like a date. Try 04-09 style.
              </p>
            </Show>
            <button
              type="button"
              class="mt-4 w-full text-center text-xs text-slate underline decoration-dotted"
              onClick={() => setStep("name")}
            >
              ← back
            </button>
          </div>
        </Match>

        {/* Step: phone */}
        <Match when={step() === "phone"}>
          <div class="card animate-rise p-6 sm:p-8">
            <div class="flex justify-center">
              <Mascot pose="wink" />
            </div>
            <h1 class="mt-2 text-center font-display text-3xl text-ink">
              Got a <span class="swash">phone</span>?
            </h1>
            <p class="mt-2 text-center text-slate">
              For birthday pings 📱 Texts aren't switched on yet, but your
              number will be ready and waiting.
            </p>
            <form
              class="mt-5 flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                submitJoin();
              }}
            >
              <input
                class="input flex-1"
                type="tel"
                inputmode="tel"
                placeholder="(555) 123-4567"
                value={phone()}
                onInput={(e) => setPhone(formatPhone(e.currentTarget.value))}
              />
              <button
                type="submit"
                class="btn btn-primary px-5"
                disabled={join.pending}
              >
                {join.pending ? "One sec…" : "Let's go"}
              </button>
              <button
                type="button"
                class="btn btn-ghost"
                onClick={() => submitJoin()}
                disabled={join.pending}
              >
                Skip
              </button>
            </form>
            <button
              type="button"
              class="mt-4 w-full text-center text-xs text-slate underline decoration-dotted"
              onClick={() => setStep("birthday")}
            >
              ← back
            </button>
          </div>
        </Match>

        {/* Tour */}
        <Match when={step() === "tour"}>
          <div class="card animate-rise relative overflow-hidden p-6 text-center sm:p-8">
            <Confetti preset={tourIdx() + 2} />
            <div class="flex justify-center">
              <Mascot pose={TOUR[tourIdx()].pose} size={130} />
            </div>
            <h2 class="mt-2 font-display text-3xl text-ink">
              {TOUR[tourIdx()].title}
            </h2>
            <p class="mx-auto mt-3 max-w-sm text-left text-[15px] leading-relaxed text-slate">
              {TOUR[tourIdx()].body}
            </p>
            <div class="mt-6">
              <StepDots total={TOUR.length} current={tourIdx()} />
            </div>
            <div class="mt-4 flex justify-center gap-2">
              <Show
                when={tourIdx() < TOUR.length - 1}
                fallback={
                  <button
                    type="button"
                    class="btn btn-primary px-8"
                    onClick={() => props.onDone()}
                  >
                    Let's go in! 🎉
                  </button>
                }
              >
                <button
                  type="button"
                  class="btn btn-primary px-8"
                  onClick={() => setTourIdx(tourIdx() + 1)}
                >
                  Next
                </button>
              </Show>
              <Show when={tourIdx() < TOUR.length - 1}>
                <button
                  type="button"
                  class="btn btn-ghost"
                  onClick={() => props.onDone()}
                >
                  Skip tour
                </button>
              </Show>
            </div>
          </div>
        </Match>
      </Switch>
    </div>
  );
}
