# Fluent Convex

A fluent API builder for Convex functions with middleware support, inspired by [oRPC](https://orpc.unnoq.com/).

## Features

- **Middleware support** - Compose reusable middleware for authentication, logging, and more
- **Type-safe** - Full TypeScript support with type inference
- **Fluent API** - Chain methods for a clean, readable syntax
- **Plugin system** - Extend with plugins like `fluent-convex/zod` for Zod schema support
- **Extensible** - Build your own plugins with the `_clone()` factory pattern
- **Works with Convex** - Built on top of Convex's function system

## Installation

```bash
npm install fluent-convex
```

## Quick Start

**Important:** All functions must end with `.public()` or `.internal()` to be registered with Convex.

```ts
import { createBuilder } from "fluent-convex";
import { v } from "convex/values";
import type { DataModel } from "./_generated/dataModel";

const convex = createBuilder<DataModel>();

// Simple query
export const listNumbers = convex
  .query()
  .input({ count: v.number() })
  .handler(async (context, input) => {
    const numbers = await context.db
      .query("numbers")
      .order("desc")
      .take(input.count);

    return { numbers: numbers.map((n) => n.value) };
  })
  .public(); // Must end with .public() or .internal()

// With middleware
const authMiddleware = convex.query().createMiddleware(async (context, next) => {
  const identity = await context.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }

  return next({
    ...context,
    user: {
      id: identity.subject,
      name: identity.name ?? "Unknown",
    },
  });
});

export const listNumbersAuth = convex
  .query()
  .use(authMiddleware)
  .input({ count: v.number() })
  .handler(async (context, input) => {
    const numbers = await context.db
      .query("numbers")
      .order("desc")
      .take(input.count);

    return {
      viewer: context.user.name, // user is available from middleware!
      numbers: numbers.map((n) => n.value),
    };
  })
  .public();
```

## Plugins

### Zod Plugin (`fluent-convex/zod`)

The Zod plugin adds Zod schema support for `.input()` and `.returns()`, with **full runtime validation** including refinements (`.min()`, `.max()`, `.email()`, etc.).

```bash
npm install zod convex-helpers
```

> **Note:** `zod` and `convex-helpers` are optional peer dependencies of `fluent-convex`. They're only needed if you use the Zod plugin.

Usage:

```ts
import { createBuilder } from "fluent-convex";
import { WithZod } from "fluent-convex/zod";
import { z } from "zod";
import type { DataModel } from "./_generated/dataModel";

const convex = createBuilder<DataModel>();

export const listNumbers = convex
  .query()
  .extend(WithZod) // Enable Zod support
  .input(
    z.object({
      count: z.number().int().min(1).max(100), // Refinements enforced at runtime!
    })
  )
  .returns(z.object({ numbers: z.array(z.number()) }))
  .handler(async (context, input) => {
    const numbers = await context.db.query("numbers").take(input.count);
    return { numbers: numbers.map((n) => n.value) };
  })
  .public();
```

Key features:
- **Full runtime validation** - Zod refinements (`.min()`, `.max()`, `.email()`, `.regex()`, etc.) are enforced server-side. Args are validated before the handler runs; return values after.
- **Structural conversion** - Zod schemas are automatically converted to Convex validators for Convex's built-in validation.
- **Composable** - `.extend(WithZod)` preserves the `WithZod` type through `.use()`, `.input()`, and `.returns()` chains.
- **Plain validators still work** - You can mix Zod and Convex validators in the same builder chain.

## Extensibility

You can extend the builder with your own plugins by subclassing `ConvexBuilderWithFunctionKind` and overriding the `_clone()` factory method.

### Writing a Plugin

The `_clone()` method is called internally by `.use()`, `.input()`, and `.returns()` to create new builder instances. By overriding it, your plugin's type is preserved through the entire builder chain.

```ts
import {
  ConvexBuilderWithFunctionKind,
  type GenericDataModel,
  type FunctionType,
  type Context,
  type EmptyObject,
  type ConvexArgsValidator,
  type ConvexReturnsValidator,
  type ConvexBuilderDef,
} from "fluent-convex";

class MyPlugin<
  TDataModel extends GenericDataModel = GenericDataModel,
  TFunctionType extends FunctionType = FunctionType,
  TCurrentContext extends Context = EmptyObject,
  TArgsValidator extends ConvexArgsValidator | undefined = undefined,
  TReturnsValidator extends ConvexReturnsValidator | undefined = undefined,
> extends ConvexBuilderWithFunctionKind<
  TDataModel,
  TFunctionType,
  TCurrentContext,
  TArgsValidator,
  TReturnsValidator
> {
  // Accept both builder instances (from .extend()) and raw defs (from _clone())
  constructor(builderOrDef: any) {
    const def =
      builderOrDef instanceof ConvexBuilderWithFunctionKind
        ? (builderOrDef as any).def
        : builderOrDef;
    super(def);
  }

  // Override _clone() to preserve MyPlugin through the chain
  protected _clone(def: ConvexBuilderDef<any, any, any>): any {
    return new MyPlugin(def);
  }

  // Add custom methods
  myCustomMethod(param: string) {
    console.log("Custom method called with:", param);
    return this;
  }
}
```

Usage:

```ts
export const myQuery = convex
  .query()
  .extend(MyPlugin)
  .myCustomMethod("hello")     // Custom method from plugin
  .use(authMiddleware)          // .use() preserves MyPlugin type
  .input({ count: v.number() })
  .handler(async (ctx, input) => { ... })
  .public();
```

### Composing Multiple Plugins

Plugins can be composed with `.extend()`:

```ts
export const myQuery = convex
  .query()
  .extend(MyPlugin)
  .extend(WithZod) // WithZod overrides .input()/.returns() from MyPlugin
  .myCustomMethod("hello")
  .input(z.object({ count: z.number() }))
  .handler(async (ctx, input) => { ... })
  .public();
```

## Flexible Method Ordering

The builder API is flexible about method ordering, allowing you to structure your code in the way that makes the most sense for your use case.

### Middleware After Handler

You can add middleware **after** defining the handler, which is useful when you want to wrap existing handlers with additional functionality:

```ts
export const getNumbers = convex
  .query()
  .input({ count: v.number() })
  .handler(async (context, input) => {
    return await context.db.query("numbers").take(input.count);
  })
  .use(authMiddleware) // Middleware added after handler
  .public();
```

### Callable Builders (Testing)

Before registering a function with `.public()` or `.internal()`, the builder is **callable**, making it easy to test your functions:

```ts
// Create a callable query (not yet registered)
const testQuery = convex
  .query()
  .input({ count: v.number() })
  .handler(async (context, input) => {
    return { doubled: input.count * 2 };
  });

// You can call it directly for testing
const mockContext = {} as any;
const result = await testQuery(mockContext)({ count: 5 });
console.log(result); // { doubled: 10 }

// Once registered, it's no longer callable
export const doubleNumber = testQuery.public();
// doubleNumber(mockContext)({ count: 5 }); // TypeScript error - not callable
```

### Method Ordering Rules

- **`.returns()`** must be called **before** `.handler()`
- **`.use()`** can be called **before or after** `.handler()`
- **`.public()`** or **`.internal()`** must be called **after** `.handler()` and is **required** to register the function
- Functions are **callable** before registration, **non-callable** after registration
- **All exported functions must end with `.public()` or `.internal()`** - functions without registration will not be available in your Convex API

## API

### Methods

- `.query()` - Define a Convex query
- `.mutation()` - Define a Convex mutation
- `.action()` - Define a Convex action
- `.public()` - Register the function as public (required to register)
- `.internal()` - Register the function as internal/private (required to register)
- `.input(validator)` - Set input validation (Convex validators)
- `.returns(validator)` - Set return validation (Convex validators)
- `.use(middleware)` - Apply middleware
- `.createMiddleware(fn)` - Create a middleware function
- `.handler(fn)` - Define the function handler
- `.extend(plugin)` - Extend the builder with a plugin class

## Caveats

### Circular types when calling `api.*` in the same file

When a function calls other functions via `api.*` in the same file, and those functions don't have explicit `.returns()` validators, TypeScript may report circular initializer errors (TS7022). This is a standard Convex/TypeScript limitation, not specific to fluent-convex. Workarounds:
1. Add `.returns()` to the **called** functions -- this gives them explicit return types, breaking the cycle
2. Move the calling function to a separate file
3. Use `internal.*` from a different module

## Example

Check out the `/apps/example` directory for a complete working example with various use cases including:

- Simple queries and mutations
- Middleware composition
- Zod integration via plugin
- Internal functions
- Type-safe context transformations
- Custom builder extensions

## Development

This is a monorepo using npm workspaces:

- `/packages/fluent-convex` - The core library (includes the Zod plugin at `fluent-convex/zod`)
- `/apps/example` - Example Convex app

### Setup

```bash
npm install
```

This will install dependencies for all workspaces.

### Building

```bash
npm run build
```

### Running tests

```bash
npm test
```

### Running the example

```bash
cd apps/example
npm run dev
```

## Credits

Borrowed heavily from [oRPC](https://orpc.unnoq.com/learn-and-contribute/overview) and helped out by AI.
