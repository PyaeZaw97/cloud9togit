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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/glob", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/types", "vs/platform/configuration/common/configuration", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/instantiation/common/instantiation", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/tags/common/workspaceTags", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, arrays_1, async_1, cancellation_1, event_1, glob_1, lifecycle_1, objects_1, platform_1, types_1, configuration_1, extensionManagement_1, instantiation_1, productService_1, request_1, storage_1, telemetry_1, workspaceTags_1, environmentService_1, extensions_1, lifecycle_2, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExperimentService = exports.getCurrentActivationRecord = exports.currentSchemaVersion = exports.IExperimentService = exports.ExperimentActionType = exports.ExperimentState = void 0;
    var ExperimentState;
    (function (ExperimentState) {
        ExperimentState[ExperimentState["Evaluating"] = 0] = "Evaluating";
        ExperimentState[ExperimentState["NoRun"] = 1] = "NoRun";
        ExperimentState[ExperimentState["Run"] = 2] = "Run";
        ExperimentState[ExperimentState["Complete"] = 3] = "Complete";
    })(ExperimentState = exports.ExperimentState || (exports.ExperimentState = {}));
    var ExperimentActionType;
    (function (ExperimentActionType) {
        ExperimentActionType["Custom"] = "Custom";
        ExperimentActionType["Prompt"] = "Prompt";
        ExperimentActionType["AddToRecommendations"] = "AddToRecommendations";
        ExperimentActionType["ExtensionSearchResults"] = "ExtensionSearchResults";
    })(ExperimentActionType = exports.ExperimentActionType || (exports.ExperimentActionType = {}));
    exports.IExperimentService = (0, instantiation_1.createDecorator)('experimentService');
    /**
     * Current version of the experiment schema in this VS Code build. This *must*
     * be incremented when adding a condition, otherwise experiments might activate
     * on older versions of VS Code where not intended.
     */
    exports.currentSchemaVersion = 5;
    const experimentEventStorageKey = (event) => 'experimentEventRecord-' + event.replace(/[^0-9a-z]/ig, '-');
    /**
     * Updates the activation record to shift off days outside the window
     * we're interested in.
     */
    const getCurrentActivationRecord = (previous, dayWindow = 7) => {
        const oneDay = 1000 * 60 * 60 * 24;
        const now = Date.now();
        if (!previous) {
            return { count: new Array(dayWindow).fill(0), mostRecentBucket: now };
        }
        // get the number of days, up to dayWindow, that passed since the last bucket update
        const shift = Math.min(dayWindow, Math.floor((now - previous.mostRecentBucket) / oneDay));
        if (!shift) {
            return previous;
        }
        return {
            count: new Array(shift).fill(0).concat(previous.count.slice(0, -shift)),
            mostRecentBucket: previous.mostRecentBucket + shift * oneDay,
        };
    };
    exports.getCurrentActivationRecord = getCurrentActivationRecord;
    let ExperimentService = class ExperimentService extends lifecycle_1.Disposable {
        constructor(storageService, extensionManagementService, textFileService, telemetryService, lifecycleService, requestService, configurationService, productService, workspaceTagsService, extensionService, environmentService) {
            super();
            this.storageService = storageService;
            this.extensionManagementService = extensionManagementService;
            this.textFileService = textFileService;
            this.telemetryService = telemetryService;
            this.lifecycleService = lifecycleService;
            this.requestService = requestService;
            this.configurationService = configurationService;
            this.productService = productService;
            this.workspaceTagsService = workspaceTagsService;
            this.extensionService = extensionService;
            this.environmentService = environmentService;
            this._experiments = [];
            this._curatedMapping = Object.create(null);
            this._onExperimentEnabled = this._register(new event_1.Emitter());
            this.onExperimentEnabled = this._onExperimentEnabled.event;
            this._loadExperimentsPromise = Promise.resolve(this.lifecycleService.when(4 /* LifecyclePhase.Eventually */)).then(() => this.loadExperiments());
        }
        getExperimentById(id) {
            return this._loadExperimentsPromise.then(() => {
                return this._experiments.filter(x => x.id === id)[0];
            });
        }
        getExperimentsByType(type) {
            return this._loadExperimentsPromise.then(() => {
                if (type === ExperimentActionType.Custom) {
                    return this._experiments.filter(x => x.enabled && (!x.action || x.action.type === type));
                }
                return this._experiments.filter(x => x.enabled && x.action && x.action.type === type);
            });
        }
        getCuratedExtensionsList(curatedExtensionsKey) {
            return this._loadExperimentsPromise.then(() => {
                for (const experiment of this._experiments) {
                    if (experiment.enabled
                        && experiment.state === 2 /* ExperimentState.Run */
                        && this._curatedMapping[experiment.id]
                        && this._curatedMapping[experiment.id].curatedExtensionsKey === curatedExtensionsKey) {
                        return this._curatedMapping[experiment.id].curatedExtensionsList;
                    }
                }
                return [];
            });
        }
        markAsCompleted(experimentId) {
            const storageKey = 'experiments.' + experimentId;
            const experimentState = safeParse(this.storageService.get(storageKey, 0 /* StorageScope.GLOBAL */), {});
            experimentState.state = 3 /* ExperimentState.Complete */;
            this.storageService.store(storageKey, JSON.stringify(experimentState), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
        }
        async getExperiments() {
            if (this.environmentService.enableSmokeTestDriver || this.environmentService.extensionTestsLocationURI) {
                return []; // TODO@sbatten add CLI argument (https://github.com/microsoft/vscode-internalbacklog/issues/2855)
            }
            const experimentsUrl = this.configurationService.getValue('_workbench.experimentsUrl') || this.productService.experimentsUrl;
            if (!experimentsUrl || this.configurationService.getValue('workbench.enableExperiments') === false) {
                return [];
            }
            try {
                const context = await this.requestService.request({ type: 'GET', url: experimentsUrl }, cancellation_1.CancellationToken.None);
                if (context.res.statusCode !== 200) {
                    return null;
                }
                const result = await (0, request_1.asJson)(context);
                return result && Array.isArray(result.experiments) ? result.experiments : [];
            }
            catch (_e) {
                // Bad request or invalid JSON
                return null;
            }
        }
        loadExperiments() {
            return this.getExperiments().then(rawExperiments => {
                // Offline mode
                if (!rawExperiments) {
                    const allExperimentIdsFromStorage = safeParse(this.storageService.get('allExperiments', 0 /* StorageScope.GLOBAL */), []);
                    if (Array.isArray(allExperimentIdsFromStorage)) {
                        allExperimentIdsFromStorage.forEach(experimentId => {
                            const storageKey = 'experiments.' + experimentId;
                            const experimentState = safeParse(this.storageService.get(storageKey, 0 /* StorageScope.GLOBAL */), null);
                            if (experimentState) {
                                this._experiments.push({
                                    id: experimentId,
                                    raw: undefined,
                                    enabled: experimentState.enabled,
                                    state: experimentState.state
                                });
                            }
                        });
                    }
                    return Promise.resolve(null);
                }
                // Don't look at experiments with newer schema versions. We can't
                // understand them, trying to process them might even cause errors.
                rawExperiments = rawExperiments.filter(e => (e.schemaVersion || 0) <= exports.currentSchemaVersion);
                // Clear disbaled/deleted experiments from storage
                const allExperimentIdsFromStorage = safeParse(this.storageService.get('allExperiments', 0 /* StorageScope.GLOBAL */), []);
                const enabledExperiments = rawExperiments.filter(experiment => !!experiment.enabled).map(experiment => experiment.id.toLowerCase());
                if (Array.isArray(allExperimentIdsFromStorage)) {
                    allExperimentIdsFromStorage.forEach(experiment => {
                        if (enabledExperiments.indexOf(experiment) === -1) {
                            this.storageService.remove(`experiments.${experiment}`, 0 /* StorageScope.GLOBAL */);
                        }
                    });
                }
                if (enabledExperiments.length) {
                    this.storageService.store('allExperiments', JSON.stringify(enabledExperiments), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                }
                else {
                    this.storageService.remove('allExperiments', 0 /* StorageScope.GLOBAL */);
                }
                const activationEvents = new Set(rawExperiments.map(exp => { var _a, _b; return (_b = (_a = exp.condition) === null || _a === void 0 ? void 0 : _a.activationEvent) === null || _b === void 0 ? void 0 : _b.event; })
                    .filter(types_1.isDefined).flatMap(evt => typeof evt === 'string' ? [evt] : []));
                if (activationEvents.size) {
                    this._register(this.extensionService.onWillActivateByEvent(evt => {
                        if (activationEvents.has(evt.event)) {
                            this.recordActivatedEvent(evt.event);
                        }
                    }));
                }
                const promises = rawExperiments.map(experiment => this.evaluateExperiment(experiment));
                return Promise.all(promises).then(() => {
                    this.telemetryService.publicLog2('experiments', { experiments: this._experiments.map(e => e.id) });
                });
            });
        }
        evaluateExperiment(experiment) {
            const processedExperiment = {
                id: experiment.id,
                raw: experiment,
                enabled: !!experiment.enabled,
                state: !!experiment.enabled ? 0 /* ExperimentState.Evaluating */ : 1 /* ExperimentState.NoRun */
            };
            const action = experiment.action2 || experiment.action;
            if (action) {
                processedExperiment.action = {
                    type: ExperimentActionType[action.type] || ExperimentActionType.Custom,
                    properties: action.properties
                };
                if (processedExperiment.action.type === ExperimentActionType.Prompt) {
                    (processedExperiment.action.properties.commands || []).forEach(x => {
                        if (x.curatedExtensionsKey && Array.isArray(x.curatedExtensionsList)) {
                            this._curatedMapping[experiment.id] = x;
                        }
                    });
                }
                if (!processedExperiment.action.properties) {
                    processedExperiment.action.properties = {};
                }
            }
            this._experiments = this._experiments.filter(e => e.id !== processedExperiment.id);
            this._experiments.push(processedExperiment);
            if (!processedExperiment.enabled) {
                return Promise.resolve(null);
            }
            const storageKey = 'experiments.' + experiment.id;
            const experimentState = safeParse(this.storageService.get(storageKey, 0 /* StorageScope.GLOBAL */), {});
            if (!experimentState.hasOwnProperty('enabled')) {
                experimentState.enabled = processedExperiment.enabled;
            }
            if (!experimentState.hasOwnProperty('state')) {
                experimentState.state = processedExperiment.enabled ? 0 /* ExperimentState.Evaluating */ : 1 /* ExperimentState.NoRun */;
            }
            else {
                processedExperiment.state = experimentState.state;
            }
            return this.shouldRunExperiment(experiment, processedExperiment).then((state) => {
                experimentState.state = processedExperiment.state = state;
                this.storageService.store(storageKey, JSON.stringify(experimentState), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                if (state === 2 /* ExperimentState.Run */) {
                    this.fireRunExperiment(processedExperiment);
                }
                return Promise.resolve(null);
            });
        }
        fireRunExperiment(experiment) {
            this._onExperimentEnabled.fire(experiment);
            const runExperimentIdsFromStorage = safeParse(this.storageService.get('currentOrPreviouslyRunExperiments', 0 /* StorageScope.GLOBAL */), []);
            if (runExperimentIdsFromStorage.indexOf(experiment.id) === -1) {
                runExperimentIdsFromStorage.push(experiment.id);
            }
            // Ensure we dont store duplicates
            const distinctExperiments = (0, arrays_1.distinct)(runExperimentIdsFromStorage);
            if (runExperimentIdsFromStorage.length !== distinctExperiments.length) {
                this.storageService.store('currentOrPreviouslyRunExperiments', JSON.stringify(distinctExperiments), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            }
        }
        checkExperimentDependencies(experiment) {
            var _a;
            const experimentsPreviouslyRun = (_a = experiment.condition) === null || _a === void 0 ? void 0 : _a.experimentsPreviouslyRun;
            if (experimentsPreviouslyRun) {
                const runExperimentIdsFromStorage = safeParse(this.storageService.get('currentOrPreviouslyRunExperiments', 0 /* StorageScope.GLOBAL */), []);
                let includeCheck = true;
                let excludeCheck = true;
                const includes = experimentsPreviouslyRun.includes;
                if (Array.isArray(includes)) {
                    includeCheck = runExperimentIdsFromStorage.some(x => includes.indexOf(x) > -1);
                }
                const excludes = experimentsPreviouslyRun.excludes;
                if (includeCheck && Array.isArray(excludes)) {
                    excludeCheck = !runExperimentIdsFromStorage.some(x => excludes.indexOf(x) > -1);
                }
                if (!includeCheck || !excludeCheck) {
                    return false;
                }
            }
            return true;
        }
        recordActivatedEvent(event) {
            const key = experimentEventStorageKey(event);
            const record = (0, exports.getCurrentActivationRecord)(safeParse(this.storageService.get(key, 0 /* StorageScope.GLOBAL */), undefined));
            record.count[0]++;
            this.storageService.store(key, JSON.stringify(record), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            this._experiments
                .filter(e => {
                var _a, _b, _c;
                const lookingFor = (_c = (_b = (_a = e.raw) === null || _a === void 0 ? void 0 : _a.condition) === null || _b === void 0 ? void 0 : _b.activationEvent) === null || _c === void 0 ? void 0 : _c.event;
                if (e.state !== 0 /* ExperimentState.Evaluating */ || !lookingFor) {
                    return false;
                }
                return typeof lookingFor === 'string' ? lookingFor === event : lookingFor === null || lookingFor === void 0 ? void 0 : lookingFor.includes(event);
            })
                .forEach(e => this.evaluateExperiment(e.raw));
        }
        checkActivationEventFrequency(experiment) {
            var _a;
            const setting = (_a = experiment.condition) === null || _a === void 0 ? void 0 : _a.activationEvent;
            if (!setting) {
                return true;
            }
            let total = 0;
            let uniqueDays = 0;
            const events = typeof setting.event === 'string' ? [setting.event] : setting.event;
            for (const event of events) {
                const { count } = (0, exports.getCurrentActivationRecord)(safeParse(this.storageService.get(experimentEventStorageKey(event), 0 /* StorageScope.GLOBAL */), undefined));
                for (const entry of count) {
                    if (entry > 0) {
                        uniqueDays++;
                        total += entry;
                    }
                }
            }
            return total >= setting.minEvents && (!setting.uniqueDays || uniqueDays >= setting.uniqueDays);
        }
        shouldRunExperiment(experiment, processedExperiment) {
            var _a, _b;
            if (processedExperiment.state !== 0 /* ExperimentState.Evaluating */) {
                return Promise.resolve(processedExperiment.state);
            }
            if (!experiment.enabled) {
                return Promise.resolve(1 /* ExperimentState.NoRun */);
            }
            const condition = experiment.condition;
            if (!condition) {
                return Promise.resolve(2 /* ExperimentState.Run */);
            }
            if (((_a = experiment.condition) === null || _a === void 0 ? void 0 : _a.os) && !experiment.condition.os.includes(platform_1.OS)) {
                return Promise.resolve(1 /* ExperimentState.NoRun */);
            }
            if (!this.checkExperimentDependencies(experiment)) {
                return Promise.resolve(1 /* ExperimentState.NoRun */);
            }
            for (const [key, value] of Object.entries(((_b = experiment.condition) === null || _b === void 0 ? void 0 : _b.userSetting) || {})) {
                if (!(0, objects_1.equals)(this.configurationService.getValue(key), value)) {
                    return Promise.resolve(1 /* ExperimentState.NoRun */);
                }
            }
            if (!this.checkActivationEventFrequency(experiment)) {
                return Promise.resolve(0 /* ExperimentState.Evaluating */);
            }
            if (this.productService.quality === 'stable' && condition.insidersOnly === true) {
                return Promise.resolve(1 /* ExperimentState.NoRun */);
            }
            const isNewUser = !this.storageService.get(telemetry_1.lastSessionDateStorageKey, 0 /* StorageScope.GLOBAL */);
            if ((condition.newUser === true && !isNewUser)
                || (condition.newUser === false && isNewUser)) {
                return Promise.resolve(1 /* ExperimentState.NoRun */);
            }
            if (typeof condition.displayLanguage === 'string') {
                let localeToCheck = condition.displayLanguage.toLowerCase();
                let displayLanguage = platform_1.language.toLowerCase();
                if (localeToCheck !== displayLanguage) {
                    const a = displayLanguage.indexOf('-');
                    const b = localeToCheck.indexOf('-');
                    if (a > -1) {
                        displayLanguage = displayLanguage.substr(0, a);
                    }
                    if (b > -1) {
                        localeToCheck = localeToCheck.substr(0, b);
                    }
                    if (displayLanguage !== localeToCheck) {
                        return Promise.resolve(1 /* ExperimentState.NoRun */);
                    }
                }
            }
            if (!condition.userProbability) {
                condition.userProbability = 1;
            }
            let extensionsCheckPromise = Promise.resolve(true);
            const installedExtensions = condition.installedExtensions;
            if (installedExtensions) {
                extensionsCheckPromise = this.extensionManagementService.getInstalled(1 /* ExtensionType.User */).then(locals => {
                    let includesCheck = true;
                    let excludesCheck = true;
                    const localExtensions = locals.map(local => `${local.manifest.publisher.toLowerCase()}.${local.manifest.name.toLowerCase()}`);
                    if (Array.isArray(installedExtensions.includes) && installedExtensions.includes.length) {
                        const extensionIncludes = installedExtensions.includes.map(e => e.toLowerCase());
                        includesCheck = localExtensions.some(e => extensionIncludes.indexOf(e) > -1);
                    }
                    if (Array.isArray(installedExtensions.excludes) && installedExtensions.excludes.length) {
                        const extensionExcludes = installedExtensions.excludes.map(e => e.toLowerCase());
                        excludesCheck = !localExtensions.some(e => extensionExcludes.indexOf(e) > -1);
                    }
                    return includesCheck && excludesCheck;
                });
            }
            const storageKey = 'experiments.' + experiment.id;
            const experimentState = safeParse(this.storageService.get(storageKey, 0 /* StorageScope.GLOBAL */), {});
            return extensionsCheckPromise.then(success => {
                const fileEdits = condition.fileEdits;
                if (!success || !fileEdits || typeof fileEdits.minEditCount !== 'number') {
                    const runExperiment = success && typeof condition.userProbability === 'number' && Math.random() < condition.userProbability;
                    return runExperiment ? 2 /* ExperimentState.Run */ : 1 /* ExperimentState.NoRun */;
                }
                experimentState.editCount = experimentState.editCount || 0;
                if (experimentState.editCount >= fileEdits.minEditCount) {
                    return 2 /* ExperimentState.Run */;
                }
                // Process model-save event every 250ms to reduce load
                const onModelsSavedWorker = this._register(new async_1.RunOnceWorker(models => {
                    const date = new Date().toDateString();
                    const latestExperimentState = safeParse(this.storageService.get(storageKey, 0 /* StorageScope.GLOBAL */), {});
                    if (latestExperimentState.state !== 0 /* ExperimentState.Evaluating */) {
                        onSaveHandler.dispose();
                        onModelsSavedWorker.dispose();
                        return;
                    }
                    models.forEach(async (model) => {
                        if (latestExperimentState.state !== 0 /* ExperimentState.Evaluating */
                            || date === latestExperimentState.lastEditedDate
                            || (typeof latestExperimentState.editCount === 'number' && latestExperimentState.editCount >= fileEdits.minEditCount)) {
                            return;
                        }
                        let filePathCheck = true;
                        let workspaceCheck = true;
                        if (typeof fileEdits.filePathPattern === 'string') {
                            filePathCheck = (0, glob_1.match)(fileEdits.filePathPattern, model.resource.fsPath);
                        }
                        if (Array.isArray(fileEdits.workspaceIncludes) && fileEdits.workspaceIncludes.length) {
                            const tags = await this.workspaceTagsService.getTags();
                            workspaceCheck = !!tags && fileEdits.workspaceIncludes.some(x => !!tags[x]);
                        }
                        if (workspaceCheck && Array.isArray(fileEdits.workspaceExcludes) && fileEdits.workspaceExcludes.length) {
                            const tags = await this.workspaceTagsService.getTags();
                            workspaceCheck = !!tags && !fileEdits.workspaceExcludes.some(x => !!tags[x]);
                        }
                        if (filePathCheck && workspaceCheck) {
                            latestExperimentState.editCount = (latestExperimentState.editCount || 0) + 1;
                            latestExperimentState.lastEditedDate = date;
                            this.storageService.store(storageKey, JSON.stringify(latestExperimentState), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                        }
                    });
                    if (typeof latestExperimentState.editCount === 'number' && latestExperimentState.editCount >= fileEdits.minEditCount) {
                        processedExperiment.state = latestExperimentState.state = (typeof condition.userProbability === 'number' && Math.random() < condition.userProbability && this.checkExperimentDependencies(experiment)) ? 2 /* ExperimentState.Run */ : 1 /* ExperimentState.NoRun */;
                        this.storageService.store(storageKey, JSON.stringify(latestExperimentState), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                        if (latestExperimentState.state === 2 /* ExperimentState.Run */ && processedExperiment.action && ExperimentActionType[processedExperiment.action.type] === ExperimentActionType.Prompt) {
                            this.fireRunExperiment(processedExperiment);
                        }
                    }
                }, 250));
                const onSaveHandler = this._register(this.textFileService.files.onDidSave(e => onModelsSavedWorker.work(e.model)));
                return 0 /* ExperimentState.Evaluating */;
            });
        }
    };
    ExperimentService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, extensionManagement_1.IExtensionManagementService),
        __param(2, textfiles_1.ITextFileService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, lifecycle_2.ILifecycleService),
        __param(5, request_1.IRequestService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, productService_1.IProductService),
        __param(8, workspaceTags_1.IWorkspaceTagsService),
        __param(9, extensions_1.IExtensionService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService)
    ], ExperimentService);
    exports.ExperimentService = ExperimentService;
    function safeParse(text, defaultObject) {
        try {
            return text ? JSON.parse(text) || defaultObject : defaultObject;
        }
        catch (e) {
            return defaultObject;
        }
    }
});
//# sourceMappingURL=experimentService.js.map