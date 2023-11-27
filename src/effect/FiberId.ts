import { FiberId, HashSet, ReadonlyArray, pipe } from 'effect';

export const toJson = (self: FiberId.FiberId) =>
	pipe(
		FiberId.ids(self),
		HashSet.map((n) => n.toString()),
		ReadonlyArray.join(',')
	);
