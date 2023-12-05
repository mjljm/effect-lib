import { Chunk, Function, HashSet, Option, pipe } from 'effect';

interface flattenParams<A, B, C> {
	handleSpecialNode: (a: A) => Option.Option<B>;
	handleCircularNode: (a: A) => B;
	split: (a: A) => Chunk.Chunk<C>;
	shardToChild: (shard: C) => A;
	handleNode: (
		a: A,
		shards: Chunk.Chunk<C>,
		flattenedChildren: Chunk.Chunk<B>
	) => B;
	parents: HashSet.HashSet<A>;
	depth: number;
}

export const flatten: {
	<A, B, C>({
		handleSpecialNode,
		handleCircularNode,
		split,
		shardToChild,
		handleNode,
		parents,
		depth
	}: flattenParams<A, B, C>): (self: A) => B;
	<A, B, C>(
		self: A,
		{
			handleSpecialNode,
			handleCircularNode,
			split,
			shardToChild,
			handleNode,
			parents,
			depth
		}: flattenParams<A, B, C>
	): B;
} = Function.dual(
	2,
	<A, B, C>(
		self: A,
		{
			handleSpecialNode,
			handleCircularNode,
			split,
			shardToChild,
			handleNode,
			parents,
			depth
		}: flattenParams<A, B, C>
	): B =>
		HashSet.has(parents, self)
			? pipe(
					self,
					handleSpecialNode,
					Option.getOrElse(() =>
						pipe(self, split, (shards) =>
							pipe(
								shards,
								Chunk.map((shard) =>
									pipe(
										shard,
										shardToChild,
										flatten({
											handleSpecialNode,
											handleCircularNode,
											split,
											shardToChild,
											handleNode,
											parents: HashSet.add(parents, self),
											depth: depth + 1
										})
									)
								),
								(bs) => handleNode(self, shards, bs)
							)
						)
					)
			  )
			: handleCircularNode(self)
);
