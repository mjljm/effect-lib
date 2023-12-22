import { EqValue } from '#mjljm/effect-lib/index';
import { Equivalence, MutableHashMap, MutableList, Option, Predicate, identity, pipe } from 'effect';

/**
 * Function that takes an initial state and runs it through a step until the result stops meeting the while condition (while condition is executed at start of loop). The final state is returned. Exists in predicate and refinement version.
 */
/*export const whileDoRecursive: {
	<A, B extends A>(
		initial: A,
		options: {
			readonly predicate: Predicate.Refinement<A, B>;
			readonly step: (b: B) => A;
		}
	): A;
	<A>(
		initial: A,
		options: {
			readonly predicate: Predicate.Predicate<A>;
			readonly step: (a: A) => A;
		}
	): A;
} = <A>(
	initial: A,
	options: {
		readonly predicate: Predicate.Predicate<A>;
		readonly step: (a: A) => A;
	}
): A =>
	options.predicate(initial) ? whileDoRecursive(options.step(initial), options) : initial;*/

/**
 * Function that takes an initial state and runs it through a step until the result stops meeting the predicate (the predicate is executed at start of loop). The final state is returned. Exists in predicate and refinement version. DO NOT USE
 */
export const whileDo: {
	<A, B extends A>(
		initial: A,
		options: {
			readonly predicate: Predicate.Refinement<A, B>;
			readonly step: (b: B) => A;
		}
	): A;
	<A>(
		initial: A,
		options: {
			readonly predicate: Predicate.Predicate<A>;
			readonly step: (a: A) => A;
		}
	): A;
} = <A>(
	initial: A,
	options: {
		readonly predicate: Predicate.Predicate<A>;
		readonly step: (a: A) => A;
	}
): A => {
	let loop = initial;
	while (options.predicate(loop)) loop = options.step(loop);
	return loop;
};

/**
 * Function that takes an initial state and, on the one hand, runs it through a body keeping each result and, on the other and, runs it through a step function until the result stops meeting the predicate. The array of all body results is returned. Exists in predicate and refinement version.
 */
/*export const whileDoAccumRecursive: {
	<A, B, C extends B>(
		initial: B,
		options: {
			readonly predicate: Predicate.Refinement<B, C>;
			readonly body: (c: C) => A;
			readonly step: (c: C) => B;
		}
	): Array<A>;
	<A, B>(
		initial: B,
		options: {
			readonly predicate: Predicate.Predicate<B>;
			readonly body: (b: B) => A;
			readonly step: (b: B) => B;
		}
	): Array<A>;
} = <A, B>(
	initial: B,
	options: {
		readonly predicate: Predicate.Predicate<B>;
		readonly body: (b: B) => A;
		readonly step: (b: B) => B;
	}
): Array<A> =>
	Array.from(
		whileDoAccumRecursiveInternal(initial, options.predicate, options.step, options.body)
	);

const whileDoAccumRecursiveInternal = <A, B>(
	initial: B,
	cont: Predicate.Predicate<B>,
	step: (b: B) => B,
	body: (b: B) => A
): List.List<A> =>
	cont(initial)
		? List.prepend(
			whileDoAccumRecursiveInternal(step(initial), cont, step, body),
				body(initial)
		  )
		: List.empty();*/

/**
 * Function that takes an initial state and, on the one hand, runs it through a body keeping each result and, on the other and, runs it through a step function until the result stops meeting the predicate. The array of all body results is returned. Exists in predicate and refinement version. Same as loop but coded without recursion. DO NOT USE
 */
export const whileDoAccum: {
	<A, B, C extends B>(
		initial: B,
		options: {
			readonly predicate: Predicate.Refinement<B, C>;
			readonly body: (c: C) => A;
			readonly step: (c: C) => B;
		}
	): Array<A>;
	<A, B>(
		initial: B,
		options: {
			readonly predicate: Predicate.Predicate<B>;
			readonly body: (b: B) => A;
			readonly step: (b: B) => B;
		}
	): Array<A>;
} = <A, B>(
	initial: B,
	options: {
		readonly predicate: Predicate.Predicate<B>;
		readonly body: (b: B) => A;
		readonly step: (b: B) => B;
	}
): Array<A> => {
	let loop = initial;
	const result = MutableList.empty<A>();
	while (options.predicate(loop)) {
		MutableList.append(result, options.body(loop));
		loop = options.step(loop);
	}
	return Array.from(result);
};

