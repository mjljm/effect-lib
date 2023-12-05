import { Chunk, Either, Function, Option, Predicate, pipe } from 'effect';
/**
 * Returns true if the provided Chunk contains duplicates
 * @category utils
 * @since 1.0.0
 */
export const hasDuplicates = <A>(self: Chunk.Chunk<A>): boolean =>
	pipe(self, Chunk.dedupe, (as) => (as.length === self.length ? false : true));

/**
 * Returns none if self contains zero or more than one element. Returns a some of the only element of the array otherwise.
 *
 * @category getters
 * */
export const getSingleton = <A>(self: Chunk.Chunk<A>): Option.Option<A> =>
	self.length > 1 ? Option.none() : Chunk.get(self, 0);

/**
 * Returns a left of error if self contains more than one element. Returns a right of a none if self contains no element and a right of a some of the only element otherwise
 *
 * @category getters
 * */
export const getSingletonOrElse: {
	<B>(
		error: Function.LazyArg<B>
	): <A>(self: Chunk.Chunk<A>) => Either.Either<B, Option.Option<A>>;
	<A, B>(
		self: Chunk.Chunk<A>,
		error: Function.LazyArg<B>
	): Either.Either<B, Option.Option<A>>;
} = Function.dual(
	2,
	<A, B>(
		self: Chunk.Chunk<A>,
		error: Function.LazyArg<B>
	): Either.Either<B, Option.Option<A>> =>
		self.length > 1 ? Either.left(error()) : Either.right(Chunk.get(self, 0))
);

/**
 * Looks for elements that fulfill the predicate. Returns `none` in case no element or more than
 * one element is found. Otherwise returns the sole matchning element.
 *
 * @category getters
 * @since 1.0.0
 */
export const findSingleton = Function.dual<
	{
		<A, B extends A>(
			refinement: Predicate.Refinement<A, B>
		): (self: Chunk.Chunk<A>) => Option.Option<B>;
		<A>(
			predicate: Predicate.Predicate<A>
		): (self: Chunk.Chunk<A>) => Option.Option<A>;
	},
	{
		<A, B extends A>(
			self: Chunk.Chunk<A>,
			refinement: Predicate.Refinement<A, B>
		): Option.Option<B>;
		<A>(
			self: Chunk.Chunk<A>,
			predicate: Predicate.Predicate<A>
		): Option.Option<A>;
	}
>(2, <A>(self: Chunk.Chunk<A>, predicate: Predicate.Predicate<A>) =>
	pipe(self, Chunk.filter(predicate), getSingleton)
);
