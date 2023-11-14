import { Function } from 'effect';

// Record does not cover class instances. But it seems safe to assert unknown to Unknown bacause class
// instances do behave like ObjectRecords
type ObjectRecord = { [key: string | symbol]: unknown };
export { type ObjectRecord as Record };

type AnyArray = unknown[];
export { type AnyArray as Array };

export type Primitive = string | number | bigint | boolean | symbol | undefined | null;
//eslint-disable-next-line @typescript-eslint/ban-types
export type Unknown = Primitive | Function | ObjectRecord | AnyArray;
export type ArrayOrObject = ObjectRecord | AnyArray;

export const primitive = (u: unknown): u is Primitive =>
	u === null || typeof u in ['string', 'number', 'boolean', 'bigingt', 'symbol', 'undefined'];
const isFunction = Function.isFunction;
export { isFunction as function };
export const array = Array.isArray;
export const record = (input: unknown): input is ObjectRecord =>
	input !== null && typeof input === 'object' && !array(input);
export const symbol = (u: unknown): u is Symbol => typeof u === 'symbol';
export const arrayOrObject = (u: unknown): u is ArrayOrObject =>
	u !== null && typeof u === 'object';
