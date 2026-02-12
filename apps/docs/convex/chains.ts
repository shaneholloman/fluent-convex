/**
 * chains.ts — Reusable chains and the callable syntax.
 *
 * This file demonstrates the most powerful pattern in fluent-convex:
 * building "library functions" that can be reused, extended, and
 * tested BEFORE they are registered with .public() or .internal().
 *
 * Key concepts:
 *   - A builder with a handler but NO .public()/.internal() is "callable"
 *   - Callable builders can be called directly for testing
 *   - You can add more middleware to a callable and then register it
 *   - The same base function can be registered multiple ways
 */

import { v } from "convex/values";
import { convex } from "./lib";
import { authMiddleware, addTimestamp, withLogging } from "./middleware";

// ---------------------------------------------------------------------------
// Using middleware with .use()
// ---------------------------------------------------------------------------

// #region usingMiddleware
// Single middleware — adds `context.user`
export const authedNumbers = convex
  .query()
  .use(authMiddleware)
  .input({ count: v.number() })
  .handler(async (ctx, input) => {
    const numbers = await ctx.db.query("numbers").order("desc").take(input.count);
    return {
      viewer: ctx.user.name, // <-- from authMiddleware
      numbers: numbers.map((n) => n.value),
    };
  })
  .public();

// Multiple middleware — each .use() merges its context additions
export const loggedAuthedNumbers = convex
  .query()
  .use(withLogging("loggedAuthedNumbers"))
  .use(authMiddleware)
  .use(addTimestamp)
  .input({ count: v.number() })
  .handler(async (ctx, input) => {
    const numbers = await ctx.db.query("numbers").order("desc").take(input.count);
    return {
      viewer: ctx.user.name, // <-- from authMiddleware
      timestamp: ctx.timestamp, // <-- from addTimestamp
      numbers: numbers.map((n) => n.value),
      // withLogging wraps this handler and logs timing to the console
    };
  })
  .public();
// #endregion

// ---------------------------------------------------------------------------
// Pattern 1: Define once, register multiple ways
// ---------------------------------------------------------------------------

// #region reusableBase
// This callable is NOT yet registered — it's a reusable building block.
const listNumbersBase = convex
  .query()
  .input({ count: v.number() })
  .handler(async (ctx, input) => {
    const numbers = await ctx.db
      .query("numbers")
      .order("desc")
      .take(input.count);
    return { numbers: numbers.map((n) => n.value) };
  });

// Register it publicly — anyone can call this
export const listNumbers = listNumbersBase.public();

// Add auth middleware on top, then register — same logic, now protected
export const listNumbersProtected = listNumbersBase
  .use(authMiddleware)
  .public();
// #endregion

// ---------------------------------------------------------------------------
// Pattern 2: Stacking middleware on a callable
// ---------------------------------------------------------------------------

// #region stackedMiddleware
const listWithMetadata = convex
  .query()
  .input({ count: v.number() })
  .handler(async (ctx, input) => {
    const numbers = await ctx.db
      .query("numbers")
      .order("desc")
      .take(input.count);
    return {
      numbers: numbers.map((n) => n.value),
      timestamp: (ctx as any).timestamp as number | undefined,
    };
  });

// Stack logging + timestamp middleware, then register
export const listNumbersWithMetadata = listWithMetadata
  .use(withLogging("listNumbersWithMetadata"))
  .use(addTimestamp)
  .public();
// #endregion

// ---------------------------------------------------------------------------
// Pattern 3: Middleware AFTER handler
// ---------------------------------------------------------------------------

// #region middlewareAfterHandler
// You can add middleware after defining the handler.
// The middleware still runs BEFORE the handler at runtime.
export const queryWithPostHandlerMiddleware = convex
  .query()
  .input({ count: v.number() })
  .handler(async (ctx, input) => {
    const numbers = await ctx.db
      .query("numbers")
      .order("desc")
      .take(input.count);
    return {
      numbers: numbers.map((n) => n.value),
      // This will be set by middleware added below
      requestId: (ctx as any).requestId as string,
    };
  })
  .use(
    convex.query().createMiddleware(async (ctx, next) => {
      return next({
        ...ctx,
        requestId: `req-${Math.random().toString(36).slice(2, 8)}`,
      });
    })
  )
  .public();
// #endregion
