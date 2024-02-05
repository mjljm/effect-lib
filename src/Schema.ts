import { ParseResult, Schema } from '@effect/schema';
import { RegExpUtils } from '@mjljm/js-lib';

import { Effect, Either, ReadonlyArray, pipe } from 'effect';

const moduleTag = '@mjljm/effect-lib/Schema/';

// New data types

const semVerPattern = new RegExp(
	RegExpUtils.makeLine(
		RegExpUtils.number + RegExpUtils.dot + RegExpUtils.number + RegExpUtils.dot + RegExpUtils.number
	)
);

const SemVerBrand = Symbol.for(moduleTag + 'SemverBrand');
export const semVer = pipe(
	Schema.string,
	Schema.pattern(semVerPattern, {
		message: () => 'SemVer should have following format: number.number.number'
	}),
	Schema.brand(SemVerBrand)
);
export type SemVer = Schema.Schema.To<typeof semVer>;
export const SemVer = Schema.decode(semVer);

const emailPattern = /[a-z0-9]+@[a-z]+\.[a-z]{2,3}/;
const EmailBrand = Symbol.for(moduleTag + 'EmailBrand');
export const email = pipe(
	Schema.string,
	Schema.pattern(emailPattern, {
		message: () => 'Not a proper email'
	}),
	Schema.brand(EmailBrand)
);
export type Email = Schema.Schema.To<typeof email>;
export const Email = Schema.decode(email);

const TwoDigitIntBrand = Symbol.for(moduleTag + 'TwoDigitIntBrand');
export const twoDigitInt = pipe(
	Schema.number,
	Schema.greaterThanOrEqualTo(0, { identifier: 'twoDigitInt.min' }),
	Schema.lessThan(100, { identifier: 'twoDigitInt.max' }),
	Schema.brand(TwoDigitIntBrand)
);
export type TwoDigitInt = Schema.Schema.To<typeof twoDigitInt>;
export const TwoDigitInt = Schema.decode(twoDigitInt);
export const twoDigitIntFromString = Schema.compose(Schema.NumberFromString, twoDigitInt);
export const TwoDigitIntFromString = Schema.decode(twoDigitIntFromString);

// Number transformations
/**
 * Yields a schema that takes a number and returns that number offset by `offset`
 */
export const offset = (offset: number): Schema.Schema<never, number, number> =>
	Schema.transform(
		Schema.number,
		Schema.number,
		(n) => n + offset,
		(n) => n - offset
	);

// Schema transformations
/**
 * Transforms a `Schema.Schema<R, I, A>` into a `Schema.Schema<R, A, I>`
 */
export const inverse = <R, I, A>(s: Schema.Schema<R, I, A>): Schema.Schema<R, A, I> =>
	Schema.transformOrFail(
		Schema.to(s),
		Schema.from(s),
		(to) =>
			pipe(
				to,
				Schema.encode(s),
				Effect.catchTag('ParseError', (e) => Effect.fail(e.error))
			),
		(from) =>
			pipe(
				from,
				Schema.decode(s),
				Effect.catchTag('ParseError', (e) => Effect.fail(e.error))
			)
	);

/**
 * Transforms a Schema<R, I, A> in a Schema<R, I, number> using the provided array as. The number is the index of the A element is as
 */
export const index =
	<A>(as: ReadonlyArray<A>) =>
	<R, I>(s: Schema.Schema<R, I, A>): Schema.Schema<R, I, number> =>
		Schema.transformOrFail(
			s,
			Schema.number,
			(a, _, ast) =>
				pipe(
					as,
					ReadonlyArray.findFirstIndex((an) => an === a),
					Either.fromOption(() => ParseResult.type(ast, a, 'Not an allowed value'))
				),
			(n, _, ast) =>
				pipe(
					as,
					ReadonlyArray.get(n),
					Either.fromOption(() => ParseResult.type(ast, n, 'Not an allowed value'))
				)
		);

/**
 * @category URL constructor
 */

/*const urlArbitrary = (): Arbitrary.Arbitrary<URL> => (fc) => fc.webUrl().map((s) => new URL(s));
const urlPretty = (): Pretty.Pretty<URL> => (url: URL) => `new URL(${url.toJSON()})`;
const urlEquivalence: Equivalence.Equivalence<URL> = Equivalence.mapInput(Equivalence.string, (url) =>
	url.toJSON()
);*/

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
// See Schema.DateFromSelf for a model
/*export const UrlFromSelf: Schema.Schema<URL> = Schema.declare(
	[],
	Schema.struct({}),
	() => (u, _, ast) =>
		MFunction.isUrl(u) ? ParseResult.success(u) : ParseResult.failure(ParseResult.type(ast, u)),
	{
		[AST.IdentifierAnnotationId]: 'Url',
		[Pretty.PrettyHookId]: urlPretty,
		[Arbitrary.ArbitraryHookId]: urlArbitrary,
		[SEquivalence.EquivalenceHookId]: () => urlEquivalence
	}
);*/

// Filters
// String filters
// MAKE IT A BRANDED TYPE
/**
 * String filter that ensures the given string represents a date
 *
 * @param f - The format of the expected date (see luxon)
 *
 */
/*export const date = (f: string) =>
	Schema.filter<string>((s) => DateTime.fromFormat(s, f).isValid, {
		message: () => `Not a string that represents a '${f}' formatted date`
	});*/

/**
 * String filter that restricts possible values to a set of strings
 *
 * @param a - An array of A's
 * @param f - A function that takes an A and the input strings and that returns true if A is an allowed value for s
 *
 */
export const inArray = (a: ReadonlyArray<string>) =>
	Schema.filter<string>((s) => ReadonlyArray.contains(a, s), {
		message: () => 'Not one of the allowed values'
	});

// Array filters
/**
 * Array filter that validates only arrays with no duplicate lines
 *
 * @param isEquivalent - Function that returns true when two A's are considered equal and false otherwise
 *
 */
/*export const noDups = <C>(isEquivalent: (self: C, that: C) => boolean) =>
	Schema.filter<ReadonlyArray<C>>(
		(a) => pipe(a, ReadonlyArray.dedupeWith(isEquivalent), (a1) => a1.length === a.length),
		{
			message: () => 'No duplicates allowed'
		}
	);*/

// Transformers
/**
 * Transforms a schema<'YYYY-MM-DD',T> to a  schema<'YYYYMMDD',T>
 *
 * @param fromIso - the schema<'YYYY-MM-DD',T> schema.
 *
 */
/*export const schemaFromIsoToSchemaFromYyyymmdd = <T>(fromIso: Schema.Schema<string, T>) =>
	Schema.transform(Schema.string, fromIso, StringUtils.yyyymmdToIso, StringUtils.isoToYyyymmdd);*/

/**
 * Schema that takes a string 'YYYYMMDD' and returns a date.
 *
 */
//export const DateFromYyyymmdd = pipe(Schema.DateFromString, schemaFromIsoToSchemaFromYyyymmdd);

/**
 * Transforms a schema<T,CSVString> to a schema<T,ReadonlyArray<string>.
 * @param sep - the CSV separator.
 */
/*export const schemaToCsvToSchemaToStringArray =
	(sep: string) =>
	<T>(toCSV: Schema.Schema<T, string>) =>
		Schema.transform(toCSV, Schema.array(Schema.string), String.split(sep), ReadonlyArray.join(sep));*/

/**
 * Transforms a string representing a URL to a URL object
 */
/*export const stringToUrl = Schema.transformOrFail(
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
);*/
