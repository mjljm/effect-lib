import { Tuple, pipe } from 'effect';

export const makeBoth = <A>(a: A): [A, A] => Tuple.make(a, a);
export const makeBothBy =
	<A, B, C>(fB: (a: NoInfer<A>) => B, fC: (a: NoInfer<A>) => C) =>
	(a: A): [B, C] =>
		pipe(a, makeBoth, Tuple.mapBoth({ onFirst: fB, onSecond: fC }));

/**
 * Appends an element at the start of a tuple.
 *
 * @category concatenating
 */
export const prependElement =
	<B>(that: B) =>
	<A extends ReadonlyArray<unknown>>(self: A): [B, ...A] =>
		[that, ...self] as const;
