import {
  query,
  mutation,
  action,
  internalQuery,
  internalMutation,
  internalAction,
} from "../_generated/server";
import type { PropertyValidators, GenericValidator } from "convex/values";
import type { RegisteredQuery, RegisteredMutation, RegisteredAction } from "convex/server";
import type {
  QueryCtx,
  MutationCtx,
  ActionCtx,
  Middleware,
  InferArgs,
  Visibility,
  FunctionType,
  AnyContext,
} from "./types";

type MiddlewareFn = (ctx: AnyContext) => Promise<Record<string, unknown>>;

interface BuilderConfig<
  TFunctionType extends FunctionType,
  TContext extends AnyContext,
  TArgs extends PropertyValidators | undefined,
  TReturns extends GenericValidator | undefined,
  TVisibility extends Visibility,
> {
  functionType: TFunctionType;
  middlewares: Array<MiddlewareFn>;
  argsValidator?: TArgs;
  returnsValidator?: TReturns;
  visibility: TVisibility;
}

export class UdfBuilder<
  TFunctionType extends FunctionType = never,
  TContext extends AnyContext = never,
  TArgs extends PropertyValidators | undefined = undefined,
  TReturns extends GenericValidator | undefined = undefined,
  TVisibility extends Visibility = "public",
> {
  private config: BuilderConfig<TFunctionType, TContext, TArgs, TReturns, TVisibility>;

  constructor(
    config: BuilderConfig<TFunctionType, TContext, TArgs, TReturns, TVisibility>
  ) {
    this.config = config;
  }

  query(): UdfBuilder<"query", QueryCtx, undefined, undefined, "public"> {
    return new UdfBuilder({
      functionType: "query",
      middlewares: [],
      visibility: "public",
    });
  }

  mutation(): UdfBuilder<"mutation", MutationCtx, undefined, undefined, "public"> {
    return new UdfBuilder({
      functionType: "mutation",
      middlewares: [],
      visibility: "public",
    });
  }

  action(): UdfBuilder<"action", ActionCtx, undefined, undefined, "public"> {
    return new UdfBuilder({
      functionType: "action",
      middlewares: [],
      visibility: "public",
    });
  }

  use<TAddedContext extends Record<string, unknown>>(
    middleware: Middleware<TContext, TAddedContext>
  ): UdfBuilder<
    TFunctionType,
    TContext & TAddedContext,
    TArgs,
    TReturns,
    TVisibility
  > {
    return new UdfBuilder({
      ...this.config,
      middlewares: [...this.config.middlewares, middleware as MiddlewareFn],
    }) as UdfBuilder<TFunctionType, TContext & TAddedContext, TArgs, TReturns, TVisibility>;
  }

  internal(): UdfBuilder<TFunctionType, TContext, TArgs, TReturns, "internal"> {
    return new UdfBuilder({
      ...this.config,
      visibility: "internal",
    }) as UdfBuilder<TFunctionType, TContext, TArgs, TReturns, "internal">;
  }

  public(): UdfBuilder<TFunctionType, TContext, TArgs, TReturns, "public"> {
    return new UdfBuilder({
      ...this.config,
      visibility: "public",
    }) as UdfBuilder<TFunctionType, TContext, TArgs, TReturns, "public">;
  }

  args<TArgsValidator extends PropertyValidators>(
    argsValidator: TArgsValidator
  ): UdfBuilder<TFunctionType, TContext, TArgsValidator, TReturns, TVisibility> {
    return new UdfBuilder({
      ...this.config,
      argsValidator,
    }) as UdfBuilder<TFunctionType, TContext, TArgsValidator, TReturns, TVisibility>;
  }

  returns<TReturnsValidator extends GenericValidator>(
    returnsValidator: TReturnsValidator
  ): UdfBuilder<TFunctionType, TContext, TArgs, TReturnsValidator, TVisibility> {
    return new UdfBuilder({
      ...this.config,
      returnsValidator,
    }) as UdfBuilder<TFunctionType, TContext, TArgs, TReturnsValidator, TVisibility>;
  }

  handler<TReturn>(
    handlerFn: (
      ctx: TContext,
      args: TArgs extends PropertyValidators ? InferArgs<TArgs> : Record<never, never>
    ) => Promise<TReturn>
  ): TFunctionType extends "query"
    ? TVisibility extends "public"
      ? RegisteredQuery<"public", TArgs extends PropertyValidators ? InferArgs<TArgs> : Record<never, never>, Promise<TReturn>>
      : RegisteredQuery<"internal", TArgs extends PropertyValidators ? InferArgs<TArgs> : Record<never, never>, Promise<TReturn>>
    : TFunctionType extends "mutation"
    ? TVisibility extends "public"
      ? RegisteredMutation<"public", TArgs extends PropertyValidators ? InferArgs<TArgs> : Record<never, never>, Promise<TReturn>>
      : RegisteredMutation<"internal", TArgs extends PropertyValidators ? InferArgs<TArgs> : Record<never, never>, Promise<TReturn>>
    : TFunctionType extends "action"
    ? TVisibility extends "public"
      ? RegisteredAction<"public", TArgs extends PropertyValidators ? InferArgs<TArgs> : Record<never, never>, Promise<TReturn>>
      : RegisteredAction<"internal", TArgs extends PropertyValidators ? InferArgs<TArgs> : Record<never, never>, Promise<TReturn>>
    : never {
    const { functionType, middlewares, argsValidator, returnsValidator, visibility } = this.config;

    // Compose middleware with the handler
    const composedHandler = async (baseCtx: AnyContext, baseArgs: TArgs extends PropertyValidators ? InferArgs<TArgs> : Record<never, never>) => {
      let extendedCtx = baseCtx as TContext;
      
      for (const middleware of middlewares) {
        const additionalContext = await middleware(extendedCtx as AnyContext);
        extendedCtx = { ...extendedCtx, ...additionalContext } as TContext;
      }
      
      return handlerFn(extendedCtx, baseArgs);
    };

    // Build the config object that Convex expects
    const config = returnsValidator 
      ? { args: argsValidator || {}, returns: returnsValidator, handler: composedHandler }
      : { args: argsValidator || {}, handler: composedHandler };

    // Call the appropriate Convex registration function
    if (functionType === "query") {
      return (visibility === "public"
        ? query(config as never)
        : internalQuery(config as never)) as never;
    }

    if (functionType === "mutation") {
      return (visibility === "public"
        ? mutation(config as never)
        : internalMutation(config as never)) as never;
    }

    if (functionType === "action") {
      return (visibility === "public"
        ? action(config as never)
        : internalAction(config as never)) as never;
    }

    throw new Error(`Unknown function type: ${functionType}`);
  }
}

export const udf = new UdfBuilder({
  functionType: undefined as never,
  middlewares: [],
  visibility: "public",
});

