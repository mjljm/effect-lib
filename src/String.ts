import * as MFunction from '#mjljm/effect-lib/Function';
import { JsRegExp } from '@mjljm/js-lib';
import { Function, HashMap, Option, Order, ReadonlyArray, String, Tuple, pipe } from 'effect';

const moduleTag = '@mjljm/effect-lib/effect/String/';

export interface SearchResult {
	/** Index of the first letter of the match */
	readonly startIndex: number;
	/** Index of the first letter following the match */
	readonly endIndex: number;
	/** Text of the matched element */
	readonly match: string;
}

const SearchResult = MFunction.make<SearchResult>;

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
	const safeApply = (f: unknown): Option.Option<string> => {
		if (MFunction.isFunction(f)) {
			try {
				return pipe(f.apply(obj), Option.liftPredicate(MFunction.isString));
			} catch (e) {
				return Option.none();
			}
		}
		return Option.none();
	};
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
 * If self starts with s, returns self stripped of s. Otherwise, returns s
 */
export const stripLeft =
	(s: string) =>
	(self: string): string =>
		pipe(self, String.startsWith(s)) ? pipe(self, takeRightBut(s.length)) : self;

/**
 * If self ends with s, returns self stripped of s. Otherwise, returns s
 */
export const stripRight =
	(s: string) =>
	(self: string): string =>
		pipe(self, String.endsWith(s)) ? pipe(self, takeLeftBut(s.length)) : self;

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
 * Simple templating function.
 * @param self template that contains tokens to replace
 * @param map map that associates each token to a value A
 * @param f function that projects an A on a string
 * @param locale locale to use to parse the date. If omitted, system locale is used. The locale is used for tokens that output a string like `MMM`, `MMMM`, `EEE`, `EEEE`,...
 * @returns A tuple containing a copy of self where all tokens have been replaced by their projection from the map and an array of the found tokens in the order in which they were found.
 **/

export const replaceMulti = <Pattern extends string, A>(
	map: HashMap.HashMap<Pattern, A>,
	f: (a: A) => string
): ((self: string) => [modified: string, matchList: Array<[Pattern, A]>]) => {
	const searchPattern = new RegExp(
		pipe(
			map,
			HashMap.keys,
			ReadonlyArray.fromIterable,
			// We sort the patterns in reverse order so smaller patterns match after larger ones in which they may be included.
			ReadonlyArray.sort(Order.reverse(Order.string)),
			(arr) => JsRegExp.either(...arr),
			JsRegExp.capture
		),
		'g'
	);
	return (self: string) => {
		const foundPatterns: Array<[Pattern, A]> = [];
		const modified = self.replace(searchPattern, (match) => {
			const a = HashMap.unsafeGet(map, match);
			foundPatterns.push(Tuple.make(match as Pattern, a));
			return f(a);
		});
		return Tuple.make(modified, foundPatterns);
	};
};
