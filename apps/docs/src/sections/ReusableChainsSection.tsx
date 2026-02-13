import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CodeBlock } from "../components/CodeBlock";
import { AnchorHeading, Prose, DemoCard, Badge, InfoCallout } from "../components/ui";
import { chainsSource } from "../sources";

export function ReusableChainsSection() {
  const publicResult = useQuery(api.chains.listNumbers, { count: 5 });
  const timestampResult = useQuery(api.chains.getNumbersWithTimestamp, { count: 5 });
  const metadataResult = useQuery(api.chains.listNumbersWithMetadata, { count: 5 });

  return (
    <section id="reusable-chains" className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold">Reusable Chains &amp; Callable Syntax</h2>
      <Prose>
        <p>
          Because the builder is immutable and every method returns a new instance, you
          can <strong>stop the chain at any point</strong> and reuse that partial builder
          elsewhere.
        </p>
        <p>
          A builder that has a{" "}
          <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">.handler()</code> but
          hasn&apos;t been registered with{" "}
          <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">.public()</code> /{" "}
          <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">.internal()</code> is
          called a <strong>callable</strong>. It&apos;s a fully-typed function you can invoke
          directly from other handlers, register as a standalone endpoint, or extend with more
          middleware, all from the same definition.
        </p>
      </Prose>

      <AnchorHeading id="callable-as-building-block" className="text-xl font-semibold">Define once as a callable</AnchorHeading>
      <Prose>
        <p>
          Start by defining your logic as a callable. It looks just like a normal fluent-convex
          function, but without the final{" "}
          <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">.public()</code> or{" "}
          <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">.internal()</code> call.
          You can register it later whenever you need a real Convex endpoint.
        </p>
      </Prose>
      <CodeBlock source={chainsSource} region="callable" title="convex/chains.ts - a callable + its registered form" file="convex/chains.ts" />

      <AnchorHeading id="call-from-handler" className="text-xl font-semibold">Call it inside other handlers</AnchorHeading>
      <Prose>
        <p>
          Because <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">getNumbers</code> is
          callable, you can invoke it directly from inside another handler. No additional
          Convex function invocation, no extra registration - just a direct, in-process
          call with full type safety on both the arguments and return value.
        </p>
      </Prose>
      <CodeBlock source={chainsSource} region="callFromHandler" title="convex/chains.ts - calling a callable inside another handler" file="convex/chains.ts" />
      <InfoCallout>
        The syntax is{" "}
        <code className="bg-sky-100 dark:bg-sky-900/50 px-1 py-0.5 rounded text-sm">callable(ctx, args)</code>.
        The first argument passes the context (so the middleware chain runs with the correct ctx),
        the second passes the validated arguments. This mirrors the handler signature shape.
      </InfoCallout>

      <AnchorHeading id="register-multiple-ways" className="text-xl font-semibold">Register the same callable multiple ways</AnchorHeading>
      <Prose>
        <p>
          Since the original callable is immutable, you can derive as many registered functions
          from it as you like, each with different middleware or visibility.
          The base logic is written once.
        </p>
      </Prose>
      <CodeBlock source={chainsSource} region="registerMultipleWays" title="convex/chains.ts - same callable, many registrations" file="convex/chains.ts" />

      <AnchorHeading id="stacking-middleware" className="text-xl font-semibold">Stacking middleware on a callable</AnchorHeading>
      <Prose>
        <p>
          Each{" "}
          <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-sm">.use()</code> call
          returns a new builder, so the original callable is always untouched. You can
          build up as many layers as you need before registering.
        </p>
      </Prose>
      <CodeBlock source={chainsSource} region="stackedMiddleware" title="Stacking middleware on a callable" file="convex/chains.ts" />

      <DemoCard title="Live demo">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <Badge>listNumbers (public)</Badge>
            <p className="mt-1 font-mono">
              {publicResult ? JSON.stringify(publicResult) : "..."}
            </p>
          </div>
          <div>
            <Badge>getNumbersWithTimestamp (calls callable)</Badge>
            <p className="mt-1 font-mono">
              {timestampResult ? JSON.stringify(timestampResult.numbers) : "..."}
            </p>
            {timestampResult?.fetchedAt && (
              <p className="mt-1 text-xs text-slate-500">
                fetchedAt: {new Date(timestampResult.fetchedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
          <div>
            <Badge>listNumbersWithMetadata (stacked middleware)</Badge>
            <p className="mt-1 font-mono">
              {metadataResult ? JSON.stringify(metadataResult.numbers) : "..."}
            </p>
            {metadataResult?.timestamp && (
              <p className="mt-1 text-xs text-slate-500">
                timestamp: {metadataResult.timestamp}
              </p>
            )}
          </div>
        </div>
      </DemoCard>
    </section>
  );
}
