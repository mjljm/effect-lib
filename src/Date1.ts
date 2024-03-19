import { MBadArgumentError } from '#mjljm/effect-lib/index';
import { JsPatches } from '@mjljm/js-lib';
import { Cause, Either, Function, Option, pipe } from 'effect';

const moduleTag = '@mjljm/effect-lib/effect/Date/';

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

// time in ms between the start of the year at 00:00:00:000+00:00 and the start of the month at 00:00:00:000+00:00
//readonly monthStartMs: number;
//readonly firstDayOfYearWeekDay: Option.Option<number>;
// time in ms between the start of the year at 00:00:00:000+00:00 and the start of the first iso week of the year at 00:00:00:000+00:00
//readonly firstIsoWeekOffsetMs: Option.Option<number>;
// time in ms between the start of the first iso week of the year at 00:00:00:000+00:00 and the start of the week at 00:00:00:000+00:00
//readonly isoWeekStartMs: Option.Option<number>;

/**
 * Model
 */
export interface YearData {
	// range: MIN_FULL_YEAR..MAX_FULL_YEAR
	readonly year: number;
	readonly isLeapYear: boolean;
	// timestamp of the start of the year at 00:00:00:000+00:00
	readonly yearStartMs: number;
	// same as above but modulo 400 years. Serves for calculation of the week day of the first day of the year as adding 400 years to a date does not change the week day
	readonly yearStartMsModulo400Y: number;
}

/**
 * Model
 */
export interface MonthAndMonthDayData {
	// range:1..12
	readonly month: number;
	//range:1..31
	readonly monthDay: number;
}

/**
 * Model
 */
export interface WeekAndWeekDayData {
	// range:1..53
	readonly isoWeek: number;
	// range:1..7, 1 is monday, 7 is sunday
	readonly weekDay: number;
}

/**
 * Model
 */
export interface Hour12AndMeridiem {
	// range:0..11
	readonly hour12: number;
	// meridiem offset in hours (0 for 'AM', 12 for 'PM')
	readonly meridiem: 0 | 12;
}

/**
 * Model
 */
export interface Type {
	// ms since 1/1/1970 at 00:00:00:000+00:00
	readonly timestamp: Option.Option<number>;
	readonly yearData: Option.Option<YearData>;
	// range:1..366
	readonly ordinalDay: Option.Option<number>;
	readonly monthAndMonthDayData: Option.Option<MonthAndMonthDayData>;
	readonly weekAndWeekDayData: Option.Option<WeekAndWeekDayData>;
	// range:0..23
	readonly hour24: Option.Option<number>;
	readonly hour12AndMeridiem: Option.Option<Hour12AndMeridiem>;
	// range:0..59
	readonly minute: Option.Option<number>;
	// range:0..59
	readonly second: Option.Option<number>;
	// range:0..999
	readonly millisecond: Option.Option<number>;
	// range: -12..14 in hours
	readonly timeZoneOffset: Option.Option<number>;
	// timestamp of the current day at 00:00:00:000+00:00
	readonly dayMs: Option.Option<number>;
	// time in ms between the start of the day at 00:00:00:000+00:00 and the start of the hour at 00:00:000+00:00
	readonly hourMs: Option.Option<number>;
	// time in ms between the start of the hour at 00:00:000+00:00 and the start of the minute at 00:000+00:00
	readonly minuteMs: Option.Option<number>;
	// time in ms between the start of the minute at 00:000+00:00 and the start of the second at 000+00:00
	readonly secondMs: Option.Option<number>;
	// time in ms between 1/1/1970 at 00:00:00:000+00:00 and 1/1/1970 at 00:00:00:000 in the specified time zone
	readonly timeZoneOffsetMs: Option.Option<number>;
}

/**
 * returns the number of days in a year
 */
const getNbDaysInYear = (isLeapYear: boolean): number => (isLeapYear ? 366 : 365);

