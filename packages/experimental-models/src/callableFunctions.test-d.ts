import { describe, it, assertType } from "vitest";
import { v } from "convex/values";
import { createBuilder } from "fluent-convex";
import {
  defineSchema,
  defineTable,
  type DataModelFromSchemaDefinition,
} from "convex/server";
import { input, returns, makeCallableMethods } from "fluent-convex";
import { toFluent, QueryModel } from "@fluent-convex/experimental-models";
import type { QueryCtx } from "fluent-convex";

// Mock schema and builder for testing
const schema = defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),
});

type DataModel = DataModelFromSchemaDefinition<typeof schema>;

const convex = createBuilder(schema);

// Test middleware
const addTimestamp = convex.query().middleware(async ({ context, next }) => {
  return next({
    context: {
      ...context,
      timestamp: Date.now(),
    },
  });
});

const authMiddleware = convex.query().middleware(async ({ context, next }) => {
  return next({
    context: {
      ...context,
      user: { id: "123" },
    },
  });
});

class NumbersQueryModel extends QueryModel<DataModel> {
  @input({ count: v.number() })
  @returns(v.array(v.number()))
  async listNumbers({ count }: { count: number }) {
    const numbers = await this.context.db
      .query("numbers")
      .order("desc")
      .take(count);

    return numbers.map((n: any) => n.value);
  }

  @input({ count: v.number() })
  @returns(v.number())
  async countNumbers({ count }: { count: number }) {
    const numbers = await this.listNumbers({ count });
    return numbers.length;
  }
}

class NumbersQueryModelForUser extends QueryModel<DataModel> {
  constructor(
    context: QueryCtx<DataModel>,
    public userId: string,
    public numbersModel = new NumbersQueryModel(context)
  ) {
    super(context);
  }

  @input({ count: v.number() })
  @returns(v.array(v.number()))
  async listNumbers({ count }: { count: number }) {
    if (this.userId !== "123") throw new Error("Unauthorized");

    return this.numbersModel.listNumbers({ count });
  }
}

describe("Callable Functions Examples", () => {
  it("should create a query using makeCallableMethods", () => {
    const getNumbersWithStats = convex
      .query()
      .input({ count: v.number() })
      .use(addTimestamp)
      .handler(async ({ context, input }) => {
        // Create a callable version of the model where all decorated methods are automatically validated
        const model = makeCallableMethods(new NumbersQueryModel(context));

        const numbers = await model.listNumbers({ count: input.count });
        const numbersCount = await model.countNumbers({ count: input.count });

        return {
          numbers,
          numbersCount,
        };
      })
      .public();

    assertType<typeof getNumbersWithStats>(getNumbersWithStats);
  });

  it("should create a query using toFluent", () => {
    const listNumbersFromModel = toFluent(NumbersQueryModel, "listNumbers")
      .use(addTimestamp)
      .public();

    assertType<typeof listNumbersFromModel>(listNumbersFromModel);
  });

  it("should work with models middleware pattern", () => {
    const modelsMiddleware = convex
      .$context<QueryCtx<DataModel> & { user: { id: string } }>()
      .middleware(async ({ context, next }) => {
        return next({
          context: {
            ...context,
            models: {
              numbersForUser: new NumbersQueryModelForUser(
                context as QueryCtx<DataModel>,
                context.user.id
              ),
            },
          },
        });
      });

    const listNumbersFromModel2 = convex
      .query()
      .use(authMiddleware)
      .use(modelsMiddleware)
      .input({ count: v.number() })
      .handler(async ({ context, input }) =>
        context.models.numbersForUser.listNumbers({ count: input.count })
      )
      .use(addTimestamp)
      .public();

    assertType<typeof listNumbersFromModel2>(listNumbersFromModel2);
  });
});
