import { Effect } from 'effect';

export interface PredicateEffect<Z, R, E> {
	(x: Z): Effect.Effect<R, E, boolean>;
}
