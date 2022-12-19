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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/workbench/common/memento", "vs/workbench/contrib/externalUriOpener/common/configuration", "vs/workbench/services/extensions/common/extensions"], function (require, exports, lifecycle_1, storage_1, memento_1, configuration_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContributedExternalUriOpenersStore = void 0;
    let ContributedExternalUriOpenersStore = class ContributedExternalUriOpenersStore extends lifecycle_1.Disposable {
        constructor(storageService, _extensionService) {
            super();
            this._extensionService = _extensionService;
            this._openers = new Map();
            this._memento = new memento_1.Memento(ContributedExternalUriOpenersStore.STORAGE_ID, storageService);
            this._mementoObject = this._memento.getMemento(0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            for (const [id, value] of Object.entries(this._mementoObject || {})) {
                this.add(id, value.extensionId, { isCurrentlyRegistered: false });
            }
            this.invalidateOpenersOnExtensionsChanged();
            this._register(this._extensionService.onDidChangeExtensions(() => this.invalidateOpenersOnExtensionsChanged()));
            this._register(this._extensionService.onDidChangeExtensionsStatus(() => this.invalidateOpenersOnExtensionsChanged()));
        }
        didRegisterOpener(id, extensionId) {
            this.add(id, extensionId, {
                isCurrentlyRegistered: true
            });
        }
        add(id, extensionId, options) {
            const existing = this._openers.get(id);
            if (existing) {
                existing.isCurrentlyRegistered = existing.isCurrentlyRegistered || options.isCurrentlyRegistered;
                return;
            }
            const entry = {
                extensionId,
                isCurrentlyRegistered: options.isCurrentlyRegistered
            };
            this._openers.set(id, entry);
            this._mementoObject[id] = entry;
            this._memento.saveMemento();
            this.updateSchema();
        }
        delete(id) {
            this._openers.delete(id);
            delete this._mementoObject[id];
            this._memento.saveMemento();
            this.updateSchema();
        }
        async invalidateOpenersOnExtensionsChanged() {
            const registeredExtensions = await this._extensionService.getExtensions();
            for (const [id, entry] of this._openers) {
                const extension = registeredExtensions.find(r => r.identifier.value === entry.extensionId);
                if (extension) {
                    if (!this._extensionService.canRemoveExtension(extension)) {
                        // The extension is running. We should have registered openers at this point
                        if (!entry.isCurrentlyRegistered) {
                            this.delete(id);
                        }
                    }
                }
                else {
                    // The opener came from an extension that is no longer enabled/installed
                    this.delete(id);
                }
            }
        }
        updateSchema() {
            const ids = [];
            const descriptions = [];
            for (const [id, entry] of this._openers) {
                ids.push(id);
                descriptions.push(entry.extensionId);
            }
            (0, configuration_1.updateContributedOpeners)(ids, descriptions);
        }
    };
    ContributedExternalUriOpenersStore.STORAGE_ID = 'externalUriOpeners';
    ContributedExternalUriOpenersStore = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, extensions_1.IExtensionService)
    ], ContributedExternalUriOpenersStore);
    exports.ContributedExternalUriOpenersStore = ContributedExternalUriOpenersStore;
});
//# sourceMappingURL=contributedOpeners.js.map