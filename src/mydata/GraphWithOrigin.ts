import { Chunk, Either, Function, HashSet, pipe } from 'effect';
/**
 *
 *
 */
export const foldWith: {
	<A, T>(params: {
		transformLeavesGetChildren: (a: A) => Either.Either<T, Chunk.Chunk<A>>;
		concatenateChildren: (
			parent: A,
			children: Chunk.Chunk<T>,
			level: number
		) => T;
		circular: (a: A) => T;
		parents?: HashSet.HashSet<A> | undefined;
		level?: number | undefined;
	}): (self: A) => T;
	<A, T>(
		self: A,
		params: {
			transformLeavesGetChildren: (a: A) => Either.Either<T, Chunk.Chunk<A>>;
			concatenateChildren: (
				parent: A,
				children: Chunk.Chunk<T>,
				level: number
			) => T;
			circular: (a: A) => T;
			parents?: HashSet.HashSet<A> | undefined;
			level?: number | undefined;
		}
	): T;
} = Function.dual(
	2,
	<A, T>(
		self: A,
		{
			transformLeavesGetChildren,
			concatenateChildren,
			circular,
			parents = HashSet.empty(),
			level = 0
		}: {
			transformLeavesGetChildren: (a: A) => Either.Either<T, Chunk.Chunk<A>>;
			concatenateChildren: (
				parent: A,
				transformedChildren: Chunk.Chunk<T>,
				level: number
			) => T;
			circular: (a: A) => T;
			parents?: HashSet.HashSet<A> | undefined;
			level?: number | undefined;
		}
	): T =>
		HashSet.has(parents, self)
			? circular(self)
			: pipe(
					self,
					transformLeavesGetChildren,
					Either.map((children) =>
						pipe(
							children,
							Chunk.map(
								foldWith({
									transformLeavesGetChildren,
									concatenateChildren,
									circular,
									parents: HashSet.add(parents, self),
									level: level + 1
								})
							),
							(transformedChildren) =>
								concatenateChildren(self, transformedChildren, level)
						)
					),
					Either.merge
			  )
);
