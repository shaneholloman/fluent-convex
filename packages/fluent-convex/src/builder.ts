import {
  type RegisteredQuery,
  type RegisteredMutation,
  type RegisteredAction,
  queryGeneric,
  internalQueryGeneric,
  mutationGeneric,
  internalMutationGeneric,
  actionGeneric,
  internalActionGeneric,
  type GenericDataModel,
  type DataModelFromSchemaDefinition,
  type SchemaDefinition,
} from "convex/server";
import type { ConvexMiddleware, AnyConvexMiddleware } from "./middleware";
import type {
  Context,
  ConvexArgsValidator,
  ConvexReturnsValidator,
  InferArgs,
  FunctionType,
  Visibility,
  QueryCtx,
  MutationCtx,
  ActionCtx,
  EmptyObject,
  MaybeDefaultContext,
} from "./types";
import {
  isZodSchema,
  toConvexValidator,
  type ValidatorInput,
  type ReturnsValidatorInput,
  type ToConvexArgsValidator,
  type ToConvexReturnsValidator,
} from "./zod_support";

type InferredArgs<T extends ConvexArgsValidator | undefined> =
  T extends ConvexArgsValidator ? InferArgs<T> : EmptyObject;

interface ConvexBuilderDef<
  TFunctionType extends FunctionType | undefined,
  TArgsValidator extends ConvexArgsValidator | undefined,
  TReturnsValidator extends ConvexReturnsValidator | undefined,
  TVisibility extends Visibility,
> {
  functionType?: TFunctionType;
  middlewares: readonly AnyConvexMiddleware[];
  argsValidator?: TArgsValidator;
  returnsValidator?: TReturnsValidator;
  visibility: TVisibility;
}

export class ConvexBuilder<
  TDataModel extends GenericDataModel = GenericDataModel,
  TFunctionType extends FunctionType | undefined = undefined,
  TInitialContext extends Context = EmptyObject,
  TCurrentContext extends Context = EmptyObject,
  TArgsValidator extends ConvexArgsValidator | undefined = undefined,
  TReturnsValidator extends ConvexReturnsValidator | undefined = undefined,
  TVisibility extends Visibility = "public",
