import { Cause, Either, Option, Predicate, pipe } from 'effect';

/**
 * Lifts a value r to a right if predicate returns true. If predicate returns false, it lifts r to a left that is calculated from itself by orLeftWith
 */

export const liftPredicate: {
	// Note: I intentionally avoid using the NoInfer pattern here.
	<R, R1 extends R, L>(
		refinement: Predicate.Refinement<R, R1>,
		orLeftWith: (r: R) => L
	): (r: R) => Either.Either<R1, L>;
	<R, L>(predicate: Predicate.Predicate<R>, orLeftWith: (r: R) => L): (r: R) => Either.Either<R, L>;
} =
	<R, L>(predicate: Predicate.Predicate<R>, orLeftWith: (r: R) => L) =>
	(r: R): Either.Either<R, L> =>
		predicate(r) ? Either.right(r) : Either.left(orLeftWith(r));

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
