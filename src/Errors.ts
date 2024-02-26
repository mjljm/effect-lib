import { Data } from 'effect';

// Data.TaggedError extends Error and may therefore have a stack trace
// Data.TaggedError extends Error and therefore is Errorish
// Data.TaggedError extends YieldableError and may therefore be yielded directly

export class FunctionPort extends Data.TaggedError('FunctionPort')<{
	readonly originalError: unknown;
	readonly originalFunctionName: string;
	readonly moduleName: string;
	readonly libraryName: string;
}> {}

export const isFunctionPort = (u: unknown): u is FunctionPort => u instanceof FunctionPort;
