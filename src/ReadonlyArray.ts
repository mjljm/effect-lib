import * as MCause from '#src/Cause';
import * as MEither from '#src/Either';
import * as MFunction from '#src/Function';
import { Cause, Either, Equal, Option, Predicate, ReadonlyArray, ReadonlyRecord, Tuple, pipe } from 'effect';

//const moduleTag = '@mjljm/effect-lib/ReadonlyArray/';

/**
 * Returns true if the provided ReadonlyArray contains duplicates using the provided isEquivalent function
 * @category utils
 * @since 1.0.0
 */
export const hasDuplicatesWith =
	<A>(isEquivalent: (self: NoInfer<A>, that: NoInfer<A>) => boolean) =>
	(self: ReadonlyArray<A>): boolean =>
		pipe(self, ReadonlyArray.dedupeWith(isEquivalent), ReadonlyArray.length, MFunction.strictEquals(self.length));

/**
 * Returns true if the provided ReadonlyArray contains duplicates
 * @category utils
 * @since 1.0.0
 */
export const hasDuplicates = hasDuplicatesWith(Equal.equivalence());

/**
 * Looks for the elements that fulfill the predicate. Returns left(`NoSuchElementException`) in case no element is found, left(`TooManyElementsException`) in case more than one element is found, otherwise returns a right of the only matching element.
 *
 * @category getters
 */
export const findSingleton: {
	<B extends A, A>(
		refinement: (a: NoInfer<A>, i: number) => a is B
	): (self: Iterable<A>) => Either.Either<B, MCause.TooManyElementsException<A> | Cause.NoSuchElementException>;
	<A>(
		predicate: (a: NoInfer<A>, i: number) => boolean
	): (self: Iterable<A>) => Either.Either<A, MCause.TooManyElementsException<A> | Cause.NoSuchElementException>;
} =
	<A>(predicate: (a: NoInfer<A>, i: number) => boolean) =>
	(self: Iterable<A>): Either.Either<A, MCause.TooManyElementsException<A> | Cause.NoSuchElementException> =>
		pipe(self, ReadonlyArray.filter(predicate), MEither.fromArray);

/**
 * Returns an array of the indexes of all elements of self matching the predicate
 *
 * @since 1.0.0
 */

export const findAll =
	<A>(predicate: Predicate.Predicate<NoInfer<A>>) =>
	(self: Iterable<A>): Array<number> =>
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
 * Flattens an array of arrays of A's adding an index that will allow to reverse this operation with fromIndexedFlattened
 */
export const ungroup = <A>(as: ReadonlyArray<ReadonlyArray<A>>): ReadonlyArray<[number, A]> =>
	pipe(
		as,
		ReadonlyArray.map((as, i) => ReadonlyArray.map(as, (a) => Tuple.make(i, a))),
		ReadonlyArray.flatten
	);

/**
 * Opposite operation of ungroup. Same as ReadonlyArray.groupBy but uses a number key. If fKey returns a negative index or an index superior or equal to size, the corresponding value is ignored
 */
export const groupByNum =
	<A, B>({
		size,
		fKey,
		fValue
	}: {
		size: number;
		fKey: (a: NoInfer<A>) => number;
		fValue: (a: NoInfer<A>) => B;
	}) =>
	(self: ReadonlyArray<A>): ReadonlyArray<ReadonlyArray<B>> => {
		const out = ReadonlyArray.makeBy(size, () => ReadonlyArray.empty<B>());
		for (let i = 0; i < self.length; i++) {
			const a = self[i] as A;
			const key = fKey(a);
			if (key >= 0 && key < size) (out[key] as Array<B>).push(fValue(a));
		}
		return out;
	};

/**
 * Same as ReadonlyArray.groupBy but with a value projection function
 */
export const groupBy =
	<A, B>({ fKey, fValue }: { fKey: (a: NoInfer<A>) => string; fValue: (a: NoInfer<A>) => B }) =>
	(self: Iterable<A>): Record<string, ReadonlyArray.NonEmptyArray<B>> =>
		pipe(self, ReadonlyArray.groupBy(fKey), ReadonlyRecord.map(ReadonlyArray.map(fValue)));

/**
 * Same as ReadonlyArray.groupBy but stores the results in a map instead of an object which allows to use keys others than strings.
 */
/*export const groupByInMap =
	<A, B, C>(fKey: (a: A) => C, fValue: (a: A) => B) =>
	(self: ReadonlyArray<A>): HashMap.HashMap<C, ReadonlyArray.NonEmptyArray<B>> => {
		return HashMap.mutate(HashMap.empty<C, ReadonlyArray.NonEmptyArray<B>>(), (map) => {
			for (const a of self) {
				const c = fKey(a);
				const b = fValue(a);
				HashMap.modifyAt(map, c, (o) =>
					pipe(
						o,
						Option.map((v) => {
							v.push(b);
							return v;
						}),
						Option.orElse(() => Option.some(ReadonlyArray.make(b)))
					)
				);
			}
		});
	};*/

/**
 * Unsafe get an element from an array. No bounds check, Faster than the Readonly version
 */
export const unsafeGet =
	(index: number) =>
	<A>(self: ReadonlyArray<A>): A =>
		// @ts-expect-error getting array content unsafely
		self[index];
