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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/views", "vs/nls", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/views/treeView", "vs/platform/instantiation/common/instantiation", "vs/platform/userDataSync/common/userDataSync", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/base/common/uri", "vs/workbench/services/editor/common/editorService", "vs/platform/theme/common/themeService", "vs/base/common/date", "vs/platform/dialogs/common/dialogs", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/codicons", "vs/base/common/actions", "vs/workbench/services/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncMachines", "vs/platform/quickinput/common/quickInput", "vs/platform/notification/common/notification", "vs/base/common/arrays", "vs/workbench/contrib/userDataSync/browser/userDataSyncMergesView", "vs/base/common/resources", "vs/workbench/browser/parts/editor/editorCommands", "vs/platform/files/common/files", "vs/platform/environment/common/environment", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/commands/common/commands"], function (require, exports, platform_1, views_1, nls_1, descriptors_1, treeView_1, instantiation_1, userDataSync_1, actions_1, contextkey_1, uri_1, editorService_1, themeService_1, date_1, dialogs_1, event_1, lifecycle_1, codicons_1, actions_2, userDataSync_2, userDataSyncMachines_1, quickInput_1, notification_1, arrays_1, userDataSyncMergesView_1, resources_1, editorCommands_1, files_1, environment_1, uriIdentity_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncDataViews = void 0;
    let UserDataSyncDataViews = class UserDataSyncDataViews extends lifecycle_1.Disposable {
        constructor(container, instantiationService, userDataSyncEnablementService, userDataSyncMachinesService, userDataSyncService) {
            super();
            this.instantiationService = instantiationService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.userDataSyncMachinesService = userDataSyncMachinesService;
            this.userDataSyncService = userDataSyncService;
            this.registerViews(container);
        }
        registerViews(container) {
            this.registerMergesView(container);
            this.registerActivityView(container, true);
            this.registerMachinesView(container);
            this.registerActivityView(container, false);
            this.registerTroubleShootView(container);
        }
        registerMergesView(container) {
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            const viewName = (0, nls_1.localize)('merges', "Merges");
            viewsRegistry.registerViews([{
                    id: userDataSync_2.SYNC_MERGES_VIEW_ID,
                    name: viewName,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(userDataSyncMergesView_1.UserDataSyncMergesViewPane),
                    when: userDataSync_2.CONTEXT_ENABLE_SYNC_MERGES_VIEW,
                    canToggleVisibility: false,
                    canMoveView: false,
                    treeView: this.instantiationService.createInstance(treeView_1.TreeView, userDataSync_2.SYNC_MERGES_VIEW_ID, viewName),
                    collapsed: false,
                    order: 100,
                }], container);
        }
        registerMachinesView(container) {
            const id = `workbench.views.sync.machines`;
            const name = (0, nls_1.localize)('synced machines', "Synced Machines");
            const treeView = this.instantiationService.createInstance(treeView_1.TreeView, id, name);
            const dataProvider = this.instantiationService.createInstance(UserDataSyncMachinesViewDataProvider, treeView);
            treeView.showRefreshAction = true;
            treeView.canSelectMany = true;
            const disposable = treeView.onDidChangeVisibility(visible => {
                if (visible && !treeView.dataProvider) {
                    disposable.dispose();
                    treeView.dataProvider = dataProvider;
                }
            });
            this._register(event_1.Event.any(this.userDataSyncMachinesService.onDidChange, this.userDataSyncService.onDidResetRemote)(() => treeView.refresh()));
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            viewsRegistry.registerViews([{
                    id,
                    name,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane),
                    when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* AccountStatus.Available */), userDataSync_2.CONTEXT_ENABLE_ACTIVITY_VIEWS),
                    canToggleVisibility: true,
                    canMoveView: false,
                    treeView,
                    collapsed: false,
                    order: 300,
                }], container);
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.editMachineName`,
                        title: (0, nls_1.localize)('workbench.actions.sync.editMachineName', "Edit Name"),
                        icon: codicons_1.Codicon.edit,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', id)),
                            group: 'inline',
                        },
                    });
                }
                async run(accessor, handle) {
                    const changed = await dataProvider.rename(handle.$treeItemHandle);
                    if (changed) {
                        await treeView.refresh();
                    }
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.turnOffSyncOnMachine`,
                        title: (0, nls_1.localize)('workbench.actions.sync.turnOffSyncOnMachine', "Turn off Settings Sync"),
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', id), contextkey_1.ContextKeyExpr.equals('viewItem', 'sync-machine')),
                        },
                    });
                }
                async run(accessor, handle, selected) {
                    if (await dataProvider.disable((selected || [handle]).map(handle => handle.$treeItemHandle))) {
                        await treeView.refresh();
                    }
                }
            });
        }
        registerActivityView(container, remote) {
            const id = `workbench.views.sync.${remote ? 'remote' : 'local'}Activity`;
            const name = remote ? (0, nls_1.localize)('remote sync activity title', "Sync Activity (Remote)") : (0, nls_1.localize)('local sync activity title', "Sync Activity (Local)");
            const treeView = this.instantiationService.createInstance(treeView_1.TreeView, id, name);
            treeView.showCollapseAllAction = true;
            treeView.showRefreshAction = true;
            const disposable = treeView.onDidChangeVisibility(visible => {
                if (visible && !treeView.dataProvider) {
                    disposable.dispose();
                    treeView.dataProvider = remote ? this.instantiationService.createInstance(RemoteUserDataSyncActivityViewDataProvider)
                        : this.instantiationService.createInstance(LocalUserDataSyncActivityViewDataProvider);
                }
            });
            this._register(event_1.Event.any(this.userDataSyncEnablementService.onDidChangeResourceEnablement, this.userDataSyncEnablementService.onDidChangeEnablement, this.userDataSyncService.onDidResetLocal, this.userDataSyncService.onDidResetRemote)(() => treeView.refresh()));
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            viewsRegistry.registerViews([{
                    id,
                    name,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane),
                    when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* AccountStatus.Available */), userDataSync_2.CONTEXT_ENABLE_ACTIVITY_VIEWS),
                    canToggleVisibility: true,
                    canMoveView: false,
                    treeView,
                    collapsed: false,
                    order: remote ? 200 : 400,
                    hideByDefault: !remote,
                }], container);
            this.registerDataViewActions(id);
        }
        registerDataViewActions(viewId) {
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.resolveResource`,
                        title: (0, nls_1.localize)('workbench.actions.sync.resolveResourceRef', "Show raw JSON sync data"),
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewId), contextkey_1.ContextKeyExpr.regex('viewItem', /sync-resource-.*/i))
                        },
                    });
                }
                async run(accessor, handle) {
                    const { resource } = JSON.parse(handle.$treeItemHandle);
                    const editorService = accessor.get(editorService_1.IEditorService);
                    await editorService.openEditor({ resource: uri_1.URI.parse(resource), options: { pinned: true } });
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.compareWithLocal`,
                        title: (0, nls_1.localize)('workbench.actions.sync.compareWithLocal', "Compare with Local"),
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewId), contextkey_1.ContextKeyExpr.regex('viewItem', /sync-associatedResource-.*/i))
                        },
                    });
                }
                async run(accessor, handle) {
                    const commandService = accessor.get(commands_1.ICommandService);
                    const { resource, comparableResource } = JSON.parse(handle.$treeItemHandle);
                    const remoteResource = uri_1.URI.parse(resource);
                    const localResource = uri_1.URI.parse(comparableResource);
                    return commandService.executeCommand(editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID, remoteResource, localResource, (0, nls_1.localize)('remoteToLocalDiff', "{0} ↔ {1}", (0, nls_1.localize)({ key: 'leftResourceName', comment: ['remote as in file in cloud'] }, "{0} (Remote)", (0, resources_1.basename)(remoteResource)), (0, nls_1.localize)({ key: 'rightResourceName', comment: ['local as in file in disk'] }, "{0} (Local)", (0, resources_1.basename)(localResource))), undefined);
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.replaceCurrent`,
                        title: (0, nls_1.localize)('workbench.actions.sync.replaceCurrent', "Restore"),
                        icon: codicons_1.Codicon.discard,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewId), contextkey_1.ContextKeyExpr.regex('viewItem', /sync-resource-.*/i)),
                            group: 'inline',
                        },
                    });
                }
                async run(accessor, handle) {
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    const userDataSyncService = accessor.get(userDataSync_1.IUserDataSyncService);
                    const { resource, syncResource } = JSON.parse(handle.$treeItemHandle);
                    const result = await dialogService.confirm({
                        message: (0, nls_1.localize)({ key: 'confirm replace', comment: ['A confirmation message to replace current user data (settings, extensions, keybindings, snippets) with selected version'] }, "Would you like to replace your current {0} with selected?", (0, userDataSync_2.getSyncAreaLabel)(syncResource)),
                        type: 'info',
                        title: userDataSync_2.SYNC_TITLE
                    });
                    if (result.confirmed) {
                        return userDataSyncService.replace(uri_1.URI.parse(resource));
                    }
                }
            });
        }
        registerTroubleShootView(container) {
            const id = `workbench.views.sync.troubleshoot`;
            const name = (0, nls_1.localize)('troubleshoot', "Troubleshoot");
            const treeView = this.instantiationService.createInstance(treeView_1.TreeView, id, name);
            const dataProvider = this.instantiationService.createInstance(UserDataSyncTroubleshootViewDataProvider);
            treeView.showRefreshAction = true;
            const disposable = treeView.onDidChangeVisibility(visible => {
                if (visible && !treeView.dataProvider) {
                    disposable.dispose();
                    treeView.dataProvider = dataProvider;
                }
            });
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            viewsRegistry.registerViews([{
                    id,
                    name,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane),
                    when: userDataSync_2.CONTEXT_ENABLE_ACTIVITY_VIEWS,
                    canToggleVisibility: true,
                    canMoveView: false,
                    treeView,
                    collapsed: false,
                    order: 500,
                    hideByDefault: true
                }], container);
        }
    };
    UserDataSyncDataViews = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, userDataSync_1.IUserDataSyncEnablementService),
        __param(3, userDataSyncMachines_1.IUserDataSyncMachinesService),
        __param(4, userDataSync_1.IUserDataSyncService)
    ], UserDataSyncDataViews);
    exports.UserDataSyncDataViews = UserDataSyncDataViews;
    let UserDataSyncActivityViewDataProvider = class UserDataSyncActivityViewDataProvider {
        constructor(userDataSyncService, userDataAutoSyncService, userDataSyncWorkbenchService, notificationService) {
            this.userDataSyncService = userDataSyncService;
            this.userDataAutoSyncService = userDataAutoSyncService;
            this.userDataSyncWorkbenchService = userDataSyncWorkbenchService;
            this.notificationService = notificationService;
        }
        async getChildren(element) {
            try {
                if (!element) {
                    return await this.getRoots();
                }
                if (element.syncResourceHandle) {
                    return await this.getChildrenForSyncResourceTreeItem(element);
                }
                return [];
            }
            catch (error) {
                if (!(error instanceof userDataSync_1.UserDataSyncError)) {
                    error = userDataSync_1.UserDataSyncError.toUserDataSyncError(error);
                }
                if (error instanceof userDataSync_1.UserDataSyncError && error.code === "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */) {
                    this.notificationService.notify({
                        severity: notification_1.Severity.Error,
                        message: error.message,
                        actions: {
                            primary: [
                                new actions_2.Action('reset', (0, nls_1.localize)('reset', "Reset Synced Data"), undefined, true, () => this.userDataSyncWorkbenchService.resetSyncedData()),
                            ]
                        }
                    });
                }
                else {
                    this.notificationService.error(error);
                }
                throw error;
            }
        }
        async getRoots() {
            this.syncResourceHandlesPromise = undefined;
            const syncResourceHandles = await this.getSyncResourceHandles();
            return syncResourceHandles.map(syncResourceHandle => {
                const handle = JSON.stringify({ resource: syncResourceHandle.uri.toString(), syncResource: syncResourceHandle.syncResource });
                return {
                    handle,
                    collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                    label: { label: (0, userDataSync_2.getSyncAreaLabel)(syncResourceHandle.syncResource) },
                    description: (0, date_1.fromNow)(syncResourceHandle.created, true),
                    themeIcon: themeService_1.FolderThemeIcon,
                    syncResourceHandle,
                    contextValue: `sync-resource-${syncResourceHandle.syncResource}`
                };
            });
        }
        async getChildrenForSyncResourceTreeItem(element) {
            const syncResourceHandle = element.syncResourceHandle;
            const associatedResources = await this.userDataSyncService.getAssociatedResources(syncResourceHandle.syncResource, syncResourceHandle);
            const previousAssociatedResources = syncResourceHandle.previous ? await this.userDataSyncService.getAssociatedResources(syncResourceHandle.syncResource, syncResourceHandle.previous) : [];
            return associatedResources.map(({ resource, comparableResource }) => {
                var _a;
                const handle = JSON.stringify({ resource: resource.toString(), comparableResource: comparableResource.toString() });
                const previousResource = (_a = previousAssociatedResources.find(previous => (0, resources_1.basename)(previous.resource) === (0, resources_1.basename)(resource))) === null || _a === void 0 ? void 0 : _a.resource;
                return {
                    handle,
                    collapsibleState: views_1.TreeItemCollapsibleState.None,
                    resourceUri: resource,
                    command: previousResource ? {
                        id: editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID,
                        title: '',
                        arguments: [
                            previousResource,
                            resource,
                            (0, nls_1.localize)('sideBySideLabels', "{0} ↔ {1}", `${(0, resources_1.basename)(resource)} (${(0, date_1.fromNow)(syncResourceHandle.previous.created, true)})`, `${(0, resources_1.basename)(resource)} (${(0, date_1.fromNow)(syncResourceHandle.created, true)})`),
                            undefined
                        ]
                    } : {
                        id: editorCommands_1.API_OPEN_EDITOR_COMMAND_ID,
                        title: '',
                        arguments: [resource, undefined, undefined]
                    },
                    contextValue: `sync-associatedResource-${syncResourceHandle.syncResource}`
                };
            });
        }
        getSyncResourceHandles() {
            if (this.syncResourceHandlesPromise === undefined) {
                this.syncResourceHandlesPromise = Promise.all(userDataSync_1.ALL_SYNC_RESOURCES.map(async (syncResource) => {
                    const resourceHandles = await this.getResourceHandles(syncResource);
                    resourceHandles.sort((a, b) => b.created - a.created);
                    return resourceHandles.map((resourceHandle, index) => (Object.assign(Object.assign({}, resourceHandle), { syncResource, previous: resourceHandles[index + 1] })));
                })).then(result => (0, arrays_1.flatten)(result).sort((a, b) => b.created - a.created));
            }
            return this.syncResourceHandlesPromise;
        }
    };
    UserDataSyncActivityViewDataProvider = __decorate([
        __param(0, userDataSync_1.IUserDataSyncService),
        __param(1, userDataSync_1.IUserDataAutoSyncService),
        __param(2, userDataSync_2.IUserDataSyncWorkbenchService),
        __param(3, notification_1.INotificationService)
    ], UserDataSyncActivityViewDataProvider);
    class LocalUserDataSyncActivityViewDataProvider extends UserDataSyncActivityViewDataProvider {
        getResourceHandles(syncResource) {
            return this.userDataSyncService.getLocalSyncResourceHandles(syncResource);
        }
    }
    let RemoteUserDataSyncActivityViewDataProvider = class RemoteUserDataSyncActivityViewDataProvider extends UserDataSyncActivityViewDataProvider {
        constructor(userDataSyncService, userDataAutoSyncService, userDataSyncMachinesService, userDataSyncWorkbenchService, notificationService) {
            super(userDataSyncService, userDataAutoSyncService, userDataSyncWorkbenchService, notificationService);
            this.userDataSyncMachinesService = userDataSyncMachinesService;
        }
        async getChildren(element) {
            if (!element) {
                this.machinesPromise = undefined;
            }
            return super.getChildren(element);
        }
        getMachines() {
            if (this.machinesPromise === undefined) {
                this.machinesPromise = this.userDataSyncMachinesService.getMachines();
            }
            return this.machinesPromise;
        }
        getResourceHandles(syncResource) {
            return this.userDataSyncService.getRemoteSyncResourceHandles(syncResource);
        }
        async getChildrenForSyncResourceTreeItem(element) {
            const children = await super.getChildrenForSyncResourceTreeItem(element);
            if (children.length) {
                const machineId = await this.userDataSyncService.getMachineId(element.syncResourceHandle.syncResource, element.syncResourceHandle);
                if (machineId) {
                    const machines = await this.getMachines();
                    const machine = machines.find(({ id }) => id === machineId);
                    children[0].description = (machine === null || machine === void 0 ? void 0 : machine.isCurrent) ? (0, nls_1.localize)({ key: 'current', comment: ['Represents current machine'] }, "Current") : machine === null || machine === void 0 ? void 0 : machine.name;
                }
            }
            return children;
        }
    };
    RemoteUserDataSyncActivityViewDataProvider = __decorate([
        __param(0, userDataSync_1.IUserDataSyncService),
        __param(1, userDataSync_1.IUserDataAutoSyncService),
        __param(2, userDataSyncMachines_1.IUserDataSyncMachinesService),
        __param(3, userDataSync_2.IUserDataSyncWorkbenchService),
        __param(4, notification_1.INotificationService)
    ], RemoteUserDataSyncActivityViewDataProvider);
    let UserDataSyncMachinesViewDataProvider = class UserDataSyncMachinesViewDataProvider {
        constructor(treeView, userDataSyncMachinesService, quickInputService, notificationService, dialogService, userDataSyncWorkbenchService) {
            this.treeView = treeView;
            this.userDataSyncMachinesService = userDataSyncMachinesService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.userDataSyncWorkbenchService = userDataSyncWorkbenchService;
        }
        async getChildren(element) {
            if (!element) {
                this.machinesPromise = undefined;
            }
            try {
                let machines = await this.getMachines();
                machines = machines.filter(m => !m.disabled).sort((m1, m2) => m1.isCurrent ? -1 : 1);
                this.treeView.message = machines.length ? undefined : (0, nls_1.localize)('no machines', "No Machines");
                return machines.map(({ id, name, isCurrent, platform }) => ({
                    handle: id,
                    collapsibleState: views_1.TreeItemCollapsibleState.None,
                    label: { label: name },
                    description: isCurrent ? (0, nls_1.localize)({ key: 'current', comment: ['Current machine'] }, "Current") : undefined,
                    themeIcon: platform && (0, userDataSyncMachines_1.isWebPlatform)(platform) ? codicons_1.Codicon.globe : codicons_1.Codicon.vm,
                    contextValue: 'sync-machine'
                }));
            }
            catch (error) {
                this.notificationService.error(error);
                return [];
            }
        }
        getMachines() {
            if (this.machinesPromise === undefined) {
                this.machinesPromise = this.userDataSyncMachinesService.getMachines();
            }
            return this.machinesPromise;
        }
        async disable(machineIds) {
            const machines = await this.getMachines();
            const machinesToDisable = machines.filter(({ id }) => machineIds.includes(id));
            if (!machinesToDisable.length) {
                throw new Error((0, nls_1.localize)('not found', "machine not found with id: {0}", machineIds.join(',')));
            }
            const result = await this.dialogService.confirm({
                type: 'info',
                message: machinesToDisable.length > 1 ? (0, nls_1.localize)('turn off sync on multiple machines', "Are you sure you want to turn off sync on selected machines?")
                    : (0, nls_1.localize)('turn off sync on machine', "Are you sure you want to turn off sync on {0}?", machinesToDisable[0].name),
                primaryButton: (0, nls_1.localize)({ key: 'turn off', comment: ['&& denotes a mnemonic'] }, "&&Turn off"),
            });
            if (!result.confirmed) {
                return false;
            }
            if (machinesToDisable.some(machine => machine.isCurrent)) {
                await this.userDataSyncWorkbenchService.turnoff(false);
            }
            const otherMachinesToDisable = machinesToDisable.filter(machine => !machine.isCurrent)
                .map(machine => ([machine.id, false]));
            if (otherMachinesToDisable.length) {
                await this.userDataSyncMachinesService.setEnablements(otherMachinesToDisable);
            }
            return true;
        }
        async rename(machineId) {
            const disposableStore = new lifecycle_1.DisposableStore();
            const inputBox = disposableStore.add(this.quickInputService.createInputBox());
            inputBox.placeholder = (0, nls_1.localize)('placeholder', "Enter the name of the machine");
            inputBox.busy = true;
            inputBox.show();
            const machines = await this.getMachines();
            const machine = machines.find(({ id }) => id === machineId);
            if (!machine) {
                inputBox.hide();
                disposableStore.dispose();
                throw new Error((0, nls_1.localize)('not found', "machine not found with id: {0}", machineId));
            }
            inputBox.busy = false;
            inputBox.value = machine.name;
            const validateMachineName = (machineName) => {
                machineName = machineName.trim();
                return machineName && !machines.some(m => m.id !== machineId && m.name === machineName) ? machineName : null;
            };
            disposableStore.add(inputBox.onDidChangeValue(() => inputBox.validationMessage = validateMachineName(inputBox.value) ? '' : (0, nls_1.localize)('valid message', "Machine name should be unique and not empty")));
            return new Promise((c, e) => {
                disposableStore.add(inputBox.onDidAccept(async () => {
                    const machineName = validateMachineName(inputBox.value);
                    disposableStore.dispose();
                    if (machineName && machineName !== machine.name) {
                        try {
                            await this.userDataSyncMachinesService.renameMachine(machineId, machineName);
                            c(true);
                        }
                        catch (error) {
                            e(error);
                        }
                    }
                    else {
                        c(false);
                    }
                }));
            });
        }
    };
    UserDataSyncMachinesViewDataProvider = __decorate([
        __param(1, userDataSyncMachines_1.IUserDataSyncMachinesService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, notification_1.INotificationService),
        __param(4, dialogs_1.IDialogService),
        __param(5, userDataSync_2.IUserDataSyncWorkbenchService)
    ], UserDataSyncMachinesViewDataProvider);
    let UserDataSyncTroubleshootViewDataProvider = class UserDataSyncTroubleshootViewDataProvider {
        constructor(fileService, environmentService, uriIdentityService) {
            this.fileService = fileService;
            this.environmentService = environmentService;
            this.uriIdentityService = uriIdentityService;
        }
        async getChildren(element) {
            if (!element) {
                return [{
                        handle: 'SYNC_LOGS',
                        collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                        label: { label: (0, nls_1.localize)('sync logs', "Logs") },
                        themeIcon: codicons_1.Codicon.folder,
                    }, {
                        handle: 'LAST_SYNC_STATES',
                        collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                        label: { label: (0, nls_1.localize)('last sync states', "Last Synced Remotes") },
                        themeIcon: codicons_1.Codicon.folder,
                    }];
            }
            if (element.handle === 'LAST_SYNC_STATES') {
                return this.getLastSyncStates();
            }
            if (element.handle === 'SYNC_LOGS') {
                return this.getSyncLogs();
            }
            return [];
        }
        async getLastSyncStates() {
            const result = [];
            for (const syncResource of userDataSync_1.ALL_SYNC_RESOURCES) {
                const resource = (0, userDataSync_1.getLastSyncResourceUri)(syncResource, this.environmentService, this.uriIdentityService.extUri);
                if (await this.fileService.exists(resource)) {
                    result.push({
                        handle: resource.toString(),
                        label: { label: (0, userDataSync_2.getSyncAreaLabel)(syncResource) },
                        collapsibleState: views_1.TreeItemCollapsibleState.None,
                        resourceUri: resource,
                        command: { id: editorCommands_1.API_OPEN_EDITOR_COMMAND_ID, title: '', arguments: [resource, undefined, undefined] },
                    });
                }
            }
            return result;
        }
        async getSyncLogs() {
            const logsFolders = [];
            const stat = await this.fileService.resolve(this.uriIdentityService.extUri.dirname(this.uriIdentityService.extUri.dirname(this.environmentService.userDataSyncLogResource)));
            if (stat.children) {
                logsFolders.push(...stat.children
                    .filter(stat => stat.isDirectory && /^\d{8}T\d{6}$/.test(stat.name))
                    .sort()
                    .reverse()
                    .map(d => d.resource));
            }
            const result = [];
            for (const logFolder of logsFolders) {
                const syncLogResource = this.uriIdentityService.extUri.joinPath(logFolder, this.uriIdentityService.extUri.basename(this.environmentService.userDataSyncLogResource));
                if (await this.fileService.exists(syncLogResource)) {
                    result.push({
                        handle: syncLogResource.toString(),
                        collapsibleState: views_1.TreeItemCollapsibleState.None,
                        resourceUri: syncLogResource,
                        label: { label: this.uriIdentityService.extUri.basename(logFolder) },
                        description: this.uriIdentityService.extUri.isEqual(syncLogResource, this.environmentService.userDataSyncLogResource) ? (0, nls_1.localize)({ key: 'current', comment: ['Represents current log file'] }, "Current") : undefined,
                        command: { id: editorCommands_1.API_OPEN_EDITOR_COMMAND_ID, title: '', arguments: [syncLogResource, undefined, undefined] },
                    });
                }
            }
            return result;
        }
    };
    UserDataSyncTroubleshootViewDataProvider = __decorate([
        __param(0, files_1.IFileService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, uriIdentity_1.IUriIdentityService)
    ], UserDataSyncTroubleshootViewDataProvider);
});
//# sourceMappingURL=userDataSyncViews.js.map