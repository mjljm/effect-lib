import { MCause, MError, MPredicate } from '#mjljm/effect-lib/index';
import { Effect, List, pipe } from 'effect';

export const clearAndShowAllCauses =
	(stringify: (u: unknown) => string) =>
	<T, R, E extends MError.General<T> | MError.FunctionPort, A>(
		self: Effect.Effect<R, E, A>
	): Effect.Effect<R, never, A> =>
		Effect.catchAllCause(self, (c) =>
			pipe(c, MCause.format(stringify), (message) =>
				Effect.zipRight(
					message === ''
						? Effect.logInfo('SCRIPT EXITED SUCCESSFULLY')
						: Effect.logError(message),
					Effect.never
				)
			)
		);

export const iterateFullEffect = <Z, R1, E1, R2, E2>(
	initial: Z,
	options: {
		readonly while: MPredicate.PredicateEffect<Z, R1, E1>;
		readonly body: (z: Z) => Effect.Effect<R2, E2, Z>;
	}
): Effect.Effect<R1 | R2, E1 | E2, Z> =>
	Effect.suspend(() =>
		Effect.gen(function* (_) {
			return (yield* _(options.while(initial)))
				? yield* _(iterateFullEffect(yield* _(options.body(initial)), options))
				: initial;
		})
	);

// @ts-expect-error Same error as in core-effect.ts
export const loopFullEffect: {
	<Z, R1, E1, R2, E2, R3, E3, A>(
		initial: Z,
		options: {
			readonly while: MPredicate.PredicateEffect<Z, R1, E1>;
			readonly step: (z: Z) => Effect.Effect<R2, E2, Z>;
			readonly body: (z: Z) => Effect.Effect<R3, E3, A>;
			readonly discard?: false;
		}
	): Effect.Effect<R1 | R2 | R3, E1 | E2 | E3, Array<A>>;
	<Z, R1, E1, R2, E2, R3, E3, A>(
		initial: Z,
		options: {
			readonly while: MPredicate.PredicateEffect<Z, R1, E1>;
			readonly step: (z: Z) => Effect.Effect<R2, E2, Z>;
			readonly body: (z: Z) => Effect.Effect<R3, E3, A>;
			readonly discard: true;
		}
	): Effect.Effect<R1 | R2 | R3, E1 | E2 | E3, void>;
} = <Z, R1, E1, R2, E2, R3, E3, A>(
	initial: Z,
	options: {
		readonly while: MPredicate.PredicateEffect<Z, R1, E1>;
		readonly step: (z: Z) => Effect.Effect<R2, E2, Z>;
		readonly body: (z: Z) => Effect.Effect<R3, E3, A>;
		readonly discard?: boolean;
	}
) =>
	options.discard
		? loopDiscard(initial, options.while, options.step, options.body)
		: Effect.map(
				loopInternal(initial, options.while, options.step, options.body),
				(x) => Array.from(x)
		  );

const loopInternal = <Z, R1, E1, R2, E2, R3, E3, A>(
	initial: Z,
	cont: MPredicate.PredicateEffect<Z, R1, E1>,
	inc: (z: Z) => Effect.Effect<R2, E2, Z>,
	body: (z: Z) => Effect.Effect<R3, E3, A>
): Effect.Effect<R1 | R2 | R3, E1 | E2 | E3, List.List<A>> =>
	Effect.suspend(() =>
		Effect.gen(function* (_) {
			return (yield* _(cont(initial)))
				? List.prepend(
						yield* _(loopInternal(yield* _(inc(initial)), cont, inc, body)),
						yield* _(body(initial))
				  )
				: List.empty<A>();
		})
	);

const loopDiscard = <Z, R1, E1, R2, E2, R3, E3, A>(
	initial: Z,
	cont: MPredicate.PredicateEffect<Z, R1, E1>,
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
