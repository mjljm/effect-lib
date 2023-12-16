import { MError, MFiberId, MFunction } from '#mjljm/effect-lib/index';
import { ANSI, StringUtils } from '@mjljm/js-lib';
import { Cause, Function, String, pipe } from 'effect';

export const toJson: {
	(
		root: string,
		stringify: (u: unknown) => string,
		tabChar?: string | undefined
	): (self: Cause.Cause<unknown>) => string;
	(
		self: Cause.Cause<unknown>,
		root: string,
		stringify: (u: unknown) => string,
		tabChar?: string | undefined
	): string;
} = Function.dual(
	4,
	(
		self: Cause.Cause<unknown>,
		root: string,
		stringify: (u: unknown) => string,
		tabChar: string = '  '
	): string =>
		Cause.match(self, {
			onEmpty: '',
			onFail: (error) =>
				pipe(
					MFunction.isErrorish(error)
						? ANSI.red(MError.formatErrorWithStackTrace(error, root))
						: '',
					(message) =>
						MError.isWithOriginalCause(error)
							? message +
							  '\n' +
							  StringUtils.tabify(
									toJson(error.originalCause, root, stringify, tabChar),
									tabChar
							  )
							: ANSI.red('SCRIPT FAILED WITH ERROR(S):\n') +
							  StringUtils.tabify(
									message !== '' ? ANSI.red(message) : stringify(error),
									tabChar
							  )
				),
			onDie: (defect) =>
				ANSI.red('SCRIPT DIED WITH DEFECT:\n') + stringify(defect),
			onInterrupt: (fiberId) =>
				ANSI.red(
					pipe(MFiberId.toJson(fiberId), (json) =>
						String.includes(',')(json)
							? `FIBERS ${json} WERE INTERRUPTED`
							: `FIBER ${json} WAS INTERRUPTED`
					)
				),
			onSequential: (left, right) =>
				left === '' ? right : right === '' ? left : `${left}\n${right}`,
			onParallel: (left, right) =>
				left === '' ? right : right === '' ? left : `${left}\n${right}`
		})
);
