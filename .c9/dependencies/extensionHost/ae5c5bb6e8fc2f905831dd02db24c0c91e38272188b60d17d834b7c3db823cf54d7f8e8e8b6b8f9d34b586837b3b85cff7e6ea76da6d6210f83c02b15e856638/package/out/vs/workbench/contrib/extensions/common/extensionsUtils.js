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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/notification/common/notification"], function (require, exports, nls_1, event_1, errors_1, lifecycle_1, extensionManagement_1, extensionManagement_2, extensionRecommendations_1, lifecycle_2, instantiation_1, extensionManagementUtil_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isKeymapExtension = exports.getInstalledExtensions = exports.onExtensionChanged = exports.KeymapExtensions = void 0;
    let KeymapExtensions = class KeymapExtensions extends lifecycle_1.Disposable {
        constructor(instantiationService, extensionEnablementService, tipsService, lifecycleService, notificationService) {
            super();
            this.instantiationService = instantiationService;
            this.extensionEnablementService = extensionEnablementService;
            this.tipsService = tipsService;
            this.notificationService = notificationService;
            this._register(lifecycleService.onDidShutdown(() => this.dispose()));
            this._register(instantiationService.invokeFunction(onExtensionChanged)((identifiers => {
                Promise.all(identifiers.map(identifier => this.checkForOtherKeymaps(identifier)))
                    .then(undefined, errors_1.onUnexpectedError);
            })));
        }
        checkForOtherKeymaps(extensionIdentifier) {
            return this.instantiationService.invokeFunction(getInstalledExtensions).then(extensions => {
                const keymaps = extensions.filter(extension => isKeymapExtension(this.tipsService, extension));
                const extension = keymaps.find(extension => (0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, extensionIdentifier));
                if (extension && extension.globallyEnabled) {
                    const otherKeymaps = keymaps.filter(extension => !(0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, extensionIdentifier) && extension.globallyEnabled);
                    if (otherKeymaps.length) {
                        return this.promptForDisablingOtherKeymaps(extension, otherKeymaps);
                    }
                }
                return undefined;
            });
        }
        promptForDisablingOtherKeymaps(newKeymap, oldKeymaps) {
            const onPrompt = (confirmed) => {
                if (confirmed) {
                    this.extensionEnablementService.setEnablement(oldKeymaps.map(keymap => keymap.local), 6 /* EnablementState.DisabledGlobally */);
                }
            };
            this.notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('disableOtherKeymapsConfirmation', "Disable other keymaps ({0}) to avoid conflicts between keybindings?", oldKeymaps.map(k => `'${k.local.manifest.displayName}'`).join(', ')), [{
                    label: (0, nls_1.localize)('yes', "Yes"),
                    run: () => onPrompt(true)
                }, {
                    label: (0, nls_1.localize)('no', "No"),
                    run: () => onPrompt(false)
                }]);
        }
    };
    KeymapExtensions = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(2, extensionRecommendations_1.IExtensionRecommendationsService),
        __param(3, lifecycle_2.ILifecycleService),
        __param(4, notification_1.INotificationService)
    ], KeymapExtensions);
    exports.KeymapExtensions = KeymapExtensions;
    function onExtensionChanged(accessor) {
        const extensionService = accessor.get(extensionManagement_1.IExtensionManagementService);
        const extensionEnablementService = accessor.get(extensionManagement_2.IWorkbenchExtensionEnablementService);
        const onDidInstallExtensions = event_1.Event.chain(extensionService.onDidInstallExtensions)
            .filter(e => e.some(({ operation }) => operation === 2 /* InstallOperation.Install */))
            .map(e => e.map(({ identifier }) => identifier))
            .event;
        return event_1.Event.debounce(event_1.Event.any(event_1.Event.chain(event_1.Event.any(onDidInstallExtensions, event_1.Event.map(extensionService.onDidUninstallExtension, e => [e.identifier])))
            .event, event_1.Event.map(extensionEnablementService.onEnablementChanged, extensions => extensions.map(e => e.identifier))), (result, identifiers) => {
            result = result || [];
            for (const identifier of identifiers) {
                if (result.some(l => !(0, extensionManagementUtil_1.areSameExtensions)(l, identifier))) {
                    result.push(identifier);
                }
            }
            return result;
        });
    }
    exports.onExtensionChanged = onExtensionChanged;
    async function getInstalledExtensions(accessor) {
        const extensionService = accessor.get(extensionManagement_1.IExtensionManagementService);
        const extensionEnablementService = accessor.get(extensionManagement_2.IWorkbenchExtensionEnablementService);
        const extensions = await extensionService.getInstalled();
        return extensions.map(extension => {
            return {
                identifier: extension.identifier,
                local: extension,
                globallyEnabled: extensionEnablementService.isEnabled(extension)
            };
        });
    }
    exports.getInstalledExtensions = getInstalledExtensions;
    function isKeymapExtension(tipsService, extension) {
        const cats = extension.local.manifest.categories;
        return cats && cats.indexOf('Keymaps') !== -1 || tipsService.getKeymapRecommendations().some(extensionId => (0, extensionManagementUtil_1.areSameExtensions)({ id: extensionId }, extension.local.identifier));
    }
    exports.isKeymapExtension = isKeymapExtension;
});
//# sourceMappingURL=extensionsUtils.js.map