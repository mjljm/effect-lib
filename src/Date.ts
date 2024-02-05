import * as MString from '#mjljm/effect-lib/String';
import { MFunction, MSchema } from '#mjljm/effect-lib/index';
import { Schema } from '@effect/schema';
import { RegExpUtils, RegExpUtils as _ } from '@mjljm/js-lib';
import { HashMap, Option, ReadonlyArray, ReadonlyRecord, String, pipe } from 'effect';
import { NonEmptyReadonlyArray } from 'effect/ReadonlyArray';

const moduleTag = '@mjljm/effect-lib/Date/';

// Must not contain regular expression special characters
interface TokenStruct<A> {
	y: A; // year
	yy: A; // 2-digit year interpreted as > 1960
	yyyy: A; // 4-digit year
	M: A; // month
	MM: A; // 2-digit month
	MMM: A; // Month as an abbreviated localized string - Must be followed by a non-word character
	MMMM: A; // Month as a unabbreviated localized string - Must be followed by a non-word character
	d: A; // Day of month
	dd: A; // 2-digit day of month
	E: A; //day of the week, as number from 1-7 (Monday is 1, Sunday is 7)
	EEE: A; //day of the week, as an abbreviated localized string - Must be followed by a non-word character
	EEEE: A; //day of the week, as an unabbreviated localized string - Must be followed by a non-word character
	H: A; // 24-hour
	HH: A; // 2-digit 24-hour
	h: A; // 12-hour
	hh: A; // 2-digit 12-hour
	a: A; // Meridiem (ex: 'AM') - Can be uppercase or lowercase
	m: A; // minute
	mm: A; // 2-digit minute
	s: A; // second
	ss: A; // 2-digit second
	S: A; // Millisecond
	SSS: A; // 3-digit millisecond
	Z: A; // Time-zone offset (ex: +5)
	ZZ: A; // Time-zone offset (ex: +5:00)
	ZZZ: A; // Time-zone offset (ex: +0500)
	W: A; // ISO week number
	WW: A; // 2-digit ISO week number
	o: A; // Ordinal day of year
	ooo: A; // 3-digit ordinal day of year
}

type Token = keyof TokenStruct<number>;

type DateFragment =
	| 'y' // Year
	| 'M' // Month
	| 'd' // day of month
	| 'E' // day of week: 1(Monday)-7(Sunday)
	| 'H' // Hour (0-23)
	| 'h' // Hour (0-12)
	| 'a' // Meridiem ['AM','PM']
	| 'm' // Minute
	| 's' // Second
	| 'S' // Millisecond (0-999)
	| 'Z' // UTC offset
	| 'W' // ISO week number
	| 'o'; // Ordinal day of year

interface Locale {
	readonly shortMonths: ReadonlyArray<string>;
	readonly longMonths: ReadonlyArray<string>;
	readonly shortDays: ReadonlyArray<string>;
	readonly longDays: ReadonlyArray<string>;
}

interface TokenDescriptor {
	readonly parsePattern: string;
	readonly parseSchema: Schema.Schema<never, string, number> | Schema.Schema<never, string, string>;
	readonly dateFragment: DateFragment;
}
const TokenDescriptor = MFunction.make<TokenDescriptor>;

const captureWord = _.capture(_.anyWord);
const capturePositiveInteger = _.capture(_.positiveInteger);
const capture2Digits = _.capture(_.digit + _.digit);
const capture3Digits = _.capture(_.digit + _.digit + _.digit);
const capture4Digits = _.capture(_.digit + _.digit + _.digit + _.digit);

// 2-digit years represent years in range 1961...2060
const twoDigitYearFromYear: Schema.Schema<never, number, MSchema.TwoDigitInt> = Schema.transform(
	Schema.number,
	MSchema.twoDigitInt,
	(n) => (n >= 2000 ? n - 2000 : n - 1900),
	(n) => (n <= 60 ? n + 2000 : n + 1900)
);

const yearFromTwoDigitYear: Schema.Schema<never, MSchema.TwoDigitInt, number> =
	MSchema.inverse(twoDigitYearFromYear);

const yearFromTwoDigitYearString: Schema.Schema<never, string, number> = Schema.compose(
	MSchema.twoDigitIntFromString,
	yearFromTwoDigitYear
);

