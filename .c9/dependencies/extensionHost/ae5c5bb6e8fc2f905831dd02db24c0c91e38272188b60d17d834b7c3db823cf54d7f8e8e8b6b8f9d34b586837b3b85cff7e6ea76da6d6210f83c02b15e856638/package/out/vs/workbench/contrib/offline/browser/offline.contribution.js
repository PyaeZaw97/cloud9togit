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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/theme/common/colorRegistry", "vs/platform/workspace/common/workspace", "vs/workbench/common/theme", "vs/workbench/contrib/debug/common/debug", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/browser/event", "vs/workbench/services/statusbar/browser/statusbar"], function (require, exports, platform_1, contributions_1, colorRegistry_1, workspace_1, theme_1, debug_1, nls_1, lifecycle_1, event_1, event_2, statusbar_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OfflineStatusBarController = exports.STATUS_BAR_OFFLINE_BORDER = exports.STATUS_BAR_OFFLINE_FOREGROUND = exports.STATUS_BAR_OFFLINE_BACKGROUND = void 0;
    exports.STATUS_BAR_OFFLINE_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBar.offlineBackground', {
        dark: '#6c1717',
        light: '#6c1717',
        hcDark: '#6c1717',
        hcLight: '#6c1717'
    }, (0, nls_1.localize)('statusBarOfflineBackground', "Status bar background color when the workbench is offline. The status bar is shown in the bottom of the window"));
    exports.STATUS_BAR_OFFLINE_FOREGROUND = (0, colorRegistry_1.registerColor)('statusBar.offlineForeground', {
        dark: theme_1.STATUS_BAR_FOREGROUND,
        light: theme_1.STATUS_BAR_FOREGROUND,
        hcDark: theme_1.STATUS_BAR_FOREGROUND,
        hcLight: theme_1.STATUS_BAR_FOREGROUND
    }, (0, nls_1.localize)('statusBarOfflineForeground', "Status bar foreground color when the workbench is offline. The status bar is shown in the bottom of the window"));
    exports.STATUS_BAR_OFFLINE_BORDER = (0, colorRegistry_1.registerColor)('statusBar.offlineBorder', {
        dark: theme_1.STATUS_BAR_BORDER,
        light: theme_1.STATUS_BAR_BORDER,
        hcDark: theme_1.STATUS_BAR_BORDER,
        hcLight: theme_1.STATUS_BAR_BORDER
    }, (0, nls_1.localize)('statusBarOfflineBorder', "Status bar border color separating to the sidebar and editor when the workbench is offline. The status bar is shown in the bottom of the window"));
    let OfflineStatusBarController = class OfflineStatusBarController {
        constructor(debugService, contextService, statusbarService) {
            this.debugService = debugService;
            this.contextService = contextService;
            this.statusbarService = statusbarService;
            this.disposables = new lifecycle_1.DisposableStore();
            event_1.Event.any(this.disposables.add(new event_2.DomEmitter(window, 'online')).event, this.disposables.add(new event_2.DomEmitter(window, 'offline')).event)(this.update, this, this.disposables);
            this.debugService.onDidChangeState(this.update, this, this.disposables);
            this.contextService.onDidChangeWorkbenchState(this.update, this, this.disposables);
            this.update();
        }
        set enabled(enabled) {
            if (enabled === !!this.disposable) {
                return;
            }
            if (enabled) {
                this.disposable = (0, lifecycle_1.combinedDisposable)(this.statusbarService.overrideStyle({
                    priority: 100,
                    foreground: exports.STATUS_BAR_OFFLINE_FOREGROUND,
                    background: exports.STATUS_BAR_OFFLINE_BACKGROUND,
                    border: exports.STATUS_BAR_OFFLINE_BORDER,
                }), this.statusbarService.addEntry({
                    name: 'Offline Indicator',
                    text: '$(debug-disconnect) Offline',
                    ariaLabel: 'Network is offline.',
                    tooltip: (0, nls_1.localize)('offline', "Network appears to be offline, certain features might be unavailable.")
                }, 'offline', 0 /* StatusbarAlignment.LEFT */, 10000));
            }
            else {
                this.disposable.dispose();
                this.disposable = undefined;
            }
        }
        update() {
            this.enabled = !navigator.onLine;
        }
        dispose() {
            var _a;
            (_a = this.disposable) === null || _a === void 0 ? void 0 : _a.dispose();
            this.disposables.dispose();
        }
    };
    OfflineStatusBarController = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, statusbar_1.IStatusbarService)
    ], OfflineStatusBarController);
    exports.OfflineStatusBarController = OfflineStatusBarController;
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(OfflineStatusBarController, 1 /* LifecyclePhase.Starting */);
});
//# sourceMappingURL=offline.contribution.js.map