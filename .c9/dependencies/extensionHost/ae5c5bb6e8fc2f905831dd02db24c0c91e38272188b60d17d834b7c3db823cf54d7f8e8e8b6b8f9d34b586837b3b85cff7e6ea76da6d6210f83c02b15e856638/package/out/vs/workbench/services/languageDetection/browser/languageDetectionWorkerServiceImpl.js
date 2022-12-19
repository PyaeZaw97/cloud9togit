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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/base/common/network", "vs/workbench/services/environment/common/environmentService", "vs/platform/configuration/common/configuration", "vs/editor/common/languages/language", "vs/base/common/uri", "vs/base/common/platform", "vs/platform/instantiation/common/extensions", "vs/editor/common/services/model", "vs/base/common/worker/simpleWorker", "vs/platform/telemetry/common/telemetry", "vs/editor/browser/services/editorWorkerService", "vs/editor/common/languages/languageConfigurationRegistry", "vs/platform/diagnostics/common/diagnostics", "vs/platform/workspace/common/workspace", "vs/workbench/services/editor/common/editorService", "vs/platform/storage/common/storage", "vs/base/common/map", "vs/platform/log/common/log"], function (require, exports, lifecycle_1, languageDetectionWorkerService_1, network_1, environmentService_1, configuration_1, language_1, uri_1, platform_1, extensions_1, model_1, simpleWorker_1, telemetry_1, editorWorkerService_1, languageConfigurationRegistry_1, diagnostics_1, workspace_1, editorService_1, storage_1, map_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageDetectionWorkerClient = exports.LanguageDetectionWorkerHost = exports.LanguageDetectionService = void 0;
    const TOP_LANG_COUNTS = 12;
    const regexpModuleLocation = '../../../../../../node_modules/vscode-regexp-languagedetection';
    const regexpModuleLocationAsar = '../../../../../../node_modules.asar/vscode-regexp-languagedetection';
    const moduleLocation = '../../../../../../node_modules/@vscode/vscode-languagedetection';
    const moduleLocationAsar = '../../../../../../node_modules.asar/@vscode/vscode-languagedetection';
    let LanguageDetectionService = class LanguageDetectionService extends lifecycle_1.Disposable {
        constructor(_environmentService, languageService, _configurationService, _diagnosticsService, _workspaceContextService, modelService, _editorService, telemetryService, storageService, _logService, languageConfigurationService) {
            super();
            this._environmentService = _environmentService;
            this._configurationService = _configurationService;
            this._diagnosticsService = _diagnosticsService;
            this._workspaceContextService = _workspaceContextService;
            this._editorService = _editorService;
            this._logService = _logService;
            this.hasResolvedWorkspaceLanguageIds = false;
            this.workspaceLanguageIds = new Set();
            this.sessionOpenedLanguageIds = new Set();
            this.historicalGlobalOpenedLanguageIds = new map_1.LRUCache(TOP_LANG_COUNTS);
            this.historicalWorkspaceOpenedLanguageIds = new map_1.LRUCache(TOP_LANG_COUNTS);
            this.dirtyBiases = true;
            this.langBiases = {};
            this._languageDetectionWorkerClient = new LanguageDetectionWorkerClient(modelService, languageService, telemetryService, 
            // TODO: See if it's possible to bundle vscode-languagedetection
            this._environmentService.isBuilt && !platform_1.isWeb
                ? network_1.FileAccess.asBrowserUri(`${moduleLocationAsar}/dist/lib/index.js`, require).toString(true)
                : network_1.FileAccess.asBrowserUri(`${moduleLocation}/dist/lib/index.js`, require).toString(true), this._environmentService.isBuilt && !platform_1.isWeb
                ? network_1.FileAccess.asBrowserUri(`${moduleLocationAsar}/model/model.json`, require).toString(true)
                : network_1.FileAccess.asBrowserUri(`${moduleLocation}/model/model.json`, require).toString(true), this._environmentService.isBuilt && !platform_1.isWeb
                ? network_1.FileAccess.asBrowserUri(`${moduleLocationAsar}/model/group1-shard1of1.bin`, require).toString(true)
                : network_1.FileAccess.asBrowserUri(`${moduleLocation}/model/group1-shard1of1.bin`, require).toString(true), this._environmentService.isBuilt && !platform_1.isWeb
                ? network_1.FileAccess.asBrowserUri(`${regexpModuleLocationAsar}/dist/index.js`, require).toString(true)
                : network_1.FileAccess.asBrowserUri(`${regexpModuleLocation}/dist/index.js`, require).toString(true), languageConfigurationService);
            this.initEditorOpenedListeners(storageService);
        }
        async resolveWorkspaceLanguageIds() {
            if (this.hasResolvedWorkspaceLanguageIds) {
                return;
            }
            this.hasResolvedWorkspaceLanguageIds = true;
            const fileExtensions = await this._diagnosticsService.getWorkspaceFileExtensions(this._workspaceContextService.getWorkspace());
            let count = 0;
            for (const ext of fileExtensions.extensions) {
                const langId = this._languageDetectionWorkerClient.getLanguageId(ext);
                if (langId && count < TOP_LANG_COUNTS) {
                    this.workspaceLanguageIds.add(langId);
                    count++;
                    if (count > TOP_LANG_COUNTS) {
                        break;
                    }
                }
            }
            this.dirtyBiases = true;
        }
        isEnabledForLanguage(languageId) {
            return !!languageId && this._configurationService.getValue(LanguageDetectionService.enablementSettingKey, { overrideIdentifier: languageId });
        }
        getLanguageBiases() {
            if (!this.dirtyBiases) {
                return this.langBiases;
            }
            const biases = {};
            // Give different weight to the biases depending on relevance of source
            this.sessionOpenedLanguageIds.forEach(lang => { var _a; return biases[lang] = ((_a = biases[lang]) !== null && _a !== void 0 ? _a : 0) + 7; });
            this.workspaceLanguageIds.forEach(lang => { var _a; return biases[lang] = ((_a = biases[lang]) !== null && _a !== void 0 ? _a : 0) + 5; });
            [...this.historicalWorkspaceOpenedLanguageIds.keys()].forEach(lang => { var _a; return biases[lang] = ((_a = biases[lang]) !== null && _a !== void 0 ? _a : 0) + 3; });
            [...this.historicalGlobalOpenedLanguageIds.keys()].forEach(lang => { var _a; return biases[lang] = ((_a = biases[lang]) !== null && _a !== void 0 ? _a : 0) + 1; });
            this._logService.trace('Session Languages:', JSON.stringify([...this.sessionOpenedLanguageIds]));
            this._logService.trace('Workspace Languages:', JSON.stringify([...this.workspaceLanguageIds]));
            this._logService.trace('Historical Workspace Opened Languages:', JSON.stringify([...this.historicalWorkspaceOpenedLanguageIds.keys()]));
            this._logService.trace('Historical Globally Opened Languages:', JSON.stringify([...this.historicalGlobalOpenedLanguageIds.keys()]));
            this._logService.trace('Computed Language Detection Biases:', JSON.stringify(biases));
            this.dirtyBiases = false;
            this.langBiases = biases;
            return biases;
        }
        async detectLanguage(resource, supportedLangs) {
            const useHistory = this._configurationService.getValue(LanguageDetectionService.historyBasedEnablementConfig);
            const preferHistory = this._configurationService.getValue(LanguageDetectionService.preferHistoryConfig);
            if (useHistory) {
                await this.resolveWorkspaceLanguageIds();
            }
            const biases = useHistory ? this.getLanguageBiases() : undefined;
            return this._languageDetectionWorkerClient.detectLanguage(resource, biases, preferHistory, supportedLangs);
        }
        initEditorOpenedListeners(storageService) {
            try {
                const globalLangHistroyData = JSON.parse(storageService.get(LanguageDetectionService.globalOpenedLanguagesStorageKey, 0 /* StorageScope.GLOBAL */, '[]'));
                this.historicalGlobalOpenedLanguageIds.fromJSON(globalLangHistroyData);
            }
            catch (e) {
                console.error(e);
            }
            try {
                const workspaceLangHistroyData = JSON.parse(storageService.get(LanguageDetectionService.workspaceOpenedLanguagesStorageKey, 1 /* StorageScope.WORKSPACE */, '[]'));
                this.historicalWorkspaceOpenedLanguageIds.fromJSON(workspaceLangHistroyData);
            }
            catch (e) {
                console.error(e);
            }
            this._register(this._editorService.onDidActiveEditorChange(() => {
                var _a, _b;
                const activeLanguage = this._editorService.activeTextEditorLanguageId;
                if (activeLanguage && ((_b = (_a = this._editorService.activeEditor) === null || _a === void 0 ? void 0 : _a.resource) === null || _b === void 0 ? void 0 : _b.scheme) !== network_1.Schemas.untitled) {
                    this.sessionOpenedLanguageIds.add(activeLanguage);
                    this.historicalGlobalOpenedLanguageIds.set(activeLanguage, true);
                    this.historicalWorkspaceOpenedLanguageIds.set(activeLanguage, true);
                    storageService.store(LanguageDetectionService.globalOpenedLanguagesStorageKey, JSON.stringify(this.historicalGlobalOpenedLanguageIds.toJSON()), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                    storageService.store(LanguageDetectionService.workspaceOpenedLanguagesStorageKey, JSON.stringify(this.historicalWorkspaceOpenedLanguageIds.toJSON()), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                    this.dirtyBiases = true;
                }
            }));
        }
    };
    LanguageDetectionService.enablementSettingKey = 'workbench.editor.languageDetection';
    LanguageDetectionService.historyBasedEnablementConfig = 'workbench.editor.historyBasedLanguageDetection';
    LanguageDetectionService.preferHistoryConfig = 'workbench.editor.preferHistoryBasedLanguageDetection';
    LanguageDetectionService.workspaceOpenedLanguagesStorageKey = 'workbench.editor.languageDetectionOpenedLanguages.workspace';
    LanguageDetectionService.globalOpenedLanguagesStorageKey = 'workbench.editor.languageDetectionOpenedLanguages.global';
    LanguageDetectionService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, language_1.ILanguageService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, diagnostics_1.IDiagnosticsService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, model_1.IModelService),
        __param(6, editorService_1.IEditorService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, storage_1.IStorageService),
        __param(9, log_1.ILogService),
        __param(10, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], LanguageDetectionService);
    exports.LanguageDetectionService = LanguageDetectionService;
    class LanguageDetectionWorkerHost {
        constructor(_indexJsUri, _modelJsonUri, _weightsUri, _telemetryService) {
            this._indexJsUri = _indexJsUri;
            this._modelJsonUri = _modelJsonUri;
            this._weightsUri = _weightsUri;
            this._telemetryService = _telemetryService;
        }
        async getIndexJsUri() {
            return this._indexJsUri;
        }
        async getModelJsonUri() {
            return this._modelJsonUri;
        }
        async getWeightsUri() {
            return this._weightsUri;
        }
        async sendTelemetryEvent(languages, confidences, timeSpent) {
            this._telemetryService.publicLog2('automaticlanguagedetection.stats', {
                languages: languages.join(','),
                confidences: confidences.join(','),
                timeSpent
            });
        }
    }
    exports.LanguageDetectionWorkerHost = LanguageDetectionWorkerHost;
    class LanguageDetectionWorkerClient extends editorWorkerService_1.EditorWorkerClient {
        constructor(modelService, _languageService, _telemetryService, _indexJsUri, _modelJsonUri, _weightsUri, _regexpModelUri, languageConfigurationService) {
            super(modelService, true, 'languageDetectionWorkerService', languageConfigurationService);
            this._languageService = _languageService;
            this._telemetryService = _telemetryService;
            this._indexJsUri = _indexJsUri;
            this._modelJsonUri = _modelJsonUri;
            this._weightsUri = _weightsUri;
            this._regexpModelUri = _regexpModelUri;
        }
        _getOrCreateLanguageDetectionWorker() {
            if (this.workerPromise) {
                return this.workerPromise;
            }
            this.workerPromise = new Promise((resolve, reject) => {
                resolve(this._register(new simpleWorker_1.SimpleWorkerClient(this._workerFactory, 'vs/workbench/services/languageDetection/browser/languageDetectionSimpleWorker', new editorWorkerService_1.EditorWorkerHost(this))));
            });
            return this.workerPromise;
        }
        _guessLanguageIdByUri(uri) {
            const guess = this._languageService.guessLanguageIdByFilepathOrFirstLine(uri);
            if (guess && guess !== 'unknown') {
                return guess;
            }
            return undefined;
        }
        async _getProxy() {
            return (await this._getOrCreateLanguageDetectionWorker()).getProxyObject();
        }
        // foreign host request
        async fhr(method, args) {
            switch (method) {
                case 'getIndexJsUri':
                    return this.getIndexJsUri();
                case 'getModelJsonUri':
                    return this.getModelJsonUri();
                case 'getWeightsUri':
                    return this.getWeightsUri();
                case 'getRegexpModelUri':
                    return this.getRegexpModelUri();
                case 'getLanguageId':
                    return this.getLanguageId(args[0]);
                case 'sendTelemetryEvent':
                    return this.sendTelemetryEvent(args[0], args[1], args[2]);
                default:
                    return super.fhr(method, args);
            }
        }
        async getIndexJsUri() {
            return this._indexJsUri;
        }
        getLanguageId(languageIdOrExt) {
            if (!languageIdOrExt) {
                return undefined;
            }
            if (this._languageService.isRegisteredLanguageId(languageIdOrExt)) {
                return languageIdOrExt;
            }
            const guessed = this._guessLanguageIdByUri(uri_1.URI.file(`file.${languageIdOrExt}`));
            if (!guessed || guessed === 'unknown') {
                return undefined;
            }
            return guessed;
        }
        async getModelJsonUri() {
            return this._modelJsonUri;
        }
        async getWeightsUri() {
            return this._weightsUri;
        }
        async getRegexpModelUri() {
            return this._regexpModelUri;
        }
        async sendTelemetryEvent(languages, confidences, timeSpent) {
            this._telemetryService.publicLog2(languageDetectionWorkerService_1.LanguageDetectionStatsId, {
                languages: languages.join(','),
                confidences: confidences.join(','),
                timeSpent
            });
        }
        async detectLanguage(resource, langBiases, preferHistory, supportedLangs) {
            const startTime = Date.now();
            const quickGuess = this._guessLanguageIdByUri(resource);
            if (quickGuess) {
                return quickGuess;
            }
            await this._withSyncedResources([resource]);
            const modelId = await (await this._getProxy()).detectLanguage(resource.toString(), langBiases, preferHistory, supportedLangs);
            const langaugeId = this.getLanguageId(modelId);
            const LanguageDetectionStatsId = 'automaticlanguagedetection.perf';
            this._telemetryService.publicLog2(LanguageDetectionStatsId, {
                timeSpent: Date.now() - startTime,
                detection: langaugeId || 'unknown',
            });
            return langaugeId;
        }
    }
    exports.LanguageDetectionWorkerClient = LanguageDetectionWorkerClient;
    (0, extensions_1.registerSingleton)(languageDetectionWorkerService_1.ILanguageDetectionService, LanguageDetectionService);
});
//# sourceMappingURL=languageDetectionWorkerServiceImpl.js.map