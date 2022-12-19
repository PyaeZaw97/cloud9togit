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
define(["require", "exports", "vs/workbench/common/views", "vs/nls", "vs/workbench/browser/parts/views/treeView", "vs/platform/instantiation/common/instantiation", "vs/platform/userDataSync/common/userDataSync", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/base/common/uri", "vs/workbench/services/editor/common/editorService", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/codicons", "vs/workbench/services/userDataSync/common/userDataSync", "vs/base/common/resources", "vs/workbench/services/decorations/common/decorations", "vs/platform/progress/common/progress", "vs/platform/theme/common/colorRegistry", "vs/base/browser/dom", "vs/base/browser/ui/button/button", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/configuration/common/configuration", "vs/platform/opener/common/opener", "vs/platform/theme/common/themeService", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/styler", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/browser/codeeditor", "vs/editor/browser/editorExtensions", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/platform/editor/common/editor", "vs/css!./media/userDataSyncViews"], function (require, exports, views_1, nls_1, treeView_1, instantiation_1, userDataSync_1, actions_1, contextkey_1, uri_1, editorService_1, event_1, lifecycle_1, codicons_1, userDataSync_2, resources_1, decorations_1, progress_1, colorRegistry_1, DOM, button_1, keybinding_1, contextView_1, configuration_1, opener_1, themeService_1, telemetry_1, styler_1, diffEditorInput_1, codeeditor_1, editorExtensions_1, notification_1, dialogs_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncMergesViewPane = void 0;
    let UserDataSyncMergesViewPane = class UserDataSyncMergesViewPane extends treeView_1.TreeViewPane {
        constructor(options, editorService, dialogService, progressService, userDataSyncWorkbenchService, decorationsService, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.editorService = editorService;
            this.dialogService = dialogService;
            this.progressService = progressService;
            this.treeItems = new Map();
            this.userDataSyncPreview = userDataSyncWorkbenchService.userDataSyncPreview;
            this._register(this.userDataSyncPreview.onDidChangeResources(() => this.updateSyncButtonEnablement()));
            this._register(this.userDataSyncPreview.onDidChangeResources(() => this.treeView.refresh()));
            this._register(this.userDataSyncPreview.onDidChangeResources(() => this.closeDiffEditors()));
            this._register(decorationsService.registerDecorationsProvider(this._register(new UserDataSyncResourcesDecorationProvider(this.userDataSyncPreview))));
            this.registerActions();
        }
        renderTreeView(container) {
            super.renderTreeView(DOM.append(container, DOM.$('')));
            this.createButtons(container);
            const that = this;
            this.treeView.message = (0, nls_1.localize)('explanation', "Please go through each entry and merge to enable sync.");
            this.treeView.dataProvider = { getChildren() { return that.getTreeItems(); } };
        }
        createButtons(container) {
            this.buttonsContainer = DOM.append(container, DOM.$('.manual-sync-buttons-container'));
            this.syncButton = this._register(new button_1.Button(this.buttonsContainer));
            this.syncButton.label = (0, nls_1.localize)('turn on sync', "Turn on Settings Sync");
            this.updateSyncButtonEnablement();
            this._register((0, styler_1.attachButtonStyler)(this.syncButton, this.themeService));
            this._register(this.syncButton.onDidClick(() => this.apply()));
            this.cancelButton = this._register(new button_1.Button(this.buttonsContainer, { secondary: true }));
            this.cancelButton.label = (0, nls_1.localize)('cancel', "Cancel");
            this._register((0, styler_1.attachButtonStyler)(this.cancelButton, this.themeService));
            this._register(this.cancelButton.onDidClick(() => this.cancel()));
        }
        layoutTreeView(height, width) {
            const buttonContainerHeight = 78;
            this.buttonsContainer.style.height = `${buttonContainerHeight}px`;
            this.buttonsContainer.style.width = `${width}px`;
            const numberOfChanges = this.userDataSyncPreview.resources.filter(r => r.syncResource !== "globalState" /* SyncResource.GlobalState */ && (r.localChange !== 0 /* Change.None */ || r.remoteChange !== 0 /* Change.None */)).length;
            const messageHeight = 66 /* max 3 lines */;
            super.layoutTreeView(Math.min(height - buttonContainerHeight, ((22 * numberOfChanges) + messageHeight)), width);
        }
        updateSyncButtonEnablement() {
            this.syncButton.enabled = this.userDataSyncPreview.resources.every(c => c.syncResource === "globalState" /* SyncResource.GlobalState */ || c.mergeState === "accepted" /* MergeState.Accepted */);
        }
        async getTreeItems() {
            this.treeItems.clear();
            const roots = [];
            for (const resource of this.userDataSyncPreview.resources) {
                if (resource.syncResource !== "globalState" /* SyncResource.GlobalState */ && (resource.localChange !== 0 /* Change.None */ || resource.remoteChange !== 0 /* Change.None */)) {
                    const handle = JSON.stringify(resource);
                    const treeItem = {
                        handle,
                        resourceUri: resource.remote,
                        label: { label: (0, resources_1.basename)(resource.remote), strikethrough: resource.mergeState === "accepted" /* MergeState.Accepted */ && (resource.localChange === 3 /* Change.Deleted */ || resource.remoteChange === 3 /* Change.Deleted */) },
                        description: (0, userDataSync_2.getSyncAreaLabel)(resource.syncResource),
                        collapsibleState: views_1.TreeItemCollapsibleState.None,
                        command: { id: `workbench.actions.sync.showChanges`, title: '', arguments: [{ $treeViewId: '', $treeItemHandle: handle }] },
                        contextValue: `sync-resource-${resource.mergeState}`
                    };
                    this.treeItems.set(handle, treeItem);
                    roots.push(treeItem);
                }
            }
            return roots;
        }
        toUserDataSyncResourceGroup(handle) {
            const parsed = JSON.parse(handle);
            return {
                syncResource: parsed.syncResource,
                local: uri_1.URI.revive(parsed.local),
                remote: uri_1.URI.revive(parsed.remote),
                merged: uri_1.URI.revive(parsed.merged),
                accepted: uri_1.URI.revive(parsed.accepted),
                localChange: parsed.localChange,
                remoteChange: parsed.remoteChange,
                mergeState: parsed.mergeState,
            };
        }
        registerActions() {
            const that = this;
            /* accept remote change */
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.acceptRemote`,
                        title: (0, nls_1.localize)('workbench.actions.sync.acceptRemote', "Accept Remote"),
                        icon: codicons_1.Codicon.cloudDownload,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', userDataSync_2.SYNC_MERGES_VIEW_ID), contextkey_1.ContextKeyExpr.equals('viewItem', 'sync-resource-preview')),
                            group: 'inline',
                            order: 1,
                        },
                    });
                }
                async run(accessor, handle) {
                    return that.acceptRemote(that.toUserDataSyncResourceGroup(handle.$treeItemHandle));
                }
            }));
            /* accept local change */
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.acceptLocal`,
                        title: (0, nls_1.localize)('workbench.actions.sync.acceptLocal', "Accept Local"),
                        icon: codicons_1.Codicon.cloudUpload,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', userDataSync_2.SYNC_MERGES_VIEW_ID), contextkey_1.ContextKeyExpr.equals('viewItem', 'sync-resource-preview')),
                            group: 'inline',
                            order: 2,
                        },
                    });
                }
                async run(accessor, handle) {
                    return that.acceptLocal(that.toUserDataSyncResourceGroup(handle.$treeItemHandle));
                }
            }));
            /* merge */
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.merge`,
                        title: (0, nls_1.localize)('workbench.actions.sync.merge', "Merge"),
                        icon: codicons_1.Codicon.merge,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', userDataSync_2.SYNC_MERGES_VIEW_ID), contextkey_1.ContextKeyExpr.equals('viewItem', 'sync-resource-preview')),
                            group: 'inline',
                            order: 3,
                        },
                    });
                }
                async run(accessor, handle) {
                    return that.mergeResource(that.toUserDataSyncResourceGroup(handle.$treeItemHandle));
                }
            }));
            /* discard */
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.undo`,
                        title: (0, nls_1.localize)('workbench.actions.sync.discard', "Discard"),
                        icon: codicons_1.Codicon.discard,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', userDataSync_2.SYNC_MERGES_VIEW_ID), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('viewItem', 'sync-resource-accepted'), contextkey_1.ContextKeyExpr.equals('viewItem', 'sync-resource-conflict'))),
                            group: 'inline',
                            order: 3,
                        },
                    });
                }
                async run(accessor, handle) {
                    return that.discardResource(that.toUserDataSyncResourceGroup(handle.$treeItemHandle));
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.showChanges`,
                        title: (0, nls_1.localize)({ key: 'workbench.actions.sync.showChanges', comment: ['This is an action title to show the changes between local and remote version of resources'] }, "Open Changes"),
                    });
                }
                async run(accessor, handle) {
                    const previewResource = that.toUserDataSyncResourceGroup(handle.$treeItemHandle);
                    return that.open(previewResource);
                }
            }));
        }
        async acceptLocal(userDataSyncResource) {
            await this.withProgress(async () => {
                await this.userDataSyncPreview.accept(userDataSyncResource.syncResource, userDataSyncResource.local);
            });
            await this.reopen(userDataSyncResource);
        }
        async acceptRemote(userDataSyncResource) {
            await this.withProgress(async () => {
                await this.userDataSyncPreview.accept(userDataSyncResource.syncResource, userDataSyncResource.remote);
            });
            await this.reopen(userDataSyncResource);
        }
        async mergeResource(previewResource) {
            await this.withProgress(() => this.userDataSyncPreview.merge(previewResource.merged));
            previewResource = this.userDataSyncPreview.resources.find(({ local }) => (0, resources_1.isEqual)(local, previewResource.local));
            await this.reopen(previewResource);
            if (previewResource.mergeState === "conflict" /* MergeState.Conflict */) {
                await this.dialogService.show(notification_1.Severity.Warning, (0, nls_1.localize)('conflicts detected', "Conflicts Detected"), undefined, {
                    detail: (0, nls_1.localize)('resolve', "Unable to merge due to conflicts. Please resolve them to continue.")
                });
            }
        }
        async discardResource(previewResource) {
            this.close(previewResource);
            return this.withProgress(() => this.userDataSyncPreview.discard(previewResource.merged));
        }
        async apply() {
            this.closeAll();
            this.syncButton.label = (0, nls_1.localize)('turning on', "Turning on...");
            this.syncButton.enabled = false;
            this.cancelButton.enabled = false;
            try {
                await this.withProgress(async () => this.userDataSyncPreview.apply());
            }
            catch (error) {
                this.syncButton.enabled = false;
                this.cancelButton.enabled = true;
            }
        }
        async cancel() {
            for (const resource of this.userDataSyncPreview.resources) {
                this.close(resource);
            }
            await this.userDataSyncPreview.cancel();
        }
        async open(previewResource) {
            if (previewResource.mergeState === "accepted" /* MergeState.Accepted */) {
                if (previewResource.localChange !== 3 /* Change.Deleted */ && previewResource.remoteChange !== 3 /* Change.Deleted */) {
                    // Do not open deleted preview
                    await this.editorService.openEditor({
                        resource: previewResource.accepted,
                        label: (0, nls_1.localize)('preview', "{0} (Preview)", (0, resources_1.basename)(previewResource.accepted)),
                        options: { pinned: true }
                    });
                }
            }
            else {
                const leftResource = previewResource.remote;
                const rightResource = previewResource.mergeState === "conflict" /* MergeState.Conflict */ ? previewResource.merged : previewResource.local;
                const leftResourceName = (0, nls_1.localize)({ key: 'leftResourceName', comment: ['remote as in file in cloud'] }, "{0} (Remote)", (0, resources_1.basename)(leftResource));
                const rightResourceName = previewResource.mergeState === "conflict" /* MergeState.Conflict */ ? (0, nls_1.localize)('merges', "{0} (Merges)", (0, resources_1.basename)(rightResource))
                    : (0, nls_1.localize)({ key: 'rightResourceName', comment: ['local as in file in disk'] }, "{0} (Local)", (0, resources_1.basename)(rightResource));
                await this.editorService.openEditor({
                    original: { resource: leftResource },
                    modified: { resource: rightResource },
                    label: (0, nls_1.localize)('sideBySideLabels', "{0} ↔ {1}", leftResourceName, rightResourceName),
                    description: (0, nls_1.localize)('sideBySideDescription', "Settings Sync"),
                    options: {
                        preserveFocus: true,
                        revealIfVisible: true,
                        pinned: true,
                        override: editor_1.EditorResolution.DISABLED
                    },
                });
            }
        }
        async reopen(previewResource) {
            this.close(previewResource);
            const resource = this.userDataSyncPreview.resources.find(({ local }) => (0, resources_1.isEqual)(local, previewResource.local));
            if (resource) {
                // select the resource
                await this.treeView.refresh();
                this.treeView.setSelection([this.treeItems.get(JSON.stringify(resource))]);
                await this.open(resource);
            }
        }
        close(previewResource) {
            for (const input of this.editorService.editors) {
                if (input instanceof diffEditorInput_1.DiffEditorInput) {
                    // Close all diff editors
                    if ((0, resources_1.isEqual)(previewResource.remote, input.secondary.resource)) {
                        input.dispose();
                    }
                }
                // Close all preview editors
                else if ((0, resources_1.isEqual)(previewResource.accepted, input.resource)) {
                    input.dispose();
                }
            }
        }
        closeDiffEditors() {
            for (const previewResource of this.userDataSyncPreview.resources) {
                if (previewResource.mergeState === "accepted" /* MergeState.Accepted */) {
                    for (const input of this.editorService.editors) {
                        if (input instanceof diffEditorInput_1.DiffEditorInput) {
                            if ((0, resources_1.isEqual)(previewResource.remote, input.secondary.resource) &&
                                ((0, resources_1.isEqual)(previewResource.merged, input.primary.resource) || (0, resources_1.isEqual)(previewResource.local, input.primary.resource))) {
                                input.dispose();
                            }
                        }
                    }
                }
            }
        }
        closeAll() {
            for (const previewResource of this.userDataSyncPreview.resources) {
                this.close(previewResource);
            }
        }
        withProgress(task) {
            return this.progressService.withProgress({ location: userDataSync_2.SYNC_MERGES_VIEW_ID, delay: 500 }, task);
        }
    };
    UserDataSyncMergesViewPane = __decorate([
        __param(1, editorService_1.IEditorService),
        __param(2, dialogs_1.IDialogService),
        __param(3, progress_1.IProgressService),
        __param(4, userDataSync_2.IUserDataSyncWorkbenchService),
        __param(5, decorations_1.IDecorationsService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, views_1.IViewDescriptorService),
        __param(11, instantiation_1.IInstantiationService),
        __param(12, opener_1.IOpenerService),
        __param(13, themeService_1.IThemeService),
        __param(14, telemetry_1.ITelemetryService)
    ], UserDataSyncMergesViewPane);
    exports.UserDataSyncMergesViewPane = UserDataSyncMergesViewPane;
    class UserDataSyncResourcesDecorationProvider extends lifecycle_1.Disposable {
        constructor(userDataSyncPreview) {
            super();
            this.userDataSyncPreview = userDataSyncPreview;
            this.label = (0, nls_1.localize)('label', "UserDataSyncResources");
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._register(userDataSyncPreview.onDidChangeResources(c => this._onDidChange.fire(c.map(({ remote }) => remote))));
        }
        provideDecorations(resource) {
            const userDataSyncResource = this.userDataSyncPreview.resources.find(c => (0, resources_1.isEqual)(c.remote, resource));
            if (userDataSyncResource) {
                switch (userDataSyncResource.mergeState) {
                    case "conflict" /* MergeState.Conflict */:
                        return { letter: '⚠', color: colorRegistry_1.listWarningForeground, tooltip: (0, nls_1.localize)('conflict', "Conflicts Detected") };
                    case "accepted" /* MergeState.Accepted */:
                        return { letter: '✓', color: colorRegistry_1.listDeemphasizedForeground, tooltip: (0, nls_1.localize)('accepted', "Accepted") };
                }
            }
            return undefined;
        }
    }
    let AcceptChangesContribution = class AcceptChangesContribution extends lifecycle_1.Disposable {
        constructor(editor, instantiationService, userDataSyncService, configurationService, userDataSyncWorkbenchService) {
            super();
            this.editor = editor;
            this.instantiationService = instantiationService;
            this.userDataSyncService = userDataSyncService;
            this.configurationService = configurationService;
            this.userDataSyncWorkbenchService = userDataSyncWorkbenchService;
            this.update();
            this.registerListeners();
        }
        static get(editor) {
            return editor.getContribution(AcceptChangesContribution.ID);
        }
        registerListeners() {
            this._register(this.editor.onDidChangeModel(() => this.update()));
            this._register(this.userDataSyncService.onDidChangeConflicts(() => this.update()));
            this._register(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('diffEditor.renderSideBySide'))(() => this.update()));
        }
        update() {
            if (!this.shouldShowButton(this.editor)) {
                this.disposeAcceptChangesWidgetRenderer();
                return;
            }
            this.createAcceptChangesWidgetRenderer();
        }
        shouldShowButton(editor) {
            const model = editor.getModel();
            if (!model) {
                return false; // we need a model
            }
            const userDataSyncResource = this.getUserDataSyncResource(model.uri);
            if (!userDataSyncResource) {
                return false;
            }
            if (!this.configurationService.getValue('diffEditor.renderSideBySide')) {
                return (0, resources_1.isEqual)(userDataSyncResource.merged, model.uri);
            }
            return true;
        }
        createAcceptChangesWidgetRenderer() {
            if (!this.acceptChangesButton) {
                const resource = this.editor.getModel().uri;
                const userDataSyncResource = this.getUserDataSyncResource(resource);
                const isRemoteResource = (0, resources_1.isEqual)(userDataSyncResource.remote, resource);
                const isLocalResource = (0, resources_1.isEqual)(userDataSyncResource.local, resource);
                const label = isRemoteResource ? (0, nls_1.localize)('accept remote', "Accept Remote")
                    : isLocalResource ? (0, nls_1.localize)('accept local', "Accept Local")
                        : (0, nls_1.localize)('accept merges', "Accept Merges");
                this.acceptChangesButton = this.instantiationService.createInstance(codeeditor_1.FloatingClickWidget, this.editor, label, null);
                this._register(this.acceptChangesButton.onClick(async () => {
                    const model = this.editor.getModel();
                    if (model) {
                        await this.userDataSyncWorkbenchService.userDataSyncPreview.accept(userDataSyncResource.syncResource, model.uri, model.getValue());
                    }
                }));
                this.acceptChangesButton.render();
            }
        }
        getUserDataSyncResource(resource) {
            return this.userDataSyncWorkbenchService.userDataSyncPreview.resources.find(r => (0, resources_1.isEqual)(resource, r.local) || (0, resources_1.isEqual)(resource, r.remote) || (0, resources_1.isEqual)(resource, r.merged));
        }
        disposeAcceptChangesWidgetRenderer() {
            (0, lifecycle_1.dispose)(this.acceptChangesButton);
            this.acceptChangesButton = undefined;
        }
        dispose() {
            this.disposeAcceptChangesWidgetRenderer();
            super.dispose();
        }
    };
    AcceptChangesContribution.ID = 'editor.contrib.acceptChangesButton2';
    AcceptChangesContribution = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, userDataSync_1.IUserDataSyncService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, userDataSync_2.IUserDataSyncWorkbenchService)
    ], AcceptChangesContribution);
    (0, editorExtensions_1.registerEditorContribution)(AcceptChangesContribution.ID, AcceptChangesContribution);
});
//# sourceMappingURL=userDataSyncMergesView.js.map