import { Data } from 'effect';

/**
 * Only belong here errors that are global to the whole lib. Errors specific to one module belong in that module
 */

// Data.TaggedError extends Error and may therefore have a stack trace
// Data.TaggedError extends Error and therefore is Errorish
// Data.TaggedError extends YieldableError and may therefore be yielded directly

/**
 * FunctionPort signals an error that occurs while Effectifying a function
 */
export class Type extends Data.TaggedError('FunctionPort')<{
	readonly originalError: unknown;
	readonly originalFunctionName: string;
	readonly moduleName: string;
	readonly libraryName: string;
}> {}
