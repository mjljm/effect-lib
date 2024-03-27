import * as MEqValue from '#src/EqValue';
import { JsTypes } from '@mjljm/js-lib';
import {
	Equal,
	Equivalence,
	Function,
	MutableHashMap,
	MutableQueue,
	Option,
	Predicate,
	ReadonlyArray,
	flow,
	identity
} from 'effect';

//const moduleTag = '@mjljm/effect-lib/Function/';

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
export const ifElse: {
	<A, B extends A, C>(
		cond: Predicate.Refinement<A, B>,
		options: { onTrue: (b: B) => C; onFalse: (a: A) => C }
	): (a: A) => C;
	<A, B>(cond: Predicate.Predicate<A>, options: { onTrue: (a: A) => B; onFalse: (a: A) => B }): (a: A) => B;
} =
	<A, B>(cond: Predicate.Predicate<A>, options: { onTrue: (a: A) => B; onFalse: (a: A) => B }) =>
	(a: A) =>
		cond(a) ? options.onTrue(a) : options.onFalse(a);

/**
 * Flips a dual function
 */
export const flipDual =
	<F extends (a: never, ...b: never[]) => unknown>(
		f: F
	): ((self: Parameters<F>[0]) => (...b: JsTypes.Tail<Parameters<F>>) => ReturnType<F>) =>
	(self) =>
	(...b) =>
		f(self, ...b) as ReturnType<F>;

/**
 * strict equality comparator
 */
export const strictEquals =
	<A>(that: A) =>
	(self: A): boolean =>
		self === that;

/**
 * Curried equality between elements having the same type. Prefer using strictEquals for primitive types because it is faster
 */
export const isEquivalentTo =
	<A>(that: A) =>
	(self: A): boolean =>
		Equal.equals(that, self);

/**
 * Function to memoize a function that takes no argument. Useful to lazy initialize constants
 */

export const once = <A>(f: Function.LazyArg<A>): Function.LazyArg<A> => {
	let store = Option.none<A>();
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
 * Function composition in reverse order: self is executed after bc.
 */
// Flipping the Function.compose function will not work
export const preComposeWith =
	<B, C>(bc: (b: B) => C) =>
	<A>(self: (c: C) => A): ((b: B) => A) =>
		flow(bc, self);

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
export const isArray = <T>(arg: T): arg is JsTypes.ArrayType<T> => Array.isArray(arg);
export const isRecordOrArray = (u: unknown): u is RecordOrArray => u !== null && typeof u === 'object';
export const isUrl = (u: unknown): u is URL => u instanceof URL;
export const isErrorish = (u: unknown): u is Errorish =>
	u !== null &&
	typeof u === 'object' &&
	'message' in u &&
	typeof u.message === 'string' &&
	(!('stack' in u) || typeof u.stack === 'string');

export const isArrayOfSomes = <T>(a: ReadonlyArray<Option.Option<T>>): a is ReadonlyArray<Option.Some<T>> =>
	ReadonlyArray.getSomes(a).length === a.length;
