import { v } from "convex/values";
import { convex } from "./lib";
import { addTimestamp, addValueMiddleware } from "./middleware";

// Callable helper functions - these are NOT exported as registered functions
// They can be called directly from other functions
const lib = {
  // Query helpers
  listNumbers: convex
    .query()
    .input({ count: v.number() })
    .handler(async ({ context, input }) => {
      const numbers = await context.db
        .query("numbers")
        .order("desc")
        .take(input.count);

      return {
        numbers: numbers.reverse().map((number) => number.value),
      };
    }),

  getNumberStats: convex
    .query()
    .input({ count: v.number() })
    .handler(async ({ context, input }) => {
      const numbers = await context.db
        .query("numbers")
        .order("desc")
        .take(input.count);

      const values = numbers.map((n) => n.value);
      const sum = values.reduce((acc, val) => acc + val, 0);
      const avg = values.length > 0 ? sum / values.length : 0;
      const min = values.length > 0 ? Math.min(...values) : 0;
      const max = values.length > 0 ? Math.max(...values) : 0;

      return {
        count: values.length,
        sum,
        average: avg,
        min,
        max,
      };
    }),

  // Mutation helpers
  addNumberHelper: convex
    .mutation()
    .input({ value: v.number() })
    .handler(async ({ context, input }) => {
      return await context.db.insert("numbers", { value: input.value });
    }),

  deleteNumbersHelper: convex
    .mutation()
    .input({ minValue: v.number() })
    .handler(async ({ context, input }) => {
      const numbers = await context.db
        .query("numbers")
        .filter((q) => q.gte(q.field("value"), input.minValue))
        .collect();

      for (const number of numbers) {
        await context.db.delete(number._id);
      }

      return { deleted: numbers.length };
    }),

  // Action helpers
  calculateSum: convex
    .action()
    .input({ count: v.number() })
    .handler(async ({ context, input }) => {
      // Actions can't query db directly, but can call queries via runQuery
      // For demo purposes, we'll just calculate from the input
      return { sum: input.count * 10 };
    }),
};

// Registered public functions that use callable helpers

// Query that uses callable query helpers
export const getNumbersWithStats = convex
  .query()
  .input({ count: v.number() })
  .use(addTimestamp)
  .handler(async ({ context, input }) => {
    // Call multiple callable functions
    const [numbersResult, statsResult] = await Promise.all([
      lib.listNumbers(context)(input),
      lib.getNumberStats(context)(input),
    ]);

    return {
      numbers: numbersResult.numbers,
      stats: statsResult,
      timestamp: context.timestamp,
    };
  })
  .public();

// Mutation that uses callable query and mutation helpers
export const addNumberWithValidation = convex
  .mutation()
  .input({ value: v.number() })
  .handler(async ({ context, input }) => {
    // First check if number already exists using callable query
    const existing = await lib.listNumbers(context)({ count: 100 });
    if (existing.numbers.includes(input.value)) {
      throw new Error(`Number ${input.value} already exists`);
    }

    // Add the number using callable mutation
    const id = await lib.addNumberHelper(context)({ value: input.value });

    // Get updated stats using callable query
    const stats = await lib.getNumberStats(context)({ count: 100 });

    return {
      id,
      stats,
      message: `Added ${input.value}. Total numbers: ${stats.count}`,
    };
  })
  .public();

// Mutation that chains callable mutations
export const addMultipleNumbers = convex
  .mutation()
  .input({ values: v.array(v.number()) })
  .handler(async ({ context, input }) => {
    const ids: string[] = [];

    // Use callable mutation helper for each number
    for (const value of input.values) {
      const id = await lib.addNumberHelper(context)({ value });
      ids.push(id);
    }

    // Get final stats using callable query
    const stats = await lib.getNumberStats(context)({ count: 100 });

    return {
      ids,
      added: ids.length,
      totalNumbers: stats.count,
      sum: stats.sum,
    };
  })
  .public();

// Mutation that uses callable mutation to clean up
export const addNumberAndCleanup = convex
  .mutation()
  .input({ value: v.number(), cleanupThreshold: v.number() })
  .handler(async ({ context, input }) => {
    // Add the number
    const id = await lib.addNumberHelper(context)({ value: input.value });

    // Check stats
    const stats = await lib.getNumberStats(context)({ count: 100 });

    // Cleanup if needed using callable mutation
    let deleted = 0;
    if (stats.count > input.cleanupThreshold) {
      const result = await lib.deleteNumbersHelper(context)({
        minValue: input.value,
      });
      deleted = result.deleted;
    }

    return {
      id,
      added: 1,
      deleted,
      remaining: stats.count - deleted,
    };
  })
  .public();

// Action that uses callable query and action helpers
export const processNumbers = convex
  .action()
  .input({ count: v.number() })
  .handler(async ({ context, input }) => {
    // Note: Actions can't directly call query callables because they need db
    // But we can demonstrate action-to-action callable calls
    const result = await lib.calculateSum(context)({ count: input.count });

    return {
      processed: true,
      calculatedSum: result.sum,
      message: `Processed ${input.count} numbers`,
    };
  })
  .public();

// Internal query that uses callable helpers
export const internalGetStats = convex
  .query()
  .input({ count: v.number() })
  .handler(async ({ context, input }) => {
    // Internal functions can use callable helpers too
    const stats = await lib.getNumberStats(context)(input);
    const numbers = await lib.listNumbers(context)(input);

    return {
      stats,
      sample: numbers.numbers.slice(0, 5),
    };
  })
  .internal();

// Internal mutation that uses callable helpers
export const internalBulkAdd = convex
  .mutation()
  .input({ values: v.array(v.number()) })
  .handler(async ({ context, input }) => {
    // Use callable mutation helper
    const ids: string[] = [];
    for (const value of input.values) {
      const id = await lib.addNumberHelper(context)({ value });
      ids.push(id);
    }

    return { ids, count: ids.length };
  })
  .internal();

// Query that uses callable query helper
export const getNumbersSimple = convex
  .query()
  .input({ count: v.number() })
  .handler(async ({ context, input }) => {
    // Use callable query helper
    const numbers = await lib.listNumbers(context)(input);
    return numbers;
  })
  .public();
