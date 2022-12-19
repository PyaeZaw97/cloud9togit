/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/contrib/editorState/browser/editorState", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/services/model", "vs/platform/commands/common/commands", "vs/platform/progress/common/progress", "./types", "vs/editor/common/services/languageFeatures"], function (require, exports, arrays_1, cancellation_1, errors_1, lifecycle_1, uri_1, editorState_1, range_1, selection_1, model_1, commands_1, progress_1, types_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getCodeActions = exports.CodeActionItem = exports.fixAllCommandId = exports.organizeImportsCommandId = exports.sourceActionCommandId = exports.refactorCommandId = exports.codeActionCommandId = void 0;
    exports.codeActionCommandId = 'editor.action.codeAction';
    exports.refactorCommandId = 'editor.action.refactor';
    exports.sourceActionCommandId = 'editor.action.sourceAction';
    exports.organizeImportsCommandId = 'editor.action.organizeImports';
    exports.fixAllCommandId = 'editor.action.fixAll';
    class CodeActionItem {
        constructor(action, provider) {
            this.action = action;
            this.provider = provider;
        }
        async resolve(token) {
            var _a;
            if (((_a = this.provider) === null || _a === void 0 ? void 0 : _a.resolveCodeAction) && !this.action.edit) {
                let action;
                try {
                    action = await this.provider.resolveCodeAction(this.action, token);
                }
                catch (err) {
                    (0, errors_1.onUnexpectedExternalError)(err);
                }
                if (action) {
                    this.action.edit = action.edit;
                }
            }
            return this;
        }
    }
    exports.CodeActionItem = CodeActionItem;
    class ManagedCodeActionSet extends lifecycle_1.Disposable {
        constructor(actions, documentation, disposables) {
            super();
            this.documentation = documentation;
            this._register(disposables);
            this.allActions = [...actions].sort(ManagedCodeActionSet.codeActionsComparator);
            this.validActions = this.allActions.filter(({ action }) => !action.disabled);
        }
        static codeActionsComparator({ action: a }, { action: b }) {
            if (a.isPreferred && !b.isPreferred) {
                return -1;
            }
            else if (!a.isPreferred && b.isPreferred) {
                return 1;
            }
            if ((0, arrays_1.isNonEmptyArray)(a.diagnostics)) {
                if ((0, arrays_1.isNonEmptyArray)(b.diagnostics)) {
                    return a.diagnostics[0].message.localeCompare(b.diagnostics[0].message);
                }
                else {
                    return -1;
                }
            }
            else if ((0, arrays_1.isNonEmptyArray)(b.diagnostics)) {
                return 1;
            }
            else {
                return 0; // both have no diagnostics
            }
        }
        get hasAutoFix() {
            return this.validActions.some(({ action: fix }) => !!fix.kind && types_1.CodeActionKind.QuickFix.contains(new types_1.CodeActionKind(fix.kind)) && !!fix.isPreferred);
        }
    }
    const emptyCodeActionsResponse = { actions: [], documentation: undefined };
    function getCodeActions(registry, model, rangeOrSelection, trigger, progress, token) {
        var _a;
        const filter = trigger.filter || {};
        const codeActionContext = {
            only: (_a = filter.include) === null || _a === void 0 ? void 0 : _a.value,
            trigger: trigger.type,
        };
        const cts = new editorState_1.TextModelCancellationTokenSource(model, token);
        const providers = getCodeActionProviders(registry, model, filter);
        const disposables = new lifecycle_1.DisposableStore();
        const promises = providers.map(async (provider) => {
            try {
                progress.report(provider);
                const providedCodeActions = await provider.provideCodeActions(model, rangeOrSelection, codeActionContext, cts.token);
                if (providedCodeActions) {
                    disposables.add(providedCodeActions);
                }
                if (cts.token.isCancellationRequested) {
                    return emptyCodeActionsResponse;
                }
                const filteredActions = ((providedCodeActions === null || providedCodeActions === void 0 ? void 0 : providedCodeActions.actions) || []).filter(action => action && (0, types_1.filtersAction)(filter, action));
                const documentation = getDocumentation(provider, filteredActions, filter.include);
                return {
                    actions: filteredActions.map(action => new CodeActionItem(action, provider)),
                    documentation
                };
            }
            catch (err) {
                if ((0, errors_1.isCancellationError)(err)) {
                    throw err;
                }
                (0, errors_1.onUnexpectedExternalError)(err);
                return emptyCodeActionsResponse;
            }
        });
        const listener = registry.onDidChange(() => {
            const newProviders = registry.all(model);
            if (!(0, arrays_1.equals)(newProviders, providers)) {
                cts.cancel();
            }
        });
        return Promise.all(promises).then(actions => {
            const allActions = actions.map(x => x.actions).flat();
            const allDocumentation = (0, arrays_1.coalesce)(actions.map(x => x.documentation));
            return new ManagedCodeActionSet(allActions, allDocumentation, disposables);
        })
            .finally(() => {
            listener.dispose();
            cts.dispose();
        });
    }
    exports.getCodeActions = getCodeActions;
    function getCodeActionProviders(registry, model, filter) {
        return registry.all(model)
            // Don't include providers that we know will not return code actions of interest
            .filter(provider => {
            if (!provider.providedCodeActionKinds) {
                // We don't know what type of actions this provider will return.
                return true;
            }
            return provider.providedCodeActionKinds.some(kind => (0, types_1.mayIncludeActionsOfKind)(filter, new types_1.CodeActionKind(kind)));
        });
    }
    function getDocumentation(provider, providedCodeActions, only) {
        if (!provider.documentation) {
            return undefined;
        }
        const documentation = provider.documentation.map(entry => ({ kind: new types_1.CodeActionKind(entry.kind), command: entry.command }));
        if (only) {
            let currentBest;
            for (const entry of documentation) {
                if (entry.kind.contains(only)) {
                    if (!currentBest) {
                        currentBest = entry;
                    }
                    else {
                        // Take best match
                        if (currentBest.kind.contains(entry.kind)) {
                            currentBest = entry;
                        }
                    }
                }
            }
            if (currentBest) {
                return currentBest === null || currentBest === void 0 ? void 0 : currentBest.command;
            }
        }
        // Otherwise, check to see if any of the provided actions match.
        for (const action of providedCodeActions) {
            if (!action.kind) {
                continue;
            }
            for (const entry of documentation) {
                if (entry.kind.contains(new types_1.CodeActionKind(action.kind))) {
                    return entry.command;
                }
            }
        }
        return undefined;
    }
    commands_1.CommandsRegistry.registerCommand('_executeCodeActionProvider', async function (accessor, resource, rangeOrSelection, kind, itemResolveCount) {
        if (!(resource instanceof uri_1.URI)) {
            throw (0, errors_1.illegalArgument)();
        }
        const { codeActionProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const model = accessor.get(model_1.IModelService).getModel(resource);
        if (!model) {
            throw (0, errors_1.illegalArgument)();
        }
        const validatedRangeOrSelection = selection_1.Selection.isISelection(rangeOrSelection)
            ? selection_1.Selection.liftSelection(rangeOrSelection)
            : range_1.Range.isIRange(rangeOrSelection)
                ? model.validateRange(rangeOrSelection)
                : undefined;
        if (!validatedRangeOrSelection) {
            throw (0, errors_1.illegalArgument)();
        }
        const include = typeof kind === 'string' ? new types_1.CodeActionKind(kind) : undefined;
        const codeActionSet = await getCodeActions(codeActionProvider, model, validatedRangeOrSelection, { type: 1 /* languages.CodeActionTriggerType.Invoke */, filter: { includeSourceActions: true, include } }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
        const resolving = [];
        const resolveCount = Math.min(codeActionSet.validActions.length, typeof itemResolveCount === 'number' ? itemResolveCount : 0);
        for (let i = 0; i < resolveCount; i++) {
            resolving.push(codeActionSet.validActions[i].resolve(cancellation_1.CancellationToken.None));
        }
        try {
            await Promise.all(resolving);
            return codeActionSet.validActions.map(item => item.action);
        }
        finally {
            setTimeout(() => codeActionSet.dispose(), 100);
        }
    });
});
//# sourceMappingURL=codeAction.js.map