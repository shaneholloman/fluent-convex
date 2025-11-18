import { v } from "convex/values";
import { convex } from "./lib";
import { addTimestamp, addValueMiddleware } from "./middleware";
import { QueryCtx } from "./_generated/server";

class MyQueryModel {
  constructor(private context: QueryCtx) {}

  @input({ count: v.number() })
  @returns(v.array(v.number()))
  async listNumbers({ count }) {
    const numbers = await this.context.db
      .query("numbers")
      .order("desc")
      .take(count);

    return numbers.map((n) => n.value);
  }

  @input({ count: v.number() })
  @returns(v.string())
  async countNumbers({ count }) {
    const count = await this.listNumbers({ count: 100 });
    return count;
  }
}

// Registered public functions that use callable helpers

// Query that uses callable query helpers
export const getNumbersWithStats = convex
  .query()
  .input({ count: v.number() })
  .use(addTimestamp)
  .handler(async ({ context, input }) => {

    const numbers = await new MyQueryModel(context).listNumbers({ count: input.count });
    const numbersCount = await new MyQueryModel(context).countNumbers({ count: input.count });

    return {
      numbers,
      numbersCount,
    };
  })
  .public();
