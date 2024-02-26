import { MEqValue } from '#mjljm/effect-lib/index';
import { Equal, Equivalence, Function, MutableHashMap, MutableQueue, Option, Predicate, identity } from 'effect';

//const moduleTag = '@mjljm/effect-lib/Function/';

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
/*export const whileDo: {
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
};*/

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
/*export const whileDoAccum: {
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
};*/

/**
 * Function that takes an initial state and runs it through a step until the result stops meeting the predicate (the predicate is executed at start of loop). The final state is returned. Exists in predicate and refinement version. DO NOT USE
 */
/*export const doWhile: {
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
};*/

/**
 * Function that takes an initial state and, on the one hand, runs it through a body keeping each result and, on the other and, runs it through a step function until the result stops meeting the predicate. The array of all body results is returned. Exists in predicate and refinement version. DO NOT USE
 */
/*export const doWhileAccum: {
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
};*/

/**
 * Function to memoize a function that takes no argument. Useful to lazy initialize constants
 */

export const once = <A>(f: Function.LazyArg<A>): Function.LazyArg<A> => {
	let store: Option.Option<A>;
	const cached: Function.LazyArg<A> = () => {
		if (Option.isNone(store)) {
			const result = f();
			store = Option.some(result);
			return result;
		} else return store.value;
	};
	return cached;
};

/**
 * Function to memoize a function that takes an A and returns a B
 */
export const memoize =
	(capacity: number) =>
	<A, B>(f: OneArgFunction<A, B>, Eq?: Equivalence.Equivalence<A>): OneArgFunction<A, B> => {
		const store = MutableHashMap.empty<MEqValue.Type<A>, B>();
		const keyOrder = MutableQueue.unbounded<MEqValue.Type<A>>();
		const cached: OneArgFunction<A, B> = (a: A) => {
			const eqA = MEqValue.make({ value: a, Eq });
			const cachedA = MutableHashMap.get(store, eqA);
			return Option.getOrElse(cachedA, () => {
				const result = f(a);
				MutableHashMap.set(store, eqA, result);
				MutableQueue.offer(keyOrder, eqA);
				if (MutableQueue.length(keyOrder) > capacity) {
					MutableHashMap.remove(MutableQueue.poll(keyOrder, MutableQueue.EmptyMutableQueue));
				}
				return result;
			});
		};
		return capacity > 0 ? cached : f;
	};

/**
 * Constructor for objects that require no Id and no equal operator
 */
export const make: <A>(s: Readonly<A>) => A = identity;

/**
 * Constructor for objects of a simple type that require an Id and an equal operator
 */
export const makeWithId =
	<A>(TypeId: symbol, prototype: Equal.Equal | null = null) =>
	(params: Readonly<Omit<A, symbol>>): A =>
		Function.unsafeCoerce<unknown, A>(
			Object.assign(
				Object.create(prototype, {
					[TypeId]: { value: TypeId }
				}),
				params
			)
		);

/**
 * Generic type guard for object with Id
 */
export const isOfId =
	<Type>(TypeId: symbol) =>
	(u: unknown): u is Type =>
		Predicate.hasProperty(u, TypeId);

/**
 * Pipable if
 */
export const iif: {
	<A, B extends A>(cond: Predicate.Refinement<A, B>, onTrue: (b: B) => A): (a: A) => A;
	<A>(cond: Predicate.Predicate<A>, onTrue: (a: A) => A): (a: A) => A;
} =
	<A>(cond: Predicate.Predicate<A>, onTrue: (a: A) => A) =>
	(a: A) =>
		cond(a) ? onTrue(a) : a;

/**
 * Pipable if else
 */
/*export const ifElse: {
	<A, B extends A, C>(
		cond: Predicate.Refinement<A, B>,
		options: { onTrue: (b: B) => C; onFalse: (a: A) => C }
	): (a: A) => C;
	<A, B>(cond: Predicate.Predicate<A>, options: { onTrue: (a: A) => B; onFalse: (a: A) => B }): (a: A) => B;
} =
	<A, B>(cond: Predicate.Predicate<A>, options: { onTrue: (a: A) => B; onFalse: (a: A) => B }) =>
	(a: A) =>
		cond(a) ? options.onTrue(a) : options.onFalse(a);*/

/**
 * Type qui transforme une union en intersection
 */
/*export type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void
	? I
	: never;*/

/**
 * Type that expands a type
 */
/*export type Develop<P> = P extends TypedPath<infer X, infer Y>
	? Y extends unknown
			? X extends unknown
				? TypedPath<X, Y>
				: never
			: never
		: never*/

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
 * Type qui représente une fonction avec un argument
 */
export type OneArgFunction<A, B> = (a: A) => B;

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
export const isNotNull = Predicate.isNotNull;
export const isFunction = (u: unknown): u is AnyFunction => typeof u === 'function';
// Warning : isObjectRecord lets class instances through although thet don't satisfy ObjectRecord
// But class instances do behave like ObjectRecords. So should be safe
export const isRecord = Predicate.isRecord;
/**
 * The following code corrects a bug in typescript where Array.isArray narrows a ReadonlyArray to any[]. To remove when this bug has been corrected. See https://github.com/microsoft/TypeScript/issues/17002
 */
//eslint-disable-next-line @typescript-eslint/no-explicit-any
type ArrayType<T> = Extract<true extends T & false ? any[] : T extends readonly any[] ? T : unknown[], T>;

export const isArray = <T>(arg: T): arg is ArrayType<T> => Array.isArray(arg);

export const isRecordOrArray = (u: unknown): u is RecordOrArray => u !== null && typeof u === 'object';
export const isUrl = (u: unknown): u is URL => u instanceof URL;
export const isErrorish = (u: unknown): u is Errorish =>
	u !== null &&
	typeof u === 'object' &&
	'message' in u &&
	typeof u.message === 'string' &&
	(!('stack' in u) || typeof u.stack === 'string');
