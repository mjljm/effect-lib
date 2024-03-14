import * as MFunction from '#mjljm/effect-lib/Function';
import { MReadonlyArray, MString } from '#mjljm/effect-lib/index';
import { Function, Option, Order, ReadonlyArray, String, Tuple, pipe } from 'effect';
import { inspect } from 'util';

//const moduleTag = '@mjljm/effect-lib/effect/String/';

export interface SearchResult {
	/** Index of the first letter of the match */
	readonly startIndex: number;
	/** Index of the first letter following the match */
	readonly endIndex: number;
	/** Text of the matched element */
	readonly match: string;
}

const SearchResult = MFunction.make<SearchResult>;
const searchResultByStartIndex = Order.mapInput(
	Order.number,
	(searchResult: SearchResult) => searchResult.startIndex
);
const searchResultByEndIndex = Order.mapInput(Order.number, (searchResult: SearchResult) => searchResult.endIndex);
const searchResultByStartIndexAndReverseEndIndex = Order.combine(
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
 * If self starts with s, returns self stripped of s. Otherwise, returns s
 */
export const stripLeft =
	(s: string) =>
	(self: string): string =>
		pipe(self, MFunction.iif(String.startsWith(s), takeRightBut(s.length)));

/**
 * If self ends with s, returns self stripped of s. Otherwise, returns s
 */
export const stripRight =
	(s: string) =>
	(self: string): string =>
		pipe(self, MFunction.iif(String.endsWith(s), takeLeftBut(s.length)));

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

/**
 * Finds the position of tokens inside a template string.
 * @param self a template in which tokens will be searched.
 * @param tokens an array containing the tokens to find. Each token can appear between 0 and n times in self. Tokens can overlap, e.g `falling-tree`, `tree`, `tree-shaking`. In this case, the foremost and longest token takes precedence. For instance, in the template `this bundler is good at tree-shaking`, although `tree` and `tree-shaking` are present at the same position, the longest token `tree-shaking` will take precedence and impose its value.
 * @returns a list of the found tokens in the form of a tuple. The first element of the tuple indicates the token index in tokens. The second is a searchResult indicating the startIndex and endIndex of the token in self. The list is ordered by startIndex of the matches.
 */
const internalGetTemplateStructure = (
	template: string,
	tokens: ReadonlyArray<string>
): [Array<[staticText: string, tokenValueIndex: number]>, finalStaticText: string] =>
	pipe(
		tokens,
		ReadonlyArray.map(Function.flip(searchAll)(template)),
		MReadonlyArray.toIndexedFlattened,
		// Suppress overlapping tokens keeping the foremost longest one
		ReadonlyArray.sort(
			Order.mapInput(searchResultByStartIndexAndReverseEndIndex, ([_, sR]: [number, SearchResult]) => sR)
		),
		ReadonlyArray.chop((indexedSearchResults) => {
			const head = ReadonlyArray.headNonEmpty(indexedSearchResults);
			const [_, { endIndex: upperBound }] = head;
			return Tuple.make(
				head,
				ReadonlyArray.dropWhile(indexedSearchResults, ([_, { startIndex }]) => startIndex < upperBound)
			);
		}),
		ReadonlyArray.reduce(
			Tuple.make(0, ReadonlyArray.empty<[string, number]>()),
			([startPos, list], [tokenIndex, { startIndex: endPos, endIndex }]) =>
				Tuple.make(
					endIndex,
					pipe(list, ReadonlyArray.append(Tuple.make(template.substring(startPos, endPos), tokenIndex)))
				)
		),
		([startPos, list]) => Tuple.make(list, template.substring(startPos))
	);

/**
 * Simple templating function that replaces tokens in a string by the values of those tokens
 * @param self a template in which tokens will be searched and replaced.
 * @param tokens an array containing the tokens to replace. Each token can appear between 0 and n times in self. Tokens can overlap, e.g `falling-tree`, `tree`, `tree-shaking`. In this case, te foremost and longest token takes precedence. For instance, in the template `this bundler is good at tree-shaking`, although `tree` and `tree-shaking` are present at the same position, the longest token `tree-shaking` will take precedence and impose its value.
 * @returns a compiled function that takes an array of values (in the same order as the tokens) and returns self where each token has been replaced by its value. If the array of values contains less entries than the array of tokens, the extra tokens will not be replaced. If it contains more entries, the extra values are ignored.
 **/

export const templateWrite =
	(tokens: ReadonlyArray<string>) =>
	(self: string): ((tokenValues: ReadonlyArray<string>) => string) => {
		const templateStructure = internalGetTemplateStructure(self, tokens);
		console.log(inspect(templateStructure, { depth: +Infinity }));
		return (tokenValues) =>
			pipe(
				templateStructure,
				Tuple.getFirst,
				ReadonlyArray.map(([staticText, tokenValueIndex]) =>
					pipe(
						tokenValues,
						ReadonlyArray.get(tokenValueIndex),
						Option.getOrElse(() => ''),
						MString.prepend(staticText)
					)
				),
				ReadonlyArray.join(''),
				String.concat(templateStructure[1])
			);
	};

/**
 * Simple templating function that replaces tokens in a string by the values of those tokens
 * @param self a template in which tokens will be searched and replaced.
 * @param tokens an array containing the tokens to replace. Each token can appear between 0 and n times in self. Tokens can overlap, e.g `falling-tree`, `tree`, `tree-shaking`. In this case, te foremost and longest token takes precedence. For instance, in the template `this bundler is good at tree-shaking`, although `tree` and `tree-shaking` are present at the same position, the longest token `tree-shaking` will take precedence and impose its value.
 * @returns a compiled function that takes an array of values (in the same order as the tokens) and returns self where each token has been replaced by its value. If the array of values contains less entries than the array of tokens, the extra tokens will not be replaced. If it contains more entries, the extra values are ignored.
 **/

/*export const templateRead =
	(tokens: ReadonlyArray<[tokenId: string, tokenPattern: RegExp]>) =>
	(self: string): ((template: string) => ReadonlyArray<string>) => {
		const indexedSearchResults = internalFindTemplateTokens(self, pipe(tokens, ReadonlyArray.map(Tuple.getFirst)));

		return (template) =>
			pipe(
				indexedSearchResults,
				ReadonlyArray.reduce(Tuple.make(self, 0), ([template, offset], [tokenValueIndex, searchResult]) =>
					pipe(
						tokenValues,
						ReadonlyArray.get(tokenValueIndex),
						Option.map((replacement) =>
							Tuple.make(
								replaceBetween(
									replacement,
									searchResult.startIndex + offset,
									searchResult.endIndex + offset
								)(template),
								offset + replacement.length - searchResult.match.length
							)
						),
						Option.getOrElse(() => Tuple.make(template, offset))
					)
				),
				Tuple.getFirst
			);
	};*/
