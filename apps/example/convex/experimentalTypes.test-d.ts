import type {
  FunctionReference,
  FilterApi,
  RegisteredQuery,
  GenericQueryCtx,
} from "convex/server";

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

// Test that it works
const _test1: MyFunctionShouldExist = null as any;

// Now let's test with a conditional type (like what the builder returns)
type ConditionalQuery<T extends "query" | "mutation"> = T extends "query"
  ? RegisteredQuery<"public", TArgs, Promise<THandlerReturn>> &
      ((context: TContext) => (args: TArgs) => Promise<THandlerReturn>)
  : never;

type ConditionalApi = {
  myFunction: ConditionalQuery<"query">;
};

// Filter for public functions - THIS DOESN'T WORK
// FilterApi filters out the function because it doesn't recognize the conditional type
type FilteredConditional = FilterApi<
  ConditionalApi,
  FunctionReference<any, "public">
>;

// This will be never/undefined - demonstrating the issue
// FilterApi doesn't recognize conditional types that evaluate to intersection types
type MyFunctionShouldExistButDoesnt = FilteredConditional["myFunction"];

// Demonstrate the issue: MyFunctionShouldExistButDoesnt is never/undefined
// This shows that FilterApi filtered out the function even though it should extend FunctionReference
type _IssueDemonstration = MyFunctionShouldExistButDoesnt extends never
  ? "ISSUE: FilterApi filtered out the function (it's never)"
  : "OK: Function exists in filtered API";

// The problem: When the builder returns a conditional type like:
//   TFunctionType extends "query" ? RegisteredQuery & CallableFunction : ...
// FilterApi doesn't recognize it as extending FunctionReference, even though
// RegisteredQuery extends FunctionReference and the intersection should also extend it.
