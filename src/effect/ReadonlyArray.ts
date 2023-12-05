import {
	Either,
	Function,
	Option,
	Predicate,
	ReadonlyArray,
	Tuple,
	pipe
} from 'effect';

/**
 * Returns true if the provided ReadonlyArray contains duplicates
 * @category utils
 * @since 1.0.0
 */
export const hasDuplicates = <A>(self: ReadonlyArray<A>): boolean =>
	pipe(self, ReadonlyArray.dedupe, (as) =>
		as.length === self.length ? false : true
	);

/**
 * Returns true if the provided ReadonlyArray contains duplicates using the provided isEquivalent function
 * @category utils
 * @since 1.0.0
 */
export const hasDuplicatesWith: {
	<A>(
		isEquivalent: (self: A, that: A) => boolean
	): (self: ReadonlyArray<A>) => boolean;
	<A>(
		self: ReadonlyArray<A>,
		isEquivalent: (self: A, that: A) => boolean
	): boolean;
} = Function.dual(
	2,
	<A>(self: ReadonlyArray<A>, isEquivalent: (self: A, that: A) => boolean) =>
		pipe(self, ReadonlyArray.dedupeWith(isEquivalent), (as) =>
			as.length === self.length ? false : true
		)
);

/**
 * Returns none if self contains zero or more than one element. Returns a some of the only element of the array otherwise.
 *
 * @category getters
 * */
export const getSingleton = <A>(self: ReadonlyArray<A>): Option.Option<A> =>
	self.length > 1 ? Option.none() : ReadonlyArray.get(self, 0);

/**
 * Returns a left of error if self contains more than one element. Returns a right of a none if self contains no element and a right of a some of the only element otherwise
 *
 * @category getters
 * */
export const getSingletonOrElse: {
	<B>(
		error: Function.LazyArg<B>
	): <A>(self: ReadonlyArray<A>) => Either.Either<B, Option.Option<A>>;
	<A, B>(
		self: ReadonlyArray<A>,
		error: Function.LazyArg<B>
	): Either.Either<B, Option.Option<A>>;
} = Function.dual(
	2,
	<A, B>(
		self: ReadonlyArray<A>,
		error: Function.LazyArg<B>
	): Either.Either<B, Option.Option<A>> =>
		self.length > 1
			? Either.left(error())
			: Either.right(ReadonlyArray.get(self, 0))
);

/**
 * Looks for the elements that fulfill the predicate. Returns `none` in case no element or more than
 * one element is found. Otherwise returns the only matching element.
 *
 * @category getters
 */
export const findSingleton = Function.dual<
	{
		<A, B extends A>(
			refinement: (a: A, i: number) => a is B
		): (self: Iterable<A>) => Option.Option<B>;
		<A>(
			predicate: (a: A, i: number) => boolean
		): (self: ReadonlyArray<A>) => Option.Option<A>;
	},
	{
		<A, B extends A>(
			self: Iterable<A>,
			refinement: (a: A, i: number) => a is B
		): Option.Option<B>;
		<A>(
			self: ReadonlyArray<A>,
			predicate: (a: A, i: number) => boolean
		): Option.Option<A>;
	}
>(
	2,
	<A>(
		self: Iterable<A>,
		predicate: (a: A, i: number) => boolean
	): Option.Option<A> =>
		pipe(self, ReadonlyArray.filter(predicate), getSingleton)
);

/**
 * Split an array A in two arrays [B,c], B containing all the elements at even indexes, C all elements at odd indexes
 */
export const splitOddEvenIndexes = <A>(
	self: ReadonlyArray<A>
): [Array<A>, Array<A>] =>
	ReadonlyArray.reduce(
		self,
		Tuple.make(ReadonlyArray.empty<A>(), ReadonlyArray.empty<A>()),
		([even, odd], a) =>
			even.length <= odd.length
				? Tuple.make(ReadonlyArray.append(even, a), odd)
				: Tuple.make(even, ReadonlyArray.append(odd, a))
	);

/**
 * Returns an array of the indexes of all elements of self matching the predicate
 *
 * @since 1.0.0
 */
export const findAll: {
	<B extends A, A = B>(
		predicate: Predicate.Predicate<A>
	): (self: Iterable<B>) => ReadonlyArray<number>;
	<B extends A, A = B>(
		self: Iterable<B>,
		predicate: Predicate.Predicate<A>
	): ReadonlyArray<number>;
} = Function.dual(
	2,
	<B extends A, A = B>(
		self: Iterable<B>,
		predicate: Predicate.Predicate<A>
	): ReadonlyArray<number> =>
		ReadonlyArray.reduce(self, ReadonlyArray.empty<number>(), (acc, a, i) =>
			predicate(a) ? ReadonlyArray.append(acc, i) : acc
		)
);

/**
 * Returns the provided `ReadonlyArray` `that` if `self` is empty, otherwise returns `self`.
 *
 * @category error handling
 */
export const orElse: {
	<B>(
		that: Function.LazyArg<ReadonlyArray<B>>
	): <A>(self: ReadonlyArray<A>) => ReadonlyArray<B | A>;
	<A, B>(
		self: ReadonlyArray<A>,
		that: Function.LazyArg<ReadonlyArray<B>>
	): ReadonlyArray<A | B>;
} = Function.dual(
	2,
	<A, B>(
		self: ReadonlyArray<A>,
		that: Function.LazyArg<ReadonlyArray<B>>
	): ReadonlyArray<A | B> =>
		ReadonlyArray.isEmptyReadonlyArray(self) ? that() : self
);
