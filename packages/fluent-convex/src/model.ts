import type { GenericDataModel, GenericQueryCtx } from "convex/server";
import type { ConvexBuilder } from "./builder";

/**
 * Base class for query models that can be used with fluent-convex
 * Extend this class and use @input and @returns decorators on methods
 */
export abstract class QueryModel<
  TDataModel extends GenericDataModel = GenericDataModel,
> {
  constructor(protected context: GenericQueryCtx<TDataModel>) {}

  /**
   * Create a fluent builder from a decorated method on this model class
   * Usage:
   *   MyQueryModel.toFluent("listNumbers", convex).use(middleware).public()
   *   MyQueryModel.toFluent("listNumbers").use(middleware).public(builder)
   */
  static toFluent<
    TModel extends typeof QueryModel<any>,
    TMethodName extends keyof InstanceType<TModel>,
    TBuilder extends ConvexBuilder<any> | undefined = undefined,
  >(
    this: TModel,
    methodName: TMethodName,
    builder?: TBuilder
  ): ModelMethodBuilder<TModel, TMethodName, TBuilder> {
    return new ModelMethodBuilder(this as any, methodName, builder);
  }
}

/**
 * Builder for model methods that can be bound to a ConvexBuilder instance
 */
class ModelMethodBuilder<
  TModel extends typeof QueryModel<any>,
  TMethodName extends keyof InstanceType<TModel>,
  TBuilder extends ConvexBuilder<any> | undefined = undefined,
> {
  private middlewares: any[] = [];

  constructor(
    private ModelClass: TModel,
    private methodName: TMethodName,
    private builder: TBuilder
  ) {}

  /**
   * Use middleware - stores middleware for later application
   */
  use(middleware: any): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Register as public function
   * Builder can be provided here or passed to toFluent()
   */
  public(builder?: TBuilder extends undefined ? ConvexBuilder<any> : never) {
    const b = (this.builder || builder) as ConvexBuilder<any>;
    if (!b) {
      throw new Error(
        `Builder not provided. Either pass builder to toFluent() or to public()`
      );
    }
    // Cast ModelClass to concrete constructor type for fromModel
    const result = b.fromModel(this.ModelClass as any, this.methodName);
    // Apply all middlewares
    let current: any = result;
    for (const middleware of this.middlewares) {
      current = current.use(middleware);
    }
    return current.public();
  }

  /**
   * Register as internal function
   * Builder can be provided here or passed to toFluent()
   */
  internal(builder?: TBuilder extends undefined ? ConvexBuilder<any> : never) {
    const b = (this.builder || builder) as ConvexBuilder<any>;
    if (!b) {
      throw new Error(
        `Builder not provided. Either pass builder to toFluent() or to internal()`
      );
    }
    // Cast ModelClass to concrete constructor type for fromModel
    const result = b.fromModel(this.ModelClass as any, this.methodName);
    // Apply all middlewares
    let current: any = result;
    for (const middleware of this.middlewares) {
      current = current.use(middleware);
    }
    return current.internal();
  }
}
