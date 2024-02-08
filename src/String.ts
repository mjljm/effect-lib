import * as MFunction from '#mjljm/effect-lib/Function';
import { RegExpUtils } from '@mjljm/js-lib';
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
 * Same as search but returns a SearchResult. You can optionnally provide the index from which to start searching. Throws if g flag is not set in the regexp.
 */

export const searchWithPos = (
	regexp: RegExp | string,
	startIndex = 0
): ((self: string) => Option.Option<SearchResult>) => {
	const reg = MFunction.isString(regexp) ? new RegExp(regexp, 'g') : regexp;
	if (!reg.flags.includes('g'))
		throw new Error(`Function 'searchWithPos' of module '${moduleTag}' must be called with g flag set.`);
	reg.lastIndex = startIndex;

	return (self: string) => {
		const matchArray = reg.exec(self);
		if (!matchArray) return Option.none();
		const match = matchArray[0];
		const index = matchArray.index;
		return Option.some(
			SearchResult({
				startIndex: index,
				endIndex: index + match.length,
				match
			})
		);
	};
};

/**
 * Finds all matches starting and, for each one, returns a SearchResult. Throws if g flag is not set.
 */
export const searchAllWithPos = (regexp: RegExp | string): ((self: string) => Array<SearchResult>) => {
	const reg = MFunction.isString(regexp) ? new RegExp(regexp, 'g') : regexp;
	if (!reg.flags.includes('g'))
		throw new Error(`Function 'searchAllWithPos' of module '${moduleTag}' must be called with g flag set.`);
	return (self: string) =>
		pipe(
			self.matchAll(reg),
			ReadonlyArray.fromIterable,
			ReadonlyArray.map((matchArr) => {
				const index = matchArr.index ?? 0;
				const match = matchArr[0];
				return SearchResult({
					startIndex: index,
					endIndex: index + match.length,
					match
				});
			})
		);
};

/**
 * Same as search but returns the last matching pattern instead of the first. g flag MUST BE PROVIDED for regexp or this function won't work.
 */
export const searchRightWithPos = (regexp: RegExp | string): ((self: string) => Option.Option<SearchResult>) => {
	const compiled = searchAllWithPos(regexp);
	return (self: string) => pipe(self, compiled, ReadonlyArray.last);
};

/**
 * Looks from the left for the first substring of self that matches regexp and returns all characters before that substring. If no occurence is found, returns self
 */
export const takeLeftTo = (regexp: RegExp | string): ((self: string) => string) => {
	const compiled = String.search(regexp);
	return (self: string) =>
		pipe(
			self,
			compiled,
			Option.getOrElse(() => self.length),
			(pos) => String.takeLeft(self, pos)
		);
};

/**
 * Looks from the right for the first substring of self that matches target and returns all characters after that substring. If no occurence is found, returns self. g flag MUST BE PROVIDED for regexp or this function won't work.
 */
export const takeRightFrom = (regexp: RegExp | string): ((self: string) => string) => {
	const compiled = searchRightWithPos(regexp);
	return (self: string) =>
		pipe(
			self,
			compiled,
			Option.map((searchItem) => searchItem.endIndex),
			Option.getOrElse(() => 0),
			(pos) => String.slice(pos)(self)
		);
};

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
 * Counts the number of occurences of regexp in self. Throws if g flag is not set
 */
export const count = (regexp: RegExp | string): ((self: string) => number) => {
	const reg = MFunction.isString(regexp) ? new RegExp(regexp, 'g') : regexp;
	if (!reg.flags.includes('g'))
		throw new Error(`Function 'count' of module '${moduleTag}' must be called with g flag set.`);
	return (self: string) =>
		pipe(
			self,
			String.match(regexp),
			Option.map((matches) => matches.length),
			Option.getOrElse(() => 0)
		);
};

/**
 * Adds a at the start of self
 */
export const prepend =
	(s: string) =>
	(self: string): string =>
		s + self;

/**
 * Returns a tuple containing:
 * - a copy of self where all words which are keys of map have been replaced by the corresponding value in map
 * - an array of the matches in the order in which they were found
 */
export const replaceMulti = <Pattern extends string>(
	map: HashMap.HashMap<Pattern, string>
): ((self: string) => [modified: string, matchList: Array<Pattern>]) => {
	const searchPattern = new RegExp(
		pipe(
			map,
			HashMap.keys,
			ReadonlyArray.fromIterable,
			// We sort the patterns in reverse order so smaller patterns match after larger ones in which they may be included.
			ReadonlyArray.sort(Order.reverse(Order.string)),
			(arr) => RegExpUtils.either(...arr),
			RegExpUtils.capture
		),
		'g'
	);
	return (self: string) => {
		const foundPatterns: Array<Pattern> = [];
		const modified = self.replace(searchPattern, (match) => {
			foundPatterns.push(match as Pattern);
			return HashMap.unsafeGet(map, match);
		});
		return Tuple.make(modified, foundPatterns);
	};
};