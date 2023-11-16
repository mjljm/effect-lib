import { FunctionPortError, GeneralError } from '@mjljm/effect-lib/Errors';
import * as PrettyPrint from '@mjljm/effect-pretty-print/index';
import { blueString } from '@mjljm/js-lib/Strings';
import { Cause, pipe } from 'effect';

const _ = PrettyPrint._;

const prettyPrintOptions: PrettyPrint.Options = {
	stringOrSymbolProperties: 'both',
	enumerableOrNonEnumarableProperties: 'both',
	showInherited: true,
	initialTab: _('  '),
	noLineBreakIfShorterThan: 40
};

const formatWithFunction =
	<E>(onFail: (error: E) => string) =>
	(self: Cause.Cause<E>) =>
		Cause.match(self, {
			onEmpty: '',
			onFail: (error) => onFail(error),
			onDie: (defect) => `SCRIPT DIED WITH DEFECT:\n${objectToString(defect)}`,
			onInterrupt: (fiberId) => `SCRIPT WAS INTERRUPTED WITH FIBERID:\n${objectToString(fiberId)}`,
			onSequential: (left, right) =>
				left === '' ? right : right === '' ? left : `${left}\n${right}`,
			onParallel: (left, right) =>
				left === '' ? right : right === '' ? left : `${left}\n\n${right}`
		});

export const format = <T, E extends GeneralError<T> | FunctionPortError>(self: Cause.Cause<E>) =>
	pipe(
		self,
		formatWithFunction(
			(error) =>
				`SCRIPT FAILED WITH ERROR: ${
					error._tag === 'FunctionPortError'
						? `\n${blueString(tabify(objectToString(error)))}`
						: `${error.message}\n${pipe(
								error.originalCause,
								formatWithFunction((error) => `\n${blueString(tabify(objectToString(error)))}`)
						  )}`
				}`
		)
	);
