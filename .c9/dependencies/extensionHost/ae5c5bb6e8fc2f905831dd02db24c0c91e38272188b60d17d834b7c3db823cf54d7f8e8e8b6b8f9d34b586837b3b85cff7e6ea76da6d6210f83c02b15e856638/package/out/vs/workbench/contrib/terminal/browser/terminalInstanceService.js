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
define(["require", "exports", "vs/workbench/contrib/terminal/browser/terminal", "vs/platform/instantiation/common/extensions", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/terminalInstance", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/terminal/browser/terminalConfigHelper", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/event", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/platform/registry/common/platform"], function (require, exports, terminal_1, extensions_1, lifecycle_1, instantiation_1, terminalInstance_1, contextkey_1, terminalConfigHelper_1, terminal_2, event_1, terminalContextKey_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalInstanceService = void 0;
    let TerminalInstanceService = class TerminalInstanceService extends lifecycle_1.Disposable {
        constructor(_instantiationService, _contextKeyService) {
            super();
            this._instantiationService = _instantiationService;
            this._contextKeyService = _contextKeyService;
            this._onDidCreateInstance = new event_1.Emitter();
            this._terminalFocusContextKey = terminalContextKey_1.TerminalContextKeys.focus.bindTo(this._contextKeyService);
            this._terminalHasFixedWidth = terminalContextKey_1.TerminalContextKeys.terminalHasFixedWidth.bindTo(this._contextKeyService);
            this._terminalShellTypeContextKey = terminalContextKey_1.TerminalContextKeys.shellType.bindTo(this._contextKeyService);
            this._terminalAltBufferActiveContextKey = terminalContextKey_1.TerminalContextKeys.altBufferActive.bindTo(this._contextKeyService);
            this._configHelper = _instantiationService.createInstance(terminalConfigHelper_1.TerminalConfigHelper);
        }
        get onDidCreateInstance() { return this._onDidCreateInstance.event; }
        createInstance(config, target, resource) {
            const shellLaunchConfig = this.convertProfileToShellLaunchConfig(config);
            const instance = this._instantiationService.createInstance(terminalInstance_1.TerminalInstance, this._terminalFocusContextKey, this._terminalHasFixedWidth, this._terminalShellTypeContextKey, this._terminalAltBufferActiveContextKey, this._configHelper, shellLaunchConfig, resource);
            instance.target = target;
            this._onDidCreateInstance.fire(instance);
            return instance;
        }
        convertProfileToShellLaunchConfig(shellLaunchConfigOrProfile, cwd) {
            // Profile was provided
            if (shellLaunchConfigOrProfile && 'profileName' in shellLaunchConfigOrProfile) {
                const profile = shellLaunchConfigOrProfile;
                if (!profile.path) {
                    return shellLaunchConfigOrProfile;
                }
                return {
                    executable: profile.path,
                    args: profile.args,
                    env: profile.env,
                    icon: profile.icon,
                    color: profile.color,
                    name: profile.overrideName ? profile.profileName : undefined,
                    cwd
                };
            }
            // A shell launch config was provided
            if (shellLaunchConfigOrProfile) {
                if (cwd) {
                    shellLaunchConfigOrProfile.cwd = cwd;
                }
                return shellLaunchConfigOrProfile;
            }
            // Return empty shell launch config
            return {};
        }
        getBackend(remoteAuthority) {
            return platform_1.Registry.as(terminal_2.TerminalExtensions.Backend).getTerminalBackend(remoteAuthority);
        }
    };
    TerminalInstanceService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextkey_1.IContextKeyService)
    ], TerminalInstanceService);
    exports.TerminalInstanceService = TerminalInstanceService;
    (0, extensions_1.registerSingleton)(terminal_1.ITerminalInstanceService, TerminalInstanceService, true);
});
//# sourceMappingURL=terminalInstanceService.js.map