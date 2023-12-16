import { EqValue, MFunction } from '#mjljm/effect-lib/index';
import { Monoid } from '@effect/typeclass';
import {
	Chunk,
	Data,
	Either,
	Equal,
	Equivalence,
	Function,
	Hash,
	HashSet,
	pipe
} from 'effect';

//const moduleTag = '@mjljm/effect-lib/mydata/Tree/';

/**
 * @category model
 */
export type Forest<A> = Chunk.Chunk<Tree<A>>;

/**
 * @category model
 */
export interface Tree<out A> {
	readonly value: A;
	readonly forest: Forest<A>;
}

/**
 * @category constructor
 */
const Tree = <A>(fa: Tree<A>) => MFunction.makeReadonly<Tree<A>>(fa);

/**
 * Build a (possibly infinite) tree from a seed value.
 *
 * @category constructors
 */
export const UnfoldTree = <A, B>(
	seed: B,
	f: (seed: B) => [nextValue: A, nextSeeds: Chunk.Chunk<B>]
): Tree<A> =>
	pipe(f(seed), ([nextValue, nextSeeds]) => ({
		value: nextValue,
		forest: UnfoldForest(nextSeeds, f)
	}));

/**
 * Build a (possibly infinite) forest from a list of seed values.
 *
 * @category constructors
 */
export function UnfoldForest<A, B>(
	seeds: Chunk.Chunk<B>,
	f: (seed: B) => [nextValue: A, nextSeeds: Chunk.Chunk<B>]
): Forest<A> {
	return Chunk.map(seeds, (seed) => UnfoldTree(seed, f));
}

/**
 * Build a (possibly infinite) tree from a seed value. The function detects circularity and reports it in the f function parameter. Results are cached in case the same node is met more than once
 *
 * @category constructors
 */
