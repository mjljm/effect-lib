import { Chunk, Effect, Either, Option, Stream, Tuple, pipe } from 'effect';
import { Concurrency } from 'effect/Types';

/**
 *
 * Builds a stream from the leaves of a graph with an origin. Origin is the origin of the graph. getChildren is a function that takes a node and returns a left of this node if it is a leaf or a right of the children of this node.
 */
export const fromLeavesOfGraphWithOrigin = <R1, E1, R2, E2, A>({
	origin,
	getChildren,
	concurrencyOptions
}: {
	origin: A;
	getChildren: (
		a: A
	) => Either.Either<
		Effect.Effect<R1, E1, A>,
		Effect.Effect<R2, E2, Chunk.Chunk<A>>
	>;
	concurrencyOptions?:
		| { readonly concurrency?: Concurrency | undefined }
		| undefined;
}) =>
	Stream.unfoldChunkEffect(Chunk.of(origin), (nodes) =>
		pipe(
			nodes,
			Chunk.map(getChildren),
			Chunk.separate,
			([leaves, otherNodes]) =>
				Tuple.make(
					Effect.all(leaves, concurrencyOptions),
					Effect.all(otherNodes, concurrencyOptions)
				),
			Effect.allWith(concurrencyOptions),
			Effect.map(([leaves, otherNodes]) =>
				pipe(otherNodes, Chunk.unsafeFromArray, Chunk.flatten, (nodes) =>
					Chunk.isNonEmpty(nodes)
						? Option.some(Tuple.make(Chunk.unsafeFromArray(leaves), nodes))
						: Option.none()
				)
			)
		)
	);
