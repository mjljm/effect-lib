import { Tuple, pipe } from 'effect';

/**
 * Creates a two element tuple with the same value
 *
 * @category constructor
 */
export const makeBoth = <A>(a: A): [A, A] => Tuple.make(a, a);

/**
 * Creates a two element tuple applying two different functions to the same value
 *
 * @category constructor
 */
export const makeBothBy =
	<A, B, C>({ toFirst, toSecond }: { toFirst: (a: NoInfer<A>) => B; toSecond: (a: NoInfer<A>) => C }) =>
	(a: A): [B, C] =>
		pipe(a, makeBoth, Tuple.mapBoth({ onFirst: toFirst, onSecond: toSecond }));

/**
 * Appends an element at the start of a tuple.
 *
 * @category concatenating
 */
export const prependElement =
	<B>(that: B) =>
	<A extends ReadonlyArray<unknown>>(self: A): [B, ...A] =>
		[that, ...self] as const;

/**
 * Returns the first two elements of a tuple
 */
export const firstTwo = <A, B, C extends ReadonlyArray<unknown>>(a: [A, B, ...C]): [A, B] =>
	Tuple.make(a[0], a[1]);
