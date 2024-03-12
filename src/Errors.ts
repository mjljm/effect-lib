import { Data } from 'effect';

// Data.TaggedError extends Error and may therefore have a stack trace
// Data.TaggedError extends Error and therefore is Errorish
// Data.TaggedError extends YieldableError and may therefore be yielded directly

/**
 * FunctionPort signals an error that occurs while Effectifying a function
 */
export class FunctionPort extends Data.TaggedError('FunctionPort')<{
	readonly originalError: unknown;
	readonly originalFunctionName: string;
	readonly moduleName: string;
	readonly libraryName: string;
}> {}

/**
 * InvalidDate signals an invalid date
 */
export class InvalidDate extends Data.TaggedError('InvalidDate')<{
	readonly message: string;
}> {}
