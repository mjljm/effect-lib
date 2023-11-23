import { MError, MFunction } from '#mjljm/effect-lib/index';
import { RegExpUtils } from '@mjljm/js-lib';
import { Either, Function, HashMap, MutableHashSet, Option, ReadonlyArray, String, identity, pipe } from 'effect';

/**
 * Same as search but return the last matching pattern instead of the first
 */
export const searchRight: {
	(regexp: RegExp | string): (self: string) => Option.Option<number>;
	(self: string, regexp: RegExp | string): Option.Option<number>;
} = Function.dual(
	2,
	(self: string, regexp: RegExp | string): Option.Option<number> =>
		String.search(
			self,
			pipe(regexp, RegExpUtils.toString, (s) => s + RegExpUtils.negativeLookAhead(s))
		)
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
 * Looks from the right for the first substring of self that matches target and returns all characters after that substring. If no occurence is found, returns self
 */
export const takeRightFrom: {
	(target: string): (self: string) => string;
	(self: string, target: string): string;
} = Function.dual(2, (self: string, target: string): string =>
	pipe(
		self,
		String.lastIndexOf(target),
		Option.getOrElse(() => -target.length),
		(pos) => String.takeRight(self, self.length - (pos + target.length))
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
	(
		target: RegExp,
		replacementMap: HashMap.HashMap<string, string>,
		checkAllUsed: boolean
	): (self: string) => Either.Either<MError.General<unknown>, string>;
	(
		self: string,
		target: RegExp,
		replacementMap: HashMap.HashMap<string, string>,
		checkAllUsed: boolean
	): Either.Either<MError.General<unknown>, string>;
} = Function.dual(
	4,
	(
		self: string,
		target: RegExp,
		replacementMap: HashMap.HashMap<string, string>,
		checkAllUsed: boolean
	): Either.Either<MError.General<unknown>, string> => {
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
					message: `templateAllUsedNoExtra: ${notFound} not found in replacementMap`
				})
			);
		if (checkAllUsed && HashMap.size(replacementMap) !== MutableHashSet.size(foundSet))
			return Either.left(
				new MError.General({
					message:
						'templateAllUsedNoExtra: some replacements present in replacementMap were not used.\nReplacement map keys:\n' +
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
export const toString = (obj: MFunction.Record): Option.Option<string> =>
	pipe(
		obj['toString'],
		(toString) => (toString !== Object.prototype.toString ? safeCall(toString) : Option.none()),
		Option.orElse(() => safeCall(obj['toJson']))
	);

const safeCall = (f: unknown): Option.Option<string> => {
	if (typeof f === 'function') {
		try {
			const result: unknown = f();
			return typeof result === 'string' ? Option.some(result) : Option.none();
		} catch (_) {
			return Option.none();
		}
	}
	return Option.none();
};
