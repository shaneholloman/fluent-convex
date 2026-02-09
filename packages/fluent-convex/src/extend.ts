/**
 * Detect whether a function is an ES class (vs a regular/arrow function).
 * The ES spec guarantees that `Function.prototype.toString` for class
 * declarations produces a string starting with "class".
 */
function isClass<T>(
  fn: ((arg: any) => T) | (new (arg: any) => T)
): fn is new (arg: any) => T {
  return (
    typeof fn === "function" &&
    /^class\b/.test(Function.prototype.toString.call(fn))
  );
}

/**
 * Shared implementation of `.extend()` for all builder classes.
 * Accepts either a factory function or a class constructor and invokes
 * it correctly without relying on try-catch error message inspection.
 */
export function extend<TBuilder, TResult>(
  builder: TBuilder,
  fnOrCls: ((builder: TBuilder) => TResult) | (new (builder: TBuilder) => TResult)
): TResult {
  if (isClass(fnOrCls)) {
    return new fnOrCls(builder);
  }
  return (fnOrCls as (builder: TBuilder) => TResult)(builder);
}
