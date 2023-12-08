import { MFunction } from '#mjljm/effect-lib/index';
import { Monoid } from '@effect/typeclass';
import {
	Chunk,
	Data,
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
 * Build a (possibly infinite) tree from a seed value in breadth-first order.
 *
 * @category constructors
 */
export const unsafeUnfoldTree = <A, B>(
	seed: B,
	f: (b: B) => [treeValue: A, nextSeeds: Chunk.Chunk<B>]
): Tree<A> =>
	pipe(f(seed), ([a, bs]) => ({
		value: a,
		forest: unsafeUnfoldForest(bs, f)
	}));

/**
 * Build a (possibly infinite) forest from a list of seed values in breadth-first order.
 *
 * @category constructors
 */
export function unsafeUnfoldForest<A, B>(
	seeds: Chunk.Chunk<B>,
	f: (b: B) => [treeValue: A, nextSeeds: Chunk.Chunk<B>]
): Forest<A> {
	return Chunk.map(seeds, (b) => unsafeUnfoldTree(b, f));
}

/**
 * Build a (possibly infinite) tree from a seed value in breadth-first order. The function detects circularity and reports it in the f function parameter. Results are cached in case the same node is met more than once
 *
 * @category constructors
 */
export const unfoldTree = <A, B>(
	seed: B,
	f: (b: B, isCircular: boolean) => [treeValue: A, nextSeeds: Chunk.Chunk<B>],
	memoize: boolean,
	Eq?: Equivalence.Equivalence<B> | undefined
): Tree<A> => {
	class UnfoldTreeParams extends Data.Class<{
		readonly seed: B;
		readonly parents: HashSet.HashSet<B>;
		readonly memoize: boolean;
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

	function internalUnfoldTree({
		seed,
		parents,
		memoize
	}: UnfoldTreeParams): Tree<A> {
		const [a, bs] = f(seed, HashSet.has(parents, seed));

		return {
			value: a,
			forest: Chunk.map(bs, (b) =>
				pipe(
					new UnfoldTreeParams({
						seed: b,
						parents: HashSet.add(parents, seed),
						memoize
					}),
					(p) => (memoize ? cachedUnfoldTree(p) : internalUnfoldTree(p))
				)
			)
		};
	}
	const cachedUnfoldTree = MFunction.memoize(
		internalUnfoldTree,
		UnfoldTreeParamsEq
	);

	return internalUnfoldTree(
		new UnfoldTreeParams({ seed, parents: HashSet.empty(), memoize })
	);
};

/**
 * Fold a tree into a "summary" value in depth-first order.
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
	<A, B>(f: (a: A, bs: Chunk.Chunk<B>) => B): (self: Tree<A>) => B;
	<A, B>(self: Tree<A>, f: (a: A, bs: Chunk.Chunk<B>) => B): B;
} = Function.dual(
	2,
	<A, B>(self: Tree<A>, f: (a: A, bs: Chunk.Chunk<B>) => B): B => {
		const go = (fa: Tree<A>): B => f(fa.value, Chunk.map(fa.forest, go));
		return go(self);
	}
);

/**
 * @category sequencing
 */
export const flatMap: {
	<A, B>(f: (a: A) => Tree<B>): (self: Tree<A>) => Tree<B>;
	<A, B>(self: Tree<A>, f: (a: A) => Tree<B>): Tree<B>;
} = Function.dual(2, <A, B>(self: Tree<A>, f: (a: A) => Tree<B>): Tree<B> => {
	const { value, forest } = f(self.value);

	return {
		value,
		forest: Chunk.appendAll(forest, Chunk.map(self.forest, flatMap(f)))
	};
});

/**
 *
 */
export const extend: {
	<A, B>(f: (fa: Tree<A>) => B): (self: Tree<A>) => Tree<B>;
	<A, B>(self: Tree<A>, f: (fa: Tree<A>) => B): Tree<B>;
} = Function.dual(
	2,
	<A, B>(self: Tree<A>, f: (fa: Tree<A>) => B): Tree<B> => ({
		value: f(self),
		forest: Chunk.map(self.forest, extend(f))
	})
);

/**
 */
export const duplicate: <A>(self: Tree<A>) => Tree<Tree<A>> = extend(
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
	<A, B>(f: (a: A) => B): (self: Tree<A>) => Tree<B>;
	<A, B>(self: Tree<A>, f: (a: A) => B): Tree<B>;
} = Function.dual(
	2,
	<A, B>(self: Tree<A>, f: (a: A) => B): Tree<B> => ({
		value: f(self.value),
		forest: Chunk.map(self.forest, map(f))
	})
);

/**
 * @category folding
 */
export const reduce: {
	<A, B>(b: B, f: (b: B, a: A) => B): (self: Tree<A>) => B;
	<A, B>(self: Tree<A>, b: B, f: (b: B, a: A) => B): B;
} = Function.dual(3, <A, B>(self: Tree<A>, b: B, f: (b: B, a: A) => B): B => {
	let r: B = f(b, self.value);
	const len = self.forest.length;
	for (let i = 0; i < len; i++) {
		// @ts-ignore
		r = pipe(self.forest[i], reduce(r, f));
	}
	return r;
});

/**
 * @category folding
 */
export const foldMap: {
	<M, A>(M: Monoid.Monoid<M>, f: (a: A) => M): (self: Tree<A>) => M;
	<M, A>(self: Tree<A>, M: Monoid.Monoid<M>, f: (a: A) => M): M;
} = Function.dual(
	3,
	<M, A>(self: Tree<A>, M: Monoid.Monoid<M>, f: (a: A) => M): M =>
		reduce(self, M.empty, (acc, a) => M.combine(acc, f(a)))
);

/**
 * @category folding
 */
export const reduceRight: {
	<A, B>(b: B, f: (a: A, b: B) => B): (self: Tree<A>) => B;
	<A, B>(self: Tree<A>, b: B, f: (a: A, b: B) => B): B;
} = Function.dual(3, <A, B>(self: Tree<A>, b: B, f: (a: A, b: B) => B): B => {
	let r: B = b;
	const len = self.forest.length;
	for (let i = len - 1; i >= 0; i--) {
		//@ts-ignore
		r = pipe(self.forest[i], reduceRight(r, f));
	}
	return f(self.value, r);
});

/**
 * @category Extract
 */
export const extract = <A>(self: Tree<A>): A => self.value;
