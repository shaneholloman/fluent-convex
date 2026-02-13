import { useRoute, routes } from "../router";

const NAV_SECTIONS = [
  { route: routes.gettingStarted, routeName: "gettingStarted" as const, label: "Getting Started" },
  { route: routes.basics, routeName: "basics" as const, label: "Basics" },
  { route: routes.validation, routeName: "validation" as const, label: "Validation" },
  { route: routes.middleware, routeName: "middleware" as const, label: "Middleware" },
  { route: routes.reusableChains, routeName: "reusableChains" as const, label: "Reusable Chains" },
  { route: routes.zodPlugin, routeName: "zodPlugin" as const, label: "Zod Plugin" },
  { route: routes.customPlugins, routeName: "customPlugins" as const, label: "Custom Plugins" },
  { route: routes.actions, routeName: "actions" as const, label: "Actions" },
  { route: routes.auth, routeName: "auth" as const, label: "Auth Middleware" },
] as const;

export function Sidebar() {
  const route = useRoute();
  const activeRouteName = route.name;

  return (
    <aside className="hidden lg:block w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 sticky top-[49px] h-[calc(100vh-49px)] overflow-y-auto">
      <nav className="p-4 flex flex-col gap-1">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          Guide
        </p>
        {NAV_SECTIONS.map((s) => {
          const isActive = activeRouteName === s.routeName;
          return (
            <a
              key={s.route.name}
              {...s.route().link}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {s.label}
            </a>
          );
        })}
        <div className="border-t border-slate-200 dark:border-slate-800 my-3" />
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          Links
        </p>
        <a
          href="https://github.com/mikecann/fluent-convex"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          GitHub repo
        </a>
        <a
          href="https://docs.convex.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Convex docs
        </a>
      </nav>
    </aside>
  );
}
