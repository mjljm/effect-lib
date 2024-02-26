/**
 * Transforms a schema representing a ReadonlyArray<[K,V]> into a schema representing a Record<K,V>. If message contains a some<string>, an error will be raised if there are several entries with the same key. The error message will start by the string contained in message and end with the list of duplicate keys. Otherwise, the last occurence of each key will be used for the record
 */

import { Either, Equal, Tuple } from 'effect';

/**
 * Same as ReadonlyRecord.fromIterableWith but returns a left of a tuple containing the first duplicate key found and its position in case the iterable contains duplicate keys with different values.
 */

export const fromIterableWith = <A, B>(
	self: Iterable<A>,
	f: (a: A) => readonly [string, B]
): Either.Either<[key: string, pos: number], Record<string, B>> =>
	Either.gen(function* (_) {
		const out: Record<string, B> = {};
		let pos = 0;
		for (const a of self) {
			const [k, b] = f(a);
			if (k in out && !Equal.equals(out[k], b)) yield* _(Either.left(Tuple.make(k, pos)));
			else out[k] = b;
			pos++;
		}
		return out;
	});
