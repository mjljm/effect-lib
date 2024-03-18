import { MBadArgumentError, MEither } from '#mjljm/effect-lib/index';
import { JsPatches } from '@mjljm/js-lib';
import { Either, Number, Predicate, pipe } from 'effect';

const moduleTag = '@mjljm/effect-lib/effect/date/';

/**
 * Model
 */
interface MonthDescriptor {
	readonly nbDaysInMonth: number;
	readonly monthStartMs: number;
}

type Months = ReadonlyArray<MonthDescriptor>;

/**
 * Constants
 */
const MAX_FULL_YEAR_OFFSET = 273_789;
const MAX_FULL_YEAR = 1970 + MAX_FULL_YEAR_OFFSET;
const MIN_FULL_YEAR = 1970 - MAX_FULL_YEAR_OFFSET - 1;
const MAX_TIMESTAMP = 8_639_977_881_599_999;
const MIN_TIMESTAMP = -MAX_TIMESTAMP - 1;

const SECOND_MS = 1_000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const NORMAL_YEAR_MS = 365 * DAY_MS;
const LEAP_YEAR_MS = NORMAL_YEAR_MS + DAY_MS;
const NORMAL_ISO_YEAR_MS = NORMAL_YEAR_MS - DAY_MS;
const LONG_ISO_YEAR_MS = NORMAL_ISO_YEAR_MS + WEEK_MS;
const BISEXT_YEAR_MS = NORMAL_YEAR_MS + DAY_MS;
const FOUR_YEARS_MS = BISEXT_YEAR_MS + 3 * NORMAL_YEAR_MS;
const HUNDRED_YEARS_MS = 25 * FOUR_YEARS_MS - DAY_MS;
const FOUR_HUNDRED_YEARS_MS = 4 * HUNDRED_YEARS_MS + DAY_MS;
const YEAR_START_2001_MS = 978_307_200_000;
const normalYearMonths: Months = [
	{ nbDaysInMonth: 31, monthStartMs: 2678400000 },
	{ nbDaysInMonth: 28, monthStartMs: 5097600000 },
	{ nbDaysInMonth: 31, monthStartMs: 7776000000 },
	{ nbDaysInMonth: 30, monthStartMs: 10368000000 },
	{ nbDaysInMonth: 31, monthStartMs: 13046400000 },
	{ nbDaysInMonth: 30, monthStartMs: 15638400000 },
	{ nbDaysInMonth: 31, monthStartMs: 18316800000 },
	{ nbDaysInMonth: 31, monthStartMs: 20995200000 },
	{ nbDaysInMonth: 30, monthStartMs: 23587200000 },
	{ nbDaysInMonth: 31, monthStartMs: 26265600000 },
	{ nbDaysInMonth: 30, monthStartMs: 28857600000 },
	{ nbDaysInMonth: 31, monthStartMs: 31536000000 }
];
const leapYearMonths = [
	{ nbDaysInMonth: 31, monthStartMs: 2678400000 },
	{ nbDaysInMonth: 29, monthStartMs: 5184000000 },
	{ nbDaysInMonth: 31, monthStartMs: 7862400000 },
	{ nbDaysInMonth: 30, monthStartMs: 10454400000 },
	{ nbDaysInMonth: 31, monthStartMs: 13132800000 },
	{ nbDaysInMonth: 30, monthStartMs: 15724800000 },
	{ nbDaysInMonth: 31, monthStartMs: 18403200000 },
	{ nbDaysInMonth: 31, monthStartMs: 21081600000 },
	{ nbDaysInMonth: 30, monthStartMs: 23673600000 },
	{ nbDaysInMonth: 31, monthStartMs: 26352000000 },
	{ nbDaysInMonth: 30, monthStartMs: 28944000000 },
	{ nbDaysInMonth: 31, monthStartMs: 31622400000 }
];

/**
 * Calculates the week day of a timestamp. Calculation is based on the fact that 4/1/1970 was a sunday.
 */
export const getWeekDay = (timestamp: number): number => {
	const weekDay0 = JsPatches.intModulo(7)(Math.floor(timestamp / DAY_MS - 3));
	return weekDay0 === 0 ? 7 : weekDay0;
};

/**
 * Returns a right of value if value >=min and value <=max. Returns an error otherwise
 */
