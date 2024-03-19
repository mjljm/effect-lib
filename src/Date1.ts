import { Option } from 'effect';

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

/**
 * Model
 */

export interface Type {
	// ms since 1/1/1970 at 00:00:00:000+00:00
	readonly timestamp: Option.Option<number>;
	// range: MIN_FULL_YEAR..MAX_FULL_YEAR
	readonly year: Option.Option<number>;
	// range:1..366
	readonly ordinalDay: Option.Option<number>;
	// range:1..12
	readonly month: Option.Option<number>;
	//range:1..31
	readonly monthDay: Option.Option<number>;
	// range:1..53
	readonly isoWeek: Option.Option<number>;
	// range:1..7, 1 is monday, 7 is sunday
	readonly weekDay: Option.Option<number>;
	// range:0..23
	readonly hour24: Option.Option<number>;
	// range:0..11
	readonly hour12: Option.Option<number>;
	// meridiem offset in hours (0 for 'AM', 12 for 'PM')
	readonly meridiem: Option.Option<0 | 12>;
	// range:0..59
	readonly minute: Option.Option<number>;
	// range:0..59
	readonly second: Option.Option<number>;
	// range:0..999
	readonly millisecond: Option.Option<number>;
	// range: -12..14 in hours
	readonly timeZoneOffset: Option.Option<number>;
	readonly isLeapYear: Option.Option<boolean>;
	// timestamp of the start of the year at 00:00:00:000+00:00
	readonly yearStartMs: Option.Option<number>;
	// same as above but modulo 400 years. Serves for calculation of the week day of the first day of the year as adding 400 years to a date does not change the week day
	readonly yearStartMsModulo400Y: Option.Option<number>;
	readonly firstDayOfYearWeekDay: Option.Option<number>;
	// time in ms between the start of the year at 00:00:00:000+00:00 and the start of the first iso week of the year at 00:00:00:000+00:00
	readonly firstIsoWeekOffsetMs: Option.Option<number>;
	// time in ms between the start of the year at 00:00:00:000+00:00 and the start of the month at 00:00:00:000+00:00
	readonly monthStartMs: Option.Option<number>;
	// time in ms between the start of the first iso week of the year at 00:00:00:000+00:00 and the start of the week at 00:00:00:000+00:00
	readonly isoWeekStartMs: Option.Option<number>;
	// timestamp of the current day at 00:00:00:000+00:00
	readonly dayMs: Option.Option<number>;
	// time in ms between the start of the day at 00:00:00:000+00:00 and the start of the hour at 00:00:000+00:00
	readonly hourMs: Option.Option<number>;
	// time in ms between the start of the hour at 00:00:000+00:00 and the start of the minute at 00:000+00:00
	readonly minuteMs: Option.Option<number>;
	// time in ms between the start of the minute at 00:000+00:00 and the start of the second at 000+00:00
	readonly secondMs: Option.Option<number>;
	readonly millisecondMs: Option.Option<number>;
	// time in ms between 1/1/1970 at 00:00:00:000+00:00 and 1/1/1970 at 00:00:00:000 in the specified time zone
	readonly timeZoneOffsetMs: Option.Option<number>;
}

export const makeFromTimestamp = (timestamp: number): Type => ({
	timestamp: Option.some(timestamp),
	year: Option.none(),
	ordinalDay: Option.none(),
	month: Option.none(),
	monthDay: Option.none(),
	isoWeek: Option.none(),
	weekDay: Option.none(),
	hour24: Option.none(),
	hour12: Option.none(),
	meridiem: Option.none(),
	minute: Option.none(),
	second: Option.none(),
	millisecond: Option.none(),
	timeZoneOffset: Option.none(),
	isLeapYear: Option.none(),
	yearStartMs: Option.none(),
	yearStartMsModulo400Y: Option.none(),
	firstDayOfYearWeekDay: Option.none(),
	firstIsoWeekOffsetMs: Option.none(),
	monthStartMs: Option.none(),
	isoWeekStartMs: Option.none(),
	dayMs: Option.none(),
	hourMs: Option.none(),
	minuteMs: Option.none(),
	secondMs: Option.none(),
	millisecondMs: Option.none(),
	timeZoneOffsetMs: Option.none()
});

export const setYear =
	(year: number) =>
	(self: Type): Type => ({
		timestamp: Option.none(),
		year: Option.some(year),
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
		timeZoneOffset: self.timeZoneOffset,
		isLeapYear: Option.none(),
		yearStartMs: Option.none(),
		yearStartMsModulo400Y: Option.none(),
		firstDayOfYearWeekDay: Option.none(),
		firstIsoWeekOffsetMs: Option.none(),
		monthStartMs: Option.none(),
		isoWeekStartMs: self.isoWeekStartMs,
		dayMs: Option.none(),
		hourMs: self.hourMs,
		minuteMs: self.minuteMs,
		secondMs: self.secondMs,
		millisecondMs: self.millisecondMs,
		timeZoneOffsetMs: self.timeZoneOffsetMs
	});

