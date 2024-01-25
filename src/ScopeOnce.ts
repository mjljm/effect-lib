import { Context, Effect, Layer, Ref, Scope } from 'effect';

//const moduleTag = '@mjljm/effect-lib/Once/';

export interface ServiceInterface {
	readonly addFinalizer: (finalizer: Effect.Effect<never, never, unknown>) => Effect.Effect<never, never, void>;
}

export const Service = Context.Tag<ServiceInterface>();

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
