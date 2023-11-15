import * as MFunction from '@mjljm/effect-lib/effect/Function';

export const primitive = MFunction.isPrimitive;
const isFunction = MFunction.isFunction;
export { isFunction as function };
export const array = MFunction.isArray;
export const record = MFunction.isObjectRecord;
export const symbol = MFunction.isSymbol;
export const arrayOrObject = MFunction.isArrayOrObject;
