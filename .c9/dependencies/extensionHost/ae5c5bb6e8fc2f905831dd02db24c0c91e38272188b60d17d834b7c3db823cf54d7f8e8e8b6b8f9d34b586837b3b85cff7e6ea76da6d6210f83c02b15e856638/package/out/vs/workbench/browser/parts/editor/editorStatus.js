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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/strings", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/actions", "vs/base/common/platform", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/common/editor", "vs/base/common/lifecycle", "vs/editor/contrib/linesOperations/browser/linesOperations", "vs/editor/contrib/indentation/browser/indentation", "vs/workbench/browser/parts/editor/binaryEditor", "vs/workbench/browser/parts/editor/binaryDiffEditor", "vs/workbench/services/editor/common/editorService", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/editor/common/languages/language", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/browser/config/tabFocus", "vs/platform/commands/common/commands", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/textfile/common/encoding", "vs/editor/common/services/textResourceConfiguration", "vs/platform/configuration/common/configuration", "vs/base/common/objects", "vs/editor/browser/editorBrowser", "vs/base/common/network", "vs/workbench/services/preferences/common/preferences", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/getIconClasses", "vs/base/common/async", "vs/platform/notification/common/notification", "vs/base/common/event", "vs/platform/accessibility/common/accessibility", "vs/workbench/services/statusbar/browser/statusbar", "vs/platform/markers/common/markers", "vs/workbench/common/theme", "vs/platform/theme/common/themeService", "vs/platform/telemetry/common/telemetry", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/css!./media/editorstatus"], function (require, exports, nls_1, dom_1, strings_1, resources_1, types_1, uri_1, actions_1, platform_1, untitledTextEditorInput_1, editor_1, lifecycle_1, linesOperations_1, indentation_1, binaryEditor_1, binaryDiffEditor_1, editorService_1, files_1, instantiation_1, language_1, range_1, selection_1, tabFocus_1, commands_1, extensionManagement_1, textfiles_1, encoding_1, textResourceConfiguration_1, configuration_1, objects_1, editorBrowser_1, network_1, preferences_1, quickInput_1, getIconClasses_1, async_1, notification_1, event_1, accessibility_1, statusbar_1, markers_1, theme_1, themeService_1, telemetry_1, sideBySideEditorInput_1, languageDetectionWorkerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChangeEncodingAction = exports.ChangeEOLAction = exports.ChangeLanguageAction = exports.ShowLanguageExtensionsAction = exports.EditorStatus = void 0;
    class SideBySideEditorEncodingSupport {
        constructor(primary, secondary) {
            this.primary = primary;
            this.secondary = secondary;
        }
        getEncoding() {
            return this.primary.getEncoding(); // always report from modified (right hand) side
        }
        async setEncoding(encoding, mode) {
            await async_1.Promises.settled([this.primary, this.secondary].map(editor => editor.setEncoding(encoding, mode)));
        }
    }
    class SideBySideEditorLanguageSupport {
        constructor(primary, secondary) {
            this.primary = primary;
            this.secondary = secondary;
        }
        setLanguageId(languageId) {
            [this.primary, this.secondary].forEach(editor => editor.setLanguageId(languageId));
        }
    }
    function toEditorWithEncodingSupport(input) {
        // Untitled Text Editor
        if (input instanceof untitledTextEditorInput_1.UntitledTextEditorInput) {
            return input;
        }
        // Side by Side (diff) Editor
        if (input instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
            const primaryEncodingSupport = toEditorWithEncodingSupport(input.primary);
            const secondaryEncodingSupport = toEditorWithEncodingSupport(input.secondary);
            if (primaryEncodingSupport && secondaryEncodingSupport) {
                return new SideBySideEditorEncodingSupport(primaryEncodingSupport, secondaryEncodingSupport);
            }
            return primaryEncodingSupport;
        }
        // File or Resource Editor
        const encodingSupport = input;
        if ((0, types_1.areFunctions)(encodingSupport.setEncoding, encodingSupport.getEncoding)) {
            return encodingSupport;
        }
        // Unsupported for any other editor
        return null;
    }
    function toEditorWithLanguageSupport(input) {
        // Untitled Text Editor
        if (input instanceof untitledTextEditorInput_1.UntitledTextEditorInput) {
            return input;
        }
        // Side by Side (diff) Editor
        if (input instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
            const primaryLanguageSupport = toEditorWithLanguageSupport(input.primary);
            const secondaryLanguageSupport = toEditorWithLanguageSupport(input.secondary);
            if (primaryLanguageSupport && secondaryLanguageSupport) {
                return new SideBySideEditorLanguageSupport(primaryLanguageSupport, secondaryLanguageSupport);
            }
            return primaryLanguageSupport;
        }
        // File or Resource Editor
        const languageSupport = input;
        if (typeof languageSupport.setLanguageId === 'function') {
            return languageSupport;
        }
        // Unsupported for any other editor
        return null;
    }
    class StateChange {
        constructor() {
            this.indentation = false;
            this.selectionStatus = false;
            this.languageId = false;
            this.languageStatus = false;
            this.encoding = false;
            this.EOL = false;
            this.tabFocusMode = false;
            this.columnSelectionMode = false;
            this.screenReaderMode = false;
            this.metadata = false;
        }
        combine(other) {
            this.indentation = this.indentation || other.indentation;
            this.selectionStatus = this.selectionStatus || other.selectionStatus;
            this.languageId = this.languageId || other.languageId;
            this.languageStatus = this.languageStatus || other.languageStatus;
            this.encoding = this.encoding || other.encoding;
            this.EOL = this.EOL || other.EOL;
            this.tabFocusMode = this.tabFocusMode || other.tabFocusMode;
            this.columnSelectionMode = this.columnSelectionMode || other.columnSelectionMode;
            this.screenReaderMode = this.screenReaderMode || other.screenReaderMode;
            this.metadata = this.metadata || other.metadata;
        }
        hasChanges() {
            return this.indentation
                || this.selectionStatus
                || this.languageId
                || this.languageStatus
                || this.encoding
                || this.EOL
                || this.tabFocusMode
                || this.columnSelectionMode
                || this.screenReaderMode
                || this.metadata;
        }
    }
    class State {
        get selectionStatus() { return this._selectionStatus; }
        get languageId() { return this._languageId; }
        get encoding() { return this._encoding; }
        get EOL() { return this._EOL; }
        get indentation() { return this._indentation; }
        get tabFocusMode() { return this._tabFocusMode; }
        get columnSelectionMode() { return this._columnSelectionMode; }
        get screenReaderMode() { return this._screenReaderMode; }
        get metadata() { return this._metadata; }
        update(update) {
            const change = new StateChange();
            if (update.type === 'selectionStatus') {
                if (this._selectionStatus !== update.selectionStatus) {
                    this._selectionStatus = update.selectionStatus;
                    change.selectionStatus = true;
                }
            }
            if (update.type === 'indentation') {
                if (this._indentation !== update.indentation) {
                    this._indentation = update.indentation;
                    change.indentation = true;
                }
            }
            if (update.type === 'languageId') {
                if (this._languageId !== update.languageId) {
                    this._languageId = update.languageId;
                    change.languageId = true;
                }
            }
            if (update.type === 'encoding') {
                if (this._encoding !== update.encoding) {
                    this._encoding = update.encoding;
                    change.encoding = true;
                }
            }
            if (update.type === 'EOL') {
                if (this._EOL !== update.EOL) {
                    this._EOL = update.EOL;
                    change.EOL = true;
                }
            }
            if (update.type === 'tabFocusMode') {
                if (this._tabFocusMode !== update.tabFocusMode) {
                    this._tabFocusMode = update.tabFocusMode;
                    change.tabFocusMode = true;
                }
            }
            if (update.type === 'columnSelectionMode') {
                if (this._columnSelectionMode !== update.columnSelectionMode) {
                    this._columnSelectionMode = update.columnSelectionMode;
                    change.columnSelectionMode = true;
                }
            }
            if (update.type === 'screenReaderMode') {
                if (this._screenReaderMode !== update.screenReaderMode) {
                    this._screenReaderMode = update.screenReaderMode;
                    change.screenReaderMode = true;
                }
            }
            if (update.type === 'metadata') {
                if (this._metadata !== update.metadata) {
                    this._metadata = update.metadata;
                    change.metadata = true;
                }
            }
            return change;
        }
    }
    const nlsSingleSelectionRange = (0, nls_1.localize)('singleSelectionRange', "Ln {0}, Col {1} ({2} selected)");
    const nlsSingleSelection = (0, nls_1.localize)('singleSelection', "Ln {0}, Col {1}");
    const nlsMultiSelectionRange = (0, nls_1.localize)('multiSelectionRange', "{0} selections ({1} characters selected)");
    const nlsMultiSelection = (0, nls_1.localize)('multiSelection', "{0} selections");
    const nlsEOLLF = (0, nls_1.localize)('endOfLineLineFeed', "LF");
    const nlsEOLCRLF = (0, nls_1.localize)('endOfLineCarriageReturnLineFeed', "CRLF");
    let EditorStatus = class EditorStatus extends lifecycle_1.Disposable {
        constructor(editorService, quickInputService, languageService, textFileService, configurationService, notificationService, accessibilityService, statusbarService, instantiationService) {
            super();
            this.editorService = editorService;
            this.quickInputService = quickInputService;
            this.languageService = languageService;
            this.textFileService = textFileService;
            this.configurationService = configurationService;
            this.notificationService = notificationService;
            this.accessibilityService = accessibilityService;
            this.statusbarService = statusbarService;
            this.instantiationService = instantiationService;
            this.tabFocusModeElement = this._register(new lifecycle_1.MutableDisposable());
            this.columnSelectionModeElement = this._register(new lifecycle_1.MutableDisposable());
            this.screenRedearModeElement = this._register(new lifecycle_1.MutableDisposable());
            this.indentationElement = this._register(new lifecycle_1.MutableDisposable());
            this.selectionElement = this._register(new lifecycle_1.MutableDisposable());
            this.encodingElement = this._register(new lifecycle_1.MutableDisposable());
            this.eolElement = this._register(new lifecycle_1.MutableDisposable());
            this.languageElement = this._register(new lifecycle_1.MutableDisposable());
            this.metadataElement = this._register(new lifecycle_1.MutableDisposable());
            this.currentProblemStatus = this._register(this.instantiationService.createInstance(ShowCurrentMarkerInStatusbarContribution));
            this.state = new State();
            this.activeEditorListeners = this._register(new lifecycle_1.DisposableStore());
            this.delayedRender = this._register(new lifecycle_1.MutableDisposable());
            this.toRender = null;
            this.screenReaderNotification = null;
            this.promptedScreenReader = false;
            this.registerCommands();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.editorService.onDidActiveEditorChange(() => this.updateStatusBar()));
            this._register(this.textFileService.untitled.onDidChangeEncoding(model => this.onResourceEncodingChange(model.resource)));
            this._register(this.textFileService.files.onDidChangeEncoding(model => this.onResourceEncodingChange((model.resource))));
            this._register(tabFocus_1.TabFocus.onDidChangeTabFocus(() => this.onTabFocusModeChange()));
        }
        registerCommands() {
            commands_1.CommandsRegistry.registerCommand({ id: 'showEditorScreenReaderNotification', handler: () => this.showScreenReaderNotification() });
            commands_1.CommandsRegistry.registerCommand({ id: 'changeEditorIndentation', handler: () => this.showIndentationPicker() });
        }
        showScreenReaderNotification() {
            if (!this.screenReaderNotification) {
                this.screenReaderNotification = this.notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('screenReaderDetectedExplanation.question', "Are you using a screen reader to operate VS Code? (word wrap is disabled when using a screen reader)"), [{
                        label: (0, nls_1.localize)('screenReaderDetectedExplanation.answerYes', "Yes"),
                        run: () => {
                            this.configurationService.updateValue('editor.accessibilitySupport', 'on');
                        }
                    }, {
                        label: (0, nls_1.localize)('screenReaderDetectedExplanation.answerNo', "No"),
                        run: () => {
                            this.configurationService.updateValue('editor.accessibilitySupport', 'off');
                        }
                    }], { sticky: true });
                event_1.Event.once(this.screenReaderNotification.onDidClose)(() => this.screenReaderNotification = null);
            }
        }
        async showIndentationPicker() {
            var _a;
            const activeTextEditorControl = (0, editorBrowser_1.getCodeEditor)(this.editorService.activeTextEditorControl);
            if (!activeTextEditorControl) {
                return this.quickInputService.pick([{ label: (0, nls_1.localize)('noEditor', "No text editor active at this time") }]);
            }
            if ((_a = this.editorService.activeEditor) === null || _a === void 0 ? void 0 : _a.hasCapability(2 /* EditorInputCapabilities.Readonly */)) {
                return this.quickInputService.pick([{ label: (0, nls_1.localize)('noWritableCodeEditor', "The active code editor is read-only.") }]);
            }
            const picks = [
                activeTextEditorControl.getAction(indentation_1.IndentUsingSpaces.ID),
                activeTextEditorControl.getAction(indentation_1.IndentUsingTabs.ID),
                activeTextEditorControl.getAction(indentation_1.DetectIndentation.ID),
                activeTextEditorControl.getAction(indentation_1.IndentationToSpacesAction.ID),
                activeTextEditorControl.getAction(indentation_1.IndentationToTabsAction.ID),
                activeTextEditorControl.getAction(linesOperations_1.TrimTrailingWhitespaceAction.ID)
            ].map((a) => {
                return {
                    id: a.id,
                    label: a.label,
                    detail: (platform_1.Language.isDefaultVariant() || a.label === a.alias) ? undefined : a.alias,
                    run: () => {
                        activeTextEditorControl.focus();
                        a.run();
                    }
                };
            });
            picks.splice(3, 0, { type: 'separator', label: (0, nls_1.localize)('indentConvert', "convert file") });
            picks.unshift({ type: 'separator', label: (0, nls_1.localize)('indentView', "change view") });
            const action = await this.quickInputService.pick(picks, { placeHolder: (0, nls_1.localize)('pickAction', "Select Action"), matchOnDetail: true });
            return action === null || action === void 0 ? void 0 : action.run();
        }
        updateTabFocusModeElement(visible) {
            if (visible) {
                if (!this.tabFocusModeElement.value) {
                    const text = (0, nls_1.localize)('tabFocusModeEnabled', "Tab Moves Focus");
                    this.tabFocusModeElement.value = this.statusbarService.addEntry({
                        name: (0, nls_1.localize)('status.editor.tabFocusMode', "Accessibility Mode"),
                        text,
                        ariaLabel: text,
                        tooltip: (0, nls_1.localize)('disableTabMode', "Disable Accessibility Mode"),
                        command: 'editor.action.toggleTabFocusMode',
                        backgroundColor: (0, themeService_1.themeColorFromId)(theme_1.STATUS_BAR_PROMINENT_ITEM_BACKGROUND),
                        color: (0, themeService_1.themeColorFromId)(theme_1.STATUS_BAR_PROMINENT_ITEM_FOREGROUND)
                    }, 'status.editor.tabFocusMode', 1 /* StatusbarAlignment.RIGHT */, 100.7);
                }
            }
            else {
                this.tabFocusModeElement.clear();
            }
        }
        updateColumnSelectionModeElement(visible) {
            if (visible) {
                if (!this.columnSelectionModeElement.value) {
                    const text = (0, nls_1.localize)('columnSelectionModeEnabled', "Column Selection");
                    this.columnSelectionModeElement.value = this.statusbarService.addEntry({
                        name: (0, nls_1.localize)('status.editor.columnSelectionMode', "Column Selection Mode"),
                        text,
                        ariaLabel: text,
                        tooltip: (0, nls_1.localize)('disableColumnSelectionMode', "Disable Column Selection Mode"),
                        command: 'editor.action.toggleColumnSelection',
                        backgroundColor: (0, themeService_1.themeColorFromId)(theme_1.STATUS_BAR_PROMINENT_ITEM_BACKGROUND),
                        color: (0, themeService_1.themeColorFromId)(theme_1.STATUS_BAR_PROMINENT_ITEM_FOREGROUND)
                    }, 'status.editor.columnSelectionMode', 1 /* StatusbarAlignment.RIGHT */, 100.8);
                }
            }
            else {
                this.columnSelectionModeElement.clear();
            }
        }
        updateScreenReaderModeElement(visible) {
            if (visible) {
                if (!this.screenRedearModeElement.value) {
                    const text = (0, nls_1.localize)('screenReaderDetected', "Screen Reader Optimized");
                    this.screenRedearModeElement.value = this.statusbarService.addEntry({
                        name: (0, nls_1.localize)('status.editor.screenReaderMode', "Screen Reader Mode"),
                        text,
                        ariaLabel: text,
                        command: 'showEditorScreenReaderNotification',
                        backgroundColor: (0, themeService_1.themeColorFromId)(theme_1.STATUS_BAR_PROMINENT_ITEM_BACKGROUND),
                        color: (0, themeService_1.themeColorFromId)(theme_1.STATUS_BAR_PROMINENT_ITEM_FOREGROUND)
                    }, 'status.editor.screenReaderMode', 1 /* StatusbarAlignment.RIGHT */, 100.6);
                }
            }
            else {
                this.screenRedearModeElement.clear();
            }
        }
        updateSelectionElement(text) {
            if (!text) {
                this.selectionElement.clear();
                return;
            }
            const props = {
                name: (0, nls_1.localize)('status.editor.selection', "Editor Selection"),
                text,
                ariaLabel: text,
                tooltip: (0, nls_1.localize)('gotoLine', "Go to Line/Column"),
                command: 'workbench.action.gotoLine'
            };
            this.updateElement(this.selectionElement, props, 'status.editor.selection', 1 /* StatusbarAlignment.RIGHT */, 100.5);
        }
        updateIndentationElement(text) {
            if (!text) {
                this.indentationElement.clear();
                return;
            }
            const props = {
                name: (0, nls_1.localize)('status.editor.indentation', "Editor Indentation"),
                text,
                ariaLabel: text,
                tooltip: (0, nls_1.localize)('selectIndentation', "Select Indentation"),
                command: 'changeEditorIndentation'
            };
            this.updateElement(this.indentationElement, props, 'status.editor.indentation', 1 /* StatusbarAlignment.RIGHT */, 100.4);
        }
        updateEncodingElement(text) {
            if (!text) {
                this.encodingElement.clear();
                return;
            }
            const props = {
                name: (0, nls_1.localize)('status.editor.encoding', "Editor Encoding"),
                text,
                ariaLabel: text,
                tooltip: (0, nls_1.localize)('selectEncoding', "Select Encoding"),
                command: 'workbench.action.editor.changeEncoding'
            };
            this.updateElement(this.encodingElement, props, 'status.editor.encoding', 1 /* StatusbarAlignment.RIGHT */, 100.3);
        }
        updateEOLElement(text) {
            if (!text) {
                this.eolElement.clear();
                return;
            }
            const props = {
                name: (0, nls_1.localize)('status.editor.eol', "Editor End of Line"),
                text,
                ariaLabel: text,
                tooltip: (0, nls_1.localize)('selectEOL', "Select End of Line Sequence"),
                command: 'workbench.action.editor.changeEOL'
            };
            this.updateElement(this.eolElement, props, 'status.editor.eol', 1 /* StatusbarAlignment.RIGHT */, 100.2);
        }
        updateLanguageIdElement(text) {
            if (!text) {
                this.languageElement.clear();
                return;
            }
            const props = {
                name: (0, nls_1.localize)('status.editor.mode', "Editor Language"),
                text,
                ariaLabel: text,
                tooltip: (0, nls_1.localize)('selectLanguageMode', "Select Language Mode"),
                command: 'workbench.action.editor.changeLanguageMode'
            };
            this.updateElement(this.languageElement, props, 'status.editor.mode', 1 /* StatusbarAlignment.RIGHT */, 100.1);
        }
        updateMetadataElement(text) {
            if (!text) {
                this.metadataElement.clear();
                return;
            }
            const props = {
                name: (0, nls_1.localize)('status.editor.info', "File Information"),
                text,
                ariaLabel: text,
                tooltip: (0, nls_1.localize)('fileInfo', "File Information")
            };
            this.updateElement(this.metadataElement, props, 'status.editor.info', 1 /* StatusbarAlignment.RIGHT */, 100);
        }
        updateElement(element, props, id, alignment, priority) {
            if (!element.value) {
                element.value = this.statusbarService.addEntry(props, id, alignment, priority);
            }
            else {
                element.value.update(props);
            }
        }
        updateState(update) {
            const changed = this.state.update(update);
            if (!changed.hasChanges()) {
                return; // Nothing really changed
            }
            if (!this.toRender) {
                this.toRender = changed;
                this.delayedRender.value = (0, dom_1.runAtThisOrScheduleAtNextAnimationFrame)(() => {
                    this.delayedRender.clear();
                    const toRender = this.toRender;
                    this.toRender = null;
                    if (toRender) {
                        this.doRenderNow(toRender);
                    }
                });
            }
            else {
                this.toRender.combine(changed);
            }
        }
        doRenderNow(changed) {
            this.updateTabFocusModeElement(!!this.state.tabFocusMode);
            this.updateColumnSelectionModeElement(!!this.state.columnSelectionMode);
            this.updateScreenReaderModeElement(!!this.state.screenReaderMode);
            this.updateIndentationElement(this.state.indentation);
            this.updateSelectionElement(this.state.selectionStatus);
            this.updateEncodingElement(this.state.encoding);
            this.updateEOLElement(this.state.EOL ? this.state.EOL === '\r\n' ? nlsEOLCRLF : nlsEOLLF : undefined);
            this.updateLanguageIdElement(this.state.languageId);
            this.updateMetadataElement(this.state.metadata);
        }
        getSelectionLabel(info) {
            if (!info || !info.selections) {
                return undefined;
            }
            if (info.selections.length === 1) {
                if (info.charactersSelected) {
                    return (0, strings_1.format)(nlsSingleSelectionRange, info.selections[0].positionLineNumber, info.selections[0].positionColumn, info.charactersSelected);
                }
                return (0, strings_1.format)(nlsSingleSelection, info.selections[0].positionLineNumber, info.selections[0].positionColumn);
            }
            if (info.charactersSelected) {
                return (0, strings_1.format)(nlsMultiSelectionRange, info.selections.length, info.charactersSelected);
            }
            if (info.selections.length > 0) {
                return (0, strings_1.format)(nlsMultiSelection, info.selections.length);
            }
            return undefined;
        }
        updateStatusBar() {
            const activeInput = this.editorService.activeEditor;
            const activeEditorPane = this.editorService.activeEditorPane;
            const activeCodeEditor = activeEditorPane ? (0, types_1.withNullAsUndefined)((0, editorBrowser_1.getCodeEditor)(activeEditorPane.getControl())) : undefined;
            // Update all states
            this.onColumnSelectionModeChange(activeCodeEditor);
            this.onScreenReaderModeChange(activeCodeEditor);
            this.onSelectionChange(activeCodeEditor);
            this.onLanguageChange(activeCodeEditor, activeInput);
            this.onEOLChange(activeCodeEditor);
            this.onEncodingChange(activeEditorPane, activeCodeEditor);
            this.onIndentationChange(activeCodeEditor);
            this.onMetadataChange(activeEditorPane);
            this.currentProblemStatus.update(activeCodeEditor);
            // Dispose old active editor listeners
            this.activeEditorListeners.clear();
            // Attach new listeners to active editor
            if (activeEditorPane) {
                this.activeEditorListeners.add(activeEditorPane.onDidChangeControl(() => {
                    // Since our editor status is mainly observing the
                    // active editor control, do a full update whenever
                    // the control changes.
                    this.updateStatusBar();
                }));
            }
            // Attach new listeners to active code editor
            if (activeCodeEditor) {
                // Hook Listener for Configuration changes
                this.activeEditorListeners.add(activeCodeEditor.onDidChangeConfiguration((event) => {
                    if (event.hasChanged(18 /* EditorOption.columnSelection */)) {
                        this.onColumnSelectionModeChange(activeCodeEditor);
                    }
                    if (event.hasChanged(2 /* EditorOption.accessibilitySupport */)) {
                        this.onScreenReaderModeChange(activeCodeEditor);
                    }
                }));
                // Hook Listener for Selection changes
                this.activeEditorListeners.add(activeCodeEditor.onDidChangeCursorPosition(() => {
                    this.onSelectionChange(activeCodeEditor);
                    this.currentProblemStatus.update(activeCodeEditor);
                }));
                // Hook Listener for language changes
                this.activeEditorListeners.add(activeCodeEditor.onDidChangeModelLanguage(() => {
                    this.onLanguageChange(activeCodeEditor, activeInput);
                }));
                // Hook Listener for content changes
                this.activeEditorListeners.add(activeCodeEditor.onDidChangeModelContent(e => {
                    this.onEOLChange(activeCodeEditor);
                    this.currentProblemStatus.update(activeCodeEditor);
                    const selections = activeCodeEditor.getSelections();
                    if (selections) {
                        for (const change of e.changes) {
                            if (selections.some(selection => range_1.Range.areIntersecting(selection, change.range))) {
                                this.onSelectionChange(activeCodeEditor);
                                break;
                            }
                        }
                    }
                }));
                // Hook Listener for content options changes
                this.activeEditorListeners.add(activeCodeEditor.onDidChangeModelOptions(() => {
                    this.onIndentationChange(activeCodeEditor);
                }));
            }
            // Handle binary editors
            else if (activeEditorPane instanceof binaryEditor_1.BaseBinaryResourceEditor || activeEditorPane instanceof binaryDiffEditor_1.BinaryResourceDiffEditor) {
                const binaryEditors = [];
                if (activeEditorPane instanceof binaryDiffEditor_1.BinaryResourceDiffEditor) {
                    const primary = activeEditorPane.getPrimaryEditorPane();
                    if (primary instanceof binaryEditor_1.BaseBinaryResourceEditor) {
                        binaryEditors.push(primary);
                    }
                    const secondary = activeEditorPane.getSecondaryEditorPane();
                    if (secondary instanceof binaryEditor_1.BaseBinaryResourceEditor) {
                        binaryEditors.push(secondary);
                    }
                }
                else {
                    binaryEditors.push(activeEditorPane);
                }
                for (const editor of binaryEditors) {
                    this.activeEditorListeners.add(editor.onDidChangeMetadata(() => {
                        this.onMetadataChange(activeEditorPane);
                    }));
                    this.activeEditorListeners.add(editor.onDidOpenInPlace(() => {
                        this.updateStatusBar();
                    }));
                }
            }
        }
        onLanguageChange(editorWidget, editorInput) {
            let info = { type: 'languageId', languageId: undefined };
            // We only support text based editors
            if (editorWidget && editorInput && toEditorWithLanguageSupport(editorInput)) {
                const textModel = editorWidget.getModel();
                if (textModel) {
                    const languageId = textModel.getLanguageId();
                    info.languageId = (0, types_1.withNullAsUndefined)(this.languageService.getLanguageName(languageId));
                }
            }
            this.updateState(info);
        }
        onIndentationChange(editorWidget) {
            const update = { type: 'indentation', indentation: undefined };
            if (editorWidget) {
                const model = editorWidget.getModel();
                if (model) {
                    const modelOpts = model.getOptions();
                    update.indentation = (modelOpts.insertSpaces
                        ? (0, nls_1.localize)('spacesSize', "Spaces: {0}", modelOpts.indentSize)
                        : (0, nls_1.localize)({ key: 'tabSize', comment: ['Tab corresponds to the tab key'] }, "Tab Size: {0}", modelOpts.tabSize));
                }
            }
            this.updateState(update);
        }
        onMetadataChange(editor) {
            const update = { type: 'metadata', metadata: undefined };
            if (editor instanceof binaryEditor_1.BaseBinaryResourceEditor || editor instanceof binaryDiffEditor_1.BinaryResourceDiffEditor) {
                update.metadata = editor.getMetadata();
            }
            this.updateState(update);
        }
        onColumnSelectionModeChange(editorWidget) {
            const info = { type: 'columnSelectionMode', columnSelectionMode: false };
            if (editorWidget === null || editorWidget === void 0 ? void 0 : editorWidget.getOption(18 /* EditorOption.columnSelection */)) {
                info.columnSelectionMode = true;
            }
            this.updateState(info);
        }
        onScreenReaderModeChange(editorWidget) {
            var _a;
            let screenReaderMode = false;
            // We only support text based editors
            if (editorWidget) {
                const screenReaderDetected = this.accessibilityService.isScreenReaderOptimized();
                if (screenReaderDetected) {
                    const screenReaderConfiguration = (_a = this.configurationService.getValue('editor')) === null || _a === void 0 ? void 0 : _a.accessibilitySupport;
                    if (screenReaderConfiguration === 'auto') {
                        if (!this.promptedScreenReader) {
                            this.promptedScreenReader = true;
                            setTimeout(() => this.showScreenReaderNotification(), 100);
                        }
                    }
                }
                screenReaderMode = (editorWidget.getOption(2 /* EditorOption.accessibilitySupport */) === 2 /* AccessibilitySupport.Enabled */);
            }
            if (screenReaderMode === false && this.screenReaderNotification) {
                this.screenReaderNotification.close();
            }
            this.updateState({ type: 'screenReaderMode', screenReaderMode: screenReaderMode });
        }
        onSelectionChange(editorWidget) {
            const info = Object.create(null);
            // We only support text based editors
            if (editorWidget) {
                // Compute selection(s)
                info.selections = editorWidget.getSelections() || [];
                // Compute selection length
                info.charactersSelected = 0;
                const textModel = editorWidget.getModel();
                if (textModel) {
                    for (const selection of info.selections) {
                        if (typeof info.charactersSelected !== 'number') {
                            info.charactersSelected = 0;
                        }
                        info.charactersSelected += textModel.getCharacterCountInRange(selection);
                    }
                }
                // Compute the visible column for one selection. This will properly handle tabs and their configured widths
                if (info.selections.length === 1) {
                    const editorPosition = editorWidget.getPosition();
                    let selectionClone = new selection_1.Selection(info.selections[0].selectionStartLineNumber, info.selections[0].selectionStartColumn, info.selections[0].positionLineNumber, editorPosition ? editorWidget.getStatusbarColumn(editorPosition) : info.selections[0].positionColumn);
                    info.selections[0] = selectionClone;
                }
            }
            this.updateState({ type: 'selectionStatus', selectionStatus: this.getSelectionLabel(info) });
        }
        onEOLChange(editorWidget) {
            const info = { type: 'EOL', EOL: undefined };
            if (editorWidget && !editorWidget.getOption(81 /* EditorOption.readOnly */)) {
                const codeEditorModel = editorWidget.getModel();
                if (codeEditorModel) {
                    info.EOL = codeEditorModel.getEOL();
                }
            }
            this.updateState(info);
        }
        onEncodingChange(editor, editorWidget) {
            if (editor && !this.isActiveEditor(editor)) {
                return;
            }
            const info = { type: 'encoding', encoding: undefined };
            // We only support text based editors that have a model associated
            // This ensures we do not show the encoding picker while an editor
            // is still loading.
            if (editor && (editorWidget === null || editorWidget === void 0 ? void 0 : editorWidget.hasModel())) {
                const encodingSupport = editor.input ? toEditorWithEncodingSupport(editor.input) : null;
                if (encodingSupport) {
                    const rawEncoding = encodingSupport.getEncoding();
                    const encodingInfo = typeof rawEncoding === 'string' ? encoding_1.SUPPORTED_ENCODINGS[rawEncoding] : undefined;
                    if (encodingInfo) {
                        info.encoding = encodingInfo.labelShort; // if we have a label, take it from there
                    }
                    else {
                        info.encoding = rawEncoding; // otherwise use it raw
                    }
                }
            }
            this.updateState(info);
        }
        onResourceEncodingChange(resource) {
            const activeEditorPane = this.editorService.activeEditorPane;
            if (activeEditorPane) {
                const activeResource = editor_1.EditorResourceAccessor.getCanonicalUri(activeEditorPane.input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                if (activeResource && (0, resources_1.isEqual)(activeResource, resource)) {
                    const activeCodeEditor = (0, types_1.withNullAsUndefined)((0, editorBrowser_1.getCodeEditor)(activeEditorPane.getControl()));
                    return this.onEncodingChange(activeEditorPane, activeCodeEditor); // only update if the encoding changed for the active resource
                }
            }
        }
        onTabFocusModeChange() {
            const info = { type: 'tabFocusMode', tabFocusMode: tabFocus_1.TabFocus.getTabFocusMode() };
            this.updateState(info);
        }
        isActiveEditor(control) {
            const activeEditorPane = this.editorService.activeEditorPane;
            return !!activeEditorPane && activeEditorPane === control;
        }
    };
    EditorStatus = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, quickInput_1.IQuickInputService),
        __param(2, language_1.ILanguageService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, notification_1.INotificationService),
        __param(6, accessibility_1.IAccessibilityService),
        __param(7, statusbar_1.IStatusbarService),
        __param(8, instantiation_1.IInstantiationService)
    ], EditorStatus);
    exports.EditorStatus = EditorStatus;
    let ShowCurrentMarkerInStatusbarContribution = class ShowCurrentMarkerInStatusbarContribution extends lifecycle_1.Disposable {
        constructor(statusbarService, markerService, configurationService) {
            super();
            this.statusbarService = statusbarService;
            this.markerService = markerService;
            this.configurationService = configurationService;
            this.editor = undefined;
            this.markers = [];
            this.currentMarker = null;
            this.statusBarEntryAccessor = this._register(new lifecycle_1.MutableDisposable());
            this._register(markerService.onMarkerChanged(changedResources => this.onMarkerChanged(changedResources)));
            this._register(event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('problems.showCurrentInStatus'))(() => this.updateStatus()));
        }
        update(editor) {
            this.editor = editor;
            this.updateMarkers();
            this.updateStatus();
        }
        updateStatus() {
            const previousMarker = this.currentMarker;
            this.currentMarker = this.getMarker();
            if (this.hasToUpdateStatus(previousMarker, this.currentMarker)) {
                if (this.currentMarker) {
                    const line = (0, strings_1.splitLines)(this.currentMarker.message)[0];
                    const text = `${this.getType(this.currentMarker)} ${line}`;
                    if (!this.statusBarEntryAccessor.value) {
                        this.statusBarEntryAccessor.value = this.statusbarService.addEntry({ name: (0, nls_1.localize)('currentProblem', "Current Problem"), text: '', ariaLabel: '' }, 'statusbar.currentProblem', 0 /* StatusbarAlignment.LEFT */);
                    }
                    this.statusBarEntryAccessor.value.update({ name: (0, nls_1.localize)('currentProblem', "Current Problem"), text, ariaLabel: text });
                }
                else {
                    this.statusBarEntryAccessor.clear();
                }
            }
        }
        hasToUpdateStatus(previousMarker, currentMarker) {
            if (!currentMarker) {
                return true;
            }
            if (!previousMarker) {
                return true;
            }
            return markers_1.IMarkerData.makeKey(previousMarker) !== markers_1.IMarkerData.makeKey(currentMarker);
        }
        getType(marker) {
            switch (marker.severity) {
                case markers_1.MarkerSeverity.Error: return '$(error)';
                case markers_1.MarkerSeverity.Warning: return '$(warning)';
                case markers_1.MarkerSeverity.Info: return '$(info)';
            }
            return '';
        }
        getMarker() {
            if (!this.configurationService.getValue('problems.showCurrentInStatus')) {
                return null;
            }
            if (!this.editor) {
                return null;
            }
            const model = this.editor.getModel();
            if (!model) {
                return null;
            }
            const position = this.editor.getPosition();
            if (!position) {
                return null;
            }
            return this.markers.find(marker => range_1.Range.containsPosition(marker, position)) || null;
        }
        onMarkerChanged(changedResources) {
            if (!this.editor) {
                return;
            }
            const model = this.editor.getModel();
            if (!model) {
                return;
            }
            if (model && !changedResources.some(r => (0, resources_1.isEqual)(model.uri, r))) {
                return;
            }
            this.updateMarkers();
        }
        updateMarkers() {
            if (!this.editor) {
                return;
            }
            const model = this.editor.getModel();
            if (!model) {
                return;
            }
            if (model) {
                this.markers = this.markerService.read({
                    resource: model.uri,
                    severities: markers_1.MarkerSeverity.Error | markers_1.MarkerSeverity.Warning | markers_1.MarkerSeverity.Info
                });
                this.markers.sort(compareMarker);
            }
            else {
                this.markers = [];
            }
            this.updateStatus();
        }
    };
    ShowCurrentMarkerInStatusbarContribution = __decorate([
        __param(0, statusbar_1.IStatusbarService),
        __param(1, markers_1.IMarkerService),
        __param(2, configuration_1.IConfigurationService)
    ], ShowCurrentMarkerInStatusbarContribution);
    function compareMarker(a, b) {
        let res = (0, strings_1.compare)(a.resource.toString(), b.resource.toString());
        if (res === 0) {
            res = markers_1.MarkerSeverity.compare(a.severity, b.severity);
        }
        if (res === 0) {
            res = range_1.Range.compareRangesUsingStarts(a, b);
        }
        return res;
    }
    let ShowLanguageExtensionsAction = class ShowLanguageExtensionsAction extends actions_1.Action {
        constructor(fileExtension, commandService, galleryService) {
            super(ShowLanguageExtensionsAction.ID, (0, nls_1.localize)('showLanguageExtensions', "Search Marketplace Extensions for '{0}'...", fileExtension));
            this.fileExtension = fileExtension;
            this.commandService = commandService;
            this.enabled = galleryService.isEnabled();
        }
        async run() {
            await this.commandService.executeCommand('workbench.extensions.action.showExtensionsForLanguage', this.fileExtension);
        }
    };
    ShowLanguageExtensionsAction.ID = 'workbench.action.showLanguageExtensions';
    ShowLanguageExtensionsAction = __decorate([
        __param(1, commands_1.ICommandService),
        __param(2, extensionManagement_1.IExtensionGalleryService)
    ], ShowLanguageExtensionsAction);
    exports.ShowLanguageExtensionsAction = ShowLanguageExtensionsAction;
    let ChangeLanguageAction = class ChangeLanguageAction extends actions_1.Action {
        constructor(actionId, actionLabel, languageService, editorService, configurationService, quickInputService, preferencesService, instantiationService, textFileService, telemetryService, languageDetectionService) {
            super(actionId, actionLabel);
            this.languageService = languageService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.quickInputService = quickInputService;
            this.preferencesService = preferencesService;
            this.instantiationService = instantiationService;
            this.textFileService = textFileService;
            this.telemetryService = telemetryService;
            this.languageDetectionService = languageDetectionService;
        }
        async run(event, data) {
            var _a;
            const activeTextEditorControl = (0, editorBrowser_1.getCodeEditor)(this.editorService.activeTextEditorControl);
            if (!activeTextEditorControl) {
                await this.quickInputService.pick([{ label: (0, nls_1.localize)('noEditor', "No text editor active at this time") }]);
                return;
            }
            const textModel = activeTextEditorControl.getModel();
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            // Compute language
            let currentLanguageName;
            let currentLanguageId;
            if (textModel) {
                currentLanguageId = textModel.getLanguageId();
                currentLanguageName = (0, types_1.withNullAsUndefined)(this.languageService.getLanguageName(currentLanguageId));
            }
            let hasLanguageSupport = !!resource;
            if ((resource === null || resource === void 0 ? void 0 : resource.scheme) === network_1.Schemas.untitled && !((_a = this.textFileService.untitled.get(resource)) === null || _a === void 0 ? void 0 : _a.hasAssociatedFilePath)) {
                hasLanguageSupport = false; // no configuration for untitled resources (e.g. "Untitled-1")
            }
            // All languages are valid picks
            const languages = this.languageService.getSortedRegisteredLanguageNames();
            const picks = languages
                .map(({ languageName, languageId }) => {
                const extensions = this.languageService.getExtensions(languageId).join(' ');
                let description;
                if (currentLanguageName === languageName) {
                    description = (0, nls_1.localize)('languageDescription', "({0}) - Configured Language", languageId);
                }
                else {
                    description = (0, nls_1.localize)('languageDescriptionConfigured', "({0})", languageId);
                }
                return {
                    label: languageName,
                    meta: extensions,
                    iconClasses: (0, getIconClasses_1.getIconClassesForLanguageId)(languageId),
                    description
                };
            });
            picks.unshift({ type: 'separator', label: (0, nls_1.localize)('languagesPicks', "languages (identifier)") });
            // Offer action to configure via settings
            let configureLanguageAssociations;
            let configureLanguageSettings;
            let galleryAction;
            if (hasLanguageSupport && resource) {
                const ext = (0, resources_1.extname)(resource) || (0, resources_1.basename)(resource);
                galleryAction = this.instantiationService.createInstance(ShowLanguageExtensionsAction, ext);
                if (galleryAction.enabled) {
                    picks.unshift(galleryAction);
                }
                configureLanguageSettings = { label: (0, nls_1.localize)('configureModeSettings', "Configure '{0}' language based settings...", currentLanguageName) };
                picks.unshift(configureLanguageSettings);
                configureLanguageAssociations = { label: (0, nls_1.localize)('configureAssociationsExt', "Configure File Association for '{0}'...", ext) };
                picks.unshift(configureLanguageAssociations);
            }
            // Offer to "Auto Detect"
            const autoDetectLanguage = {
                label: (0, nls_1.localize)('autoDetect', "Auto Detect")
            };
            picks.unshift(autoDetectLanguage);
            const pick = await this.quickInputService.pick(picks, { placeHolder: (0, nls_1.localize)('pickLanguage', "Select Language Mode"), matchOnDescription: true });
            if (!pick) {
                return;
            }
            if (pick === galleryAction) {
                galleryAction.run();
                return;
            }
            // User decided to permanently configure associations, return right after
            if (pick === configureLanguageAssociations) {
                if (resource) {
                    this.configureFileAssociation(resource);
                }
                return;
            }
            // User decided to configure settings for current language
            if (pick === configureLanguageSettings) {
                this.preferencesService.openUserSettings({ jsonEditor: true, revealSetting: { key: `[${(0, types_1.withUndefinedAsNull)(currentLanguageId)}]`, edit: true } });
                return;
            }
            // Change language for active editor
            const activeEditor = this.editorService.activeEditor;
            if (activeEditor) {
                const languageSupport = toEditorWithLanguageSupport(activeEditor);
                if (languageSupport) {
                    // Find language
                    let languageSelection;
                    let detectedLanguage;
                    if (pick === autoDetectLanguage) {
                        if (textModel) {
                            const resource = editor_1.EditorResourceAccessor.getOriginalUri(activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                            if (resource) {
                                // Detect languages since we are in an untitled file
                                let languageId = (0, types_1.withNullAsUndefined)(this.languageService.guessLanguageIdByFilepathOrFirstLine(resource, textModel.getLineContent(1)));
                                if (!languageId || languageId === 'unknown') {
                                    detectedLanguage = await this.languageDetectionService.detectLanguage(resource);
                                    languageId = detectedLanguage;
                                }
                                if (languageId) {
                                    languageSelection = this.languageService.createById(languageId);
                                }
                            }
                        }
                    }
                    else {
                        const languageId = this.languageService.getLanguageIdByLanguageName(pick.label);
                        languageSelection = this.languageService.createById(languageId);
                        if (resource) {
                            // fire and forget to not slow things down
                            this.languageDetectionService.detectLanguage(resource).then(detectedLanguageId => {
                                var _a;
                                const chosenLanguageId = this.languageService.getLanguageIdByLanguageName(pick.label) || 'unknown';
                                if (detectedLanguageId === currentLanguageId && currentLanguageId !== chosenLanguageId) {
                                    // If they didn't choose the detected language (which should also be the active language if automatic detection is enabled)
                                    // then the automatic language detection was likely wrong and the user is correcting it. In this case, we want telemetry.
                                    // Keep track of what model was preferred and length of input to help track down potential differences between the result quality across models and content size.
                                    const modelPreference = this.configurationService.getValue('workbench.editor.preferHistoryBasedLanguageDetection') ? 'history' : 'classic';
                                    this.telemetryService.publicLog2(languageDetectionWorkerService_1.AutomaticLanguageDetectionLikelyWrongId, {
                                        currentLanguageId: currentLanguageName !== null && currentLanguageName !== void 0 ? currentLanguageName : 'unknown',
                                        nextLanguageId: pick.label,
                                        lineCount: (_a = textModel === null || textModel === void 0 ? void 0 : textModel.getLineCount()) !== null && _a !== void 0 ? _a : -1,
                                        modelPreference,
                                    });
                                }
                            });
                        }
                    }
                    // Change language
                    if (typeof languageSelection !== 'undefined') {
                        languageSupport.setLanguageId(languageSelection.languageId);
                        if ((resource === null || resource === void 0 ? void 0 : resource.scheme) === network_1.Schemas.untitled) {
                            const modelPreference = this.configurationService.getValue('workbench.editor.preferHistoryBasedLanguageDetection') ? 'history' : 'classic';
                            this.telemetryService.publicLog2('setUntitledDocumentLanguage', {
                                to: languageSelection.languageId,
                                from: currentLanguageId !== null && currentLanguageId !== void 0 ? currentLanguageId : 'none',
                                modelPreference,
                            });
                        }
                    }
                }
                activeTextEditorControl.focus();
            }
        }
        configureFileAssociation(resource) {
            const extension = (0, resources_1.extname)(resource);
            const base = (0, resources_1.basename)(resource);
            const currentAssociation = this.languageService.guessLanguageIdByFilepathOrFirstLine(uri_1.URI.file(base));
            const languages = this.languageService.getSortedRegisteredLanguageNames();
            const picks = languages.map(({ languageName, languageId }) => {
                return {
                    id: languageId,
                    label: languageName,
                    iconClasses: (0, getIconClasses_1.getIconClassesForLanguageId)(languageId),
                    description: (languageId === currentAssociation) ? (0, nls_1.localize)('currentAssociation', "Current Association") : undefined
                };
            });
            setTimeout(async () => {
                const language = await this.quickInputService.pick(picks, { placeHolder: (0, nls_1.localize)('pickLanguageToConfigure', "Select Language Mode to Associate with '{0}'", extension || base) });
                if (language) {
                    const fileAssociationsConfig = this.configurationService.inspect(files_1.FILES_ASSOCIATIONS_CONFIG);
                    let associationKey;
                    if (extension && base[0] !== '.') {
                        associationKey = `*${extension}`; // only use "*.ext" if the file path is in the form of <name>.<ext>
                    }
                    else {
                        associationKey = base; // otherwise use the basename (e.g. .gitignore, Dockerfile)
                    }
                    // If the association is already being made in the workspace, make sure to target workspace settings
                    let target = 1 /* ConfigurationTarget.USER */;
                    if (fileAssociationsConfig.workspaceValue && !!fileAssociationsConfig.workspaceValue[associationKey]) {
                        target = 4 /* ConfigurationTarget.WORKSPACE */;
                    }
                    // Make sure to write into the value of the target and not the merged value from USER and WORKSPACE config
                    const currentAssociations = (0, objects_1.deepClone)((target === 4 /* ConfigurationTarget.WORKSPACE */) ? fileAssociationsConfig.workspaceValue : fileAssociationsConfig.userValue) || Object.create(null);
                    currentAssociations[associationKey] = language.id;
                    this.configurationService.updateValue(files_1.FILES_ASSOCIATIONS_CONFIG, currentAssociations, target);
                }
            }, 50 /* quick input is sensitive to being opened so soon after another */);
        }
    };
    ChangeLanguageAction.ID = 'workbench.action.editor.changeLanguageMode';
    ChangeLanguageAction.LABEL = (0, nls_1.localize)('changeMode', "Change Language Mode");
    ChangeLanguageAction = __decorate([
        __param(2, language_1.ILanguageService),
        __param(3, editorService_1.IEditorService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, quickInput_1.IQuickInputService),
        __param(6, preferences_1.IPreferencesService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, textfiles_1.ITextFileService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, languageDetectionWorkerService_1.ILanguageDetectionService)
    ], ChangeLanguageAction);
    exports.ChangeLanguageAction = ChangeLanguageAction;
    let ChangeEOLAction = class ChangeEOLAction extends actions_1.Action {
        constructor(actionId, actionLabel, editorService, quickInputService) {
            super(actionId, actionLabel);
            this.editorService = editorService;
            this.quickInputService = quickInputService;
        }
        async run() {
            var _a, _b;
            const activeTextEditorControl = (0, editorBrowser_1.getCodeEditor)(this.editorService.activeTextEditorControl);
            if (!activeTextEditorControl) {
                await this.quickInputService.pick([{ label: (0, nls_1.localize)('noEditor', "No text editor active at this time") }]);
                return;
            }
            if ((_a = this.editorService.activeEditor) === null || _a === void 0 ? void 0 : _a.hasCapability(2 /* EditorInputCapabilities.Readonly */)) {
                await this.quickInputService.pick([{ label: (0, nls_1.localize)('noWritableCodeEditor', "The active code editor is read-only.") }]);
                return;
            }
            let textModel = activeTextEditorControl.getModel();
            const EOLOptions = [
                { label: nlsEOLLF, eol: 0 /* EndOfLineSequence.LF */ },
                { label: nlsEOLCRLF, eol: 1 /* EndOfLineSequence.CRLF */ },
            ];
            const selectedIndex = ((textModel === null || textModel === void 0 ? void 0 : textModel.getEOL()) === '\n') ? 0 : 1;
            const eol = await this.quickInputService.pick(EOLOptions, { placeHolder: (0, nls_1.localize)('pickEndOfLine', "Select End of Line Sequence"), activeItem: EOLOptions[selectedIndex] });
            if (eol) {
                const activeCodeEditor = (0, editorBrowser_1.getCodeEditor)(this.editorService.activeTextEditorControl);
                if ((activeCodeEditor === null || activeCodeEditor === void 0 ? void 0 : activeCodeEditor.hasModel()) && !((_b = this.editorService.activeEditor) === null || _b === void 0 ? void 0 : _b.hasCapability(2 /* EditorInputCapabilities.Readonly */))) {
                    textModel = activeCodeEditor.getModel();
                    textModel.pushStackElement();
                    textModel.pushEOL(eol.eol);
                    textModel.pushStackElement();
                }
            }
            activeTextEditorControl.focus();
        }
    };
    ChangeEOLAction.ID = 'workbench.action.editor.changeEOL';
    ChangeEOLAction.LABEL = (0, nls_1.localize)('changeEndOfLine', "Change End of Line Sequence");
    ChangeEOLAction = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, quickInput_1.IQuickInputService)
    ], ChangeEOLAction);
    exports.ChangeEOLAction = ChangeEOLAction;
    let ChangeEncodingAction = class ChangeEncodingAction extends actions_1.Action {
        constructor(actionId, actionLabel, editorService, quickInputService, textResourceConfigurationService, fileService, textFileService) {
            super(actionId, actionLabel);
            this.editorService = editorService;
            this.quickInputService = quickInputService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.fileService = fileService;
            this.textFileService = textFileService;
        }
        async run() {
            const activeTextEditorControl = (0, editorBrowser_1.getCodeEditor)(this.editorService.activeTextEditorControl);
            if (!activeTextEditorControl) {
                await this.quickInputService.pick([{ label: (0, nls_1.localize)('noEditor', "No text editor active at this time") }]);
                return;
            }
            const activeEditorPane = this.editorService.activeEditorPane;
            if (!activeEditorPane) {
                await this.quickInputService.pick([{ label: (0, nls_1.localize)('noEditor', "No text editor active at this time") }]);
                return;
            }
            const encodingSupport = toEditorWithEncodingSupport(activeEditorPane.input);
            if (!encodingSupport) {
                await this.quickInputService.pick([{ label: (0, nls_1.localize)('noFileEditor', "No file active at this time") }]);
                return;
            }
            const saveWithEncodingPick = { label: (0, nls_1.localize)('saveWithEncoding', "Save with Encoding") };
            const reopenWithEncodingPick = { label: (0, nls_1.localize)('reopenWithEncoding', "Reopen with Encoding") };
            if (!platform_1.Language.isDefaultVariant()) {
                const saveWithEncodingAlias = 'Save with Encoding';
                if (saveWithEncodingAlias !== saveWithEncodingPick.label) {
                    saveWithEncodingPick.detail = saveWithEncodingAlias;
                }
                const reopenWithEncodingAlias = 'Reopen with Encoding';
                if (reopenWithEncodingAlias !== reopenWithEncodingPick.label) {
                    reopenWithEncodingPick.detail = reopenWithEncodingAlias;
                }
            }
            let action;
            if (encodingSupport instanceof untitledTextEditorInput_1.UntitledTextEditorInput) {
                action = saveWithEncodingPick;
            }
            else if (activeEditorPane.input.hasCapability(2 /* EditorInputCapabilities.Readonly */)) {
                action = reopenWithEncodingPick;
            }
            else {
                action = await this.quickInputService.pick([reopenWithEncodingPick, saveWithEncodingPick], { placeHolder: (0, nls_1.localize)('pickAction', "Select Action"), matchOnDetail: true });
            }
            if (!action) {
                return;
            }
            await (0, async_1.timeout)(50); // quick input is sensitive to being opened so soon after another
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(activeEditorPane.input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if (!resource || (!this.fileService.hasProvider(resource) && resource.scheme !== network_1.Schemas.untitled)) {
                return; // encoding detection only possible for resources the file service can handle or that are untitled
            }
            let guessedEncoding = undefined;
            if (this.fileService.hasProvider(resource)) {
                const content = await this.textFileService.readStream(resource, { autoGuessEncoding: true });
                guessedEncoding = content.encoding;
            }
            const isReopenWithEncoding = (action === reopenWithEncodingPick);
            const configuredEncoding = this.textResourceConfigurationService.getValue((0, types_1.withNullAsUndefined)(resource), 'files.encoding');
            let directMatchIndex;
            let aliasMatchIndex;
            // All encodings are valid picks
            const picks = Object.keys(encoding_1.SUPPORTED_ENCODINGS)
                .sort((k1, k2) => {
                if (k1 === configuredEncoding) {
                    return -1;
                }
                else if (k2 === configuredEncoding) {
                    return 1;
                }
                return encoding_1.SUPPORTED_ENCODINGS[k1].order - encoding_1.SUPPORTED_ENCODINGS[k2].order;
            })
                .filter(k => {
                if (k === guessedEncoding && guessedEncoding !== configuredEncoding) {
                    return false; // do not show encoding if it is the guessed encoding that does not match the configured
                }
                return !isReopenWithEncoding || !encoding_1.SUPPORTED_ENCODINGS[k].encodeOnly; // hide those that can only be used for encoding if we are about to decode
            })
                .map((key, index) => {
                if (key === encodingSupport.getEncoding()) {
                    directMatchIndex = index;
                }
                else if (encoding_1.SUPPORTED_ENCODINGS[key].alias === encodingSupport.getEncoding()) {
                    aliasMatchIndex = index;
                }
                return { id: key, label: encoding_1.SUPPORTED_ENCODINGS[key].labelLong, description: key };
            });
            const items = picks.slice();
            // If we have a guessed encoding, show it first unless it matches the configured encoding
            if (guessedEncoding && configuredEncoding !== guessedEncoding && encoding_1.SUPPORTED_ENCODINGS[guessedEncoding]) {
                picks.unshift({ type: 'separator' });
                picks.unshift({ id: guessedEncoding, label: encoding_1.SUPPORTED_ENCODINGS[guessedEncoding].labelLong, description: (0, nls_1.localize)('guessedEncoding', "Guessed from content") });
            }
            const encoding = await this.quickInputService.pick(picks, {
                placeHolder: isReopenWithEncoding ? (0, nls_1.localize)('pickEncodingForReopen', "Select File Encoding to Reopen File") : (0, nls_1.localize)('pickEncodingForSave', "Select File Encoding to Save with"),
                activeItem: items[typeof directMatchIndex === 'number' ? directMatchIndex : typeof aliasMatchIndex === 'number' ? aliasMatchIndex : -1]
            });
            if (!encoding) {
                return;
            }
            if (!this.editorService.activeEditorPane) {
                return;
            }
            const activeEncodingSupport = toEditorWithEncodingSupport(this.editorService.activeEditorPane.input);
            if (typeof encoding.id !== 'undefined' && activeEncodingSupport) {
                await activeEncodingSupport.setEncoding(encoding.id, isReopenWithEncoding ? 1 /* EncodingMode.Decode */ : 0 /* EncodingMode.Encode */); // Set new encoding
            }
            activeTextEditorControl.focus();
        }
    };
    ChangeEncodingAction.ID = 'workbench.action.editor.changeEncoding';
    ChangeEncodingAction.LABEL = (0, nls_1.localize)('changeEncoding', "Change File Encoding");
    ChangeEncodingAction = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(5, files_1.IFileService),
        __param(6, textfiles_1.ITextFileService)
    ], ChangeEncodingAction);
    exports.ChangeEncodingAction = ChangeEncodingAction;
});
//# sourceMappingURL=editorStatus.js.map