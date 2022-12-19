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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorGroupsService", "./webviewCommands", "./webviewEditor", "./webviewEditorInput", "./webviewEditorInputSerializer", "./webviewWorkbenchService"], function (require, exports, event_1, lifecycle_1, nls_1, actions_1, descriptors_1, extensions_1, platform_1, editor_1, contributions_1, editor_2, editorGroupsService_1, webviewCommands_1, webviewEditor_1, webviewEditorInput_1, webviewEditorInputSerializer_1, webviewWorkbenchService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (platform_1.Registry.as(editor_2.EditorExtensions.EditorPane)).registerEditorPane(editor_1.EditorPaneDescriptor.create(webviewEditor_1.WebviewEditor, webviewEditor_1.WebviewEditor.ID, (0, nls_1.localize)('webview.editor.label', "webview editor")), [new descriptors_1.SyncDescriptor(webviewEditorInput_1.WebviewInput)]);
    let WebviewPanelContribution = class WebviewPanelContribution extends lifecycle_1.Disposable {
        constructor(editorGroupService) {
            super();
            this.editorGroupService = editorGroupService;
            // Add all the initial groups to be listened to
            this.editorGroupService.whenReady.then(() => this.editorGroupService.groups.forEach(group => {
                this.registerGroupListener(group);
            }));
            // Additional groups added should also be listened to
            this._register(this.editorGroupService.onDidAddGroup(group => this.registerGroupListener(group)));
        }
        registerGroupListener(group) {
            const listener = group.onWillOpenEditor(e => this.onEditorOpening(e.editor, group));
            event_1.Event.once(group.onWillDispose)(() => {
                listener.dispose();
            });
        }
        onEditorOpening(editor, group) {
            if (!(editor instanceof webviewEditorInput_1.WebviewInput) || editor.typeId !== webviewEditorInput_1.WebviewInput.typeId) {
                return undefined;
            }
            if (group.contains(editor)) {
                return undefined;
            }
            let previousGroup;
            const groups = this.editorGroupService.groups;
            for (const group of groups) {
                if (group.contains(editor)) {
                    previousGroup = group;
                    break;
                }
            }
            if (!previousGroup) {
                return undefined;
            }
            previousGroup.closeEditor(editor);
        }
    };
    WebviewPanelContribution = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService)
    ], WebviewPanelContribution);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(WebviewPanelContribution, 1 /* LifecyclePhase.Starting */);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(webviewEditorInputSerializer_1.WebviewEditorInputSerializer.ID, webviewEditorInputSerializer_1.WebviewEditorInputSerializer);
    (0, extensions_1.registerSingleton)(webviewWorkbenchService_1.IWebviewWorkbenchService, webviewWorkbenchService_1.WebviewEditorService, true);
    (0, actions_1.registerAction2)(webviewCommands_1.ShowWebViewEditorFindWidgetAction);
    (0, actions_1.registerAction2)(webviewCommands_1.HideWebViewEditorFindCommand);
    (0, actions_1.registerAction2)(webviewCommands_1.WebViewEditorFindNextCommand);
    (0, actions_1.registerAction2)(webviewCommands_1.WebViewEditorFindPreviousCommand);
    (0, actions_1.registerAction2)(webviewCommands_1.ReloadWebviewAction);
});
//# sourceMappingURL=webviewPanel.contribution.js.map