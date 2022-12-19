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
define(["require", "exports", "vs/base/common/numbers", "vs/base/browser/ui/sash/sash", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration"], function (require, exports, numbers_1, sash_1, event_1, lifecycle_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SashSettingsController = exports.maxSize = exports.minSize = void 0;
    exports.minSize = 1;
    exports.maxSize = 20; // see also https://ux.stackexchange.com/questions/39023/what-is-the-optimum-button-size-of-touch-screen-applications
    let SashSettingsController = class SashSettingsController {
        constructor(configurationService) {
            this.configurationService = configurationService;
            this.disposables = new lifecycle_1.DisposableStore();
            const onDidChangeSize = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('workbench.sash.size'));
            onDidChangeSize(this.onDidChangeSize, this, this.disposables);
            this.onDidChangeSize();
            const onDidChangeHoverDelay = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('workbench.sash.hoverDelay'));
            onDidChangeHoverDelay(this.onDidChangeHoverDelay, this, this.disposables);
            this.onDidChangeHoverDelay();
        }
        onDidChangeSize() {
            const configuredSize = this.configurationService.getValue('workbench.sash.size');
            const size = (0, numbers_1.clamp)(configuredSize, 4, 20);
            const hoverSize = (0, numbers_1.clamp)(configuredSize, 1, 8);
            document.documentElement.style.setProperty('--sash-size', size + 'px');
            document.documentElement.style.setProperty('--sash-hover-size', hoverSize + 'px');
            (0, sash_1.setGlobalSashSize)(size);
        }
        onDidChangeHoverDelay() {
            (0, sash_1.setGlobalHoverDelay)(this.configurationService.getValue('workbench.sash.hoverDelay'));
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    SashSettingsController = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], SashSettingsController);
    exports.SashSettingsController = SashSettingsController;
});
//# sourceMappingURL=sash.js.map