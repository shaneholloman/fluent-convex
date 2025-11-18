import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

describe("Callable Functions", () => {
  describe("Query examples", () => {
    test("should get numbers with stats using callable functions", async () => {
      const t = convexTest(schema, modules);
      await t.mutation(api.myFunctions.addNumber, { value: 5 });
      await t.mutation(api.myFunctions.addNumber, { value: 15 });
      await t.mutation(api.myFunctions.addNumber, { value: 25 });

      const result = await t.query(api.callableFunctions.getNumbersWithStats, {
        count: 3,
      });

      expect(result).toBeDefined();
      expect(result.numbers).toBeInstanceOf(Array);
      expect(result.stats).toBeDefined();
      expect(result.stats.count).toBe(3);
      expect(result.stats.sum).toBe(45);
      expect(result.stats.average).toBe(15);
      expect(result.timestamp).toBeTypeOf("number");
    });

    test("should get simple numbers using callable query", async () => {
      const t = convexTest(schema, modules);
      await t.mutation(api.myFunctions.addNumber, { value: 10 });
      await t.mutation(api.myFunctions.addNumber, { value: 20 });

      const result = await t.query(api.callableFunctions.getNumbersSimple, {
        count: 5,
      });

      expect(result).toBeDefined();
      expect(result.numbers).toBeInstanceOf(Array);
      expect(result.numbers.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Mutation examples", () => {
    test("should add number with validation using callable functions", async () => {
      const t = convexTest(schema, modules);

      // First add a number
      const result1 = await t.mutation(
        api.callableFunctions.addNumberWithValidation,
        { value: 42 },
      );

      expect(result1).toBeDefined();
      expect(result1.id).toBeDefined();
      expect(result1.stats).toBeDefined();
      expect(result1.message).toContain("Added 42");

      // Try to add the same number again - should fail
      await expect(
        t.mutation(api.callableFunctions.addNumberWithValidation, {
          value: 42,
        }),
      ).rejects.toThrow("already exists");
    });

    test("should add multiple numbers using callable mutation", async () => {
      const t = convexTest(schema, modules);

      const result = await t.mutation(
        api.callableFunctions.addMultipleNumbers,
        { values: [1, 2, 3, 4, 5] },
      );

      expect(result).toBeDefined();
      expect(result.ids).toBeInstanceOf(Array);
      expect(result.ids.length).toBe(5);
      expect(result.added).toBe(5);
      expect(result.totalNumbers).toBeGreaterThanOrEqual(5);
      expect(result.sum).toBeGreaterThanOrEqual(15);
    });

    test("should add number and cleanup using callable functions", async () => {
      const t = convexTest(schema, modules);

      // Add some numbers first
      await t.mutation(api.myFunctions.addNumber, { value: 10 });
      await t.mutation(api.myFunctions.addNumber, { value: 20 });
      await t.mutation(api.myFunctions.addNumber, { value: 30 });

      const result = await t.mutation(
        api.callableFunctions.addNumberAndCleanup,
        { value: 40, cleanupThreshold: 5 },
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.added).toBe(1);
      expect(result.deleted).toBeGreaterThanOrEqual(0);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Action examples", () => {
    test("should process numbers using callable action", async () => {
      const t = convexTest(schema, modules);

      const result = await t.action(api.callableFunctions.processNumbers, {
        count: 10,
      });

      expect(result).toBeDefined();
      expect(result.processed).toBe(true);
      expect(result.calculatedSum).toBe(100); // count * 10
      expect(result.message).toContain("Processed 10 numbers");
    });
  });

  describe("Internal function examples", () => {
    test("should call internal query that uses callable helpers", async () => {
      const t = convexTest(schema, modules);
      await t.mutation(api.myFunctions.addNumber, { value: 10 });
      await t.mutation(api.myFunctions.addNumber, { value: 20 });
      await t.mutation(api.myFunctions.addNumber, { value: 30 });

      const result = await t.query(
        internal.callableFunctions.internalGetStats,
        {
          count: 5,
        },
      );

      expect(result).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.stats.count).toBeGreaterThanOrEqual(0);
      expect(result.sample).toBeInstanceOf(Array);
      expect(result.sample.length).toBeLessThanOrEqual(5);
    });

    test("should call internal mutation that uses callable helpers", async () => {
      const t = convexTest(schema, modules);

      const result = await t.mutation(
        internal.callableFunctions.internalBulkAdd,
        { values: [100, 200, 300] },
      );

      expect(result).toBeDefined();
      expect(result.ids).toBeInstanceOf(Array);
      expect(result.ids.length).toBe(3);
      expect(result.count).toBe(3);
    });
  });

  describe("Edge cases", () => {
    test("should handle empty results from callable functions", async () => {
      const t = convexTest(schema, modules);

      const result = await t.query(api.callableFunctions.getNumbersWithStats, {
        count: 5,
      });

      expect(result).toBeDefined();
      expect(result.numbers).toBeInstanceOf(Array);
      expect(result.numbers.length).toBe(0);
      expect(result.stats.count).toBe(0);
      expect(result.stats.sum).toBe(0);
      expect(result.stats.average).toBe(0);
    });

    test("should handle validation errors in mutations", async () => {
      const t = convexTest(schema, modules);

      // Add a number first
      await t.mutation(api.callableFunctions.addNumberWithValidation, {
        value: 99,
      });

      // Try to add the same number - should fail
      await expect(
        t.mutation(api.callableFunctions.addNumberWithValidation, {
          value: 99,
        }),
      ).rejects.toThrow();
    });
  });
});
