import { Show } from "solid-js";
import { createAsync } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { familyQuery, whoQuery } from "~/lib/queries";
import { WhoPicker } from "~/components/WhoPicker";
import { PeopleDirectory } from "~/components/PeopleDirectory";

export default function Home() {
  const who = createAsync(() => whoQuery());
  const family = createAsync(() => familyQuery());

  return (
    <>
      <Title>Family Favorites</Title>
      <Show
        when={family()}
        fallback={<p class="pt-16 text-center text-muted">Warming up the chart…</p>}
        keyed
      >
        {(data) => (
          <Show when={who()} fallback={<WhoPicker family={data} />}>
            <PeopleDirectory family={data} />
          </Show>
        )}
      </Show>
    </>
  );
}
