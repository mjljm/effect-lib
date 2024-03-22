/**
 * Unsafe get an element from an array. No bounds check, Faster than the Readonly version
 */
export const unsafeGet =
	(index: number) =>
	<A>(self: ReadonlyArray<A>): A =>
		// @ts-expect-error getting array content unsafely
		self[index];
