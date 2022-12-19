/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/bulkEditService", "vs/editor/common/editorContextKeys", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/codeAction/browser/codeAction", "vs/editor/contrib/codeAction/browser/codeActionUi", "vs/editor/contrib/message/browser/messageController", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/markers/common/markers", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/platform/telemetry/common/telemetry", "./codeActionModel", "./types"], function (require, exports, cancellation_1, lazy_1, lifecycle_1, strings_1, editorExtensions_1, bulkEditService_1, editorContextKeys_1, languageFeatures_1, codeAction_1, codeActionUi_1, messageController_1, nls, commands_1, contextkey_1, instantiation_1, markers_1, notification_1, progress_1, telemetry_1, codeActionModel_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AutoFixAction = exports.FixAllAction = exports.OrganizeImportsAction = exports.SourceAction = exports.RefactorAction = exports.CodeActionCommand = exports.QuickFixAction = exports.applyCodeAction = exports.QuickFixController = void 0;
    function contextKeyForSupportedActions(kind) {
        return contextkey_1.ContextKeyExpr.regex(codeActionModel_1.SUPPORTED_CODE_ACTIONS.keys()[0], new RegExp('(\\s|^)' + (0, strings_1.escapeRegExpCharacters)(kind.value) + '\\b'));
    }
    const argsSchema = {
        type: 'object',
        defaultSnippets: [{ body: { kind: '' } }],
        properties: {
            'kind': {
                type: 'string',
                description: nls.localize('args.schema.kind', "Kind of the code action to run."),
            },
            'apply': {
                type: 'string',
                description: nls.localize('args.schema.apply', "Controls when the returned actions are applied."),
                default: "ifSingle" /* CodeActionAutoApply.IfSingle */,
                enum: ["first" /* CodeActionAutoApply.First */, "ifSingle" /* CodeActionAutoApply.IfSingle */, "never" /* CodeActionAutoApply.Never */],
                enumDescriptions: [
                    nls.localize('args.schema.apply.first', "Always apply the first returned code action."),
                    nls.localize('args.schema.apply.ifSingle', "Apply the first returned code action if it is the only one."),
                    nls.localize('args.schema.apply.never', "Do not apply the returned code actions."),
                ]
            },
            'preferred': {
                type: 'boolean',
                default: false,
                description: nls.localize('args.schema.preferred', "Controls if only preferred code actions should be returned."),
            }
        }
    };
    let QuickFixController = class QuickFixController extends lifecycle_1.Disposable {
        constructor(editor, markerService, contextKeyService, progressService, _instantiationService, languageFeaturesService) {
            super();
            this._instantiationService = _instantiationService;
            this._editor = editor;
            this._model = this._register(new codeActionModel_1.CodeActionModel(this._editor, languageFeaturesService.codeActionProvider, markerService, contextKeyService, progressService));
            this._register(this._model.onDidChangeState(newState => this.update(newState)));
            this._ui = new lazy_1.Lazy(() => this._register(new codeActionUi_1.CodeActionUi(editor, QuickFixAction.Id, AutoFixAction.Id, {
                applyCodeAction: async (action, retrigger) => {
                    try {
                        await this._applyCodeAction(action);
                    }
                    finally {
                        if (retrigger) {
                            this._trigger({ type: 2 /* CodeActionTriggerType.Auto */, filter: {} });
                        }
                    }
                }
            }, this._instantiationService)));
        }
        static get(editor) {
            return editor.getContribution(QuickFixController.ID);
        }
        update(newState) {
            this._ui.getValue().update(newState);
        }
        showCodeActions(trigger, actions, at) {
            return this._ui.getValue().showCodeActionList(trigger, actions, at, { includeDisabledActions: false });
        }
        manualTriggerAtCurrentPosition(notAvailableMessage, filter, autoApply) {
            var _a;
            if (!this._editor.hasModel()) {
                return;
            }
            (_a = messageController_1.MessageController.get(this._editor)) === null || _a === void 0 ? void 0 : _a.closeMessage();
            const triggerPosition = this._editor.getPosition();
            this._trigger({ type: 1 /* CodeActionTriggerType.Invoke */, filter, autoApply, context: { notAvailableMessage, position: triggerPosition } });
        }
        _trigger(trigger) {
            return this._model.trigger(trigger);
        }
        _applyCodeAction(action) {
            return this._instantiationService.invokeFunction(applyCodeAction, action, this._editor);
        }
    };
    QuickFixController.ID = 'editor.contrib.quickFixController';
    QuickFixController = __decorate([
        __param(1, markers_1.IMarkerService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, progress_1.IEditorProgressService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, languageFeatures_1.ILanguageFeaturesService)
    ], QuickFixController);
    exports.QuickFixController = QuickFixController;
    async function applyCodeAction(accessor, item, editor) {
        const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
        const commandService = accessor.get(commands_1.ICommandService);
        const telemetryService = accessor.get(telemetry_1.ITelemetryService);
        const notificationService = accessor.get(notification_1.INotificationService);
        telemetryService.publicLog2('codeAction.applyCodeAction', {
            codeActionTitle: item.action.title,
            codeActionKind: item.action.kind,
            codeActionIsPreferred: !!item.action.isPreferred,
        });
        await item.resolve(cancellation_1.CancellationToken.None);
        if (item.action.edit) {
            await bulkEditService.apply(bulkEditService_1.ResourceEdit.convert(item.action.edit), {
                editor,
                label: item.action.title,
                quotableLabel: item.action.title,
                code: 'undoredo.codeAction',
                respectAutoSaveConfig: true
            });
        }
        if (item.action.command) {
            try {
                await commandService.executeCommand(item.action.command.id, ...(item.action.command.arguments || []));
            }
            catch (err) {
                const message = asMessage(err);
                notificationService.error(typeof message === 'string'
                    ? message
                    : nls.localize('applyCodeActionFailed', "An unknown error occurred while applying the code action"));
            }
        }
    }
    exports.applyCodeAction = applyCodeAction;
    function asMessage(err) {
        if (typeof err === 'string') {
            return err;
        }
        else if (err instanceof Error && typeof err.message === 'string') {
            return err.message;
        }
        else {
            return undefined;
        }
    }
    function triggerCodeActionsForEditorSelection(editor, notAvailableMessage, filter, autoApply) {
        if (editor.hasModel()) {
            const controller = QuickFixController.get(editor);
            if (controller) {
                controller.manualTriggerAtCurrentPosition(notAvailableMessage, filter, autoApply);
            }
        }
    }
    class QuickFixAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: QuickFixAction.Id,
                label: nls.localize('quickfix.trigger.label', "Quick Fix..."),
                alias: 'Quick Fix...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCodeActionsProvider),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 84 /* KeyCode.Period */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            return triggerCodeActionsForEditorSelection(editor, nls.localize('editor.action.quickFix.noneMessage', "No code actions available"), undefined, undefined);
        }
    }
    exports.QuickFixAction = QuickFixAction;
    QuickFixAction.Id = 'editor.action.quickFix';
    class CodeActionCommand extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: codeAction_1.codeActionCommandId,
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCodeActionsProvider),
                description: {
                    description: 'Trigger a code action',
                    args: [{ name: 'args', schema: argsSchema, }]
                }
            });
        }
        runEditorCommand(_accessor, editor, userArgs) {
            const args = types_1.CodeActionCommandArgs.fromUser(userArgs, {
                kind: types_1.CodeActionKind.Empty,
                apply: "ifSingle" /* CodeActionAutoApply.IfSingle */,
            });
            return triggerCodeActionsForEditorSelection(editor, typeof (userArgs === null || userArgs === void 0 ? void 0 : userArgs.kind) === 'string'
                ? args.preferred
                    ? nls.localize('editor.action.codeAction.noneMessage.preferred.kind', "No preferred code actions for '{0}' available", userArgs.kind)
                    : nls.localize('editor.action.codeAction.noneMessage.kind', "No code actions for '{0}' available", userArgs.kind)
                : args.preferred
                    ? nls.localize('editor.action.codeAction.noneMessage.preferred', "No preferred code actions available")
                    : nls.localize('editor.action.codeAction.noneMessage', "No code actions available"), {
                include: args.kind,
                includeSourceActions: true,
                onlyIncludePreferredActions: args.preferred,
            }, args.apply);
        }
    }
    exports.CodeActionCommand = CodeActionCommand;
    class RefactorAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: codeAction_1.refactorCommandId,
                label: nls.localize('refactor.label', "Refactor..."),
                alias: 'Refactor...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCodeActionsProvider),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 48 /* KeyCode.KeyR */,
                    mac: {
                        primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 48 /* KeyCode.KeyR */
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                contextMenuOpts: {
                    group: '1_modification',
                    order: 2,
                    when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(types_1.CodeActionKind.Refactor)),
                },
                description: {
                    description: 'Refactor...',
                    args: [{ name: 'args', schema: argsSchema }]
                }
            });
        }
        run(_accessor, editor, userArgs) {
            const args = types_1.CodeActionCommandArgs.fromUser(userArgs, {
                kind: types_1.CodeActionKind.Refactor,
                apply: "never" /* CodeActionAutoApply.Never */
            });
            return triggerCodeActionsForEditorSelection(editor, typeof (userArgs === null || userArgs === void 0 ? void 0 : userArgs.kind) === 'string'
                ? args.preferred
                    ? nls.localize('editor.action.refactor.noneMessage.preferred.kind', "No preferred refactorings for '{0}' available", userArgs.kind)
                    : nls.localize('editor.action.refactor.noneMessage.kind', "No refactorings for '{0}' available", userArgs.kind)
                : args.preferred
                    ? nls.localize('editor.action.refactor.noneMessage.preferred', "No preferred refactorings available")
                    : nls.localize('editor.action.refactor.noneMessage', "No refactorings available"), {
                include: types_1.CodeActionKind.Refactor.contains(args.kind) ? args.kind : types_1.CodeActionKind.None,
                onlyIncludePreferredActions: args.preferred,
            }, args.apply);
        }
    }
    exports.RefactorAction = RefactorAction;
    class SourceAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: codeAction_1.sourceActionCommandId,
                label: nls.localize('source.label', "Source Action..."),
                alias: 'Source Action...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCodeActionsProvider),
                contextMenuOpts: {
                    group: '1_modification',
                    order: 2.1,
                    when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(types_1.CodeActionKind.Source)),
                },
                description: {
                    description: 'Source Action...',
                    args: [{ name: 'args', schema: argsSchema }]
                }
            });
        }
        run(_accessor, editor, userArgs) {
            const args = types_1.CodeActionCommandArgs.fromUser(userArgs, {
                kind: types_1.CodeActionKind.Source,
                apply: "never" /* CodeActionAutoApply.Never */
            });
            return triggerCodeActionsForEditorSelection(editor, typeof (userArgs === null || userArgs === void 0 ? void 0 : userArgs.kind) === 'string'
                ? args.preferred
                    ? nls.localize('editor.action.source.noneMessage.preferred.kind', "No preferred source actions for '{0}' available", userArgs.kind)
                    : nls.localize('editor.action.source.noneMessage.kind', "No source actions for '{0}' available", userArgs.kind)
                : args.preferred
                    ? nls.localize('editor.action.source.noneMessage.preferred', "No preferred source actions available")
                    : nls.localize('editor.action.source.noneMessage', "No source actions available"), {
                include: types_1.CodeActionKind.Source.contains(args.kind) ? args.kind : types_1.CodeActionKind.None,
                includeSourceActions: true,
                onlyIncludePreferredActions: args.preferred,
            }, args.apply);
        }
    }
    exports.SourceAction = SourceAction;
    class OrganizeImportsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: codeAction_1.organizeImportsCommandId,
                label: nls.localize('organizeImports.label', "Organize Imports"),
                alias: 'Organize Imports',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(types_1.CodeActionKind.SourceOrganizeImports)),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 45 /* KeyCode.KeyO */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
            });
        }
        run(_accessor, editor) {
            return triggerCodeActionsForEditorSelection(editor, nls.localize('editor.action.organize.noneMessage', "No organize imports action available"), { include: types_1.CodeActionKind.SourceOrganizeImports, includeSourceActions: true }, "ifSingle" /* CodeActionAutoApply.IfSingle */);
        }
    }
    exports.OrganizeImportsAction = OrganizeImportsAction;
    class FixAllAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: codeAction_1.fixAllCommandId,
                label: nls.localize('fixAll.label', "Fix All"),
                alias: 'Fix All',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(types_1.CodeActionKind.SourceFixAll))
            });
        }
        run(_accessor, editor) {
            return triggerCodeActionsForEditorSelection(editor, nls.localize('fixAll.noneMessage', "No fix all action available"), { include: types_1.CodeActionKind.SourceFixAll, includeSourceActions: true }, "ifSingle" /* CodeActionAutoApply.IfSingle */);
        }
    }
    exports.FixAllAction = FixAllAction;
    class AutoFixAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: AutoFixAction.Id,
                label: nls.localize('autoFix.label', "Auto Fix..."),
                alias: 'Auto Fix...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(types_1.CodeActionKind.QuickFix)),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 84 /* KeyCode.Period */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 84 /* KeyCode.Period */
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            return triggerCodeActionsForEditorSelection(editor, nls.localize('editor.action.autoFix.noneMessage', "No auto fixes available"), {
                include: types_1.CodeActionKind.QuickFix,
                onlyIncludePreferredActions: true
            }, "ifSingle" /* CodeActionAutoApply.IfSingle */);
        }
    }
    exports.AutoFixAction = AutoFixAction;
    AutoFixAction.Id = 'editor.action.autoFix';
});
//# sourceMappingURL=codeActionCommands.js.map