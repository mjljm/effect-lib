import { MFunction } from '#mjljm/effect-lib/index';
import { Monoid } from '@effect/typeclass';
import { Equal, Equivalence, Function, HashSet, ReadonlyArray, pipe } from 'effect';
import { NoInfer } from 'effect/Types';

//const moduleTag = '@mjljm/effect-lib/mydata/Tree/';

/**
 * @category model
 */
export type Forest<A> = ReadonlyArray<Tree<A>>;

/**
 * @category model
 */
export interface Tree<out A> {
	readonly value: A;
	readonly forest: Forest<A>;
}

/**
 * Utility types
 */

export type Infer<T extends Tree<unknown>> = T extends Tree<infer A> ? A : never;

/**
 * @category constructor
 */
const Tree = <A>(fa: Tree<A>) => MFunction.make<Tree<A>>(fa);

/**
 * Build a (possibly infinite) tree from a seed value.
 *
 * @category constructors
 */
export const unfoldTree = <B, A>(seed: B, f: (seed: B) => [nextValue: A, nextSeeds: ReadonlyArray<B>]): Tree<A> =>
	pipe(f(seed), ([nextValue, nextSeeds]) => ({
		value: nextValue,
		forest: unfoldForest(nextSeeds, f)
	}));

/**
 * Build a (possibly infinite) forest from a list of seed values.
 *
 * @category constructors
 */
export function unfoldForest<B, A>(
	seeds: ReadonlyArray<B>,
	f: (seed: B) => [nextValue: A, nextSeeds: ReadonlyArray<B>]
): Forest<A> {
	return ReadonlyArray.map(seeds, (seed) => unfoldTree(seed, f));
}

/**
 * Build a (possibly infinite) tree from a seed value. Can use a cache and handles circularity
 *
 * @category constructors
 */
export const unfold = <B, A>({
	memoize,
	seed,
	unfoldfunction
}: {
	readonly unfoldfunction: (seed: B, isCircular: boolean) => [nextValue: A, nextSeeds: ReadonlyArray<B>];
	readonly memoize: boolean;
	readonly seed: B;
}): Tree<A> => {
	const internalUnfold = ({
		currentSeed,
		parents
	}: {
		readonly currentSeed: B;
		readonly parents: HashSet.HashSet<B>;
	}): Tree<A> =>
		pipe(
			unfoldfunction(
				/*console.log(
					`key: ${currentSeed.key.value} parents: ${pipe(
						HashSet.values(parents),
						ReadonlyArray.fromIterable,
						ReadonlyArray.map((s) => JSON.stringify(s.value)),
						ReadonlyArray.join(';')
					)} circ:${HashSet.has(parents, currentSeed)}`
				),*/
				currentSeed,
				HashSet.has(parents, currentSeed)
			),
			([nextValue, nextSeeds]) => ({
				value: nextValue,
				forest: ReadonlyArray.map(nextSeeds, (seed) =>
					cachedInternalUnfold({ currentSeed: seed, parents: HashSet.add(parents, currentSeed) })
				)
			})
		);

	// The cache is destroyed with this object. So its is necessarily cleaned on function exit even if it throws
	const cachedInternalUnfold = memoize
		? MFunction.memoize(
				internalUnfold,
				Equivalence.make((self, that) => Equal.equals(self.currentSeed, that.currentSeed))
			)
		: internalUnfold;

	return cachedInternalUnfold({ currentSeed: seed, parents: HashSet.empty<B>() });
};

/**
 * Fold a tree into a "summary" value in bottom-up order.
 *
 * For each node in the tree, apply `f` to the `value` and the result of applying `f` to each `forest`.
 *
 * This is also known as the catamorphism on trees.
 *
 * @example
 * import { fold, make } from 'fp-ts/Tree'
 * import { concatAll } from 'fp-ts/Monoid'
 * import { MonoidSum } from 'fp-ts/number'
 *
 * const t = make(1, [make(2), make(3)])
 *
 * const sum = concatAll(MonoidSum)
 *
 * // Sum the values in a tree:
 * assert.deepStrictEqual(fold((a: number, bs: Array<number>) => a + sum(bs))(t), 6)
 *
 * // Find the maximum value in the tree:
 * assert.deepStrictEqual(fold((a: number, bs: Array<number>) => bs.reduce((b, acc) => Math.max(b, acc), a))(t), 3)
 *
 * // Count the number of leaves in the tree:
 * assert.deepStrictEqual(fold((_: number, bs: Array<number>) => (bs.length === 0 ? 1 : sum(bs)))(t), 2)
 *
 * @category folding
 */
