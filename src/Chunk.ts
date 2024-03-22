import { Meither, Mfunction } from '#src/internal/index';
import { Chunk, Either, Function, Number, Option, Predicate, flow, pipe } from 'effect';

/**
 * Returns true if the provided Chunk contains duplicates
 * @category utils
 * @since 1.0.0
 */
export const hasDuplicates = <A>(self: Chunk.Chunk<A>): boolean =>
	pipe(self, Chunk.dedupe, Chunk.size, Mfunction.strictEquals(self.length));

/**
 * Returns none if self contains zero or more than one element. Returns a some of the only element of the array otherwise.
 *
 * @category getters
 * */
export const getSingleton: <A>(self: Chunk.Chunk<A>) => Option.Option<A> = flow(
	Option.liftPredicate(flow(Chunk.size, Number.lessThanOrEqualTo(1))),
	Option.flatMap(Chunk.get(0))
);

/**
 * Returns a left of error if self contains more than one element. Returns a right of a none if self contains no element and a right of a some of the only element otherwise
 *
 * @category getters
 * */
export const getSingletonOrFailsWith =
	<B>(error: Function.LazyArg<B>) =>
	<A>(self: Chunk.Chunk<A>): Either.Either<Option.Option<A>, B> =>
		pipe(
			self,
			Meither.liftPredicate(flow(Chunk.size, Number.lessThanOrEqualTo(1)), error),
			Either.map(Chunk.get(0))
		);

/**
 * Looks for elements that fulfill the predicate. Returns `none` in case no element or more than
 * one element is found. Otherwise returns the sole matchning element.
 *
 * @category getters
 * @since 1.0.0
 */
export const findSingleton: {
	<B extends A, A>(refinement: Predicate.Refinement<NoInfer<A>, B>): (self: Chunk.Chunk<A>) => Option.Option<B>;
	<A>(predicate: Predicate.Predicate<NoInfer<A>>): (self: Chunk.Chunk<A>) => Option.Option<A>;
} =
	<A>(predicate: Predicate.Predicate<NoInfer<A>>) =>
	(self: Chunk.Chunk<A>) =>
		pipe(self, Chunk.filter(predicate), getSingleton);

/**
 * Returns a Chunk of the indexes of all elements of self matching the predicate
 *
 * @since 1.0.0
 */
export const findAll =
	<B extends A, A = B>(predicate: Predicate.Predicate<A>) =>
	(self: Chunk.Chunk<B>): Chunk.Chunk<number> =>
		Chunk.filterMap(self, (b, i) =>
			pipe(
				i,
				Option.liftPredicate(() => predicate(b))
			)
		);

/**
 * Takes all elements of self except the n last elements
 */
export const takeBut =
	(n: number) =>
	<A>(self: Chunk.Chunk<A>): Chunk.Chunk<A> =>
		Chunk.take(self, Chunk.size(self) - n);

/**
 * Takes all elements of self except the n first elements
 */
export const takeRightBut =
	(n: number) =>
	<A>(self: Chunk.Chunk<A>): Chunk.Chunk<A> =>
		Chunk.takeRight(self, Chunk.size(self) - n);
