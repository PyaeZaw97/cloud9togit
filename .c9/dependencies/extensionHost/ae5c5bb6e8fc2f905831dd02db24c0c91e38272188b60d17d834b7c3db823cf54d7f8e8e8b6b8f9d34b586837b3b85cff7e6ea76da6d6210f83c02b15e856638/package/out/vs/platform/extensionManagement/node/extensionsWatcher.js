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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/uriIdentity/common/uriIdentity"], function (require, exports, event_1, lifecycle_1, uri_1, environment_1, extensionManagementUtil_1, files_1, log_1, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsWatcher = void 0;
    let ExtensionsWatcher = class ExtensionsWatcher extends lifecycle_1.Disposable {
        constructor(extensionsManagementService, fileService, environmentService, logService, uriIdentityService) {
            super();
            this.extensionsManagementService = extensionsManagementService;
            this.logService = logService;
            this.uriIdentityService = uriIdentityService;
            this._onDidChangeExtensionsByAnotherSource = this._register(new event_1.Emitter());
            this.onDidChangeExtensionsByAnotherSource = this._onDidChangeExtensionsByAnotherSource.event;
            this.startTimestamp = 0;
            this.installingExtensions = [];
            this.extensionsManagementService.getInstalled().then(extensions => {
                this.installedExtensions = extensions.map(e => e.identifier);
                this.startTimestamp = Date.now();
            });
            this._register(extensionsManagementService.onInstallExtension(e => this.onInstallExtension(e)));
            this._register(extensionsManagementService.onDidInstallExtensions(e => this.onDidInstallExtensions(e)));
            this._register(extensionsManagementService.onDidUninstallExtension(e => this.onDidUninstallExtension(e)));
            const extensionsResource = uri_1.URI.file(environmentService.extensionsPath);
            this._register(fileService.watch(extensionsResource));
            this._register(event_1.Event.filter(fileService.onDidFilesChange, e => e.rawChanges.some(change => this.doesChangeAffects(change, extensionsResource)))(() => this.onDidChange()));
        }
        doesChangeAffects(change, extensionsResource) {
            // Only interested in added/deleted changes
            if (change.type !== 1 /* FileChangeType.ADDED */ && change.type !== 2 /* FileChangeType.DELETED */) {
                return false;
            }
            // Is not immediate child of extensions resource
            if (!this.uriIdentityService.extUri.isEqual(this.uriIdentityService.extUri.dirname(change.resource), extensionsResource)) {
                return false;
            }
            // .obsolete file changed
            if (this.uriIdentityService.extUri.isEqual(change.resource, this.uriIdentityService.extUri.joinPath(extensionsResource, '.obsolete'))) {
                return true;
            }
            // Ingore changes to files starting with `.`
            if (this.uriIdentityService.extUri.basename(change.resource).startsWith('.')) {
                return false;
            }
            return true;
        }
        onInstallExtension(e) {
            this.addInstallingExtension(e.identifier);
        }
        onDidInstallExtensions(results) {
            for (const e of results) {
                this.removeInstallingExtension(e.identifier);
                if (e.local) {
                    this.addInstalledExtension(e.identifier);
                }
            }
        }
        onDidUninstallExtension(e) {
            if (!e.error) {
                this.removeInstalledExtension(e.identifier);
            }
        }
        addInstallingExtension(extension) {
            this.removeInstallingExtension(extension);
            this.installingExtensions.push(extension);
        }
        removeInstallingExtension(identifier) {
            this.installingExtensions = this.installingExtensions.filter(e => !(0, extensionManagementUtil_1.areSameExtensions)(e, identifier));
        }
        addInstalledExtension(extension) {
            if (this.installedExtensions) {
                this.removeInstalledExtension(extension);
                this.installedExtensions.push(extension);
            }
        }
        removeInstalledExtension(identifier) {
            if (this.installedExtensions) {
                this.installedExtensions = this.installedExtensions.filter(e => !(0, extensionManagementUtil_1.areSameExtensions)(e, identifier));
            }
        }
        async onDidChange() {
            if (this.installedExtensions) {
                const extensions = await this.extensionsManagementService.getInstalled();
                const added = extensions.filter(e => {
                    if ([...this.installingExtensions, ...this.installedExtensions].some(identifier => (0, extensionManagementUtil_1.areSameExtensions)(identifier, e.identifier))) {
                        return false;
                    }
                    if (e.installedTimestamp && e.installedTimestamp > this.startTimestamp) {
                        this.logService.info('Detected extension installed from another source', e.identifier.id);
                        return true;
                    }
                    else {
                        this.logService.info('Ignored extension installed by another source because of invalid timestamp', e.identifier.id);
                        return false;
                    }
                });
                const removed = this.installedExtensions.filter(identifier => {
                    // Extension being installed
                    if (this.installingExtensions.some(installingExtension => (0, extensionManagementUtil_1.areSameExtensions)(installingExtension, identifier))) {
                        return false;
                    }
                    if (extensions.every(e => !(0, extensionManagementUtil_1.areSameExtensions)(e.identifier, identifier))) {
                        this.logService.info('Detected extension removed from another source', identifier.id);
                        return true;
                    }
                    return false;
                });
                this.installedExtensions = extensions.map(e => e.identifier);
                if (added.length || removed.length) {
                    this._onDidChangeExtensionsByAnotherSource.fire({ added, removed });
                }
            }
        }
    };
    ExtensionsWatcher = __decorate([
        __param(1, files_1.IFileService),
        __param(2, environment_1.INativeEnvironmentService),
        __param(3, log_1.ILogService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], ExtensionsWatcher);
    exports.ExtensionsWatcher = ExtensionsWatcher;
});
//# sourceMappingURL=extensionsWatcher.js.map