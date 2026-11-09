import { createSignal, Show } from "solid-js";
import { Title } from "@solidjs/meta";
import { createAsync } from "@solidjs/router";
import { familyQuery, whoQuery } from "~/lib/queries";
import { Onboarding } from "~/components/Onboarding";
import { PeopleDirectory } from "~/components/PeopleDirectory";

export default function Home() {
  const who = createAsync(() => whoQuery());
  const family = createAsync(() => familyQuery());
  // null = undecided: a returning visitor (cookie already set) skips onboarding;
  // someone who just joined keeps the tour until it finishes or is skipped.
  const [entered, setEntered] = createSignal<boolean | null>(null);

  return (
    <>
      <Title>Family Favorites</Title>
      <Show
        when={family()}
        fallback={<p class="pt-16 text-center text-slate">Warming up the chart…</p>}
        keyed
      >
        {(data) => (
          <Show
            when={who() && (entered() ?? true)}
            fallback={<Onboarding family={data} onDone={() => setEntered(true)} />}
          >
            <PeopleDirectory family={data} />
          </Show>
        )}
      </Show>
    </>
  );
}
