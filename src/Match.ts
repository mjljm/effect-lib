import { Mfunction } from '#src/internal/index';

export const primitive = Mfunction.isPrimitive;
const isFunction = Mfunction.isFunction;
export { isFunction as function };
export const array = Mfunction.isArray;
export const recordOrArray = Mfunction.isRecordOrArray;
export const url = Mfunction.isUrl;
