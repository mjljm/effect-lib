import type * as MTree from '#src/Tree';
import { Effect, Equal, Equivalence, HashSet, ReadonlyArray, pipe } from 'effect';
import { Concurrency } from 'effect/Types';

interface EffectPredicate<in Z, out E, out R> {
	(x: Z): Effect.Effect<boolean, E, R>;
}

export { type EffectPredicate as Predicate };

/**
 * Effectful unfoldTree
 *
 * @category constructors
 */

/**
 * Build a (possibly infinite) tree from a seed value. Can use a cache and handles circularity
 *
 * @category constructors
 */
export const unfoldTree = <R, E, A, B>({
	concurrencyOptions,
	memoize,
	seed,
	unfoldfunction
}: {
	readonly concurrencyOptions?: { readonly concurrency?: Concurrency | undefined } | undefined;
	readonly unfoldfunction: (
		seed: B,
		isCircular: boolean
	) => Effect.Effect<[nextValue: A, nextSeeds: ReadonlyArray<B>], E, R>;
	readonly memoize: boolean;
	readonly seed: B;
}): Effect.Effect<MTree.Tree<A>, E, R> =>
	Effect.gen(function* (_) {
		const internalUnfoldTree = ({
			currentSeed,
			parents
		}: {
			readonly currentSeed: B;
			readonly parents: HashSet.HashSet<B>;
		}): Effect.Effect<MTree.Tree<A>, E, R> =>
			Effect.gen(function* (_) {
				const [nextValue, nextSeeds] = yield* _(unfoldfunction(currentSeed, HashSet.has(parents, currentSeed)));
				const forest = yield* _(
					pipe(
						nextSeeds,
						ReadonlyArray.map((seed) =>
							cachedInternalUnfoldTree({ currentSeed: seed, parents: HashSet.add(parents, currentSeed) })
						),
						Effect.allWith(concurrencyOptions)
					)
				);
				return {
					value: nextValue,
					forest
				};
			});

		const cachedInternalUnfoldTree = memoize
			? yield* _(
					Effect.cachedFunction(
						internalUnfoldTree,
						Equivalence.make((self, that) => Equal.equals(self.currentSeed, that.currentSeed))
					)
				)
			: internalUnfoldTree;

		return yield* _(cachedInternalUnfoldTree({ currentSeed: seed, parents: HashSet.empty<B>() }));
	});
