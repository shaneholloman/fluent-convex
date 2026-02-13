import { memo, useEffect } from "react";

export const Content = memo(function Content({
  children,
}: {
  children: React.ReactNode;
}) {
  // Scroll to the target anchor on initial load or when the hash changes.
  // Because <main> is the scroll container (overflow-y-auto), the browser's
  // native #hash scrolling targets the document and misses our container.
  useEffect(() => {
    function scrollToHash() {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;
      requestAnimationFrame(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      });
    }

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  return (
    <main className="flex-1 min-w-0 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-20">
        {children}
        <footer className="border-t border-slate-200 dark:border-slate-800 pt-8 pb-4 text-center text-sm text-slate-400">
          Built with{" "}
          <a href="https://github.com/mikecann/fluent-convex" className="underline">
            fluent-convex
          </a>{" "}
          +{" "}
          <a href="https://convex.dev" className="underline">Convex</a>{" "}
          +{" "}
          <a href="https://react.dev" className="underline">React</a>
        </footer>
      </div>
    </main>
  );
});
