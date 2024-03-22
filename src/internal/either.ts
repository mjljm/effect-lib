import * as common from '#src/internal/common';
import { Cause, Either, Function, Option, pipe } from 'effect';

export const liftPredicate = common.either_liftPredicate;

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
 * Flattens two eithers into a single one
 */
export const flatten: <R, L1, L2>(self: Either.Either<Either.Either<R, L1>, L2>) => Either.Either<R, L1 | L2> =
	Either.flatMap(Function.identity);
