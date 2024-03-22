/**
 * Appends an element at the start of a tuple.
 *
 * @category concatenating
 */
export const prependElement =
	<B>(that: B) =>
	<A extends ReadonlyArray<unknown>>(self: A): [B, ...A] =>
		[that, ...self] as const;

export * as Mtuple from '#src/internal/tuple';
