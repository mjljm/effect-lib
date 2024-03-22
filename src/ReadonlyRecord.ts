import { ReadonlyRecord } from 'effect';

export const unsafeGet =
	(key: string) =>
	<A>(self: ReadonlyRecord.ReadonlyRecord<string, A>): A =>
		// @ts-expect-error getting record content unsafely
		self[key];

export * from '#src/internal/readonlyRecord';
