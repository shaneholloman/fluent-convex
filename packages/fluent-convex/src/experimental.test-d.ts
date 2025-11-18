import { describe, it, assertType, test, expectTypeOf } from "vitest";
import { v } from "convex/values";
import { z } from "zod";
import {
  defineSchema,
  defineTable,
  FunctionReference,
  FilterApi,
  RegisteredQuery,
  GenericQueryCtx,
  GenericDataModel,
} from "convex/server";
import { createBuilder } from "./builder";

const schema = defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),
});

const convex = createBuilder(schema);

test("it works experimentally ", () => {
  // Base types
  type TArgs = { count: number };
  type THandlerReturn = { numbers: number[] };
  type TContext = GenericQueryCtx<any>;

  // This type works - it's a direct intersection, not from a conditional type
  type TestQuery = RegisteredQuery<"public", TArgs, Promise<THandlerReturn>> &
    ((context: TContext) => (args: TArgs) => Promise<THandlerReturn>);

  type TestApi = {
    myFunction: TestQuery;
  };

  // Filter for public functions - THIS WORKS
  type Filtered = FilterApi<TestApi, FunctionReference<any, "public">>;

  // This should exist and not be never/undefined
  type MyFunctionShouldExist = Filtered["myFunction"];

  // Test that it works - the function should exist in the filtered API
  expectTypeOf<MyFunctionShouldExist>().not.toBeNever();
  expectTypeOf<MyFunctionShouldExist>().not.toBeUndefined();
});
