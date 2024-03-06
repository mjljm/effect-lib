import * as MReadonlyArray from '#mjljm/effect-lib/ReadonlyArray';
import { Data, Either, Number, Option, Predicate, Tuple, pipe } from 'effect';

const MAX_YEAR = 271_819;

const SECOND_MS = 1_000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const NORMAL_YEAR_MS = 365 * DAY_MS;
const BISEXT_YEAR_MS = NORMAL_YEAR_MS + DAY_MS;
const FOUR_YEARS_MS = BISEXT_YEAR_MS + 3 * NORMAL_YEAR_MS;
const HUNDRED_YEARS_MS = 25 * FOUR_YEARS_MS - DAY_MS;
const FOUR_HUNDRED_YEARS_MS = 4 * HUNDRED_YEARS_MS + DAY_MS;
const YEAR_START_2001_MS = 978_307_200_000;

const normalYearMsInMonth = [
	0,
	31 * DAY_MS,
	59 * DAY_MS,
	90 * DAY_MS,
	120 * DAY_MS,
	151 * DAY_MS,
	181 * DAY_MS,
	212 * DAY_MS,
	243 * DAY_MS,
	273 * DAY_MS,
	304 * DAY_MS,
	334 * DAY_MS
];

const leapYearMsInMonth = [
	0,
	31 * DAY_MS,
	60 * DAY_MS,
	91 * DAY_MS,
	121 * DAY_MS,
	152 * DAY_MS,
	182 * DAY_MS,
	213 * DAY_MS,
	244 * DAY_MS,
	274 * DAY_MS,
	305 * DAY_MS,
	335 * DAY_MS
];

const normalYearDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const leapYearDaysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export interface Components {
	readonly year: number;
	// range:1-366
	readonly ordinalDay: number;
	// range:1-12
	readonly month: number;
	//range:1-31
	readonly monthDay: number;
	// range:1-53
	readonly isoWeek: number;
	// range:1-7, 1 is monday, 7 is sunday
	readonly weekDay: number;
	// range:0-23
	readonly hour24: number;
	// range:0-11
	readonly hour12: number;
	// meridiem offset in hours (0 for 'AM', 12 for 'PM')
	readonly meridiem: number;
	// range:0-59
	readonly minute: number;
	// range:0-59
	readonly second: number;
	// range:0-999
	readonly millisecond: number;
	// in hours
	readonly timeZoneOffset: number;
	readonly nbDaysInYear: number;
	readonly nbDaysInMonth: number;
	readonly nbIsoWeeksInYear: number;
}

export type ComponentTag = keyof Components;

export class ComponentError extends Data.TaggedError('ComponentError')<{
	// Tag of the component that had an error
	readonly tag: ComponentTag;
	// Actual value of the component
	readonly actual: number;
	// Minimal value accepted
	readonly min: number;
	// Maximal value accepted
	readonly max: number;
}> {}

const makeComponentError = (
	tag: ComponentTag,
	actual: number,
	min: number,
	max: number
): Either.Either<number, ComponentError> =>
	pipe(
		actual,
		Option.liftPredicate(Predicate.and(Number.greaterThanOrEqualTo(min), Number.lessThanOrEqualTo(max))),
		Either.fromOption(() => new ComponentError({ tag, actual, min, max }))
	);

/**
 * returns the number of days in a year
 */
const getNbDaysInYear = (isLeapYear: boolean): number => (isLeapYear ? 366 : 365);

/**
 * Calculates the week day of a timestamp. Calculation is based on the fact that 1/1/1970 was a thursday. This calculation could be optimized because the first day of ISO week of year y is the same as this of year y + 400
 */
const getWeekDay = (timestamp: number): number => {
	const weekDay0 = Math.floor(timestamp / DAY_MS) % 7;
	return weekDay0 === 0 ? 7 : weekDay0;
};

/**
 * Offset in ms between the 1st day of the year and the first day of the first iso week of the year
 */
const getFirstIsoWeekMs = (firstDayOfYearWeekDay: number): number => (4 - firstDayOfYearWeekDay) * DAY_MS;

/**
 * Calculates the number of iso weeks in a year
 */
const getNbIsoWeeksInYear = (firstDayOfYearWeekDay: number, isLeapYear: boolean): number =>
	firstDayOfYearWeekDay === 4 || (firstDayOfYearWeekDay === 3 && isLeapYear) ? 53 : 52;

/**
 * Decompose a timestamp in a Date.Components
 */
