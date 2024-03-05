import { Context, Effect, Layer, Ref, Scope } from 'effect';
/**
 * Same as scope but pnly one finalizer can be added. Any addition of a finalizer after the initial one will be ignored.
 */
const moduleTag = '@mjljm/effect-lib/Once/';

export interface ServiceInterface {
	readonly addFinalizer: (finalizer: Effect.Effect<unknown, never, never>) => Effect.Effect<void, never, never>;
}

export class Service extends Context.Tag(moduleTag + 'Service')<Service, ServiceInterface>() {}

export const layer = Layer.scoped(
	Service,
	Effect.gen(function* (_) {
		const addedRef = yield* _(Ref.make(false));
		const scope = yield* _(Scope.Scope);
		return {
			addFinalizer: (finalizer) =>
				Effect.gen(function* (_) {
					const added = yield* _(Ref.getAndUpdate(addedRef, () => true));
					if (!added) {
						yield* _(Scope.addFinalizer(scope, finalizer));
					}
				})
		};
	})
);

export const live = layer;