export const unfoldEither = <E, A, B>(
	seed: B,
	f: (
		nextSeed: B,
		isCircular: boolean
	) => Either.Either<E, [nextValue: A, nextSeeds: Chunk.Chunk<B>]>,
	memoize = false,
	Eq?: Equivalence.Equivalence<B> | undefined
): Either.Either<E, Tree<A>> => {
	class UnfoldTreeParams extends Data.Class<{
		readonly seed: B;
		readonly parents: HashSet.HashSet<EqValue.EqValue<B>>;
		readonly memoize?: boolean | undefined;
	}> {
		[Equal.symbol] = (that: Equal.Equal): boolean =>
			that instanceof UnfoldTreeParams
				? Equal.equals(this.seed, that.seed)
				: false;
		[Hash.symbol] = (): number => Hash.hash(this.seed);
	}
	const UnfoldTreeParamsEq = Eq
		? Equivalence.make((self: UnfoldTreeParams, that: UnfoldTreeParams) =>
				Eq(self.seed, that.seed)
		  )
		: undefined;
	const internalUnfoldTree = ({
		memoize = false,
		parents,
		seed
	}: UnfoldTreeParams): Either.Either<E, Tree<A>> =>
		pipe(
			f(seed, HashSet.has(parents, new EqValue.EqValue({ value: seed, Eq }))),
			Either.flatMap(([nextValue, nextSeeds]) =>
				Either.all({
					value: Either.right(nextValue),
					forest: pipe(
						Chunk.map(nextSeeds, (nextSeed) =>
							pipe(
								new UnfoldTreeParams({
									seed: nextSeed,
									parents: HashSet.add(
										parents,
										new EqValue.EqValue({ value: seed, Eq })
									),
									memoize
								}),
								(params) =>
									memoize
										? cachedUnfoldTree(params)
										: internalUnfoldTree(params)
							)
						),
						Either.all,
						Either.map(Chunk.unsafeFromArray)
					)
				})
			)
		);

	const cachedUnfoldTree = MFunction.memoize(
		internalUnfoldTree,
		UnfoldTreeParamsEq
	);

	return internalUnfoldTree(
		new UnfoldTreeParams({ seed, parents: HashSet.empty(), memoize })
	);
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
export const fold: {
	<A, B>(
		f: (a: A, bs: Chunk.Chunk<B>, level: number) => B
	): (self: Tree<A>) => B;
	<A, B>(self: Tree<A>, f: (a: A, bs: Chunk.Chunk<B>, level: number) => B): B;
} = Function.dual(
	2,
	<A, B>(
		self: Tree<A>,
		f: (a: A, bs: Chunk.Chunk<B>, level: number) => B
	): B => {
		const go =
			(level: number) =>
			(fa: Tree<A>): B =>
				f(fa.value, Chunk.map(fa.forest, go(level + 1)), level);
		return go(0)(self);
	}
);

/**
 * @category sequencing
 */
export const flatMap: {
	<A, B>(f: (a: A, level: number) => Tree<B>): (self: Tree<A>) => Tree<B>;
	<A, B>(self: Tree<A>, f: (a: A, level: number) => Tree<B>): Tree<B>;
} = Function.dual(
	2,
	<A, B>(self: Tree<A>, f: (a: A, level: number) => Tree<B>): Tree<B> => {
		const go =
			(level: number) =>
			(self: Tree<A>): Tree<B> => {
				const { forest, value } = f(self.value, level);

				return {
					value,
					forest: Chunk.appendAll(forest, Chunk.map(self.forest, go(level + 1)))
				};
			};
		return go(0)(self);
	}
);

/**
 * Returns a new tree in which the value of each node is replaced by the result of a function that takes the node as parameter in top-down order. More powerful than map which takes only the value of the node as parameter
 */
export const extendDown: {
	<A, B>(f: (fa: Tree<A>, level: number) => B): (self: Tree<A>) => Tree<B>;
	<A, B>(self: Tree<A>, f: (fa: Tree<A>, level: number) => B): Tree<B>;
} = Function.dual(
	2,
	<A, B>(self: Tree<A>, f: (fa: Tree<A>, level: number) => B): Tree<B> => {
		const go =
			(level: number) =>
			(self: Tree<A>): Tree<B> => ({
				value: f(self, level),
				forest: Chunk.map(self.forest, go(level + 1))
			});
		return go(0)(self);
	}
);

/**
 * Returns a new tree in which the value of each node is replaced by the result of a function that takes the node as parameter in bottom-up order. More powerful than map which takes only the value of the node as parameter
 */
export const extendUp: {
	<A, B>(f: (fa: Tree<A>, level: number) => B): (self: Tree<A>) => Tree<B>;
	<A, B>(self: Tree<A>, f: (fa: Tree<A>, level: number) => B): Tree<B>;
} = Function.dual(
	2,
	<A, B>(self: Tree<A>, f: (fa: Tree<A>, level: number) => B): Tree<B> => {
		const go =
			(level: number) =>
			(self: Tree<A>): Tree<B> => ({
				forest: Chunk.map(self.forest, go(level + 1)),
				value: f(self, level)
			});
		return go(0)(self);
	}
);

/**
 */
export const duplicate: <A>(self: Tree<A>) => Tree<Tree<A>> = extendDown(
	Function.identity
);

/**
 * @category sequencing
 */
export const flatten: <A>(self: Tree<Tree<A>>) => Tree<A> = flatMap(
	Function.identity
);

/**
 *
 * @category mapping
 */
export const map: {
	<A, B>(f: (a: A, level: number) => B): (self: Tree<A>) => Tree<B>;
	<A, B>(self: Tree<A>, f: (a: A, level: number) => B): Tree<B>;
} = Function.dual(
	2,
	<A, B>(self: Tree<A>, f: (a: A, level: number) => B): Tree<B> => {
		const go =
			(level: number) =>
			(self: Tree<A>): Tree<B> => ({
				value: f(self.value, level),
				forest: Chunk.map(self.forest, go(level + 1))
			});
		return go(0)(self);
	}
);

/**
 * Top-down reduction - Children are processed from left to right
 * @category folding
 */
export const reduce: {
	<A, B>(b: B, f: (b: B, a: A, level: number) => B): (self: Tree<A>) => B;
	<A, B>(self: Tree<A>, b: B, f: (b: B, a: A, level: number) => B): B;
} = Function.dual(
	3,
	<A, B>(self: Tree<A>, b: B, f: (b: B, a: A, level: number) => B): B => {
		const go =
			(b: B, level: number) =>
			(self: Tree<A>): B => {
				let r: B = f(b, self.value, level);
				const len = self.forest.length;
				for (let i = 0; i < len; i++) {
					r = pipe(self.forest, Chunk.unsafeGet(i), go(r, level + 1));
				}
				return r;
			};
		return go(b, 0)(self);
	}
);

/**
 * Reduce using a monoid to perform the concatenation
 * @category folding
 */
export const foldMap: {
	<B, A>(
		M: Monoid.Monoid<B>,
		f: (a: A, level: number) => B
	): (self: Tree<A>) => B;
	<B, A>(self: Tree<A>, M: Monoid.Monoid<B>, f: (a: A, level: number) => B): B;
} = Function.dual(
	3,
	<B, A>(
		self: Tree<A>,
		M: Monoid.Monoid<B>,
		f: (a: A, level: number) => B
	): B => reduce(self, M.empty, (acc, a, level) => M.combine(acc, f(a, level)))
);

/**
 * Top-down reduction - Children are processed from right to left
 * @category folding
 */
export const reduceRight: {
	<A, B>(b: B, f: (b: B, a: A, level: number) => B): (self: Tree<A>) => B;
	<A, B>(self: Tree<A>, b: B, f: (b: B, a: A, level: number) => B): B;
} = Function.dual(
	3,
	<A, B>(self: Tree<A>, b: B, f: (b: B, a: A, level: number) => B): B => {
		const go =
			(b: B, level: number) =>
			(self: Tree<A>): B => {
				let r: B = f(b, self.value, level);
				const len = self.forest.length;
				for (let i = len - 1; i >= 0; i--) {
					r = pipe(self.forest, Chunk.unsafeGet(i), go(r, level + 1));
				}
				return r;
			};
		return go(b, 0)(self);
	}
);
