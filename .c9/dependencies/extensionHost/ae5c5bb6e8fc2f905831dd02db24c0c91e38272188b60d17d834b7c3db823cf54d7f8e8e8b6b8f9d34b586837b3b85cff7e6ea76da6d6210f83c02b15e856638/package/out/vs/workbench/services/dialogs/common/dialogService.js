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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/dialogs/common/dialogs", "vs/workbench/common/dialogs", "vs/platform/instantiation/common/extensions", "vs/workbench/services/environment/common/environmentService", "vs/platform/log/common/log"], function (require, exports, lifecycle_1, dialogs_1, dialogs_2, extensions_1, environmentService_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DialogService = void 0;
    let DialogService = class DialogService extends lifecycle_1.Disposable {
        constructor(environmentService, logService) {
            super();
            this.environmentService = environmentService;
            this.logService = logService;
            this.model = this._register(new dialogs_2.DialogsModel());
            this.onWillShowDialog = this.model.onWillShowDialog;
            this.onDidShowDialog = this.model.onDidShowDialog;
        }
        skipDialogs() {
            if (this.environmentService.isExtensionDevelopment && this.environmentService.extensionTestsLocationURI) {
                return true; // integration tests
            }
            return !!this.environmentService.enableSmokeTestDriver; // smoke tests
        }
        async confirm(confirmation) {
            if (this.skipDialogs()) {
                this.logService.trace('DialogService: refused to show confirmation dialog in tests.');
                return { confirmed: true };
            }
            const handle = this.model.show({ confirmArgs: { confirmation } });
            return await handle.result;
        }
        async show(severity, message, buttons, options) {
            if (this.skipDialogs()) {
                throw new Error('DialogService: refused to show dialog in tests.');
            }
            const handle = this.model.show({ showArgs: { severity, message, buttons, options } });
            return await handle.result;
        }
        async input(severity, message, buttons, inputs, options) {
            if (this.skipDialogs()) {
                throw new Error('DialogService: refused to show input dialog in tests.');
            }
            const handle = this.model.show({ inputArgs: { severity, message, buttons, inputs, options } });
            return await handle.result;
        }
        async about() {
            if (this.skipDialogs()) {
                throw new Error('DialogService: refused to show about dialog in tests.');
            }
            const handle = this.model.show({});
            await handle.result;
        }
    };
    DialogService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, log_1.ILogService)
    ], DialogService);
    exports.DialogService = DialogService;
    (0, extensions_1.registerSingleton)(dialogs_1.IDialogService, DialogService, true);
});
//# sourceMappingURL=dialogService.js.map