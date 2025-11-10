import type { PropertyValidators, GenericValidator } from "convex/values";
import type {
  GenericActionCtx,
  GenericMutationCtx,
  GenericQueryCtx,
  GenericDataModel,
} from "convex/server";

export type Context = Record<PropertyKey, any>;

export type ConvexArgsValidator = PropertyValidators | GenericValidator;
export type ConvexReturnsValidator = GenericValidator;

type ValidatorType<T> = T extends GenericValidator ? T["type"] : never;

type OptionalKeys<T extends Record<PropertyKey, any>> = {
  [K in keyof T]: T[K] extends GenericValidator
    ? T[K]["isOptional"] extends "optional"
      ? K
      : never
    : never;
}[keyof T];

type RequiredKeys<T extends Record<PropertyKey, any>> = {
  [K in keyof T]: T[K] extends GenericValidator
    ? T[K]["isOptional"] extends "optional"
      ? never
      : K
    : never;
}[keyof T];

type OptionalArgs<T extends Record<PropertyKey, any>> = {
  [K in OptionalKeys<T>]?: T[K] extends GenericValidator
    ? ValidatorType<T[K]> | undefined
    : never;
};

type RequiredArgs<T extends Record<PropertyKey, any>> = {
  [K in RequiredKeys<T>]: ValidatorType<T[K]>;
};

export type InferArgs<T extends ConvexArgsValidator> =
  T extends GenericValidator ? T["type"] : RequiredArgs<T> & OptionalArgs<T>;

export type Promisable<T> = T | PromiseLike<T>;

export type QueryCtx<DataModel extends GenericDataModel = GenericDataModel> =
  GenericQueryCtx<DataModel>;
export type MutationCtx<DataModel extends GenericDataModel = GenericDataModel> =
  GenericMutationCtx<DataModel>;
export type ActionCtx<DataModel extends GenericDataModel = GenericDataModel> =
  GenericActionCtx<DataModel>;

export type FunctionType = "query" | "mutation" | "action";
export type Visibility = "public" | "internal";
