import { Data } from 'effect';

interface BaseType {
	// Name of the argument that had the error
	readonly id: string;
	readonly position?: number;
	readonly moduleTag: string;
	readonly functionName: string;
}

/**
 * OutOfRange signals an out-of-range error
 */

export interface OutOfRangeType extends BaseType {
	// Value of the argument
	readonly actual: number;
	// Lowest value accepted (included)
	readonly min: number;
	// Highest value accepted (included)
	readonly max: number;
}

export class OutOfRange extends Data.TaggedError('BadArgumentOutOfRange')<OutOfRangeType> {
	override get message() {
		return `Argument '${this.id}' is out of range. Actual:${this.actual}, expected: integer between ${this.min} included and ${this.max} included.`;
	}
}

/**
 * BadLength signals an arraylike whose lentgth is incorrect
 */

export interface BadLengthType extends BaseType {
	// Current length
	readonly actual: number;
	// Expected length
	readonly expected: number;
}

export class BadLength extends Data.TaggedError('BadArgumentBadLength')<BadLengthType> {
	override get message() {
		return `Argument '${this.id} does not have expected size'. Actual:${this.actual}, expected: ${this.expected}.`;
	}
}

/**
 * TwoMany signals an argument that receives more values than it expects
 */

export interface TooManyType extends BaseType {
	// Number of received values
	readonly actual: number;
	// Number of expected values
	readonly expected: number;
}

export class TooMany extends Data.TaggedError('BadArgumentTooMany')<TooManyType> {
	override get message() {
		return `Argument '${this.id} received too many values'. Received:${this.actual}, expected: ${this.expected}.`;
	}
}

/**
 * BadFormat signals an argument that receives a value that does not match the expected format
 */

export interface BadFormatType extends BaseType {
	// Data received
	readonly actual: string;
	// Expected format
	readonly expected: string;
}

export class BadFormat extends Data.TaggedError('BadArgumentBadFormat')<BadFormatType> {
	override get message() {
		return `Data in argument '${this.id}' does not match expected format. Received:${this.actual}, expected format: ${this.expected}.`;
	}
}

/**
 * General is to be used when nothing more specific matches
 */

export interface GeneralType extends BaseType {
	readonly message: string;
}

export class General extends Data.TaggedError('BadArgumentGeneral')<GeneralType> {}
