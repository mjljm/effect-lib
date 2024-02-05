import { Chunk, Data, Effect, Either, Option, ReadonlyArray, Stream, Tuple, pipe } from 'effect';

export class StreamContentError extends Data.TaggedError('StreamContentError')<{
	readonly message: string;
}> {}

export const ExtractNBytes =
	(n: number) =>
	<R, E>(
		self: Stream.Stream<R, E, Uint8Array>
	): Effect.Effect<
		R,
		E | StreamContentError,
		[iv: Uint8Array, remainingStream: Stream.Stream<R, E, Uint8Array>]
	> =>
		Effect.gen(function* (_) {
			const ivConstituents = yield* _(
				pipe(
					self,
					Stream.map((a) => a.length),
					Stream.scan(0, (z, a) => z + a),
					Stream.drop(1),
					Stream.takeUntil((a) => a >= n),
					Stream.zip(self),
					Stream.map(([_, a]) => Array.from(a)),
					Stream.runCollect
				)
			);

			const [iv, leftOver] = yield* _(
				ivConstituents,
				ReadonlyArray.fromIterable,
				ReadonlyArray.flatten,
				ReadonlyArray.splitAt(n),
				Option.liftPredicate(([iv]) => iv.length >= n),
				Either.fromOption(
					() =>
						new StreamContentError({
							message: 'IV vector could not be extracted. Stream must contain at least 16 bytes.'
						})
				)
			);

			return Tuple.make(
				new Uint8Array(iv),
				pipe(self, Stream.drop(ivConstituents.length), Stream.prepend(Chunk.of(new Uint8Array(leftOver))))
			);
		});
