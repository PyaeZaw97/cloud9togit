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
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/extensions", "vs/platform/clipboard/common/clipboardService", "vs/platform/clipboard/browser/clipboardService", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/base/common/functional", "vs/base/common/lifecycle", "vs/workbench/services/environment/common/environmentService", "vs/platform/log/common/log", "vs/platform/layout/browser/layoutService"], function (require, exports, nls_1, extensions_1, clipboardService_1, clipboardService_2, notification_1, opener_1, functional_1, lifecycle_1, environmentService_1, log_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserClipboardService = void 0;
    let BrowserClipboardService = class BrowserClipboardService extends clipboardService_2.BrowserClipboardService {
        constructor(notificationService, openerService, environmentService, logService, layoutService) {
            super(layoutService, logService);
            this.notificationService = notificationService;
            this.openerService = openerService;
            this.environmentService = environmentService;
        }
        async readText(type) {
            if (type) {
                return super.readText(type);
            }
            try {
                return await navigator.clipboard.readText();
            }
            catch (error) {
                if (!!this.environmentService.extensionTestsLocationURI) {
                    return ''; // do not ask for input in tests (https://github.com/microsoft/vscode/issues/112264)
                }
                return new Promise(resolve => {
                    // Inform user about permissions problem (https://github.com/microsoft/vscode/issues/112089)
                    const listener = new lifecycle_1.DisposableStore();
                    const handle = this.notificationService.prompt(notification_1.Severity.Error, (0, nls_1.localize)('clipboardError', "Unable to read from the browser's clipboard. Please make sure you have granted access for this website to read from the clipboard."), [{
                            label: (0, nls_1.localize)('retry', "Retry"),
                            run: async () => {
                                listener.dispose();
                                resolve(await this.readText(type));
                            }
                        }, {
                            label: (0, nls_1.localize)('learnMore', "Learn More"),
                            run: () => this.openerService.open('https://go.microsoft.com/fwlink/?linkid=2151362')
                        }], {
                        sticky: true
                    });
                    // Always resolve the promise once the notification closes
                    listener.add((0, functional_1.once)(handle.onDidClose)(() => resolve('')));
                });
            }
        }
    };
    BrowserClipboardService = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, opener_1.IOpenerService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, log_1.ILogService),
        __param(4, layoutService_1.ILayoutService)
    ], BrowserClipboardService);
    exports.BrowserClipboardService = BrowserClipboardService;
    (0, extensions_1.registerSingleton)(clipboardService_1.IClipboardService, BrowserClipboardService, true);
});
//# sourceMappingURL=clipboardService.js.map