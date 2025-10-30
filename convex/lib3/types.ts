import type { StandardSchemaV1 } from "@standard-schema/spec";

export type Schema<I, O = I> = StandardSchemaV1<I, O>;

export type AnySchema = Schema<any, any>;

export type SchemaIssue = StandardSchemaV1.Issue;

export type InferSchemaInput<T extends AnySchema> =
  T extends StandardSchemaV1<infer UInput, any> ? UInput : never;

export type InferSchemaOutput<T extends AnySchema> =
  T extends StandardSchemaV1<any, infer UOutput> ? UOutput : never;

export type Context = Record<PropertyKey, any>;
