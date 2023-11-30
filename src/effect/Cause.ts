import { MError, MFiberId } from '#mjljm/effect-lib/index';
import { ANSI, StringUtils } from '@mjljm/js-lib';
import { Cause, Function, String, pipe } from 'effect';

export const toJson: {
	(
		stringify: (u: unknown) => string,
		tabChar?: string
	): (self: Cause.Cause<unknown>) => string;
	(
		self: Cause.Cause<unknown>,
		stringify: (u: unknown) => string,
		tabChar?: string
	): string;
} = Function.dual(
	3,
	(
		self: Cause.Cause<unknown>,
		stringify: (u: unknown) => string,
		tabChar = '  '
	): string =>
		Cause.match(self, {
			onEmpty: '',
			onFail: (error) =>
				MError.isWithOriginalCause(error)
					? ANSI.red(error.message) +
					  '\n' +
					  StringUtils.tabify(
							toJson(error.originalCause, stringify, tabChar),
							tabChar
					  )
					: ANSI.red('SCRIPT FAILED WITH ERROR(S):\n') +
					  StringUtils.tabify(
							MError.isGeneral(error)
								? ANSI.red(error.message)
								: stringify(error),
							tabChar
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
