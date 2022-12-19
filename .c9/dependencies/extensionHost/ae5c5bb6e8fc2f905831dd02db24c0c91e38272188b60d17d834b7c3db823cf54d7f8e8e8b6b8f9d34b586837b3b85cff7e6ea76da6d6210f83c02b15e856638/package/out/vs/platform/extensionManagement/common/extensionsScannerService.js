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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/objects", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/json", "vs/base/common/jsonErrorMessages", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/semver/semver", "vs/base/common/severity", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensions/common/extensions", "vs/platform/extensions/common/extensionValidator", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/base/common/event", "vs/base/common/marshalling"], function (require, exports, arrays_1, async_1, objects, buffer_1, errors_1, json_1, jsonErrorMessages_1, lifecycle_1, network_1, path, platform, resources_1, semver, severity_1, types_1, uri_1, nls_1, environment_1, extensionManagementUtil_1, extensions_1, extensionValidator_1, files_1, instantiation_1, log_1, productService_1, event_1, marshalling_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeExtensionsScannerService = exports.toExtensionDescription = exports.AbstractExtensionsScannerService = exports.IExtensionsScannerService = exports.Translations = void 0;
    var Translations;
    (function (Translations) {
        function equals(a, b) {
            if (a === b) {
                return true;
            }
            let aKeys = Object.keys(a);
            let bKeys = new Set();
            for (let key of Object.keys(b)) {
                bKeys.add(key);
            }
            if (aKeys.length !== bKeys.size) {
                return false;
            }
            for (let key of aKeys) {
                if (a[key] !== b[key]) {
                    return false;
                }
                bKeys.delete(key);
            }
            return bKeys.size === 0;
        }
        Translations.equals = equals;
    })(Translations = exports.Translations || (exports.Translations = {}));
    exports.IExtensionsScannerService = (0, instantiation_1.createDecorator)('IExtensionsScannerService');
    let AbstractExtensionsScannerService = class AbstractExtensionsScannerService extends lifecycle_1.Disposable {
        constructor(systemExtensionsLocation, userExtensionsLocation, extensionsControlLocation, cacheLocation, fileService, logService, environmentService, productService) {
            super();
            this.systemExtensionsLocation = systemExtensionsLocation;
            this.userExtensionsLocation = userExtensionsLocation;
            this.extensionsControlLocation = extensionsControlLocation;
            this.cacheLocation = cacheLocation;
            this.fileService = fileService;
            this.logService = logService;
            this.environmentService = environmentService;
            this.productService = productService;
            this._onDidChangeCache = this._register(new event_1.Emitter());
            this.onDidChangeCache = this._onDidChangeCache.event;
            this.systemExtensionsCachedScanner = this._register(new CachedExtensionsScanner((0, resources_1.joinPath)(this.cacheLocation, extensions_1.BUILTIN_MANIFEST_CACHE_FILE), this.fileService, this.logService));
            this.userExtensionsCachedScanner = this._register(new CachedExtensionsScanner((0, resources_1.joinPath)(this.cacheLocation, extensions_1.USER_MANIFEST_CACHE_FILE), this.fileService, this.logService));
            this.extensionsScanner = this._register(new ExtensionsScanner(this.fileService, this.logService));
            this._register(this.systemExtensionsCachedScanner.onDidChangeCache(() => this._onDidChangeCache.fire(0 /* ExtensionType.System */)));
            this._register(this.userExtensionsCachedScanner.onDidChangeCache(() => this._onDidChangeCache.fire(1 /* ExtensionType.User */)));
        }
        getTargetPlatform() {
            if (!this._targetPlatformPromise) {
                this._targetPlatformPromise = (0, extensionManagementUtil_1.computeTargetPlatform)(this.fileService, this.logService);
            }
            return this._targetPlatformPromise;
        }
        async scanAllExtensions(scanOptions) {
            const [system, user, development] = await Promise.all([
                this.scanSystemExtensions(scanOptions),
                this.scanUserExtensions(scanOptions),
                this.scanExtensionsUnderDevelopment(scanOptions),
            ]);
            return this.dedupExtensions([...system, ...user, ...development], await this.getTargetPlatform(), true);
        }
        async scanSystemExtensions(scanOptions) {
            const promises = [];
            promises.push(this.scanDefaultSystemExtensions(!!scanOptions.useCache, scanOptions.language));
            promises.push(this.scanDevSystemExtensions(scanOptions.language, !!scanOptions.checkControlFile));
            const [defaultSystemExtensions, devSystemExtensions] = await Promise.all(promises);
            return this.applyScanOptions([...defaultSystemExtensions, ...devSystemExtensions], scanOptions, false);
        }
        async scanUserExtensions(scanOptions) {
            this.logService.trace('Started scanning user extensions');
            const extensionsScannerInput = await this.createExtensionScannerInput(this.userExtensionsLocation, 1 /* ExtensionType.User */, !scanOptions.includeUninstalled, scanOptions.language);
            const extensionsScanner = scanOptions.useCache && !extensionsScannerInput.devMode && extensionsScannerInput.excludeObsolete ? this.userExtensionsCachedScanner : this.extensionsScanner;
            let extensions = await extensionsScanner.scanExtensions(extensionsScannerInput);
            extensions = await this.applyScanOptions(extensions, scanOptions, true);
            this.logService.trace('Scanned user extensions:', extensions.length);
            return extensions;
        }
        async scanExtensionsUnderDevelopment(scanOptions) {
            if (this.environmentService.isExtensionDevelopment && this.environmentService.extensionDevelopmentLocationURI) {
                const extensions = (await Promise.all(this.environmentService.extensionDevelopmentLocationURI.filter(extLoc => extLoc.scheme === network_1.Schemas.file)
                    .map(async (extensionDevelopmentLocationURI) => this.extensionsScanner.scanOneOrMultipleExtensions((await this.createExtensionScannerInput(extensionDevelopmentLocationURI, 1 /* ExtensionType.User */, true, scanOptions.language))))))
                    .flat();
                return this.applyScanOptions(extensions, scanOptions, true);
            }
            return [];
        }
        async scanExistingExtension(extensionLocation, extensionType, scanOptions) {
            const extensionsScannerInput = await this.createExtensionScannerInput(extensionLocation, extensionType, true, scanOptions.language);
            const extension = await this.extensionsScanner.scanExtension(extensionsScannerInput);
            if (!extension) {
                return null;
            }
            if (!scanOptions.includeInvalid && !extension.isValid) {
                return null;
            }
            return extension;
        }
        async scanOneOrMultipleExtensions(extensionLocation, extensionType, scanOptions) {
            const extensionsScannerInput = await this.createExtensionScannerInput(extensionLocation, extensionType, true, scanOptions.language);
            const extensions = await this.extensionsScanner.scanOneOrMultipleExtensions(extensionsScannerInput);
            return this.applyScanOptions(extensions, scanOptions, true);
        }
        async updateMetadata(extensionLocation, metaData) {
            const manifestLocation = (0, resources_1.joinPath)(extensionLocation, 'package.json');
            const content = (await this.fileService.readFile(manifestLocation)).value.toString();
            const manifest = JSON.parse(content);
            // unset if false
            metaData.isMachineScoped = metaData.isMachineScoped || undefined;
            metaData.isBuiltin = metaData.isBuiltin || undefined;
            metaData.installedTimestamp = metaData.installedTimestamp || undefined;
            manifest.__metadata = Object.assign(Object.assign({}, manifest.__metadata), metaData);
            await this.fileService.writeFile((0, resources_1.joinPath)(extensionLocation, 'package.json'), buffer_1.VSBuffer.fromString(JSON.stringify(manifest, null, '\t')));
        }
        async applyScanOptions(extensions, scanOptions, pickLatest) {
            if (!scanOptions.includeAllVersions) {
                extensions = this.dedupExtensions(extensions, await this.getTargetPlatform(), pickLatest);
            }
            if (!scanOptions.includeInvalid) {
                extensions = extensions.filter(extension => extension.isValid);
            }
            return extensions.sort((a, b) => {
                const aLastSegment = path.basename(a.location.fsPath);
                const bLastSegment = path.basename(b.location.fsPath);
                if (aLastSegment < bLastSegment) {
                    return -1;
                }
                if (aLastSegment > bLastSegment) {
                    return 1;
                }
                return 0;
            });
        }
        dedupExtensions(extensions, targetPlatform, pickLatest) {
            const result = new Map();
            for (const extension of extensions) {
                const extensionKey = extensions_1.ExtensionIdentifier.toKey(extension.identifier.id);
                const existing = result.get(extensionKey);
                if (existing) {
                    if (existing.isValid && !extension.isValid) {
                        continue;
                    }
                    if (existing.isValid === extension.isValid) {
                        if (pickLatest && semver.gt(existing.manifest.version, extension.manifest.version)) {
                            this.logService.debug(`Skipping extension ${extension.location.path} with lower version ${extension.manifest.version}.`);
                            continue;
                        }
                        if (semver.eq(existing.manifest.version, extension.manifest.version) && existing.targetPlatform === targetPlatform) {
                            this.logService.debug(`Skipping extension ${extension.location.path} from different target platform ${extension.targetPlatform}`);
                            continue;
                        }
                    }
                    if (existing.type === 0 /* ExtensionType.System */) {
                        this.logService.debug(`Overwriting system extension ${existing.location.path} with ${extension.location.path}.`);
                    }
                    else {
                        this.logService.warn(`Overwriting user extension ${existing.location.path} with ${extension.location.path}.`);
                    }
                }
                result.set(extensionKey, extension);
            }
            return [...result.values()];
        }
        async scanDefaultSystemExtensions(useCache, language) {
            this.logService.trace('Started scanning system extensions');
            const extensionsScannerInput = await this.createExtensionScannerInput(this.systemExtensionsLocation, 0 /* ExtensionType.System */, true, language);
            const extensionsScanner = useCache && !extensionsScannerInput.devMode ? this.systemExtensionsCachedScanner : this.extensionsScanner;
            const result = await extensionsScanner.scanExtensions(extensionsScannerInput);
            this.logService.trace('Scanned system extensions:', result.length);
            return result;
        }
        async scanDevSystemExtensions(language, checkControlFile) {
            const devSystemExtensionsList = this.environmentService.isBuilt ? [] : this.productService.builtInExtensions;
            if (!(devSystemExtensionsList === null || devSystemExtensionsList === void 0 ? void 0 : devSystemExtensionsList.length)) {
                return [];
            }
            this.logService.trace('Started scanning dev system extensions');
            const builtinExtensionControl = checkControlFile ? await this.getBuiltInExtensionControl() : {};
            const devSystemExtensionsLocations = [];
            const devSystemExtensionsLocation = uri_1.URI.file(path.normalize(path.join(network_1.FileAccess.asFileUri('', require).fsPath, '..', '.build', 'builtInExtensions')));
            for (const extension of devSystemExtensionsList) {
                const controlState = builtinExtensionControl[extension.name] || 'marketplace';
                switch (controlState) {
                    case 'disabled':
                        break;
                    case 'marketplace':
                        devSystemExtensionsLocations.push((0, resources_1.joinPath)(devSystemExtensionsLocation, extension.name));
                        break;
                    default:
                        devSystemExtensionsLocations.push(uri_1.URI.file(controlState));
                        break;
                }
            }
            const result = await Promise.all(devSystemExtensionsLocations.map(async (location) => this.extensionsScanner.scanExtension((await this.createExtensionScannerInput(location, 0 /* ExtensionType.System */, true, language)))));
            this.logService.trace('Scanned dev system extensions:', result.length);
            return (0, arrays_1.coalesce)(result);
        }
        async getBuiltInExtensionControl() {
            try {
                const content = await this.fileService.readFile(this.extensionsControlLocation);
                return JSON.parse(content.value.toString());
            }
            catch (error) {
                return {};
            }
        }
        async createExtensionScannerInput(location, type, excludeObsolete, language) {
            const translations = await this.getTranslations(language !== null && language !== void 0 ? language : platform.language);
            let mtime;
            try {
                const folderStat = await this.fileService.stat(location);
                if (typeof folderStat.mtime === 'number') {
                    mtime = folderStat.mtime;
                }
            }
            catch (err) {
                // That's ok...
            }
            return new ExtensionScannerInput(location, mtime, type, excludeObsolete, this.productService.version, this.productService.date, this.productService.commit, !this.environmentService.isBuilt, language, translations);
        }
    };
    AbstractExtensionsScannerService = __decorate([
        __param(4, files_1.IFileService),
        __param(5, log_1.ILogService),
        __param(6, environment_1.IEnvironmentService),
        __param(7, productService_1.IProductService)
    ], AbstractExtensionsScannerService);
    exports.AbstractExtensionsScannerService = AbstractExtensionsScannerService;
    class ExtensionScannerInput {
        constructor(location, mtime, type, excludeObsolete, productVersion, productDate, productCommit, devMode, language, translations) {
            this.location = location;
            this.mtime = mtime;
            this.type = type;
            this.excludeObsolete = excludeObsolete;
            this.productVersion = productVersion;
            this.productDate = productDate;
            this.productCommit = productCommit;
            this.devMode = devMode;
            this.language = language;
            this.translations = translations;
            // Keep empty!! (JSON.parse)
        }
        static createNlsConfiguration(input) {
            return {
                language: input.language,
                pseudo: input.language === 'pseudo',
                devMode: input.devMode,
                translations: input.translations
            };
        }
        static equals(a, b) {
            return ((0, resources_1.isEqual)(a.location, b.location)
                && a.mtime === b.mtime
                && a.type === b.type
                && a.excludeObsolete === b.excludeObsolete
                && a.productVersion === b.productVersion
                && a.productDate === b.productDate
                && a.productCommit === b.productCommit
                && a.devMode === b.devMode
                && a.language === b.language
                && Translations.equals(a.translations, b.translations));
        }
    }
    class ExtensionsScanner extends lifecycle_1.Disposable {
        constructor(fileService, logService) {
            super();
            this.fileService = fileService;
            this.logService = logService;
        }
        async scanExtensions(input) {
            const stat = await this.fileService.resolve(input.location);
            if (stat.children) {
                let obsolete = {};
                if (input.excludeObsolete && input.type === 1 /* ExtensionType.User */) {
                    try {
                        const raw = (await this.fileService.readFile((0, resources_1.joinPath)(input.location, '.obsolete'))).value.toString();
                        obsolete = JSON.parse(raw);
                    }
                    catch (error) { /* ignore */ }
                }
                const extensions = await Promise.all(stat.children.map(async (c) => {
                    if (!c.isDirectory) {
                        return null;
                    }
                    // Do not consider user extension folder starting with `.`
                    if (input.type === 1 /* ExtensionType.User */ && (0, resources_1.basename)(c.resource).indexOf('.') === 0) {
                        return null;
                    }
                    const extensionScannerInput = new ExtensionScannerInput(c.resource, input.mtime, input.type, input.excludeObsolete, input.productVersion, input.productDate, input.productCommit, input.devMode, input.language, input.translations);
                    const extension = await this.scanExtension(extensionScannerInput);
                    return extension && !obsolete[extensionManagementUtil_1.ExtensionKey.create(extension).toString()] ? extension : null;
                }));
                return (0, arrays_1.coalesce)(extensions);
            }
            return [];
        }
        async scanOneOrMultipleExtensions(input) {
            try {
                if (await this.fileService.exists((0, resources_1.joinPath)(input.location, 'package.json'))) {
                    const extension = await this.scanExtension(input);
                    return extension ? [extension] : [];
                }
                else {
                    return await this.scanExtensions(input);
                }
            }
            catch (error) {
                this.logService.error(`Error scanning extensions at ${input.location.path}:`, (0, errors_1.getErrorMessage)(error));
                return [];
            }
        }
        async scanExtension(input) {
            var _a;
            try {
                let manifest = await this.scanExtensionManifest(input.location);
                if (manifest) {
                    // allow publisher to be undefined to make the initial extension authoring experience smoother
                    if (!manifest.publisher) {
                        manifest.publisher = extensions_1.UNDEFINED_PUBLISHER;
                    }
                    const metadata = manifest.__metadata;
                    delete manifest.__metadata;
                    const id = (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name);
                    const identifier = (metadata === null || metadata === void 0 ? void 0 : metadata.id) ? { id, uuid: metadata.id } : { id };
                    const type = (metadata === null || metadata === void 0 ? void 0 : metadata.isSystem) ? 0 /* ExtensionType.System */ : input.type;
                    const isBuiltin = type === 0 /* ExtensionType.System */ || !!(metadata === null || metadata === void 0 ? void 0 : metadata.isBuiltin);
                    const validations = (0, extensionValidator_1.validateExtensionManifest)(input.productVersion, input.productDate, input.location, manifest, isBuiltin);
                    let isValid = true;
                    for (const [severity, message] of validations) {
                        if (severity === severity_1.default.Error) {
                            isValid = false;
                            this.logService.error(this.formatMessage(input.location, message));
                        }
                    }
                    manifest = await this.translateManifest(input.location, manifest, ExtensionScannerInput.createNlsConfiguration(input));
                    return {
                        type,
                        identifier,
                        manifest,
                        location: input.location,
                        isBuiltin,
                        targetPlatform: (_a = metadata === null || metadata === void 0 ? void 0 : metadata.targetPlatform) !== null && _a !== void 0 ? _a : "undefined" /* TargetPlatform.UNDEFINED */,
                        metadata,
                        isValid,
                        validations
                    };
                }
            }
            catch (e) {
                if (input.type !== 0 /* ExtensionType.System */) {
                    this.logService.error(e);
                }
            }
            return null;
        }
        async scanExtensionManifest(extensionLocation) {
            const manifestLocation = (0, resources_1.joinPath)(extensionLocation, 'package.json');
            let content;
            try {
                content = (await this.fileService.readFile(manifestLocation)).value.toString();
            }
            catch (error) {
                if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    this.logService.error(this.formatMessage(extensionLocation, (0, nls_1.localize)('fileReadFail', "Cannot read file {0}: {1}.", manifestLocation.path, error.message)));
                }
                return null;
            }
            let manifest;
            try {
                manifest = JSON.parse(content);
            }
            catch (err) {
                // invalid JSON, let's get good errors
                const errors = [];
                (0, json_1.parse)(content, errors);
                for (const e of errors) {
                    this.logService.error(this.formatMessage(extensionLocation, (0, nls_1.localize)('jsonParseFail', "Failed to parse {0}: [{1}, {2}] {3}.", manifestLocation.path, e.offset, e.length, (0, jsonErrorMessages_1.getParseErrorMessage)(e.error))));
                }
                return null;
            }
            if ((0, json_1.getNodeType)(manifest) !== 'object') {
                this.logService.error(this.formatMessage(extensionLocation, (0, nls_1.localize)('jsonParseInvalidType', "Invalid manifest file {0}: Not an JSON object.", manifestLocation.path)));
                return null;
            }
            return manifest;
        }
        async translateManifest(extensionLocation, extensionManifest, nlsConfiguration) {
            var _a;
            const localizedMessages = await this.getLocalizedMessages(extensionLocation, extensionManifest, nlsConfiguration);
            if (localizedMessages) {
                try {
                    const errors = [];
                    // resolveOriginalMessageBundle returns null if localizedMessages.default === undefined;
                    const defaults = await this.resolveOriginalMessageBundle(localizedMessages.default, errors);
                    if (errors.length > 0) {
                        errors.forEach((error) => {
                            var _a;
                            this.logService.error(this.formatMessage(extensionLocation, (0, nls_1.localize)('jsonsParseReportErrors', "Failed to parse {0}: {1}.", (_a = localizedMessages.default) === null || _a === void 0 ? void 0 : _a.path, (0, jsonErrorMessages_1.getParseErrorMessage)(error.error))));
                        });
                        return extensionManifest;
                    }
                    else if ((0, json_1.getNodeType)(localizedMessages) !== 'object') {
                        this.logService.error(this.formatMessage(extensionLocation, (0, nls_1.localize)('jsonInvalidFormat', "Invalid format {0}: JSON object expected.", (_a = localizedMessages.default) === null || _a === void 0 ? void 0 : _a.path)));
                        return extensionManifest;
                    }
                    const localized = localizedMessages.values || Object.create(null);
                    this.replaceNLStrings(nlsConfiguration.pseudo, extensionManifest, localized, defaults, extensionLocation);
                }
                catch (error) {
                    /*Ignore Error*/
                }
            }
            return extensionManifest;
        }
        async getLocalizedMessages(extensionLocation, extensionManifest, nlsConfiguration) {
            const defaultPackageNLS = (0, resources_1.joinPath)(extensionLocation, 'package.nls.json');
            const reportErrors = (localized, errors) => {
                errors.forEach((error) => {
                    this.logService.error(this.formatMessage(extensionLocation, (0, nls_1.localize)('jsonsParseReportErrors', "Failed to parse {0}: {1}.", localized === null || localized === void 0 ? void 0 : localized.path, (0, jsonErrorMessages_1.getParseErrorMessage)(error.error))));
                });
            };
            const reportInvalidFormat = (localized) => {
                this.logService.error(this.formatMessage(extensionLocation, (0, nls_1.localize)('jsonInvalidFormat', "Invalid format {0}: JSON object expected.", localized === null || localized === void 0 ? void 0 : localized.path)));
            };
            const translationId = `${extensionManifest.publisher}.${extensionManifest.name}`;
            const translationPath = nlsConfiguration.translations[translationId];
            if (translationPath) {
                try {
                    const translationResource = uri_1.URI.file(translationPath);
                    const content = (await this.fileService.readFile(translationResource)).value.toString();
                    let errors = [];
                    let translationBundle = (0, json_1.parse)(content, errors);
                    if (errors.length > 0) {
                        reportErrors(translationResource, errors);
                        return { values: undefined, default: defaultPackageNLS };
                    }
                    else if ((0, json_1.getNodeType)(translationBundle) !== 'object') {
                        reportInvalidFormat(translationResource);
                        return { values: undefined, default: defaultPackageNLS };
                    }
                    else {
                        let values = translationBundle.contents ? translationBundle.contents.package : undefined;
                        return { values: values, default: defaultPackageNLS };
                    }
                }
                catch (error) {
                    return { values: undefined, default: defaultPackageNLS };
                }
            }
            else {
                const exists = await this.fileService.exists(defaultPackageNLS);
                if (!exists) {
                    return undefined;
                }
                let messageBundle;
                try {
                    messageBundle = await this.findMessageBundles(extensionLocation, nlsConfiguration);
                }
                catch (error) {
                    return undefined;
                }
                if (!messageBundle.localized) {
                    return { values: undefined, default: messageBundle.original };
                }
                try {
                    const messageBundleContent = (await this.fileService.readFile(messageBundle.localized)).value.toString();
                    let errors = [];
                    let messages = (0, json_1.parse)(messageBundleContent, errors);
                    if (errors.length > 0) {
                        reportErrors(messageBundle.localized, errors);
                        return { values: undefined, default: messageBundle.original };
                    }
                    else if ((0, json_1.getNodeType)(messages) !== 'object') {
                        reportInvalidFormat(messageBundle.localized);
                        return { values: undefined, default: messageBundle.original };
                    }
                    return { values: messages, default: messageBundle.original };
                }
                catch (error) {
                    return { values: undefined, default: messageBundle.original };
                }
            }
        }
        /**
         * Parses original message bundle, returns null if the original message bundle is null.
         */
        async resolveOriginalMessageBundle(originalMessageBundle, errors) {
            if (originalMessageBundle) {
                try {
                    const originalBundleContent = (await this.fileService.readFile(originalMessageBundle)).value.toString();
                    return (0, json_1.parse)(originalBundleContent, errors);
                }
                catch (error) {
                    /* Ignore Error */
                    return null;
                }
            }
            else {
                return null;
            }
        }
        /**
         * Finds localized message bundle and the original (unlocalized) one.
         * If the localized file is not present, returns null for the original and marks original as localized.
         */
        findMessageBundles(extensionLocation, nlsConfiguration) {
            return new Promise((c, e) => {
                const loop = (locale) => {
                    let toCheck = (0, resources_1.joinPath)(extensionLocation, `package.nls.${locale}.json`);
                    this.fileService.exists(toCheck).then(exists => {
                        if (exists) {
                            c({ localized: toCheck, original: (0, resources_1.joinPath)(extensionLocation, 'package.nls.json') });
                        }
                        let index = locale.lastIndexOf('-');
                        if (index === -1) {
                            c({ localized: (0, resources_1.joinPath)(extensionLocation, 'package.nls.json'), original: null });
                        }
                        else {
                            locale = locale.substring(0, index);
                            loop(locale);
                        }
                    });
                };
                if (nlsConfiguration.devMode || nlsConfiguration.pseudo || !nlsConfiguration.language) {
                    return c({ localized: (0, resources_1.joinPath)(extensionLocation, 'package.nls.json'), original: null });
                }
                loop(nlsConfiguration.language);
            });
        }
        /**
         * This routine makes the following assumptions:
         * The root element is an object literal
         */
        replaceNLStrings(pseudo, literal, messages, originalMessages, extensionLocation) {
            const processEntry = (obj, key, command) => {
                const value = obj[key];
                if ((0, types_1.isString)(value)) {
                    const str = value;
                    const length = str.length;
                    if (length > 1 && str[0] === '%' && str[length - 1] === '%') {
                        const messageKey = str.substr(1, length - 2);
                        let translated = messages[messageKey];
                        // If the messages come from a language pack they might miss some keys
                        // Fill them from the original messages.
                        if (translated === undefined && originalMessages) {
                            translated = originalMessages[messageKey];
                        }
                        let message = typeof translated === 'string' ? translated : (typeof (translated === null || translated === void 0 ? void 0 : translated.message) === 'string' ? translated.message : undefined);
                        if (message !== undefined) {
                            if (pseudo) {
                                // FF3B and FF3D is the Unicode zenkaku representation for [ and ]
                                message = '\uFF3B' + message.replace(/[aouei]/g, '$&$&') + '\uFF3D';
                            }
                            obj[key] = command && (key === 'title' || key === 'category') && originalMessages ? { value: message, original: originalMessages[messageKey] } : message;
                        }
                        else {
                            this.logService.warn(this.formatMessage(extensionLocation, (0, nls_1.localize)('missingNLSKey', "Couldn't find message for key {0}.", messageKey)));
                        }
                    }
                }
                else if ((0, types_1.isObject)(value)) {
                    for (let k in value) {
                        if (value.hasOwnProperty(k)) {
                            k === 'commands' ? processEntry(value, k, true) : processEntry(value, k, command);
                        }
                    }
                }
                else if ((0, types_1.isArray)(value)) {
                    for (let i = 0; i < value.length; i++) {
                        processEntry(value, i, command);
                    }
                }
            };
            for (let key in literal) {
                if (literal.hasOwnProperty(key)) {
                    processEntry(literal, key);
                }
            }
        }
        formatMessage(extensionLocation, message) {
            return `[${extensionLocation.path}]: ${message}`;
        }
    }
    class CachedExtensionsScanner extends ExtensionsScanner {
        constructor(cacheFile, fileService, logService) {
            super(fileService, logService);
            this.cacheFile = cacheFile;
            this.cacheValidatorThrottler = this._register(new async_1.ThrottledDelayer(3000));
            this._onDidChangeCache = this._register(new event_1.Emitter());
            this.onDidChangeCache = this._onDidChangeCache.event;
        }
        async scanExtensions(input) {
            const cacheContents = await this.readExtensionCache();
            this.input = input;
            if (cacheContents && cacheContents.input && ExtensionScannerInput.equals(cacheContents.input, this.input)) {
                this.cacheValidatorThrottler.trigger(() => this.validateCache());
                return cacheContents.result.map((extension) => {
                    // revive URI object
                    extension.location = uri_1.URI.revive(extension.location);
                    return extension;
                });
            }
            const result = await super.scanExtensions(input);
            await this.writeExtensionCache({ input, result });
            return result;
        }
        async readExtensionCache() {
            try {
                const cacheRawContents = await this.fileService.readFile(this.cacheFile);
                const extensionCacheData = JSON.parse(cacheRawContents.value.toString());
                return { result: extensionCacheData.result, input: (0, marshalling_1.revive)(extensionCacheData.input) };
            }
            catch (error) {
                this.logService.debug('Error while reading the extension cache file:', this.cacheFile.path, (0, errors_1.getErrorMessage)(error));
            }
            return null;
        }
        async writeExtensionCache(cacheContents) {
            try {
                await this.fileService.writeFile(this.cacheFile, buffer_1.VSBuffer.fromString(JSON.stringify(cacheContents)));
            }
            catch (error) {
                this.logService.debug('Error while writing the extension cache file:', this.cacheFile.path, (0, errors_1.getErrorMessage)(error));
            }
        }
        async validateCache() {
            if (!this.input) {
                // Input has been unset by the time we get here, so skip validation
                return;
            }
            const cacheContents = await this.readExtensionCache();
            if (!cacheContents) {
                // Cache has been deleted by someone else, which is perfectly fine...
                return;
            }
            const actual = cacheContents.result;
            const expected = JSON.parse(JSON.stringify(await super.scanExtensions(this.input)));
            if (objects.equals(expected, actual)) {
                // Cache is valid and running with it is perfectly fine...
                return;
            }
            try {
                // Cache is invalid, delete it
                await this.fileService.del(this.cacheFile);
                this._onDidChangeCache.fire();
            }
            catch (error) {
                this.logService.error(error);
            }
        }
    }
    function toExtensionDescription(extension, isUnderDevelopment) {
        const id = (0, extensionManagementUtil_1.getExtensionId)(extension.manifest.publisher, extension.manifest.name);
        return Object.assign({ id, identifier: new extensions_1.ExtensionIdentifier(id), isBuiltin: extension.type === 0 /* ExtensionType.System */, isUserBuiltin: extension.type === 1 /* ExtensionType.User */ && extension.isBuiltin, isUnderDevelopment, extensionLocation: extension.location, uuid: extension.identifier.uuid, targetPlatform: extension.targetPlatform }, extension.manifest);
    }
    exports.toExtensionDescription = toExtensionDescription;
    class NativeExtensionsScannerService extends AbstractExtensionsScannerService {
        constructor(systemExtensionsLocation, userExtensionsLocation, userHome, userDataPath, fileService, logService, environmentService, productService) {
            super(systemExtensionsLocation, userExtensionsLocation, (0, resources_1.joinPath)(userHome, '.vscode-oss-dev', 'extensions', 'control.json'), (0, resources_1.joinPath)(userDataPath, extensions_1.MANIFEST_CACHE_FOLDER), fileService, logService, environmentService, productService);
            this.translationsPromise = (async () => {
                if (platform.translationsConfigFile) {
                    try {
                        const content = await this.fileService.readFile(uri_1.URI.file(platform.translationsConfigFile));
                        return JSON.parse(content.value.toString());
                    }
                    catch (err) { /* Ignore Error */ }
                }
                return Object.create(null);
            })();
        }
        getTranslations(language) {
            return this.translationsPromise;
        }
    }
    exports.NativeExtensionsScannerService = NativeExtensionsScannerService;
});
//# sourceMappingURL=extensionsScannerService.js.map