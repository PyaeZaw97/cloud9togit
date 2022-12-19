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
define(["require", "exports", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/debug/common/debug", "vs/platform/workspace/common/workspace", "vs/workbench/common/theme", "vs/base/common/lifecycle", "vs/workbench/services/statusbar/browser/statusbar"], function (require, exports, nls_1, colorRegistry_1, debug_1, workspace_1, theme_1, lifecycle_1, statusbar_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isStatusbarInDebugMode = exports.StatusBarColorProvider = exports.STATUS_BAR_DEBUGGING_BORDER = exports.STATUS_BAR_DEBUGGING_FOREGROUND = exports.STATUS_BAR_DEBUGGING_BACKGROUND = void 0;
    // colors for theming
    exports.STATUS_BAR_DEBUGGING_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBar.debuggingBackground', {
        dark: '#CC6633',
        light: '#CC6633',
        hcDark: '#BA592C',
        hcLight: '#B5200D'
    }, (0, nls_1.localize)('statusBarDebuggingBackground', "Status bar background color when a program is being debugged. The status bar is shown in the bottom of the window"));
    exports.STATUS_BAR_DEBUGGING_FOREGROUND = (0, colorRegistry_1.registerColor)('statusBar.debuggingForeground', {
        dark: theme_1.STATUS_BAR_FOREGROUND,
        light: theme_1.STATUS_BAR_FOREGROUND,
        hcDark: theme_1.STATUS_BAR_FOREGROUND,
        hcLight: '#FFFFFF'
    }, (0, nls_1.localize)('statusBarDebuggingForeground', "Status bar foreground color when a program is being debugged. The status bar is shown in the bottom of the window"));
    exports.STATUS_BAR_DEBUGGING_BORDER = (0, colorRegistry_1.registerColor)('statusBar.debuggingBorder', {
        dark: theme_1.STATUS_BAR_BORDER,
        light: theme_1.STATUS_BAR_BORDER,
        hcDark: theme_1.STATUS_BAR_BORDER,
        hcLight: theme_1.STATUS_BAR_BORDER
    }, (0, nls_1.localize)('statusBarDebuggingBorder', "Status bar border color separating to the sidebar and editor when a program is being debugged. The status bar is shown in the bottom of the window"));
    let StatusBarColorProvider = class StatusBarColorProvider {
        constructor(debugService, contextService, statusbarService) {
            this.debugService = debugService;
            this.contextService = contextService;
            this.statusbarService = statusbarService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.debugService.onDidChangeState(this.update, this, this.disposables);
            this.contextService.onDidChangeWorkbenchState(this.update, this, this.disposables);
            this.update();
        }
        set enabled(enabled) {
            if (enabled === !!this.disposable) {
                return;
            }
            if (enabled) {
                this.disposable = this.statusbarService.overrideStyle({
                    priority: 10,
                    foreground: exports.STATUS_BAR_DEBUGGING_FOREGROUND,
                    background: exports.STATUS_BAR_DEBUGGING_BACKGROUND,
                    border: exports.STATUS_BAR_DEBUGGING_BORDER,
                });
            }
            else {
                this.disposable.dispose();
                this.disposable = undefined;
            }
        }
        update() {
            this.enabled = isStatusbarInDebugMode(this.debugService.state, this.debugService.getViewModel().focusedSession);
        }
        dispose() {
            var _a;
            (_a = this.disposable) === null || _a === void 0 ? void 0 : _a.dispose();
            this.disposables.dispose();
        }
    };
    StatusBarColorProvider = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, statusbar_1.IStatusbarService)
    ], StatusBarColorProvider);
    exports.StatusBarColorProvider = StatusBarColorProvider;
    function isStatusbarInDebugMode(state, session) {
        var _a;
        if (state === 0 /* State.Inactive */ || state === 1 /* State.Initializing */ || (session === null || session === void 0 ? void 0 : session.isSimpleUI)) {
            return false;
        }
        const isRunningWithoutDebug = (_a = session === null || session === void 0 ? void 0 : session.configuration) === null || _a === void 0 ? void 0 : _a.noDebug;
        if (isRunningWithoutDebug) {
            return false;
        }
        return true;
    }
    exports.isStatusbarInDebugMode = isStatusbarInDebugMode;
});
//# sourceMappingURL=statusbarColorProvider.js.map