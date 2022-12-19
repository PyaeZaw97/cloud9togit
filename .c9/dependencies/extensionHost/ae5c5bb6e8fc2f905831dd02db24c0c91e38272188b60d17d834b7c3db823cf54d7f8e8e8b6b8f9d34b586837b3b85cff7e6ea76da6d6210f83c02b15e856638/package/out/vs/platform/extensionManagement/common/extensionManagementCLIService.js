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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/labels", "vs/base/common/network", "vs/base/common/semver/semver", "vs/base/common/uri", "vs/nls", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensions/common/extensions"], function (require, exports, cancellation_1, errors_1, labels_1, network_1, semver_1, uri_1, nls_1, extensionManagement_1, extensionManagementUtil_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionManagementCLIService = void 0;
    const notFound = (id) => (0, nls_1.localize)('notFound', "Extension '{0}' not found.", id);
    const useId = (0, nls_1.localize)('useId', "Make sure you use the full extension ID, including the publisher, e.g.: {0}", 'ms-dotnettools.csharp');
    function getId(manifest, withVersion) {
        if (withVersion) {
            return `${manifest.publisher}.${manifest.name}@${manifest.version}`;
        }
        else {
            return `${manifest.publisher}.${manifest.name}`;
        }
    }
    let ExtensionManagementCLIService = class ExtensionManagementCLIService {
        constructor(extensionManagementService, extensionGalleryService) {
            this.extensionManagementService = extensionManagementService;
            this.extensionGalleryService = extensionGalleryService;
        }
        get location() {
            return undefined;
        }
        async listExtensions(showVersions, category, output = console) {
            let extensions = await this.extensionManagementService.getInstalled(1 /* ExtensionType.User */);
            const categories = extensions_1.EXTENSION_CATEGORIES.map(c => c.toLowerCase());
            if (category && category !== '') {
                if (categories.indexOf(category.toLowerCase()) < 0) {
                    output.log('Invalid category please enter a valid category. To list valid categories run --category without a category specified');
                    return;
                }
                extensions = extensions.filter(e => {
                    if (e.manifest.categories) {
                        const lowerCaseCategories = e.manifest.categories.map(c => c.toLowerCase());
                        return lowerCaseCategories.indexOf(category.toLowerCase()) > -1;
                    }
                    return false;
                });
            }
            else if (category === '') {
                output.log('Possible Categories: ');
                categories.forEach(category => {
                    output.log(category);
                });
                return;
            }
            if (this.location) {
                output.log((0, nls_1.localize)('listFromLocation', "Extensions installed on {0}:", this.location));
            }
            extensions = extensions.sort((e1, e2) => e1.identifier.id.localeCompare(e2.identifier.id));
            let lastId = undefined;
            for (let extension of extensions) {
                if (lastId !== extension.identifier.id) {
                    lastId = extension.identifier.id;
                    output.log(getId(extension.manifest, showVersions));
                }
            }
        }
        async installExtensions(extensions, builtinExtensionIds, installOptions, force, output = console) {
            const failed = [];
            const installedExtensionsManifests = [];
            if (extensions.length) {
                output.log(this.location ? (0, nls_1.localize)('installingExtensionsOnLocation', "Installing extensions on {0}...", this.location) : (0, nls_1.localize)('installingExtensions', "Installing extensions..."));
            }
            const installed = await this.extensionManagementService.getInstalled(1 /* ExtensionType.User */);
            const checkIfNotInstalled = (id, version) => {
                const installedExtension = installed.find(i => (0, extensionManagementUtil_1.areSameExtensions)(i.identifier, { id }));
                if (installedExtension) {
                    if (!force && (!version || (version === 'prerelease' && installedExtension.preRelease))) {
                        output.log((0, nls_1.localize)('alreadyInstalled-checkAndUpdate', "Extension '{0}' v{1} is already installed. Use '--force' option to update to latest version or provide '@<version>' to install a specific version, for example: '{2}@1.2.3'.", id, installedExtension.manifest.version, id));
                        return false;
                    }
                    if (version && installedExtension.manifest.version === version) {
                        output.log((0, nls_1.localize)('alreadyInstalled', "Extension '{0}' is already installed.", `${id}@${version}`));
                        return false;
                    }
                }
                return true;
            };
            const addInstallExtensionInfo = (id, version, isBuiltin) => {
                installExtensionInfos.push({ id, version: version !== 'prerelease' ? version : undefined, installOptions: Object.assign(Object.assign({}, installOptions), { isBuiltin, installPreReleaseVersion: version === 'prerelease' || installOptions.installPreReleaseVersion }) });
            };
            const vsixs = [];
            const installExtensionInfos = [];
            for (const extension of extensions) {
                if (extension instanceof uri_1.URI) {
                    vsixs.push(extension);
                }
                else {
                    const [id, version] = (0, extensionManagementUtil_1.getIdAndVersion)(extension);
                    if (checkIfNotInstalled(id, version)) {
                        addInstallExtensionInfo(id, version, false);
                    }
                }
            }
            for (const extension of builtinExtensionIds) {
                const [id, version] = (0, extensionManagementUtil_1.getIdAndVersion)(extension);
                if (checkIfNotInstalled(id, version)) {
                    addInstallExtensionInfo(id, version, true);
                }
            }
            if (vsixs.length) {
                await Promise.all(vsixs.map(async (vsix) => {
                    try {
                        const manifest = await this.installVSIX(vsix, Object.assign(Object.assign({}, installOptions), { isBuiltin: false }), force, output);
                        if (manifest) {
                            installedExtensionsManifests.push(manifest);
                        }
                    }
                    catch (err) {
                        output.error(err.message || err.stack || err);
                        failed.push(vsix.toString());
                    }
                }));
            }
            if (installExtensionInfos.length) {
                const galleryExtensions = await this.getGalleryExtensions(installExtensionInfos);
                await Promise.all(installExtensionInfos.map(async (extensionInfo) => {
                    const gallery = galleryExtensions.get(extensionInfo.id.toLowerCase());
                    if (gallery) {
                        try {
                            const manifest = await this.installFromGallery(extensionInfo, gallery, installed, force, output);
                            if (manifest) {
                                installedExtensionsManifests.push(manifest);
                            }
                        }
                        catch (err) {
                            output.error(err.message || err.stack || err);
                            failed.push(extensionInfo.id);
                        }
                    }
                    else {
                        output.error(`${notFound(extensionInfo.version ? `${extensionInfo.id}@${extensionInfo.version}` : extensionInfo.id)}\n${useId}`);
                        failed.push(extensionInfo.id);
                    }
                }));
            }
            if (failed.length) {
                throw new Error((0, nls_1.localize)('installation failed', "Failed Installing Extensions: {0}", failed.join(', ')));
            }
        }
        async installVSIX(vsix, installOptions, force, output) {
            const manifest = await this.extensionManagementService.getManifest(vsix);
            if (!manifest) {
                throw new Error('Invalid vsix');
            }
            const valid = await this.validateVSIX(manifest, force, output);
            if (valid) {
                try {
                    await this.extensionManagementService.install(vsix, installOptions);
                    output.log((0, nls_1.localize)('successVsixInstall', "Extension '{0}' was successfully installed.", (0, labels_1.getBaseLabel)(vsix)));
                    return manifest;
                }
                catch (error) {
                    if ((0, errors_1.isCancellationError)(error)) {
                        output.log((0, nls_1.localize)('cancelVsixInstall', "Cancelled installing extension '{0}'.", (0, labels_1.getBaseLabel)(vsix)));
                        return null;
                    }
                    else {
                        throw error;
                    }
                }
            }
            return null;
        }
        async getGalleryExtensions(extensions) {
            const galleryExtensions = new Map();
            const preRelease = extensions.some(e => e.installOptions.installPreReleaseVersion);
            const result = await this.extensionGalleryService.getExtensions(extensions.map(e => (Object.assign(Object.assign({}, e), { preRelease }))), cancellation_1.CancellationToken.None);
            for (const extension of result) {
                galleryExtensions.set(extension.identifier.id.toLowerCase(), extension);
            }
            return galleryExtensions;
        }
        async installFromGallery({ id, version, installOptions }, galleryExtension, installed, force, output) {
            const manifest = await this.extensionGalleryService.getManifest(galleryExtension, cancellation_1.CancellationToken.None);
            if (manifest && !this.validateExtensionKind(manifest, output)) {
                return null;
            }
            const installedExtension = installed.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, galleryExtension.identifier));
            if (installedExtension) {
                if (galleryExtension.version === installedExtension.manifest.version) {
                    output.log((0, nls_1.localize)('alreadyInstalled', "Extension '{0}' is already installed.", version ? `${id}@${version}` : id));
                    return null;
                }
                output.log((0, nls_1.localize)('updateMessage', "Updating the extension '{0}' to the version {1}", id, galleryExtension.version));
            }
            try {
                if (installOptions.isBuiltin) {
                    output.log(version ? (0, nls_1.localize)('installing builtin with version', "Installing builtin extension '{0}' v{1}...", id, version) : (0, nls_1.localize)('installing builtin ', "Installing builtin extension '{0}'...", id));
                }
                else {
                    output.log(version ? (0, nls_1.localize)('installing with version', "Installing extension '{0}' v{1}...", id, version) : (0, nls_1.localize)('installing', "Installing extension '{0}'...", id));
                }
                await this.extensionManagementService.installFromGallery(galleryExtension, Object.assign(Object.assign({}, installOptions), { installGivenVersion: !!version }));
                output.log((0, nls_1.localize)('successInstall', "Extension '{0}' v{1} was successfully installed.", id, galleryExtension.version));
                return manifest;
            }
            catch (error) {
                if ((0, errors_1.isCancellationError)(error)) {
                    output.log((0, nls_1.localize)('cancelInstall', "Cancelled installing extension '{0}'.", id));
                    return null;
                }
                else {
                    throw error;
                }
            }
        }
        validateExtensionKind(_manifest, output) {
            return true;
        }
        async validateVSIX(manifest, force, output) {
            const extensionIdentifier = { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name) };
            const installedExtensions = await this.extensionManagementService.getInstalled(1 /* ExtensionType.User */);
            const newer = installedExtensions.find(local => (0, extensionManagementUtil_1.areSameExtensions)(extensionIdentifier, local.identifier) && (0, semver_1.gt)(local.manifest.version, manifest.version));
            if (newer && !force) {
                output.log((0, nls_1.localize)('forceDowngrade', "A newer version of extension '{0}' v{1} is already installed. Use '--force' option to downgrade to older version.", newer.identifier.id, newer.manifest.version, manifest.version));
                return false;
            }
            return this.validateExtensionKind(manifest, output);
        }
        async uninstallExtensions(extensions, force, output = console) {
            const getExtensionId = async (extensionDescription) => {
                if (extensionDescription instanceof uri_1.URI) {
                    const manifest = await this.extensionManagementService.getManifest(extensionDescription);
                    return getId(manifest);
                }
                return extensionDescription;
            };
            const uninstalledExtensions = [];
            for (const extension of extensions) {
                const id = await getExtensionId(extension);
                const installed = await this.extensionManagementService.getInstalled();
                const extensionsToUninstall = installed.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id }));
                if (!extensionsToUninstall.length) {
                    throw new Error(`${this.notInstalled(id)}\n${useId}`);
                }
                if (extensionsToUninstall.some(e => e.type === 0 /* ExtensionType.System */)) {
                    output.log((0, nls_1.localize)('builtin', "Extension '{0}' is a Built-in extension and cannot be uninstalled", id));
                    return;
                }
                if (!force && extensionsToUninstall.some(e => e.isBuiltin)) {
                    output.log((0, nls_1.localize)('forceUninstall', "Extension '{0}' is marked as a Built-in extension by user. Please use '--force' option to uninstall it.", id));
                    return;
                }
                output.log((0, nls_1.localize)('uninstalling', "Uninstalling {0}...", id));
                for (const extensionToUninstall of extensionsToUninstall) {
                    await this.extensionManagementService.uninstall(extensionToUninstall);
                    uninstalledExtensions.push(extensionToUninstall);
                }
                if (this.location) {
                    output.log((0, nls_1.localize)('successUninstallFromLocation', "Extension '{0}' was successfully uninstalled from {1}!", id, this.location));
                }
                else {
                    output.log((0, nls_1.localize)('successUninstall', "Extension '{0}' was successfully uninstalled!", id));
                }
            }
        }
        async locateExtension(extensions, output = console) {
            const installed = await this.extensionManagementService.getInstalled();
            extensions.forEach(e => {
                installed.forEach(i => {
                    if (i.identifier.id === e) {
                        if (i.location.scheme === network_1.Schemas.file) {
                            output.log(i.location.fsPath);
                            return;
                        }
                    }
                });
            });
        }
        notInstalled(id) {
            return this.location ? (0, nls_1.localize)('notInstalleddOnLocation', "Extension '{0}' is not installed on {1}.", id, this.location) : (0, nls_1.localize)('notInstalled', "Extension '{0}' is not installed.", id);
        }
    };
    ExtensionManagementCLIService = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, extensionManagement_1.IExtensionGalleryService)
    ], ExtensionManagementCLIService);
    exports.ExtensionManagementCLIService = ExtensionManagementCLIService;
});
//# sourceMappingURL=extensionManagementCLIService.js.map