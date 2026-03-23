/**
 * plugin.ts - Custom plugin demo using the .extend() system.
 *
 * Plugins let you add custom methods to the builder chain. This
 * example creates a TaggedBuilder that adds a `.withTag(name)`
 * method, automatically wrapping any function with structured
 * logging via onion middleware.
 *
 * The key is overriding `_clone()` so the plugin type survives
 * through .use(), .input(), .returns(), etc.
 */

import { v } from "convex/values";
import {
  ConvexBuilderWithFunctionKind,
  type ConvexArgsValidator,
  type ConvexReturnsValidator,
  type ConvexBuilderDef,
  type Context,
  type EmptyObject,
  type FunctionType,
  type GenericDataModel,
} from "fluent-convex";
import { convex } from "./fluent";

// #region TaggedBuilder
export class TaggedBuilder<
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
  constructor(builderOrDef: any) {
    const def =
      builderOrDef instanceof ConvexBuilderWithFunctionKind
        ? (builderOrDef as any).def
        : builderOrDef;
    super(def);
  }

  // Override _clone so TaggedBuilder survives through .use(), .input(), etc.
  protected _clone(def: ConvexBuilderDef<any, any, any>): any {
    return new TaggedBuilder(def);
  }

  /** Add structured logging via onion middleware. */
  withTag(operationName: string) {
    return this.use(async (ctx, next) => {
      console.log(`[${operationName}] Start`);
      try {
        const result = await next(ctx);
        console.log(`[${operationName}] Done`);
        return result;
      } catch (error) {
        console.error(`[${operationName}] Error`);
        throw error;
      }
    });
  }
}
// #endregion

// #region taggedQuery
export const taggedQuery = convex
  .query()
  .extend(TaggedBuilder)
  .withTag("taggedQuery")
  .input({ echo: v.string() })
  .handler(async (_ctx, input) => {
    return { message: `Echo: ${input.echo}`, timestamp: Date.now() };
  })
  .public();
// #endregion
