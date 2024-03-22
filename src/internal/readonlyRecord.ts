import { Either, Equal, ReadonlyRecord, Tuple } from 'effect';
/**
 * Same as ReadonlyRecord.fromIterableWith but returns a left of a tuple containing the first duplicate key found and its position in case the iterable contains duplicate keys with different values.
 */
export const fromIterableWith =
	<A, K extends string | symbol, B>(f: (a: A) => readonly [K, B]) =>
	(
		self: Iterable<A>
	): Either.Either<
		Record<ReadonlyRecord.ReadonlyRecord.NonLiteralKey<K>, B>,
		[key: string | symbol, pos: number]
	> =>
		Either.gen(function* (_) {
			const out: Record<string | symbol, B> = ReadonlyRecord.empty();
			let pos = 0;
			for (const a of self) {
				const [k, b] = f(a);
				if (k in out && !Equal.equals(out[k as string], b)) yield* _(Either.left(Tuple.make(k, pos)));
				else out[k] = b;
				pos++;
			}
			return out;
		});
