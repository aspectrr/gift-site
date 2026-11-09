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
        class="text-sm font-bold text-muted underline decoration-dotted underline-offset-4 hover:text-accent"
        disabled={sub.pending}
      >
        {sub.pending ? "…" : "Switch"}
      </button>
    </form>
  );
};

const Header = () => {
  const who = createAsync(() => whoQuery(), { initialValue: null });
  const location = useLocation();
  return (
    <header class="sticky top-0 z-40 border-b border-line bg-[color-mix(in_oklab,var(--bg)_86%,transparent)] backdrop-blur-md">
      <div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <A href="/" class="flex items-baseline gap-1.5 font-display text-lg font-semibold tracking-tight">
          <span class="text-accent" aria-hidden>
            ❦
          </span>
          Family Favorites
        </A>
        <Show
          when={who()}
          fallback={
            <Show when={location.pathname !== "/"}>
              <A href="/" class="text-sm font-bold text-muted hover:text-accent">
                Who are you?
              </A>
            </Show>
          }
        >
          <div class="flex items-center gap-3">
            <A href="/me" class="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-accent-soft">
              <Avatar name={who()!.name} color={who()!.color} size="sm" />
              <span class="text-sm font-bold">{who()!.name}</span>
            </A>
            <SwitchButton />
          </div>
        </Show>
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
            <footer class="border-t border-line-soft py-6 text-center text-xs text-muted">
              One chart, the whole family, every year.
            </footer>
          </div>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