/**
 * Calculates the week day of a timestamp. Calculation is based on the fact that 4/1/1970 was a sunday.
 */
const getWeekDay = (timestamp: number): number => {
	const weekDay0 = JsPatches.intModulo(7)(Math.floor(timestamp / DAY_MS - 3));
	return weekDay0 === 0 ? 7 : weekDay0;
};

/**
 * Offset in ms between the 1st day of the year at 00:00:00:000+00:00 and the first day of the first iso week of the year at 00:00:00:000+00:00. No input parameters check!
 */
const unsafeGetFirstIsoWeekMs = (firstDayOfYearWeekDay: number): number =>
	(firstDayOfYearWeekDay <= 4 ? 1 - firstDayOfYearWeekDay : 8 - firstDayOfYearWeekDay) * DAY_MS;

/**
 * Determines if an iso year is long (53 weeks) or short (52 weeks). No input parameters check!
 */
const unsafeIsLongIsoYear = (firstDayOfYearWeekDay: number, isLeapYear: boolean): boolean =>
	firstDayOfYearWeekDay === 4 || (firstDayOfYearWeekDay === 3 && isLeapYear);

/**
 * Calculates the number of iso weeks in a year. No input parameters check!
 */
const unsafeGetNbIsoWeeksInYear = (firstDayOfYearWeekDay: number, isLeapYear: boolean): number =>
	unsafeIsLongIsoYear(firstDayOfYearWeekDay, isLeapYear) ? 53 : 52;

/**
 * Calculates yearData from a year. No input parameters check
 */
const unsafeCalcYearData = (year: number): YearData => {
	// 2001 is the start of a 400-year period whose last year is bissextile
	const offset2001 = year - 2001;
	const q400Years = Math.floor(offset2001 / 400);
	const offset400Years = q400Years * 400;
	const r400Years = offset2001 - offset400Years;
	const q100Years = Math.floor(r400Years / 100);
	const offset100Years = q100Years * 100;
	const r100Years = r400Years - offset100Years;
	const q4Years = Math.floor(r100Years / 4);
	const offset4Years = q4Years * 4;
	const r4Years = r100Years - offset4Years;

	const isLeapYear = r4Years === 3 && (r100Years !== 99 || r400Years === 399);
	const yearStartMsModulo400Y = q100Years * HUNDRED_YEARS_MS + q4Years * FOUR_YEARS_MS + r4Years * NORMAL_YEAR_MS;
	const yearStartMs = q400Years * FOUR_HUNDRED_YEARS_MS + yearStartMsModulo400Y;

	return {
		year,
		isLeapYear,
		yearStartMs,
		yearStartMsModulo400Y
	};
};

/**
 * Calculates yearData from a year
 */
const calcYearData = (year: number): Either.Either<YearData, MBadArgumentError.OutOfRange> =>
	pipe(
		MBadArgumentError.checkRange({
			actual: year,
			min: MIN_FULL_YEAR,
			max: MAX_FULL_YEAR,
			id: 'year',
			moduleTag,
			functionName: 'setYear'
		}),
		Either.map(unsafeCalcYearData)
	);

/**
 * Creates an empty Date
 */
export const empty = (): Type => ({
	timestamp: Option.none(),
	yearData: Option.none(),
	ordinalDay: Option.none(),
	monthAndMonthDayData: Option.none(),
	weekAndWeekDayData: Option.none(),
	hour24: Option.none(),
	hour12AndMeridiem: Option.none(),
	minute: Option.none(),
	second: Option.none(),
	millisecond: Option.none(),
	timeZoneOffset: Option.none(),
	dayMs: Option.none(),
	hourMs: Option.none(),
	minuteMs: Option.none(),
	secondMs: Option.none(),
	timeZoneOffsetMs: Option.none()
});

/**
 * Creates a date from a timestamp. No input parameters check
 */