> {
  private def: ConvexBuilderDef<
    TFunctionType,
    TArgsValidator,
    TReturnsValidator,
    TVisibility
  >;

  constructor(
    def: ConvexBuilderDef<
      TFunctionType,
      TArgsValidator,
      TReturnsValidator,
      TVisibility
    >
  ) {
    this.def = def;
  }

  $context<U extends Context>(): ConvexBuilder<
    TDataModel,
    TFunctionType,
    U & EmptyObject,
    U,
    TArgsValidator,
    TReturnsValidator,
    TVisibility
  > {
    return new ConvexBuilder<
      TDataModel,
      TFunctionType,
      U & EmptyObject,
      U,
      TArgsValidator,
      TReturnsValidator,
      TVisibility
    >({
      ...this.def,
      middlewares: [],
    });
  }

  middleware<UOutContext extends Context>(
    middleware: ConvexMiddleware<TInitialContext, UOutContext>
  ): ConvexMiddleware<TInitialContext, UOutContext>;
  middleware<UInContext extends Context, UOutContext extends Context>(
    middleware: ConvexMiddleware<UInContext, UOutContext>
  ): ConvexMiddleware<UInContext, UOutContext>;
  middleware<UInContext extends Context, UOutContext extends Context>(
    middleware: ConvexMiddleware<UInContext, UOutContext>
  ): ConvexMiddleware<UInContext, UOutContext> {
    return middleware;
  }

  use<UOutContext extends Context>(
    middleware: ConvexMiddleware<TCurrentContext, UOutContext>
  ): ConvexBuilder<
    TDataModel,
    TFunctionType,
    TInitialContext,
    TCurrentContext & UOutContext,
    TArgsValidator,
    TReturnsValidator,
    TVisibility
  > {
    return new ConvexBuilder<
      TDataModel,
      TFunctionType,
      TInitialContext,
      TCurrentContext & UOutContext,
      TArgsValidator,
      TReturnsValidator,
      TVisibility
    >({
      ...this.def,
      middlewares: [...this.def.middlewares, middleware as AnyConvexMiddleware],
    });
  }

  query(): ConvexBuilder<
    TDataModel,
    "query",
    TInitialContext extends EmptyObject
      ? QueryCtx<TDataModel>
      : TInitialContext,
    TCurrentContext extends EmptyObject
      ? QueryCtx<TDataModel>
      : TCurrentContext,
    TArgsValidator,
    TReturnsValidator,
    TVisibility
  > {
    return new ConvexBuilder<
      TDataModel,
      "query",
      MaybeDefaultContext<TInitialContext, QueryCtx<TDataModel>>,
      MaybeDefaultContext<TCurrentContext, QueryCtx<TDataModel>>,
      TArgsValidator,
      TReturnsValidator,
      TVisibility
    >({
      ...this.def,
      functionType: "query",
    });
  }

  mutation(): ConvexBuilder<
    TDataModel,
    "mutation",
    TInitialContext extends EmptyObject
      ? MutationCtx<TDataModel>
      : TInitialContext,
    TCurrentContext extends EmptyObject
      ? MutationCtx<TDataModel>
      : TCurrentContext,
    TArgsValidator,
    TReturnsValidator,
    TVisibility
  > {
    return new ConvexBuilder<
      TDataModel,
      "mutation",
      MaybeDefaultContext<TInitialContext, MutationCtx<TDataModel>>,
      MaybeDefaultContext<TCurrentContext, MutationCtx<TDataModel>>,
      TArgsValidator,
      TReturnsValidator,
      TVisibility
    >({
      ...this.def,
      functionType: "mutation",
    });
  }

  action(): ConvexBuilder<
    TDataModel,
    "action",
    TInitialContext extends EmptyObject
      ? ActionCtx<TDataModel>
      : TInitialContext,
    TCurrentContext extends EmptyObject
      ? ActionCtx<TDataModel>
      : TCurrentContext,
    TArgsValidator,
    TReturnsValidator,
    TVisibility
  > {
    return new ConvexBuilder<
      TDataModel,
      "action",
      MaybeDefaultContext<TInitialContext, ActionCtx<TDataModel>>,
      MaybeDefaultContext<TCurrentContext, ActionCtx<TDataModel>>,
      TArgsValidator,
      TReturnsValidator,
      TVisibility
    >({
      ...this.def,
      functionType: "action",
    });
  }

  internal(): ConvexBuilder<
    TDataModel,
    TFunctionType,
    TInitialContext,
    TCurrentContext,
    TArgsValidator,
    TReturnsValidator,
    "internal"
  > {
    return new ConvexBuilder<
      TDataModel,
      TFunctionType,
      TInitialContext,
      TCurrentContext,
      TArgsValidator,
      TReturnsValidator,
      "internal"
    >({
      ...this.def,
      visibility: "internal",
    });
  }

  input<UInput extends ValidatorInput>(
    validator: UInput
  ): ConvexBuilder<
    TDataModel,
    TFunctionType,
    TInitialContext,
    TCurrentContext,
    ToConvexArgsValidator<UInput>,
    TReturnsValidator,
    TVisibility
  > {
    const convexValidator = isZodSchema(validator)
      ? (toConvexValidator(validator) as ToConvexArgsValidator<UInput>)
      : (validator as ToConvexArgsValidator<UInput>);

    return new ConvexBuilder<
      TDataModel,
      TFunctionType,
      TInitialContext,
      TCurrentContext,
      ToConvexArgsValidator<UInput>,
      TReturnsValidator,
      TVisibility
    >({
      ...this.def,
      argsValidator: convexValidator,
    });
  }

  returns<UReturns extends ReturnsValidatorInput>(
    validator: UReturns
  ): ConvexBuilder<
    TDataModel,
    TFunctionType,
    TInitialContext,
    TCurrentContext,
    TArgsValidator,
    ToConvexReturnsValidator<UReturns>,
    TVisibility
  > {
    const convexValidator = isZodSchema(validator)
      ? (toConvexValidator(validator) as ToConvexReturnsValidator<UReturns>)
      : (validator as ToConvexReturnsValidator<UReturns>);

    return new ConvexBuilder<
      TDataModel,
      TFunctionType,
      TInitialContext,
      TCurrentContext,
      TArgsValidator,
      ToConvexReturnsValidator<UReturns>,
      TVisibility
    >({
      ...this.def,
      returnsValidator: convexValidator,
    });
  }

  handler<TReturn>(
    handlerFn: (options: {
      context: TCurrentContext;
      input: InferredArgs<TArgsValidator>;
    }) => Promise<TReturn>
  ): TFunctionType extends "query"
    ? RegisteredQuery<
        TVisibility,
        InferredArgs<TArgsValidator>,
        Promise<TReturn>
      >
    : TFunctionType extends "mutation"
      ? RegisteredMutation<
          TVisibility,
          InferredArgs<TArgsValidator>,
          Promise<TReturn>
        >
      : TFunctionType extends "action"
        ? RegisteredAction<
            TVisibility,
            InferredArgs<TArgsValidator>,
            Promise<TReturn>
          >
        : never {
    const {
      functionType,
      middlewares,
      argsValidator,
      returnsValidator,
      visibility,
    } = this.def;

    if (!functionType) {
      throw new Error(
        "Function type not set. Call .query(), .mutation(), or .action() first."
      );
    }

    const composedHandler = async (
      baseCtx:
        | QueryCtx<TDataModel>
        | MutationCtx<TDataModel>
        | ActionCtx<TDataModel>,
      baseArgs: InferredArgs<TArgsValidator>
    ) => {
      let currentContext: Context = baseCtx;

      for (const middleware of middlewares) {
        const result = await middleware({
          context: currentContext,
          next: async (options) => ({ context: options.context }),
        });
        currentContext = result.context;
      }

      return handlerFn({
        context: currentContext as TCurrentContext,
        input: baseArgs,
      });
    };

    const config = {
      args: argsValidator || {},
      ...(returnsValidator ? { returns: returnsValidator } : {}),
      handler: composedHandler,
    } as any;

    const isPublic = visibility === "public";
    const registrationFn = {
      query: isPublic ? queryGeneric : internalQueryGeneric,
      mutation: isPublic ? mutationGeneric : internalMutationGeneric,
      action: isPublic ? actionGeneric : internalActionGeneric,
    }[functionType];

    return registrationFn(config) as any;
  }
}

export function createBuilder<TSchema extends SchemaDefinition<any, boolean>>(
  _schema: TSchema
): ConvexBuilder<
  DataModelFromSchemaDefinition<TSchema>,
  undefined,
  EmptyObject,
  EmptyObject,
  undefined,
  undefined,
  "public"
> {
  return new ConvexBuilder({
    middlewares: [],
    visibility: "public",
  });
}
