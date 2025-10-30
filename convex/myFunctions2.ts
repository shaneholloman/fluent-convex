import { v } from "convex/values";
import { udf } from "./lib/udf_builder";

// Example middleware that adds user info to context
const requireAuth = async (ctx: {
  auth: {
    getUserIdentity: () => Promise<{ subject: string; name?: string } | null>;
  };
}) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  return {
    user: {
      id: identity.subject,
      name: identity.name ?? "Unknown",
    },
  };
};

// Public query with middleware using fluent API
export const listNumbers = udf
  .query()
  .use(requireAuth)
  .args({ count: v.number() })
  .handler(async (ctx, args) => {
    const numbers = await ctx.db
      .query("numbers")
      .order("desc")
      .take(args.count);

    return {
      viewer: ctx.user.name,
      numbers: numbers.reverse().map((number) => number.value),
    };
  });

export const listNumbersNoAuth = udf
  .query()
  .args({ count: v.number() })
  .handler(async (ctx, args) => {
    const numbers = await ctx.db
      .query("numbers")
      .order("desc")
      .take(args.count);

      
    return {
      viewer: "",
      numbers: numbers.reverse().map((number) => number.value),
    };
  });

// Public mutation without middleware
export const addNumber = udf
  .mutation()
  .args({ value: v.number() })
  .handler(async (ctx, args) => {
    const id = await ctx.db.insert("numbers", { value: args.value });
    return id;
  });

// Internal query without middleware
export const internalListAll = udf
  .query()
  .internal()
  .args({})
  .handler(async (ctx, _args) => {
    const numbers = await ctx.db.query("numbers").collect();
    return numbers;
  });

// Query with multiple middleware
const addTimestamp = async (_ctx: { user: { id: string; name: string } }) => {
  return {
    timestamp: Date.now(),
  };
};

export const listNumbersWithTimestamp = udf
  .query()
  .use(requireAuth)
  .use(addTimestamp)
  .args({ count: v.number() })
  .handler(async (ctx, args) => {
    const numbers = await ctx.db
      .query("numbers")
      .order("desc")
      .take(args.count);

    return {
      viewer: ctx.user.name,
      timestamp: ctx.timestamp,
      numbers: numbers.map((number) => number.value),
    };
  });

// Mutation with optional returns validator
export const addNumberWithValidation = udf
  .mutation()
  .args({ value: v.number() })
  .returns(v.id("numbers"))
  .handler(async (ctx, args) => {
    return await ctx.db.insert("numbers", { value: args.value });
  });
