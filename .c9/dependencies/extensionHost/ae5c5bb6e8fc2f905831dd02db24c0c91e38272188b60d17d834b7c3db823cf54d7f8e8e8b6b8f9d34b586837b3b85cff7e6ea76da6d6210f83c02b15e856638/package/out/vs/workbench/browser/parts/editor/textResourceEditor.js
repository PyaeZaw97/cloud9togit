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
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/editor/browser/editorBrowser", "vs/workbench/common/editor", "vs/workbench/common/editor/editorOptions", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/common/editor/textEditorModel", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/browser/parts/editor/textEditor", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/editor/common/services/textResourceConfiguration", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/languages/modesRegistry"], function (require, exports, nls_1, types_1, editorBrowser_1, editor_1, editorOptions_1, textResourceEditorInput_1, textEditorModel_1, untitledTextEditorInput_1, textEditor_1, telemetry_1, storage_1, textResourceConfiguration_1, instantiation_1, themeService_1, editorGroupsService_1, editorService_1, model_1, language_1, modesRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextResourceEditor = exports.AbstractTextResourceEditor = void 0;
    /**
     * An editor implementation that is capable of showing the contents of resource inputs. Uses
     * the TextEditor widget to show the contents.
     */
    let AbstractTextResourceEditor = class AbstractTextResourceEditor extends textEditor_1.BaseTextEditor {
        constructor(id, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorGroupService, editorService) {
            super(id, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService);
        }
        getTitle() {
            if (this.input) {
                return this.input.getName();
            }
            return (0, nls_1.localize)('textEditor', "Text Editor");
        }
        async setInput(input, options, context, token) {
            // Set input and resolve
            await super.setInput(input, options, context, token);
            const resolvedModel = await input.resolve();
            // Check for cancellation
            if (token.isCancellationRequested) {
                return undefined;
            }
            // Assert Model instance
            if (!(resolvedModel instanceof textEditorModel_1.BaseTextEditorModel)) {
                throw new Error('Unable to open file as text');
            }
            // Set Editor Model
            const textEditor = (0, types_1.assertIsDefined)(this.getControl());
            const textEditorModel = resolvedModel.textEditorModel;
            textEditor.setModel(textEditorModel);
            // Restore view state (unless provided by options)
            if (!(0, editor_1.isTextEditorViewState)(options === null || options === void 0 ? void 0 : options.viewState)) {
                const editorViewState = this.loadEditorViewState(input, context);
                if (editorViewState) {
                    if (options === null || options === void 0 ? void 0 : options.selection) {
                        editorViewState.cursorState = []; // prevent duplicate selections via options
                    }
                    textEditor.restoreViewState(editorViewState);
                }
            }
            // Apply options to editor if any
            if (options) {
                (0, editorOptions_1.applyTextEditorOptions)(options, textEditor, 1 /* ScrollType.Immediate */);
            }
            // Since the resolved model provides information about being readonly
            // or not, we apply it here to the editor even though the editor input
            // was already asked for being readonly or not. The rationale is that
            // a resolved model might have more specific information about being
            // readonly or not that the input did not have.
            textEditor.updateOptions({ readOnly: resolvedModel.isReadonly() });
        }
        /**
         * Reveals the last line of this editor if it has a model set.
         */
        revealLastLine() {
            const codeEditor = this.getControl();
            const model = codeEditor.getModel();
            if (model) {
                const lastLine = model.getLineCount();
                codeEditor.revealPosition({ lineNumber: lastLine, column: model.getLineMaxColumn(lastLine) }, 0 /* ScrollType.Smooth */);
            }
        }
        clearInput() {
            super.clearInput();
            // Clear Model
            const textEditor = this.getControl();
            if (textEditor) {
                textEditor.setModel(null);
            }
        }
        tracksEditorViewState(input) {
            // editor view state persistence is only enabled for untitled and resource inputs
            return input instanceof untitledTextEditorInput_1.UntitledTextEditorInput || input instanceof textResourceEditorInput_1.TextResourceEditorInput;
        }
    };
    AbstractTextResourceEditor = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, storage_1.IStorageService),
        __param(4, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(5, themeService_1.IThemeService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, editorService_1.IEditorService)
    ], AbstractTextResourceEditor);
    exports.AbstractTextResourceEditor = AbstractTextResourceEditor;
    let TextResourceEditor = class TextResourceEditor extends AbstractTextResourceEditor {
        constructor(telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService, modelService, languageService) {
            super(TextResourceEditor.ID, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorGroupService, editorService);
            this.modelService = modelService;
            this.languageService = languageService;
        }
        createEditorControl(parent, configuration) {
            const control = super.createEditorControl(parent, configuration);
            // Install a listener for paste to update this editors
            // language if the paste includes a specific language
            const codeEditor = (0, editorBrowser_1.getCodeEditor)(control);
            if (codeEditor) {
                this._register(codeEditor.onDidPaste(e => this.onDidEditorPaste(e, codeEditor)));
            }
            return control;
        }
        onDidEditorPaste(e, codeEditor) {
            if (this.input instanceof untitledTextEditorInput_1.UntitledTextEditorInput && this.input.model.hasLanguageSetExplicitly) {
                return; // do not override language if it was set explicitly
            }
            if (e.range.startLineNumber !== 1 || e.range.startColumn !== 1) {
                return; // document had existing content before the pasted text, don't override.
            }
            if (codeEditor.getOption(81 /* EditorOption.readOnly */)) {
                return; // not for readonly editors
            }
            const textModel = codeEditor.getModel();
            if (!textModel) {
                return; // require a live model
            }
            const pasteIsWholeContents = textModel.getLineCount() === e.range.endLineNumber && textModel.getLineMaxColumn(e.range.endLineNumber) === e.range.endColumn;
            if (!pasteIsWholeContents) {
                return; // document had existing content after the pasted text, don't override.
            }
            const currentLanguageId = textModel.getLanguageId();
            if (currentLanguageId !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
                return; // require current languageId to be unspecific
            }
            let candidateLanguage = undefined;
            // A languageId is provided via the paste event so text was copied using
            // VSCode. As such we trust this languageId and use it if specific
            if (e.languageId) {
                candidateLanguage = { id: e.languageId, source: 'event' };
            }
            // A languageId was not provided, so the data comes from outside VSCode
            // We can still try to guess a good languageId from the first line if
            // the paste changed the first line
            else {
                const guess = (0, types_1.withNullAsUndefined)(this.languageService.guessLanguageIdByFilepathOrFirstLine(textModel.uri, textModel.getLineContent(1).substr(0, 1000 /* ModelConstants.FIRST_LINE_DETECTION_LENGTH_LIMIT */)));
                if (guess) {
                    candidateLanguage = { id: guess, source: 'guess' };
                }
            }
            // Finally apply languageId to model if specified
            if (candidateLanguage && candidateLanguage.id !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
                if (this.input instanceof untitledTextEditorInput_1.UntitledTextEditorInput && candidateLanguage.source === 'event') {
                    // High confidence, set language id at TextEditorModel level to block future auto-detection
                    this.input.model.setLanguageId(candidateLanguage.id);
                }
                else {
                    this.modelService.setMode(textModel, this.languageService.createById(candidateLanguage.id));
                }
            }
        }
    };
    TextResourceEditor.ID = 'workbench.editors.textResourceEditor';
    TextResourceEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, storage_1.IStorageService),
        __param(3, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(4, themeService_1.IThemeService),
        __param(5, editorService_1.IEditorService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, model_1.IModelService),
        __param(8, language_1.ILanguageService)
    ], TextResourceEditor);
    exports.TextResourceEditor = TextResourceEditor;
});
//# sourceMappingURL=textResourceEditor.js.map