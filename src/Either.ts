import { Cause, Either, Option, Predicate, pipe } from 'effect';
import { NoInfer } from 'effect/Types';

/**
 * Filters an option. Returns Either.right(Option.none) if self is a none, Either.right(Option.some(v)) if self is a some(v) and v fulfills the predicate and Either.left(E) if self is a some(v) and v does not fulfill the predicate
 */
export const fromOptionSomeMatching: {
	<A, B extends A, E>(
		refinement: Predicate.Refinement<NoInfer<A>, B>,
		orLeftWith: (a: NoInfer<A>) => E
	): (self: Option.Option<A>) => Either.Either<E, Option.Option<B>>;
	<A, E>(
		predicate: Predicate.Predicate<NoInfer<A>>,
		orLeftWith: (a: NoInfer<A>) => E
	): (self: Option.Option<A>) => Either.Either<E, Option.Option<A>>;
} =
	<A, E>(predicate: Predicate.Predicate<NoInfer<A>>, orLeftWith: (a: NoInfer<A>) => E) =>
	(self: Option.Option<A>): Either.Either<E, Option.Option<A>> =>
		pipe(
			self,
			Option.match({
				onNone: () => Either.right(Option.none()),
				onSome: (a) => (predicate(a) ? Either.right(Option.some(a)) : Either.left(orLeftWith(a)))
			})
		);

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
