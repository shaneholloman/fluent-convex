import {
  query,
  mutation,
  action,
  internalQuery,
  internalMutation,
  internalAction,
  type QueryCtx,
  type MutationCtx,
  type ActionCtx,
} from "../_generated/server";
import type { PropertyValidators } from "convex/values";

type Middleware<TIn, TOut> = (ctx: TIn) => Promise<TOut>;

type InferArgs<T extends PropertyValidators> = {
  [K in keyof T]: T[K] extends { type: infer U } ? U : never;
};

class QueryBuilder<
  TContext extends QueryCtx = QueryCtx,
  TArgs extends PropertyValidators = {},
> {
  private middlewares: Array<(ctx: QueryCtx) => Promise<Record<string, unknown>>> = [];
  private argsValidator?: TArgs;
  private isInternal = false;

  use<TAdded extends Record<string, unknown>>(
    middleware: Middleware<TContext, TAdded>
  ): QueryBuilder<TContext & TAdded, TArgs> {
    const newBuilder = new QueryBuilder<TContext & TAdded, TArgs>();
    newBuilder.middlewares = [...this.middlewares, middleware as (ctx: QueryCtx) => Promise<Record<string, unknown>>];
    newBuilder.argsValidator = this.argsValidator;
    newBuilder.isInternal = this.isInternal;
    return newBuilder;
  }

  args<TNewArgs extends PropertyValidators>(
    validators: TNewArgs
  ): QueryBuilder<TContext, TNewArgs> {
    const newBuilder = new QueryBuilder<TContext, TNewArgs>();
    newBuilder.middlewares = this.middlewares;
    newBuilder.argsValidator = validators;
    newBuilder.isInternal = this.isInternal;
    return newBuilder;
  }

  internal(): QueryBuilder<TContext, TArgs> {
    const newBuilder = new QueryBuilder<TContext, TArgs>();
    newBuilder.middlewares = this.middlewares;
    newBuilder.argsValidator = this.argsValidator;
    newBuilder.isInternal = true;
    return newBuilder;
  }

  handler<TReturn>(
    handlerFn: (ctx: TContext, args: InferArgs<TArgs>) => Promise<TReturn>
  ) {
    const middlewares = this.middlewares;
    const argsValidator = this.argsValidator || {};
    
    const wrappedHandler = async (ctx: QueryCtx, args: InferArgs<TArgs>) => {
      let extendedCtx = ctx as TContext;
      for (const mw of middlewares) {
        const added = await mw(extendedCtx as QueryCtx);
        extendedCtx = { ...extendedCtx, ...added } as TContext;
      }
      return handlerFn(extendedCtx, args);
    };

    const config = { args: argsValidator, handler: wrappedHandler };
    
    return this.isInternal 
      ? internalQuery(config as never)
      : query(config as never);
  }
}

export const udf = {
  query: () => new QueryBuilder(),
};

