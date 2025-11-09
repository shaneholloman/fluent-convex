/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as lib_builder from "../../../src/builder.js";
import type * as lib_index from "../../../src/index.js";
import type * as lib_middleware from "../../../src/middleware.js";
import type * as lib_types from "../../../src/types.js";
import type * as lib_zod_support from "../../../src/zod_support.js";
import type * as myFunctions from "../myFunctions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "lib/builder": typeof lib_builder;
  "lib/index": typeof lib_index;
  "lib/middleware": typeof lib_middleware;
  "lib/types": typeof lib_types;
  "lib/zod_support": typeof lib_zod_support;
  myFunctions: typeof myFunctions;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