export const unsafeMakeFromTimestamp = (timestamp: number, timeZoneOffset: number): Type => {
	const timeZoneOffsetMs = -timeZoneOffset * HOUR_MS;
	// 2001 is the start of a 400-year period whose last year is bissextile
	const offset2001 = timestamp - YEAR_START_2001_MS + timeZoneOffsetMs;

	const q400Years = Math.floor(offset2001 / FOUR_HUNDRED_YEARS_MS);
	const offset400Years = q400Years * FOUR_HUNDRED_YEARS_MS;
	const r400Years = offset2001 - offset400Years;

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
	const yearStartMs = yearStartMsModulo400Y + offset400Years;

	const ordinalDay0 = Math.floor(r1Year / DAY_MS);
	const offsetOrdinalDay = ordinalDay0 * DAY_MS;
	const dayMs = yearStartMs + offsetOrdinalDay;
	const rOrdinalDay0 = r1Year - offsetOrdinalDay;

	const hour24 = Math.floor(rOrdinalDay0 / HOUR_MS);
	const hourMs = hour24 * HOUR_MS;
	const rHour24 = rOrdinalDay0 - hourMs;

	const minute = Math.floor(rHour24 / MINUTE_MS);
	const minuteMs = minute * MINUTE_MS;
	const rMinute = rHour24 - minuteMs;

	const second = Math.floor(rMinute / SECOND_MS);
	const secondMs = second * SECOND_MS;
	const millisecond = rMinute - secondMs;

	return {
		...empty(),
		timestamp: Option.some(timestamp),
		yearData: Option.some({
			year,
			isLeapYear,
			yearStartMs: yearStartMs - timeZoneOffsetMs,
			yearStartMsModulo400Y: yearStartMsModulo400Y - timeZoneOffsetMs
		}),
		ordinalDay: Option.some(ordinalDay0 + 1),
		hour24: Option.some(hour24),
		minute: Option.some(minute),
		second: Option.some(second),
		millisecond: Option.some(millisecond),
		dayMs: Option.some(dayMs - timeZoneOffsetMs),
		hourMs: Option.some(hourMs),
		minuteMs: Option.some(minuteMs),
		secondMs: Option.some(secondMs),
		timeZoneOffsetMs: Option.some(timeZoneOffsetMs)
	};
};

/**
 * Creates a date from a timestamp.
 */
export const makeFromTimestamp = (
	timestamp: number,
	timeZoneOffset: number
): Either.Either<Type, MBadArgumentError.OutOfRange> =>
	Either.gen(function* (_) {
		const checkedTimestamp = yield* _(
			MBadArgumentError.checkRange({
				actual: timestamp,
				min: MIN_TIMESTAMP,
				max: MAX_TIMESTAMP,
				id: 'timestamp',
				moduleTag,
				functionName: 'makeFromTimestamp'
			})
		);
		const checkedTimeZoneOffset = yield* _(
			MBadArgumentError.checkRange({
				actual: timeZoneOffset,
				min: -12,
				max: 14,
				id: 'timeZoneOffset',
				moduleTag,
				functionName: 'makeFromTimestamp'
			})
		);
		return unsafeMakeFromTimestamp(checkedTimestamp, checkedTimeZoneOffset);
	});

/**
 * Returns a copy of self with ordinalDay set to the passed value. No input parameters check
 */
export const unsafeSetYearAndOrdinalDay =
	(year: number, ordinalDay: number) =>
	(self: Type): Type => {
		const yearData = unsafeCalcYearData(year);
		return {
			...self,
			timestamp: Option.none(),
			yearData: Option.some(yearData),
			ordinalDay: Option.some(ordinalDay),
			monthAndMonthDayData: Option.none(),
			weekAndWeekDayData: Option.none(),
			dayMs: Option.some(yearData.yearStartMs + (ordinalDay - 1) * DAY_MS)
		};
	};

/**
 * Returns a copy of self with ordinalDay set to the passed value.
 */
