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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/contextkey/common/contextkey", "vs/platform/editor/common/editor", "vs/platform/instantiation/common/instantiation", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalEditor", "vs/workbench/contrib/terminal/browser/terminalEditorInput", "vs/workbench/contrib/terminal/browser/terminalUri", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/lifecycle/common/lifecycle"], function (require, exports, event_1, lifecycle_1, uri_1, contextkey_1, editor_1, instantiation_1, terminal_1, terminal_2, terminalEditor_1, terminalEditorInput_1, terminalUri_1, terminalContextKey_1, editorGroupsService_1, editorService_1, environmentService_1, lifecycle_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalEditorService = void 0;
    let TerminalEditorService = class TerminalEditorService extends lifecycle_1.Disposable {
        constructor(_editorService, _editorGroupsService, _terminalInstanceService, _instantiationService, lifecycleService, _environmentService, contextKeyService) {
            super();
            this._editorService = _editorService;
            this._editorGroupsService = _editorGroupsService;
            this._terminalInstanceService = _terminalInstanceService;
            this._instantiationService = _instantiationService;
            this._environmentService = _environmentService;
            this.instances = [];
            this._activeInstanceIndex = -1;
            this._isShuttingDown = false;
            this._editorInputs = new Map();
            this._instanceDisposables = new Map();
            this._onDidDisposeInstance = new event_1.Emitter();
            this.onDidDisposeInstance = this._onDidDisposeInstance.event;
            this._onDidFocusInstance = new event_1.Emitter();
            this.onDidFocusInstance = this._onDidFocusInstance.event;
            this._onDidChangeInstanceCapability = new event_1.Emitter();
            this.onDidChangeInstanceCapability = this._onDidChangeInstanceCapability.event;
            this._onDidChangeActiveInstance = new event_1.Emitter();
            this.onDidChangeActiveInstance = this._onDidChangeActiveInstance.event;
            this._onDidChangeInstances = new event_1.Emitter();
            this.onDidChangeInstances = this._onDidChangeInstances.event;
            this._terminalEditorActive = terminalContextKey_1.TerminalContextKeys.terminalEditorActive.bindTo(contextKeyService);
            this._register((0, lifecycle_1.toDisposable)(() => {
                for (const d of this._instanceDisposables.values()) {
                    (0, lifecycle_1.dispose)(d);
                }
            }));
            this._register(lifecycleService.onWillShutdown(() => this._isShuttingDown = true));
            this._register(this._editorService.onDidActiveEditorChange(() => {
                var _a;
                const activeEditor = this._editorService.activeEditor;
                const instance = activeEditor instanceof terminalEditorInput_1.TerminalEditorInput ? activeEditor === null || activeEditor === void 0 ? void 0 : activeEditor.terminalInstance : undefined;
                const terminalEditorActive = !!instance && activeEditor instanceof terminalEditorInput_1.TerminalEditorInput;
                this._terminalEditorActive.set(terminalEditorActive);
                if (terminalEditorActive) {
                    activeEditor === null || activeEditor === void 0 ? void 0 : activeEditor.setGroup((_a = this._editorService.activeEditorPane) === null || _a === void 0 ? void 0 : _a.group);
                    this._setActiveInstance(instance);
                }
            }));
            this._register(this._editorService.onDidVisibleEditorsChange(() => {
                // add any terminal editors created via the editor service split command
                const knownIds = this.instances.map(i => i.instanceId);
                const terminalEditors = this._getActiveTerminalEditors();
                const unknownEditor = terminalEditors.find(input => {
                    var _a;
                    const inputId = input instanceof terminalEditorInput_1.TerminalEditorInput ? (_a = input.terminalInstance) === null || _a === void 0 ? void 0 : _a.instanceId : undefined;
                    if (inputId === undefined) {
                        return false;
                    }
                    return !knownIds.includes(inputId);
                });
                if (unknownEditor instanceof terminalEditorInput_1.TerminalEditorInput && unknownEditor.terminalInstance) {
                    this._editorInputs.set(unknownEditor.terminalInstance.resource.path, unknownEditor);
                    this.instances.push(unknownEditor.terminalInstance);
                }
            }));
            this._register(this.onDidDisposeInstance(instance => this.detachInstance(instance)));
            // Remove the terminal from the managed instances when the editor closes. This fires when
            // dragging and dropping to another editor or closing the editor via cmd/ctrl+w.
            this._register(this._editorService.onDidCloseEditor(e => {
                const instance = e.editor instanceof terminalEditorInput_1.TerminalEditorInput ? e.editor.terminalInstance : undefined;
                if (instance) {
                    const instanceIndex = this.instances.findIndex(e => e === instance);
                    if (instanceIndex !== -1) {
                        this.instances.splice(instanceIndex, 1);
                    }
                }
            }));
        }
        _getActiveTerminalEditors() {
            return this._editorService.visibleEditors.filter(e => { var _a; return e instanceof terminalEditorInput_1.TerminalEditorInput && ((_a = e.terminalInstance) === null || _a === void 0 ? void 0 : _a.instanceId); });
        }
        _getActiveTerminalEditor() {
            return this._editorService.activeEditorPane instanceof terminalEditor_1.TerminalEditor ? this._editorService.activeEditorPane : undefined;
        }
        findPrevious() {
            const editor = this._getActiveTerminalEditor();
            editor === null || editor === void 0 ? void 0 : editor.showFindWidget();
            editor === null || editor === void 0 ? void 0 : editor.getFindWidget().find(true);
        }
        findNext() {
            const editor = this._getActiveTerminalEditor();
            editor === null || editor === void 0 ? void 0 : editor.showFindWidget();
            editor === null || editor === void 0 ? void 0 : editor.getFindWidget().find(false);
        }
        getFindState() {
            const editor = this._getActiveTerminalEditor();
            return editor.findState;
        }
        async focusFindWidget() {
            var _a;
            const instance = this.activeInstance;
            if (instance) {
                await instance.focusWhenReady(true);
            }
            (_a = this._getActiveTerminalEditor()) === null || _a === void 0 ? void 0 : _a.focusFindWidget();
        }
        hideFindWidget() {
            var _a;
            (_a = this._getActiveTerminalEditor()) === null || _a === void 0 ? void 0 : _a.hideFindWidget();
        }
        get activeInstance() {
            if (this.instances.length === 0 || this._activeInstanceIndex === -1) {
                return undefined;
            }
            return this.instances[this._activeInstanceIndex];
        }
        setActiveInstance(instance) {
            this._setActiveInstance(instance);
        }
        _setActiveInstance(instance) {
            if (instance === undefined) {
                this._activeInstanceIndex = -1;
            }
            else {
                this._activeInstanceIndex = this.instances.findIndex(e => e === instance);
            }
            this._onDidChangeActiveInstance.fire(this.activeInstance);
        }
        async openEditor(instance, editorOptions) {
            const resource = this.resolveResource(instance);
            if (resource) {
                await this._editorService.openEditor({
                    resource,
                    description: instance.description || instance.shellLaunchConfig.type,
                    options: {
                        pinned: true,
                        forceReload: true,
                        preserveFocus: editorOptions === null || editorOptions === void 0 ? void 0 : editorOptions.preserveFocus
                    }
                }, (editorOptions === null || editorOptions === void 0 ? void 0 : editorOptions.viewColumn) || editorService_1.ACTIVE_GROUP);
            }
        }
        resolveResource(instanceOrUri, isFutureSplit = false) {
            const resource = uri_1.URI.isUri(instanceOrUri) ? instanceOrUri : instanceOrUri.resource;
            const inputKey = resource.path;
            const cachedEditor = this._editorInputs.get(inputKey);
            if (cachedEditor) {
                return cachedEditor.resource;
            }
            // Terminal from a different window
            if (uri_1.URI.isUri(instanceOrUri)) {
                const terminalIdentifier = (0, terminalUri_1.parseTerminalUri)(instanceOrUri);
                if (terminalIdentifier.instanceId) {
                    const primaryBackend = this._terminalInstanceService.getBackend(this._environmentService.remoteAuthority);
                    primaryBackend === null || primaryBackend === void 0 ? void 0 : primaryBackend.requestDetachInstance(terminalIdentifier.workspaceId, terminalIdentifier.instanceId).then(attachPersistentProcess => {
                        const instance = this._terminalInstanceService.createInstance({ attachPersistentProcess }, terminal_1.TerminalLocation.Editor, resource);
                        input = this._instantiationService.createInstance(terminalEditorInput_1.TerminalEditorInput, resource, instance);
                        this._editorService.openEditor(input, {
                            pinned: true,
                            forceReload: true
                        }, input.group);
                        this._registerInstance(inputKey, input, instance);
                        return instanceOrUri;
                    });
                }
            }
            let input;
            if ('instanceId' in instanceOrUri) {
                instanceOrUri.target = terminal_1.TerminalLocation.Editor;
                input = this._instantiationService.createInstance(terminalEditorInput_1.TerminalEditorInput, resource, instanceOrUri);
                this._registerInstance(inputKey, input, instanceOrUri);
                return input.resource;
            }
            else {
                return instanceOrUri;
            }
        }
        getInputFromResource(resource) {
            const input = this._editorInputs.get(resource.path);
            if (!input) {
                throw new Error(`Could not get input from resource: ${resource.path}`);
            }
            return input;
        }
        _registerInstance(inputKey, input, instance) {
            this._editorInputs.set(inputKey, input);
            this._instanceDisposables.set(inputKey, [
                instance.onDidFocus(this._onDidFocusInstance.fire, this._onDidFocusInstance),
                instance.onDisposed(this._onDidDisposeInstance.fire, this._onDidDisposeInstance),
                instance.capabilities.onDidAddCapability(() => this._onDidChangeInstanceCapability.fire(instance)),
                instance.capabilities.onDidRemoveCapability(() => this._onDidChangeInstanceCapability.fire(instance)),
            ]);
            this.instances.push(instance);
            this._onDidChangeInstances.fire();
        }
        getInstanceFromResource(resource) {
            return (0, terminalUri_1.getInstanceFromResource)(this.instances, resource);
        }
        splitInstance(instanceToSplit, shellLaunchConfig = {}) {
            var _a;
            if (instanceToSplit.target === terminal_1.TerminalLocation.Editor) {
                // Make sure the instance to split's group is active
                const group = (_a = this._editorInputs.get(instanceToSplit.resource.path)) === null || _a === void 0 ? void 0 : _a.group;
                if (group) {
                    this._editorGroupsService.activateGroup(group);
                }
            }
            const instance = this._terminalInstanceService.createInstance(shellLaunchConfig, terminal_1.TerminalLocation.Editor);
            const resource = this.resolveResource(instance);
            if (resource) {
                this._editorService.openEditor({
                    resource: uri_1.URI.revive(resource),
                    description: instance.description,
                    options: {
                        pinned: true,
                        forceReload: true
                    }
                }, editorService_1.SIDE_GROUP);
            }
            return instance;
        }
        reviveInput(deserializedInput) {
            const resource = uri_1.URI.isUri(deserializedInput) ? deserializedInput : deserializedInput.resource;
            const inputKey = resource.path;
            if ('pid' in deserializedInput) {
                const instance = this._terminalInstanceService.createInstance({ attachPersistentProcess: deserializedInput }, terminal_1.TerminalLocation.Editor);
                instance.target = terminal_1.TerminalLocation.Editor;
                const input = this._instantiationService.createInstance(terminalEditorInput_1.TerminalEditorInput, resource, instance);
                this._registerInstance(inputKey, input, instance);
                return input;
            }
            else {
                throw new Error(`Could not revive terminal editor input, ${deserializedInput}`);
            }
        }
        detachActiveEditorInstance() {
            const activeEditor = this._editorService.activeEditor;
            if (!(activeEditor instanceof terminalEditorInput_1.TerminalEditorInput)) {
                // should never happen now with the terminalEditorActive context key
                throw new Error('Active editor is not a terminal');
            }
            const instance = activeEditor.terminalInstance;
            if (!instance) {
                throw new Error('Terminal is already detached');
            }
            this.detachInstance(instance);
            return instance;
        }
        detachInstance(instance) {
            const inputKey = instance.resource.path;
            const editorInput = this._editorInputs.get(inputKey);
            editorInput === null || editorInput === void 0 ? void 0 : editorInput.detachInstance();
            this._editorInputs.delete(inputKey);
            const instanceIndex = this.instances.findIndex(e => e === instance);
            if (instanceIndex !== -1) {
                this.instances.splice(instanceIndex, 1);
            }
            // Don't dispose the input when shutting down to avoid layouts in the editor area
            if (!this._isShuttingDown) {
                editorInput === null || editorInput === void 0 ? void 0 : editorInput.dispose();
            }
            const disposables = this._instanceDisposables.get(inputKey);
            this._instanceDisposables.delete(inputKey);
            if (disposables) {
                (0, lifecycle_1.dispose)(disposables);
            }
            this._onDidChangeInstances.fire();
        }
        revealActiveEditor(preserveFocus) {
            const instance = this.activeInstance;
            if (!instance) {
                return;
            }
            const editorInput = this._editorInputs.get(instance.resource.path);
            this._editorService.openEditor(editorInput, {
                pinned: true,
                forceReload: true,
                preserveFocus,
                activation: editor_1.EditorActivation.PRESERVE
            }, editorInput.group);
        }
    };
    TerminalEditorService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, terminal_2.ITerminalInstanceService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, lifecycle_2.ILifecycleService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, contextkey_1.IContextKeyService)
    ], TerminalEditorService);
    exports.TerminalEditorService = TerminalEditorService;
});
//# sourceMappingURL=terminalEditorService.js.map