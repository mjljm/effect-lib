import { MNumber } from '#mjljm/effect-lib/index';
import {
	Either,
	Equal,
	Function,
	HashMap,
	Number,
	Option,
	Predicate,
	ReadonlyArray,
	ReadonlyRecord,
	Tuple,
	flow,
	pipe
} from 'effect';

/**
 * Returns true if the provided ReadonlyArray contains duplicates using the provided isEquivalent function
 * @category utils
 * @since 1.0.0
 */
export const hasDuplicatesWith =
	<A>(isEquivalent: (self: NoInfer<A>, that: NoInfer<A>) => boolean) =>
	(self: ReadonlyArray<A>): boolean =>
		pipe(self, ReadonlyArray.dedupeWith(isEquivalent), ReadonlyArray.length, MNumber.equals(self.length));

/**
 * Returns true if the provided ReadonlyArray contains duplicates
 * @category utils
 * @since 1.0.0
 */
export const hasDuplicates = hasDuplicatesWith(Equal.equivalence());

/**
 * Returns none if self contains zero or more than one element. Returns a some of the only element of the array otherwise.
 *
 * @category getters
 * */
export const getSingleton: <A>(self: ReadonlyArray<A>) => Option.Option<A> = flow(
	Option.liftPredicate(flow(ReadonlyArray.length, Number.lessThanOrEqualTo(1))),
	Option.flatMap(ReadonlyArray.get(0))
);

/**
 * Returns a left of error if self contains more than one element. Returns a right of a none if self contains no element and a right of a some of the only element otherwise
 *
 * @category getters
 * */
export const getSingletonOrFailsWith =
	<B>(error: Function.LazyArg<B>) =>
	<A>(self: ReadonlyArray<A>): Either.Either<Option.Option<A>, B> =>
		pipe(
			self,
			Option.liftPredicate(flow(ReadonlyArray.length, Number.lessThanOrEqualTo(1))),
			Either.fromOption(error),
			Either.map(ReadonlyArray.get(0))
		);

/**
 * Looks for the elements that fulfill the predicate. Returns `none` in case no element or more than
 * one element is found. Otherwise returns the only matching element.
 *
 * @category getters
 */
export const findSingleton: {
	<B extends A, A>(refinement: (a: NoInfer<A>, i: number) => a is B): (self: Iterable<A>) => Option.Option<B>;
	<A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Iterable<A>) => Option.Option<A>;
} =
	<A>(predicate: (a: NoInfer<A>, i: number) => boolean) =>
	(self: Iterable<A>): Option.Option<A> =>
		pipe(self, ReadonlyArray.filter(predicate), getSingleton);

/**
 * Returns an array of the indexes of all elements of self matching the predicate
 *
 * @since 1.0.0
 */
ReadonlyArray.filter;
export const findAll =
	<B extends A, A = B>(predicate: Predicate.Predicate<A>) =>
	(self: Iterable<B>): Array<number> =>
		ReadonlyArray.filterMap(self, (b, i) =>
			pipe(
				i,
				Option.liftPredicate(() => predicate(b))
			)
		);

/**
 * Takes all elements of self except the n last elements
 */
export const takeBut =
	(n: number) =>
	<A>(self: ReadonlyArray<A>): Array<A> =>
		ReadonlyArray.take(self, self.length - n);

/**
 * Takes all elements of self except the n first elements
 */
export const takeRightBut =
	(n: number) =>
	<A>(self: ReadonlyArray<A>): Array<A> =>
		ReadonlyArray.takeRight(self, self.length - n);

/**
 * This function provides a safe way to read a value at a particular index from the end of a `ReadonlyArray`.
 */
export const getFromEnd =
	(index: number) =>
	<A>(self: ReadonlyArray<A>): Option.Option<A> =>
		ReadonlyArray.get(self, self.length - 1 - index);

/**
 * This function extracts the longest sub-array common to self and that starting at index 0
 */
