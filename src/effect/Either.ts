import { Either } from 'effect';

export const getRightWhenNoLeft = <A>(self: Either.Either<never, A>): A =>
	(self as Either.Right<never, A>).right;
