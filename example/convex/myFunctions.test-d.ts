import { describe, it, assertType, expectTypeOf } from "vitest";
import { createBuilder } from "./lib";
import { v } from "convex/values";
import schema from "./schema";
import type { Doc } from "./_generated/dataModel";

const convex = createBuilder(schema);

describe("Schema-aware type tests", () => {
  it("should infer proper types from schema when querying numbers table", () => {
    convex
      .query()
      .input({ count: v.number() })
      .handler(async ({ context, input }) => {
        const numbers = await context.db
          .query("numbers")
          .order("desc")
          .take(input.count);

        // numbers should be properly typed as Doc<"numbers">[]
        type NumbersType = typeof numbers;
        type SingleNumber = (typeof numbers)[number];

        // Verify that numbers is an array of Doc<"numbers">
        expectTypeOf<NumbersType>().toEqualTypeOf<Doc<"numbers">[]>();

        // Verify that each number has a value property of type number
        expectTypeOf<SingleNumber["value"]>().toEqualTypeOf<number>();
      });
  });

  it("should return proper array of values not GenericDocument", () => {
    convex
      .query()
      .input({ count: v.number() })
      .handler(async ({ context, input }) => {
        const numbers = await context.db
          .query("numbers")
          .order("desc")
          .take(input.count);

        // The map should work because number.value is properly typed as number
        const values = numbers.reverse().map((number) => number.value);

        // values should be number[]
        expectTypeOf(values).toEqualTypeOf<number[]>();

        return {
          numbers: values,
        };
      });
  });

  it("should have proper table names", () => {
    convex.query().handler(async ({ context }) => {
      // Should only accept valid table names from the schema
      const numbersQuery = context.db.query("numbers");

      // @ts-expect-error "invalid_table" is not in the schema
      const invalidQuery = context.db.query("invalid_table");
    });
  });

  it("should properly type document inserts in mutations", () => {
    convex
      .mutation()
      .input({ value: v.number() })
      .handler(async ({ context, input }) => {
        // Should be able to insert with proper schema
        const id = await context.db.insert("numbers", { value: input.value });

        // id should be typed as Id<"numbers">
        expectTypeOf(id).toMatchTypeOf<string>();

        // @ts-expect-error Missing required field "value"
        await context.db.insert("numbers", {});

        // @ts-expect-error Extra field "invalid" not in schema
        await context.db.insert("numbers", { value: 42, invalid: "field" });
      });
  });
});
