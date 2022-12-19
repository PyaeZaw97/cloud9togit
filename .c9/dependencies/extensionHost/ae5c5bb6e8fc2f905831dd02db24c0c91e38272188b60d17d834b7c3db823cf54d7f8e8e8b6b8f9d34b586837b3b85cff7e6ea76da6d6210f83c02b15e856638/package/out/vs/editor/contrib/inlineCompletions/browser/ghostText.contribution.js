/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/contrib/hover/browser/hoverTypes", "vs/editor/contrib/inlineCompletions/browser/consts", "vs/editor/contrib/inlineCompletions/browser/ghostTextController", "vs/editor/contrib/inlineCompletions/browser/ghostTextHoverParticipant", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry"], function (require, exports, editorExtensions_1, editorContextKeys_1, hoverTypes_1, consts_1, ghostTextController_1, ghostTextHoverParticipant_1, contextkey_1, keybindingsRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.commitInlineSuggestionAction = void 0;
    (0, editorExtensions_1.registerEditorContribution)(ghostTextController_1.GhostTextController.ID, ghostTextController_1.GhostTextController);
    (0, editorExtensions_1.registerEditorAction)(ghostTextController_1.TriggerInlineSuggestionAction);
    (0, editorExtensions_1.registerEditorAction)(ghostTextController_1.ShowNextInlineSuggestionAction);
    (0, editorExtensions_1.registerEditorAction)(ghostTextController_1.ShowPreviousInlineSuggestionAction);
    hoverTypes_1.HoverParticipantRegistry.register(ghostTextHoverParticipant_1.InlineCompletionsHoverParticipant);
    const GhostTextCommand = editorExtensions_1.EditorCommand.bindToContribution(ghostTextController_1.GhostTextController.get);
    exports.commitInlineSuggestionAction = new GhostTextCommand({
        id: consts_1.inlineSuggestCommitId,
        precondition: ghostTextController_1.GhostTextController.inlineSuggestionVisible,
        handler(x) {
            x.commit();
            x.editor.focus();
        }
    });
    (0, editorExtensions_1.registerEditorCommand)(exports.commitInlineSuggestionAction);
    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
        primary: 2 /* KeyCode.Tab */,
        weight: 200,
        id: exports.commitInlineSuggestionAction.id,
        when: contextkey_1.ContextKeyExpr.and(exports.commitInlineSuggestionAction.precondition, editorContextKeys_1.EditorContextKeys.tabMovesFocus.toNegated(), ghostTextController_1.GhostTextController.inlineSuggestionHasIndentationLessThanTabSize),
    });
    (0, editorExtensions_1.registerEditorCommand)(new GhostTextCommand({
        id: 'editor.action.inlineSuggest.hide',
        precondition: ghostTextController_1.GhostTextController.inlineSuggestionVisible,
        kbOpts: {
            weight: 100,
            primary: 9 /* KeyCode.Escape */,
        },
        handler(x) {
            x.hide();
        }
    }));
});
//# sourceMappingURL=ghostText.contribution.js.map