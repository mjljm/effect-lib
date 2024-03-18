import * as MFunction from '#mjljm/effect-lib/Function';
import { Function, Option, Order, ReadonlyArray, String, pipe } from 'effect';

//const moduleTag = '@mjljm/effect-lib/effect/String/';

export interface SearchResult {
	/** Index of the first letter of the match */
	readonly startIndex: number;
	/** Index of the first letter following the match */
	readonly endIndex: number;
	/** Text of the matched element */
	readonly match: string;
}

export const SearchResult = MFunction.make<SearchResult>;
export const searchResultByStartIndex = Order.mapInput(
	Order.number,
	(searchResult: SearchResult) => searchResult.startIndex
);
export const searchResultByEndIndex = Order.mapInput(
	Order.number,
	(searchResult: SearchResult) => searchResult.endIndex
);
export const searchResultByStartIndexAndReverseEndIndex = Order.combine(
	searchResultByStartIndex,
	Order.reverse(searchResultByEndIndex)
);

/*const overlappingSearchResult = (sR1: SearchResult, sR2: SearchResult) =>
	sR1.startIndex <= sR2.endIndex && sR1.endIndex >= sR2.startIndex;*/

/**
 * Constructor
 */

export const fromNumber = (n: number): string => n.toString();

/**
 * Same as search but returns a SearchResult. You can optionnally provide the index from which to start searching.
 */

export const search =
	(regexp: RegExp | string, startIndex = 0) =>
	(self: string): Option.Option<SearchResult> => {
		if (typeof regexp === 'string') {
			const pos = self.indexOf(regexp, startIndex);
			if (pos === -1) return Option.none();
			return Option.some(SearchResult({ startIndex: pos, endIndex: pos + regexp.length, match: regexp }));
		}
		const target = self.slice(startIndex);
		const result = regexp.exec(target);
		if (result === null) return Option.none();
		const offsetPos = startIndex + result.index;
		const match = result[0];
		return Option.some(SearchResult({ startIndex: offsetPos, endIndex: offsetPos + match.length, match }));
	};

/**
 * Finds all matches and, for each one, returns a SearchResult.
 */
export const searchAll =
	(regexp: RegExp | string) =>
	(self: string): Array<SearchResult> => {
		const result: Array<SearchResult> = [];
		let searchPos = 0;
		for (;;) {
			const searchResultOption = search(regexp, searchPos)(self);
			if (Option.isNone(searchResultOption)) break;
			const searchResult = searchResultOption.value;
			result.push(searchResult);
			searchPos = searchResult.endIndex;
		}
		return result;
	};

/**
 * Same as search but returns the last matching pattern instead of the first. You can optionnally provide the index from which to start searching from right to left.
 */
export const searchRight =
	(regexp: RegExp | string, startIndex = +Infinity) =>
	(self: string): Option.Option<SearchResult> => {
		if (typeof regexp === 'string') {
			const pos = self.lastIndexOf(regexp, startIndex);
			if (pos === -1) return Option.none();
			return Option.some(SearchResult({ startIndex: pos, endIndex: pos + regexp.length, match: regexp }));
		}
		return pipe(
			self,
			searchAll(regexp),
			ReadonlyArray.filter((searchResult) => searchResult.startIndex <= startIndex),
			ReadonlyArray.last
		);
	};

/**
 * Looks from the left for the first substring of self that matches regexp and returns all characters before that substring. If no occurence is found, returns self
 */
export const takeLeftTo =
	(regexp: RegExp | string) =>
	(self: string): string =>
		pipe(
			self,
			String.search(regexp),
			Option.getOrElse(() => self.length),
			(pos) => String.takeLeft(self, pos)
		);
/**
 * Looks from the right for the first substring of self that matches target and returns all characters after that substring. If no occurence is found, returns self.
 */
export const takeRightFrom =
	(regexp: RegExp | string) =>
	(self: string): string =>
		pipe(
			self,
			searchRight(regexp),
			Option.map((searchResult) => searchResult.endIndex),
			Option.getOrElse(() => 0),
			(pos) => String.slice(pos)(self)
		);
/**
 * Returns a some of the result of calling the toString method on obj provided it defines one different from Object.prototype.toString. If toString is not defined or not overloaded, it returns a some of the result of calling the toJson function on obj provided it defines one. If toString and toJson are not defined, returns a none.
 * @param obj
 * @returns
 */
export const tryToStringToJson = (obj: MFunction.Record): Option.Option<string> => {
	const tryApplyingFOnObj = (f: MFunction.Function) => {
		try {
			return pipe(obj, f.apply, Option.liftPredicate(MFunction.isString));
		} catch (e) {
			return Option.none();
		}
	};
	const safeApply = (f: unknown): Option.Option<string> =>
		pipe(f, Option.liftPredicate(MFunction.isFunction), Option.flatMap(tryApplyingFOnObj));
	return pipe(
		obj['toString'],
		Option.liftPredicate((toString) => toString !== Object.prototype.toString),
		Option.flatMap(safeApply),
		Option.orElse(() => safeApply(obj['toJson']))
	);
};

/**
 * Returns the provided `string` `that` if `self` is empty, otherwise returns `self`.
 *
 * @category error handling
 */
export const orElse =
	(that: Function.LazyArg<string>) =>
	(self: string): string =>
		String.isEmpty(self) ? that() : self;

/**
 * Takes all characters from self except the n last characters
 */
export const takeLeftBut =
	(n: number) =>
	(self: string): string =>
		String.takeLeft(self, self.length - n);

/**
 * Takes all characters from self except the n first characters
 */
export const takeRightBut =
	(n: number) =>
	(self: string): string =>
		String.takeRight(self, self.length - n);

/**
 * If self starts with s, returns self stripped of s. Otherwise, returns a none
 */
export const stripLeftOption =
	(s: string) =>
	(self: string): Option.Option<string> =>
		pipe(self, Option.liftPredicate(String.startsWith(s)), Option.map(takeRightBut(s.length)));

/**
 * If self starts with s, returns self stripped of s. Otherwise, returns s
 */
export const stripLeft =
	(s: string) =>
	(self: string): string =>
		pipe(
			self,
			stripLeftOption(s),
			Option.getOrElse(() => s)
		);

/**
 * If self ends with s, returns self stripped of s. Otherwise, returns a none
 */
export const stripRightOption =
	(s: string) =>
	(self: string): Option.Option<string> =>
		pipe(self, Option.liftPredicate(String.endsWith(s)), Option.map(takeLeftBut(s.length)));

/**
 * If self ends with s, returns self stripped of s. Otherwise, returns s
 */
export const stripRight =
	(s: string) =>
	(self: string): string =>
		pipe(
			self,
			stripRightOption(s),
			Option.getOrElse(() => s)
		);

/**
 * Counts the number of occurences of regexp in self.
 */
export const count =
	(regexp: RegExp | string) =>
	(self: string): number =>
		pipe(self, searchAll(regexp), ReadonlyArray.length);

/**
 * Adds a at the start of self
 */
export const prepend =
	(s: string) =>
	(self: string): string =>
		s + self;

/**
 * Replaces the text between startIndex included and endIndex excluded by replacement
 */
export const replaceBetween = (replacement: string, startIndex: number, endIndex: number) => (self: string) =>
	self.substring(0, startIndex) + replacement + self.substring(endIndex);

export const applyRegExp =
	(regexp: RegExp) =>
	(self: string): Option.Option<RegExpExecArray> =>
		pipe(regexp.exec(self), Option.fromNullable);
