import { MReadonlyArray } from '#mjljm/effect-lib/index';
import { Data, Either, Option, ReadonlyArray, ReadonlyRecord, Tuple, pipe } from 'effect';

export const MAX_YEAR = 271_819;

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

const YEAR_LABEL = 'y(year)';

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
	334 * DAY_MS,
	365 * DAY_MS
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
	335 * DAY_MS,
	366 * DAY_MS
];

/**
 * Utilities
 */
const yToMs = (y: number): Either.Either<string, [yearMs: number, isLeapYear: boolean]> =>
	Either.gen(function* (_) {
		if (y < -MAX_YEAR || y > MAX_YEAR)
			yield* _(Either.left(`Actual: ${y}, expected: integer between ${-MAX_YEAR} and ${MAX_YEAR}`));
		// 2001 is the start of a 400-year period whose last year is bissextile
		const offset = y - 2001;
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
 * Model
 */
export interface Type {
	readonly timestamp: Option.Option<number>;
	readonly y: Option.Option<{
		// year
		value: number;
		isLeapYear: boolean;
		// timestamp of the 1st of january of the year containing this date
		yearStartMs: number;
	}>;
	readonly o: Option.Option<{
		// ordinal day (1-366)
		value: number;
	}>;
	readonly M: Option.Option<{
		// month (1-12)
		value: number;
		// difference betweeen the timestamp of the first day of the month containing this date and yearStartMs
		monthStartMs: number;
		// difference betweeen the timestamp of the first day of the month right after the month containing this date and yearStartMs
		nextMonthStartMs: number;
	}>;
	readonly d: Option.Option<{
		// month day (1-31)
		value: number;
	}>;
	readonly W: Option.Option<{
		// ISO week Option.Option<{value:number}> (1-53)
		value: number;
	}>;
	readonly E: Option.Option<{
		// Day of week (1-7, 1 is monday)
		value: number;
	}>;
	readonly H: Option.Option<{
		// hour24 (0-23)
		value: number;
	}>;
	readonly h: Option.Option<{
		// hour12 (0-11)
		value: number;
	}>;
	readonly a: Option.Option<{
		// meridiem offset in hours (0 for 'AM', 12 for 'PM')
		value: number;
	}>;
	readonly m: Option.Option<{
		// minute (0-59)
		value: number;
	}>;
	readonly s: Option.Option<{
		// second (0-59)
		value: number;
	}>;
	readonly S: Option.Option<{
		// millisecond (0-999)
		value: number;
	}>;
	readonly Z: Option.Option<{
		// (time-zone offset in hours)
		value: number;
	}>;
}

type Component = keyof Omit<Type, 'timestamp'>;

export class InvalidComponent extends Data.TaggedError('InvalidComponent')<{
	readonly positions: ReadonlyArray<number>;
	readonly component: Component;
	readonly message: string;
}> {}

export class InvalidComponents extends Data.TaggedError('InvalidComponents')<{
	readonly message: string;
}> {}

const componentDescriptor: Record<Component, { readonly label: string }> = {
	y: { label: 'year' },
	o: { label: 'year day' },
	M: { label: 'month' },
	d: { label: 'day of month' },
	W: { label: 'ISO week number' },
	E: { label: 'weekday' },
	H: { label: 'hour24' },
	h: { label: 'hour12' },
	a: { label: 'meridiem' },
	m: { label: 'minute' },
	s: { label: 'second' },
	S: { label: 'millisecond' },
	Z: { label: 'zone offset' }
};

/**
 * Constructors
 * Builds a date representing 01/01/1970 00:00:00:000+00:00
 */
/*export const initial: Type = {
	y: 1970,
	o: 1,
	M: 1,
	d: 1,
	H: 0,
	h: 0,
	a: 0,
	m: 0,
	s: 0,
	S: 0,
	Z: 0,
	isLeapYear: false,
	yearStartMs: 0,
	monthStartMs: 0,
	nextMonthStartMs: 31 * DAY_MS
};*/

/**
 * Constructors
 * Builds a date representing 01/01/1970 H:00:00:000+00:00
 */
/*export const makeFromHours = (H: number): Either.Either<string, Type> =>
	H >= 0 && H <= 23
		? Either.right({ ...initial, H, h: H >= 12 ? H - 12 : H, a: H >= 12 ? 12 : 0 })
		: Either.left(`actual: ${H}, expected: integer between 0 and 23`);*/

/**
 * Constructors
 * Builds a date representing 01/01/1970 00:m:00:000+00:00
 */
/*export const makeFromMinutes = (m: number): Either.Either<string, Type> =>
	m >= 0 && m <= 59
		? Either.right({ ...initial, m })
		: Either.left(`actual: ${m}, expected: integer between 0 and 59`);*/

/**
 * Constructors
 * Builds a date representing 01/01/1970 00:00:s:000+00:00
 */
/*export const makeFromSeconds = (s: number): Either.Either<string, Type> =>
	s >= 0 && s <= 59
		? Either.right({ ...initial, s })
		: Either.left(`actual: ${s}, expected: integer between 0 and 59`);*/

/**
 * Constructors
 * Builds a date representing 01/01/1970 00:00:s:000+00:00
 */
/*export const makeFromMilliseconds = (S: number): Either.Either<string, Type> =>
	S >= 0 && S <= 999
		? Either.right({ ...initial, S })
		: Either.left(`actual: ${S}, expected: integer between 0 and 999`);*/

/**
 * Constructors
 * Builds a date from a timestamp
 */
export const makeFromTimeStamp = (timestamp: number): Type => ({
	timestamp: Option.some(timestamp),
	y: Option.none(),
	o: Option.none(),
	M: Option.none(),
	d: Option.none(),
	W: Option.none(),
	E: Option.none(),
	H: Option.none(),
	h: Option.none(),
	a: Option.none(),
	m: Option.none(),
	s: Option.none(),
	S: Option.none(),
	Z: Option.none()
});

/**
 * Constructors
 * Tries to build a date from an array of components. Returns an error if any of the components is out of range (e.g M==13), or incoherent (e.g M==1 && W==5) or if the array does not contain enough information to build a date (e.g y not given)
 */
export const fromComponents = (
	components: ReadonlyArray<Component>
): Either.Either<
	InvalidComponents,
	(componentValues: ReadonlyArray<number>) => Either.Either<InvalidComponents | InvalidComponent, Type>
> =>
	Either.gen(function* (_) {
		yield* _(1);
		const positionsByComponent = pipe(
			components,
			ReadonlyArray.map((component, position) => Tuple.make(component, position)),
			MReadonlyArray.groupBy(
				([component]) => component,
				([_, position]) => position
			)
		);

		const findIncoherences = (componentValues: ReadonlyArray<number>) =>
			pipe(
				positionsByComponent,
				ReadonlyRecord.map((positions) =>
					pipe(
						positions,
						ReadonlyArray.map((position) => pipe(componentValues, MReadonlyArray.unsafeGet(position))),
						ReadonlyArray.dedupe
					)
				),
				ReadonlyRecord.filter((dedupedValues) => dedupedValues.length !== 1),
				ReadonlyRecord.map(())
			);

		return (componentValues: ReadonlyArray<number>) =>
			Either.gen(function* (_) {
				if (componentValues.length !== components.length)
					yield* _(
						Either.left(
							new InvalidComponents({
								message: `'componentValues' and 'components' arrays must have the same length`
							})
						)
					);
			});
	}) as never;

/**
 * Constructors
 * Builds a date from a timestamp
 */
export const fromTimeStamp = (timestamp: number): Type => {
	// 2001 is the start of a 400-year period whose last year is bissextile
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

	const y = 2001 + 400 * q400Years + 100 * q100Years + 4 * q4Years + q1Year;
	const isLeapYear = q1Year === 3 && (q4Years !== 24 || q100Years === 3);

	let M = 11;
	let monthStartMs = 0;
	const msInMonth = isLeapYear ? leapYearMsInMonth : normalYearMsInMonth;
	for (; M >= 0; M--) {
		monthStartMs = msInMonth[M] as number;
		if (monthStartMs <= r1Year) break;
	}
	const nextMonthStartMs = msInMonth[M + 1] as number;

	const dMs = r1Year - monthStartMs;
	const d = Math.floor(dMs / DAY_MS);
	const HMs = dMs - d * DAY_MS;
	const H = Math.floor(HMs / HOUR_MS);
	const mMs = HMs - H * HOUR_MS;
	const m = Math.floor(mMs / MINUTE_MS);
	const sMs = mMs - m * MINUTE_MS;
	const s = Math.floor(sMs / SECOND_MS);
	const S = sMs - s * SECOND_MS;

	const yearStartMs = offset + offset400Years + offset100Years + offset4Years + offset1Year;

	// 1/1/1970 was a thursday
	//const firstDayOfYearWeekDay = Math.floor(yearStartMs / DAY_MS) % 7;
	//const firstIsoWeekMs = yearStartMs + (firstDayOfYearWeekDay === 0 ? -3 : 4 - firstDayOfYearWeekDay) * DAY_MS;
	//const isoWeekOffset = timestamp - firstIsoWeekMs;
	//const W = 1 + Math.floor(isoWeekOffset / WEEK_MS);
	//const E = 1 + Math.floor((isoWeekOffset - W * WEEK_MS) / DAY_MS);

	return {
		y,
		o: 1 + Math.floor((timestamp - yearStartMs) / DAY_MS),
		M: M + 1,
		d: d + 1,
		//W: 1 + Math.floor((timestamp - firstIsoWeekMs) / WEEK_MS),
		//E,
		H,
		h: H >= 12 ? H - 12 : H,
		a: H >= 12 ? 12 : 0,
		m,
		s,
		S,
		Z: 0,
		isLeapYear,
		yearStartMs,
		monthStartMs,
		nextMonthStartMs
	};
};
