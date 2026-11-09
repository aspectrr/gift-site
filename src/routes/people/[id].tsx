import { createSignal, For, Match, Show, Switch } from "solid-js";
import { A, createAsync, useSearchParams, useParams } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { personQuery } from "~/lib/queries";
import { Avatar } from "~/components/Avatar";
import { IdeaForm, IdeaRow } from "~/components/Idea";
import { PersonForm } from "~/components/PersonForm";
import { CATEGORIES } from "~/lib/categories";

export default function PersonPage() {
  const params = useParams();
  const [sp] = useSearchParams();
  const data = createAsync(() => personQuery(Number(params.id), sp.year ? Number(sp.year) : null));
  const [showIdeaForm, setShowIdeaForm] = createSignal(false);

  const yearHref = (y: number | null) => {
    const qs = new URLSearchParams();
    if (y) qs.set("year", String(y));
    if (sp.edit) qs.set("edit", "1");
    const s = qs.toString();
    return `/people/${params.id}${s ? `?${s}` : ""}`;
  };
  const editHref = (on: boolean) => {
    const qs = new URLSearchParams();
    if (sp.year) qs.set("year", String(sp.year));
    if (on) qs.set("edit", "1");
    const s = qs.toString();
    return `/people/${params.id}${s ? `?${s}` : ""}`;
  };

  return (
    <Show when={data() !== undefined}>
      <Switch>
        <Match when={data() === null}>
          <div class="card mx-auto mt-16 max-w-md p-8 text-center">
            <p class="font-display text-2xl font-semibold">Nobody here</p>
            <p class="mt-2 text-sm text-slate">
              That person may have been removed from the chart.
            </p>
            <A href="/" class="btn btn-primary mt-5">← Back to everyone</A>
          </div>
        </Match>
        <Match when={data()}>
          {(d) => (
            <div class="mx-auto max-w-2xl">
              <Title>{d().person.name} · Family Favorites</Title>

              <A href="/" class="text-sm font-bold text-slate underline decoration-dotted hover:text-plum">← Everyone</A>

              <div class="mt-4 flex flex-wrap items-center gap-4">
                <Avatar name={d().person.name} color={d().person.color} size="lg" />
                <div class="min-w-0 flex-1">
                  <h1 class="font-display text-3xl font-semibold tracking-tight">{d().person.name}</h1>
                  <div class="mt-1.5 flex flex-wrap gap-1.5">
                    <Show when={d().birthdayLabel}>
                      <span class="chip">🎂 {d().birthdayLabel}</span>
                    </Show>
                    <Show when={d().person.isKid}>
                      <span class="chip border-ink bg-sky">kid</span>
                    </Show>
                    <Show when={d().isSelf}>
                      <span class="chip border-ink bg-mint">you</span>
                    </Show>
                  </div>
                </div>
                <Show when={d().canEdit}>
                  <A href={editHref(!sp.edit)} class="btn btn-ghost">
                    {sp.edit ? "Close editor" : "Edit"}
                  </A>
                </Show>
              </div>

              <Show when={d().years.length > 1}>
                <nav class="mt-5 flex flex-wrap items-center gap-1.5" aria-label="Year">
                  <For each={d().years}>
                    {(y) => (
                      <A
                        href={yearHref(y === d().years[0] ? null : y)}
                        class="chip"
                        classList={{
                          "bg-mint": y === d().year,
                          "bg-paper hover:bg-mint": y !== d().year,
                        }}
                      >
                        {y}
                      </A>
                    )}
                  </For>
                </nav>
              </Show>

              <Show when={sp.edit && d().canEdit}>
                <PersonForm data={d()} doneHref={editHref(false)} />
              </Show>

              <Show when={!sp.edit}>
                <section class="mt-7">
                  <h2 class="mb-2 font-display text-2xl">
                    Into right now
                  </h2>
                  <Show
                    when={d().interest}
                    fallback={
                      <p class="text-sm text-slate">
                        Nothing noted for {d().year}.{" "}
                        <A href={editHref(true)} class="font-bold text-plum underline decoration-dotted underline-offset-2">
                          Add something
                        </A>
                      </p>
                    }
                  >
                    <p class="card p-5 font-display text-2xl italic leading-snug text-ink">{d().interest}</p>
                  </Show>
                </section>

                <section class="mt-7">
                  <div class="mb-2 flex items-center justify-between gap-3">
                    <h2 class="font-display text-2xl">Favorites</h2>
                    <span class="text-xs text-slate">every row of the chart — blanks are waiting</span>
                  </div>
                  <Show
                    when={Object.keys(d().favorites).length > 0 || d().canEdit}
                    fallback={
                      <p class="text-sm text-slate">
                        No favorites on the chart yet.{" "}
                        <Show when={d().canEdit} fallback={<span>nothing filled in yet</span>}>
                          <A href={editHref(true)} class="font-bold text-plum underline decoration-dotted underline-offset-2">
                            Be the first to fill them in
                          </A>
                        </Show>
                      </p>
                    }
                  >
                    <dl class="card divide-y divide-fog px-5">
                      <For each={CATEGORIES}>
                        {(cat) => (
                          <div class="grid gap-1 py-3.5 sm:grid-cols-[200px_1fr] sm:gap-4">
                            <dt class="text-xs font-extrabold uppercase tracking-wide text-slate">
                              {cat.label}
                            </dt>
                            <dd
                              classList={{
                                "text-[15px] leading-relaxed text-charcoal": Boolean(d().favorites[cat.key]),
                                "text-[15px] italic text-slate/50": !d().favorites[cat.key],
                              }}
                            >
                              {d().favorites[cat.key] || (d().canEdit ? (
                                <A href={editHref(true)} class="text-plum underline decoration-dotted underline-offset-2">
                                  add {cat.label.toLowerCase()}
                                </A>
                              ) : (
                                "not on the chart yet"
                              ))}
                            </dd>
                          </div>
                        )}
                      </For>
                    </dl>
                  </Show>
                </section>

                <section class="mt-7">
                  <div class="mb-2 flex items-center justify-between gap-3">
                    <h2 class="font-display text-2xl">
                      Gift ideas <span class="font-body normal-case tracking-normal">({d().year})</span>
                    </h2>
                    <Show when={d().isSelf} fallback={null}>
                      <span class="text-xs text-slate">bought marks stay hidden from {d().person.name}</span>
                    </Show>
                  </div>
                  <Show
                    when={d().ideas.length > 0}
                    fallback={
                      <p class="text-sm text-slate">
                        {d().isSelf ? "Add things you'd love — it makes everyone else's life easier." : `No ideas on ${d().person.name}'s list for ${d().year}.`}
                      </p>
                    }
                  >
                    <ul class="space-y-2.5">
                      <For each={d().ideas}>
                        {(idea) => <IdeaRow idea={idea} isSelf={d().isSelf} personName={d().person.name} />}
                      </For>
                    </ul>
                  </Show>
                  <Show
                    when={showIdeaForm()}
                    fallback={
                      <button type="button" class="btn btn-ghost mt-4" onClick={() => setShowIdeaForm(true)}>
                        ＋ {d().isSelf ? "Add something you'd like" : `Add an idea for ${d().person.name}`}
                      </button>
                    }
                  >
                    <IdeaForm personId={d().person.id} year={d().year} personName={d().person.name} />
                  </Show>
                </section>

                <Show when={!d().isSelf && d().ideas.length === 0}>
                  <p class="mt-6 text-center text-xs text-slate">
                    Tip: gift ideas with links are the ones that get bought.
                  </p>
                </Show>
              </Show>
            </div>
          )}
        </Match>
      </Switch>
    </Show>
  );
}
