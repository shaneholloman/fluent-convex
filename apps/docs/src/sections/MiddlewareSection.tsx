import { Authenticated, Unauthenticated } from "convex/react";
import { CodeBlock } from "../components/CodeBlock";
import { AnchorHeading, Prose, DemoCard } from "../components/ui";
import { middlewareSource, chainsSource, authedSource } from "../sources";
import { TaskManager, SignInForm } from "../components/Auth";

export function MiddlewareSection() {
  return (
    <section id="middleware" className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold">Middleware</h2>
      <Prose>
        <p>
          Middleware lets you compose reusable logic that runs before (and optionally after) your
          handler. There are two main patterns:
        </p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>
            <strong>Context-enrichment</strong> - transforms the context object by adding new
            properties. The middleware calls{" "}
            <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">next(&#123; ...context, user &#125;)</code>{" "}
            and everything downstream sees the new property with full type safety.
          </li>
          <li>
            <strong>Onion (wrap)</strong> - runs code both <em>before</em> and <em>after</em> the
            rest of the chain. Because{" "}
            <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">next()</code> awaits
            the downstream middleware + handler, you can measure timing, catch errors, or
            post-process results.
          </li>
        </ul>
      </Prose>

      <AnchorHeading id="defining-middleware" className="text-xl font-semibold">Defining middleware</AnchorHeading>
      <Prose>
        <p>
          You create middleware with{" "}
          <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">.createMiddleware()</code>.
          The function receives the current context and a{" "}
          <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">next</code> callback. Call{" "}
          <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">next()</code> with a new
          context to pass it downstream. If you need your middleware to work across queries,
          mutations, and actions, use{" "}
          <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">.$context&lt;&#123; auth: Auth &#125;&gt;()</code>{" "}
          to scope the required context to the minimal shape shared by all function types.
        </p>
      </Prose>
      <CodeBlock source={middlewareSource} region="authMiddleware" title="Context-enrichment: authMiddleware" file="convex/middleware.ts" />
      <CodeBlock source={middlewareSource} region="addTimestamp" title="Simple enrichment: addTimestamp" file="convex/middleware.ts" />
      <Prose>
        <p>
          Because onion middleware wraps the handler, it can measure
          timing, catch errors, log results, or retry. The{" "}
          <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">withLogging</code>{" "}
          example below is parameterized - you pass an operation name and get back a middleware
          instance:
        </p>
      </Prose>
      <CodeBlock source={middlewareSource} region="withLogging" title="Onion middleware: withLogging(name)" file="convex/middleware.ts" />

      <AnchorHeading id="applying-middleware" className="text-xl font-semibold mt-4">Applying middleware with .use()</AnchorHeading>
      <Prose>
        <p>
          Once defined, you apply middleware with{" "}
          <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">.use()</code>. You can
          chain multiple{" "}
          <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">.use()</code> calls -
          each one merges its context additions with the previous ones. The handler receives the
          combined context with everything fully typed.
        </p>
      </Prose>
      <CodeBlock source={chainsSource} region="usingMiddleware" title="convex/chains.ts - single and stacked .use() calls" file="convex/chains.ts" />

      <AnchorHeading id="auth-middleware" className="text-xl font-semibold mt-4">Auth middleware in practice</AnchorHeading>
      <Prose>
        <p>
          A common pattern is to bake auth middleware into reusable chains like{" "}
          <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">authedQuery</code> and{" "}
          <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">authedMutation</code>.
          Every function built from them automatically requires a logged-in user and has{" "}
          <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">ctx.user</code>{" "}
          available, fully typed, no casting needed.
        </p>
      </Prose>
      <CodeBlock source={authedSource} region="reusableAuthChains" title="convex/authed.ts - defining reusable auth chains" file="convex/authed.ts" />
      <CodeBlock source={authedSource} region="listTasks" title="convex/authed.ts - a query using authedQuery" file="convex/authed.ts" />
      <CodeBlock source={authedSource} region="addTask" title="convex/authed.ts - a mutation using authedMutation" file="convex/authed.ts" />
      <DemoCard title="Live demo - sign in to manage tasks">
        <Authenticated>
          <TaskManager />
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </DemoCard>
    </section>
  );
}
