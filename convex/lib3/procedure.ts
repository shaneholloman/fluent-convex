import type { AnyMiddleware } from "./middleware";
import type { AnySchema, Context } from "./types";

export interface ProcedureHandlerOptions<
  TCurrentContext extends Context,
  TInput,
> {
  context: TCurrentContext;
  input: TInput;
  path: readonly string[];
  procedure: AnyProcedure;
  signal?: AbortSignal;
}

export interface ProcedureHandler<
  TCurrentContext extends Context,
  TInput,
  THandlerOutput,
> {
  (
    opt: ProcedureHandlerOptions<TCurrentContext, TInput>,
  ): Promise<THandlerOutput>;
}

export interface ProcedureDef<
  TInitialContext extends Context,
  TCurrentContext extends Context,
  TInputSchema extends AnySchema,
  TOutputSchema extends AnySchema,
> {
  /**
   * This property must be optional, because it only available in the type system.
   *
   * Why `(type: TInitialContext) => unknown` instead of `TInitialContext`?
   * You can read detail about this topic [here](https://www.typescriptlang.org/docs/handbook/2/generics.html#variance-annotations)
   */
  __initialContext?: (type: TInitialContext) => unknown;
  middlewares: readonly AnyMiddleware[];
  inputSchema?: TInputSchema;
  outputSchema?: TOutputSchema;
  handler: ProcedureHandler<TCurrentContext, any, any>;
}

export class Procedure<
  TInitialContext extends Context,
  TCurrentContext extends Context,
  TInputSchema extends AnySchema,
  TOutputSchema extends AnySchema,
> {
  "~orpc": ProcedureDef<
    TInitialContext,
    TCurrentContext,
    TInputSchema,
    TOutputSchema
  >;

  constructor(
    def: ProcedureDef<
      TInitialContext,
      TCurrentContext,
      TInputSchema,
      TOutputSchema
    >,
  ) {
    this["~orpc"] = def;
  }
}

export type AnyProcedure = Procedure<any, any, any, any>;

/**
 * TypeScript only enforces type constraints at compile time.
 * Checking only `item instanceof Procedure` would fail for objects
 * that have the same structure as `Procedure` but aren't actual
 * instances of the `Procedure` class.
 */
export function isProcedure(item: unknown): item is AnyProcedure {
  if (item instanceof Procedure) {
    return true;
  }

  return (
    (typeof item === "object" || typeof item === "function") &&
    item !== null &&
    "~orpc" in item &&
    typeof item["~orpc"] === "object" &&
    item["~orpc"] !== null &&
    "middlewares" in item["~orpc"] &&
    "handler" in item["~orpc"]
  );
}
