/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/common/platform", "vs/editor/browser/controller/textAreaInput", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService"], function (require, exports, browser, platform, textAreaInput_1, editorExtensions_1, codeEditorService_1, editorContextKeys_1, nls, actions_1, clipboardService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PasteAction = exports.CopyAction = exports.CutAction = void 0;
    const CLIPBOARD_CONTEXT_MENU_GROUP = '9_cutcopypaste';
    const supportsCut = (platform.isNative || document.queryCommandSupported('cut'));
    const supportsCopy = (platform.isNative || document.queryCommandSupported('copy'));
    // Firefox only supports navigator.clipboard.readText() in browser extensions.
    // See https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/readText#Browser_compatibility
    // When loading over http, navigator.clipboard can be undefined. See https://github.com/microsoft/monaco-editor/issues/2313
    const supportsPaste = (typeof navigator.clipboard === 'undefined' || browser.isFirefox) ? document.queryCommandSupported('paste') : true;
    function registerCommand(command) {
        command.register();
        return command;
    }
    exports.CutAction = supportsCut ? registerCommand(new editorExtensions_1.MultiCommand({
        id: 'editor.action.clipboardCutAction',
        precondition: undefined,
        kbOpts: (
        // Do not bind cut keybindings in the browser,
        // since browsers do that for us and it avoids security prompts
        platform.isNative ? {
            primary: 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */,
            win: { primary: 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */, secondary: [1024 /* KeyMod.Shift */ | 20 /* KeyCode.Delete */] },
            weight: 100 /* KeybindingWeight.EditorContrib */
        } : undefined),
        menuOpts: [{
                menuId: actions_1.MenuId.MenubarEditMenu,
                group: '2_ccp',
                title: nls.localize({ key: 'miCut', comment: ['&& denotes a mnemonic'] }, "Cu&&t"),
                order: 1
            }, {
                menuId: actions_1.MenuId.EditorContext,
                group: CLIPBOARD_CONTEXT_MENU_GROUP,
                title: nls.localize('actions.clipboard.cutLabel', "Cut"),
                when: editorContextKeys_1.EditorContextKeys.writable,
                order: 1,
            }, {
                menuId: actions_1.MenuId.CommandPalette,
                group: '',
                title: nls.localize('actions.clipboard.cutLabel', "Cut"),
                order: 1
            }, {
                menuId: actions_1.MenuId.SimpleEditorContext,
                group: CLIPBOARD_CONTEXT_MENU_GROUP,
                title: nls.localize('actions.clipboard.cutLabel', "Cut"),
                when: editorContextKeys_1.EditorContextKeys.writable,
                order: 1,
            }]
    })) : undefined;
    exports.CopyAction = supportsCopy ? registerCommand(new editorExtensions_1.MultiCommand({
        id: 'editor.action.clipboardCopyAction',
        precondition: undefined,
        kbOpts: (
        // Do not bind copy keybindings in the browser,
        // since browsers do that for us and it avoids security prompts
        platform.isNative ? {
            primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */,
            win: { primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */, secondary: [2048 /* KeyMod.CtrlCmd */ | 19 /* KeyCode.Insert */] },
            weight: 100 /* KeybindingWeight.EditorContrib */
        } : undefined),
        menuOpts: [{
                menuId: actions_1.MenuId.MenubarEditMenu,
                group: '2_ccp',
                title: nls.localize({ key: 'miCopy', comment: ['&& denotes a mnemonic'] }, "&&Copy"),
                order: 2
            }, {
                menuId: actions_1.MenuId.EditorContext,
                group: CLIPBOARD_CONTEXT_MENU_GROUP,
                title: nls.localize('actions.clipboard.copyLabel', "Copy"),
                order: 2,
            }, {
                menuId: actions_1.MenuId.CommandPalette,
                group: '',
                title: nls.localize('actions.clipboard.copyLabel', "Copy"),
                order: 1
            }, {
                menuId: actions_1.MenuId.SimpleEditorContext,
                group: CLIPBOARD_CONTEXT_MENU_GROUP,
                title: nls.localize('actions.clipboard.copyLabel', "Copy"),
                order: 2,
            }]
    })) : undefined;
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarEditMenu, { submenu: actions_1.MenuId.MenubarCopy, title: { value: nls.localize('copy as', "Copy As"), original: 'Copy As', }, group: '2_ccp', order: 3 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorContext, { submenu: actions_1.MenuId.EditorContextCopy, title: { value: nls.localize('copy as', "Copy As"), original: 'Copy As', }, group: CLIPBOARD_CONTEXT_MENU_GROUP, order: 3 });
    exports.PasteAction = supportsPaste ? registerCommand(new editorExtensions_1.MultiCommand({
        id: 'editor.action.clipboardPasteAction',
        precondition: undefined,
        kbOpts: (
        // Do not bind paste keybindings in the browser,
        // since browsers do that for us and it avoids security prompts
        platform.isNative ? {
            primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */,
            win: { primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */, secondary: [1024 /* KeyMod.Shift */ | 19 /* KeyCode.Insert */] },
            linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */, secondary: [1024 /* KeyMod.Shift */ | 19 /* KeyCode.Insert */] },
            weight: 100 /* KeybindingWeight.EditorContrib */
        } : undefined),
        menuOpts: [{
                menuId: actions_1.MenuId.MenubarEditMenu,
                group: '2_ccp',
                title: nls.localize({ key: 'miPaste', comment: ['&& denotes a mnemonic'] }, "&&Paste"),
                order: 4
            }, {
                menuId: actions_1.MenuId.EditorContext,
                group: CLIPBOARD_CONTEXT_MENU_GROUP,
                title: nls.localize('actions.clipboard.pasteLabel', "Paste"),
                when: editorContextKeys_1.EditorContextKeys.writable,
                order: 4,
            }, {
                menuId: actions_1.MenuId.CommandPalette,
                group: '',
                title: nls.localize('actions.clipboard.pasteLabel', "Paste"),
                order: 1
            }, {
                menuId: actions_1.MenuId.SimpleEditorContext,
                group: CLIPBOARD_CONTEXT_MENU_GROUP,
                title: nls.localize('actions.clipboard.pasteLabel', "Paste"),
                when: editorContextKeys_1.EditorContextKeys.writable,
                order: 4,
            }]
    })) : undefined;
    class ExecCommandCopyWithSyntaxHighlightingAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.clipboardCopyWithSyntaxHighlightingAction',
                label: nls.localize('actions.clipboard.copyWithSyntaxHighlightingLabel', "Copy With Syntax Highlighting"),
                alias: 'Copy With Syntax Highlighting',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const emptySelectionClipboard = editor.getOption(32 /* EditorOption.emptySelectionClipboard */);
            if (!emptySelectionClipboard && editor.getSelection().isEmpty()) {
                return;
            }
            textAreaInput_1.CopyOptions.forceCopyWithSyntaxHighlighting = true;
            editor.focus();
            document.execCommand('copy');
            textAreaInput_1.CopyOptions.forceCopyWithSyntaxHighlighting = false;
        }
    }
    function registerExecCommandImpl(target, browserCommand) {
        if (!target) {
            return;
        }
        // 1. handle case when focus is in editor.
        target.addImplementation(10000, 'code-editor', (accessor, args) => {
            // Only if editor text focus (i.e. not if editor has widget focus).
            const focusedEditor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
            if (focusedEditor && focusedEditor.hasTextFocus()) {
                // Do not execute if there is no selection and empty selection clipboard is off
                const emptySelectionClipboard = focusedEditor.getOption(32 /* EditorOption.emptySelectionClipboard */);
                const selection = focusedEditor.getSelection();
                if (selection && selection.isEmpty() && !emptySelectionClipboard) {
                    return true;
                }
                document.execCommand(browserCommand);
                return true;
            }
            return false;
        });
        // 2. (default) handle case when focus is somewhere else.
        target.addImplementation(0, 'generic-dom', (accessor, args) => {
            document.execCommand(browserCommand);
            return true;
        });
    }
    registerExecCommandImpl(exports.CutAction, 'cut');
    registerExecCommandImpl(exports.CopyAction, 'copy');
    if (exports.PasteAction) {
        // 1. Paste: handle case when focus is in editor.
        exports.PasteAction.addImplementation(10000, 'code-editor', (accessor, args) => {
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            // Only if editor text focus (i.e. not if editor has widget focus).
            const focusedEditor = codeEditorService.getFocusedCodeEditor();
            if (focusedEditor && focusedEditor.hasTextFocus()) {
                const result = document.execCommand('paste');
                // Use the clipboard service if document.execCommand('paste') was not successful
                if (!result && platform.isWeb) {
                    return (async () => {
                        const clipboardText = await clipboardService.readText();
                        if (clipboardText !== '') {
                            const metadata = textAreaInput_1.InMemoryClipboardMetadataManager.INSTANCE.get(clipboardText);
                            let pasteOnNewLine = false;
                            let multicursorText = null;
                            let mode = null;
                            if (metadata) {
                                pasteOnNewLine = (focusedEditor.getOption(32 /* EditorOption.emptySelectionClipboard */) && !!metadata.isFromEmptySelection);
                                multicursorText = (typeof metadata.multicursorText !== 'undefined' ? metadata.multicursorText : null);
                                mode = metadata.mode;
                            }
                            focusedEditor.trigger('keyboard', "paste" /* Handler.Paste */, {
                                text: clipboardText,
                                pasteOnNewLine,
                                multicursorText,
                                mode
                            });
                        }
                    })();
                }
                return true;
            }
            return false;
        });
        // 2. Paste: (default) handle case when focus is somewhere else.
        exports.PasteAction.addImplementation(0, 'generic-dom', (accessor, args) => {
            document.execCommand('paste');
            return true;
        });
    }
    if (supportsCopy) {
        (0, editorExtensions_1.registerEditorAction)(ExecCommandCopyWithSyntaxHighlightingAction);
    }
});
//# sourceMappingURL=clipboard.js.map