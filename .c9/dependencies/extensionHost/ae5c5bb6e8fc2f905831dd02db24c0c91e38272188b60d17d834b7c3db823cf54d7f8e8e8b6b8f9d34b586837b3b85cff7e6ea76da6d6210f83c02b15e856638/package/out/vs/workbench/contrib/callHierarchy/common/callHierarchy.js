/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/editor/common/languageFeatureRegistry", "vs/base/common/uri", "vs/editor/common/core/position", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/platform/commands/common/commands", "vs/base/common/types", "vs/editor/common/services/model", "vs/editor/common/services/resolverService"], function (require, exports, cancellation_1, languageFeatureRegistry_1, uri_1, position_1, arrays_1, errors_1, lifecycle_1, commands_1, types_1, model_1, resolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CallHierarchyModel = exports.CallHierarchyProviderRegistry = exports.CallHierarchyDirection = void 0;
    var CallHierarchyDirection;
    (function (CallHierarchyDirection) {
        CallHierarchyDirection["CallsTo"] = "incomingCalls";
        CallHierarchyDirection["CallsFrom"] = "outgoingCalls";
    })(CallHierarchyDirection = exports.CallHierarchyDirection || (exports.CallHierarchyDirection = {}));
    exports.CallHierarchyProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    class CallHierarchyModel {
        constructor(id, provider, roots, ref) {
            this.id = id;
            this.provider = provider;
            this.roots = roots;
            this.ref = ref;
            this.root = roots[0];
        }
        static async create(model, position, token) {
            const [provider] = exports.CallHierarchyProviderRegistry.ordered(model);
            if (!provider) {
                return undefined;
            }
            const session = await provider.prepareCallHierarchy(model, position, token);
            if (!session) {
                return undefined;
            }
            return new CallHierarchyModel(session.roots.reduce((p, c) => p + c._sessionId, ''), provider, session.roots, new lifecycle_1.RefCountedDisposable(session));
        }
        dispose() {
            this.ref.release();
        }
        fork(item) {
            const that = this;
            return new class extends CallHierarchyModel {
                constructor() {
                    super(that.id, that.provider, [item], that.ref.acquire());
                }
            };
        }
        async resolveIncomingCalls(item, token) {
            try {
                const result = await this.provider.provideIncomingCalls(item, token);
                if ((0, arrays_1.isNonEmptyArray)(result)) {
                    return result;
                }
            }
            catch (e) {
                (0, errors_1.onUnexpectedExternalError)(e);
            }
            return [];
        }
        async resolveOutgoingCalls(item, token) {
            try {
                const result = await this.provider.provideOutgoingCalls(item, token);
                if ((0, arrays_1.isNonEmptyArray)(result)) {
                    return result;
                }
            }
            catch (e) {
                (0, errors_1.onUnexpectedExternalError)(e);
            }
            return [];
        }
    }
    exports.CallHierarchyModel = CallHierarchyModel;
    // --- API command support
    const _models = new Map();
    commands_1.CommandsRegistry.registerCommand('_executePrepareCallHierarchy', async (accessor, ...args) => {
        const [resource, position] = args;
        (0, types_1.assertType)(uri_1.URI.isUri(resource));
        (0, types_1.assertType)(position_1.Position.isIPosition(position));
        const modelService = accessor.get(model_1.IModelService);
        let textModel = modelService.getModel(resource);
        let textModelReference;
        if (!textModel) {
            const textModelService = accessor.get(resolverService_1.ITextModelService);
            const result = await textModelService.createModelReference(resource);
            textModel = result.object.textEditorModel;
            textModelReference = result;
        }
        try {
            const model = await CallHierarchyModel.create(textModel, position, cancellation_1.CancellationToken.None);
            if (!model) {
                return [];
            }
            //
            _models.set(model.id, model);
            _models.forEach((value, key, map) => {
                if (map.size > 10) {
                    value.dispose();
                    _models.delete(key);
                }
            });
            return [model.root];
        }
        finally {
            textModelReference === null || textModelReference === void 0 ? void 0 : textModelReference.dispose();
        }
    });
    function isCallHierarchyItemDto(obj) {
        return true;
    }
    commands_1.CommandsRegistry.registerCommand('_executeProvideIncomingCalls', async (_accessor, ...args) => {
        const [item] = args;
        (0, types_1.assertType)(isCallHierarchyItemDto(item));
        // find model
        const model = _models.get(item._sessionId);
        if (!model) {
            return undefined;
        }
        return model.resolveIncomingCalls(item, cancellation_1.CancellationToken.None);
    });
    commands_1.CommandsRegistry.registerCommand('_executeProvideOutgoingCalls', async (_accessor, ...args) => {
        const [item] = args;
        (0, types_1.assertType)(isCallHierarchyItemDto(item));
        // find model
        const model = _models.get(item._sessionId);
        if (!model) {
            return undefined;
        }
        return model.resolveOutgoingCalls(item, cancellation_1.CancellationToken.None);
    });
});
//# sourceMappingURL=callHierarchy.js.map