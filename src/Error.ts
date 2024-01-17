import { MFunction, MString } from '#mjljm/effect-lib/index';
import { ArrayFormatter, ParseResult } from '@effect/schema';
import { ANSI, RegExpUtils, StringUtils, TypedPath } from '@mjljm/js-lib';
import { Cause, Data, Option, ReadonlyArray, String, pipe } from 'effect';

// Use TaggedError to get a stack trace (because TaggedError extends Error)
export class FunctionPort extends Data.TaggedError('FunctionPort')<{
	originalError: unknown;
	originalFunctionName: string;
	moduleName: string;
	libraryName: string;
}> {}

export const isFunctionPort = (u: unknown): u is FunctionPort => u instanceof FunctionPort;
/**
 * We need to have a special Error class for errors from Effect Schema because they can be pretty printed using formatErrors
 */
export class EffectSchema extends Data.TaggedError('EffectSchema')<{
	originalError: ParseResult.ParseError;
}> {
	public toJson = () =>
		pipe(
			ArrayFormatter.formatError(this.originalError),
			ReadonlyArray.map(
				(issue) =>
					issue.message +
					' at path "' +
					pipe(
						issue.path,
						ReadonlyArray.map((p) => p.toString()),
						ReadonlyArray.join('/')
					) +
					'"'
			),
			ReadonlyArray.join('\n'),
			(s) => 'Effect Schema parsing error\n' + s
		);
}

export const isEffectSchema = (u: unknown): u is EffectSchema => u instanceof EffectSchema;

/**
 * This error is meant to be handled by a human being (no action triggered like a retry on HTTP Error). The message must give sufficient context to help identify the origin the error
 */
export class General extends Data.TaggedError('General')<{
	message: string;
}> {}

export const isGeneral = (u: unknown): u is General => u instanceof General;

/**
 * This error is meant to be rethrown in an Effect.catchAllCause
 */
export class WithOriginalCause extends Data.TaggedError('WithOriginalCause')<{
	message: string;
	originalCause: Cause.Cause<unknown>;
}> {}

export const isWithOriginalCause = (u: unknown): u is WithOriginalCause => u instanceof WithOriginalCause;

export const formatErrorWithStackTrace =
	<A extends MFunction.Errorish>(thisProgramPath: TypedPath.RealAbsoluteFolderPath) =>
	(self: A): string =>
		self.stack
			? pipe(self.stack, String.split(RegExpUtils.lineBreak), ReadonlyArray.headNonEmpty, (lastError) =>
					pipe(
						lastError,
						String.match(/at\s(\S+)\s\((.+):(\d+):(\d+)\)/),
						Option.map(
							(matchArray) =>
								self.message +
								' at column ' +
								ReadonlyArray.unsafeGet(matchArray, 4) +
								' of line ' +
								ReadonlyArray.unsafeGet(matchArray, 3) +
								' in file ' +
								pipe(
									matchArray,
									ReadonlyArray.unsafeGet(2),
									MString.stripLeft(thisProgramPath),
									MString.takeRightBut(1) // To remove the separator
								) +
								' function:' +
								ReadonlyArray.unsafeGet(matchArray, 1)
						),
						Option.getOrElse(() => self.message + ' ' + lastError)
					)
				)
			: self.message;

export const showUncaughtErrorAndExit = ({
	error,
	message,
	thisProgramPath,
	stringify
}: {
	message: string;
	error: unknown;
	thisProgramPath: TypedPath.RealAbsoluteFolderPath;
	stringify: (u: unknown) => string;
}) => {
	console.error(
		ANSI.red(message + '\n\n') +
			StringUtils.tabify('\t')(
				ANSI.red('Error:\n') +
					(MFunction.isErrorish(error)
						? pipe(error, formatErrorWithStackTrace(thisProgramPath))
						: stringify(error))
			) +
			'\n\n'
	);
	process.exit(1);
};
