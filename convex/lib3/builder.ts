import type { IntersectPick } from "@orpc/shared";
import type { Middleware } from "./middleware";
import type { ProcedureDef, ProcedureHandler } from "./procedure";
import type {
  AnySchema,
  Context,
  InferSchemaInput,
  InferSchemaOutput,
  Schema,
} from "./types";
import { Procedure } from "./procedure";

export interface BuilderDef<
  TInitialContext extends Context,
  TCurrentContext extends Context,
  TInputSchema extends AnySchema,
  TOutputSchema extends AnySchema,
> extends Omit<
    ProcedureDef<TInitialContext, TCurrentContext, TInputSchema, TOutputSchema>,
    "handler"
  > {}

export class Builder<
  TInitialContext extends Context,
  TCurrentContext extends Context,
  TInputSchema extends AnySchema,
  TOutputSchema extends AnySchema,
> {
  /**
   * Holds the builder configuration.
   */
  "~orpc": BuilderDef<
    TInitialContext,
    TCurrentContext,
    TInputSchema,
    TOutputSchema
  >;

  constructor(
    def: BuilderDef<
      TInitialContext,
      TCurrentContext,
      TInputSchema,
      TOutputSchema
    >,
  ) {
    this["~orpc"] = def;
  }

  /**
   * Sets the initial context type.
   */
  $context<U extends Context>(): Builder<
    U & Record<never, never>,
    U,
    TInputSchema,
    TOutputSchema
  > {
    // `& Record<never, never>` prevents "has no properties in common" TypeScript errors
    return new Builder({
      ...this["~orpc"],
      middlewares: [],
    });
  }

  /**
   * Creates a middleware function.
   */
  middleware<UOutContext extends IntersectPick<TCurrentContext, UOutContext>>(
    middleware: Middleware<TInitialContext, UOutContext>,
  ): Middleware<TInitialContext, UOutContext> {
    // Ensures UOutContext doesn't conflict with current context
    return middleware;
  }

  /**
   * Applies middleware to transform context or enhance the pipeline.
   */
  use<UOutContext extends IntersectPick<TCurrentContext, UOutContext>>(
    middleware: Middleware<TCurrentContext, UOutContext>,
  ): Builder<
    TInitialContext,
    Omit<TCurrentContext, keyof UOutContext> & UOutContext,
    TInputSchema,
    TOutputSchema
  > {
    // UOutContext merges with and overrides current context properties
    return new Builder({
      ...this["~orpc"],
      middlewares: [...this["~orpc"].middlewares, middleware],
    });
  }

  /**
   * Sets the input validation schema.
   */
  input<USchema extends AnySchema>(
    schema: USchema,
  ): Builder<TInitialContext, TCurrentContext, USchema, TOutputSchema> {
    return new Builder({
      ...this["~orpc"],
      inputSchema: schema,
    });
  }

  /**
   * Sets the output validation schema.
   */
  output<USchema extends AnySchema>(
    schema: USchema,
  ): Builder<TInitialContext, TCurrentContext, TInputSchema, USchema> {
    return new Builder({
      ...this["~orpc"],
      outputSchema: schema,
    });
  }

  /**
   * Defines the procedure handler and creates the final procedure.
   */
  handler<UFuncOutput extends InferSchemaInput<TOutputSchema>>(
    handler: ProcedureHandler<
      TCurrentContext,
      InferSchemaOutput<TInputSchema>,
      UFuncOutput
    >,
  ): Procedure<
    TInitialContext,
    TCurrentContext,
    TInputSchema,
    TOutputSchema extends { initial?: true }
      ? Schema<UFuncOutput>
      : TOutputSchema
  > {
    // If no output schema is defined, infer it from handler return type
    return new Procedure({
      ...this["~orpc"],
      handler,
    }) as any;
  }
}

export const os = new Builder<
  Record<never, never>,
  Record<never, never>,
  Schema<unknown, unknown>,
  Schema<unknown, unknown> & { initial?: true }
>({
  middlewares: [],
});
