import type {
  GenericQueryCtx,
  GenericMutationCtx,
  GenericActionCtx,
} from "convex/server";
import type { GenericValidator, PropertyValidators } from "convex/values";
import type { DataModel } from "../_generated/dataModel";

export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;
export type ActionCtx = GenericActionCtx<DataModel>;

export type AnyContext = QueryCtx | MutationCtx | ActionCtx;

export type Middleware<TInContext extends AnyContext, TAddedContext extends Record<string, unknown>> = (
  ctx: TInContext
) => Promise<TAddedContext>;

export type InferArgs<T extends PropertyValidators> = {
  [K in keyof T]: T[K] extends GenericValidator
    ? T[K]["isOptional"] extends true
      ? T[K]["type"] | undefined
      : T[K]["type"]
    : never;
};

export type Visibility = "public" | "internal";
export type FunctionType = "query" | "mutation" | "action";