const checkRange = (
	label: string,
	value: number,
	min: number,
	max: number
): Either.Either<number, MBadArgumentError.OutOfRange> =>
	pipe(
		value,
		MEither.liftPredicate(
			Predicate.and(Number.greaterThanOrEqualTo(min), Number.lessThanOrEqualTo(max)),
			() =>
				new MBadArgumentError.OutOfRange({
					id: label,
					moduleTag,
					functionName: 'checkRange',
					actual: value,
					min,
					max
				})
		)
	);

/**
 * Returns the timestamp of the first day of year `year` at 00:00:00:000+00:00 (yearStartMs), the same timestamp modulo 400 years (yearStartMsModulo400Y), and whether the year is a leap year (isLeapYear). No input parameter check!
 */
export const unsafeYearToMs = (
	year: number
): { yearStartMs: number; yearStartMsModulo400Y: number; isLeapYear: boolean } => {
	// 2001 is the start of a 400-year period whose last year is bissextile
	const offset = year - 2001;
	const q400Years = Math.floor(offset / 400);
	const offset400Years = q400Years * 400;
	const r400Years = offset - offset400Years;
	const q100Years = Math.floor(r400Years / 100);
	const offset100Years = q100Years * 100;
	const r100Years = r400Years - offset100Years;
	const q4Years = Math.floor(r100Years / 4);
	const offset4Years = q4Years * 4;
	const r4Years = r100Years - offset4Years;

	const isLeapYear = r4Years === 3 && (r100Years !== 99 || r400Years === 399);
	//module7Ms is the same as Ms modulo 7. This is based on the fact that any week day of year y is the same as this of year y + 400
	const yearStartMsModulo400Y = q100Years * HUNDRED_YEARS_MS + q4Years * FOUR_YEARS_MS + r4Years * NORMAL_YEAR_MS;

	return {
		yearStartMs: q400Years * FOUR_HUNDRED_YEARS_MS + yearStartMsModulo400Y,
		yearStartMsModulo400Y,
		isLeapYear
	};
};

/**
 * Same as unsafeYearToMs but with input parameter check
 */
export const yearToMs = (
	year: number
): Either.Either<
	{ yearStartMs: number; yearStartMsModulo400Y: number; isLeapYear: boolean },
	MBadArgumentError.OutOfRange
> => pipe(checkRange('year', year, MIN_FULL_YEAR, MAX_FULL_YEAR), Either.map(unsafeYearToMs));

/**
 * Returns the year corresponding to a timestamp. Also returns the timestamp of the first day of the year (yearStartMs), the same timestamp modulo 400 years (yearStartMsModulo400Y), whether the year is a leap year (isLeapYear) and the remaining milliseconds (remainsMs). No input parameter check!
 */
export const unsafeMsToYear = (
	ms: number
): {
	year: number;
	yearStartMs: number;
	yearStartMsModulo400Y: number;
	isLeapYear: boolean;
	remainsMs: number;
} => {
	const offset = ms - YEAR_START_2001_MS;
	const q400Years = Math.floor(offset / FOUR_HUNDRED_YEARS_MS);
	const offset400Years = q400Years * FOUR_HUNDRED_YEARS_MS;
	const r400Years = offset - offset400Years;
	const q100Years = Math.floor(r400Years / HUNDRED_YEARS_MS);
	const offset100Years = q100Years * HUNDRED_YEARS_MS;
	const r100Years = r400Years - offset100Years;
	const q4Years = Math.floor(r100Years / FOUR_YEARS_MS);
	const offset4Years = q4Years * FOUR_YEARS_MS;
	const r4Years = r100Years - offset4Years;
	const q1Year = Math.floor(r4Years / NORMAL_YEAR_MS);
	const offset1Year = q1Year * NORMAL_YEAR_MS;
	const r1Year = r4Years - offset1Year;
	const year = 2001 + 400 * q400Years + 100 * q100Years + 4 * q4Years + q1Year;
	const isLeapYear = q1Year === 3 && (q4Years !== 24 || q100Years === 3);
	const yearStartMsModulo400Y = YEAR_START_2001_MS + offset100Years + offset4Years + offset1Year;

	return {
		year,
		yearStartMs: yearStartMsModulo400Y + offset400Years,
		yearStartMsModulo400Y,
		isLeapYear,
		remainsMs: r1Year
	};
};

/**
 * Same as unsafeMsToYear but with input parameter check
 */
