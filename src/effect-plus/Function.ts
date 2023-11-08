import { List, Predicate } from 'effect';

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
): A => (options.while(initial) ? iterate(options.body(initial), options) : initial);

export const loop: {
	<A, B, C extends B>(
		initial: B,
		options: {
			readonly while: Predicate.Refinement<B, C>;
			readonly body: (c: C) => A;
			readonly step: (c: C) => B;
		}
	): ReadonlyArray<A>;
	<A, B>(
		initial: B,
		options: {
			readonly while: Predicate.Predicate<B>;
			readonly body: (b: B) => A;
			readonly step: (b: B) => B;
		}
	): ReadonlyArray<A>;
} = <A, B>(
	initial: B,
	options: {
		readonly while: Predicate.Predicate<B>;
		readonly body: (b: B) => A;
		readonly step: (b: B) => B;
	}
): ReadonlyArray<A> => Array.from(loopInternal(initial, options.while, options.step, options.body));

const loopInternal = <A, B>(
	initial: B,
	cont: Predicate.Predicate<B>,
	step: (b: B) => B,
	body: (b: B) => A
): List.List<A> =>
	cont(initial)
		? List.prepend(loopInternal(step(initial), cont, step, body), body(initial))
		: List.empty();

export type Primitive = string | number | bigint | boolean | symbol | undefined | null;
export const isPrimitive = (u: unknown): u is Primitive =>
	u === null || typeof u in ['string', 'number', 'boolean', 'bigingt', 'symbol', 'undefined'];

// Defines an object that is not null, not undefined, not an array (even empty), not a function and not a class
export type AnyRecord = Record<string | symbol, unknown>;
export const isAnyRecord = (u: unknown): u is AnyRecord =>
	u !== null && typeof u === 'object' && !Array.isArray(u);
