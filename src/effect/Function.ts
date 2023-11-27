import {
	List,
	MutableHashMap,
	MutableList,
	Option,
	Predicate,
	pipe
} from 'effect';

/**
 * Function that takes an initial state and runs it through a body until the result stops meeting the while condition. The final state is returned. Exists in predicate and refinement version.
 */
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

/**
 * Function that takes an initial state and runs it through a body until the result stops meeting the while condition. The final state is returned. Exists in predicate and refinement version. Same as iterate but coded without recursion
 */
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

/**
 * Function that takes an initial state and, on the one hand, runs it through a body keeping each result and, on the other and, runs it through a step function until the result stops meeting the while condition. The array of all body results is returned. Exists in predicate and refinement version.
 */
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

/**
 * Function that takes an initial state and, on the one hand, runs it through a body keeping each result and, on the other and, runs it through a step function until the result stops meeting the while condition. The array of all body results is returned. Exists in predicate and refinement version. Same as loop but coded without recursion
 */
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

/**
 * Fonction qui mémoise une fonction qui prend un argument de type A et retourne un argument de type B.
 */
export const memoize = <A, B>(f: (a: A) => B): ((a: A) => B) => {
	const cache = MutableHashMap.empty<A, B>();

	return (a: A) =>
		pipe(
			cache,
			MutableHashMap.get(a),
			Option.getOrElse(() => f(a)),
			(b) => (MutableHashMap.set(a, b), b)
		);
};

/**
 * Type qui représente un vrai objet (pas un tableau, pas une fonction, pas une valeur nulle ou undefined). Typescript considère que les instances de classe ne répondent pas à cette définition. Alors qu'elles y répondent.
 */
type ObjectRecord = { [key: string | symbol]: unknown };
export { type ObjectRecord as Record };

/**
 * Type qui représente un tableau
 */
type AnyArray = unknown[];
export { type AnyArray as Array };

/**
 * Type qui représente une primitive
 */
export type Primitive =
	| string
	| number
	| bigint
	| boolean
	| symbol
	| undefined
	| null;

/**
 * Type qui représente une fonction
 */
type AnyFunction = (...a: ReadonlyArray<never>) => unknown;
export { type AnyFunction as Function };

/**
 * Type qui représente n'importe quelle valeur
 */
//eslint-disable-next-line @typescript-eslint/ban-types
export type Unknown = Primitive | AnyFunction | ObjectRecord | AnyArray;

/**
 * Type qui représente un objet ou un tableau (mais pas une fonction)
 */
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
export const isFunction = (u: unknown): u is AnyFunction =>
	typeof u === 'function';
// Warning : isObjectRecord lets class instances through although thet don't satisfy ObjectRecord
// But class instances do behave like ObjectRecords. So should be safe
export const isRecord = Predicate.isRecord;
export const isArray = Array.isArray;
export const isRecordOrArray = (u: unknown): u is RecordOrArray =>
	u !== null && typeof u === 'object';
export const isUrl = (u: unknown): u is URL => u instanceof URL;
