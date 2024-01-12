import { MCause, MEffect, MError, Tree } from '#mjljm/effect-lib/index';
import { ANSI, StringUtils } from '@mjljm/js-lib';
import { Effect, Equal, Equivalence, HashSet, List, ReadonlyArray, pipe } from 'effect';
import { Concurrency } from 'effect/Types';

interface EffectPredicate<in Z, out R, out E> {
	(x: Z): Effect.Effect<R, E, boolean>;
}

export { type EffectPredicate as Predicate };
/**
 * Clears the error channel after logging all possible causes
 */
export const clearAndLogAllCauses =
	(srcDirPath: string, stringify: (u: unknown) => string, tabChar?: string) =>
	<R, E extends MError.WithOriginalCause, A>(self: Effect.Effect<R, E, A>): Effect.Effect<R, never, A | void> =>
		Effect.catchAllCause(self, (c) =>
			pipe(c, MCause.toJson(srcDirPath, stringify, tabChar), (errorText) =>
				errorText === ''
					? Effect.logInfo(ANSI.green('SCRIPT EXITED SUCCESSFULLY'))
					: Effect.logError(ANSI.red('SCRIPT FAILED\n') + StringUtils.tabify(errorText))
			)
		);

/**
 * Same as Effect.Iterable but both predicate and step are effectful. DO NOT USE
 */
export const whileDo = <Z, R1, E1, R2, E2>(
	initial: Z,
	options: {
		readonly predicate: MEffect.Predicate<Z, R1, E1>;
		readonly step: (z: Z) => Effect.Effect<R2, E2, Z>;
	}
): Effect.Effect<R1 | R2, E1 | E2, Z> =>
	Effect.suspend(() =>
		Effect.gen(function* (_) {
			return (yield* _(options.predicate(initial)))
				? yield* _(whileDo(yield* _(options.step(initial)), options))
				: initial;
		})
	);

/**
 * Same as WhileDo but the first step is executed before the predicate - DO NOT USE
 */
export const doWhile = <Z, R1, E1, R2, E2>(
	initial: Z,
	options: {
		readonly step: (z: Z) => Effect.Effect<R2, E2, Z>;
		readonly predicate: MEffect.Predicate<Z, R1, E1>;
	}
): Effect.Effect<R1 | R2, E1 | E2, Z> =>
	Effect.suspend(() =>
		Effect.gen(function* (_) {
			const loop = yield* _(options.step(initial));
			return (yield* _(options.predicate(loop))) ? yield* _(doWhile(loop, options)) : loop;
		})
	);

/**
 * Same as Effect.loop but step, predicate and body are effectful - DO NOT USE
 */

// @ts-expect-error Same error as in core-effect.ts
export const whileDoAccum: {
	<Z, R1, E1, R2, E2, R3, E3, A>(
		initial: Z,
		options: {
			readonly step: (z: Z) => Effect.Effect<R2, E2, Z>;
			readonly predicate: MEffect.Predicate<Z, R1, E1>;
			readonly body: (z: Z) => Effect.Effect<R3, E3, A>;
			readonly discard?: false;
		}
	): Effect.Effect<R1 | R2 | R3, E1 | E2 | E3, Array<A>>;
	<Z, R1, E1, R2, E2, R3, E3, A>(
		initial: Z,
		options: {
			readonly step: (z: Z) => Effect.Effect<R2, E2, Z>;
			readonly while: MEffect.Predicate<Z, R1, E1>;
			readonly body: (z: Z) => Effect.Effect<R3, E3, A>;
			readonly discard: true;
		}
	): Effect.Effect<R1 | R2 | R3, E1 | E2 | E3, void>;
} = <Z, R1, E1, R2, E2, R3, E3, A>(
	initial: Z,
	options: {
		readonly step: (z: Z) => Effect.Effect<R2, E2, Z>;
		readonly while: MEffect.Predicate<Z, R1, E1>;
		readonly body: (z: Z) => Effect.Effect<R3, E3, A>;
		readonly discard?: boolean;
	}
): Effect.Effect<R1 | R2 | R3, E1 | E2 | E3, Array<A>> | Effect.Effect<R1 | R2 | R3, E1 | E2 | E3, void> =>
	options.discard
		? loopDiscard(initial, options.while, options.step, options.body)
		: Effect.map(loopInternal(initial, options.while, options.step, options.body), (x) => Array.from(x));