export const msToYear = (
	ms: number
): Either.Either<
	{ year: number; yearStartMs: number; yearStartMsModulo400Y: number; isLeapYear: boolean; remainsMs: number },
	MBadArgumentError.OutOfRange
> => pipe(checkRange('timestamp', ms, MIN_TIMESTAMP, MAX_TIMESTAMP), Either.map(unsafeMsToYear));

/**
 * returns the number of days in a year
 */
export const getNbDaysInYear = (isLeapYear: boolean): number => (isLeapYear ? 366 : 365);

/**
 * Returns the difference between the timestamp of the first day of a year at 00:00:00:000+00:00 and the timestamp of ordinal day `ordinalDay` of year `year` at 00:00:00:000+00:00. No input parameter check!
 */
export const unsafeOrdinalDayToMs = (ordinalDay: number): number => {
	return (ordinalDay - 1) * DAY_MS;
};

/**
 * Same as unsafeOrdinalDayToMs but with input parameter check
 */
export const ordinalDayToMs = (
	ordinalDay: number,
	isLeapYear: boolean
): Either.Either<number, MBadArgumentError.OutOfRange> =>
	pipe(checkRange('year day', ordinalDay, 1, getNbDaysInYear(isLeapYear)), Either.map(unsafeOrdinalDayToMs));

/**
 * Takes an offset in milliseconds from the start of the year at 00:00:00:000+00:00. Returns the correspondong ordinalDay and the remaining milliseconds (remainsMs). No input parameter check!
 */
export const unsafeMsToOrdinalDay = (ms: number): { ordinalDay: number; remainsMs: number } => {
	const ordinalDay0 = Math.floor(ms / DAY_MS);
	return {
		ordinalDay: ordinalDay0 + 1,
		remainsMs: ms - ordinalDay0 * DAY_MS
	};
};

/**
 * Same as unsafeMsToOrdinalDay but with input parameter check
 */
export const msToOrdinalDay = (ms: number, isLeapYear: boolean) =>
	pipe(
		checkRange('infrayear millisecond offset', ms, 0, (isLeapYear ? LEAP_YEAR_MS : NORMAL_YEAR_MS) - 1),
		Either.map(unsafeMsToOrdinalDay)
	);

/**
 * Returns the difference between the timestamp of the first day of a year at 00:00:00:000+00:00 and the timestamp of date `year`/`month`/`monthDay` at 00:00:00:000+00:00. No input parameter check!
 */
export const unsafeMonthAndMonthDayToMs = (month: number, monthDay: number, isLeapYear: boolean): number => {
	const monthDescriptor = (isLeapYear ? leapYearMonths : normalYearMonths)[month - 1] as MonthDescriptor;
	return monthDescriptor.monthStartMs + (monthDay - 1) * DAY_MS;
};

/**
 * Same as unsafeMonthAndMonthDayToMs but with input parameter check
 */
export const monthAndMonthDayToMs = (
	month: number,
	monthDay: number,
	isLeapYear: boolean
): Either.Either<number, MBadArgumentError.OutOfRange> =>
	Either.gen(function* (_) {
		const checkedMonth = yield* _(checkRange('month', month, 1, 12));
		const monthDescriptor = (isLeapYear ? leapYearMonths : normalYearMonths)[checkedMonth - 1] as MonthDescriptor;
		const checkedDay = yield* _(checkRange('monthDay', monthDay, 1, monthDescriptor.nbDaysInMonth));
		return monthDescriptor.monthStartMs + (checkedDay - 1) * DAY_MS;
	});

/**
 * Takes an offset in milliseconds from the start of the year at 00:00:00:000+00:00 and whether the year is a leap year. Returns the correspondong month. Also returns the offset in milliseconds between the start of the year at 00:00:00:000+00:00 and the start of the month at 00:00:00:000+00:00 (monthStartMs), the number of days in the month (nbDaysInMonth) and the remaining milliseconds (remainsMs). No input parameter check!
 */
export const unsafeMsToMonth = (
	ms: number,
	isLeapYear: boolean
): { month: number; monthStartMs: number; nbDaysInMonth: number; remainsMs: number } => {
	const months = isLeapYear ? leapYearMonths : normalYearMonths;
	// Raw coding for performance sake
	let month0 = 11;
	let monthStartMs;
	let month = months[month0] as MonthDescriptor;

	do {
		monthStartMs = month.monthStartMs;
		if (monthStartMs <= ms) break;
		month = months[--month0] as MonthDescriptor;
	} while (month0 >= 1);

	return {
		month: month0 + 1,
		monthStartMs,
		nbDaysInMonth: month.nbDaysInMonth,
		remainsMs: ms - monthStartMs
	};
};

