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
define(["require", "exports", "vs/platform/clipboard/common/clipboardService", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/keybinding/common/keybinding", "vs/platform/layout/browser/layoutService", "vs/platform/log/common/log", "vs/platform/native/electron-sandbox/native", "vs/platform/product/common/productService", "vs/platform/registry/common/platform", "vs/platform/theme/common/themeService", "vs/workbench/common/contributions", "vs/workbench/browser/parts/dialogs/dialogHandler", "vs/workbench/electron-sandbox/parts/dialogs/dialogHandler", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation"], function (require, exports, clipboardService_1, configuration_1, dialogs_1, keybinding_1, layoutService_1, log_1, native_1, productService_1, platform_1, themeService_1, contributions_1, dialogHandler_1, dialogHandler_2, lifecycle_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DialogHandlerContribution = void 0;
    let DialogHandlerContribution = class DialogHandlerContribution extends lifecycle_1.Disposable {
        constructor(configurationService, dialogService, logService, layoutService, themeService, keybindingService, instantiationService, productService, clipboardService, nativeHostService) {
            super();
            this.configurationService = configurationService;
            this.dialogService = dialogService;
            this.browserImpl = new dialogHandler_1.BrowserDialogHandler(logService, layoutService, themeService, keybindingService, instantiationService, productService, clipboardService);
            this.nativeImpl = new dialogHandler_2.NativeDialogHandler(logService, nativeHostService, productService, clipboardService);
            this.model = this.dialogService.model;
            this._register(this.model.onWillShowDialog(() => {
                if (!this.currentDialog) {
                    this.processDialogs();
                }
            }));
            this.processDialogs();
        }
        async processDialogs() {
            var _a;
            while (this.model.dialogs.length) {
                this.currentDialog = this.model.dialogs[0];
                let result = undefined;
                // Confirm
                if (this.currentDialog.args.confirmArgs) {
                    const args = this.currentDialog.args.confirmArgs;
                    result = this.useCustomDialog ? await this.browserImpl.confirm(args.confirmation) : await this.nativeImpl.confirm(args.confirmation);
                }
                // Input (custom only)
                else if (this.currentDialog.args.inputArgs) {
                    const args = this.currentDialog.args.inputArgs;
                    result = await this.browserImpl.input(args.severity, args.message, args.buttons, args.inputs, args.options);
                }
                // Message
                else if (this.currentDialog.args.showArgs) {
                    const args = this.currentDialog.args.showArgs;
                    result = (this.useCustomDialog || ((_a = args.options) === null || _a === void 0 ? void 0 : _a.custom)) ?
                        await this.browserImpl.show(args.severity, args.message, args.buttons, args.options) :
                        await this.nativeImpl.show(args.severity, args.message, args.buttons, args.options);
                }
                // About
                else {
                    await this.nativeImpl.about();
                }
                this.currentDialog.close(result);
                this.currentDialog = undefined;
            }
        }
        get useCustomDialog() {
            return this.configurationService.getValue('window.dialogStyle') === 'custom';
        }
    };
    DialogHandlerContribution = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, dialogs_1.IDialogService),
        __param(2, log_1.ILogService),
        __param(3, layoutService_1.ILayoutService),
        __param(4, themeService_1.IThemeService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, productService_1.IProductService),
        __param(8, clipboardService_1.IClipboardService),
        __param(9, native_1.INativeHostService)
    ], DialogHandlerContribution);
    exports.DialogHandlerContribution = DialogHandlerContribution;
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(DialogHandlerContribution, 1 /* LifecyclePhase.Starting */);
});
//# sourceMappingURL=dialog.contribution.js.map