import { MError } from '#mjljm/effect-lib/index';
import { Cause, pipe } from 'effect';

const formatInternal =
	<E>(stringify: (u: unknown) => string, onFail: (error: E) => string) =>
	(self: Cause.Cause<E>) =>
		Cause.match(self, {
			onEmpty: '',
			onFail: (error) => onFail(error),
			onDie: (defect) => `SCRIPT DIED WITH DEFECT:\n${stringify(defect)}`,
			onInterrupt: (fiberId) =>
				`SCRIPT WAS INTERRUPTED WITH FIBERID:\n${stringify(fiberId)}`,
			onSequential: (left, right) =>
				left === '' ? right : right === '' ? left : `${left}\n${right}`,
			onParallel: (left, right) =>
				left === '' ? right : right === '' ? left : `${left}\n\n${right}`
		});

export const format =
	(stringify: (u: unknown) => string) =>
	<T, E extends MError.General<T>>(self: Cause.Cause<E>) =>
		pipe(
			self,
			formatInternal(
				stringify,
				(error) =>
					'SCRIPT FAILED WITH ERROR: ' +
					error.message +
					(typeof error.originalCause === 'undefined'
						? ''
						: '\n' +
						  formatInternal(
								stringify,
								(error) => '\n' + stringify(error)
						  )(error.originalCause))
			)
		);
