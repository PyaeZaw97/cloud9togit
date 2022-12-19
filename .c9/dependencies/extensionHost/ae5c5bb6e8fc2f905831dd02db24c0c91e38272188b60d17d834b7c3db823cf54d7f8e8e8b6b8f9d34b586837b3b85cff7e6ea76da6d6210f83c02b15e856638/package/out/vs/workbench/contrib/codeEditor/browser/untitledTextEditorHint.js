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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/nls", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/browser/parts/editor/editorStatus", "vs/platform/commands/common/commands", "vs/editor/common/languages/modesRegistry", "vs/base/common/network", "vs/platform/configuration/common/configuration", "vs/editor/browser/editorExtensions", "vs/base/browser/touch", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/editor/common/editorGroupsService"], function (require, exports, dom, lifecycle_1, nls_1, themeService_1, colorRegistry_1, editorStatus_1, commands_1, modesRegistry_1, network_1, configuration_1, editorExtensions_1, touch_1, keybinding_1, editorGroupsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledTextEditorHintContribution = void 0;
    const $ = dom.$;
    const untitledTextEditorHintSetting = 'workbench.editor.untitled.hint';
    let UntitledTextEditorHintContribution = class UntitledTextEditorHintContribution {
        constructor(editor, editorGroupsService, commandService, configurationService, keybindingService) {
            this.editor = editor;
            this.editorGroupsService = editorGroupsService;
            this.commandService = commandService;
            this.configurationService = configurationService;
            this.keybindingService = keybindingService;
            this.toDispose = [];
            this.toDispose.push(this.editor.onDidChangeModel(() => this.update()));
            this.toDispose.push(this.editor.onDidChangeModelLanguage(() => this.update()));
            this.toDispose.push(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(untitledTextEditorHintSetting)) {
                    this.update();
                }
            }));
        }
        update() {
            var _a;
            (_a = this.untitledTextHintContentWidget) === null || _a === void 0 ? void 0 : _a.dispose();
            const configValue = this.configurationService.getValue(untitledTextEditorHintSetting);
            const model = this.editor.getModel();
            if (model && model.uri.scheme === network_1.Schemas.untitled && model.getLanguageId() === modesRegistry_1.PLAINTEXT_LANGUAGE_ID && configValue === 'text') {
                this.untitledTextHintContentWidget = new UntitledTextEditorHintContentWidget(this.editor, this.editorGroupsService, this.commandService, this.configurationService, this.keybindingService);
            }
        }
        dispose() {
            var _a;
            (0, lifecycle_1.dispose)(this.toDispose);
            (_a = this.untitledTextHintContentWidget) === null || _a === void 0 ? void 0 : _a.dispose();
        }
    };
    UntitledTextEditorHintContribution.ID = 'editor.contrib.untitledTextEditorHint';
    UntitledTextEditorHintContribution = __decorate([
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, commands_1.ICommandService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, keybinding_1.IKeybindingService)
    ], UntitledTextEditorHintContribution);
    exports.UntitledTextEditorHintContribution = UntitledTextEditorHintContribution;
    class UntitledTextEditorHintContentWidget {
        constructor(editor, editorGroupsService, commandService, configurationService, keybindingService) {
            this.editor = editor;
            this.editorGroupsService = editorGroupsService;
            this.commandService = commandService;
            this.configurationService = configurationService;
            this.keybindingService = keybindingService;
            this.toDispose = [];
            this.toDispose.push(editor.onDidChangeModelContent(() => this.onDidChangeModelContent()));
            this.toDispose.push(this.editor.onDidChangeConfiguration((e) => {
                if (this.domNode && e.hasChanged(44 /* EditorOption.fontInfo */)) {
                    this.editor.applyFontInfo(this.domNode);
                }
            }));
            this.onDidChangeModelContent();
        }
        onDidChangeModelContent() {
            if (this.editor.getValue() === '') {
                this.editor.addContentWidget(this);
            }
            else {
                this.editor.removeContentWidget(this);
            }
        }
        getId() {
            return UntitledTextEditorHintContentWidget.ID;
        }
        // Select a language to get started. Start typing to dismiss, or don't show this again.
        getDomNode() {
            if (!this.domNode) {
                this.domNode = $('.untitled-hint');
                this.domNode.style.width = 'max-content';
                const language = $('a.language-mode');
                language.style.cursor = 'pointer';
                language.innerText = (0, nls_1.localize)('selectAlanguage2', "Select a language");
                const languageKeyBinding = this.keybindingService.lookupKeybinding(editorStatus_1.ChangeLanguageAction.ID);
                const languageKeybindingLabel = languageKeyBinding === null || languageKeyBinding === void 0 ? void 0 : languageKeyBinding.getLabel();
                if (languageKeybindingLabel) {
                    language.title = (0, nls_1.localize)('keyboardBindingTooltip', "{0}", languageKeybindingLabel);
                }
                this.domNode.appendChild(language);
                const or = $('span');
                or.innerText = (0, nls_1.localize)('or', " or ");
                this.domNode.appendChild(or);
                const editorType = $('a.editor-type');
                editorType.style.cursor = 'pointer';
                editorType.innerText = (0, nls_1.localize)('openADifferentEditor', "open a different editor");
                const selectEditorTypeKeyBinding = this.keybindingService.lookupKeybinding('welcome.showNewFileEntries');
                const selectEditorTypeKeybindingLabel = selectEditorTypeKeyBinding === null || selectEditorTypeKeyBinding === void 0 ? void 0 : selectEditorTypeKeyBinding.getLabel();
                if (selectEditorTypeKeybindingLabel) {
                    editorType.title = (0, nls_1.localize)('keyboardBindingTooltip', "{0}", selectEditorTypeKeybindingLabel);
                }
                this.domNode.appendChild(editorType);
                const toGetStarted = $('span');
                toGetStarted.innerText = (0, nls_1.localize)('toGetStarted', " to get started.");
                this.domNode.appendChild(toGetStarted);
                this.domNode.appendChild($('br'));
                const startTyping = $('span');
                startTyping.innerText = (0, nls_1.localize)('startTyping', "Start typing to dismiss or ");
                this.domNode.appendChild(startTyping);
                const dontShow = $('a');
                dontShow.style.cursor = 'pointer';
                dontShow.innerText = (0, nls_1.localize)('dontshow', "don't show");
                this.domNode.appendChild(dontShow);
                const thisAgain = $('span');
                thisAgain.innerText = (0, nls_1.localize)('thisAgain', " this again.");
                this.domNode.appendChild(thisAgain);
                this.toDispose.push(touch_1.Gesture.addTarget(this.domNode));
                const languageOnClickOrTap = async (e) => {
                    e.stopPropagation();
                    // Need to focus editor before so current editor becomes active and the command is properly executed
                    this.editor.focus();
                    await this.commandService.executeCommand(editorStatus_1.ChangeLanguageAction.ID, { from: 'hint' });
                    this.editor.focus();
                };
                this.toDispose.push(dom.addDisposableListener(language, 'click', languageOnClickOrTap));
                this.toDispose.push(dom.addDisposableListener(language, touch_1.EventType.Tap, languageOnClickOrTap));
                this.toDispose.push(touch_1.Gesture.addTarget(language));
                const chooseEditorOnClickOrTap = async (e) => {
                    var _a;
                    e.stopPropagation();
                    const activeEditorInput = this.editorGroupsService.activeGroup.activeEditor;
                    const newEditorSelected = await this.commandService.executeCommand('welcome.showNewFileEntries', { from: 'hint' });
                    // Close the active editor as long as it is untitled (swap the editors out)
                    if (newEditorSelected && activeEditorInput !== null && ((_a = activeEditorInput.resource) === null || _a === void 0 ? void 0 : _a.scheme) === network_1.Schemas.untitled) {
                        this.editorGroupsService.activeGroup.closeEditor(activeEditorInput, { preserveFocus: true });
                    }
                };
                this.toDispose.push(dom.addDisposableListener(editorType, 'click', chooseEditorOnClickOrTap));
                this.toDispose.push(dom.addDisposableListener(editorType, touch_1.EventType.Tap, chooseEditorOnClickOrTap));
                this.toDispose.push(touch_1.Gesture.addTarget(editorType));
                const dontShowOnClickOrTap = () => {
                    this.configurationService.updateValue(untitledTextEditorHintSetting, 'hidden');
                    this.dispose();
                    this.editor.focus();
                };
                this.toDispose.push(dom.addDisposableListener(dontShow, 'click', dontShowOnClickOrTap));
                this.toDispose.push(dom.addDisposableListener(dontShow, touch_1.EventType.Tap, dontShowOnClickOrTap));
                this.toDispose.push(touch_1.Gesture.addTarget(dontShow));
                this.toDispose.push(dom.addDisposableListener(this.domNode, 'click', () => {
                    this.editor.focus();
                }));
                this.domNode.style.fontStyle = 'italic';
                this.domNode.style.paddingLeft = '4px';
                this.editor.applyFontInfo(this.domNode);
            }
            return this.domNode;
        }
        getPosition() {
            return {
                position: { lineNumber: 1, column: 1 },
                preference: [0 /* ContentWidgetPositionPreference.EXACT */]
            };
        }
        dispose() {
            this.editor.removeContentWidget(this);
            (0, lifecycle_1.dispose)(this.toDispose);
        }
    }
    UntitledTextEditorHintContentWidget.ID = 'editor.widget.untitledHint';
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const inputPlaceholderForegroundColor = theme.getColor(colorRegistry_1.inputPlaceholderForeground);
        if (inputPlaceholderForegroundColor) {
            collector.addRule(`.monaco-editor .contentWidgets .untitled-hint { color: ${inputPlaceholderForegroundColor}; }`);
        }
        const textLinkForegroundColor = theme.getColor(colorRegistry_1.textLinkForeground);
        if (textLinkForegroundColor) {
            collector.addRule(`.monaco-editor .contentWidgets .untitled-hint a { color: ${textLinkForegroundColor}; }`);
        }
    });
    (0, editorExtensions_1.registerEditorContribution)(UntitledTextEditorHintContribution.ID, UntitledTextEditorHintContribution);
});
//# sourceMappingURL=untitledTextEditorHint.js.map