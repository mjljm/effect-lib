import { Chunk, Function, Option, Predicate, pipe } from 'effect';
/**
 * Returns true if the provided Chunk contains duplicates
 * @category utils
 * @since 1.0.0
 */
export const hasDuplicates = <A>(self: Chunk.Chunk<A>): boolean =>
	pipe(self, Chunk.dedupe, (as) => (as.length === self.length ? false : true));

/**
 * Looks for elements that fulfill a predicate. Returns `none` in case no element or more than
 * one element is found. Otherwise returns the sole matchning element.
 *
 * @category getters
 * @since 1.0.0
 */
export const findSole = Function.dual<
	{
		<A, B extends A>(
			refinement: Predicate.Refinement<A, B>
		): (self: Chunk.Chunk<A>) => Option.Option<B>;
		<A>(predicate: Predicate.Predicate<A>): (self: Chunk.Chunk<A>) => Option.Option<A>;
	},
	{
		<A, B extends A>(
			self: Chunk.Chunk<A>,
			refinement: Predicate.Refinement<A, B>
		): Option.Option<B>;
		<A>(self: Chunk.Chunk<A>, predicate: Predicate.Predicate<A>): Option.Option<A>;
	}
>(2, <A>(self: Chunk.Chunk<A>, predicate: Predicate.Predicate<A>) =>
	pipe(self, Chunk.filter(predicate), (r) => (r.length === 1 ? Chunk.get(r, 0) : Option.none()))
);
