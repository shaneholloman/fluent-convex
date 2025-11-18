# @fluent-convex/experimental-models

Experimental model functionality for fluent-convex. This package provides a way to create Convex functions from decorated model classes.

## Installation

```bash
npm install @fluent-convex/experimental-models fluent-convex
```

## Usage

```typescript
import { QueryModel, toFluent } from "@fluent-convex/experimental-models";
import { input, returns } from "fluent-convex";
import { v } from "convex/values";

class MyQueryModel extends QueryModel<DataModel> {
  @input({ count: v.number() })
  @returns(v.array(v.number()))
  async listNumbers({ count }: { count: number }) {
    // Your implementation
  }
}

export const listNumbers = toFluent(MyQueryModel, "listNumbers")
  .use(middleware)
  .public();
```

## Status

⚠️ **Experimental** - This package is experimental and may change or be removed in future versions.