export const setYearAndOrdinalDay =
	(year: number, ordinalDay: number) =>
	(self: Type): Either.Either<Type, MBadArgumentError.OutOfRange> =>
		Either.gen(function* (_) {
			const checkedYearData = yield* _(calcYearData(year));
			const checkedOrdinalDay = yield* _(
				MBadArgumentError.checkRange({
					actual: ordinalDay,
					min: 1,
					max: getNbDaysInYear(checkedYearData.isLeapYear),
					id: 'ordinalDay',
					moduleTag,
					functionName: 'setYearAndOrdinalDay'
				})
			);
			return {
				...self,
				timestamp: Option.none(),
				yearData: Option.some(checkedYearData),
				ordinalDay: Option.some(checkedOrdinalDay),
				monthAndMonthDayData: Option.none(),
				weekAndWeekDayData: Option.none(),
				dayMs: Option.some(checkedYearData.yearStartMs + (checkedOrdinalDay - 1) * DAY_MS)
			};
		});

/**
 * Returns a copy of self with month and monthDay set to the passed values. No input parameters check
 */
export const unsafeSetYearMonthAndMonthDay =
	(year: number, month: number, monthDay: number) =>
	(self: Type): Type => {
		const yearData = unsafeCalcYearData(year);
		const monthDescriptor = (yearData.isLeapYear ? leapYearMonths : normalYearMonths)[
			month - 1
		] as MonthDescriptor;
		return {
			...self,
			timestamp: Option.none(),
			yearData: Option.some(yearData),
			ordinalDay: Option.none(),
			monthAndMonthDayData: Option.some({
				month,
				monthDay
			}),
			weekAndWeekDayData: Option.none(),
			dayMs: Option.some(yearData.yearStartMs + monthDescriptor.monthStartMs + (monthDay - 1) * DAY_MS)
		};
	};

/**
 * Returns a copy of self with month and monthDay set to the passed values.
 */
export const setYearMonthAndMonthDay =
	(year: number, month: number, monthDay: number) =>
	(self: Type): Either.Either<Type, MBadArgumentError.OutOfRange> =>
		Either.gen(function* (_) {
			const checkedYearData = yield* _(calcYearData(year));
			const checkedMonth = yield* _(
				MBadArgumentError.checkRange({
					actual: month,
					min: 1,
					max: 12,
					id: 'month',
					moduleTag,
					functionName: 'setYearMonthAndMonthDay'
				})
			);
			const checkedMonthDescriptor = (checkedYearData.isLeapYear ? leapYearMonths : normalYearMonths)[
				checkedMonth - 1
			] as MonthDescriptor;
			const checkedMonthDay = yield* _(
				MBadArgumentError.checkRange({
					actual: monthDay,
					min: 1,
					max: checkedMonthDescriptor.nbDaysInMonth,
					id: 'monthDay',
					moduleTag,
					functionName: 'setYearMonthAndMonthDay'
				})
			);
			return {
				...self,
				timestamp: Option.none(),
				yearData: Option.some(checkedYearData),
				ordinalDay: Option.none(),
				monthAndMonthDayData: Option.some({
					month: checkedMonth,
					monthDay: checkedMonthDay
				}),
				weekAndWeekDayData: Option.none(),
				dayMs: Option.some(
					checkedYearData.yearStartMs + checkedMonthDescriptor.monthStartMs + (checkedMonthDay - 1) * DAY_MS
				)
			};
		});

/**
 * Returns a copy of self with isoWeek and weekDay set to the passed values. No input parameters check
 */
