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
define(["require", "exports", "vs/workbench/common/editor/textEditorModel", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/base/common/event", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/editor/common/services/textResourceConfiguration", "vs/editor/common/model/textModel", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/workingCopy/common/workingCopy", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/types", "vs/platform/label/common/label", "vs/editor/common/core/wordHelper", "vs/workbench/services/editor/common/editorService", "vs/base/common/strings", "vs/workbench/services/textfile/common/encoding", "vs/base/common/buffer", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/platform/accessibility/common/accessibility"], function (require, exports, textEditorModel_1, language_1, model_1, event_1, workingCopyBackup_1, textResourceConfiguration_1, textModel_1, workingCopyService_1, workingCopy_1, textfiles_1, types_1, label_1, wordHelper_1, editorService_1, strings_1, encoding_1, buffer_1, languageDetectionWorkerService_1, accessibility_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledTextEditorModel = void 0;
    let UntitledTextEditorModel = class UntitledTextEditorModel extends textEditorModel_1.BaseTextEditorModel {
        //#endregion
        constructor(resource, hasAssociatedFilePath, initialValue, preferredLanguageId, preferredEncoding, languageService, modelService, workingCopyBackupService, textResourceConfigurationService, workingCopyService, textFileService, labelService, editorService, languageDetectionService, accessibilityService) {
            super(modelService, languageService, languageDetectionService, accessibilityService);
            this.resource = resource;
            this.hasAssociatedFilePath = hasAssociatedFilePath;
            this.initialValue = initialValue;
            this.preferredLanguageId = preferredLanguageId;
            this.preferredEncoding = preferredEncoding;
            this.workingCopyBackupService = workingCopyBackupService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.workingCopyService = workingCopyService;
            this.textFileService = textFileService;
            this.labelService = labelService;
            this.editorService = editorService;
            //#region Events
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidChangeName = this._register(new event_1.Emitter());
            this.onDidChangeName = this._onDidChangeName.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeEncoding = this._register(new event_1.Emitter());
            this.onDidChangeEncoding = this._onDidChangeEncoding.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this._onDidRevert = this._register(new event_1.Emitter());
            this.onDidRevert = this._onDidRevert.event;
            //#endregion
            this.typeId = workingCopy_1.NO_TYPE_ID; // IMPORTANT: never change this to not break existing assumptions (e.g. backups)
            this.capabilities = 2 /* WorkingCopyCapabilities.Untitled */;
            //#region Name
            this.configuredLabelFormat = 'content';
            this.cachedModelFirstLineWords = undefined;
            //#endregion
            //#region Dirty
            this.dirty = this.hasAssociatedFilePath || !!this.initialValue;
            // Make known to working copy service
            this._register(this.workingCopyService.registerWorkingCopy(this));
            // This is typically controlled by the setting `files.defaultLanguage`.
            // If that setting is set, we should not detect the language.
            if (preferredLanguageId) {
                this.setLanguageId(preferredLanguageId);
            }
            // Fetch config
            this.onConfigurationChange(false);
            this.registerListeners();
        }
        get name() {
            // Take name from first line if present and only if
            // we have no associated file path. In that case we
            // prefer the file name as title.
            if (this.configuredLabelFormat === 'content' && !this.hasAssociatedFilePath && this.cachedModelFirstLineWords) {
                return this.cachedModelFirstLineWords;
            }
            // Otherwise fallback to resource
            return this.labelService.getUriBasenameLabel(this.resource);
        }
        registerListeners() {
            // Config Changes
            this._register(this.textResourceConfigurationService.onDidChangeConfiguration(() => this.onConfigurationChange(true)));
        }
        onConfigurationChange(fromEvent) {
            // Encoding
            const configuredEncoding = this.textResourceConfigurationService.getValue(this.resource, 'files.encoding');
            if (this.configuredEncoding !== configuredEncoding && typeof configuredEncoding === 'string') {
                this.configuredEncoding = configuredEncoding;
                if (fromEvent && !this.preferredEncoding) {
                    this._onDidChangeEncoding.fire(); // do not fire event if we have a preferred encoding set
                }
            }
            // Label Format
            const configuredLabelFormat = this.textResourceConfigurationService.getValue(this.resource, 'workbench.editor.untitled.labelFormat');
            if (this.configuredLabelFormat !== configuredLabelFormat && (configuredLabelFormat === 'content' || configuredLabelFormat === 'name')) {
                this.configuredLabelFormat = configuredLabelFormat;
                if (fromEvent) {
                    this._onDidChangeName.fire();
                }
            }
        }
        //#region Language
        setLanguageId(languageId) {
            let actualLanguage = languageId === UntitledTextEditorModel.ACTIVE_EDITOR_LANGUAGE_ID
                ? this.editorService.activeTextEditorLanguageId
                : languageId;
            this.preferredLanguageId = actualLanguage;
            if (actualLanguage) {
                super.setLanguageId(actualLanguage);
            }
        }
        getLanguageId() {
            if (this.textEditorModel) {
                return this.textEditorModel.getLanguageId();
            }
            return this.preferredLanguageId;
        }
        getEncoding() {
            return this.preferredEncoding || this.configuredEncoding;
        }
        async setEncoding(encoding) {
            const oldEncoding = this.getEncoding();
            this.preferredEncoding = encoding;
            // Emit if it changed
            if (oldEncoding !== this.preferredEncoding) {
                this._onDidChangeEncoding.fire();
            }
        }
        isDirty() {
            return this.dirty;
        }
        setDirty(dirty) {
            if (this.dirty === dirty) {
                return;
            }
            this.dirty = dirty;
            this._onDidChangeDirty.fire();
        }
        //#endregion
        //#region Save / Revert / Backup
        async save(options) {
            const target = await this.textFileService.save(this.resource, options);
            // Emit as event
            if (target) {
                this._onDidSave.fire({ reason: options === null || options === void 0 ? void 0 : options.reason, source: options === null || options === void 0 ? void 0 : options.source });
            }
            return !!target;
        }
        async revert() {
            this.setDirty(false);
            // Emit as event
            this._onDidRevert.fire();
            // A reverted untitled model is invalid because it has
            // no actual source on disk to revert to. As such we
            // dispose the model.
            this.dispose();
        }
        async backup(token) {
            let content = undefined;
            // Make sure to check whether this model has been resolved
            // or not and fallback to the initial value - if any - to
            // prevent backing up an unresolved model and loosing the
            // initial value.
            if (this.isResolved()) {
                // Fill in content the same way we would do when saving the file
                // via the text file service encoding support (hardcode UTF-8)
                content = await this.textFileService.getEncodedReadable(this.resource, (0, types_1.withNullAsUndefined)(this.createSnapshot()), { encoding: encoding_1.UTF8 });
            }
            else if (typeof this.initialValue === 'string') {
                content = (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(this.initialValue));
            }
            return { content };
        }
        //#endregion
        //#region Resolve
        async resolve() {
            // Create text editor model if not yet done
            let createdUntitledModel = false;
            let hasBackup = false;
            if (!this.textEditorModel) {
                let untitledContents;
                // Check for backups or use initial value or empty
                const backup = await this.workingCopyBackupService.resolve(this);
                if (backup) {
                    untitledContents = backup.value;
                    hasBackup = true;
                }
                else {
                    untitledContents = (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString(this.initialValue || ''));
                }
                // Determine untitled contents based on backup
                // or initial value. We must use text file service
                // to create the text factory to respect encodings
                // accordingly.
                const untitledContentsFactory = await (0, textModel_1.createTextBufferFactoryFromStream)(await this.textFileService.getDecodedStream(this.resource, untitledContents, { encoding: encoding_1.UTF8 }));
                this.createTextEditorModel(untitledContentsFactory, this.resource, this.preferredLanguageId);
                createdUntitledModel = true;
            }
            // Otherwise: the untitled model already exists and we must assume
            // that the value of the model was changed by the user. As such we
            // do not update the contents, only the language if configured.
            else {
                this.updateTextEditorModel(undefined, this.preferredLanguageId);
            }
            // Listen to text model events
            const textEditorModel = (0, types_1.assertIsDefined)(this.textEditorModel);
            this._register(textEditorModel.onDidChangeContent(e => this.onModelContentChanged(textEditorModel, e)));
            this._register(textEditorModel.onDidChangeLanguage(() => this.onConfigurationChange(true))); // language change can have impact on config
            // Only adjust name and dirty state etc. if we
            // actually created the untitled model
            if (createdUntitledModel) {
                // Name
                if (hasBackup || this.initialValue) {
                    this.updateNameFromFirstLine(textEditorModel);
                }
                // Untitled associated to file path are dirty right away as well as untitled with content
                this.setDirty(this.hasAssociatedFilePath || !!hasBackup || !!this.initialValue);
                // If we have initial contents, make sure to emit this
                // as the appropiate events to the outside.
                if (hasBackup || this.initialValue) {
                    this._onDidChangeContent.fire();
                }
            }
            return super.resolve();
        }
        onModelContentChanged(textEditorModel, e) {
            // mark the untitled text editor as non-dirty once its content becomes empty and we do
            // not have an associated path set. we never want dirty indicator in that case.
            if (!this.hasAssociatedFilePath && textEditorModel.getLineCount() === 1 && textEditorModel.getLineContent(1) === '') {
                this.setDirty(false);
            }
            // turn dirty otherwise
            else {
                this.setDirty(true);
            }
            // Check for name change if first line changed in the range of 0-FIRST_LINE_NAME_CANDIDATE_MAX_LENGTH columns
            if (e.changes.some(change => (change.range.startLineNumber === 1 || change.range.endLineNumber === 1) && change.range.startColumn <= UntitledTextEditorModel.FIRST_LINE_NAME_CANDIDATE_MAX_LENGTH)) {
                this.updateNameFromFirstLine(textEditorModel);
            }
            // Emit as general content change event
            this._onDidChangeContent.fire();
            // Detect language from content
            this.autoDetectLanguage();
        }
        updateNameFromFirstLine(textEditorModel) {
            if (this.hasAssociatedFilePath) {
                return; // not in case of an associated file path
            }
            // Determine the first words of the model following these rules:
            // - cannot be only whitespace (so we trim())
            // - cannot be only non-alphanumeric characters (so we run word definition regex over it)
            // - cannot be longer than FIRST_LINE_MAX_TITLE_LENGTH
            // - normalize multiple whitespaces to a single whitespace
            let modelFirstWordsCandidate = undefined;
            let firstLineText = textEditorModel
                .getValueInRange({
                startLineNumber: 1,
                endLineNumber: 1,
                startColumn: 1,
                endColumn: UntitledTextEditorModel.FIRST_LINE_NAME_CANDIDATE_MAX_LENGTH + 1 // first cap at FIRST_LINE_NAME_CANDIDATE_MAX_LENGTH
            })
                .trim().replace(/\s+/g, ' '); // normalize whitespaces
            firstLineText = firstLineText.substr(0, (0, strings_1.getCharContainingOffset)(// finally cap at FIRST_LINE_NAME_MAX_LENGTH (grapheme aware #111235)
            firstLineText, UntitledTextEditorModel.FIRST_LINE_NAME_MAX_LENGTH)[0]);
            if (firstLineText && (0, wordHelper_1.ensureValidWordDefinition)().exec(firstLineText)) {
                modelFirstWordsCandidate = firstLineText;
            }
            if (modelFirstWordsCandidate !== this.cachedModelFirstLineWords) {
                this.cachedModelFirstLineWords = modelFirstWordsCandidate;
                this._onDidChangeName.fire();
            }
        }
        //#endregion
        isReadonly() {
            return false;
        }
    };
    UntitledTextEditorModel.FIRST_LINE_NAME_MAX_LENGTH = 40;
    UntitledTextEditorModel.FIRST_LINE_NAME_CANDIDATE_MAX_LENGTH = UntitledTextEditorModel.FIRST_LINE_NAME_MAX_LENGTH * 10;
    // Support the special '${activeEditorLanguage}' language by
    // looking up the language id from the editor that is active
    // before the untitled editor opens. This special id is only
    // used for the initial language and can be changed after the
    // fact (either manually or through auto-detection).
    UntitledTextEditorModel.ACTIVE_EDITOR_LANGUAGE_ID = '${activeEditorLanguage}';
    UntitledTextEditorModel = __decorate([
        __param(5, language_1.ILanguageService),
        __param(6, model_1.IModelService),
        __param(7, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(8, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(9, workingCopyService_1.IWorkingCopyService),
        __param(10, textfiles_1.ITextFileService),
        __param(11, label_1.ILabelService),
        __param(12, editorService_1.IEditorService),
        __param(13, languageDetectionWorkerService_1.ILanguageDetectionService),
        __param(14, accessibility_1.IAccessibilityService)
    ], UntitledTextEditorModel);
    exports.UntitledTextEditorModel = UntitledTextEditorModel;
});
//# sourceMappingURL=untitledTextEditorModel.js.map