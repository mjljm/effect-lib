import { Chunk, Either, Function, Option, Predicate, ReadonlyArray, Tuple, pipe } from 'effect';

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
export const getSingletonOrFailsWith =
	<B>(error: Function.LazyArg<B>) =>
	<A>(self: Chunk.Chunk<A>): Either.Either<Option.Option<A>, B> =>
		self.length > 1 ? Either.left(error()) : Either.right(Chunk.get(self, 0));

/**
 * Throws if self contains more than one element. Returns a none if self contains no element and a some of the only element otherwise
 *
 * @category getters
 * */
export const getSingletonOrThrowWith =
	<B>(error: Function.LazyArg<B>) =>
	<A>(self: Chunk.Chunk<A>): Option.Option<A> => {
		if (self.length > 1) throw error();
		return Chunk.get(self, 0);
	};

/**
 * Looks for elements that fulfill the predicate. Returns `none` in case no element or more than
 * one element is found. Otherwise returns the sole matchning element.
 *
 * @category getters
 * @since 1.0.0
 */
export const findSingleton: {
	<B extends A, A>(refinement: Predicate.Refinement<NoInfer<A>, B>): (self: Chunk.Chunk<A>) => Option.Option<B>;
	<A>(predicate: Predicate.Predicate<NoInfer<A>>): (self: Chunk.Chunk<A>) => Option.Option<A>;
} =
	<A>(predicate: Predicate.Predicate<NoInfer<A>>) =>
	(self: Chunk.Chunk<A>) =>
		pipe(self, Chunk.filter(predicate), getSingleton);

/**
 * Split a chunk A in two arrays [B,C], B containing all the elements at even indexes, C all elements at odd indexes
 */
export const splitOddEvenIndexes = <A>(self: Chunk.Chunk<A>): [Chunk.Chunk<A>, Chunk.Chunk<A>] =>
	Chunk.reduce(self, Tuple.make(Chunk.empty<A>(), Chunk.empty<A>()), ([even, odd], a) =>
		even.length <= odd.length ? Tuple.make(Chunk.append(even, a), odd) : Tuple.make(even, Chunk.append(odd, a))
	);

/**
 * Returns a Chunk of the indexes of all elements of self matching the predicate
 *
 * @since 1.0.0
 */
export const findAll =
	<B extends A, A = B>(predicate: Predicate.Predicate<A>) =>
	(self: Iterable<B>): Chunk.Chunk<number> =>
		ReadonlyArray.reduce(self, Chunk.empty<number>(), (acc, a, i) => (predicate(a) ? Chunk.append(acc, i) : acc));

/**
 * Returns the provided `Chunk` `that` if `self` is empty, otherwise returns `self`.
 *
 * @category error handling
 */
export const orElse =
	<B>(that: Function.LazyArg<Chunk.Chunk<B>>) =>
	<A>(self: Chunk.Chunk<A>): Chunk.Chunk<B | A> =>
		Chunk.isEmpty(self) ? that() : self;

/**
 * Takes all elements of self except the n last elements
 */
export const takeBut =
	(n: number) =>
	<A>(self: Chunk.Chunk<A>): Chunk.Chunk<A> =>
		Chunk.take(self, Chunk.size(self) - n);

/**
 * Takes all elements of self except the n first elements
 */
export const takeRightBut =
	(n: number) =>
	<A>(self: Chunk.Chunk<A>): Chunk.Chunk<A> =>
		Chunk.takeRight(self, Chunk.size(self) - n);
