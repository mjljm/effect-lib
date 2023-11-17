import * as MError from '#internal/Error';
import { AST, Schema } from '@effect/schema';
import { StringUtils } from '@mjljm/js-lib';
import { Effect, Either, Option, ReadonlyArray, String, pipe } from 'effect';
import { DateTime } from 'luxon';

// Parsing
export const parse =
	<_, A>(schema: Schema.Schema<_, A>) =>
	(i: unknown, options?: AST.ParseOptions) =>
		pipe(
			Schema.parse(schema)(i, options),
			Effect.catchAll(
				(e) =>
					new MError.EffectSchema({
						originalFunctionName: 'parse',
						originalError: e
					})
			)
		);

export const parseEither =
	<_, A>(schema: Schema.Schema<_, A>) =>
	(i: unknown, options?: AST.ParseOptions) =>
		pipe(
			Schema.parseEither(schema)(i, options),
			Either.mapLeft(
				(e) =>
					new MError.EffectSchema({
						originalFunctionName: 'parse',
						originalError: e
					})
			)
		);

// Filters
// String filters

/**
 * String filter that ensures the given string represents a date
 *
 * @param f - The format of the expected date (see luxon)
 *
 */
export const validDate = (f: string) =>
	Schema.filter<string, string>((s) => DateTime.fromFormat(s, f).isValid, {
		message: () => `Not a string that represents a '${f}' formatted date`
	});

/**
 * String filter that restricts possible values to a set of strings
 *
 * @param a - An array of A's
 * @param f - A function that takes an A and the input strings and that returns true if A is an allowed value for s
 *
 */
export const inArray = <C, B extends A, A extends string = B>(
	a: ReadonlyArray<C>,
	f: (s: string) => (c: C) => boolean
) =>
	Schema.filter<B, A>(
		(s) => pipe(a, ReadonlyArray.findFirst(f(s)), Option.isSome),
		{
			message: () => 'Not one of the allowed values'
		}
	);

// Array filters
/**
 * Array filter that validates only arrays with no duplicate lines
 *
 * @param isEquivalent - Function that returns true when two A's are considered equal and false otherwise
 *
 */
export const noDups = <C>(isEquivalent: (self: C, that: C) => boolean) =>
	Schema.filter<ReadonlyArray<C>>(
		(a) =>
			pipe(
				a,
				ReadonlyArray.dedupeWith(isEquivalent),
				(a1) => a1.length === a.length
			),
		{
			message: () => 'No duplicates allowed'
		}
	);

// Transformers
/**
 * Transforms a schema<'YYYY-MM-DD',T> to a  schema<'YYYYMMDD',T>
 *
 * @param fromIso - the schema<'YYYY-MM-DD',T> schema.
 *
 */
export const schemaFromIsoToSchemaFromYyyymmdd = <T>(
	fromIso: Schema.Schema<string, T>
) =>
	Schema.transform(
		Schema.string,
		fromIso,
		StringUtils.yyyymmdToIso,
		StringUtils.isoToYyyymmdd
	);

/**
 * Schema that takes a string 'YYYYMMDD' and returns a date.
 *
 */
export const DateFromYyyymmdd = pipe(
	Schema.string,
	Schema.dateFromString,
	schemaFromIsoToSchemaFromYyyymmdd
);

/**
 * Transforms a schema<T,CSVString> to a schema<T,ReadonlyArray<string>.
 * @param sep - the CSV separator.
 */
export const schemaToCsvToSchemaToStringArray =
	(sep: string) =>
	<T>(toCSV: Schema.Schema<T, string>) =>
		Schema.transform(
			toCSV,
			Schema.array(Schema.string),
			String.split(sep),
			ReadonlyArray.join(sep)
		);