export const unsafeSetYearIsoWeekAndWeekDay =
	(year: number, isoWeek: number, weekDay: number) =>
	(self: Type): Type => {
		const yearData = unsafeCalcYearData(year);

		return {
			...self,
			timestamp: Option.none(),
			yearData: Option.some(yearData),
			ordinalDay: Option.none(),
			monthAndMonthDayData: Option.none(),
			weekAndWeekDayData: Option.some({ isoWeek, weekDay }),
			dayMs: Option.some(
				yearData.yearStartMs +
					unsafeGetFirstIsoWeekMs(getWeekDay(yearData.yearStartMsModulo400Y)) +
					(isoWeek - 1) * WEEK_MS +
					(weekDay - 1) * DAY_MS
			)
		};
	};

/**
 * Returns a copy of self with isoWeek and weekDay set to the passed values.
 */
export const setYearIsoWeekAndWeekDay =
	(year: number, isoWeek: number, weekDay: number) =>
	(self: Type): Either.Either<Type, MBadArgumentError.OutOfRange> =>
		Either.gen(function* (_) {
			const checkedYearData = yield* _(calcYearData(year));
			const firstDayOfYearWeekDay = getWeekDay(checkedYearData.yearStartMsModulo400Y);
			const checkedIsoWeek = yield* _(
				MBadArgumentError.checkRange({
					actual: isoWeek,
					min: 1,
					max: unsafeGetNbIsoWeeksInYear(firstDayOfYearWeekDay, checkedYearData.isLeapYear),
					id: 'isoWeek',
					moduleTag,
					functionName: 'setYearIsoWeekAndWeekDay'
				})
			);
			const checkedWeekDay = yield* _(
				MBadArgumentError.checkRange({
					actual: weekDay,
					min: 1,
					max: 7,
					id: 'weekDay',
					moduleTag,
					functionName: 'setYearIsoWeekAndWeekDay'
				})
			);
			return {
				...self,
				timestamp: Option.none(),
				yearData: Option.some(checkedYearData),
				ordinalDay: Option.none(),
				monthAndMonthDayData: Option.none(),
				weekAndWeekDayData: Option.some({ isoWeek: checkedIsoWeek, weekDay: checkedWeekDay }),
				dayMs: Option.some(
					checkedYearData.yearStartMs +
						unsafeGetFirstIsoWeekMs(firstDayOfYearWeekDay) +
						(checkedIsoWeek - 1) * WEEK_MS +
						(checkedWeekDay - 1) * DAY_MS
				)
			};
		});

/**
 * Returns a copy of self with hour24 set to the passed value. No input parameters check
 */
export const unsafeSetHour24 =
	(hour24: number) =>
	(self: Type): Type => ({
		...self,
		timestamp: Option.none(),
		hour24: Option.some(hour24),
		hour12AndMeridiem: Option.none(),
		hourMs: Option.some(hour24 * HOUR_MS)
	});

/**
 * Returns a copy of self with hour24 set to the passed value.
 */
export const setHour24 =
	(hour24: number) =>
	(self: Type): Either.Either<Type, MBadArgumentError.OutOfRange> =>
		pipe(
			MBadArgumentError.checkRange({
				actual: hour24,
				min: 0,
				max: 23,
				id: 'hour24',
				moduleTag,
				functionName: 'setHour24'
			}),
			Either.map(Function.flip(unsafeSetHour24)(self))
		);

/**
 * Returns a copy of self with hour12 and meridiem set to the passed values. No input parameters check
 */
export const unsafeSetHour12AndMeridiem =
	(hour12: number, meridiem: 0 | 12) =>
	(self: Type): Type => ({
		...self,
		timestamp: Option.none(),
		hour24: Option.none(),
		hour12AndMeridiem: Option.some({ hour12, meridiem }),
		hourMs: Option.some((hour12 + meridiem) * HOUR_MS)
	});

/**
 * Returns a copy of self with hour12 and meridiem set to the passed values.
 */
export const setHour12AndMeridiem =
	(hour12: number, meridiem: 0 | 12) =>
	(self: Type): Either.Either<Type, MBadArgumentError.OutOfRange> =>
		pipe(
			MBadArgumentError.checkRange({
				actual: hour12,
				min: 0,
				max: 11,
				id: 'hour12',
				moduleTag,
				functionName: 'setHour12AndMeridiem'
			}),
			Either.map((checkedHour12) => pipe(self, unsafeSetHour12AndMeridiem(checkedHour12, meridiem)))
		);