/**
 * Function that takes an initial state and runs it through a step until the result stops meeting the predicate (the predicate is executed at start of loop). The final state is returned. Exists in predicate and refinement version. DO NOT USE
 */
export const doWhile: {
	<A, B extends A>(
		initial: B,
		options: {
			readonly step: (a: B) => A;
			readonly predicate: Predicate.Refinement<A, B>;
		}
	): A;
	<A>(
		initial: A,
		options: {
			readonly step: (a: A) => A;
			readonly predicate: Predicate.Predicate<A>;
		}
	): A;
} = <A>(
	initial: A,
	options: {
		readonly step: (a: A) => A;
		readonly predicate: Predicate.Predicate<A>;
	}
): A => {
	let loop = initial;
	do {
		loop = options.step(loop);
	} while (options.predicate(loop));
	return loop;
};

/**
 * Function that takes an initial state and, on the one hand, runs it through a body keeping each result and, on the other and, runs it through a step function until the result stops meeting the predicate. The array of all body results is returned. Exists in predicate and refinement version. DO NOT USE
 */
export const doWhileAccum: {
	<A, B, C extends B>(
		initial: C,
		options: {
			readonly step: (b: C) => B;
			readonly predicate: Predicate.Refinement<B, C>;
			readonly body: (c: C) => A;
		}
	): Array<A>;
	<A, B>(
		initial: B,
		options: {
			readonly step: (b: B) => B;
			readonly predicate: Predicate.Predicate<B>;
			readonly body: (b: B) => A;
		}
	): Array<A>;
} = <A, B>(
	initial: B,
	options: {
		readonly step: (b: B) => B;
		readonly predicate: Predicate.Predicate<B>;
		readonly body: (b: B) => A;
	}
): Array<A> => {
	let loop = initial;
	let cont: boolean;
	const result = MutableList.empty<A>();
	do {
		loop = options.step(loop);
		cont = options.predicate(loop);
		if (cont) MutableList.append(result, options.body(loop));
	} while (cont);
	return Array.from(result);
};

/**
 * Function to memoize a function that takes an A and returns a B
 */
export const memoize = <A, B>(f: (a: A) => B, Eq?: Equivalence.Equivalence<A> | undefined): ((a: A) => B) => {
	const cache = MutableHashMap.empty<EqValue.EqValue<A>, B>();
	return (a: A) =>
		pipe(new EqValue.EqValue({ value: a, Eq }), (eqA) =>
			pipe(
				cache,
				MutableHashMap.get(eqA),
				Option.getOrElse(() => f(a)),
				(b) => (MutableHashMap.set(cache, eqA, b), b)
			)
		);
};

/**
 * Function that takes an object of type A and return an object of type Readonly<A>
 */
export const makeReadonly: <A>(s: A) => Readonly<A> = identity;

/**
 * Type qui transforme une union en inetrsection
 */
export type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void
	? I
	: never;

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
export type Primitive = string | number | bigint | boolean | symbol | undefined | null;

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
	u === null || ['string', 'number', 'boolean', 'bigingt', 'symbol', 'undefined'].includes(typeof u);

export type Errorish = { message: string; stack?: string | undefined };

export const isString = Predicate.isString;
export const isNumber = Predicate.isNumber;
export const isBigint = Predicate.isBigInt;
export const isBoolean = Predicate.isBoolean;
export const isSymbol = Predicate.isSymbol;
export const isUndefined = Predicate.isUndefined;
export const isNull = Predicate.isNull;
export const isFunction = (u: unknown): u is AnyFunction => typeof u === 'function';
// Warning : isObjectRecord lets class instances through although thet don't satisfy ObjectRecord
// But class instances do behave like ObjectRecords. So should be safe
export const isRecord = Predicate.isRecord;
export const isArray = Array.isArray;
export const isRecordOrArray = (u: unknown): u is RecordOrArray => u !== null && typeof u === 'object';
export const isUrl = (u: unknown): u is URL => u instanceof URL;
export const isErrorish = (u: unknown): u is Errorish =>
	u !== null && typeof u === 'object' && 'message' in u && typeof u.message === 'string';