export const setOrdinalDay =
	(ordinalDay: number) =>
	(self: Type): Type => ({
		timestamp: Option.none(),
		year: self.year,
		ordinalDay: Option.some(ordinalDay),
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
		timeZoneOffset: self.timeZoneOffset,
		isLeapYear: self.isLeapYear,
		yearStartMs: self.yearStartMs,
		yearStartMsModulo400Y: self.yearStartMsModulo400Y,
		firstDayOfYearWeekDay: self.firstDayOfYearWeekDay,
		firstIsoWeekOffsetMs: self.firstIsoWeekOffsetMs,
		monthStartMs: self.monthStartMs,
		isoWeekStartMs: self.isoWeekStartMs,
		dayMs: Option.none(),
		hourMs: self.hourMs,
		minuteMs: self.minuteMs,
		secondMs: self.secondMs,
		millisecondMs: self.millisecondMs,
		timeZoneOffsetMs: self.timeZoneOffsetMs
	});

export const setMonth =
	(month: number) =>
	(self: Type): Type => ({
		timestamp: Option.none(),
		year: self.year,
		ordinalDay: self.ordinalDay,
		month: Option.some(month),
		monthDay: self.monthDay,
		isoWeek: self.isoWeek,
		weekDay: self.weekDay,
		hour24: self.hour24,
		hour12: self.hour12,
		meridiem: self.meridiem,
		minute: self.minute,
		second: self.second,
		millisecond: self.millisecond,
		timeZoneOffset: self.timeZoneOffset,
		isLeapYear: self.isLeapYear,
		yearStartMs: self.yearStartMs,
		yearStartMsModulo400Y: self.yearStartMsModulo400Y,
		firstDayOfYearWeekDay: self.firstDayOfYearWeekDay,
		firstIsoWeekOffsetMs: self.firstIsoWeekOffsetMs,
		monthStartMs: Option.none(),
		isoWeekStartMs: self.isoWeekStartMs,
		dayMs: Option.none(),
		hourMs: self.hourMs,
		minuteMs: self.minuteMs,
		secondMs: self.secondMs,
		millisecondMs: self.millisecondMs,
		timeZoneOffsetMs: self.timeZoneOffsetMs
	});

export const setMonthDay =
	(monthDay: number) =>
	(self: Type): Type => ({
		timestamp: Option.none(),
		year: self.year,
		ordinalDay: self.ordinalDay,
		month: self.month,
		monthDay: Option.some(monthDay),
		isoWeek: self.isoWeek,
		weekDay: self.weekDay,
		hour24: self.hour24,
		hour12: self.hour12,
		meridiem: self.meridiem,
		minute: self.minute,
		second: self.second,
		millisecond: self.millisecond,
		timeZoneOffset: self.timeZoneOffset,
		isLeapYear: self.isLeapYear,
		yearStartMs: self.yearStartMs,
		yearStartMsModulo400Y: self.yearStartMsModulo400Y,
		firstDayOfYearWeekDay: self.firstDayOfYearWeekDay,
		firstIsoWeekOffsetMs: self.firstIsoWeekOffsetMs,
		monthStartMs: self.monthStartMs,
		isoWeekStartMs: self.isoWeekStartMs,
		dayMs: Option.none(),
		hourMs: self.hourMs,
		minuteMs: self.minuteMs,
		secondMs: self.secondMs,
		millisecondMs: self.millisecondMs,
		timeZoneOffsetMs: self.timeZoneOffsetMs
	});

export const setIsoWeek =
	(isoWeek: number) =>
	(self: Type): Type => ({
		timestamp: Option.none(),
		year: self.year,
		ordinalDay: self.ordinalDay,
		month: self.month,
		monthDay: self.monthDay,
		isoWeek: Option.some(isoWeek),
		weekDay: self.weekDay,
		hour24: self.hour24,
		hour12: self.hour12,
		meridiem: self.meridiem,
		minute: self.minute,
		second: self.second,
		millisecond: self.millisecond,
		timeZoneOffset: self.timeZoneOffset,
		isLeapYear: self.isLeapYear,
		yearStartMs: self.yearStartMs,
		yearStartMsModulo400Y: self.yearStartMsModulo400Y,
		firstDayOfYearWeekDay: self.firstDayOfYearWeekDay,
		firstIsoWeekOffsetMs: self.firstIsoWeekOffsetMs,
		monthStartMs: self.monthStartMs,
		isoWeekStartMs: Option.none(),
		dayMs: Option.none(),
		hourMs: self.hourMs,
		minuteMs: self.minuteMs,
		secondMs: self.secondMs,
		millisecondMs: self.millisecondMs,
		timeZoneOffsetMs: self.timeZoneOffsetMs
	});

