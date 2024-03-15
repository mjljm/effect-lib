import { Data } from 'effect';

/**
 * Only belong here errors that are global to the whole lib. Errors specific to one module belong in that module
 */

// Data.TaggedError extends Error and may therefore have a stack trace
// Data.TaggedError extends Error and therefore is Errorish
// Data.TaggedError extends YieldableError and may therefore be yielded directly

/**
 * RangeError is an ArgumentError that signals an out-of-range error
 */
export class OutOfRange extends Data.TaggedError('OutOfRange')<{
	readonly actual: number;
	readonly min: number;
	readonly max: number;
	readonly message: string;
}> {
	get messageWithRange() {
		return `${this.message}.Actual:${this.actual}. Expected: integer between ${this.min} included and ${this.max} included.`;
	}
}

/**
 * OtherBadArgument signals any other bad argument error
 */
export class Other extends Data.TaggedError('OtherBadArgument')<{
	readonly message: string;
}> {}
