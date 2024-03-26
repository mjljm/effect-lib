import * as MFunction from '#src/Function';

export const primitive = MFunction.isPrimitive;
const isFunction = MFunction.isFunction;
export { isFunction as function };
export const array = MFunction.isArray;
export const recordOrArray = MFunction.isRecordOrArray;
export const url = MFunction.isUrl;
