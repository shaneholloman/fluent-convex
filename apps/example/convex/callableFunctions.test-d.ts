import { describe, it, assertType, expectTypeOf } from "vitest";
import { createBuilder } from "fluent-convex";
import { v } from "convex/values";
import schema from "./schema";

const convex = createBuilder(schema);

describe("Callable Functions Type Tests", () => {
  it("should allow calling callable functions from handlers", () => {
    const callableHelper = convex
      .query()
      .input({ count: v.number() })
      .handler(async ({ context, input }) => {
        return { count: input.count };
      });

    convex
      .query()
      .input({ count: v.number() })
      .handler(async ({ context, input }) => {
        // Should be able to call the callable helper
        const result = await callableHelper(context)(input);
        expectTypeOf(result).toEqualTypeOf<{ count: number }>();
        return result;
      })
      .public();
  });

  it("should preserve types when calling callable functions", () => {
    const getNumbers = convex
      .query()
      .input({ count: v.number() })
      .handler(async ({ context, input }) => {
        const numbers = await context.db
          .query("numbers")
          .order("desc")
          .take(input.count);
        return {
          numbers: numbers.map((n) => n.value),
        };
      });

    const getStats = convex
      .query()
      .input({ count: v.number() })
      .handler(async ({ context, input }) => {
        const numbers = await context.db
          .query("numbers")
          .order("desc")
          .take(input.count);
        const values = numbers.map((n) => n.value);
        return {
          count: values.length,
          sum: values.reduce((a, b) => a + b, 0),
        };
      });

    convex
      .query()
      .input({ count: v.number() })
      .handler(async ({ context, input }) => {
        // Call multiple callable functions
        const [numbersResult, statsResult] = await Promise.all([
          getNumbers(context)(input),
          getStats(context)(input),
        ]);

        expectTypeOf(numbersResult.numbers).toEqualTypeOf<number[]>();
        expectTypeOf(statsResult.count).toEqualTypeOf<number>();
        expectTypeOf(statsResult.sum).toEqualTypeOf<number>();

        return {
          numbers: numbersResult.numbers,
          stats: statsResult,
        };
      })
      .public();
  });

  it("should allow chaining callable function calls", () => {
    const getNumbers = convex
      .query()
      .input({ count: v.number() })
      .handler(async ({ context, input }) => {
        return { count: input.count };
      });

    const processNumbers = convex
      .query()
      .input({ count: v.number() })
      .handler(async ({ context, input }) => {
        const firstResult = await getNumbers(context)(input);
        return { processed: firstResult.count * 2 };
      });

    convex
      .query()
      .input({ count: v.number() })
      .handler(async ({ context, input }) => {
        // Chain callable calls
        const result = await processNumbers(context)(input);
        expectTypeOf(result.processed).toEqualTypeOf<number>();
        return result;
      })
      .public();
  });

  it("should work with callable functions that have middleware", () => {
    const addTimestamp = convex.middleware(async ({ context, next }) => {
      return next({
        context: {
          ...context,
          timestamp: Date.now(),
        },
      });
    });

    const callableWithMiddleware = convex
      .query()
      .input({ count: v.number() })
      .use(addTimestamp)
      .handler(async ({ context, input }) => {
        expectTypeOf(context.timestamp).toEqualTypeOf<number>();
        return { count: input.count, timestamp: context.timestamp };
      });

    convex
      .query()
      .input({ count: v.number() })
      .use(addTimestamp)
      .handler(async ({ context, input }) => {
        // Need to add the same middleware to provide timestamp context
        const result = await callableWithMiddleware(context)(input);
        expectTypeOf(result.timestamp).toEqualTypeOf<number>();
        return result;
      })
      .public();
  });

  it("should work with callable functions that have optional inputs", () => {
    const callableWithOptional = convex
      .query()
      .input({
        required: v.number(),
        optional: v.optional(v.string()),
      })
      .handler(async ({ input }) => {
        return {
          required: input.required,
          optional: input.optional,
        };
      });

    convex
      .query()
      .input({ count: v.number() })
      .handler(async ({ context, input }) => {
        const result = await callableWithOptional(context)({
          required: input.count,
          optional: "test",
        });
        expectTypeOf(result.required).toEqualTypeOf<number>();
        expectTypeOf(result.optional).toEqualTypeOf<string | undefined>();
        return result;
      })
      .public();
  });

  it("should work with callable functions that return complex types", () => {
    const callableComplex = convex
      .query()
      .input({ count: v.number() })
      .returns(
        v.object({
          numbers: v.array(v.number()),
          stats: v.object({
            sum: v.number(),
            average: v.number(),
          }),
        }),
      )
      .handler(async ({ input }) => {
        return {
          numbers: [1, 2, 3],
          stats: {
            sum: 6,
            average: 2,
          },
        };
      });

    convex
      .query()
      .input({ count: v.number() })
      .handler(async ({ context, input }) => {
        const result = await callableComplex(context)(input);
        expectTypeOf(result.numbers).toEqualTypeOf<number[]>();
        expectTypeOf(result.stats.sum).toEqualTypeOf<number>();
        expectTypeOf(result.stats.average).toEqualTypeOf<number>();
        return result;
      })
      .public();
  });

  it("should prevent calling registered functions as callable", () => {
    const registeredQuery = convex
      .query()
      .input({ count: v.number() })
      .handler(async ({ input }) => {
        return { count: input.count };
      })
      .public();

    convex
      .query()
      .input({ count: v.number() })
      .handler(async ({ context, input }) => {
        // @ts-expect-error - RegisteredQuery is not callable
        await registeredQuery(context)(input);
        return { success: true };
      })
      .public();
  });

  it("should allow using callable functions in mutations", () => {
    const callableQuery = convex
      .query()
      .input({ count: v.number() })
      .handler(async ({ context, input }) => {
        const numbers = await context.db
          .query("numbers")
          .order("desc")
          .take(input.count);
        return { count: numbers.length };
      });

    const callableMutation = convex
      .mutation()
      .input({ value: v.number() })
      .handler(async ({ context, input }) => {
        return await context.db.insert("numbers", { value: input.value });
      });

    convex
      .mutation()
      .input({ value: v.number() })
      .handler(async ({ context, input }) => {
        // Can call callable query from mutation
        const queryResult = await callableQuery(context)({ count: 5 });
        expectTypeOf(queryResult.count).toEqualTypeOf<number>();

        // Can call callable mutation from mutation
        const id = await callableMutation(context)({ value: input.value });
        expectTypeOf(id).toMatchTypeOf<string>();

        return id;
      })
      .public();
  });

  it("should allow using callable functions in actions", () => {
    // Note: Queries can't be called directly from actions because they need db
    // Instead, we can create a callable action helper
    const callableAction = convex
      .action()
      .input({ count: v.number() })
      .handler(async ({ input }) => {
        return { count: input.count };
      });

    convex
      .action()
      .input({ count: v.number() })
      .handler(async ({ context, input }) => {
        // Can call callable action from action
        const result = await callableAction(context)(input);
        expectTypeOf(result.count).toEqualTypeOf<number>();
        return { success: true };
      })
      .public();
  });
});

