import { Cause, Either, Option, Tuple, pipe } from 'effect';

/**
 * Takes a value a of type A and a function that optionnally returns an error B when passed an A. Returns a right of a if there is no error. Otherwise, returns a left containing the original value a and the calculated error of type B.
 */
export const liftOptionalError =
	<A, B>(f: (a: NoInfer<A>) => Option.Option<B>) =>
	(a: A): Either.Either<A, [B, A]> =>
		pipe(
			a,
			f,
			Either.fromOption(() => a),
			Either.map((b) => Tuple.make(b, a)),
			Either.flip
		);
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
