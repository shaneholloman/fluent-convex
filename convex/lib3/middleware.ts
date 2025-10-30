import type { MaybeOptionalOptions, Promisable } from "@orpc/shared";
import type { AnyProcedure } from "./procedure";
import type { Context } from "./types";

export type MiddlewareResult<TOutContext extends Context> = Promisable<{
  output: any;
  context: TOutContext;
}>;

/**
 * By conditional checking `Record<never, never> extends TOutContext`
 * users can avoid declaring `context` when TOutContext can be empty.
 *
 */
export type MiddlewareNextFnOptions<TOutContext extends Context> =
  Record<never, never> extends TOutContext
    ? { context?: TOutContext }
    : { context: TOutContext };

export interface MiddlewareNextFn {
  <U extends Context = Record<never, never>>(
    ...rest: MaybeOptionalOptions<MiddlewareNextFnOptions<U>>
  ): MiddlewareResult<U>;
}

export interface MiddlewareOptions<TInContext extends Context> {
  context: TInContext;
  path: readonly string[];
  procedure: AnyProcedure;
  signal?: AbortSignal;
  next: MiddlewareNextFn;
}

export interface Middleware<
  TInContext extends Context,
  TOutContext extends Context,
> {
  (
    options: MiddlewareOptions<TInContext>,
  ): Promisable<MiddlewareResult<TOutContext>>;
}

export type AnyMiddleware = Middleware<any, any>;
