import { List, MutableList, Predicate } from 'effect';

export const iterate: {
	<A, B extends A>(
		initial: A,
		options: {
			readonly while: Predicate.Refinement<A, B>;
			readonly body: (b: B) => A;
		}
	): A;
	<A>(
		initial: A,
		options: {
			readonly while: Predicate.Predicate<A>;
			readonly body: (a: A) => A;
		}
	): A;
} = <A>(
	initial: A,
	options: {
		readonly while: Predicate.Predicate<A>;
		readonly body: (a: A) => A;
	}
): A =>
	options.while(initial) ? iterate(options.body(initial), options) : initial;

export const iterateNonRecursive: {
	<A, B extends A>(
		initial: A,
		options: {
			readonly while: Predicate.Refinement<A, B>;
			readonly body: (b: B) => A;
		}
	): A;
	<A>(
		initial: A,
		options: {
			readonly while: Predicate.Predicate<A>;
			readonly body: (a: A) => A;
		}
	): A;
} = <A>(
	initial: A,
	options: {
		readonly while: Predicate.Predicate<A>;
		readonly body: (a: A) => A;
	}
): A => {
	let loop = initial;
	while (options.while(loop)) loop = options.body(loop);
	return loop;
};

export const loop: {
	<A, B, C extends B>(
		initial: B,
		options: {
			readonly while: Predicate.Refinement<B, C>;
			readonly body: (c: C) => A;
			readonly step: (c: C) => B;
		}
	): Array<A>;
	<A, B>(
		initial: B,
		options: {
			readonly while: Predicate.Predicate<B>;
			readonly body: (b: B) => A;
			readonly step: (b: B) => B;
		}
	): Array<A>;
} = <A, B>(
	initial: B,
	options: {
		readonly while: Predicate.Predicate<B>;
		readonly body: (b: B) => A;
		readonly step: (b: B) => B;
	}
): Array<A> =>
	Array.from(loopInternal(initial, options.while, options.step, options.body));

const loopInternal = <A, B>(
	initial: B,
	cont: Predicate.Predicate<B>,
	step: (b: B) => B,
	body: (b: B) => A
): List.List<A> =>
	cont(initial)
		? List.prepend(loopInternal(step(initial), cont, step, body), body(initial))
		: List.empty();

export const loopNonRecursive: {
	<A, B, C extends B>(
		initial: B,
		options: {
			readonly while: Predicate.Refinement<B, C>;
			readonly body: (c: C) => A;
			readonly step: (c: C) => B;
		}
	): Array<A>;
	<A, B>(
		initial: B,
		options: {
			readonly while: Predicate.Predicate<B>;
			readonly body: (b: B) => A;
			readonly step: (b: B) => B;
		}
	): Array<A>;
} = <A, B>(
	initial: B,
	options: {
		readonly while: Predicate.Predicate<B>;
		readonly body: (b: B) => A;
		readonly step: (b: B) => B;
	}
): Array<A> => {
	let loop = initial;
	const result = MutableList.empty<A>();
	while (options.while(loop)) {
		MutableList.append(result, options.body(loop));
		loop = options.step(loop);
	}
	return Array.from(result);
};

type ObjectRecord = { [key: string | symbol]: unknown };
export { type ObjectRecord as Record };

type AnyArray = unknown[];
export { type AnyArray as Array };

export type Primitive =
	| string
	| number
	| bigint
	| boolean
	| symbol
	| undefined
	| null;
//eslint-disable-next-line @typescript-eslint/ban-types
export type Unknown = Primitive | Function | ObjectRecord | AnyArray;
export type RecordOrArray = ObjectRecord | AnyArray;

export const isPrimitive = (u: unknown): u is Primitive =>
	u === null ||
	['string', 'number', 'boolean', 'bigingt', 'symbol', 'undefined'].includes(
		typeof u
	);
export const isString = Predicate.isString;
export const isNumber = Predicate.isNumber;
export const isBigint = Predicate.isBigInt;
export const isBoolean = Predicate.isBoolean;
export const isSymbol = Predicate.isSymbol;
export const isUndefined = Predicate.isUndefined;
export const isNull = Predicate.isNull;
export const isFunction = Predicate.isFunction;
// Warning : isObjectRecord lets class instances through although thet don't satisfy ObjectRecord
// But class instances do behave like ObjectRecords. So should be safe
export const isRecord = Predicate.isRecord;
export const isArray = Array.isArray;
export const isRecordOrArray = (u: unknown): u is RecordOrArray =>
	u !== null && typeof u === 'object';
export const isUrl = (u: unknown): u is URL => u instanceof URL;
