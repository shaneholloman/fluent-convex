import { v } from "convex/values";
import { udf } from "./lib/udf_builder";
import type { QueryCtx, MutationCtx } from "./lib/types";

// Advanced middleware patterns

// 1. Authentication middleware that throws on failure
const requireAuth = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: Please sign in to continue");
  }

  return {
    user: {
      id: identity.subject,
      email: identity.email ?? "unknown@example.com",
      name: identity.name ?? "Unknown User",
    },
  };
};

// 2. Rate limiting metadata middleware
const addRateLimitInfo = async (_ctx: { user: { id: string; email: string; name: string } }) => {
  return {
    rateLimit: {
      remaining: 100,
      resetAt: Date.now() + 60000,
    },
  };
};

// 3. Logging middleware
const withLogging = async (ctx: QueryCtx | MutationCtx) => {
  const startTime = Date.now();
  return {
    perf: {
      startTime,
      log: (message: string) => console.log(`[${Date.now() - startTime}ms] ${message}`),
    },
  };
};

// Example: Protected query with multiple middleware
export const getProtectedData = udf
  .query()
  .use(requireAuth)
  .use(addRateLimitInfo)
  .use(withLogging)
  .args({ 
    dataId: v.id("numbers"),
  })
  .handler(async (ctx, args) => {
    ctx.perf.log(`Fetching data for user ${ctx.user.name}`);
    
    const data = await ctx.db.get(args.dataId);
    if (!data) {
      throw new Error("Data not found");
    }

    ctx.perf.log("Data fetched successfully");

    return {
      data,
      user: ctx.user,
      rateLimit: ctx.rateLimit,
    };
  });

// Example: Mutation with validation middleware
const validateNumberRange = async (_ctx: { user: { id: string; email: string; name: string } }) => {
  return {
    validation: {
      maxValue: 1000,
      minValue: -1000,
    },
  };
};

export const addValidatedNumber = udf
  .mutation()
  .use(requireAuth)
  .use(validateNumberRange)
  .args({ value: v.number() })
  .returns(v.id("numbers"))
  .handler(async (ctx, args) => {
    if (args.value > ctx.validation.maxValue || args.value < ctx.validation.minValue) {
      throw new Error(`Value must be between ${ctx.validation.minValue} and ${ctx.validation.maxValue}`);
    }

    return await ctx.db.insert("numbers", { value: args.value });
  });

// Example: Internal query with custom context
export const internalGetStats = udf
  .query()
  .internal()
  .args({})
  .handler(async (ctx, _args) => {
    const numbers = await ctx.db.query("numbers").collect();
    return {
      count: numbers.length,
      sum: numbers.reduce((acc, n) => acc + n.value, 0),
      avg: numbers.length > 0 
        ? numbers.reduce((acc, n) => acc + n.value, 0) / numbers.length 
        : 0,
    };
  });

// Example: Query without middleware but with returns validator
export const getNumberById = udf
  .query()
  .args({ id: v.id("numbers") })
  .returns(v.union(
    v.object({ value: v.number() }),
    v.null()
  ))
  .handler(async (ctx, args) => {
    const number = await ctx.db.get(args.id);
    if (!number) return null;
    return { value: number.value };
  });

// Example: Chaining the same middleware multiple times
export const deeplyNestedContext = udf
  .query()
  .use(requireAuth)
  .use(addRateLimitInfo)
  .use(withLogging)
  .args({ count: v.number() })
  .handler(async (ctx, args) => {
    ctx.perf.log("Starting query");
    
    const numbers = await ctx.db
      .query("numbers")
      .order("desc")
      .take(args.count);

    ctx.perf.log("Query complete");

    return {
      numbers: numbers.map(n => n.value),
      user: ctx.user.name,
      rateLimit: ctx.rateLimit,
    };
  });