/**
 * Same as unsafeMsToMonth but with input parameter check
 */
export const msToMonth = (
	ms: number,
	isLeapYear: boolean
): Either.Either<
	{ month: number; monthStartMs: number; nbDaysInMonth: number; remainsMs: number },
	MBadArgumentError.OutOfRange
> =>
	pipe(
		checkRange('infrayear millisecond offset', ms, 0, (isLeapYear ? LEAP_YEAR_MS : NORMAL_YEAR_MS) - 1),
		Either.map((checkedMs) => unsafeMsToMonth(checkedMs, isLeapYear))
	);

/**
 * Takes an offset in milliseconds from the start of the month at 00:00:00:000+00:00. Returns the correspondong monthDay and the remaining milliseconds (remainsMs). No input parameter check!
 */
export const unsafeMsToMonthDay = (ms: number): { monthDay: number; remainsMs: number } => {
	const monthDay0 = Math.floor(ms / DAY_MS);
	return {
		monthDay: monthDay0 + 1,
		remainsMs: ms - monthDay0 * DAY_MS
	};
};

/**
 * Same as unsafeMsToMonthDay but with input parameter check
 */
export const msToMonthDay = (
	ms: number,
	monthStartMs: number,
	nextMonthStartMs: number
): Either.Either<{ monthDay: number; remainsMs: number }, MBadArgumentError.OutOfRange> =>
	pipe(
		checkRange('inframonth millisecond offset', ms, 0, nextMonthStartMs - monthStartMs - 1),
		Either.map(unsafeMsToMonthDay)
	);

/**
 * Offset in ms between the 1st day of the year at 00:00:00:000+00:00 and the first day of the first iso week of the year at 00:00:00:000+00:00. No input parameters check!
 */
export const unsafeGetFirstIsoWeekMs = (firstDayOfYearWeekDay: number): number =>
	(firstDayOfYearWeekDay <= 4 ? 1 - firstDayOfYearWeekDay : 8 - firstDayOfYearWeekDay) * DAY_MS;

/**
 * Determines if an iso year is long (53 weeks) or short (52 weeks)
 */
export const unsafeIsLongIsoYear = (firstDayOfYearWeekDay: number, isLeapYear: boolean): boolean =>
	firstDayOfYearWeekDay === 4 || (firstDayOfYearWeekDay === 3 && isLeapYear);

/**
 * Calculates the number of iso weeks in a year. No input parameters check!
 */
export const unsafeGetNbIsoWeeksInYear = (firstDayOfYearWeekDay: number, isLeapYear: boolean): number =>
	unsafeIsLongIsoYear(firstDayOfYearWeekDay, isLeapYear) ? 53 : 52;

/**
 * Returns the difference between the timestamp of the first day of a year at 00:00:00:000+00:00 and the timestamp of day `weekDay` of iso week `isoWeek` at 00:00:00:000+00:00. No input parameter check!
 */
export const unsafeWeekAndWeekDayToMs = (isoWeek: number, weekDay: number, yearStartMs: number): number =>
	unsafeGetFirstIsoWeekMs(getWeekDay(yearStartMs)) + (isoWeek - 1) * WEEK_MS + (weekDay - 1) * DAY_MS;

/**
 * Same as unsafeWeekAndWeekDayToMs but with input parameter check
 */
export const weekAndWeekDayToMs = (
	isoWeek: number,
	weekDay: number,
	yearStartMs: number,
	isLeapYear: boolean
): Either.Either<number, MBadArgumentError.OutOfRange> =>
	Either.gen(function* (_) {
		const firstDayOfYearWeekDay = getWeekDay(yearStartMs);
		const checkedIsoWeek = yield* _(
			checkRange('week number', isoWeek, 1, unsafeGetNbIsoWeeksInYear(firstDayOfYearWeekDay, isLeapYear))
		);
		const checkedWeekDay = yield* _(checkRange('weekDay', weekDay, 1, 7));
		return (
			unsafeGetFirstIsoWeekMs(firstDayOfYearWeekDay) +
			(checkedIsoWeek - 1) * WEEK_MS +
			(checkedWeekDay - 1) * DAY_MS
		);
	});

