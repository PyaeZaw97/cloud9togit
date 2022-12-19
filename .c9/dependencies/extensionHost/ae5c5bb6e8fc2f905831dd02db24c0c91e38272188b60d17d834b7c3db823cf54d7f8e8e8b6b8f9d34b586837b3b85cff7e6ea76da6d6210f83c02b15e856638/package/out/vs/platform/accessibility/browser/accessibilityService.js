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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/layout/browser/layoutService"], function (require, exports, dom_1, aria_1, event_1, lifecycle_1, accessibility_1, configuration_1, contextkey_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilityService = void 0;
    let AccessibilityService = class AccessibilityService extends lifecycle_1.Disposable {
        constructor(_contextKeyService, _layoutService, _configurationService) {
            super();
            this._contextKeyService = _contextKeyService;
            this._layoutService = _layoutService;
            this._configurationService = _configurationService;
            this._accessibilitySupport = 0 /* AccessibilitySupport.Unknown */;
            this._onDidChangeScreenReaderOptimized = new event_1.Emitter();
            this._onDidChangeReducedMotion = new event_1.Emitter();
            this._accessibilityModeEnabledContext = accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.bindTo(this._contextKeyService);
            const updateContextKey = () => this._accessibilityModeEnabledContext.set(this.isScreenReaderOptimized());
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor.accessibilitySupport')) {
                    updateContextKey();
                    this._onDidChangeScreenReaderOptimized.fire();
                }
                if (e.affectsConfiguration('workbench.reduceMotion')) {
                    this._configMotionReduced = this._configurationService.getValue('workbench.reduceMotion');
                    this._onDidChangeReducedMotion.fire();
                }
            }));
            updateContextKey();
            this._register(this.onDidChangeScreenReaderOptimized(() => updateContextKey()));
            const reduceMotionMatcher = window.matchMedia(`(prefers-reduced-motion: reduce)`);
            this._systemMotionReduced = reduceMotionMatcher.matches;
            this._configMotionReduced = this._configurationService.getValue('workbench.reduceMotion');
            this.initReducedMotionListeners(reduceMotionMatcher);
        }
        initReducedMotionListeners(reduceMotionMatcher) {
            if (!this._layoutService.hasContainer) {
                // we can't use `ILayoutService.container` because the application
                // doesn't have a single container
                return;
            }
            this._register((0, dom_1.addDisposableListener)(reduceMotionMatcher, 'change', () => {
                this._systemMotionReduced = reduceMotionMatcher.matches;
                if (this._configMotionReduced === 'auto') {
                    this._onDidChangeReducedMotion.fire();
                }
            }));
            const updateRootClasses = () => {
                const reduce = this.isMotionReduced();
                this._layoutService.container.classList.toggle('reduce-motion', reduce);
                this._layoutService.container.classList.toggle('enable-motion', !reduce);
            };
            updateRootClasses();
            this._register(this.onDidChangeReducedMotion(() => updateRootClasses()));
        }
        get onDidChangeScreenReaderOptimized() {
            return this._onDidChangeScreenReaderOptimized.event;
        }
        isScreenReaderOptimized() {
            const config = this._configurationService.getValue('editor.accessibilitySupport');
            return config === 'on' || (config === 'auto' && this._accessibilitySupport === 2 /* AccessibilitySupport.Enabled */);
        }
        get onDidChangeReducedMotion() {
            return this._onDidChangeReducedMotion.event;
        }
        isMotionReduced() {
            const config = this._configMotionReduced;
            return config === 'on' || (config === 'auto' && this._systemMotionReduced);
        }
        alwaysUnderlineAccessKeys() {
            return Promise.resolve(false);
        }
        getAccessibilitySupport() {
            return this._accessibilitySupport;
        }
        setAccessibilitySupport(accessibilitySupport) {
            if (this._accessibilitySupport === accessibilitySupport) {
                return;
            }
            this._accessibilitySupport = accessibilitySupport;
            this._onDidChangeScreenReaderOptimized.fire();
        }
        alert(message) {
            (0, aria_1.alert)(message);
        }
    };
    AccessibilityService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, layoutService_1.ILayoutService),
        __param(2, configuration_1.IConfigurationService)
    ], AccessibilityService);
    exports.AccessibilityService = AccessibilityService;
});
//# sourceMappingURL=accessibilityService.js.map