/**
 * Returns a copy of self with minute set to the passed value. No input parameters check
 */
export const unsafeSetMinute =
	(minute: number) =>
	(self: Type): Type => ({
		...self,
		timestamp: Option.none(),
		minute: Option.some(minute),
		minuteMs: Option.some(minute * MINUTE_MS)
	});

/**
 * Returns a copy of self with minute set to the passed value.
 */
export const setMinute =
	(minute: number) =>
	(self: Type): Either.Either<Type, MBadArgumentError.OutOfRange> =>
		pipe(
			MBadArgumentError.checkRange({
				actual: minute,
				min: 0,
				max: 59,
				id: 'minute',
				moduleTag,
				functionName: 'setMinute'
			}),
			Either.map(Function.flip(unsafeSetMinute)(self))
		);

/**
 * Returns a copy of self with second set to the passed value. No input parameters check
 */
export const unsafeSetSecond =
	(second: number) =>
	(self: Type): Type => ({
		...self,
		timestamp: Option.none(),
		second: Option.some(second),
		secondMs: Option.some(second * SECOND_MS)
	});

/**
 * Returns a copy of self with second set to the passed value.
 */
export const setSecond =
	(second: number) =>
	(self: Type): Either.Either<Type, MBadArgumentError.OutOfRange> =>
		pipe(
			MBadArgumentError.checkRange({
				actual: second,
				min: 0,
				max: 59,
				id: 'second',
				moduleTag,
				functionName: 'setSecond'
			}),
			Either.map(Function.flip(unsafeSetSecond)(self))
		);

/**
 * Returns a copy of self with millisecond set to the passed value. No input parameters check
 */
export const unsafeSetMillisecond =
	(millisecond: number) =>
	(self: Type): Type => ({
		...self,
		timestamp: Option.none(),
		millisecond: Option.some(millisecond)
	});

/**
 * Returns a copy of self with millisecond set to the passed value.
 */
export const setMillisecond =
	(millisecond: number) =>
	(self: Type): Either.Either<Type, MBadArgumentError.OutOfRange> =>
		pipe(
			MBadArgumentError.checkRange({
				actual: millisecond,
				min: 0,
				max: 999,
				id: 'millisecond',
				moduleTag,
				functionName: 'setMillisecond'
			}),
			Either.map(Function.flip(unsafeSetMillisecond)(self))
		);

export const setTimeZoneOffset =
	(timeZoneOffset: number) =>
	(self: Type): Type => ({
		timestamp: Option.none(),
		yearData: self.yearData,
		ordinalDay: self.ordinalDay,
		month: self.month,
		monthDay: self.monthDay,
		isoWeek: self.isoWeek,
		weekDay: self.weekDay,
		hour24: self.hour24,
		hour12: self.hour12,
		meridiem: self.meridiem,
		minute: self.minute,
		second: self.second,
		millisecond: self.millisecond,
		timeZoneOffset: Option.some(timeZoneOffset),
		firstDayOfYearWeekDay: self.firstDayOfYearWeekDay,
		firstIsoWeekOffsetMs: self.firstIsoWeekOffsetMs,
		monthStartMs: self.monthStartMs,
		isoWeekStartMs: self.isoWeekStartMs,
		dayMs: self.dayMs,
		hourMs: self.hourMs,
		minuteMs: self.minuteMs,
		secondMs: self.secondMs,
		timeZoneOffsetMs: Option.none()
	});

export const getTimeStamp = (self: Type): Either.Either<number, unknown> =>
	pipe(
		self.timestamp,
		Either.fromOption(() => new Cause.NoSuchElementException()),
		Either.orElse(() => 1)
	) as never;
