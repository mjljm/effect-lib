import { Cause, Either, Option, pipe } from 'effect';

export const getRightWhenNoLeft = <A>(self: Either.Either<never, A>): A => (self as Either.Right<never, A>).right;

export const optionFromOptional = <E, A>(
	self: Either.Either<E, A>
): Either.Either<Exclude<E, Cause.NoSuchElementException>, Option.Option<A>> =>
	pipe(
		self,
		Either.map(Option.some),
		Either.orElse((e) =>
			e instanceof Cause.NoSuchElementException
				? Either.right(Option.none<A>())
				: Either.left(e as Exclude<E, Cause.NoSuchElementException>)
		)
	);
