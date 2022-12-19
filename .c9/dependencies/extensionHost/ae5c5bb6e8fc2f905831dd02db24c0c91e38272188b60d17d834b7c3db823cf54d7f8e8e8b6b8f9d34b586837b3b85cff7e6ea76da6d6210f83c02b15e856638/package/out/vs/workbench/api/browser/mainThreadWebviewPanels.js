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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/telemetry/common/telemetry", "vs/workbench/api/browser/mainThreadWebviews", "vs/workbench/api/common/extHost.protocol", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/contrib/webviewPanel/browser/webviewEditorInput", "vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions"], function (require, exports, errors_1, lifecycle_1, uri_1, configuration_1, telemetry_1, mainThreadWebviews_1, extHostProtocol, diffEditorInput_1, webviewEditorInput_1, webviewWorkbenchService_1, editorGroupColumn_1, editorGroupsService_1, editorService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadWebviewPanels = void 0;
    /**
     * Bi-directional map between webview handles and inputs.
     */
    class WebviewInputStore {
        constructor() {
            this._handlesToInputs = new Map();
            this._inputsToHandles = new Map();
        }
        add(handle, input) {
            this._handlesToInputs.set(handle, input);
            this._inputsToHandles.set(input, handle);
        }
        getHandleForInput(input) {
            return this._inputsToHandles.get(input);
        }
        getInputForHandle(handle) {
            return this._handlesToInputs.get(handle);
        }
        delete(handle) {
            const input = this.getInputForHandle(handle);
            this._handlesToInputs.delete(handle);
            if (input) {
                this._inputsToHandles.delete(input);
            }
        }
        get size() {
            return this._handlesToInputs.size;
        }
        [Symbol.iterator]() {
            return this._handlesToInputs.values();
        }
    }
    class WebviewViewTypeTransformer {
        constructor(prefix) {
            this.prefix = prefix;
        }
        fromExternal(viewType) {
            return this.prefix + viewType;
        }
        toExternal(viewType) {
            return viewType.startsWith(this.prefix)
                ? viewType.substr(this.prefix.length)
                : undefined;
        }
    }
    let MainThreadWebviewPanels = class MainThreadWebviewPanels extends lifecycle_1.Disposable {
        constructor(context, _mainThreadWebviews, _configurationService, _editorGroupService, _editorService, extensionService, _telemetryService, _webviewWorkbenchService) {
            super();
            this._mainThreadWebviews = _mainThreadWebviews;
            this._configurationService = _configurationService;
            this._editorGroupService = _editorGroupService;
            this._editorService = _editorService;
            this._telemetryService = _telemetryService;
            this._webviewWorkbenchService = _webviewWorkbenchService;
            this.webviewPanelViewType = new WebviewViewTypeTransformer('mainThreadWebview-');
            this._webviewInputs = new WebviewInputStore();
            this._editorProviders = new Map();
            this._revivers = new Map();
            this._proxy = context.getProxy(extHostProtocol.ExtHostContext.ExtHostWebviewPanels);
            this._register(_editorService.onDidActiveEditorChange(() => {
                this.updateWebviewViewStates(this._editorService.activeEditor);
            }));
            this._register(_editorService.onDidVisibleEditorsChange(() => {
                this.updateWebviewViewStates(this._editorService.activeEditor);
            }));
            this._register(_webviewWorkbenchService.onDidChangeActiveWebviewEditor(input => {
                this.updateWebviewViewStates(input);
            }));
            // This reviver's only job is to activate extensions.
            // This should trigger the real reviver to be registered from the extension host side.
            this._register(_webviewWorkbenchService.registerResolver({
                canResolve: (webview) => {
                    const viewType = this.webviewPanelViewType.toExternal(webview.viewType);
                    if (typeof viewType === 'string') {
                        extensionService.activateByEvent(`onWebviewPanel:${viewType}`);
                    }
                    return false;
                },
                resolveWebview: () => { throw new Error('not implemented'); }
            }));
        }
        dispose() {
            super.dispose();
            (0, lifecycle_1.dispose)(this._editorProviders.values());
            this._editorProviders.clear();
            (0, lifecycle_1.dispose)(this._revivers.values());
            this._revivers.clear();
        }
        get webviewInputs() { return this._webviewInputs; }
        addWebviewInput(handle, input, options) {
            this._webviewInputs.add(handle, input);
            this._mainThreadWebviews.addWebview(handle, input.webview, options);
            input.webview.onDidDispose(() => {
                this._proxy.$onDidDisposeWebviewPanel(handle).finally(() => {
                    this._webviewInputs.delete(handle);
                });
            });
        }
        $createWebviewPanel(extensionData, handle, viewType, initData, showOptions) {
            const targetGroup = this.getTargetGroupFromShowOptions(showOptions);
            const mainThreadShowOptions = showOptions ? {
                preserveFocus: !!showOptions.preserveFocus,
                group: targetGroup
            } : {};
            const extension = (0, mainThreadWebviews_1.reviveWebviewExtension)(extensionData);
            const webview = this._webviewWorkbenchService.createWebview(handle, this.webviewPanelViewType.fromExternal(viewType), initData.title, mainThreadShowOptions, reviveWebviewOptions(initData.panelOptions), (0, mainThreadWebviews_1.reviveWebviewContentOptions)(initData.webviewOptions), extension);
            this.addWebviewInput(handle, webview, { serializeBuffersForPostMessage: initData.serializeBuffersForPostMessage });
            const payload = {
                extensionId: extension.id.value,
                viewType
            };
            this._telemetryService.publicLog2('webviews:createWebviewPanel', payload);
        }
        $disposeWebview(handle) {
            const webview = this.getWebviewInput(handle);
            webview.dispose();
        }
        $setTitle(handle, value) {
            const webview = this.getWebviewInput(handle);
            webview.setName(value);
        }
        $setIconPath(handle, value) {
            const webview = this.getWebviewInput(handle);
            webview.iconPath = reviveWebviewIcon(value);
        }
        $reveal(handle, showOptions) {
            const webview = this.getWebviewInput(handle);
            if (webview.isDisposed()) {
                return;
            }
            const targetGroup = this.getTargetGroupFromShowOptions(showOptions);
            this._webviewWorkbenchService.revealWebview(webview, targetGroup, !!showOptions.preserveFocus);
        }
        getTargetGroupFromShowOptions(showOptions) {
            if (typeof showOptions.viewColumn === 'undefined'
                || showOptions.viewColumn === editorService_1.ACTIVE_GROUP
                || (this._editorGroupService.count === 1 && this._editorGroupService.activeGroup.isEmpty)) {
                return editorService_1.ACTIVE_GROUP;
            }
            if (showOptions.viewColumn === editorService_1.SIDE_GROUP) {
                return editorService_1.SIDE_GROUP;
            }
            if (showOptions.viewColumn >= 0) {
                // First check to see if an existing group exists
                const groupInColumn = this._editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)[showOptions.viewColumn];
                if (groupInColumn) {
                    return groupInColumn.id;
                }
                // We are dealing with an unknown group and therefore need a new group.
                // Note that the new group's id may not match the one requested. We only allow
                // creating a single new group, so if someone passes in `showOptions.viewColumn = 99`
                // and there are two editor groups open, we simply create a third editor group instead
                // of creating all the groups up to 99.
                const newGroup = this._editorGroupService.findGroup({ location: 1 /* GroupLocation.LAST */ });
                if (newGroup) {
                    const direction = (0, editorGroupsService_1.preferredSideBySideGroupDirection)(this._configurationService);
                    return this._editorGroupService.addGroup(newGroup, direction);
                }
            }
            return editorService_1.ACTIVE_GROUP;
        }
        $registerSerializer(viewType, options) {
            if (this._revivers.has(viewType)) {
                throw new Error(`Reviver for ${viewType} already registered`);
            }
            this._revivers.set(viewType, this._webviewWorkbenchService.registerResolver({
                canResolve: (webviewInput) => {
                    return webviewInput.viewType === this.webviewPanelViewType.fromExternal(viewType);
                },
                resolveWebview: async (webviewInput) => {
                    const viewType = this.webviewPanelViewType.toExternal(webviewInput.viewType);
                    if (!viewType) {
                        webviewInput.webview.html = this._mainThreadWebviews.getWebviewResolvedFailedContent(webviewInput.viewType);
                        return;
                    }
                    const handle = webviewInput.id;
                    this.addWebviewInput(handle, webviewInput, options);
                    let state = undefined;
                    if (webviewInput.webview.state) {
                        try {
                            state = JSON.parse(webviewInput.webview.state);
                        }
                        catch (e) {
                            console.error('Could not load webview state', e, webviewInput.webview.state);
                        }
                    }
                    try {
                        await this._proxy.$deserializeWebviewPanel(handle, viewType, {
                            title: webviewInput.getTitle(),
                            state,
                            panelOptions: webviewInput.webview.options,
                            webviewOptions: webviewInput.webview.contentOptions,
                            active: webviewInput === this._editorService.activeEditor,
                        }, (0, editorGroupColumn_1.editorGroupToColumn)(this._editorGroupService, webviewInput.group || 0));
                    }
                    catch (error) {
                        (0, errors_1.onUnexpectedError)(error);
                        webviewInput.webview.html = this._mainThreadWebviews.getWebviewResolvedFailedContent(viewType);
                    }
                }
            }));
        }
        $unregisterSerializer(viewType) {
            const reviver = this._revivers.get(viewType);
            if (!reviver) {
                throw new Error(`No reviver for ${viewType} registered`);
            }
            reviver.dispose();
            this._revivers.delete(viewType);
        }
        updateWebviewViewStates(activeEditorInput) {
            if (!this._webviewInputs.size) {
                return;
            }
            const viewStates = {};
            const updateViewStatesForInput = (group, topLevelInput, editorInput) => {
                if (!(editorInput instanceof webviewEditorInput_1.WebviewInput)) {
                    return;
                }
                editorInput.updateGroup(group.id);
                const handle = this._webviewInputs.getHandleForInput(editorInput);
                if (handle) {
                    viewStates[handle] = {
                        visible: topLevelInput === group.activeEditor,
                        active: editorInput === activeEditorInput,
                        position: (0, editorGroupColumn_1.editorGroupToColumn)(this._editorGroupService, group.id),
                    };
                }
            };
            for (const group of this._editorGroupService.groups) {
                for (const input of group.editors) {
                    if (input instanceof diffEditorInput_1.DiffEditorInput) {
                        updateViewStatesForInput(group, input, input.primary);
                        updateViewStatesForInput(group, input, input.secondary);
                    }
                    else {
                        updateViewStatesForInput(group, input, input);
                    }
                }
            }
            if (Object.keys(viewStates).length) {
                this._proxy.$onDidChangeWebviewPanelViewStates(viewStates);
            }
        }
        getWebviewInput(handle) {
            const webview = this.tryGetWebviewInput(handle);
            if (!webview) {
                throw new Error(`Unknown webview handle:${handle}`);
            }
            return webview;
        }
        tryGetWebviewInput(handle) {
            return this._webviewInputs.getInputForHandle(handle);
        }
    };
    MainThreadWebviewPanels = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, editorService_1.IEditorService),
        __param(5, extensions_1.IExtensionService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, webviewWorkbenchService_1.IWebviewWorkbenchService)
    ], MainThreadWebviewPanels);
    exports.MainThreadWebviewPanels = MainThreadWebviewPanels;
    function reviveWebviewIcon(value) {
        if (!value) {
            return undefined;
        }
        return {
            light: uri_1.URI.revive(value.light),
            dark: uri_1.URI.revive(value.dark),
        };
    }
    function reviveWebviewOptions(panelOptions) {
        return {
            enableFindWidget: panelOptions.enableFindWidget,
            retainContextWhenHidden: panelOptions.retainContextWhenHidden,
        };
    }
});
//# sourceMappingURL=mainThreadWebviewPanels.js.map