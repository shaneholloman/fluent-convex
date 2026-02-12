/**
 * middleware.ts — Reusable middleware definitions for fluent-convex.
 *
 * Middleware transforms the context object before (and optionally after)
 * the handler runs. There are two main patterns:
 *
 *   1. Context-enrichment — adds new properties to the context
 *   2. Onion (wrap) — runs code before AND after the handler
 */

import { convex } from "./lib";
import type { Auth } from "convex/server";

// ---------------------------------------------------------------------------
// #region authMiddleware
// Context-enrichment middleware: checks authentication and adds `user`
// to the context. Works with queries, mutations, and actions because
// we scope the required context to the minimal `{ auth: Auth }` shape
// that all Convex function types share.
export const authMiddleware = convex
  .$context<{ auth: Auth }>()
  .createMiddleware(async (context, next) => {
    const identity = await context.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Everything downstream now has `context.user` available
    return next({
      ...context,
      user: {
        id: identity.subject,
        name: identity.name ?? "Unknown",
      },
    });
  });
// #endregion

// ---------------------------------------------------------------------------
// #region addTimestamp
// Simple context-enrichment middleware: injects the current timestamp
// into the context so handlers can use `context.timestamp`.
export const addTimestamp = convex.createMiddleware(async (context, next) => {
  return next({
    ...context,
    timestamp: Date.now(),
  });
});
// #endregion

// ---------------------------------------------------------------------------
// #region withLogging
// Onion middleware (parameterized): wraps the entire downstream chain
// so it can measure execution time and catch errors. Because `next()`
// executes all subsequent middleware + the handler, this middleware
// "surrounds" them like layers of an onion.
export const withLogging = (operationName: string) =>
  convex.createMiddleware(async (context, next) => {
    const start = Date.now();
    console.log(`[${operationName}] Starting...`);
    try {
      const result = await next(context);
      const duration = Date.now() - start;
      console.log(`[${operationName}] Completed in ${duration}ms`);
      return result;
    } catch (error: any) {
      const duration = Date.now() - start;
      console.error(
        `[${operationName}] Failed after ${duration}ms: ${error.message}`
      );
      throw error;
    }
  });
// #endregion
