/**
 * A template is a string that contains tokens where to read/write. Each token can appear between 0 and n times. Tokens can overlap, e.g `falling-tree`, `tree`, `tree-shaking`. In this case, the foremost and longest token takes precedence. For instance, in the template `this bundler is good at tree-shaking`, although `tree` and `tree-shaking` are present at the same position, the longest token `tree-shaking` will take precedence and impose its value.
 */

import * as MBadArgumentError from '#mjljm/effect-lib/BadArgumentError';
import * as MReadonlyArray from '#mjljm/effect-lib/ReadonlyArray';
import { MEither, MString } from '#mjljm/effect-lib/index';
import { Either, Function, Number, Option, Order, ReadonlyArray, String, Tuple, pipe } from 'effect';
import { compose, flow } from 'effect/Function';

const moduleTag = '@mjljm/effect-lib/effect/Template/';

/**
 * Model
 * During compilation, a template is split at the boundary of each token. So if there are n tokens in the template, we have, after compilation, an array of n blocks, each block containing the text between the end of the previous token (or the start of the template if there is no previous token) and the start of the current one, and the index of the current token. There remains a final text after the last token. The static text of the first block and finalStaticText may be empty strings.
 */
export interface Type {
	readonly textAndTokenArray: Array<{ staticText: string; tokenIndex: number }>;
	readonly finalStaticText: string;
	readonly tokens: ReadonlyArray<string>;
}

/**
 * Builds a templater
 * @param template a template in which tokens will be searched.
 * @param tokens an array of strings containing the tokens to find.
 */
export const make = (template: string, tokens: ReadonlyArray<string>): Type =>
	pipe(
		tokens,
		ReadonlyArray.map(Function.flip(MString.searchAll)(template)),
		MReadonlyArray.toIndexedFlattened,
		// Suppress overlapping tokens keeping the foremost longest one
		ReadonlyArray.sort(
			Order.mapInput(
				MString.searchResultByStartIndexAndReverseEndIndex,
				([_, sR]: [number, MString.SearchResult]) => sR
			)
		),
		ReadonlyArray.chop((indexedSearchResults) => {
			const head = ReadonlyArray.headNonEmpty(indexedSearchResults);
			const [_, { endIndex: upperBound }] = head;
			return Tuple.make(
				head,
				ReadonlyArray.dropWhile(indexedSearchResults, ([_, { startIndex }]) => startIndex < upperBound)
			);
		}),
		ReadonlyArray.mapAccum(0, (startPos, [tokenIndex, { startIndex: endPos, endIndex }]) =>
			Tuple.make(endIndex, { staticText: template.substring(startPos, endPos), tokenIndex })
		),
		([startPos, textAndTokenArray]) => ({
			textAndTokenArray,
			finalStaticText: template.substring(startPos),
			tokens: tokens
		})
	);

/**
 * Returns a copy of the original template where the tokens have been replaced by the passed array of `tokenValues` which must be passed in the same order as the tokens. Returns an error if the length of `tokenValues` is different from the length of `tokens`.
 **/
export const write =
	(self: Type) =>
	(tokenValues: ReadonlyArray<string>): Either.Either<string, MBadArgumentError.BadLength> =>
		pipe(
			self.textAndTokenArray,
			Option.liftPredicate(() => tokenValues.length === self.tokens.length),
			Either.fromOption(
				() =>
					new MBadArgumentError.BadLength({
						id: 'tokenValues',
						moduleTag,
						functionName: 'write',
						actual: tokenValues.length,
						expected: self.tokens.length
					})
			),
			Either.map(
				flow(
					ReadonlyArray.map(({ staticText, tokenIndex }) =>
						pipe(tokenValues, MReadonlyArray.unsafeGet(tokenIndex), MString.prepend(staticText))
					),
					ReadonlyArray.join(''),
					String.concat(self.finalStaticText)
				)
			)
		);

