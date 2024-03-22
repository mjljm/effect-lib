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
	<A, B, C>({ onFirst, onSecond }: { onFirst: (a: NoInfer<A>) => B; onSecond: (a: NoInfer<A>) => C }) =>
	(a: A): [B, C] =>
		pipe(a, makeBoth, Tuple.mapBoth({ onFirst, onSecond }));
