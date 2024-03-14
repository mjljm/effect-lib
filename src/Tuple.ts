import { Tuple, pipe } from 'effect';

export const makeBoth = <A>(a: A): [A, A] => Tuple.make(a, a);
export const makeBothWith =
	<A, B, C>(fB: (a: NoInfer<A>) => B, fC: (a: NoInfer<A>) => C) =>
	(a: A): [B, C] =>
		pipe(a, makeBoth, Tuple.mapBoth({ onFirst: fB, onSecond: fC }));
