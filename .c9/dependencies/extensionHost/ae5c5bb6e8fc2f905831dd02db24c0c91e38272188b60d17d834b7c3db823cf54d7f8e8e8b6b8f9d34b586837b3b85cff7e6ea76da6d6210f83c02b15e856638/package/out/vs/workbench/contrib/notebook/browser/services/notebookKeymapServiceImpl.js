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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/workbench/contrib/extensions/common/extensionsUtils", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/storage/common/storage", "vs/workbench/common/memento", "vs/base/common/arrays"], function (require, exports, errors_1, event_1, lifecycle_1, nls_1, instantiation_1, notification_1, extensionsUtils_1, extensionManagement_1, lifecycle_2, extensionManagement_2, extensionManagementUtil_1, storage_1, memento_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isNotebookKeymapExtension = exports.NotebookKeymapService = void 0;
    function onExtensionChanged(accessor) {
        const extensionService = accessor.get(extensionManagement_2.IExtensionManagementService);
        const extensionEnablementService = accessor.get(extensionManagement_1.IWorkbenchExtensionEnablementService);
        const onDidInstallExtensions = event_1.Event.chain(extensionService.onDidInstallExtensions)
            .filter(e => e.some(({ operation }) => operation === 2 /* InstallOperation.Install */))
            .map(e => e.map(({ identifier }) => identifier))
            .event;
        return event_1.Event.debounce(event_1.Event.any(event_1.Event.chain(event_1.Event.any(onDidInstallExtensions, event_1.Event.map(extensionService.onDidUninstallExtension, e => [e.identifier])))
            .event, event_1.Event.map(extensionEnablementService.onEnablementChanged, extensions => extensions.map(e => e.identifier))), (result, identifiers) => {
            result = result || (identifiers.length ? [identifiers[0]] : []);
            for (const identifier of identifiers) {
                if (result.some(l => !(0, extensionManagementUtil_1.areSameExtensions)(l, identifier))) {
                    result.push(identifier);
                }
            }
            return result;
        });
    }
    const hasRecommendedKeymapKey = 'hasRecommendedKeymap';
    let NotebookKeymapService = class NotebookKeymapService extends lifecycle_1.Disposable {
        constructor(instantiationService, extensionEnablementService, notificationService, storageService, lifecycleService) {
            super();
            this.instantiationService = instantiationService;
            this.extensionEnablementService = extensionEnablementService;
            this.notificationService = notificationService;
            this.notebookKeymapMemento = new memento_1.Memento('notebookKeymap', storageService);
            this.notebookKeymap = this.notebookKeymapMemento.getMemento(0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            this._register(lifecycleService.onDidShutdown(() => this.dispose()));
            this._register(this.instantiationService.invokeFunction(onExtensionChanged)((identifiers => {
                Promise.all(identifiers.map(identifier => this.checkForOtherKeymaps(identifier)))
                    .then(undefined, errors_1.onUnexpectedError);
            })));
        }
        checkForOtherKeymaps(extensionIdentifier) {
            return this.instantiationService.invokeFunction(extensionsUtils_1.getInstalledExtensions).then(extensions => {
                const keymaps = extensions.filter(extension => isNotebookKeymapExtension(extension));
                const extension = keymaps.find(extension => (0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, extensionIdentifier));
                if (extension && extension.globallyEnabled) {
                    // there is already a keymap extension
                    this.notebookKeymap[hasRecommendedKeymapKey] = true;
                    this.notebookKeymapMemento.saveMemento();
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
            this.notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('disableOtherKeymapsConfirmation', "Disable other keymaps ({0}) to avoid conflicts between keybindings?", (0, arrays_1.distinct)(oldKeymaps.map(k => k.local.manifest.displayName)).map(name => `'${name}'`).join(', ')), [{
                    label: (0, nls_1.localize)('yes', "Yes"),
                    run: () => onPrompt(true)
                }, {
                    label: (0, nls_1.localize)('no', "No"),
                    run: () => onPrompt(false)
                }]);
        }
    };
    NotebookKeymapService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(2, notification_1.INotificationService),
        __param(3, storage_1.IStorageService),
        __param(4, lifecycle_2.ILifecycleService)
    ], NotebookKeymapService);
    exports.NotebookKeymapService = NotebookKeymapService;
    function isNotebookKeymapExtension(extension) {
        if (extension.local.manifest.extensionPack) {
            return false;
        }
        const keywords = extension.local.manifest.keywords;
        if (!keywords) {
            return false;
        }
        return keywords.indexOf('notebook-keymap') !== -1;
    }
    exports.isNotebookKeymapExtension = isNotebookKeymapExtension;
});
//# sourceMappingURL=notebookKeymapServiceImpl.js.map