/**
 * Takes an offset in milliseconds from the start of the year at 00:00:00:000+00:00 and the timestamp of the start of the year at 00:00:00:000+00:00. Returns the correspondong isoWeek and the remaining milliseconds (remainsMs). No input parameter check!
 */
export const unsafeMsToIsoWeek = (ms: number, yearStartMs: number): { isoWeek: number; remainsMs: number } => {
	const isoWeek0 = Math.floor((ms - unsafeGetFirstIsoWeekMs(getWeekDay(yearStartMs))) / WEEK_MS);

	return {
		isoWeek: isoWeek0 + 1,
		remainsMs: ms - isoWeek0 * WEEK_MS
	};
};

/**
 * Same as unsafeMsToIsoWeek but with input parameter check
 */
export const msToIsoWeek = (
	ms: number,
	yearStartMs: number,
	isLeapYear: boolean
): Either.Either<{ isoWeek: number; remainsMs: number }, MBadArgumentError.OutOfRange> =>
	pipe(
		checkRange(
			'infra iso year millisecond offset',
			ms,
			0,
			(unsafeIsLongIsoYear(getWeekDay(yearStartMs), isLeapYear) ? LONG_ISO_YEAR_MS : NORMAL_ISO_YEAR_MS) - 1
		),
		Either.map((checkedMs) => unsafeMsToIsoWeek(checkedMs, yearStartMs))
	);

/**
 * Takes an offset in milliseconds from the start of the week at 00:00:00:000+00:00. Returns the correspondong weekDay and the remaining milliseconds (remainsMs). No input parameter check!
 */
export const unsafeMsToWeekDay = (ms: number): { weekDay: number; remainsMs: number } => {
	const weekDay0 = Math.floor(ms / DAY_MS);
	return {
		weekDay: weekDay0 + 1,
		remainsMs: ms - weekDay0 * DAY_MS
	};
};

/**
 * Same as unsafeMsToWeekDay but with input parameter check
 */
export const msToWeekDay = (ms: number) =>
	pipe(checkRange('infraweek millisecond offset', ms, 0, WEEK_MS - 1), Either.map(unsafeMsToMonthDay));

/**
 * Converts an hour24 to milliseconds. No input parameter check!
 */
export const unsafeHour24ToMs = (hour24: number): number => {
	return hour24 * HOUR_MS;
};

/**
 * Same as unsafeHour24ToMs but with input parameter check
 */
export const hour24ToMs = (hour24: number): Either.Either<number, MBadArgumentError.OutOfRange> =>
	pipe(checkRange('hour in 24-hour format', hour24, 0, 23), Either.map(unsafeHour24ToMs));

/**
 * Takes an offset in milliseconds from the start of a day. Returns the corresponding hour24 and the remaining milliseconds (remainsMs). No input parameter check!
 */
export const unsafeMsToHour24 = (ms: number): { hour24: number; remainsMs: number } => {
	const hour24 = Math.floor(ms / HOUR_MS);

	return {
		hour24,
		remainsMs: ms - hour24 * HOUR_MS
	};
};

/**
 * Same as unsafeMsToHour24 but with input parameter check
 */
export const msToHour24 = (
	ms: number
): Either.Either<{ hour24: number; remainsMs: number }, MBadArgumentError.OutOfRange> =>
	pipe(checkRange('infraday millisecond offset', ms, 0, DAY_MS - 1), Either.map(unsafeMsToHour24));

/**
 * Converts an hour12 and meridiem to milliseconds. No input parameter check!
 */
export const unsafeHour12AndMeridiemToMs = (hour12: number, meridiem: 0 | 12): number => {
	return (hour12 + meridiem) * HOUR_MS;
};

/**
 * Same as unsafeHour12AndMeridiemToMs but with input parameter check
 */
export const hour12AndMeridiemToMs = (
	hour12: number,
	meridiem: 0 | 12
): Either.Either<number, MBadArgumentError.OutOfRange> =>
	pipe(
		checkRange('hour in 12-hour format', hour12, 0, 11),
		Either.map((checkedHour12) => unsafeHour12AndMeridiemToMs(checkedHour12, meridiem))
	);

/**
 * Takes an offset in milliseconds from the start of a day. Returns the corresponding hour12 and meridiem and the remaining milliseconds (remainsMs). No input parameter check!
 */
