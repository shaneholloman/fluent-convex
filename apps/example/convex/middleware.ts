import { convex } from "./lib";
import { action } from "./_generated/server";
 
// A middleware that checks if the user is authenticated
export const authMiddleware = convex
  .query()
  .middleware(async ({ context, next }) => {
    const identity = await context.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    return next({
      context: {
        ...context,
        user: {
          id: identity.subject,
          name: identity.name ?? "Unknown",
        },
      },
    });
  });


export const authActionMiddleware = convex
  .action()
  .middleware(async ({ context, next }) => {
    const identity = await context.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    return next({
      context: {
        ...context,
        user: {
          id: identity.subject,
          name: identity.name ?? "Unknown",
        },
      },
    });
  });

export const addTimestamp = convex
  .query()
  .middleware(async ({ context, next }) => {
    return next({
      context: {
        ...context,
        timestamp: Date.now(),
      },
    });
  });