const loopInternal = <Z, R1, E1, R2, E2, R3, E3, A>(
	initial: Z,
	cont: MEffect.Predicate<Z, R1, E1>,
	inc: (z: Z) => Effect.Effect<R2, E2, Z>,
	body: (z: Z) => Effect.Effect<R3, E3, A>
): Effect.Effect<R1 | R2 | R3, E1 | E2 | E3, List.List<A>> =>
	Effect.suspend(() =>
		Effect.gen(function* (_) {
			return (yield* _(cont(initial)))
				? List.prepend(yield* _(loopInternal(yield* _(inc(initial)), cont, inc, body)), yield* _(body(initial)))
				: List.empty<A>();
		})
	);

const loopDiscard = <Z, R1, E1, R2, E2, R3, E3, A>(
	initial: Z,
	cont: MEffect.Predicate<Z, R1, E1>,
	inc: (z: Z) => Effect.Effect<R2, E2, Z>,
	body: (z: Z) => Effect.Effect<R3, E3, A>
): Effect.Effect<R1 | R2 | R3, E1 | E2 | E3, void> =>
	Effect.suspend(() =>
		Effect.gen(function* (_) {
			if (yield* _(cont(initial))) {
				yield* _(body(initial));
				yield* _(loopDiscard(yield* _(inc(initial)), cont, inc, body));
			}
		})
	);

/**
 * Same as Effect.cachedFunction but calls onRecalc if the result is recalculated and onExit just before exiting. Useful for debuuging
 */
export const cachedFunctionWithLogging = <R, E, A, B>(
	f: (a: A) => Effect.Effect<R, E, B>,
	onRecalcOrExit: (a: A, b: B, event: 'onRecalc' | 'onExit') => Effect.Effect<never, never, void>,
	eq?: Equivalence.Equivalence<A>
): Effect.Effect<never, never, (a: A) => Effect.Effect<R, E, B>> =>
	Effect.gen(function* (_) {
		const functionWithLogging = (a: A) =>
			Effect.gen(function* (_) {
				const b = yield* _(f(a));
				// log after calling f that might be asynchronous. Otherwise logging may happen long before f executes
				yield* _(onRecalcOrExit(a, b, 'onRecalc'));
				return b;
			});
		const cachedFunction = yield* _(Effect.cachedFunction(functionWithLogging, eq));
		return (a: A) =>
			Effect.gen(function* (_) {
				const b = yield* _(cachedFunction(a));
				// log after calling f that might be asynchronous. Otherwise logging may happen long before f executes
				yield* _(onRecalcOrExit(a, b, 'onExit'));
				return b;
			});
	});

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
	) => Effect.Effect<R, E, [nextValue: A, nextSeeds: ReadonlyArray<B>]>;
	readonly memoize: boolean;
	readonly seed: B;
}): Effect.Effect<R, E, Tree.Tree<A>> =>
	Effect.gen(function* (_) {
		const internalUnfoldTree = ({
			currentSeed,
			parents
		}: {
			readonly currentSeed: B;
			readonly parents: HashSet.HashSet<B>;
		}): Effect.Effect<R, E, Tree.Tree<A>> =>
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

/*export const filterOption: {
	<R, E, A, B extends A>(
		refinement: Predicate.Refinement<A, B>
	): (self: Effect.Effect<R, E, A>) => Effect.Effect<R, E, Option.Option<B>>;
	<R, E, B extends A, A = B>(
		predicate: Predicate.Predicate<A>
	): (self: Effect.Effect<R, E, B>) => Effect.Effect<R, E, Option.Option<B>>;
} =
	<R, E, B extends A, A = B>(predicate: Predicate.Predicate<A>) =>
	(self: Effect.Effect<R, E, B>): Effect.Effect<R, E, Option.Option<B>> =>
		Effect.map(self, Option.liftPredicate(predicate));*/

export const filterEffectOrFail =
	<R1, E1, E2, A extends X & Y, X = A, Y = A>(filter: EffectPredicate<X, R1, E1>, orFailWith: (a: Y) => E2) =>
	<R, E>(self: Effect.Effect<R, E, A>): Effect.Effect<R | R1, E1 | E2 | E, A> =>
		Effect.gen(function* (_) {
			const a = yield* _(self);
			const applies = yield* _(filter(a));
			return applies ? a : yield* _(Effect.fail(orFailWith(a)));
		});
