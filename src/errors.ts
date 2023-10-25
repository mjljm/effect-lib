import { ParseResult } from '@effect/schema';
import { Cause } from 'effect';
import * as Data from 'effect/Data';

export class FunctionPortError extends Data.TaggedError('FunctionPortError')<{
	readonly originalError: unknown;
	readonly originalFunctionName: string;
	readonly moduleName: string;
	readonly libraryName: string;
}> {}

/**
 * We need to tag clearly errors coming from Effect Schema because they can be pretty printed using formatErrors
 */
export class EffectSchemaError extends Data.TaggedError('EffectSchemaError')<{
	readonly originalFunctionName: string;
	readonly originalError: ParseResult.ParseError;
}> {}

/**
 * This error is meant to be handled by a human being (no action triggered like a retry on HTTP Error). The message must give sufficient context to help identify the origin the error
 */
export class GeneralError<E> extends Data.TaggedError('GeneralError')<{
	readonly message: string;
	readonly originalCause: Cause.Cause<E>;
}> {}
