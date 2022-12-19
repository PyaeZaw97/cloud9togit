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
define(["require", "exports", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/extensions/common/extensions", "vs/platform/commands/common/commands", "vs/platform/actions/common/actions", "vs/nls", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/notification/common/notification", "vs/base/common/actions", "vs/workbench/services/host/browser/host", "vs/base/common/lifecycle", "vs/base/common/cancellation", "vs/base/common/async"], function (require, exports, extensions_1, extensions_2, commands_1, actions_1, nls_1, extensionManagementUtil_1, notification_1, actions_2, host_1, lifecycle_1, cancellation_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionDependencyChecker = void 0;
    let ExtensionDependencyChecker = class ExtensionDependencyChecker extends lifecycle_1.Disposable {
        constructor(extensionService, extensionsWorkbenchService, notificationService, hostService) {
            super();
            this.extensionService = extensionService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.notificationService = notificationService;
            this.hostService = hostService;
            commands_1.CommandsRegistry.registerCommand('workbench.extensions.installMissingDependencies', () => this.installMissingDependencies());
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
                command: {
                    id: 'workbench.extensions.installMissingDependencies',
                    category: (0, nls_1.localize)('extensions', "Extensions"),
                    title: (0, nls_1.localize)('auto install missing deps', "Install Missing Dependencies")
                }
            });
        }
        async getUninstalledMissingDependencies() {
            const allMissingDependencies = await this.getAllMissingDependencies();
            const localExtensions = await this.extensionsWorkbenchService.queryLocal();
            return allMissingDependencies.filter(id => localExtensions.every(l => !(0, extensionManagementUtil_1.areSameExtensions)(l.identifier, { id })));
        }
        async getAllMissingDependencies() {
            const runningExtensions = await this.extensionService.getExtensions();
            const runningExtensionsIds = runningExtensions.reduce((result, r) => { result.add(r.identifier.value.toLowerCase()); return result; }, new Set());
            const missingDependencies = new Set();
            for (const extension of runningExtensions) {
                if (extension.extensionDependencies) {
                    extension.extensionDependencies.forEach(dep => {
                        if (!runningExtensionsIds.has(dep.toLowerCase())) {
                            missingDependencies.add(dep);
                        }
                    });
                }
            }
            return [...missingDependencies.values()];
        }
        async installMissingDependencies() {
            const missingDependencies = await this.getUninstalledMissingDependencies();
            if (missingDependencies.length) {
                const extensions = await this.extensionsWorkbenchService.getExtensions(missingDependencies.map(id => ({ id })), cancellation_1.CancellationToken.None);
                if (extensions.length) {
                    await async_1.Promises.settled(extensions.map(extension => this.extensionsWorkbenchService.install(extension)));
                    this.notificationService.notify({
                        severity: notification_1.Severity.Info,
                        message: (0, nls_1.localize)('finished installing missing deps', "Finished installing missing dependencies. Please reload the window now."),
                        actions: {
                            primary: [new actions_2.Action('realod', (0, nls_1.localize)('reload', "Reload Window"), '', true, () => this.hostService.reload())]
                        }
                    });
                }
            }
            else {
                this.notificationService.info((0, nls_1.localize)('no missing deps', "There are no missing dependencies to install."));
            }
        }
    };
    ExtensionDependencyChecker = __decorate([
        __param(0, extensions_2.IExtensionService),
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, notification_1.INotificationService),
        __param(3, host_1.IHostService)
    ], ExtensionDependencyChecker);
    exports.ExtensionDependencyChecker = ExtensionDependencyChecker;
});
//# sourceMappingURL=extensionsDependencyChecker.js.map