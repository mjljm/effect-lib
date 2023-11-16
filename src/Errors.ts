import { ParseResult } from '@effect/schema';
import { Cause } from 'effect';
import * as Data from 'effect/Data';

export class FunctionPortError extends Data.Error<{
	originalError: unknown;
	originalFunctionName: string;
	moduleName: string;
	libraryName: string;
}> {}

/**
 * We need to tag clearly errors coming from Effect Schema because they can be pretty printed using formatErrors
 */
export class EffectSchemaError extends Data.Error<{
	originalFunctionName: string;
	originalError: ParseResult.ParseError;
}> {}

/**
 * This error is meant to be handled by a human being (no action triggered like a retry on HTTP Error). The message must give sufficient context to help identify the origin the error
 */
export class GeneralError<E> extends Data.Error<{
	message: string;
	originalCause: Cause.Cause<E>;
}> {}
