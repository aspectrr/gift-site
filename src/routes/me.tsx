import { Show } from "solid-js";
import { createAsync } from "@solidjs/router";
import { Navigate, useSearchParams } from "@solidjs/router";
import { whoQuery } from "~/lib/queries";

export default function Me() {
  const who = createAsync(() => whoQuery());
  const [sp] = useSearchParams();

  return (
    <Show when={who() !== undefined}>
      <Show when={who()} fallback={<Navigate href="/" />}>
        <Navigate href={`/people/${who()!.id}${sp.edit ? "?edit=1" : ""}`} />
      </Show>
    </Show>
  );
}
