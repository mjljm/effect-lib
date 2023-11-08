import { format } from '@mjljm/effect-lib/effect-plus/Cause';
import { PredicateEffect } from '@mjljm/effect-lib/effect-plus/Predicate';
import { FunctionPortError, GeneralError } from '@mjljm/effect-lib/Errors';
import { Effect, List, pipe } from 'effect';

export const clearAndShowAllCauses = <T, R, E extends GeneralError<T> | FunctionPortError, A>(
	self: Effect.Effect<R, E, A>
): Effect.Effect<R, never, A> =>
	Effect.catchAllCause(self, (c) =>
		pipe(c, format, (message) =>
			Effect.zipRight(
				message === '' ? Effect.logInfo('SCRIPT EXITED SUCCESSFULLY') : Effect.logError(message),
				Effect.never
			)
		)
	);

export const iterateFullEffect = <Z, R1, E1, R2, E2>(
	initial: Z,
	options: {
		readonly while: PredicateEffect<Z, R1, E1>;
		readonly body: (z: Z) => Effect.Effect<R2, E2, Z>;
	}
): Effect.Effect<R1 | R2, E1 | E2, Z> =>
	Effect.suspend(() =>
		pipe(
			options.while(initial),
			Effect.flatMap((keepGoing) =>
				keepGoing
					? Effect.flatMap(options.body(initial), (z2) => iterateFullEffect(z2, options))
					: Effect.succeed(initial)
			)
		)
	);

// @ts-expect-error Same error in core-effect.ts
export const loopFullEffect: {
	<Z, R1, E1, R2, E2, R3, E3, A>(
		initial: Z,
		options: {
			readonly while: PredicateEffect<Z, R1, E1>;
			readonly step: (z: Z) => Effect.Effect<R2, E2, Z>;
			readonly body: (z: Z) => Effect.Effect<R3, E3, A>;
			readonly discard?: false;
		}
	): Effect.Effect<R1 | R2 | R3, E1 | E2 | E3, Array<A>>;
	<Z, R1, E1, R2, E2, R3, E3, A>(
		initial: Z,
		options: {
			readonly while: PredicateEffect<Z, R1, E1>;
			readonly step: (z: Z) => Effect.Effect<R2, E2, Z>;
			readonly body: (z: Z) => Effect.Effect<R3, E3, A>;
			readonly discard: true;
		}
	): Effect.Effect<R1 | R2 | R3, E1 | E2 | E3, void>;
} = <Z, R1, E1, R2, E2, R3, E3, A>(
	initial: Z,
	options: {
		readonly while: PredicateEffect<Z, R1, E1>;
		readonly step: (z: Z) => Effect.Effect<R2, E2, Z>;
		readonly body: (z: Z) => Effect.Effect<R3, E3, A>;
		readonly discard?: boolean;
	}
) =>
	options.discard
		? loopDiscard(initial, options.while, options.step, options.body)
		: Effect.map(loopInternal(initial, options.while, options.step, options.body), (x) =>
				Array.from(x)
		  );

const loopInternal = <Z, R1, E1, R2, E2, R3, E3, A>(
	initial: Z,
	cont: PredicateEffect<Z, R1, E1>,
	inc: (z: Z) => Effect.Effect<R2, E2, Z>,
	body: (z: Z) => Effect.Effect<R3, E3, A>
): Effect.Effect<R1 | R2 | R3, E1 | E2 | E3, List.List<A>> =>
	Effect.suspend(() =>
		pipe(
			cont(initial),
			Effect.flatMap((keepGoing) =>
				keepGoing
					? Effect.flatMap(body(initial), (a) =>
							Effect.flatMap(inc(initial), (z) =>
								Effect.map(loopInternal(z, cont, inc, body), List.prepend(a))
							)
					  )
					: Effect.sync(() => List.empty())
			)
		)
	);

const loopDiscard = <Z, R1, E1, R2, E2, R3, E3, A>(
	initial: Z,
	cont: PredicateEffect<Z, R1, E1>,
	inc: (z: Z) => Effect.Effect<R2, E2, Z>,
	body: (z: Z) => Effect.Effect<R3, E3, A>
): Effect.Effect<R1 | R2 | R3, E1 | E2 | E3, void> =>
	Effect.suspend(() =>
		pipe(
			cont(initial),
			Effect.flatMap((keepGoing) =>
				keepGoing
					? Effect.flatMap(body(initial), () =>
							Effect.flatMap(inc(initial), (z) => loopDiscard(z, cont, inc, body))
					  )
					: Effect.unit
			)
		)
	);
