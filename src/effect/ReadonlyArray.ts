import { Option, ReadonlyArray, pipe } from 'effect';
import { dual } from 'effect/Function';

/**
 * Returns true if the provided ReadonlyArray contains duplicates
 * @category utils
 * @since 1.0.0
 */
export const hasDuplicates = <A>(self: ReadonlyArray<A>): boolean =>
	pipe(self, ReadonlyArray.dedupe, (as) => (as.length === self.length ? false : true));

/**
 * Returns true if the provided ReadonlyArray contains duplicates using the provided isEquivalent function
 * @category utils
 * @since 1.0.0
 */
export const hasDuplicatesWith = dual<
	{
		<A>(isEquivalent: (self: A, that: A) => boolean): (self: ReadonlyArray<A>) => boolean;
	},
	{
		<A>(self: ReadonlyArray<A>, isEquivalent: (self: A, that: A) => boolean): boolean;
	}
>(2, <A>(self: ReadonlyArray<A>, isEquivalent: (self: A, that: A) => boolean) =>
	pipe(self, ReadonlyArray.dedupeWith(isEquivalent), (as) =>
		as.length === self.length ? false : true
	)
);

/**
 * Looks for elements that fulfill a predicate. Returns `none` in case no element or more than
 * one element is found. Otherwise returns the sole matchning element.
 *
 * @category getters
 * @since 1.0.0
 */
export const findSole = dual<
	{
		<A, B extends A>(
			refinement: (a: A, i: number) => a is B
		): (self: Iterable<A>) => Option.Option<B>;
		<A>(predicate: (a: A, i: number) => boolean): (self: ReadonlyArray<A>) => Option.Option<A>;
	},
	{
		<A, B extends A>(self: Iterable<A>, refinement: (a: A, i: number) => a is B): Option.Option<B>;
		<A>(self: ReadonlyArray<A>, predicate: (a: A, i: number) => boolean): Option.Option<A>;
	}
>(2, <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean) =>
	pipe(self, ReadonlyArray.filter(predicate), (r) =>
		r.length === 1 ? ReadonlyArray.get(r, 0) : Option.none()
	)
);