export const setWeekDay =
	(weekDay: number) =>
	(self: Type): Type => ({
		timestamp: Option.none(),
		year: self.year,
		ordinalDay: self.ordinalDay,
		month: self.month,
		monthDay: self.monthDay,
		isoWeek: self.isoWeek,
		weekDay: Option.some(weekDay),
		hour24: self.hour24,
		hour12: self.hour12,
		meridiem: self.meridiem,
		minute: self.minute,
		second: self.second,
		millisecond: self.millisecond,
		timeZoneOffset: self.timeZoneOffset,
		isLeapYear: self.isLeapYear,
		yearStartMs: self.yearStartMs,
		yearStartMsModulo400Y: self.yearStartMsModulo400Y,
		firstDayOfYearWeekDay: self.firstDayOfYearWeekDay,
		firstIsoWeekOffsetMs: self.firstIsoWeekOffsetMs,
		monthStartMs: self.monthStartMs,
		isoWeekStartMs: self.isoWeekStartMs,
		dayMs: Option.none(),
		hourMs: self.hourMs,
		minuteMs: self.minuteMs,
		secondMs: self.secondMs,
		millisecondMs: self.millisecondMs,
		timeZoneOffsetMs: self.timeZoneOffsetMs
	});

export const setHour24 =
	(hour24: number) =>
	(self: Type): Type => ({
		timestamp: Option.none(),
		year: self.year,
		ordinalDay: self.ordinalDay,
		month: self.month,
		monthDay: self.monthDay,
		isoWeek: self.isoWeek,
		weekDay: self.weekDay,
		hour24: Option.some(hour24),
		hour12: self.hour12,
		meridiem: self.meridiem,
		minute: self.minute,
		second: self.second,
		millisecond: self.millisecond,
		timeZoneOffset: self.timeZoneOffset,
		isLeapYear: self.isLeapYear,
		yearStartMs: self.yearStartMs,
		yearStartMsModulo400Y: self.yearStartMsModulo400Y,
		firstDayOfYearWeekDay: self.firstDayOfYearWeekDay,
		firstIsoWeekOffsetMs: self.firstIsoWeekOffsetMs,
		monthStartMs: self.monthStartMs,
		isoWeekStartMs: self.isoWeekStartMs,
		dayMs: self.dayMs,
		hourMs: Option.none(),
		minuteMs: self.minuteMs,
		secondMs: self.secondMs,
		millisecondMs: self.millisecondMs,
		timeZoneOffsetMs: self.timeZoneOffsetMs
	});

export const setHour12 =
	(hour12: number) =>
	(self: Type): Type => ({
		timestamp: Option.none(),
		year: self.year,
		ordinalDay: self.ordinalDay,
		month: self.month,
		monthDay: self.monthDay,
		isoWeek: self.isoWeek,
		weekDay: self.weekDay,
		hour24: self.hour24,
		hour12: Option.some(hour12),
		meridiem: self.meridiem,
		minute: self.minute,
		second: self.second,
		millisecond: self.millisecond,
		timeZoneOffset: self.timeZoneOffset,
		isLeapYear: self.isLeapYear,
		yearStartMs: self.yearStartMs,
		yearStartMsModulo400Y: self.yearStartMsModulo400Y,
		firstDayOfYearWeekDay: self.firstDayOfYearWeekDay,
		firstIsoWeekOffsetMs: self.firstIsoWeekOffsetMs,
		monthStartMs: self.monthStartMs,
		isoWeekStartMs: self.isoWeekStartMs,
		dayMs: self.dayMs,
		hourMs: Option.none(),
		minuteMs: self.minuteMs,
		secondMs: self.secondMs,
		millisecondMs: self.millisecondMs,
		timeZoneOffsetMs: self.timeZoneOffsetMs
	});

export const setMeridiem =
	(meridiem: 0 | 12) =>
	(self: Type): Type => ({
		timestamp: Option.none(),
		year: self.year,
		ordinalDay: self.ordinalDay,
		month: self.month,
		monthDay: self.monthDay,
		isoWeek: self.isoWeek,
		weekDay: self.weekDay,
		hour24: self.hour24,
		hour12: self.hour12,
		meridiem: Option.some(meridiem),
		minute: self.minute,
		second: self.second,
		millisecond: self.millisecond,
		timeZoneOffset: self.timeZoneOffset,
		isLeapYear: self.isLeapYear,
		yearStartMs: self.yearStartMs,
		yearStartMsModulo400Y: self.yearStartMsModulo400Y,
		firstDayOfYearWeekDay: self.firstDayOfYearWeekDay,
		firstIsoWeekOffsetMs: self.firstIsoWeekOffsetMs,
		monthStartMs: self.monthStartMs,
		isoWeekStartMs: self.isoWeekStartMs,
		dayMs: self.dayMs,
		hourMs: Option.none(),
		minuteMs: self.minuteMs,
		secondMs: self.secondMs,
		millisecondMs: self.millisecondMs,
		timeZoneOffsetMs: self.timeZoneOffsetMs
	});

