import { Cause, Either, Option, pipe } from 'effect';

export const getRightWhenNoLeft = <A>(self: Either.Either<A, never>): A => (self as Either.Right<never, A>).right;

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
