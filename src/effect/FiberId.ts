import { FiberId, HashSet, ReadonlyArray, pipe } from 'effect';

export const toString = (self: FiberId.FiberId) =>
	pipe(
		FiberId.ids(self),
		HashSet.map((n) => n.toString()),
		ReadonlyArray.join(',')
	);
