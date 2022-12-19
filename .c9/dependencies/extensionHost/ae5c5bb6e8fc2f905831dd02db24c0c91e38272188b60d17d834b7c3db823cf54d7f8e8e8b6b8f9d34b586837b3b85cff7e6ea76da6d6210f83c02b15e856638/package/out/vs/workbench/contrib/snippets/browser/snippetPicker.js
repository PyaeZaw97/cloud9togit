/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/contrib/snippets/browser/snippets.contribution", "vs/workbench/contrib/snippets/browser/snippetsFile", "vs/platform/quickinput/common/quickInput", "vs/base/common/codicons", "vs/base/common/event"], function (require, exports, nls, snippets_contribution_1, snippetsFile_1, quickInput_1, codicons_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pickSnippet = void 0;
    async function pickSnippet(accessor, languageIdOrSnippets) {
        var _a;
        const snippetService = accessor.get(snippets_contribution_1.ISnippetsService);
        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
        let snippets;
        if (Array.isArray(languageIdOrSnippets)) {
            snippets = languageIdOrSnippets;
        }
        else {
            snippets = (await snippetService.getSnippets(languageIdOrSnippets, { includeDisabledSnippets: true, includeNoPrefixSnippets: true }));
        }
        snippets.sort(snippetsFile_1.Snippet.compare);
        const makeSnippetPicks = () => {
            const result = [];
            let prevSnippet;
            for (const snippet of snippets) {
                const pick = {
                    label: snippet.prefix || snippet.name,
                    detail: snippet.description,
                    snippet
                };
                if (!prevSnippet || prevSnippet.snippetSource !== snippet.snippetSource || prevSnippet.source !== snippet.source) {
                    let label = '';
                    switch (snippet.snippetSource) {
                        case 1 /* SnippetSource.User */:
                            label = nls.localize('sep.userSnippet', "User Snippets");
                            break;
                        case 3 /* SnippetSource.Extension */:
                            label = snippet.source;
                            break;
                        case 2 /* SnippetSource.Workspace */:
                            label = nls.localize('sep.workspaceSnippet', "Workspace Snippets");
                            break;
                    }
                    result.push({ type: 'separator', label });
                }
                if (snippet.snippetSource === 3 /* SnippetSource.Extension */) {
                    const isEnabled = snippetService.isEnabled(snippet);
                    if (isEnabled) {
                        pick.buttons = [{
                                iconClass: codicons_1.Codicon.eyeClosed.classNames,
                                tooltip: nls.localize('disableSnippet', 'Hide from IntelliSense')
                            }];
                    }
                    else {
                        pick.description = nls.localize('isDisabled', "(hidden from IntelliSense)");
                        pick.buttons = [{
                                iconClass: codicons_1.Codicon.eye.classNames,
                                tooltip: nls.localize('enable.snippet', 'Show in IntelliSense')
                            }];
                    }
                }
                result.push(pick);
                prevSnippet = snippet;
            }
            return result;
        };
        const picker = quickInputService.createQuickPick();
        picker.placeholder = nls.localize('pick.placeholder', "Select a snippet");
        picker.matchOnDetail = true;
        picker.ignoreFocusOut = false;
        picker.keepScrollPosition = true;
        picker.onDidTriggerItemButton(ctx => {
            const isEnabled = snippetService.isEnabled(ctx.item.snippet);
            snippetService.updateEnablement(ctx.item.snippet, !isEnabled);
            picker.items = makeSnippetPicks();
        });
        picker.items = makeSnippetPicks();
        picker.show();
        // wait for an item to be picked or the picker to become hidden
        await Promise.race([event_1.Event.toPromise(picker.onDidAccept), event_1.Event.toPromise(picker.onDidHide)]);
        const result = (_a = picker.selectedItems[0]) === null || _a === void 0 ? void 0 : _a.snippet;
        picker.dispose();
        return result;
    }
    exports.pickSnippet = pickSnippet;
});
//# sourceMappingURL=snippetPicker.js.map