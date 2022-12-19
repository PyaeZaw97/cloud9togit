/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/performance", "vs/base/common/uri", "vs/workbench/api/node/uriTransformer", "vs/nls", "vs/base/common/network", "vs/platform/extensions/common/extensions", "vs/base/common/uriIpc", "vs/platform/contextkey/common/contextkey", "vs/base/node/ps", "vs/platform/diagnostics/node/diagnosticsService", "vs/base/common/path", "vs/base/common/process", "vs/platform/extensionManagement/common/extensionsScannerService"], function (require, exports, platform, performance, uri_1, uriTransformer_1, nls, network_1, extensions_1, uriIpc_1, contextkey_1, ps_1, diagnosticsService_1, path_1, process_1, extensionsScannerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAgentEnvironmentChannel = void 0;
    class RemoteAgentEnvironmentChannel {
        constructor(_connectionToken, _environmentService, extensionManagementCLIService, _logService, _extensionHostStatusService, _extensionsScannerService) {
            this._connectionToken = _connectionToken;
            this._environmentService = _environmentService;
            this._logService = _logService;
            this._extensionHostStatusService = _extensionHostStatusService;
            this._extensionsScannerService = _extensionsScannerService;
            if (_environmentService.args['install-builtin-extension']) {
                const installOptions = { isMachineScoped: !!_environmentService.args['do-not-sync'], installPreReleaseVersion: !!_environmentService.args['pre-release'] };
                this.whenExtensionsReady = extensionManagementCLIService.installExtensions([], _environmentService.args['install-builtin-extension'], installOptions, !!_environmentService.args['force'])
                    .then(null, error => {
                    _logService.error(error);
                });
            }
            else {
                this.whenExtensionsReady = Promise.resolve();
            }
            const extensionsToInstall = _environmentService.args['install-extension'];
            if (extensionsToInstall) {
                const idsOrVSIX = extensionsToInstall.map(input => /\.vsix$/i.test(input) ? uri_1.URI.file((0, path_1.isAbsolute)(input) ? input : (0, path_1.join)((0, process_1.cwd)(), input)) : input);
                this.whenExtensionsReady
                    .then(() => extensionManagementCLIService.installExtensions(idsOrVSIX, [], { isMachineScoped: !!_environmentService.args['do-not-sync'], installPreReleaseVersion: !!_environmentService.args['pre-release'] }, !!_environmentService.args['force']))
                    .then(null, error => {
                    _logService.error(error);
                });
            }
        }
        async call(_, command, arg) {
            switch (command) {
                case 'getEnvironmentData': {
                    const args = arg;
                    const uriTransformer = (0, uriTransformer_1.createURITransformer)(args.remoteAuthority);
                    let environmentData = await this._getEnvironmentData();
                    environmentData = (0, uriIpc_1.transformOutgoingURIs)(environmentData, uriTransformer);
                    return environmentData;
                }
                case 'getExtensionHostExitInfo': {
                    const args = arg;
                    return this._extensionHostStatusService.getExitInfo(args.reconnectionToken);
                }
                case 'whenExtensionsReady': {
                    await this.whenExtensionsReady;
                    return;
                }
                case 'scanExtensions': {
                    await this.whenExtensionsReady;
                    const args = arg;
                    const language = args.language;
                    this._logService.trace(`Scanning extensions using UI language: ${language}`);
                    const uriTransformer = (0, uriTransformer_1.createURITransformer)(args.remoteAuthority);
                    const extensionDevelopmentLocations = args.extensionDevelopmentPath && args.extensionDevelopmentPath.map(url => uri_1.URI.revive(uriTransformer.transformIncoming(url)));
                    const extensionDevelopmentPath = extensionDevelopmentLocations ? extensionDevelopmentLocations.filter(url => url.scheme === network_1.Schemas.file).map(url => url.fsPath) : undefined;
                    let extensions = await this._scanExtensions(language, extensionDevelopmentPath);
                    extensions = (0, uriIpc_1.transformOutgoingURIs)(extensions, uriTransformer);
                    this._logService.trace('Scanned Extensions', extensions);
                    RemoteAgentEnvironmentChannel._massageWhenConditions(extensions);
                    return extensions;
                }
                case 'scanSingleExtension': {
                    await this.whenExtensionsReady;
                    const args = arg;
                    const language = args.language;
                    const isBuiltin = args.isBuiltin;
                    const uriTransformer = (0, uriTransformer_1.createURITransformer)(args.remoteAuthority);
                    const extensionLocation = uri_1.URI.revive(uriTransformer.transformIncoming(args.extensionLocation));
                    const extensionPath = extensionLocation.scheme === network_1.Schemas.file ? extensionLocation.fsPath : null;
                    if (!extensionPath) {
                        return null;
                    }
                    let extension = await this._scanSingleExtension(extensionPath, isBuiltin, language);
                    if (!extension) {
                        return null;
                    }
                    extension = (0, uriIpc_1.transformOutgoingURIs)(extension, uriTransformer);
                    RemoteAgentEnvironmentChannel._massageWhenConditions([extension]);
                    return extension;
                }
                case 'getDiagnosticInfo': {
                    const options = arg;
                    const diagnosticInfo = {
                        machineInfo: (0, diagnosticsService_1.getMachineInfo)()
                    };
                    const processesPromise = options.includeProcesses ? (0, ps_1.listProcesses)(process.pid) : Promise.resolve();
                    let workspaceMetadataPromises = [];
                    const workspaceMetadata = {};
                    if (options.folders) {
                        // only incoming paths are transformed, so remote authority is unneeded.
                        const uriTransformer = (0, uriTransformer_1.createURITransformer)('');
                        const folderPaths = options.folders
                            .map(folder => uri_1.URI.revive(uriTransformer.transformIncoming(folder)))
                            .filter(uri => uri.scheme === 'file');
                        workspaceMetadataPromises = folderPaths.map(folder => {
                            return (0, diagnosticsService_1.collectWorkspaceStats)(folder.fsPath, ['node_modules', '.git'])
                                .then(stats => {
                                workspaceMetadata[(0, path_1.basename)(folder.fsPath)] = stats;
                            });
                        });
                    }
                    return Promise.all([processesPromise, ...workspaceMetadataPromises]).then(([processes, _]) => {
                        diagnosticInfo.processes = processes || undefined;
                        diagnosticInfo.workspaceMetadata = options.folders ? workspaceMetadata : undefined;
                        return diagnosticInfo;
                    });
                }
            }
            throw new Error(`IPC Command ${command} not found`);
        }
        listen(_, event, arg) {
            throw new Error('Not supported');
        }
        static _massageWhenConditions(extensions) {
            // Massage "when" conditions which mention `resourceScheme`
            const _mapResourceSchemeValue = (value, isRegex) => {
                // console.log(`_mapResourceSchemeValue: ${value}, ${isRegex}`);
                return value.replace(/file/g, 'vscode-remote');
            };
            const _mapResourceRegExpValue = (value) => {
                let flags = '';
                flags += value.global ? 'g' : '';
                flags += value.ignoreCase ? 'i' : '';
                flags += value.multiline ? 'm' : '';
                return new RegExp(_mapResourceSchemeValue(value.source, true), flags);
            };
            const _exprKeyMapper = new class {
                mapDefined(key) {
                    return contextkey_1.ContextKeyDefinedExpr.create(key);
                }
                mapNot(key) {
                    return contextkey_1.ContextKeyNotExpr.create(key);
                }
                mapEquals(key, value) {
                    if (key === 'resourceScheme' && typeof value === 'string') {
                        return contextkey_1.ContextKeyEqualsExpr.create(key, _mapResourceSchemeValue(value, false));
                    }
                    else {
                        return contextkey_1.ContextKeyEqualsExpr.create(key, value);
                    }
                }
                mapNotEquals(key, value) {
                    if (key === 'resourceScheme' && typeof value === 'string') {
                        return contextkey_1.ContextKeyNotEqualsExpr.create(key, _mapResourceSchemeValue(value, false));
                    }
                    else {
                        return contextkey_1.ContextKeyNotEqualsExpr.create(key, value);
                    }
                }
                mapGreater(key, value) {
                    return contextkey_1.ContextKeyGreaterExpr.create(key, value);
                }
                mapGreaterEquals(key, value) {
                    return contextkey_1.ContextKeyGreaterEqualsExpr.create(key, value);
                }
                mapSmaller(key, value) {
                    return contextkey_1.ContextKeySmallerExpr.create(key, value);
                }
                mapSmallerEquals(key, value) {
                    return contextkey_1.ContextKeySmallerEqualsExpr.create(key, value);
                }
                mapRegex(key, regexp) {
                    if (key === 'resourceScheme' && regexp) {
                        return contextkey_1.ContextKeyRegexExpr.create(key, _mapResourceRegExpValue(regexp));
                    }
                    else {
                        return contextkey_1.ContextKeyRegexExpr.create(key, regexp);
                    }
                }
                mapIn(key, valueKey) {
                    return contextkey_1.ContextKeyInExpr.create(key, valueKey);
                }
            };
            const _massageWhenUser = (element) => {
                if (!element || !element.when || !/resourceScheme/.test(element.when)) {
                    return;
                }
                const expr = contextkey_1.ContextKeyExpr.deserialize(element.when);
                if (!expr) {
                    return;
                }
                const massaged = expr.map(_exprKeyMapper);
                element.when = massaged.serialize();
            };
            const _massageWhenUserArr = (elements) => {
                if (Array.isArray(elements)) {
                    for (let element of elements) {
                        _massageWhenUser(element);
                    }
                }
                else {
                    _massageWhenUser(elements);
                }
            };
            const _massageLocWhenUser = (target) => {
                for (let loc in target) {
                    _massageWhenUserArr(target[loc]);
                }
            };
            extensions.forEach((extension) => {
                if (extension.contributes) {
                    if (extension.contributes.menus) {
                        _massageLocWhenUser(extension.contributes.menus);
                    }
                    if (extension.contributes.keybindings) {
                        _massageWhenUserArr(extension.contributes.keybindings);
                    }
                    if (extension.contributes.views) {
                        _massageLocWhenUser(extension.contributes.views);
                    }
                }
            });
        }
        async _getEnvironmentData() {
            return {
                pid: process.pid,
                connectionToken: (this._connectionToken.type !== 0 /* ServerConnectionTokenType.None */ ? this._connectionToken.value : ''),
                appRoot: uri_1.URI.file(this._environmentService.appRoot),
                settingsPath: this._environmentService.machineSettingsResource,
                logsPath: uri_1.URI.file(this._environmentService.logsPath),
                extensionsPath: uri_1.URI.file(this._environmentService.extensionsPath),
                extensionHostLogsPath: uri_1.URI.file((0, path_1.join)(this._environmentService.logsPath, `exthost${RemoteAgentEnvironmentChannel._namePool++}`)),
                globalStorageHome: this._environmentService.globalStorageHome,
                workspaceStorageHome: this._environmentService.workspaceStorageHome,
                localHistoryHome: this._environmentService.localHistoryHome,
                userHome: this._environmentService.userHome,
                os: platform.OS,
                arch: process.arch,
                marks: performance.getMarks(),
                useHostProxy: !!this._environmentService.args['use-host-proxy']
            };
        }
        async _scanExtensions(language, extensionDevelopmentPath) {
            // Ensure that the language packs are available
            const [builtinExtensions, installedExtensions, developedExtensions] = await Promise.all([
                this._scanBuiltinExtensions(language),
                this._scanInstalledExtensions(language),
                this._scanDevelopedExtensions(language, extensionDevelopmentPath)
            ]);
            let result = new Map();
            builtinExtensions.forEach((builtinExtension) => {
                if (!builtinExtension) {
                    return;
                }
                result.set(extensions_1.ExtensionIdentifier.toKey(builtinExtension.identifier), builtinExtension);
            });
            installedExtensions.forEach((installedExtension) => {
                if (!installedExtension) {
                    return;
                }
                if (result.has(extensions_1.ExtensionIdentifier.toKey(installedExtension.identifier))) {
                    console.warn(nls.localize('overwritingExtension', "Overwriting extension {0} with {1}.", result.get(extensions_1.ExtensionIdentifier.toKey(installedExtension.identifier)).extensionLocation.fsPath, installedExtension.extensionLocation.fsPath));
                }
                result.set(extensions_1.ExtensionIdentifier.toKey(installedExtension.identifier), installedExtension);
            });
            developedExtensions.forEach((developedExtension) => {
                if (!developedExtension) {
                    return;
                }
                result.set(extensions_1.ExtensionIdentifier.toKey(developedExtension.identifier), developedExtension);
            });
            const r = [];
            result.forEach((v) => r.push(v));
            return r;
        }
        async _scanDevelopedExtensions(language, extensionDevelopmentPaths) {
            if (extensionDevelopmentPaths) {
                return (await Promise.all(extensionDevelopmentPaths.map(extensionDevelopmentPath => this._extensionsScannerService.scanOneOrMultipleExtensions(uri_1.URI.file((0, path_1.resolve)(extensionDevelopmentPath)), 1 /* ExtensionType.User */, { language }))))
                    .flat()
                    .map(e => (0, extensionsScannerService_1.toExtensionDescription)(e, true));
            }
            return [];
        }
        async _scanBuiltinExtensions(language) {
            const scannedExtensions = await this._extensionsScannerService.scanSystemExtensions({ language, useCache: true });
            return scannedExtensions.map(e => (0, extensionsScannerService_1.toExtensionDescription)(e, false));
        }
        async _scanInstalledExtensions(language) {
            const scannedExtensions = await this._extensionsScannerService.scanUserExtensions({ language, useCache: true });
            return scannedExtensions.map(e => (0, extensionsScannerService_1.toExtensionDescription)(e, false));
        }
        async _scanSingleExtension(extensionPath, isBuiltin, language) {
            const extensionLocation = uri_1.URI.file((0, path_1.resolve)(extensionPath));
            const type = isBuiltin ? 0 /* ExtensionType.System */ : 1 /* ExtensionType.User */;
            const scannedExtension = await this._extensionsScannerService.scanExistingExtension(extensionLocation, type, { language });
            return scannedExtension ? (0, extensionsScannerService_1.toExtensionDescription)(scannedExtension, false) : null;
        }
    }
    exports.RemoteAgentEnvironmentChannel = RemoteAgentEnvironmentChannel;
    RemoteAgentEnvironmentChannel._namePool = 1;
});
//# sourceMappingURL=remoteAgentEnvironmentImpl.js.map