const tokenMapFromLocale = (locale: Locale): HashMap.HashMap<Token, TokenDescriptor> => {
	const tokenStruct: TokenStruct<TokenDescriptor> = {
		y: TokenDescriptor({
			parsePattern: capturePositiveInteger,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'y'
		}),
		yy: TokenDescriptor({
			parsePattern: capture2Digits,
			parseSchema: yearFromTwoDigitYearString,
			dateFragment: 'y'
		}),
		yyyy: TokenDescriptor({
			parsePattern: capture4Digits,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'y'
		}),
		M: TokenDescriptor({
			parsePattern: capturePositiveInteger,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'M'
		}),
		MM: TokenDescriptor({
			parsePattern: capture2Digits,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'M'
		}),
		MMM: TokenDescriptor({
			parsePattern: captureWord,
			parseSchema: pipe(Schema.string, MSchema.index(locale.shortMonths)),
			dateFragment: 'M'
		}),
		MMMM: TokenDescriptor({
			parsePattern: captureWord,
			parseSchema: pipe(Schema.string, MSchema.index(locale.longMonths)),
			dateFragment: 'M'
		}),
		d: TokenDescriptor({
			parsePattern: capturePositiveInteger,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'd'
		}),
		dd: TokenDescriptor({
			parsePattern: capture2Digits,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'd'
		}),
		E: TokenDescriptor({
			parsePattern: capturePositiveInteger,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'E'
		}),
		EEE: TokenDescriptor({
			parsePattern: captureWord,
			parseSchema: pipe(Schema.string, MSchema.index(locale.shortMonths)),
			dateFragment: 'E'
		}),
		EEEE: TokenDescriptor({
			parsePattern: captureWord,
			parseSchema: pipe(Schema.string, MSchema.index(locale.longMonths)),
			dateFragment: 'E'
		}),
		H: TokenDescriptor({
			parsePattern: capturePositiveInteger,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'H'
		}),
		HH: TokenDescriptor({
			parsePattern: capture2Digits,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'H'
		}),
		h: TokenDescriptor({
			parsePattern: capturePositiveInteger,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'h'
		}),
		hh: TokenDescriptor({
			parsePattern: capture2Digits,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'h'
		}),
		a: TokenDescriptor({
			parsePattern: _.capture(_.anyWordLetter + _.anyWordLetter),
			parseSchema: Schema.string,
			dateFragment: 'a'
		}),
		m: TokenDescriptor({
			parsePattern: capturePositiveInteger,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'm'
		}),
		mm: TokenDescriptor({
			parsePattern: capture2Digits,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'm'
		}),
		s: TokenDescriptor({
			parsePattern: capturePositiveInteger,
			parseSchema: Schema.NumberFromString,
			dateFragment: 's'
		}),
		ss: TokenDescriptor({
			parsePattern: capture2Digits,
			parseSchema: Schema.NumberFromString,
			dateFragment: 's'
		}),
		S: TokenDescriptor({
			parsePattern: capturePositiveInteger,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'S'
		}),
		SSS: TokenDescriptor({
			parsePattern: capture3Digits,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'S'
		}),
		Z: TokenDescriptor({
			parsePattern: _.capture(_.sign + _.positiveInteger),
			parseSchema: Schema.NumberFromString,
			dateFragment: 'Z'
		}),
		ZZ: TokenDescriptor({
			parsePattern: _.capture(_.sign + _.positiveInteger) + ':00',
			parseSchema: Schema.NumberFromString,
			dateFragment: 'Z'
		}),
		ZZZ: TokenDescriptor({
			parsePattern: _.capture(_.sign + _.digit + _.digit) + '00',
			parseSchema: Schema.NumberFromString,
			dateFragment: 'Z'
		}),
		W: TokenDescriptor({
			parsePattern: capturePositiveInteger,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'W'
		}),
		WW: TokenDescriptor({
			parsePattern: capture2Digits,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'W'
		}),
		o: TokenDescriptor({
			parsePattern: capturePositiveInteger,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'o'
		}),
		ooo: TokenDescriptor({
			parsePattern: capture3Digits,
			parseSchema: Schema.NumberFromString,
			dateFragment: 'o'
		})
	};

	return pipe(tokenStruct, ReadonlyRecord.toEntries, HashMap.fromIterable);
};

/**
 * Parses a date according to the passed format. If information is missing for one or several date fragments, the values of the current are used.
 * @param format example: yyyy-MM-ddTHH:mm:ssXXX
 * @param locale locale to use to parse the date. If omitted, system locale is used
 * @returns Option.none if self does not match format or is not a valid date. Option.some(date) otherwise
 */

export const parseDate = (format: string, locale?: string): ((self: string) => Option.Option<Date>) => {
	function monthsForLocale(format: 'long' | 'short'): Array<string> {
		const localeIntl = new Intl.DateTimeFormat(locale, { month: format });
		return pipe(
			ReadonlyArray.range(1, 12),
			ReadonlyArray.map((n) => localeIntl.format(new Date(2023, n)))
		);
	}

	function weekDaysForLocale(format: 'long' | 'short'): Array<string> {
		const localeIntl = new Intl.DateTimeFormat(locale, { weekday: format });
		return pipe(
			ReadonlyArray.range(1, 7),
			// October 1st, 2023 is a sunday
			ReadonlyArray.map((n) => localeIntl.format(new Date(2023, 10, n)))
		);
	}

	const shortMonths = monthsForLocale('short');
	const longMonths = monthsForLocale('long');
	const shortDays = weekDaysForLocale('short');
	const longDays = weekDaysForLocale('long');

	const [formatPattern, matchList] = pipe(locale, tokenMapFromLocale);

	MString.replaceMulti(HashMap.map(tokenMap, ({ parsePattern }) => parsePattern))(RegExpUtils.escapeRegex(format));
	const descriptors = ReadonlyArray.map(matchList, (parsePattern) => HashMap.unsafeGet(tokenMap, parsePattern));
	const formatRegExp = new RegExp(formatPattern);

	//const shortMonthNames =

	return (self: string) => {
		const result = pipe(
			self,
			String.match(formatRegExp),
			Option.flatMap(ReadonlyArray.tail),
			Option.flatMap((values) =>
				pipe(
					values,
					ReadonlyArray.zip(descriptors),
					ReadonlyArray.map(([value, { parseValidator }]) => parseValidator(Number(value))),
					Option.all
				)
			)
		);

		if (!matches) return Option.none();
		let year = 0,
			month = 0,
			day = 0,
			hour = 0,
			minute = 0,
			second = 0;
		pipe(
			matches as unknown as NonEmptyReadonlyArray<string>,
			ReadonlyArray.tailNonEmpty,
			ReadonlyArray.zip(operations)
		);

		console.log(formatRegExp);
		console.log(matches);
		console.log(operations);
		return Option.some(new Date());
	};
};