/**
 * Reads the value of the tokens from filledoutTemplate. The tokens in the original template indicate where to start reading the data. The token patterns passed to this function indicate the amount and shape of data to be read from that position.
 * Returns an error if filledoutTemplate does not comply with template, if tokenPatterns and tokens don't have the same length, or if conflicting values are read for the same token.
 **/

export const read =
	(self: Type) =>
	(
		filledOutTemplate: string,
		tokenPatterns: ReadonlyArray<RegExp>
	): Either.Either<
		ReadonlyArray<Option.Option<string>>,
		MBadArgumentError.BadFormat | MBadArgumentError.BadLength | MBadArgumentError.TooMany
	> => {
		const stripStaticText =
			(staticText: string, position: number) =>
			(
				leftToReadEither: Either.Either<string, MBadArgumentError.BadFormat>
			): Either.Either<string, MBadArgumentError.BadFormat> =>
				Either.flatMap(leftToReadEither, (leftToRead) =>
					pipe(
						leftToRead,
						MString.stripLeftOption(staticText),
						Either.fromOption(
							() =>
								new MBadArgumentError.BadFormat({
									id: 'filledOutTemplate',
									position,
									moduleTag,
									functionName: 'read',
									actual: staticText,
									expected: leftToRead.substring(0, staticText.length)
								})
						)
					)
				);

		return pipe(
			self.textAndTokenArray,
			Option.liftPredicate(() => tokenPatterns.length === self.tokens.length),
			Either.fromOption(
				() =>
					new MBadArgumentError.BadLength({
						id: 'tokenPatterns',
						moduleTag,
						functionName: 'read',
						actual: tokenPatterns.length,
						expected: self.tokens.length
					})
			),
			Either.flatMap(
				flow(
					ReadonlyArray.map(({ staticText, tokenIndex }) =>
						Tuple.make(staticText, tokenIndex, MReadonlyArray.unsafeGet(tokenIndex)(tokenPatterns))
					),
					ReadonlyArray.mapAccum(
						Either.right(filledOutTemplate) as Either.Either<string, MBadArgumentError.BadFormat>,
						(leftToReadEither, [staticText, tokenIndex, tokenPattern], position) =>
							pipe(
								leftToReadEither,
								stripStaticText(staticText, position),
								Either.map((strippedOfStaticText) => {
									const result = tokenPattern.exec(strippedOfStaticText);
									const value = result ? result[0] : '';
									return Tuple.make(
										Either.right(strippedOfStaticText.substring(value.length)),
										Tuple.make(tokenIndex, value)
									);
								}),
								Either.getOrElse((left) => Tuple.make(Either.left(left), Tuple.make(tokenIndex, '')))
							)
					),
					([leftToReadEither, values]) =>
						pipe(
							leftToReadEither,
							stripStaticText(self.finalStaticText, self.textAndTokenArray.length - 1),
							Either.filterOrLeft(
								String.isEmpty,
								(remnants) =>
									new MBadArgumentError.BadFormat({
										id: 'filledOutTemplate',
										position: self.textAndTokenArray.length,
										moduleTag,
										functionName: 'read',
										actual: remnants,
										expected: ''
									})
							),
							Either.map(() => values)
						)
				)
			),
			Either.flatMap(
				flow(
					MReadonlyArray.fromIndexedFlattened(self.tokens.length),
					ReadonlyArray.map(ReadonlyArray.dedupe),
					MEither.liftOptionalError(
						ReadonlyArray.findFirstIndex(compose(ReadonlyArray.length, Number.greaterThan(1)))
					),
					Either.mapLeft(
						([tokenIndex, values]) =>
							new MBadArgumentError.TooMany({
								id: pipe(self.tokens, MReadonlyArray.unsafeGet(tokenIndex)),
								position: tokenIndex,
								moduleTag,
								functionName: 'read',
								actual: pipe(values, MReadonlyArray.unsafeGet(tokenIndex), ReadonlyArray.length),
								expected: 1
							})
					),
					Either.map(ReadonlyArray.map(MReadonlyArray.getSingleton))
				)
			)
		);
	};
