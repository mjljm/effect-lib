import * as MFunction from '#internal/effect/Function';

export const primitive = MFunction.isPrimitive;
const isFunction = MFunction.isFunction;
export { isFunction as function };
export const array = MFunction.isArray;
export const recordOrArray = MFunction.isRecordOrArray;
