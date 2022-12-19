/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensions/common/extensions", "vs/base/common/platform", "vs/base/common/uri", "vs/base/common/errors", "vs/base/common/process"], function (require, exports, strings_1, extensionManagement_1, extensions_1, platform_1, uri_1, errors_1, process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.computeTargetPlatform = exports.isAlpineLinux = exports.getExtensionDependencies = exports.getMaliciousExtensionsSet = exports.BetterMergeId = exports.getGalleryExtensionTelemetryData = exports.getLocalExtensionTelemetryData = exports.groupByExtension = exports.getGalleryExtensionId = exports.adoptToGalleryExtensionId = exports.getExtensionId = exports.getIdAndVersion = exports.ExtensionKey = exports.areSameExtensions = void 0;
    function areSameExtensions(a, b) {
        if (a.uuid && b.uuid) {
            return a.uuid === b.uuid;
        }
        if (a.id === b.id) {
            return true;
        }
        return (0, strings_1.compareIgnoreCase)(a.id, b.id) === 0;
    }
    exports.areSameExtensions = areSameExtensions;
    const ExtensionKeyRegex = /^([^.]+\..+)-(\d+\.\d+\.\d+)(-(.+))?$/;
    class ExtensionKey {
        constructor(identifier, version, targetPlatform = "undefined" /* TargetPlatform.UNDEFINED */) {
            this.version = version;
            this.targetPlatform = targetPlatform;
            this.id = identifier.id;
        }
        static create(extension) {
            const version = extension.manifest ? extension.manifest.version : extension.version;
            const targetPlatform = extension.manifest ? extension.targetPlatform : extension.properties.targetPlatform;
            return new ExtensionKey(extension.identifier, version, targetPlatform);
        }
        static parse(key) {
            const matches = ExtensionKeyRegex.exec(key);
            return matches && matches[1] && matches[2] ? new ExtensionKey({ id: matches[1] }, matches[2], matches[4] || undefined) : null;
        }
        toString() {
            return `${this.id}-${this.version}${this.targetPlatform !== "undefined" /* TargetPlatform.UNDEFINED */ ? `-${this.targetPlatform}` : ''}`;
        }
        equals(o) {
            if (!(o instanceof ExtensionKey)) {
                return false;
            }
            return areSameExtensions(this, o) && this.version === o.version && this.targetPlatform === o.targetPlatform;
        }
    }
    exports.ExtensionKey = ExtensionKey;
    const EXTENSION_IDENTIFIER_WITH_VERSION_REGEX = /^([^.]+\..+)@((prerelease)|(\d+\.\d+\.\d+(-.*)?))$/;
    function getIdAndVersion(id) {
        const matches = EXTENSION_IDENTIFIER_WITH_VERSION_REGEX.exec(id);
        if (matches && matches[1]) {
            return [adoptToGalleryExtensionId(matches[1]), matches[2]];
        }
        return [adoptToGalleryExtensionId(id), undefined];
    }
    exports.getIdAndVersion = getIdAndVersion;
    function getExtensionId(publisher, name) {
        return `${publisher}.${name}`;
    }
    exports.getExtensionId = getExtensionId;
    function adoptToGalleryExtensionId(id) {
        return id.toLocaleLowerCase();
    }
    exports.adoptToGalleryExtensionId = adoptToGalleryExtensionId;
    function getGalleryExtensionId(publisher, name) {
        return adoptToGalleryExtensionId(getExtensionId(publisher, name));
    }
    exports.getGalleryExtensionId = getGalleryExtensionId;
    function groupByExtension(extensions, getExtensionIdentifier) {
        const byExtension = [];
        const findGroup = (extension) => {
            for (const group of byExtension) {
                if (group.some(e => areSameExtensions(getExtensionIdentifier(e), getExtensionIdentifier(extension)))) {
                    return group;
                }
            }
            return null;
        };
        for (const extension of extensions) {
            const group = findGroup(extension);
            if (group) {
                group.push(extension);
            }
            else {
                byExtension.push([extension]);
            }
        }
        return byExtension;
    }
    exports.groupByExtension = groupByExtension;
    function getLocalExtensionTelemetryData(extension) {
        return {
            id: extension.identifier.id,
            name: extension.manifest.name,
            galleryId: null,
            publisherId: extension.publisherId,
            publisherName: extension.manifest.publisher,
            publisherDisplayName: extension.publisherDisplayName,
            dependencies: extension.manifest.extensionDependencies && extension.manifest.extensionDependencies.length > 0
        };
    }
    exports.getLocalExtensionTelemetryData = getLocalExtensionTelemetryData;
    /* __GDPR__FRAGMENT__
        "GalleryExtensionTelemetryData" : {
            "id" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "name": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "galleryId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "publisherId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "publisherName": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "publisherDisplayName": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "isPreReleaseVersion": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "dependencies": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
            "${include}": [
                "${GalleryExtensionTelemetryData2}"
            ]
        }
    */
    function getGalleryExtensionTelemetryData(extension) {
        return Object.assign({ id: extension.identifier.id, name: extension.name, galleryId: extension.identifier.uuid, publisherId: extension.publisherId, publisherName: extension.publisher, publisherDisplayName: extension.publisherDisplayName, isPreReleaseVersion: extension.properties.isPreReleaseVersion, dependencies: !!(extension.properties.dependencies && extension.properties.dependencies.length > 0) }, extension.telemetryData);
    }
    exports.getGalleryExtensionTelemetryData = getGalleryExtensionTelemetryData;
    exports.BetterMergeId = new extensions_1.ExtensionIdentifier('pprice.better-merge');
    function getMaliciousExtensionsSet(manifest) {
        const result = new Set();
        if (manifest.malicious) {
            for (const extension of manifest.malicious) {
                result.add(extension.id);
            }
        }
        return result;
    }
    exports.getMaliciousExtensionsSet = getMaliciousExtensionsSet;
    function getExtensionDependencies(installedExtensions, extension) {
        var _a, _b, _c, _d;
        const dependencies = [];
        const extensions = (_b = (_a = extension.manifest.extensionDependencies) === null || _a === void 0 ? void 0 : _a.slice(0)) !== null && _b !== void 0 ? _b : [];
        while (extensions.length) {
            const id = extensions.shift();
            if (id && dependencies.every(e => !areSameExtensions(e.identifier, { id }))) {
                const ext = installedExtensions.filter(e => areSameExtensions(e.identifier, { id }));
                if (ext.length === 1) {
                    dependencies.push(ext[0]);
                    extensions.push(...(_d = (_c = ext[0].manifest.extensionDependencies) === null || _c === void 0 ? void 0 : _c.slice(0)) !== null && _d !== void 0 ? _d : []);
                }
            }
        }
        return dependencies;
    }
    exports.getExtensionDependencies = getExtensionDependencies;
    async function isAlpineLinux(fileService, logService) {
        if (!platform_1.isLinux) {
            return false;
        }
        let content;
        try {
            const fileContent = await fileService.readFile(uri_1.URI.file('/etc/os-release'));
            content = fileContent.value.toString();
        }
        catch (error) {
            try {
                const fileContent = await fileService.readFile(uri_1.URI.file('/usr/lib/os-release'));
                content = fileContent.value.toString();
            }
            catch (error) {
                /* Ignore */
                logService.debug(`Error while getting the os-release file.`, (0, errors_1.getErrorMessage)(error));
            }
        }
        return !!content && (content.match(/^ID=([^\u001b\r\n]*)/m) || [])[1] === 'alpine';
    }
    exports.isAlpineLinux = isAlpineLinux;
    async function computeTargetPlatform(fileService, logService) {
        const alpineLinux = await isAlpineLinux(fileService, logService);
        const targetPlatform = (0, extensionManagement_1.getTargetPlatform)(alpineLinux ? 'alpine' : platform_1.platform, process_1.arch);
        logService.debug('ComputeTargetPlatform:', targetPlatform);
        return targetPlatform;
    }
    exports.computeTargetPlatform = computeTargetPlatform;
});
//# sourceMappingURL=extensionManagementUtil.js.map