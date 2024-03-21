import { Data, Either, Number, Option, Predicate, pipe } from 'effect';

interface BaseType {
	// Name of the argument that had the error
	readonly id: string;
	readonly position?: number;
	readonly moduleTag: string;
	readonly functionName: string;
}

const argumentString = (self: BaseType): string =>
	`${self.moduleTag}${self.functionName}: argument '${self.id}'` +
	(self.position === undefined ? '' : ` at position ${self.position}`);

export const mapId = <B extends BaseType>(self: B, f: (id: string) => string): B => ({ ...self, id: f(self.id) });
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

export class OutOfRange extends Data.TaggedError('Effect-lib_BadArgument_OutOfRange')<OutOfRangeType> {
	override get message() {
		return `${argumentString(this)} is out of range. Actual:${this.actual}, expected: integer between ${this.min} included and ${this.max} included.`;
	}
}

export const checkRange = (params: {
	actual: number;
	min: number;
	max: number;
	id: string;
	position?: number;
	moduleTag: string;
	functionName: string;
}): Either.Either<number, OutOfRange> =>
	pipe(
		params.actual,
		// Do not use MEither.liftPredicate here to avoid cycling imports
		Option.liftPredicate(
			Predicate.and(Number.greaterThanOrEqualTo(params.min), Number.lessThanOrEqualTo(params.max))
		),
		Either.fromOption(() => new OutOfRange(params))
	);

/**
 * BadLength signals an arraylike whose lentgth is incorrect
 */

export interface BadLengthType extends BaseType {
	// Current length
	readonly actual: number;
	// Expected length
	readonly expected: number;
}

export class BadLength extends Data.TaggedError('Effect-lib_BadArgument_BadLength')<BadLengthType> {
	override get message() {
		return `${argumentString(this)} does not have expected size'. Actual:${this.actual}, expected: ${this.expected}.`;
	}
}

export const checkLength = <T extends ArrayLike<unknown>>(params: {
	target: T;
	expected: number;
	id: string;
	position?: number;
	moduleTag: string;
	functionName: string;
}): Either.Either<T, BadLength> => {
	const arr = params.target;
	const actual = arr.length;
	return pipe(
		arr,
		// Do not use MEither.liftPredicate and Function.strictEquals here to avoid cycling imports
		Option.liftPredicate(() => actual === params.expected),
		Either.fromOption(() => new BadLength({ ...params, actual }))
	);
};

/**
 * TwoMany signals an argument that receives more values than it expects
 */

export interface TooManyType extends BaseType {
	// The latest value received
	readonly actual: string;
	// The previous value received
	readonly expected: string;
}

export class TooMany extends Data.TaggedError('Effect-lib_BadArgument_TooMany')<TooManyType> {
	override get message() {
		return `${argumentString(this)} received value:${this.actual} that contradicts previously received value:${this.expected}.`;
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

export class BadFormat extends Data.TaggedError('Effect-lib_BadArgument_BadFormat')<BadFormatType> {
	override get message() {
		return `${argumentString(this)} does not match expected format. Received:${this.actual}, expected format: ${this.expected}.`;
	}
}

/**
 * General is to be used when nothing more specific matches
 */

export interface GeneralType extends BaseType {
	readonly message: string;
}

export class General extends Data.TaggedError('Effect-lib_BadArgument_General')<GeneralType> {}
