import { v } from "convex/values";
import { udf } from "./lib/udf_builder";

// Example middleware
const someMiddleware = async (ctx: { auth: { getUserIdentity: () => Promise<{ subject: string; name?: string } | null> } }) => {
  const identity = await ctx.auth.getUserIdentity();
  return {
    currentUser: identity?.name ?? "Anonymous",
  };
};

// This matches your desired API usage from the request:
export const myQuery = udf
  .query()
  .use(someMiddleware)
  .args({ count: v.number() })
  .handler(async (ctx, args) => {
    const numbers = await ctx.db
      .query("numbers")
      .order("desc")
      .take(args.count);
    
    return {
      viewer: (await ctx.auth.getUserIdentity())?.name ?? null,
      numbers: numbers.reverse().map((number) => number.value),
    };
  });

// Example with multiple middleware
const addRequestId = async (_ctx: { currentUser: string }) => {
  return {
    requestId: Math.random().toString(36).substring(7),
  };
};

export const queryWithMultipleMiddleware = udf
  .query()
  .use(someMiddleware)
  .use(addRequestId)
  .args({ limit: v.number() })
  .handler(async (ctx, args) => {
    // ctx has currentUser and requestId available
    console.log(`Request ${ctx.requestId} from ${ctx.currentUser}`);
    const numbers = await ctx.db.query("numbers").take(args.limit);
    return numbers;
  });

// Internal mutation example
export const internalAddNumber = udf
  .mutation()
  .internal()
  .args({ value: v.number() })
  .returns(v.id("numbers"))
  .handler(async (ctx, args) => {
    return await ctx.db.insert("numbers", { value: args.value });
  });

// Public action example
export const myAction = udf
  .action()
  .args({ url: v.string() })
  .handler(async (ctx, args) => {
    const response = await fetch(args.url);
    return await response.text();
  });

