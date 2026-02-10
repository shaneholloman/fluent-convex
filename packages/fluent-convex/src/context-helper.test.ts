import { describe, it, expect } from "vitest";
import { v } from "convex/values";
import {
  defineSchema,
  defineTable,
  type DataModelFromSchemaDefinition,
} from "convex/server";
import { createBuilder } from "./builder";

const schema = defineSchema({
  numbers: defineTable({ value: v.number() }),
});

const convex = createBuilder<DataModelFromSchemaDefinition<typeof schema>>();

describe("$context() consistency", () => {
  it("$context() on ConvexBuilderWithFunctionKind should return a middleware helper, not a builder", () => {
    const result = convex.query().$context<{ auth: unknown }>();

    // Should be the type-narrowing helper with .middleware(), not a builder
    expect(result.middleware).toBeDefined();
    expect(typeof result.middleware).toBe("function");

    // Must NOT be a builder (no .input, .handler) so we don't silently wipe middlewares
    expect((result as any).input).toBeUndefined();
    expect((result as any).handler).toBeUndefined();
    expect((result as any).use).toBeUndefined();
  });

  it("$context() after .use() should return middleware helper so middlewares are not wiped", () => {
    const addFoo = convex.query().middleware(async (ctx, next) =>
      next({ ...ctx, foo: "bar" })
    );
    const chain = convex.query().use(addFoo).$context<{ foo: string }>();

    // Return value must be the helper; if it were a builder with middlewares: [],
    // it would have .input/.handler and the middleware we added would be lost
    expect(chain.middleware).toBeDefined();
    expect((chain as any).input).toBeUndefined();
  });

  it("middleware created via $context().middleware() should be usable with .use()", async () => {
    const authMiddleware = convex
      .query()
      .$context<{ auth: unknown }>()
      .middleware(async (context, next) => {
        return next({
          ...context,
          user: { id: "1", name: "Alice" },
        });
      });

    const fn = convex
      .query()
      .use(authMiddleware)
      .input({})
      .handler(async (context) => {
        return context.user.name;
      });

    const result = await fn({} as any)({});
    expect(result).toBe("Alice");
  });
});
