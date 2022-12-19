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
define(["require", "exports", "vs/platform/accessibility/common/accessibility", "vs/base/common/platform", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/registry/common/platform", "vs/platform/accessibility/browser/accessibilityService", "vs/platform/instantiation/common/extensions", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/configuration/common/jsonEditing", "vs/workbench/common/contributions", "vs/platform/native/electron-sandbox/native", "vs/platform/layout/browser/layoutService"], function (require, exports, accessibility_1, platform_1, environmentService_1, contextkey_1, configuration_1, platform_2, accessibilityService_1, extensions_1, telemetry_1, jsonEditing_1, contributions_1, native_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeAccessibilityService = void 0;
    let NativeAccessibilityService = class NativeAccessibilityService extends accessibilityService_1.AccessibilityService {
        constructor(environmentService, contextKeyService, configurationService, _layoutService, _telemetryService, nativeHostService) {
            super(contextKeyService, _layoutService, configurationService);
            this._telemetryService = _telemetryService;
            this.nativeHostService = nativeHostService;
            this.didSendTelemetry = false;
            this.shouldAlwaysUnderlineAccessKeys = undefined;
            this.setAccessibilitySupport(environmentService.window.accessibilitySupport ? 2 /* AccessibilitySupport.Enabled */ : 1 /* AccessibilitySupport.Disabled */);
        }
        async alwaysUnderlineAccessKeys() {
            if (!platform_1.isWindows) {
                return false;
            }
            if (typeof this.shouldAlwaysUnderlineAccessKeys !== 'boolean') {
                const windowsKeyboardAccessibility = await this.nativeHostService.windowsGetStringRegKey('HKEY_CURRENT_USER', 'Control Panel\\Accessibility\\Keyboard Preference', 'On');
                this.shouldAlwaysUnderlineAccessKeys = (windowsKeyboardAccessibility === '1');
            }
            return this.shouldAlwaysUnderlineAccessKeys;
        }
        setAccessibilitySupport(accessibilitySupport) {
            super.setAccessibilitySupport(accessibilitySupport);
            if (!this.didSendTelemetry && accessibilitySupport === 2 /* AccessibilitySupport.Enabled */) {
                this._telemetryService.publicLog2('accessibility', { enabled: true });
                this.didSendTelemetry = true;
            }
        }
    };
    NativeAccessibilityService = __decorate([
        __param(0, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, layoutService_1.ILayoutService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, native_1.INativeHostService)
    ], NativeAccessibilityService);
    exports.NativeAccessibilityService = NativeAccessibilityService;
    (0, extensions_1.registerSingleton)(accessibility_1.IAccessibilityService, NativeAccessibilityService, true);
    // On linux we do not automatically detect that a screen reader is detected, thus we have to implicitly notify the renderer to enable accessibility when user configures it in settings
    let LinuxAccessibilityContribution = class LinuxAccessibilityContribution {
        constructor(jsonEditingService, accessibilityService, environmentService) {
            const forceRendererAccessibility = () => {
                if (accessibilityService.isScreenReaderOptimized()) {
                    jsonEditingService.write(environmentService.argvResource, [{ path: ['force-renderer-accessibility'], value: true }], true);
                }
            };
            forceRendererAccessibility();
            accessibilityService.onDidChangeScreenReaderOptimized(forceRendererAccessibility);
        }
    };
    LinuxAccessibilityContribution = __decorate([
        __param(0, jsonEditing_1.IJSONEditingService),
        __param(1, accessibility_1.IAccessibilityService),
        __param(2, environmentService_1.INativeWorkbenchEnvironmentService)
    ], LinuxAccessibilityContribution);
    if (platform_1.isLinux) {
        platform_2.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(LinuxAccessibilityContribution, 2 /* LifecyclePhase.Ready */);
    }
});
//# sourceMappingURL=accessibilityService.js.map