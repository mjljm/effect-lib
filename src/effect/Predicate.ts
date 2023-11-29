import { Effect } from 'effect';

export interface PredicateEffect<in Z, out R, out E> {
	(x: Z): Effect.Effect<R, E, boolean>;
}
