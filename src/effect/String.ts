import { MError, MFunction, MOption } from '#mjljm/effect-lib/index';
import {
	Data,
	Either,
	Function,
	HashMap,
	MutableHashSet,
	Option,
	ReadonlyArray,
	String,
	identity,
	pipe
} from 'effect';

class SearchResult extends Data.Class<{
	/** Index of the first letter of the match */
	readonly startIndex: number;
	/** Index of the first letter following the match */
	readonly endIndex: number;
	/** Text of the matched element */
	readonly match: string;
}> {}

/**
 * Same as search but returns a SearchResult. You can optionnally provide the index from which to start searching. g flag MUST BE PROVIDED for regexp or this function won't work.
 */
export const searchWithMatch: {
	(
		regexp: RegExp,
		startIndex?: number | undefined
	): (self: string) => Option.Option<SearchResult>;
	(
		self: string,
		regexp: RegExp,
		startIndex?: number | undefined
	): Option.Option<SearchResult>;
} = Function.dual(
	3,
	(
		self: string,
		regexp: RegExp,
		startIndex: number = 0
	): Option.Option<SearchResult> => {
		regexp.lastIndex = startIndex;
		const matchArray = regexp.exec(self);
		if (!matchArray) return Option.none();
		const match = matchArray[0];
		const index = matchArray.index;
		return Option.some(
			new SearchResult({
				startIndex: index,
				endIndex: index + match.length,
				match
			})
		);
	}
);

/**
 * Finds all matches starting at startIndex and, for each one, returns a SearchResult. g flag MUST BE PROVIDED for regexp or this function won't work.
 */
export const searchAllWithMatch: {
	(
		regexp: RegExp,
		startIndex?: number | undefined
	): (self: string) => ReadonlyArray<SearchResult>;
	(
		self: string,
		regexp: RegExp,
		startIndex?: number | undefined
	): ReadonlyArray<SearchResult>;
} = Function.dual(
	2,
	(
		self: string,
		regexp: RegExp,
		startIndex: number = 0
	): ReadonlyArray<SearchResult> =>
		// Make sure we don't get stuck in infinite loop if g flag is forgotten
		String.includes('g')(regexp.flags)
			? MFunction.doWhileAccum(
					MOption.someAsConst(
						new SearchResult({
							startIndex: 0,
							endIndex: startIndex,
							match: ''
						})
					),
					{
						step: (result) =>
							searchWithMatch(self, regexp, result.value.endIndex),
						predicate: Option.isSome,
						body: (searchItem) => searchItem.value
					}
			  )
			: ReadonlyArray.empty<SearchResult>()
);

/**
 * Same as search but returns the last matching pattern instead of the first. g flag MUST BE PROVIDED for regexp or this function won't work.
 */
export const searchRightWithMatch: {
	(regexp: RegExp): (self: string) => Option.Option<SearchResult>;
	(self: string, regexp: RegExp): Option.Option<SearchResult>;
} = Function.dual(
	2,
	(self: string, regexp: RegExp): Option.Option<SearchResult> =>
		pipe(self, searchAllWithMatch(regexp), ReadonlyArray.last)
);

/**
 * Looks from the left for the first substring of self that matches regexp and returns all characters before that substring. If no occurence is found, returns self
 */
export const takeLeftTo: {
	(regexp: RegExp | string): (self: string) => string;
	(self: string, regexp: RegExp | string): string;
} = Function.dual(2, (self: string, regexp: RegExp | string): string =>
	pipe(
		self,
		String.search(regexp),
		Option.getOrElse(() => self.length),
		(pos) => String.takeLeft(self, pos)
	)
);

/**
 * Looks from the right for the first substring of self that matches target and returns all characters after that substring. If no occurence is found, returns self. g flag MUST BE PROVIDED for regexp or this function won't work.
 */
export const takeRightFrom: {
	(regexp: RegExp): (self: string) => string;
	(self: string, regexp: RegExp): string;
} = Function.dual(2, (self: string, regexp: RegExp): string =>
	pipe(
		self,
		searchRightWithMatch(regexp),
		Option.map((searchItem) => searchItem.endIndex),
		Option.getOrElse(() => 0),
		(pos) => String.slice(pos)(self)
	)
);

