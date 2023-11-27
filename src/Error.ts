import { ArrayFormatter, ParseResult } from '@effect/schema';
import { Cause, Data, ReadonlyArray, pipe } from 'effect';

export class FunctionPort extends Data.Error<{
	originalError: unknown;
	originalFunctionName: string;
	moduleName: string;
	libraryName: string;
}> {}

export const isFunctionPort = (u: unknown): u is FunctionPort =>
	u instanceof FunctionPort;
/**
 * We need to have a special Error class for errors from Effect Schema because they can be pretty printed using formatErrors
 */
export class EffectSchema extends Data.Error<{
	originalError: ParseResult.ParseError;
}> {
	public toJson = () =>
		pipe(
			ArrayFormatter.formatErrors(this.originalError.errors),
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

export const isEffectSchema = (u: unknown): u is EffectSchema =>
	u instanceof EffectSchema;

/**
 * This error is meant to be handled by a human being (no action triggered like a retry on HTTP Error). The message must give sufficient context to help identify the origin the error
 */
export class General<E = never> extends Data.Error<{
	message: string;
	originalCause?: Cause.Cause<E>;
}> {}

export const isGeneral = <E>(u: unknown): u is General<E> =>
	u instanceof General;
