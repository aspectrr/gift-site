import { MetaProvider, Title } from "@solidjs/meta";
import { A, Router, createAsync, useLocation } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, Show } from "solid-js";
import { useSubmission } from "@solidjs/router";
import "./app.css";
import { Avatar } from "~/components/Avatar";
import { whoQuery } from "~/lib/queries";
import { switchAction } from "~/lib/actions";

const SwitchButton = () => {
  const sub = useSubmission(switchAction);
  return (
    <form method="post" action={switchAction}>
      <button
        type="submit"
        class="rounded-full border border-ink bg-paper px-3 py-1 text-xs font-bold text-ink transition hover:bg-mint"
        disabled={sub.pending}
      >
        {sub.pending ? "…" : "Switch"}
      </button>
    </form>
  );
};

const Header = () => {
  const who = createAsync(() => whoQuery());
  const location = useLocation();
  return (
    <header class="sticky top-0 z-40 border-b border-fog bg-cream/90 backdrop-blur-md">
      <div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <A href="/" class="font-display text-xl tracking-tight text-ink">
          Family <span class="swash">Favorites</span>
        </A>
        {/* identity chip reads an async query — needs its own Suspense boundary,
            otherwise SSR defers it as a bare marker pair and hydration mismatches */}
        <Suspense fallback={null}>
          <Show
            when={who()}
            fallback={
              <Show when={location.pathname !== "/"}>
                <A href="/" class="rounded-full border border-ink bg-mint px-3 py-1 text-xs font-bold text-ink">
                  Who are you?
                </A>
              </Show>
            }
          >
            <div class="flex items-center gap-3">
              <A href="/me" class="flex items-center gap-2 rounded-full border border-ink bg-paper py-1 pl-1 pr-3 transition hover:bg-mint">
                <Avatar name={who()!.name} color={who()!.color} size="sm" />
                <span class="text-sm font-bold text-ink">{who()!.name}</span>
              </A>
              <SwitchButton />
            </div>
          </Show>
        </Suspense>
      </div>
    </header>
  );
};

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>Family Favorites</Title>
          <div class="flex min-h-dvh flex-col">
            <Header />
            <main class="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-6">
              <Suspense>{props.children}</Suspense>
            </main>
            <footer class="border-t border-fog py-6 text-center text-xs text-slate">
              One chart, the whole family, every year. 🎁
            </footer>
          </div>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
