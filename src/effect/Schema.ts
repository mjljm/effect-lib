import { MError, MFunction } from '#mjljm/effect-lib/index';
import { AST, Arbitrary, ParseResult, Pretty, Equivalence as SEquivalence, Schema } from '@effect/schema';

import { StringUtils } from '@mjljm/js-lib';
import { Effect, Either, Equivalence, Option, ReadonlyArray, String, pipe } from 'effect';
import { DateTime } from 'luxon';

// Parsing
export const parse =
	<_, A>(schema: Schema.Schema<_, A>) =>
	(options?: AST.ParseOptions) =>
	(i: unknown) =>
		pipe(
			Schema.parse(schema)(i, options),
			Effect.catchAll(
				(e) =>
					new MError.EffectSchema({
						originalError: e
					})
			)
		);

export const parseEither =
	<_, A>(schema: Schema.Schema<_, A>) =>
	(options?: AST.ParseOptions) =>
	(i: unknown) =>
		pipe(
			Schema.parseEither(schema)(i, options),
			Either.mapLeft(
				(e) =>
					new MError.EffectSchema({
						originalError: e
					})
			)
		);

// New data types
/**
 * @category URL constructor
 */

const urlArbitrary = (): Arbitrary.Arbitrary<URL> => (fc) => fc.webUrl().map((s) => new URL(s));
const urlPretty = (): Pretty.Pretty<URL> => (url: URL) => `new URL(${url.toJSON()})`;
const urlEquivalence: Equivalence.Equivalence<URL> = Equivalence.mapInput(Equivalence.string, (url) => url.toJSON());

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const UrlFromSelf: Schema.Schema<URL> = Schema.declare(
	[],
	Schema.struct({}),
	() => (u, _, ast) => (MFunction.isUrl(u) ? ParseResult.success(u) : ParseResult.failure(ParseResult.type(ast, u))),
	{
		[AST.IdentifierAnnotationId]: 'Url',
		[Pretty.PrettyHookId]: urlPretty,
		[Arbitrary.ArbitraryHookId]: urlArbitrary,
		[SEquivalence.EquivalenceHookId]: () => urlEquivalence
	}
);

// Filters
// String filters

/**
 * String filter that ensures the given string represents a date
 *
 * @param f - The format of the expected date (see luxon)
 *
 */
export const date = (f: string) =>
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
	Schema.filter<B, A>((s) => pipe(a, ReadonlyArray.findFirst(f(s)), Option.isSome), {
		message: () => 'Not one of the allowed values'
	});

/**
 * String filter that ensures the given string represents an email
 *
 */
export const email = pipe(
	Schema.string,
	Schema.message(() => 'not a string'),
	Schema.nonEmpty({ message: () => 'required' }),
	Schema.pattern(/[a-z0-9]+@[a-z]+\.[a-z]{2,3}/, {
		message: () => 'not a valid email'
	}),
	Schema.title('email'),
	Schema.description('An email address')
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
		(a) => pipe(a, ReadonlyArray.dedupeWith(isEquivalent), (a1) => a1.length === a.length),
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
export const schemaFromIsoToSchemaFromYyyymmdd = <T>(fromIso: Schema.Schema<string, T>) =>
	Schema.transform(Schema.string, fromIso, StringUtils.yyyymmdToIso, StringUtils.isoToYyyymmdd);

/**
 * Schema that takes a string 'YYYYMMDD' and returns a date.
 *
 */
export const DateFromYyyymmdd = pipe(Schema.string, Schema.dateFromString, schemaFromIsoToSchemaFromYyyymmdd);

/**
 * Transforms a schema<T,CSVString> to a schema<T,ReadonlyArray<string>.
 * @param sep - the CSV separator.
 */
export const schemaToCsvToSchemaToStringArray =
	(sep: string) =>
	<T>(toCSV: Schema.Schema<T, string>) =>
		Schema.transform(toCSV, Schema.array(Schema.string), String.split(sep), ReadonlyArray.join(sep));

/**
 * Transforms a string representing a URL to a URL object
 */
export const stringToUrl = Schema.transformOrFail(
	Schema.string,
	UrlFromSelf,
	(s) => {
		try {
			return ParseResult.success(new URL(s));
		} catch (_) {
			return ParseResult.failure(ParseResult.type(Schema.string.ast, s, 'URL expected'));
		}
	},
	(url) => ParseResult.success(url.toJSON())
);
