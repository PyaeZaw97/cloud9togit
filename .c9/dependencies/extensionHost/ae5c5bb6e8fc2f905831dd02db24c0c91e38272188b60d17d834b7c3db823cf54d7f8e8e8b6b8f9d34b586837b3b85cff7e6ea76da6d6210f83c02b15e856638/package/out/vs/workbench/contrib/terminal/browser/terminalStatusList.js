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
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/severity", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService"], function (require, exports, codicons_1, event_1, lifecycle_1, severity_1, configuration_1, colorRegistry_1, iconRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getColorForSeverity = exports.TerminalStatusList = exports.TerminalStatus = void 0;
    /**
     * The set of _internal_ terminal statuses, other components building on the terminal should put
     * their statuses within their component.
     */
    var TerminalStatus;
    (function (TerminalStatus) {
        TerminalStatus["Bell"] = "bell";
        TerminalStatus["Disconnected"] = "disconnected";
        TerminalStatus["RelaunchNeeded"] = "relaunch-needed";
    })(TerminalStatus = exports.TerminalStatus || (exports.TerminalStatus = {}));
    let TerminalStatusList = class TerminalStatusList extends lifecycle_1.Disposable {
        constructor(_configurationService) {
            super();
            this._configurationService = _configurationService;
            this._statuses = new Map();
            this._statusTimeouts = new Map();
            this._onDidAddStatus = this._register(new event_1.Emitter());
            this._onDidRemoveStatus = this._register(new event_1.Emitter());
            this._onDidChangePrimaryStatus = this._register(new event_1.Emitter());
        }
        get onDidAddStatus() { return this._onDidAddStatus.event; }
        get onDidRemoveStatus() { return this._onDidRemoveStatus.event; }
        get onDidChangePrimaryStatus() { return this._onDidChangePrimaryStatus.event; }
        get primary() {
            let result;
            for (const s of this._statuses.values()) {
                if (!result || s.severity >= result.severity) {
                    result = s;
                }
            }
            return result;
        }
        get statuses() { return Array.from(this._statuses.values()); }
        add(status, duration) {
            status = this._applyAnimationSetting(status);
            const outTimeout = this._statusTimeouts.get(status.id);
            if (outTimeout) {
                window.clearTimeout(outTimeout);
                this._statusTimeouts.delete(status.id);
            }
            if (duration && duration > 0) {
                const timeout = window.setTimeout(() => this.remove(status), duration);
                this._statusTimeouts.set(status.id, timeout);
            }
            if (!this._statuses.has(status.id)) {
                const oldPrimary = this.primary;
                this._statuses.set(status.id, status);
                this._onDidAddStatus.fire(status);
                const newPrimary = this.primary;
                if (oldPrimary !== newPrimary) {
                    this._onDidChangePrimaryStatus.fire(newPrimary);
                }
            }
        }
        remove(statusOrId) {
            var _a;
            const status = typeof statusOrId === 'string' ? this._statuses.get(statusOrId) : statusOrId;
            // Verify the status is the same as the one passed in
            if (status && this._statuses.get(status.id)) {
                const wasPrimary = ((_a = this.primary) === null || _a === void 0 ? void 0 : _a.id) === status.id;
                this._statuses.delete(status.id);
                this._onDidRemoveStatus.fire(status);
                if (wasPrimary) {
                    this._onDidChangePrimaryStatus.fire(this.primary);
                }
            }
        }
        toggle(status, value) {
            if (value) {
                this.add(status);
            }
            else {
                this.remove(status);
            }
        }
        _applyAnimationSetting(status) {
            if (!status.icon || themeService_1.ThemeIcon.getModifier(status.icon) !== 'spin' || this._configurationService.getValue("terminal.integrated.tabs.enableAnimation" /* TerminalSettingId.TabsEnableAnimation */)) {
                return status;
            }
            let icon;
            // Loading without animation is just a curved line that doesn't mean anything
            if (status.icon.id === iconRegistry_1.spinningLoading.id) {
                icon = codicons_1.Codicon.play;
            }
            else {
                icon = themeService_1.ThemeIcon.modify(status.icon, undefined);
            }
            // Clone the status when changing the icon so that setting changes are applied without a
            // reload being needed
            return Object.assign(Object.assign({}, status), { icon });
        }
    };
    TerminalStatusList = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], TerminalStatusList);
    exports.TerminalStatusList = TerminalStatusList;
    function getColorForSeverity(severity) {
        switch (severity) {
            case severity_1.default.Error:
                return colorRegistry_1.listErrorForeground;
            case severity_1.default.Warning:
                return colorRegistry_1.listWarningForeground;
            default:
                return '';
        }
    }
    exports.getColorForSeverity = getColorForSeverity;
});
//# sourceMappingURL=terminalStatusList.js.map