/**
 * If successful, returns a right containing copy of self where all words matching the target RegExp are replaced by the replacements provided in the ReplacementMap. Return a left if self contains a pattern matching the target RegExp not present in ReplacementMap. Also returns a left if checkAllUsed is set and some of the values in ReplacementMap were not used
 * @param target The RegExp that anglobes all the patterns to match. DON'T forget /g!!
 * @param replacementMap A map whose keys are the patterns to replace and the values the strings to replace them with
 * @param checkAllUsed If true, all values in ReplkacementMap must be used
 * @param self The template
 * @returns an Either
 */
export const templater: {
	<
		O extends {
			readonly checkAllUsed: boolean;
		}
	>(
		target: RegExp,
		replacementMap: HashMap.HashMap<string, string>,
		options?: O
	): (self: string) => Either.Either<MError.General, string>;
	<
		O extends {
			readonly checkAllUsed?: boolean;
		}
	>(
		self: string,
		target: RegExp,
		replacementMap: HashMap.HashMap<string, string>,
		options?: O
	): Either.Either<MError.General, string>;
} = Function.dual(
	4,
	<
		O extends {
			readonly checkAllUsed?: boolean;
		}
	>(
		self: string,
		target: RegExp,
		replacementMap: HashMap.HashMap<string, string>,
		options?: O
	): Either.Either<MError.General, string> => {
		const foundSet = MutableHashSet.empty<string>();
		let notFound = '';
		const result = self.replace(target, (match) => {
			if (notFound !== '') return '';
			MutableHashSet.add(foundSet, match);
			return pipe(
				replacementMap,
				HashMap.get(match),
				Option.match({
					onNone: () => ((notFound = match), ''),
					onSome: identity
				})
			);
		});
		if (notFound !== '')
			return Either.left(
				new MError.General({
					message: `Function String.templateAllUsedNoExtra: ${notFound} not found in replacementMap`
				})
			);
		if (
			options &&
			options.checkAllUsed &&
			HashMap.size(replacementMap) !== MutableHashSet.size(foundSet)
		)
			return Either.left(
				new MError.General({
					message:
						'Function String.templateAllUsedNoExtra: some replacements present in replacementMap were not used.\nReplacement map keys:\n' +
						pipe(replacementMap, HashMap.keys, ReadonlyArray.join(',')) +
						'\nKeys found in template:\n' +
						pipe(foundSet, ReadonlyArray.join(','))
				})
			);
		else return Either.right(result);
	}
);

/**
 * Returns a some of the result of calling the toString method on obj provided it defines one different from Object.prototype.toString. If toString is not defined or not overloaded, it returns a some of the result of calling the toJson function on obj provided it defines one. If toString and toJson are not defined, returns a none.
 * @param obj
 * @returns
 */
export const tryToStringToJson = (
	obj: MFunction.Record
): Option.Option<string> =>
	pipe(
		obj['toString'],
		(toString) =>
			toString !== Object.prototype.toString
				? MOption.liftUnknown(MFunction.isString)(toString).apply(obj)
				: Option.none(),
		Option.orElse(() =>
			MOption.liftUnknown(MFunction.isString)(obj['toJson']).apply(obj)
		)
	);

/**
 * Returns the provided `string` `that` if `self` is empty, otherwise returns `self`.
 *
 * @category error handling
 */
export const orElse: {
	(that: Function.LazyArg<string>): (self: string) => string;
	(self: string, that: Function.LazyArg<string>): string;
} = Function.dual(2, (self: string, that: Function.LazyArg<string>): string =>
	String.isEmpty(self) ? that() : self
);

/**
 * Takes all characters from self except the n last characters
 */
export const takeLeftBut: {
	(n: number): (self: string) => string;
	(self: string, n: number): string;
} = Function.dual(2, (self: string, n: number): string =>
	String.takeLeft(self, String.length(self) - n)
);

/**
 * Takes all characters from self except the n first characters
 */
export const takeRightBut: {
	(n: number): (self: string) => string;
	(self: string, n: number): string;
} = Function.dual(2, (self: string, n: number): string =>
	String.takeRight(self, String.length(self) - n)
);

/**
 * If self starts with s, returns self stripped of s. Otherwise, returns s
 */
export const stripLeft: {
	(s: string): (self: string) => string;
	(self: string, s: string): string;
} = Function.dual(2, (self: string, s: string): string =>
	String.startsWith(self)(s) ? takeRightBut(self, String.length(s)) : self
);

/**
 * If self ends with s, returns self stripped of s. Otherwise, returns s
 */
export const stripRight: {
	(s: string): (self: string) => string;
	(self: string, s: string): string;
} = Function.dual(2, (self: string, s: string): string =>
	String.endsWith(self)(s) ? takeLeftBut(self, String.length(s)) : self
);
