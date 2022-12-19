/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/notification/common/notification", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/editor/common/services/languageFeatures"], function (require, exports, editorExtensions_1, editorContextKeys_1, nls, contextkey_1, commands_1, notification_1, extensions_1, dialogs_1, panecomposite_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    async function showExtensionQuery(paneCompositeService, query) {
        const viewlet = await paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
        if (viewlet) {
            (viewlet === null || viewlet === void 0 ? void 0 : viewlet.getViewPaneContainer()).search(query);
        }
    }
    (0, editorExtensions_1.registerEditorAction)(class FormatDocumentMultipleAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.formatDocument.none',
                label: nls.localize('formatDocument.label.multiple', "Format Document"),
                alias: 'Format Document',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasDocumentFormattingProvider.toNegated()),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 36 /* KeyCode.KeyF */,
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 39 /* KeyCode.KeyI */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                }
            });
        }
        async run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const commandService = accessor.get(commands_1.ICommandService);
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
            const model = editor.getModel();
            const formatterCount = languageFeaturesService.documentFormattingEditProvider.all(model).length;
            if (formatterCount > 1) {
                return commandService.executeCommand('editor.action.formatDocument.multiple');
            }
            else if (formatterCount === 1) {
                return commandService.executeCommand('editor.action.formatDocument');
            }
            else if (model.isTooLargeForSyncing()) {
                notificationService.warn(nls.localize('too.large', "This file cannot be formatted because it is too large"));
            }
            else {
                const langName = model.getLanguageId();
                const message = nls.localize('no.provider', "There is no formatter for '{0}' files installed.", langName);
                const res = await dialogService.show(notification_1.Severity.Info, message, [nls.localize('cancel', "Cancel"), nls.localize('install.formatter', "Install Formatter...")]);
                if (res.choice === 1) {
                    showExtensionQuery(paneCompositeService, `category:formatters ${langName}`);
                }
            }
        }
    });
});
//# sourceMappingURL=formatActionsNone.js.map