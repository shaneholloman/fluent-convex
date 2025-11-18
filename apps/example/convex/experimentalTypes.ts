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

type TestQuery = RegisteredQuery<"public", TArgs, Promise<THandlerReturn>> &
  ((context: TContext) => (args: TArgs) => Promise<THandlerReturn>);

// Making sure the query is callable
const myQuery: TestQuery = null as any;
myQuery({} as any)({ count: 1 });

type TestApi = {
  myFunction: TestQuery;
};

// Filter for internal functions
type Filtered = FilterApi<TestApi, FunctionReference<any, "public">>;

// Making sure that the MyFunctionExists
type MyFunctionShouldExist = Filtered["myFunction"];
