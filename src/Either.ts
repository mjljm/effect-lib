import { MTuple } from '#mjljm/effect-lib/index';
import { Cause, Either, Option, Predicate, Tuple, pipe } from 'effect';

/**
 * Lifts a value r to a right if predicate returns true. If predicate returns false, it lifts r to a left that is calculated from itself by orLeftWith
 */

export const liftPredicate: {
	// Note: I intentionally avoid using the NoInfer pattern here.
	<A, A1 extends A, L>(
		refinement: Predicate.Refinement<A, A1>,
		orLeftWith: (a: A) => L
	): (a: A) => Either.Either<A1, L>;
	<A, L>(predicate: Predicate.Predicate<A>, orLeftWith: (a: A) => L): (a: A) => Either.Either<A, L>;
} =
	<A, L>(predicate: Predicate.Predicate<A>, orLeftWith: (a: A) => L) =>
	(a: A): Either.Either<A, L> =>
		predicate(a) ? Either.right(a) : Either.left(orLeftWith(a));

/**
 * Lifts a value r to a right if f applied to r returns a none. If it returns a some(c), it lifts r to a left that is calculated from itself and c
 */
// Note: I intentionally avoid using the NoInfer pattern here.
export const liftOptionalPredicate =
	<R, L, C>(f: (r: R) => Option.Option<C>, orLeftWith: (right: R, calculation: C) => L) =>
	(r: R): Either.Either<R, L> =>
		pipe(
			r,
			f,
			Option.map((c) => orLeftWith(r, c)),
			Either.fromOption(() => r),
			Either.flip
		);

/**
 * Same as Either.filterOrLeft but we pass the details of the filtering calculation to the orLeftWithFunction. If the filtering function returns a none, the either is validated. If it returns a some(c), the either is not validated and c is passed to the orLeftWith function
 */
export const filterOptionalPredicate =
	<R, L2, C>(f: (r: NoInfer<R>) => Option.Option<C>, orLeftWith: (right: NoInfer<R>, calculation: C) => L2) =>
	<L>(self: Either.Either<R, L>): Either.Either<R, L2 | L> =>
		Either.flatMap(self, liftOptionalPredicate(f, orLeftWith));

/**
 * gets the value of the Either when it can never be a left
 */
export const getRightWhenNoLeft = <A>(self: Either.Either<A, never>): A => (self as Either.Right<never, A>).right;

/**
 * Same as Effect.optionFromOptional
 */
export const optionFromOptional = <A, E>(
	self: Either.Either<A, E>
): Either.Either<Option.Option<A>, Exclude<E, Cause.NoSuchElementException>> =>
	pipe(
		self,
		Either.map(Option.some),
		Either.orElse((e) =>
			e instanceof Cause.NoSuchElementException
				? Either.right(Option.none<A>())
				: Either.left(e as Exclude<E, Cause.NoSuchElementException>)
		)
	);

/**
 * Transforms an either of a tuple into a tuple of either's. Useful for instance for error management in reduce or mapAccum
 */

export const traverse = <A, B, L>(self: Either.Either<[A, B], L>): [Either.Either<A, L>, Either.Either<B, L>] =>
	pipe(
		self,
		Either.map(Tuple.mapBoth({ onFirst: Either.right, onSecond: Either.right })),
		Either.getOrElse(MTuple.makeBothBy({ onFirst: Either.left, onSecond: Either.left }))
	);
