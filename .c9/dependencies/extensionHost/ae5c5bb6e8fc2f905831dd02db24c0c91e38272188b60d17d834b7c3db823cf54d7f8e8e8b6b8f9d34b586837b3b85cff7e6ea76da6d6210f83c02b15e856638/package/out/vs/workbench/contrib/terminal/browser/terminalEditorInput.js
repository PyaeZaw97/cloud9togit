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
define(["require", "exports", "vs/nls", "vs/base/common/severity", "vs/base/common/lifecycle", "vs/platform/theme/common/themeService", "vs/workbench/common/editor/editorInput", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/platform/instantiation/common/instantiation", "vs/platform/terminal/common/terminal", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/platform/dialogs/common/dialogs", "vs/base/common/event"], function (require, exports, nls_1, severity_1, lifecycle_1, themeService_1, editorInput_1, terminal_1, terminalIcon_1, instantiation_1, terminal_2, lifecycle_2, contextkey_1, configuration_1, terminalContextKey_1, dialogs_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalEditorInput = void 0;
    let TerminalEditorInput = class TerminalEditorInput extends editorInput_1.EditorInput {
        constructor(resource, _terminalInstance, _themeService, _terminalInstanceService, _instantiationService, _configurationService, _lifecycleService, _contextKeyService, _dialogService) {
            super();
            this.resource = resource;
            this._terminalInstance = _terminalInstance;
            this._themeService = _themeService;
            this._terminalInstanceService = _terminalInstanceService;
            this._instantiationService = _instantiationService;
            this._configurationService = _configurationService;
            this._lifecycleService = _lifecycleService;
            this._dialogService = _dialogService;
            this._onDidRequestAttach = this._register(new event_1.Emitter());
            this.onDidRequestAttach = this._onDidRequestAttach.event;
            this._isDetached = false;
            this._isShuttingDown = false;
            this._isReverted = false;
            this._terminalEditorFocusContextKey = terminalContextKey_1.TerminalContextKeys.editorFocus.bindTo(_contextKeyService);
            // Refresh dirty state when the confirm on kill setting is changed
            this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.confirmOnKill" /* TerminalSettingId.ConfirmOnKill */)) {
                    this._onDidChangeDirty.fire();
                }
            });
            if (_terminalInstance) {
                this._setupInstanceListeners();
            }
        }
        setGroup(group) {
            this._group = group;
        }
        get group() {
            return this._group;
        }
        get typeId() {
            return TerminalEditorInput.ID;
        }
        get editorId() {
            return terminal_1.terminalEditorId;
        }
        get capabilities() {
            return 2 /* EditorInputCapabilities.Readonly */ | 8 /* EditorInputCapabilities.Singleton */;
        }
        setTerminalInstance(instance) {
            if (this._terminalInstance) {
                throw new Error('cannot set instance that has already been set');
            }
            this._terminalInstance = instance;
            this._setupInstanceListeners();
            // Refresh dirty state when the confirm on kill setting is changed
            this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.confirmOnKill" /* TerminalSettingId.ConfirmOnKill */)) {
                    this._onDidChangeDirty.fire();
                }
            });
        }
        copy() {
            const instance = this._terminalInstanceService.createInstance(this._copyLaunchConfig || {}, terminal_2.TerminalLocation.Editor);
            instance.focusWhenReady();
            this._copyLaunchConfig = undefined;
            return this._instantiationService.createInstance(TerminalEditorInput, instance.resource, instance);
        }
        /**
         * Sets the launch config to use for the next call to EditorInput.copy, which will be used when
         * the editor's split command is run.
         */
        setCopyLaunchConfig(launchConfig) {
            this._copyLaunchConfig = launchConfig;
        }
        /**
         * Returns the terminal instance for this input if it has not yet been detached from the input.
         */
        get terminalInstance() {
            return this._isDetached ? undefined : this._terminalInstance;
        }
        isDirty() {
            var _a;
            if (this._isReverted) {
                return false;
            }
            const confirmOnKill = this._configurationService.getValue("terminal.integrated.confirmOnKill" /* TerminalSettingId.ConfirmOnKill */);
            if (confirmOnKill === 'editor' || confirmOnKill === 'always') {
                return ((_a = this._terminalInstance) === null || _a === void 0 ? void 0 : _a.hasChildProcesses) || false;
            }
            return false;
        }
        async confirm(terminals) {
            const { choice } = await this._dialogService.show(severity_1.default.Warning, (0, nls_1.localize)('confirmDirtyTerminal.message', "Do you want to terminate running processes?"), [
                (0, nls_1.localize)({ key: 'confirmDirtyTerminal.button', comment: ['&& denotes a mnemonic'] }, "&&Terminate"),
                (0, nls_1.localize)('cancel', "Cancel")
            ], {
                cancelId: 1,
                detail: terminals && terminals.length > 1 ?
                    terminals.map(terminal => terminal.editor.getName()).join('\n') + '\n\n' + (0, nls_1.localize)('confirmDirtyTerminals.detail', "Closing will terminate the running processes in the terminals.") :
                    (0, nls_1.localize)('confirmDirtyTerminal.detail', "Closing will terminate the running processes in this terminal.")
            });
            switch (choice) {
                case 0: return 1 /* ConfirmResult.DONT_SAVE */;
                default: return 2 /* ConfirmResult.CANCEL */;
            }
        }
        async revert() {
            // On revert just treat the terminal as permanently non-dirty
            this._isReverted = true;
        }
        _setupInstanceListeners() {
            const instance = this._terminalInstance;
            if (!instance) {
                return;
            }
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (!this._isDetached && !this._isShuttingDown) {
                    instance.dispose();
                }
            }));
            const disposeListeners = [
                instance.onExit(() => this.dispose()),
                instance.onDisposed(() => this.dispose()),
                instance.onTitleChanged(() => this._onDidChangeLabel.fire()),
                instance.onIconChanged(() => this._onDidChangeLabel.fire()),
                instance.onDidFocus(() => this._terminalEditorFocusContextKey.set(true)),
                instance.onDidBlur(() => this._terminalEditorFocusContextKey.reset()),
                instance.onDidChangeHasChildProcesses(() => this._onDidChangeDirty.fire()),
                instance.statusList.onDidChangePrimaryStatus(() => this._onDidChangeLabel.fire())
            ];
            // Don't dispose editor when instance is torn down on shutdown to avoid extra work and so
            // the editor/tabs don't disappear
            this._lifecycleService.onWillShutdown(() => {
                this._isShuttingDown = true;
                (0, lifecycle_1.dispose)(disposeListeners);
            });
        }
        getName() {
            var _a;
            return ((_a = this._terminalInstance) === null || _a === void 0 ? void 0 : _a.title) || this.resource.fragment;
        }
        getLabelExtraClasses() {
            if (!this._terminalInstance) {
                return [];
            }
            const extraClasses = ['terminal-tab'];
            const colorClass = (0, terminalIcon_1.getColorClass)(this._terminalInstance);
            if (colorClass) {
                extraClasses.push(colorClass);
            }
            const uriClasses = (0, terminalIcon_1.getUriClasses)(this._terminalInstance, this._themeService.getColorTheme().type);
            if (uriClasses) {
                extraClasses.push(...uriClasses);
            }
            if (themeService_1.ThemeIcon.isThemeIcon(this._terminalInstance.icon)) {
                extraClasses.push(`codicon-${this._terminalInstance.icon.id}`);
            }
            return extraClasses;
        }
        /**
         * Detach the instance from the input such that when the input is disposed it will not dispose
         * of the terminal instance/process.
         */
        detachInstance() {
            var _a;
            if (!this._isShuttingDown) {
                (_a = this._terminalInstance) === null || _a === void 0 ? void 0 : _a.detachFromElement();
                this._isDetached = true;
            }
        }
        getDescription() {
            var _a;
            return (_a = this._terminalInstance) === null || _a === void 0 ? void 0 : _a.description;
        }
        toUntyped() {
            return {
                resource: this.resource,
                options: {
                    override: terminal_1.terminalEditorId,
                    pinned: true,
                    forceReload: true
                }
            };
        }
    };
    TerminalEditorInput.ID = 'workbench.editors.terminal';
    TerminalEditorInput = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, terminal_1.ITerminalInstanceService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, lifecycle_2.ILifecycleService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, dialogs_1.IDialogService)
    ], TerminalEditorInput);
    exports.TerminalEditorInput = TerminalEditorInput;
});
//# sourceMappingURL=terminalEditorInput.js.map