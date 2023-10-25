import { format } from '@mjljm/effect-lib/effect-plus/Cause';
import { FunctionPortError, GeneralError } from '@mjljm/effect-lib/errors';
import { Effect, pipe } from 'effect';

export const clearAndShowAllCauses = <T, R, E extends GeneralError<T> | FunctionPortError, A>(
	self: Effect.Effect<R, E, A>
) =>
	Effect.catchAllCause(self, (c) =>
		pipe(c, format, (message) =>
			message === '' ? Effect.logInfo('SCRIPT EXITED SUCCESSFULLY') : Effect.logError(message)
		)
	);
