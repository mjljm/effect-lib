import { Meither, Mtuple } from '#src/internal/index';
import { Either, Option, Tuple, pipe } from 'effect';

/**
 * Same as Either.filterOrLeft but we pass the details of the filtering calculation to the orLeftWithFunction. If the filtering function returns a none, the either is validated. If it returns a some(c), the either is not validated and c is passed to the orLeftWith function
 */
export const filterOptionalPredicate =
	<R, L2, C>(f: (r: NoInfer<R>) => Option.Option<C>, orLeftWith: (right: NoInfer<R>, calculation: C) => L2) =>
	<L>(self: Either.Either<R, L>): Either.Either<R, L2 | L> =>
		Either.flatMap(self, Meither.liftOptionalPredicate(f, orLeftWith));

/**
 * gets the value of the Either when it can never be a left
 */
export const getRightWhenNoLeft = <A>(self: Either.Either<A, never>): A => (self as Either.Right<never, A>).right;

/**
 * Transforms an either of a tuple into a tuple of either's. Useful for instance for error management in reduce or mapAccum
 */
export const traverseTuple = <A, B, L>(
	self: Either.Either<[A, B], L>
): [Either.Either<A, L>, Either.Either<B, L>] =>
	pipe(
		self,
		Either.map(Tuple.mapBoth({ onFirst: Either.right, onSecond: Either.right })),
		Either.getOrElse(Mtuple.makeBothBy({ onFirst: Either.left, onSecond: Either.left }))
	);

export * from '#src/internal/either';