export const unsafeMsToHour12AndMeridiem = (
	ms: number
): { hour12: number; meridiem: 0 | 12; remainsMs: number } => {
	const { hour24, remainsMs } = unsafeMsToHour24(ms);
	const meridiem = hour24 >= 12 ? 12 : 0;
	return {
		hour12: hour24 - meridiem,
		meridiem,
		remainsMs: remainsMs
	};
};

/**
 * Same as unsafeMsToHour12AndMeridiem but with input parameter check
 */
export const msToHour12AndMeridiem = (
	ms: number
): Either.Either<{ hour12: number; meridiem: 0 | 12; remainsMs: number }, MBadArgumentError.OutOfRange> =>
	pipe(checkRange('infraday millisecond offset', ms, 0, DAY_MS - 1), Either.map(unsafeMsToHour12AndMeridiem));

/**
 * Converts a number of minutes to milliseconds. No input parameter check!
 */
export const unsafeMinuteToMs = (minute: number): number => {
	return minute * MINUTE_MS;
};

/**
 * Same as unsafeMinuteToMs but with input parameter check
 */
export const minuteToMs = (minute: number): Either.Either<number, MBadArgumentError.OutOfRange> =>
	pipe(checkRange('minute', minute, 0, 59), Either.map(unsafeMinuteToMs));

/**
 * Takes an offset in milliseconds from the start of an hour. Returns the corresponding minute and the remaining milliseconds (remainsMs). No input parameter check!
 */
export const unsafeMsToMinute = (ms: number): { minute: number; remainsMs: number } => {
	const minute = Math.floor(ms / MINUTE_MS);

	return {
		minute,
		remainsMs: ms - minute * MINUTE_MS
	};
};

/**
 * Same as unsafeMsToMinute but with input parameter check
 */
export const msToMinute = (
	ms: number
): Either.Either<{ minute: number; remainsMs: number }, MBadArgumentError.OutOfRange> =>
	pipe(checkRange('infrahour millisecond offset', ms, 0, HOUR_MS - 1), Either.map(unsafeMsToMinute));

/**
 * Converts a number of seconds to milliseconds. No input parameter check!
 */
export const unsafeSecondToMs = (second: number): number => {
	return second * SECOND_MS;
};

/**
 * Same as unsafeSecondToMs but with input parameter check
 */
export const secondToMs = (second: number): Either.Either<number, MBadArgumentError.OutOfRange> =>
	pipe(checkRange('second', second, 0, 59), Either.map(unsafeSecondToMs));

/**
 * Takes an offset in milliseconds from the start of a minute. Returns the corresponding second and the remaining milliseconds (remainsMs). No input parameter check!
 */
export const unsafeMsToSecond = (ms: number): { second: number; remainsMs: number } => {
	const second = Math.floor(ms / SECOND_MS);

	return {
		second,
		remainsMs: ms - second * MINUTE_MS
	};
};

/**
 * Same as unsafeMsToSecond but with input parameter check
 */
export const msToSecond = (
	ms: number
): Either.Either<{ second: number; remainsMs: number }, MBadArgumentError.OutOfRange> =>
	pipe(checkRange('inframinute millisecond offset', ms, 0, MINUTE_MS - 1), Either.map(unsafeMsToSecond));

/**
 * Converts a number of milliseconds to milliseconds
 */
export const millisecondToMs = (millisecond: number): Either.Either<number, MBadArgumentError.OutOfRange> =>
	checkRange('millisecond', millisecond, 0, SECOND_MS - 1);

/**
 * Takes an offset in milliseconds from the start of a second. Returns the corresponding millisecond
 */
export const msToMillisecond = (ms: number): Either.Either<number, MBadArgumentError.OutOfRange> =>
	checkRange('infrasecond millisecond offset', ms, 0, SECOND_MS - 1);

/**
 * Converts a timeZoneOffset to milliseconds. No input parameter check!
 */
export const unsafeTimeZoneOffsetToMs = (timeZoneOffset: number): number => -timeZoneOffset * HOUR_MS;

/**
 * Same as unsafeTimeZoneOffsetToMs but with input parameter check
 */
export const timeZoneOffsetToMs = (timeZoneOffset: number): Either.Either<number, MBadArgumentError.OutOfRange> =>
	pipe(checkRange('time zone offset', timeZoneOffset, -12, 14), Either.map(unsafeTimeZoneOffsetToMs));
