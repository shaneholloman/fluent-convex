import { describe, it, assertType } from "vitest";
import { convex } from "./builder";
import { v } from "convex/values";
import { z } from "zod";

describe("ConvexBuilder Type Tests", () => {
  describe("input validation", () => {
    it("should accept plain Convex PropertyValidators", () => {
      convex
        .query()
        .input({ count: v.number() })
        .handler(async ({ input }) => {
          assertType<{ count: number }>(input);
          return { success: true };
        });
    });

    it("should accept Convex v.object() validators", () => {
      convex
        .query()
        .input(v.object({ count: v.number() }))
        .handler(async ({ input }) => {
          assertType<{ count: number }>(input);
          return { success: true };
        });
    });

    it("should accept Zod object schemas", () => {
      convex
        .query()
        .input(z.object({ count: z.number() }))
        .handler(async ({ input }) => {
          assertType<{ count: number }>(input);
          return { success: true };
        });
    });

    it("should reject Zod primitive schemas (not objects)", () => {
      // @ts-expect-error z.number() is not a valid input validator
      convex.query().input(z.number());
    });

    it("should reject Zod string schemas", () => {
      // @ts-expect-error z.string() is not a valid input validator
      convex.query().input(z.string());
    });

    it("should accept Zod schemas with refinements", () => {
      convex
        .query()
        .input(z.object({ count: z.number() }).refine((data) => data.count > 0))
        .handler(async ({ input }) => {
          assertType<{ count: number }>(input);
          return { success: true };
        });
    });
  });

  describe("returns validation", () => {
    it("should accept Convex return validators", () => {
      convex
        .query()
        .input({ count: v.number() })
        .returns(v.object({ numbers: v.array(v.number()) }))
        .handler(async () => {
          return { numbers: [1, 2, 3] };
        });
    });

    it("should accept Zod return validators", () => {
      convex
        .query()
        .input({ count: v.number() })
        .returns(z.object({ numbers: z.array(z.number()) }))
        .handler(async () => {
          return { numbers: [1, 2, 3] };
        });
    });

    it("should accept Zod primitive return types", () => {
      convex
        .query()
        .input({ count: v.number() })
        .returns(z.number())
        .handler(async () => {
          return 42;
        });
    });
  });

  describe("middleware context transformation", () => {
    it("should extend context with middleware", () => {
      const authMiddleware = convex
        .query()
        .middleware(async ({ context, next }) => {
          return next({
            context: {
              ...context,
              user: { id: "123", name: "Test User" },
            },
          });
        });

      convex
        .query()
        .use(authMiddleware)
        .input({ count: v.number() })
        .handler(async ({ context }) => {
          // Context should have user property from middleware
          assertType<{ id: string; name: string }>(context.user);

          // Context should still have base QueryCtx properties
          assertType(context.db);
          assertType(context.auth);

          return { userId: context.user.id };
        });
    });

    it("should chain multiple middleware", () => {
      const authMiddleware = convex
        .query()
        .middleware(async ({ context, next }) => {
          return next({
            context: {
              ...context,
              user: { id: "123", name: "Test User" },
            },
          });
        });

      const loggingMiddleware = convex
        .query()
        .middleware(async ({ context, next }) => {
          return next({
            context: {
              ...context,
              requestId: "req-123",
            },
          });
        });

      convex
        .query()
        .use(authMiddleware)
        .use(loggingMiddleware)
        .input({ count: v.number() })
        .handler(async ({ context }) => {
          // Context should have both user and requestId
          assertType<{ id: string; name: string }>(context.user);
          assertType<string>(context.requestId);

          return { success: true };
        });
    });

    it("should work with mutations", () => {
      const authMiddleware = convex
        .mutation()
        .middleware(async ({ context, next }) => {
          return next({
            context: {
              ...context,
              userId: "user-123",
            },
          });
        });

      convex
        .mutation()
        .use(authMiddleware)
        .input({ name: v.string() })
        .handler(async ({ context, input }) => {
          assertType<string>(context.userId);
          assertType(context.db);
          assertType<string>(input.name);
          return null;
        });
    });

    it("should work with actions", () => {
      const authMiddleware = convex
        .action()
        .middleware(async ({ context, next }) => {
          return next({
            context: {
              ...context,
              token: "token-123",
            },
          });
        });

      convex
        .action()
        .use(authMiddleware)
        .input({ url: v.string() })
        .handler(async ({ context, input }) => {
          assertType<string>(context.token);
          assertType<string>(input.url);
          return { success: true };
        });
    });

    it("should respect middleware application order", () => {
      const first = convex.query().middleware(async ({ context, next }) => {
        return next({
          context: {
            ...context,
            first: "first",
          },
        });
      });

      const second = convex.query().middleware(async ({ context, next }) => {
        return next({
          context: {
            ...context,
            second: "second",
          },
        });
      });

      convex
        .query()
        .use(first)
        .use(second)
        .input({})
        .handler(async ({ context }) => {
          // Both middleware values should be available in the handler
          assertType<string>(context.first);
          assertType<string>(context.second);
          return { success: true };
        });
    });
  });

  describe("function types", () => {
    it("should create queries", () => {
      convex
        .query()
        .input({ id: v.string() })
        .handler(async ({ input }) => {
          assertType<string>(input.id);
          return { id: input.id };
        });
    });

    it("should create mutations", () => {
      convex
        .mutation()
        .input({ name: v.string() })
        .handler(async ({ input }) => {
          assertType<string>(input.name);
          return { name: input.name };
        });
    });

    it("should create actions", () => {
      convex
        .action()
        .input({ url: v.string() })
        .handler(async ({ input }) => {
          assertType<string>(input.url);
          return { url: input.url };
        });
    });

    it("should create internal queries", () => {
      convex
        .query()
        .internal()
        .input({ id: v.string() })
        .handler(async ({ input }) => {
          assertType<string>(input.id);
          return { id: input.id };
        });
    });

    it("should create internal mutations", () => {
      convex
        .mutation()
        .internal()
        .input({ value: v.number() })
        .handler(async ({ context, input }) => {
          assertType(context.db);
          assertType<number>(input.value);
          return { value: input.value };
        });
    });

    it("should create internal actions", () => {
      convex
        .action()
        .internal()
        .input({ url: v.string() })
        .handler(async ({ input }) => {
          assertType<string>(input.url);
          return { url: input.url };
        });
    });
  });

  describe("optional input", () => {
    it("should work without input validation", () => {
      convex.query().handler(async ({ input }) => {
        assertType<Record<never, never>>(input);
        return { success: true };
      });
    });
  });

  describe("complex types", () => {
    it("should handle nested Zod object schemas", () => {
      convex
        .query()
        .input(
          z.object({
            user: z.object({
              name: z.string(),
              age: z.number(),
            }),
            tags: z.array(z.string()),
          })
        )
        .handler(async ({ input }) => {
          assertType<string>(input.user.name);
          assertType<number>(input.user.age);
          assertType<string[]>(input.tags);

          return { success: true };
        });
    });

    it("should handle optional fields", () => {
      convex
        .query()
        .input({ name: v.string(), age: v.optional(v.number()) })
        .handler(async ({ input }) => {
          assertType<string>(input.name);
          assertType<number | undefined>(input.age);

          return { success: true };
        });
    });

    it("should handle v.union()", () => {
      convex
        .query()
        .input({
          value: v.union(v.string(), v.number()),
        })
        .handler(async ({ input }) => {
          assertType<string | number>(input.value);
          return { success: true };
        });
    });

    it("should handle v.array()", () => {
      convex
        .query()
        .input({
          tags: v.array(v.string()),
        })
        .handler(async ({ input }) => {
          assertType<string[]>(input.tags);
          return { success: true };
        });
    });

    it("should handle nested v.object()", () => {
      convex
        .query()
        .input({
          user: v.object({
            name: v.string(),
            age: v.number(),
          }),
        })
        .handler(async ({ input }) => {
          assertType<{ name: string; age: number }>(input.user);
          return { success: true };
        });
    });

    it("should handle v.literal()", () => {
      convex
        .query()
        .input({
          kind: v.literal("user"),
        })
        .handler(async ({ input }) => {
          assertType<"user">(input.kind);
          return { success: true };
        });
    });

    it("should handle mix of optional and required fields", () => {
      convex
        .query()
        .input({
          required: v.string(),
          optional: v.optional(v.string()),
          defaulted: v.optional(v.number()),
        })
        .handler(async ({ input }) => {
          assertType<string>(input.required);
          assertType<string | undefined>(input.optional);
          assertType<number | undefined>(input.defaulted);
          return { success: true };
        });
    });
  });

  describe("context types per function", () => {
    it("queries should have db and auth", () => {
      convex
        .query()
        .input({ id: v.string() })
        .handler(async ({ context }) => {
          assertType(context.db);
          assertType(context.auth);
          return { success: true };
        });
    });

    it("mutations should have db and auth", () => {
      convex
        .mutation()
        .input({ name: v.string() })
        .handler(async ({ context }) => {
          assertType(context.db);
          assertType(context.auth);
          return { success: true };
        });
    });

    it("actions should have auth and scheduler", () => {
      convex
        .action()
        .input({ url: v.string() })
        .handler(async ({ context }) => {
          assertType(context.auth);
          assertType(context.scheduler);
          return { success: true };
        });
    });
  });

  describe("order of operations", () => {
    it("should allow .internal() before function type", () => {
      convex
        .internal()
        .query()
        .input({ id: v.string() })
        .handler(async ({ input }) => {
          assertType<string>(input.id);
          return { id: input.id };
        });
    });

    it("should allow .internal() after function type", () => {
      convex
        .query()
        .internal()
        .input({ id: v.string() })
        .handler(async ({ input }) => {
          assertType<string>(input.id);
          return { id: input.id };
        });
    });
  });
});
