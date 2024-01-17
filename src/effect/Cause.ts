import { MError, MFiberId, MFunction } from '#mjljm/effect-lib/index';
import { ANSI, StringUtils, TypedPath } from '@mjljm/js-lib';
import { Cause, String, pipe } from 'effect';

export const toJson =
	(thisProgramPath: TypedPath.RealAbsoluteFolderPath, stringify: (u: unknown) => string, tabChar: string) =>
	(self: Cause.Cause<unknown>): string =>
		Cause.match(self, {
			onEmpty: '',
			onFail: (error) =>
				pipe(
					MFunction.isErrorish(error)
						? ANSI.red(pipe(error, MError.formatErrorWithStackTrace(thisProgramPath)))
						: '',
					(message) =>
						MError.isWithOriginalCause(error)
							? message +
								'\n' +
								StringUtils.tabify(tabChar)(pipe(error.originalCause, toJson(thisProgramPath, stringify, tabChar)))
							: ANSI.red('SCRIPT FAILED WITH ERROR(S):\n') +
								StringUtils.tabify(tabChar)(message !== '' ? ANSI.red(message) : stringify(error))
				),
			onDie: (defect) => ANSI.red('SCRIPT DIED WITH DEFECT:\n') + stringify(defect),
			onInterrupt: (fiberId) =>
				ANSI.red(
					pipe(MFiberId.toJson(fiberId), (json) =>
						String.includes(',')(json) ? `FIBERS ${json} WERE INTERRUPTED` : `FIBER ${json} WAS INTERRUPTED`
					)
				),
			onSequential: (left, right) => (left === '' ? right : right === '' ? left : `${left}\n${right}`),
			onParallel: (left, right) => (left === '' ? right : right === '' ? left : `${left}\n${right}`)
		});
