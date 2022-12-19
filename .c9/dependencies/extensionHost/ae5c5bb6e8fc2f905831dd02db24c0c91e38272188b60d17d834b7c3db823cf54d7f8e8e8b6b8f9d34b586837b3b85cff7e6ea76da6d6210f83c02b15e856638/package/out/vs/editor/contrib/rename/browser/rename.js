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
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/common/uri", "vs/editor/contrib/editorState/browser/editorState", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/bulkEditService", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/services/textResourceConfiguration", "vs/editor/contrib/message/browser/messageController", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/platform/registry/common/platform", "./renameInputField", "vs/editor/common/services/languageFeatures"], function (require, exports, aria_1, async_1, cancellation_1, errors_1, lifecycle_1, types_1, uri_1, editorState_1, editorExtensions_1, bulkEditService_1, codeEditorService_1, position_1, range_1, editorContextKeys_1, textResourceConfiguration_1, messageController_1, nls, configurationRegistry_1, contextkey_1, instantiation_1, log_1, notification_1, progress_1, platform_1, renameInputField_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RenameAction = exports.rename = void 0;
    class RenameSkeleton {
        constructor(model, position, registry) {
            this.model = model;
            this.position = position;
            this._providerRenameIdx = 0;
            this._providers = registry.ordered(model);
        }
        hasProvider() {
            return this._providers.length > 0;
        }
        async resolveRenameLocation(token) {
            const rejects = [];
            for (this._providerRenameIdx = 0; this._providerRenameIdx < this._providers.length; this._providerRenameIdx++) {
                const provider = this._providers[this._providerRenameIdx];
                if (!provider.resolveRenameLocation) {
                    break;
                }
                let res = await provider.resolveRenameLocation(this.model, this.position, token);
                if (!res) {
                    continue;
                }
                if (res.rejectReason) {
                    rejects.push(res.rejectReason);
                    continue;
                }
                return res;
            }
            const word = this.model.getWordAtPosition(this.position);
            if (!word) {
                return {
                    range: range_1.Range.fromPositions(this.position),
                    text: '',
                    rejectReason: rejects.length > 0 ? rejects.join('\n') : undefined
                };
            }
            return {
                range: new range_1.Range(this.position.lineNumber, word.startColumn, this.position.lineNumber, word.endColumn),
                text: word.word,
                rejectReason: rejects.length > 0 ? rejects.join('\n') : undefined
            };
        }
        async provideRenameEdits(newName, token) {
            return this._provideRenameEdits(newName, this._providerRenameIdx, [], token);
        }
        async _provideRenameEdits(newName, i, rejects, token) {
            const provider = this._providers[i];
            if (!provider) {
                return {
                    edits: [],
                    rejectReason: rejects.join('\n')
                };
            }
            const result = await provider.provideRenameEdits(this.model, this.position, newName, token);
            if (!result) {
                return this._provideRenameEdits(newName, i + 1, rejects.concat(nls.localize('no result', "No result.")), token);
            }
            else if (result.rejectReason) {
                return this._provideRenameEdits(newName, i + 1, rejects.concat(result.rejectReason), token);
            }
            return result;
        }
    }
    async function rename(registry, model, position, newName) {
        const skeleton = new RenameSkeleton(model, position, registry);
        const loc = await skeleton.resolveRenameLocation(cancellation_1.CancellationToken.None);
        if (loc === null || loc === void 0 ? void 0 : loc.rejectReason) {
            return { edits: [], rejectReason: loc.rejectReason };
        }
        return skeleton.provideRenameEdits(newName, cancellation_1.CancellationToken.None);
    }
    exports.rename = rename;
    // ---  register actions and commands
    let RenameController = class RenameController {
        constructor(editor, _instaService, _notificationService, _bulkEditService, _progressService, _logService, _configService, _languageFeaturesService) {
            this.editor = editor;
            this._instaService = _instaService;
            this._notificationService = _notificationService;
            this._bulkEditService = _bulkEditService;
            this._progressService = _progressService;
            this._logService = _logService;
            this._configService = _configService;
            this._languageFeaturesService = _languageFeaturesService;
            this._dispoableStore = new lifecycle_1.DisposableStore();
            this._cts = new cancellation_1.CancellationTokenSource();
            this._renameInputField = this._dispoableStore.add(new async_1.IdleValue(() => this._dispoableStore.add(this._instaService.createInstance(renameInputField_1.RenameInputField, this.editor, ['acceptRenameInput', 'acceptRenameInputWithPreview']))));
        }
        static get(editor) {
            return editor.getContribution(RenameController.ID);
        }
        dispose() {
            this._dispoableStore.dispose();
            this._cts.dispose(true);
        }
        async run() {
            var _a, _b;
            this._cts.dispose(true);
            if (!this.editor.hasModel()) {
                return undefined;
            }
            const position = this.editor.getPosition();
            const skeleton = new RenameSkeleton(this.editor.getModel(), position, this._languageFeaturesService.renameProvider);
            if (!skeleton.hasProvider()) {
                return undefined;
            }
            this._cts = new editorState_1.EditorStateCancellationTokenSource(this.editor, 4 /* CodeEditorStateFlag.Position */ | 1 /* CodeEditorStateFlag.Value */);
            // resolve rename location
            let loc;
            try {
                const resolveLocationOperation = skeleton.resolveRenameLocation(this._cts.token);
                this._progressService.showWhile(resolveLocationOperation, 250);
                loc = await resolveLocationOperation;
            }
            catch (e) {
                (_a = messageController_1.MessageController.get(this.editor)) === null || _a === void 0 ? void 0 : _a.showMessage(e || nls.localize('resolveRenameLocationFailed', "An unknown error occurred while resolving rename location"), position);
                return undefined;
            }
            if (!loc) {
                return undefined;
            }
            if (loc.rejectReason) {
                (_b = messageController_1.MessageController.get(this.editor)) === null || _b === void 0 ? void 0 : _b.showMessage(loc.rejectReason, position);
                return undefined;
            }
            if (this._cts.token.isCancellationRequested) {
                return undefined;
            }
            this._cts.dispose();
            this._cts = new editorState_1.EditorStateCancellationTokenSource(this.editor, 4 /* CodeEditorStateFlag.Position */ | 1 /* CodeEditorStateFlag.Value */, loc.range);
            // do rename at location
            let selection = this.editor.getSelection();
            let selectionStart = 0;
            let selectionEnd = loc.text.length;
            if (!range_1.Range.isEmpty(selection) && !range_1.Range.spansMultipleLines(selection) && range_1.Range.containsRange(loc.range, selection)) {
                selectionStart = Math.max(0, selection.startColumn - loc.range.startColumn);
                selectionEnd = Math.min(loc.range.endColumn, selection.endColumn) - loc.range.startColumn;
            }
            const supportPreview = this._bulkEditService.hasPreviewHandler() && this._configService.getValue(this.editor.getModel().uri, 'editor.rename.enablePreview');
            const inputFieldResult = await this._renameInputField.value.getInput(loc.range, loc.text, selectionStart, selectionEnd, supportPreview, this._cts.token);
            // no result, only hint to focus the editor or not
            if (typeof inputFieldResult === 'boolean') {
                if (inputFieldResult) {
                    this.editor.focus();
                }
                return undefined;
            }
            this.editor.focus();
            const renameOperation = (0, async_1.raceCancellation)(skeleton.provideRenameEdits(inputFieldResult.newName, this._cts.token), this._cts.token).then(async (renameResult) => {
                if (!renameResult || !this.editor.hasModel()) {
                    return;
                }
                if (renameResult.rejectReason) {
                    this._notificationService.info(renameResult.rejectReason);
                    return;
                }
                // collapse selection to active end
                this.editor.setSelection(range_1.Range.fromPositions(this.editor.getSelection().getPosition()));
                this._bulkEditService.apply(bulkEditService_1.ResourceEdit.convert(renameResult), {
                    editor: this.editor,
                    showPreview: inputFieldResult.wantsPreview,
                    label: nls.localize('label', "Renaming '{0}' to '{1}'", loc === null || loc === void 0 ? void 0 : loc.text, inputFieldResult.newName),
                    code: 'undoredo.rename',
                    quotableLabel: nls.localize('quotableLabel', "Renaming {0} to {1}", loc === null || loc === void 0 ? void 0 : loc.text, inputFieldResult.newName),
                    respectAutoSaveConfig: true
                }).then(result => {
                    if (result.ariaSummary) {
                        (0, aria_1.alert)(nls.localize('aria', "Successfully renamed '{0}' to '{1}'. Summary: {2}", loc.text, inputFieldResult.newName, result.ariaSummary));
                    }
                }).catch(err => {
                    this._notificationService.error(nls.localize('rename.failedApply', "Rename failed to apply edits"));
                    this._logService.error(err);
                });
            }, err => {
                this._notificationService.error(nls.localize('rename.failed', "Rename failed to compute edits"));
                this._logService.error(err);
            });
            this._progressService.showWhile(renameOperation, 250);
            return renameOperation;
        }
        acceptRenameInput(wantsPreview) {
            this._renameInputField.value.acceptInput(wantsPreview);
        }
        cancelRenameInput() {
            this._renameInputField.value.cancelInput(true);
        }
    };
    RenameController.ID = 'editor.contrib.renameController';
    RenameController = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, notification_1.INotificationService),
        __param(3, bulkEditService_1.IBulkEditService),
        __param(4, progress_1.IEditorProgressService),
        __param(5, log_1.ILogService),
        __param(6, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(7, languageFeatures_1.ILanguageFeaturesService)
    ], RenameController);
    // ---- action implementation
    class RenameAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.rename',
                label: nls.localize('rename.label', "Rename Symbol"),
                alias: 'Rename Symbol',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasRenameProvider),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 60 /* KeyCode.F2 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                contextMenuOpts: {
                    group: '1_modification',
                    order: 1.1
                }
            });
        }
        runCommand(accessor, args) {
            const editorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const [uri, pos] = Array.isArray(args) && args || [undefined, undefined];
            if (uri_1.URI.isUri(uri) && position_1.Position.isIPosition(pos)) {
                return editorService.openCodeEditor({ resource: uri }, editorService.getActiveCodeEditor()).then(editor => {
                    if (!editor) {
                        return;
                    }
                    editor.setPosition(pos);
                    editor.invokeWithinContext(accessor => {
                        this.reportTelemetry(accessor, editor);
                        return this.run(accessor, editor);
                    });
                }, errors_1.onUnexpectedError);
            }
            return super.runCommand(accessor, args);
        }
        run(accessor, editor) {
            const controller = RenameController.get(editor);
            if (controller) {
                return controller.run();
            }
            return Promise.resolve();
        }
    }
    exports.RenameAction = RenameAction;
    (0, editorExtensions_1.registerEditorContribution)(RenameController.ID, RenameController);
    (0, editorExtensions_1.registerEditorAction)(RenameAction);
    const RenameCommand = editorExtensions_1.EditorCommand.bindToContribution(RenameController.get);
    (0, editorExtensions_1.registerEditorCommand)(new RenameCommand({
        id: 'acceptRenameInput',
        precondition: renameInputField_1.CONTEXT_RENAME_INPUT_VISIBLE,
        handler: x => x.acceptRenameInput(false),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 99,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 3 /* KeyCode.Enter */
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new RenameCommand({
        id: 'acceptRenameInputWithPreview',
        precondition: contextkey_1.ContextKeyExpr.and(renameInputField_1.CONTEXT_RENAME_INPUT_VISIBLE, contextkey_1.ContextKeyExpr.has('config.editor.rename.enablePreview')),
        handler: x => x.acceptRenameInput(true),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 99,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 1024 /* KeyMod.Shift */ + 3 /* KeyCode.Enter */
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new RenameCommand({
        id: 'cancelRenameInput',
        precondition: renameInputField_1.CONTEXT_RENAME_INPUT_VISIBLE,
        handler: x => x.cancelRenameInput(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 99,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 9 /* KeyCode.Escape */,
            secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
        }
    }));
    // ---- api bridge command
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executeDocumentRenameProvider', function (accessor, model, position, ...args) {
        const [newName] = args;
        (0, types_1.assertType)(typeof newName === 'string');
        const { renameProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        return rename(renameProvider, model, position, newName);
    });
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executePrepareRename', async function (accessor, model, position) {
        const { renameProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const skeleton = new RenameSkeleton(model, position, renameProvider);
        const loc = await skeleton.resolveRenameLocation(cancellation_1.CancellationToken.None);
        if (loc === null || loc === void 0 ? void 0 : loc.rejectReason) {
            throw new Error(loc.rejectReason);
        }
        return loc;
    });
    //todo@jrieken use editor options world
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'editor',
        properties: {
            'editor.rename.enablePreview': {
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                description: nls.localize('enablePreview', "Enable/disable the ability to preview changes before renaming"),
                default: true,
                type: 'boolean'
            }
        }
    });
});
//# sourceMappingURL=rename.js.map