export const fold =
	<B, A>(f: (a: NoInfer<A>, bs: ReadonlyArray<B>, level: number) => B) =>
	(self: Tree<A>): B => {
		const go =
			(level: number) =>
			(fa: Tree<A>): B =>
				f(fa.value, ReadonlyArray.map(fa.forest, go(level + 1)), level);
		return go(0)(self);
	};

/**
 * @category sequencing
 */
export const flatMap =
	<B, A>(f: (a: NoInfer<A>, level: number) => Tree<B>) =>
	(self: Tree<A>): Tree<B> => {
		const go =
			(level: number) =>
			(self: Tree<A>): Tree<B> => {
				const { forest, value } = f(self.value, level);

				return {
					value,
					forest: ReadonlyArray.appendAll(forest, ReadonlyArray.map(self.forest, go(level + 1)))
				};
			};
		return go(0)(self);
	};

/**
 * Returns a new tree in which the value of each node is replaced by the result of a function that takes the node as parameter in top-down order. More powerful than map which takes only the value of the node as parameter
 */
export const extendDown =
	<B, A>(f: (fa: Tree<NoInfer<A>>, level: number) => B) =>
	(self: Tree<A>): Tree<B> => {
		const go =
			(level: number) =>
			(self: Tree<A>): Tree<B> => ({
				value: f(self, level),
				forest: ReadonlyArray.map(self.forest, go(level + 1))
			});
		return go(0)(self);
	};

/**
 * Returns a new tree in which the value of each node is replaced by the result of a function that takes the node as parameter in bottom-up order. More powerful than map which takes only the value of the node as parameter
 */
export const extendUp =
	<B, A>(f: (fa: Tree<NoInfer<A>>, level: number) => B) =>
	(self: Tree<A>): Tree<B> => {
		const go =
			(level: number) =>
			(self: Tree<A>): Tree<B> => ({
				forest: ReadonlyArray.map(self.forest, go(level + 1)),
				value: f(self, level)
			});
		return go(0)(self);
	};

/**
 */
export const duplicate: <A>(self: Tree<A>) => Tree<Tree<A>> = extendDown(Function.identity);

/**
 * @category sequencing
 */
export const flatten: <A>(self: Tree<Tree<A>>) => Tree<A> = flatMap(Function.identity);

/**
 *
 * @category mapping
 */
export const map =
	<B, A>(f: (a: NoInfer<A>, level: number) => B) =>
	(self: Tree<A>): Tree<B> => {
		const go =
			(level: number) =>
			(self: Tree<A>): Tree<B> => ({
				value: f(self.value, level),
				forest: ReadonlyArray.map(self.forest, go(level + 1))
			});
		return go(0)(self);
	};

/**
 * Top-down reduction - Children are processed from left to right
 * @category folding
 */
export const reduce =
	<B, A>(b: B, f: (b: B, a: NoInfer<A>, level: number) => B) =>
	(self: Tree<A>): B => {
		const go =
			(b: B, level: number) =>
			(self: Tree<A>): B => {
				let r: B = f(b, self.value, level);
				const len = self.forest.length;
				for (let i = 0; i < len; i++) {
					r = pipe(self.forest, ReadonlyArray.unsafeGet(i), go(r, level + 1));
				}
				return r;
			};
		return go(b, 0)(self);
	};

/**
 * Reduce using a monoid to perform the concatenation
 * @category folding
 */
export const foldMap =
	<B, A>(M: Monoid.Monoid<B>, f: (a: NoInfer<A>, level: number) => B) =>
	(self: Tree<A>): B =>
		pipe(
			self,
			reduce(M.empty, (acc, a, level) => M.combine(acc, f(a, level)))
		);

/**
 * Top-down reduction - Children are processed from right to left
 * @category folding
 */
export const reduceRight =
	<B, A>(b: B, f: (b: B, a: NoInfer<A>, level: number) => B) =>
	(self: Tree<A>): B => {
		const go =
			(b: B, level: number) =>
			(self: Tree<A>): B => {
				let r: B = f(b, self.value, level);
				const len = self.forest.length;
				for (let i = len - 1; i >= 0; i--) {
					r = pipe(self.forest, ReadonlyArray.unsafeGet(i), go(r, level + 1));
				}
				return r;
			};
		return go(b, 0)(self);
	};
