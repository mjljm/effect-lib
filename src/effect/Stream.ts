import { MError } from '#mjljm/effect-lib/index';
import {
	Chunk,
	Effect,
	Either,
	HashSet,
	Option,
	Stream,
	Tuple,
	pipe
} from 'effect';
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
	Stream.unfoldChunkEffect(
		Chunk.of(Tuple.make(origin, HashSet.empty<A>())),
		(nodesWithParents) =>
			Effect.gen(function* (_) {
				const [leavesEffect, otherNodesEffect] = pipe(
					nodesWithParents,
					Chunk.map(([node, parents]) =>
						pipe(
							getChildren(node),
							Either.map(
								Effect.flatMap((children) =>
									HashSet.has(parents, node)
										? new MError.General({
												message: 'Circular graph with origin'
										  })
										: Effect.succeed(
												Chunk.map(children, (child) =>
													Tuple.make(child, HashSet.add(parents, node))
												)
										  )
								)
							)
						)
					),
					Chunk.separate
				);
				const leaves = yield* _(Effect.all(leavesEffect, concurrencyOptions));
				const otherNodes = yield* _(
					Effect.all(otherNodesEffect, concurrencyOptions)
				);
				const nextNodes = pipe(
					otherNodes,
					Chunk.unsafeFromArray,
					Chunk.flatten
				);

				return Chunk.isNonEmpty(nextNodes)
					? Option.some(Tuple.make(Chunk.unsafeFromArray(leaves), nextNodes))
					: Option.none();
			})
	);
