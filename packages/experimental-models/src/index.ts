import type {
  GenericDataModel,
  GenericQueryCtx,
  RegisteredQuery,
} from "convex/server";
import { queryGeneric, internalQueryGeneric } from "convex/server";
import { getMethodMetadataFromClass } from "fluent-convex";
import type { QueryCtx } from "fluent-convex";
import type { AnyConvexMiddleware } from "fluent-convex";

/**
 * Base class for query models that can be used with fluent-convex
 * Extend this class and use @input and @returns decorators on methods
 */
export abstract class QueryModel<
  TDataModel extends GenericDataModel = GenericDataModel,
> {
  constructor(protected context: GenericQueryCtx<TDataModel>) {}
}

/**
 * Extract DataModel from a QueryModel constructor
 */
type ExtractDataModelFromConstructor<T> = T extends new (
  context: GenericQueryCtx<infer D>
) => any
  ? D
  : never;

/**
 * Builder for model methods
 */
class ModelMethodBuilder<
  TDataModel extends GenericDataModel,
  TModel extends new (context: QueryCtx<TDataModel>) => any,
  TMethodName extends keyof InstanceType<TModel>,
> {
  private middlewares: AnyConvexMiddleware[] = [];

  constructor(
    private ModelClass: TModel,
    private methodName: TMethodName
  ) {}

  /**
   * Use middleware - stores middleware for later application
   */
  use(middleware: AnyConvexMiddleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Register as public function
   */
  public(): RegisteredQuery<"public", any, Promise<any>> {
    return this._register("public") as RegisteredQuery<
      "public",
      any,
      Promise<any>
    >;
  }

  /**
   * Register as internal function
   */
  internal(): RegisteredQuery<"internal", any, Promise<any>> {
    return this._register("internal") as RegisteredQuery<
      "internal",
      any,
      Promise<any>
    >;
  }

  private _register(visibility: "public" | "internal") {
    // Get metadata from the decorated method
    const metadata = getMethodMetadataFromClass(
      this.ModelClass,
      this.methodName as string
    );

    // Create handler that applies middlewares and calls the model method
    const composedHandler = async (
      baseCtx: QueryCtx<TDataModel>,
      baseArgs: any
    ) => {
      let currentContext: any = baseCtx;

      // Apply all middlewares in order
      for (const middleware of this.middlewares) {
        const result = await middleware({
          context: currentContext,
          next: async (options) => ({ context: options.context }),
        });
        currentContext = result.context;
      }

      // Instantiate model and call method
      const model = new this.ModelClass(currentContext);
      const method = (model as any)[this.methodName];
      if (typeof method !== "function") {
        throw new Error(
          `Method '${String(this.methodName)}' is not a function on ${this.ModelClass.name}`
        );
      }
      return await method.call(model, baseArgs);
    };

    const config = {
      args: metadata.inputValidator || {},
      ...(metadata.returnsValidator
        ? { returns: metadata.returnsValidator }
        : {}),
      handler: composedHandler,
    };

    const registrationFn =
      visibility === "public" ? queryGeneric : internalQueryGeneric;
    return registrationFn(config);
  }
}

/**
 * Create a fluent builder from a decorated model method
 * Infers DataModel from the QueryModel class
 * Usage:
 *   toFluent(MyQueryModel, "listNumbers").use(middleware).public()
 */
export function toFluent<
  TModel extends new (context: GenericQueryCtx<any>) => any,
  TMethodName extends keyof InstanceType<TModel>,
>(
  ModelClass: TModel,
  methodName: TMethodName
): ModelMethodBuilder<
  ExtractDataModelFromConstructor<TModel>,
  TModel,
  TMethodName
> {
  return new ModelMethodBuilder<
    ExtractDataModelFromConstructor<TModel>,
    TModel,
    TMethodName
  >(ModelClass, methodName);
}

