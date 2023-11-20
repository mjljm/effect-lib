import { ParseResult } from '@effect/schema';
import { Cause, Data } from 'effect';

export class FunctionPort extends Data.Error<{
	originalError: unknown;
	originalFunctionName: string;
	moduleName: string;
	libraryName: string;
}> {}

export const isFunctionPort = (u: unknown): u is FunctionPort =>
	u instanceof FunctionPort;
/**
 * We need to tag clearly errors coming from Effect Schema because they can be pretty printed using formatErrors
 */
export class EffectSchema extends Data.Error<{
	originalFunctionName: string;
	originalError: ParseResult.ParseError;
}> {}

export const isEffectSchema = (u: unknown): u is EffectSchema =>
	u instanceof EffectSchema;

/**
 * This error is meant to be handled by a human being (no action triggered like a retry on HTTP Error). The message must give sufficient context to help identify the origin the error
 */
export class General<E> extends Data.Error<{
	message: string;
	originalCause?: Cause.Cause<E>;
}> {}

export const isGeneral = <E>(u: unknown): u is General<E> =>
	u instanceof General;