export const longestCommonSubArray =
	<A>(that: Iterable<A>) =>
	(self: Iterable<A>): Array<A> =>
		pipe(
			self,
			ReadonlyArray.zip(that),
			ReadonlyArray.takeWhile(([a1, a2]) => Equal.equals(a1, a2)),
			ReadonlyArray.map(Tuple.getFirst)
		);

/**
 * Extracts from an array the first item that matches the predicate. Returns the extracted item and the remaining items.
 */
export const extractFirst: {
	<A, B extends A>(
		refinement: (a: NoInfer<A>, i: number) => a is B
	): (self: ReadonlyArray<A>) => [match: Option.Option<B>, remaining: Array<A>];
	<A>(
		predicate: (a: NoInfer<A>, i: number) => boolean
	): (self: ReadonlyArray<A>) => [match: Option.Option<A>, remaining: Array<A>];
} =
	<A>(predicate: (a: NoInfer<A>, i: number) => boolean) =>
	(self: ReadonlyArray<A>): [match: Option.Option<A>, remaining: Array<A>] =>
		pipe(self, ReadonlyArray.splitWhere(predicate), ([beforeMatch, fromMatch]) =>
			ReadonlyArray.matchLeft(fromMatch, {
				onEmpty: () => Tuple.make(Option.none(), beforeMatch),
				onNonEmpty: (head, tail) => Tuple.make(Option.some(head), ReadonlyArray.appendAll(beforeMatch, tail))
			})
		);

/**
 * Unsafe get an element from an array. No bounds check, Faster than the Readonly version
 */
export const unsafeGet =
	(index: number) =>
	<A>(self: ReadonlyArray<A>): A =>
		// @ts-expect-error getting array content unsafely
		self[index];

/**
 * Runs a validation function f on an array of A's. Returns a right of the array if all elements of the array pass the validation. Returns a left of the array of the elements that don't pass the validation otherwise
 */
export const validateAll =
	<E, A, B>(f: (a: A, i: number) => Either.Either<E, B>) =>
	(self: ReadonlyArray<A>): Either.Either<Array<E>, Array<B>> =>
		pipe(
			self,
			ReadonlyArray.partitionMap((a, i) => f(a, i)),
			([lefts, rights]) =>
				ReadonlyArray.match(lefts, { onEmpty: () => Either.right(rights), onNonEmpty: () => Either.left(lefts) })
		);

/**
 * Same as ReadonlyArray.groupBy but with a value projection function
 */
export const groupBy =
	<A, B>(fKey: (a: A) => string, fValue: (a: A) => B) =>
	(self: Iterable<A>): Record<string, ReadonlyArray.NonEmptyArray<B>> =>
		pipe(self, ReadonlyArray.groupBy(fKey), ReadonlyRecord.map(ReadonlyArray.map(fValue)));

/**
 * Same as ReadonlyArray.groupBy but stores the results in a map instead of an object which allows to use keys others than strings.
 */
export const groupByInMapWith =
	<A, B, C>(
		fKey: (a: A) => C,
		fValue: (a: A) => B,
		isEquivalent: (self: NoInfer<C>, that: NoInfer<C>) => boolean
	) =>
	(self: ReadonlyArray<A>): HashMap.HashMap<C, ReadonlyArray.NonEmptyArray<B>> =>
		ReadonlyArray.match(self, {
			onEmpty: () => HashMap.empty(),
			onNonEmpty: flow(
				ReadonlyArray.map((a) => Tuple.make(fKey(a), fValue(a))),
				ReadonlyArray.groupWith(([selfC], [thatC]) => isEquivalent(selfC, thatC)),
				ReadonlyArray.map((group) =>
					Tuple.make(
						pipe(group, ReadonlyArray.headNonEmpty, Tuple.getFirst),
						pipe(group, ReadonlyArray.map(Tuple.getSecond))
					)
				),
				HashMap.fromIterable
			)
		});

/**
 * Same as groupInMap with but uses the equal equivalence
 */
export const groupByInMap = <A, B, C>(fKey: (a: A) => C, fValue: (a: A) => B) =>
	groupByInMapWith(fKey, fValue, Equal.equivalence());