export const setMinute =
	(minute: number) =>
	(self: Type): Type => ({
		timestamp: Option.none(),
		year: self.year,
		ordinalDay: self.ordinalDay,
		month: self.month,
		monthDay: self.monthDay,
		isoWeek: self.isoWeek,
		weekDay: self.weekDay,
		hour24: self.hour24,
		hour12: self.hour12,
		meridiem: self.meridiem,
		minute: Option.some(minute),
		second: self.second,
		millisecond: self.millisecond,
		timeZoneOffset: self.timeZoneOffset,
		isLeapYear: self.isLeapYear,
		yearStartMs: self.yearStartMs,
		yearStartMsModulo400Y: self.yearStartMsModulo400Y,
		firstDayOfYearWeekDay: self.firstDayOfYearWeekDay,
		firstIsoWeekOffsetMs: self.firstIsoWeekOffsetMs,
		monthStartMs: self.monthStartMs,
		isoWeekStartMs: self.isoWeekStartMs,
		dayMs: self.dayMs,
		hourMs: self.hourMs,
		minuteMs: Option.none(),
		secondMs: self.secondMs,
		millisecondMs: self.millisecondMs,
		timeZoneOffsetMs: self.timeZoneOffsetMs
	});

export const setSecond =
	(second: number) =>
	(self: Type): Type => ({
		timestamp: Option.none(),
		year: self.year,
		ordinalDay: self.ordinalDay,
		month: self.month,
		monthDay: self.monthDay,
		isoWeek: self.isoWeek,
		weekDay: self.weekDay,
		hour24: self.hour24,
		hour12: self.hour12,
		meridiem: self.meridiem,
		minute: self.minute,
		second: Option.some(second),
		millisecond: self.millisecond,
		timeZoneOffset: self.timeZoneOffset,
		isLeapYear: self.isLeapYear,
		yearStartMs: self.yearStartMs,
		yearStartMsModulo400Y: self.yearStartMsModulo400Y,
		firstDayOfYearWeekDay: self.firstDayOfYearWeekDay,
		firstIsoWeekOffsetMs: self.firstIsoWeekOffsetMs,
		monthStartMs: self.monthStartMs,
		isoWeekStartMs: self.isoWeekStartMs,
		dayMs: self.dayMs,
		hourMs: self.hourMs,
		minuteMs: self.minuteMs,
		secondMs: Option.none(),
		millisecondMs: self.millisecondMs,
		timeZoneOffsetMs: self.timeZoneOffsetMs
	});

export const setMillisecond =
	(millisecond: number) =>
	(self: Type): Type => ({
		timestamp: Option.none(),
		year: self.year,
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
		millisecond: Option.some(millisecond),
		timeZoneOffset: self.timeZoneOffset,
		isLeapYear: self.isLeapYear,
		yearStartMs: self.yearStartMs,
		yearStartMsModulo400Y: self.yearStartMsModulo400Y,
		firstDayOfYearWeekDay: self.firstDayOfYearWeekDay,
		firstIsoWeekOffsetMs: self.firstIsoWeekOffsetMs,
		monthStartMs: self.monthStartMs,
		isoWeekStartMs: self.isoWeekStartMs,
		dayMs: self.dayMs,
		hourMs: self.hourMs,
		minuteMs: self.minuteMs,
		secondMs: self.secondMs,
		millisecondMs: Option.none(),
		timeZoneOffsetMs: self.timeZoneOffsetMs
	});

export const setTimeZoneOffset =
	(timeZoneOffset: number) =>
	(self: Type): Type => ({
		timestamp: Option.none(),
		year: self.year,
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
		isLeapYear: self.isLeapYear,
		yearStartMs: self.yearStartMs,
		yearStartMsModulo400Y: self.yearStartMsModulo400Y,
		firstDayOfYearWeekDay: self.firstDayOfYearWeekDay,
		firstIsoWeekOffsetMs: self.firstIsoWeekOffsetMs,
		monthStartMs: self.monthStartMs,
		isoWeekStartMs: self.isoWeekStartMs,
		dayMs: self.dayMs,
		hourMs: self.hourMs,
		minuteMs: self.minuteMs,
		secondMs: self.secondMs,
		millisecondMs: self.millisecondMs,
		timeZoneOffsetMs: Option.none()
	});