export const timestampToDateComponents = (timestamp: number): Components => {
	const offset = timestamp - YEAR_START_2001_MS;
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
	const yearStartMs = offset + offset400Years + offset100Years + offset4Years + offset1Year;

	let month0 = 11;
	let monthStartMs = 0;
	const [daysInMonth, msInMonth] = isLeapYear
		? [leapYearDaysInMonth, leapYearMsInMonth]
		: [normalYearDaysInMonth, normalYearMsInMonth];
	for (; month0 >= 0; month0--) {
		monthStartMs = pipe(msInMonth, MReadonlyArray.unsafeGet(month0));
		if (monthStartMs <= r1Year) break;
	}

	const monthDayMs = r1Year - monthStartMs;
	const monthDay0 = Math.floor(monthDayMs / DAY_MS);
	const hour24Ms = monthDayMs - monthDay0 * DAY_MS;
	const hour24 = Math.floor(hour24Ms / HOUR_MS);
	const [meridiem, hour12] = hour24 >= 12 ? [12, hour24 - 12] : [0, hour24];
	const minuteMs = hour24Ms - hour24 * HOUR_MS;
	const minute = Math.floor(minuteMs / MINUTE_MS);
	const secondMs = minuteMs - minute * MINUTE_MS;
	const second = Math.floor(secondMs / SECOND_MS);
	const millisecond = secondMs - second * SECOND_MS;

	const firstDayOfYearWeekDay = getWeekDay(yearStartMs);
	const firstIsoWeekMs = getFirstIsoWeekMs(firstDayOfYearWeekDay);
	const isoWeekOffset = r1Year - firstIsoWeekMs;
	const isoWeek0 = Math.floor(isoWeekOffset / WEEK_MS);
	return {
		year,
		ordinalDay: 1 + Math.floor(r1Year / DAY_MS),
		month: month0 + 1,
		monthDay: monthDay0 + 1,
		isoWeek: isoWeek0 + 1,
		weekDay: 1 + Math.floor((isoWeekOffset - isoWeek0 * WEEK_MS) / DAY_MS),
		hour24,
		hour12,
		meridiem,
		minute,
		second,
		millisecond,
		timeZoneOffset: 0,
		nbDaysInYear: getNbDaysInYear(isLeapYear),
		nbDaysInMonth: pipe(daysInMonth, MReadonlyArray.unsafeGet(month0)),
		nbIsoWeeksInYear: getNbIsoWeeksInYear(firstDayOfYearWeekDay, isLeapYear)
	};
};

/**
 * Returns the timestamp of the first day of year `year` and whether this year is a leap year or not
 */
const yearToMs = (year: number): Either.Either<[yearStartMs: number, isLeapYear: boolean], ComponentError> =>
	Either.gen(function* (_) {
		// 2001 is the start of a 400-year period whose last year is bissextile
		const offset = (yield* _(makeComponentError('year', year, -MAX_YEAR, MAX_YEAR))) - 2001;
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

		return Tuple.make(
			YEAR_START_2001_MS +
				q400Years * FOUR_HUNDRED_YEARS_MS +
				q100Years * HUNDRED_YEARS_MS +
				q4Years * FOUR_YEARS_MS +
				r4Years * NORMAL_YEAR_MS,
			isLeapYear
		);
	});

/**
 * Calculates the timestamp of ordinal day `OrdinalDay` of year y
 */
export const yearOrdinalDayToMs = (year: number, ordinalDay: number): Either.Either<number, ComponentError> =>
	Either.gen(function* (_) {
		const [yearStartMs, isLeapYear] = yield* _(yearToMs(year));
		const ordinalDay0 = (yield* _(makeComponentError('month', ordinalDay, 1, nbDaysInYear(isLeapYear)))) - 1;
		return yearStartMs + ordinalDay0 * DAY_MS;
	});

/**
 * Calculates the timestamp of date `year`/`month`/`day`
 */
export const yearMonthDayToMs = (
	year: number,
	month: number,
	monthDay: number
): Either.Either<number, ComponentError> =>
	Either.gen(function* (_) {
		const [yearStartMs, isLeapYear] = yield* _(yearToMs(year));
		const month0 = (yield* _(makeComponentError('month', month, 1, 12))) - 1;
		const [daysInMonth, msInMonth] = isLeapYear
			? [leapYearDaysInMonth, leapYearMsInMonth]
			: [normalYearDaysInMonth, normalYearMsInMonth];
		const monthStartMs = pipe(msInMonth, MReadonlyArray.unsafeGet(month0));
		const nbDaysInMonth = pipe(daysInMonth, MReadonlyArray.unsafeGet(month0));
		const monthDay0 = (yield* _(makeComponentError('monthDay', monthDay, 1, nbDaysInMonth))) - 1;
		return yearStartMs + monthStartMs + monthDay0 * DAY_MS;
	});

/**
 * Calculates the timestamp of week day `weekDay` of Iso week `isoWeek` of year `year`
 */
export const yearIsoWeekDayToMs = (
	year: number,
	isoWeek: number,
	weekDay: number
): Either.Either<number, ComponentError> =>
	Either.gen(function* (_) {
		const [yearStartMs, isLeapYear] = yield* _(yearToMs(year));
		const firstDayOfYearWeekDay = getWeekDay(yearStartMs);
		const firstIsoWeekMs = getFirstIsoWeekMs(firstDayOfYearWeekDay);
		const nbIsoWeeksInYear = getNbIsoWeeksInYear(firstDayOfYearWeekDay, isLeapYear);
		const isoWeek0 = (yield* _(makeComponentError('isoWeek', isoWeek, 1, nbIsoWeeksInYear))) - 1;
		const weekDay0 = (yield* _(makeComponentError('weekDay', weekDay, 1, 7))) - 1;

		return yearStartMs + firstIsoWeekMs + isoWeek0 * WEEK_MS + weekDay0 * DAY_MS;
	});

/**
 * Converts hours to milliseconds
 */
export const hour24ToMs = (hour24: number): Either.Either<number, ComponentError> =>
	Either.map(makeComponentError('hour24', hour24, 0, 23), (hour) => hour * HOUR_MS);

/**
 * Converts minutes to milliseconds
 */
export const minuteToMs = (minute: number): Either.Either<number, ComponentError> =>
	Either.map(makeComponentError('minute', minute, 0, 59), (minute) => minute * MINUTE_MS);

/**
 * Converts seconds to milliseconds
 */
export const secondToMs = (second: number): Either.Either<number, ComponentError> =>
	Either.map(makeComponentError('second', second, 0, 59), (second) => second * SECOND_MS);

/**
 * Converts a timezone offset expressed in hours to UTC milliseconds
 */
export const timeZoneOffsetToMs = (timeZoneOffset: number): Either.Either<number, ComponentError> =>
	Either.right(-timeZoneOffset * HOUR_MS);
