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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/platform/storage/common/storage", "vs/workbench/common/memento", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/base/common/lifecycle", "vs/platform/userDataSync/common/userDataSync", "vs/base/common/uri", "vs/base/common/resources", "vs/base/common/network", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/contrib/welcomeGettingStarted/common/gettingStartedContent", "vs/workbench/services/assignment/common/assignmentService", "vs/workbench/services/host/browser/host", "vs/platform/configuration/common/configuration", "vs/base/common/linkedText", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedExtensionPoint", "vs/platform/instantiation/common/extensions", "vs/base/common/path", "vs/base/common/arrays", "vs/workbench/common/views", "vs/nls", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/extensions/common/workspaceContains", "vs/platform/workspace/common/workspace", "vs/base/common/cancellation", "vs/workbench/services/extensionManagement/common/extensionManagement"], function (require, exports, instantiation_1, event_1, storage_1, memento_1, actions_1, commands_1, contextkey_1, lifecycle_1, userDataSync_1, uri_1, resources_1, network_1, extensionManagement_1, gettingStartedContent_1, assignmentService_1, host_1, configuration_1, linkedText_1, gettingStartedExtensionPoint_1, extensions_1, path_1, arrays_1, views_1, nls_1, telemetry_1, workspaceContains_1, workspace_1, cancellation_1, extensionManagement_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertInternalMediaPathToFileURI = exports.WalkthroughsService = exports.walkthroughMetadataConfigurationKey = exports.hiddenEntriesConfigurationKey = exports.IWalkthroughsService = exports.HasMultipleNewFileEntries = void 0;
    exports.HasMultipleNewFileEntries = new contextkey_1.RawContextKey('hasMultipleNewFileEntries', false);
    exports.IWalkthroughsService = (0, instantiation_1.createDecorator)('walkthroughsService');
    exports.hiddenEntriesConfigurationKey = 'workbench.welcomePage.hiddenCategories';
    exports.walkthroughMetadataConfigurationKey = 'workbench.welcomePage.walkthroughMetadata';
    const BUILT_IN_SOURCE = (0, nls_1.localize)('builtin', "Built-In");
    // Show walkthrough as "new" for 7 days after first install
    const DAYS = 24 * 60 * 60 * 1000;
    const NEW_WALKTHROUGH_TIME = 7 * DAYS;
    let WalkthroughsService = class WalkthroughsService extends lifecycle_1.Disposable {
        constructor(storageService, commandService, instantiationService, workspaceContextService, contextService, userDataSyncEnablementService, configurationService, extensionManagementService, hostService, viewsService, telemetryService, tasExperimentService) {
            super();
            this.storageService = storageService;
            this.commandService = commandService;
            this.instantiationService = instantiationService;
            this.workspaceContextService = workspaceContextService;
            this.contextService = contextService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.configurationService = configurationService;
            this.extensionManagementService = extensionManagementService;
            this.hostService = hostService;
            this.viewsService = viewsService;
            this.telemetryService = telemetryService;
            this._onDidAddWalkthrough = new event_1.Emitter();
            this.onDidAddWalkthrough = this._onDidAddWalkthrough.event;
            this._onDidRemoveWalkthrough = new event_1.Emitter();
            this.onDidRemoveWalkthrough = this._onDidRemoveWalkthrough.event;
            this._onDidChangeWalkthrough = new event_1.Emitter();
            this.onDidChangeWalkthrough = this._onDidChangeWalkthrough.event;
            this._onDidProgressStep = new event_1.Emitter();
            this.onDidProgressStep = this._onDidProgressStep.event;
            this.sessionEvents = new Set();
            this.completionListeners = new Map();
            this.gettingStartedContributions = new Map();
            this.steps = new Map();
            this.sessionInstalledExtensions = new Set();
            this.categoryVisibilityContextKeys = new Set();
            this.stepCompletionContextKeyExpressions = new Set();
            this.stepCompletionContextKeys = new Set();
            this.tasExperimentService = tasExperimentService;
            this.metadata = new Map(JSON.parse(this.storageService.get(exports.walkthroughMetadataConfigurationKey, 0 /* StorageScope.GLOBAL */, '[]')));
            this.memento = new memento_1.Memento('gettingStartedService', this.storageService);
            this.stepProgress = this.memento.getMemento(0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            gettingStartedExtensionPoint_1.walkthroughsExtensionPoint.setHandler(async (_, { added, removed }) => {
                await Promise.all([...added.map(e => this.registerExtensionWalkthroughContributions(e.description)),
                    ...removed.map(e => this.unregisterExtensionWalkthroughContributions(e.description))]);
                this.triggerInstalledExtensionsRegistered();
            });
            this.initCompletionEventListeners();
            exports.HasMultipleNewFileEntries.bindTo(this.contextService).set(false);
            this.installedExtensionsRegistered = new Promise(r => this.triggerInstalledExtensionsRegistered = r);
            gettingStartedContent_1.walkthroughs.forEach(async (category, index) => {
                var _a;
                this._registerWalkthrough(Object.assign(Object.assign({}, category), { icon: { type: 'icon', icon: category.icon }, order: gettingStartedContent_1.walkthroughs.length - index, source: BUILT_IN_SOURCE, when: (_a = contextkey_1.ContextKeyExpr.deserialize(category.when)) !== null && _a !== void 0 ? _a : contextkey_1.ContextKeyExpr.true(), steps: category.content.steps.map((step, index) => {
                        var _a, _b;
                        return (Object.assign(Object.assign({}, step), { completionEvents: (_a = step.completionEvents) !== null && _a !== void 0 ? _a : [], description: parseDescription(step.description), category: category.id, order: index, when: (_b = contextkey_1.ContextKeyExpr.deserialize(step.when)) !== null && _b !== void 0 ? _b : contextkey_1.ContextKeyExpr.true(), media: step.media.type === 'image'
                                ? {
                                    type: 'image',
                                    altText: step.media.altText,
                                    path: convertInternalMediaPathsToBrowserURIs(step.media.path)
                                }
                                : step.media.type === 'svg'
                                    ? {
                                        type: 'svg',
                                        altText: step.media.altText,
                                        path: (0, exports.convertInternalMediaPathToFileURI)(step.media.path).with({ query: JSON.stringify({ moduleId: 'vs/workbench/contrib/welcomeGettingStarted/common/media/' + step.media.path }) })
                                    }
                                    : {
                                        type: 'markdown',
                                        path: (0, exports.convertInternalMediaPathToFileURI)(step.media.path).with({ query: JSON.stringify({ moduleId: 'vs/workbench/contrib/welcomeGettingStarted/common/media/' + step.media.path }) }),
                                        base: network_1.FileAccess.asFileUri('vs/workbench/contrib/welcomeGettingStarted/common/media/', require),
                                        root: network_1.FileAccess.asFileUri('vs/workbench/contrib/welcomeGettingStarted/common/media/', require),
                                    } }));
                    }) }));
            });
        }
        initCompletionEventListeners() {
            this._register(this.commandService.onDidExecuteCommand(command => this.progressByEvent(`onCommand:${command.commandId}`)));
            this.extensionManagementService.getInstalled().then(installed => {
                installed.forEach(ext => this.progressByEvent(`extensionInstalled:${ext.identifier.id.toLowerCase()}`));
            });
            this._register(this.extensionManagementService.onDidInstallExtensions(async (result) => {
                const hadLastFoucs = await this.hostService.hadLastFocus();
                for (const e of result) {
                    if (hadLastFoucs) {
                        this.sessionInstalledExtensions.add(e.identifier.id.toLowerCase());
                    }
                    this.progressByEvent(`extensionInstalled:${e.identifier.id.toLowerCase()}`);
                }
            }));
            this._register(this.contextService.onDidChangeContext(event => {
                if (event.affectsSome(this.stepCompletionContextKeys)) {
                    this.stepCompletionContextKeyExpressions.forEach(expression => {
                        if (event.affectsSome(new Set(expression.keys())) && this.contextService.contextMatchesRules(expression)) {
                            this.progressByEvent(`onContext:` + expression.serialize());
                        }
                    });
                }
            }));
            this._register(this.viewsService.onDidChangeViewVisibility(e => {
                if (e.visible) {
                    this.progressByEvent('onView:' + e.id);
                }
            }));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                e.affectedKeys.forEach(key => { this.progressByEvent('onSettingChanged:' + key); });
            }));
            if (this.userDataSyncEnablementService.isEnabled()) {
                this.progressByEvent('onEvent:sync-enabled');
            }
            this._register(this.userDataSyncEnablementService.onDidChangeEnablement(() => {
                if (this.userDataSyncEnablementService.isEnabled()) {
                    this.progressByEvent('onEvent:sync-enabled');
                }
            }));
        }
        markWalkthroughOpened(id) {
            const walkthrough = this.gettingStartedContributions.get(id);
            const prior = this.metadata.get(id);
            if (prior && walkthrough) {
                this.metadata.set(id, Object.assign(Object.assign({}, prior), { manaullyOpened: true, stepIDs: walkthrough.steps.map(s => s.id) }));
            }
            this.storageService.store(exports.walkthroughMetadataConfigurationKey, JSON.stringify([...this.metadata.entries()]), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
        }
        async registerExtensionWalkthroughContributions(extension) {
            var _a, _b, _c, _d;
            const convertExtensionPathToFileURI = (path) => path.startsWith('https://')
                ? uri_1.URI.parse(path, true)
                : network_1.FileAccess.asFileUri((0, resources_1.joinPath)(extension.extensionLocation, path));
            const convertExtensionRelativePathsToBrowserURIs = (path) => {
                var _a;
                const convertPath = (path) => path.startsWith('https://')
                    ? uri_1.URI.parse(path, true)
                    : network_1.FileAccess.asBrowserUri((0, resources_1.joinPath)(extension.extensionLocation, path));
                if (typeof path === 'string') {
                    const converted = convertPath(path);
                    return { hcDark: converted, hcLight: converted, dark: converted, light: converted };
                }
                else {
                    return {
                        hcDark: convertPath(path.hc),
                        hcLight: convertPath((_a = path.hcLight) !== null && _a !== void 0 ? _a : path.light),
                        light: convertPath(path.light),
                        dark: convertPath(path.dark)
                    };
                }
            };
            if (!((_b = (_a = extension.contributes) === null || _a === void 0 ? void 0 : _a.walkthroughs) === null || _b === void 0 ? void 0 : _b.length)) {
                return;
            }
            let sectionToOpen;
            let sectionToOpenIndex = Math.min(); // '+Infinity';
            await Promise.all((_d = (_c = extension.contributes) === null || _c === void 0 ? void 0 : _c.walkthroughs) === null || _d === void 0 ? void 0 : _d.map(async (walkthrough, index) => {
                var _a, _b, _c, _d, _e, _f, _g;
                const categoryID = extension.identifier.value + '#' + walkthrough.id;
                const isNewlyInstalled = !this.metadata.get(categoryID);
                if (isNewlyInstalled) {
                    this.metadata.set(categoryID, { firstSeen: +new Date(), stepIDs: (_b = (_a = walkthrough.steps) === null || _a === void 0 ? void 0 : _a.map(s => s.id)) !== null && _b !== void 0 ? _b : [], manaullyOpened: false });
                }
                const override = await Promise.race([
                    (_c = this.tasExperimentService) === null || _c === void 0 ? void 0 : _c.getTreatment(`gettingStarted.overrideCategory.${extension.identifier.value + '.' + walkthrough.id}.when`),
                    new Promise(resolve => setTimeout(() => resolve(walkthrough.when), 5000))
                ]);
                if (this.sessionInstalledExtensions.has(extension.identifier.value.toLowerCase())
                    && this.contextService.contextMatchesRules((_d = contextkey_1.ContextKeyExpr.deserialize(override !== null && override !== void 0 ? override : walkthrough.when)) !== null && _d !== void 0 ? _d : contextkey_1.ContextKeyExpr.true())) {
                    this.sessionInstalledExtensions.delete(extension.identifier.value.toLowerCase());
                    if (index < sectionToOpenIndex && isNewlyInstalled) {
                        sectionToOpen = categoryID;
                        sectionToOpenIndex = index;
                    }
                }
                const steps = ((_e = walkthrough.steps) !== null && _e !== void 0 ? _e : []).map((step, index) => {
                    var _a, _b, _c;
                    const description = parseDescription(step.description || '');
                    const fullyQualifiedID = extension.identifier.value + '#' + walkthrough.id + '#' + step.id;
                    let media;
                    if (!step.media) {
                        throw Error('missing media in walkthrough step: ' + walkthrough.id + '@' + step.id);
                    }
                    if (step.media.image) {
                        const altText = step.media.altText;
                        if (altText === undefined) {
                            console.error('Walkthrough item:', fullyQualifiedID, 'is missing altText for its media element.');
                        }
                        media = { type: 'image', altText, path: convertExtensionRelativePathsToBrowserURIs(step.media.image) };
                    }
                    else if (step.media.markdown) {
                        media = {
                            type: 'markdown',
                            path: convertExtensionPathToFileURI(step.media.markdown),
                            base: convertExtensionPathToFileURI((0, path_1.dirname)(step.media.markdown)),
                            root: network_1.FileAccess.asFileUri(extension.extensionLocation),
                        };
                    }
                    else if (step.media.svg) {
                        media = {
                            type: 'svg',
                            path: convertExtensionPathToFileURI(step.media.svg),
                            altText: step.media.svg,
                        };
                    }
                    // Legacy media config (only in use by remote-wsl at the moment)
                    else {
                        const legacyMedia = step.media;
                        if (typeof legacyMedia.path === 'string' && legacyMedia.path.endsWith('.md')) {
                            media = {
                                type: 'markdown',
                                path: convertExtensionPathToFileURI(legacyMedia.path),
                                base: convertExtensionPathToFileURI((0, path_1.dirname)(legacyMedia.path)),
                                root: network_1.FileAccess.asFileUri(extension.extensionLocation),
                            };
                        }
                        else {
                            const altText = legacyMedia.altText;
                            if (altText === undefined) {
                                console.error('Walkthrough item:', fullyQualifiedID, 'is missing altText for its media element.');
                            }
                            media = { type: 'image', altText, path: convertExtensionRelativePathsToBrowserURIs(legacyMedia.path) };
                        }
                    }
                    return ({
                        description, media,
                        completionEvents: (_b = (_a = step.completionEvents) === null || _a === void 0 ? void 0 : _a.filter(x => typeof x === 'string')) !== null && _b !== void 0 ? _b : [],
                        id: fullyQualifiedID,
                        title: step.title,
                        when: (_c = contextkey_1.ContextKeyExpr.deserialize(step.when)) !== null && _c !== void 0 ? _c : contextkey_1.ContextKeyExpr.true(),
                        category: categoryID,
                        order: index,
                    });
                });
                let isFeatured = false;
                if (walkthrough.featuredFor) {
                    const folders = this.workspaceContextService.getWorkspace().folders.map(f => f.uri);
                    const token = new cancellation_1.CancellationTokenSource();
                    setTimeout(() => token.cancel(), 2000);
                    isFeatured = await this.instantiationService.invokeFunction(a => (0, workspaceContains_1.checkGlobFileExists)(a, folders, walkthrough.featuredFor, token.token));
                }
                const walkthoughDescriptor = {
                    description: walkthrough.description,
                    title: walkthrough.title,
                    id: categoryID,
                    isFeatured,
                    source: (_f = extension.displayName) !== null && _f !== void 0 ? _f : extension.name,
                    order: 0,
                    steps,
                    icon: {
                        type: 'image',
                        path: extension.icon
                            ? network_1.FileAccess.asBrowserUri((0, resources_1.joinPath)(extension.extensionLocation, extension.icon)).toString(true)
                            : extensionManagement_2.DefaultIconPath
                    },
                    when: (_g = contextkey_1.ContextKeyExpr.deserialize(override !== null && override !== void 0 ? override : walkthrough.when)) !== null && _g !== void 0 ? _g : contextkey_1.ContextKeyExpr.true(),
                };
                this._registerWalkthrough(walkthoughDescriptor);
                this._onDidAddWalkthrough.fire(this.resolveWalkthrough(walkthoughDescriptor));
            }));
            this.storageService.store(exports.walkthroughMetadataConfigurationKey, JSON.stringify([...this.metadata.entries()]), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            if (sectionToOpen && this.configurationService.getValue('workbench.welcomePage.walkthroughs.openOnInstall')) {
                this.telemetryService.publicLog2('gettingStarted.didAutoOpenWalkthrough', { id: sectionToOpen });
                this.commandService.executeCommand('workbench.action.openWalkthrough', sectionToOpen);
            }
        }
        unregisterExtensionWalkthroughContributions(extension) {
            var _a, _b, _c, _d;
            if (!((_b = (_a = extension.contributes) === null || _a === void 0 ? void 0 : _a.walkthroughs) === null || _b === void 0 ? void 0 : _b.length)) {
                return;
            }
            (_d = (_c = extension.contributes) === null || _c === void 0 ? void 0 : _c.walkthroughs) === null || _d === void 0 ? void 0 : _d.forEach(section => {
                const categoryID = extension.identifier.value + '#walkthrough#' + section.id;
                section.steps.forEach(step => {
                    const fullyQualifiedID = extension.identifier.value + '#' + section.id + '#' + step.id;
                    this.steps.delete(fullyQualifiedID);
                });
                this.gettingStartedContributions.delete(categoryID);
                this._onDidRemoveWalkthrough.fire(categoryID);
            });
        }
        getWalkthrough(id) {
            const walkthrough = this.gettingStartedContributions.get(id);
            if (!walkthrough) {
                throw Error('Trying to get unknown walkthrough: ' + id);
            }
            return this.resolveWalkthrough(walkthrough);
        }
        getWalkthroughs() {
            const registeredCategories = [...this.gettingStartedContributions.values()];
            const categoriesWithCompletion = registeredCategories
                .map(category => {
                return Object.assign(Object.assign({}, category), { content: {
                        type: 'steps',
                        steps: category.steps
                    } });
            })
                .filter(category => category.content.type !== 'steps' || category.content.steps.length)
                .map(category => this.resolveWalkthrough(category));
            return categoriesWithCompletion;
        }
        resolveWalkthrough(category) {
            var _a, _b, _c;
            const stepsWithProgress = category.steps.map(step => this.getStepProgress(step));
            const hasOpened = (_a = this.metadata.get(category.id)) === null || _a === void 0 ? void 0 : _a.manaullyOpened;
            const firstSeenDate = (_b = this.metadata.get(category.id)) === null || _b === void 0 ? void 0 : _b.firstSeen;
            const isNew = firstSeenDate && firstSeenDate > (+new Date() - NEW_WALKTHROUGH_TIME);
            const lastStepIDs = (_c = this.metadata.get(category.id)) === null || _c === void 0 ? void 0 : _c.stepIDs;
            const rawCategory = this.gettingStartedContributions.get(category.id);
            if (!rawCategory) {
                throw Error('Could not find walkthrough with id ' + category.id);
            }
            const currentStepIds = rawCategory.steps.map(s => s.id);
            const hasNewSteps = lastStepIDs && (currentStepIds.length !== lastStepIDs.length || currentStepIds.some((id, index) => id !== lastStepIDs[index]));
            let recencyBonus = 0;
            if (firstSeenDate) {
                const currentDate = +new Date();
                const timeSinceFirstSeen = currentDate - firstSeenDate;
                recencyBonus = Math.max(0, (NEW_WALKTHROUGH_TIME - timeSinceFirstSeen) / NEW_WALKTHROUGH_TIME);
            }
            return Object.assign(Object.assign({}, category), { recencyBonus, steps: stepsWithProgress, newItems: !!hasNewSteps, newEntry: !!(isNew && !hasOpened) });
        }
        getStepProgress(step) {
            return Object.assign(Object.assign(Object.assign({}, step), { done: false }), this.stepProgress[step.id]);
        }
        progressStep(id) {
            const oldProgress = this.stepProgress[id];
            if (!oldProgress || oldProgress.done !== true) {
                this.stepProgress[id] = { done: true };
                this.memento.saveMemento();
                const step = this.getStep(id);
                if (!step) {
                    throw Error('Tried to progress unknown step');
                }
                this._onDidProgressStep.fire(this.getStepProgress(step));
            }
        }
        deprogressStep(id) {
            delete this.stepProgress[id];
            this.memento.saveMemento();
            const step = this.getStep(id);
            this._onDidProgressStep.fire(this.getStepProgress(step));
        }
        progressByEvent(event) {
            var _a;
            if (this.sessionEvents.has(event)) {
                return;
            }
            this.sessionEvents.add(event);
            (_a = this.completionListeners.get(event)) === null || _a === void 0 ? void 0 : _a.forEach(id => this.progressStep(id));
        }
        registerWalkthrough(walkthoughDescriptor) {
            this._registerWalkthrough(Object.assign(Object.assign({}, walkthoughDescriptor), { steps: walkthoughDescriptor.steps.map(step => (Object.assign(Object.assign({}, step), { description: parseDescription(step.description) }))) }));
        }
        _registerWalkthrough(walkthroughDescriptor) {
            const oldCategory = this.gettingStartedContributions.get(walkthroughDescriptor.id);
            if (oldCategory) {
                console.error(`Skipping attempt to overwrite walkthrough. (${walkthroughDescriptor.id})`);
                return;
            }
            this.gettingStartedContributions.set(walkthroughDescriptor.id, walkthroughDescriptor);
            walkthroughDescriptor.steps.forEach(step => {
                if (this.steps.has(step.id)) {
                    throw Error('Attempting to register step with id ' + step.id + ' twice. Second is dropped.');
                }
                this.steps.set(step.id, step);
                step.when.keys().forEach(key => this.categoryVisibilityContextKeys.add(key));
                this.registerDoneListeners(step);
            });
            walkthroughDescriptor.when.keys().forEach(key => this.categoryVisibilityContextKeys.add(key));
        }
        registerDoneListeners(step) {
            var _a;
            if (step.doneOn) {
                console.error(`wakthrough step`, step, `uses deprecated 'doneOn' property. Adopt 'completionEvents' to silence this warning`);
                return;
            }
            if (!step.completionEvents.length) {
                step.completionEvents = (0, arrays_1.coalesce)((0, arrays_1.flatten)(step.description
                    .filter(linkedText => linkedText.nodes.length === 1) // only buttons
                    .map(linkedText => linkedText.nodes
                    .filter(((node) => typeof node !== 'string'))
                    .map(({ href }) => {
                    if (href.startsWith('command:')) {
                        return 'onCommand:' + href.slice('command:'.length, href.includes('?') ? href.indexOf('?') : undefined);
                    }
                    if (href.startsWith('https://') || href.startsWith('http://')) {
                        return 'onLink:' + href;
                    }
                    return undefined;
                }))));
            }
            if (!step.completionEvents.length) {
                step.completionEvents.push('stepSelected');
            }
            for (let event of step.completionEvents) {
                const [_, eventType, argument] = (_a = /^([^:]*):?(.*)$/.exec(event)) !== null && _a !== void 0 ? _a : [];
                if (!eventType) {
                    console.error(`Unknown completionEvent ${event} when registering step ${step.id}`);
                    continue;
                }
                switch (eventType) {
                    case 'onLink':
                    case 'onEvent':
                    case 'onView':
                    case 'onSettingChanged':
                        break;
                    case 'onContext': {
                        const expression = contextkey_1.ContextKeyExpr.deserialize(argument);
                        if (expression) {
                            this.stepCompletionContextKeyExpressions.add(expression);
                            expression.keys().forEach(key => this.stepCompletionContextKeys.add(key));
                            event = eventType + ':' + expression.serialize();
                            if (this.contextService.contextMatchesRules(expression)) {
                                this.sessionEvents.add(event);
                            }
                        }
                        else {
                            console.error('Unable to parse context key expression:', expression, 'in walkthrough step', step.id);
                        }
                        break;
                    }
                    case 'onStepSelected':
                    case 'stepSelected':
                        event = 'stepSelected:' + step.id;
                        break;
                    case 'onCommand':
                        event = eventType + ':' + argument.replace(/^toSide:/, '');
                        break;
                    case 'onExtensionInstalled':
                    case 'extensionInstalled':
                        event = 'extensionInstalled:' + argument.toLowerCase();
                        break;
                    default:
                        console.error(`Unknown completionEvent ${event} when registering step ${step.id}`);
                        continue;
                }
                this.registerCompletionListener(event, step);
                if (this.sessionEvents.has(event)) {
                    this.progressStep(step.id);
                }
            }
        }
        registerCompletionListener(event, step) {
            var _a;
            if (!this.completionListeners.has(event)) {
                this.completionListeners.set(event, new Set());
            }
            (_a = this.completionListeners.get(event)) === null || _a === void 0 ? void 0 : _a.add(step.id);
        }
        getStep(id) {
            const step = this.steps.get(id);
            if (!step) {
                throw Error('Attempting to access step which does not exist in registry ' + id);
            }
            return step;
        }
    };
    WalkthroughsService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, commands_1.ICommandService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, userDataSync_1.IUserDataSyncEnablementService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, extensionManagement_1.IExtensionManagementService),
        __param(8, host_1.IHostService),
        __param(9, views_1.IViewsService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, assignmentService_1.IWorkbenchAssignmentService)
    ], WalkthroughsService);
    exports.WalkthroughsService = WalkthroughsService;
    const parseDescription = (desc) => desc.split('\n').filter(x => x).map(text => (0, linkedText_1.parseLinkedText)(text));
    const convertInternalMediaPathToFileURI = (path) => path.startsWith('https://')
        ? uri_1.URI.parse(path, true)
        : network_1.FileAccess.asFileUri('vs/workbench/contrib/welcomeGettingStarted/common/media/' + path, require);
    exports.convertInternalMediaPathToFileURI = convertInternalMediaPathToFileURI;
    const convertInternalMediaPathToBrowserURI = (path) => path.startsWith('https://')
        ? uri_1.URI.parse(path, true)
        : network_1.FileAccess.asBrowserUri('vs/workbench/contrib/welcomeGettingStarted/common/media/' + path, require);
    const convertInternalMediaPathsToBrowserURIs = (path) => {
        var _a;
        if (typeof path === 'string') {
            const converted = convertInternalMediaPathToBrowserURI(path);
            return { hcDark: converted, hcLight: converted, dark: converted, light: converted };
        }
        else {
            return {
                hcDark: convertInternalMediaPathToBrowserURI(path.hc),
                hcLight: convertInternalMediaPathToBrowserURI((_a = path.hcLight) !== null && _a !== void 0 ? _a : path.light),
                light: convertInternalMediaPathToBrowserURI(path.light),
                dark: convertInternalMediaPathToBrowserURI(path.dark)
            };
        }
    };
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'resetGettingStartedProgress',
                category: 'Developer',
                title: 'Reset Welcome Page Walkthrough Progress',
                f1: true
            });
        }
        run(accessor) {
            const gettingStartedService = accessor.get(exports.IWalkthroughsService);
            const storageService = accessor.get(storage_1.IStorageService);
            storageService.store(exports.hiddenEntriesConfigurationKey, JSON.stringify([]), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            storageService.store(exports.walkthroughMetadataConfigurationKey, JSON.stringify([]), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            const memento = new memento_1.Memento('gettingStartedService', accessor.get(storage_1.IStorageService));
            const record = memento.getMemento(0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            for (const key in record) {
                if (Object.prototype.hasOwnProperty.call(record, key)) {
                    try {
                        gettingStartedService.deprogressStep(key);
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
            }
            memento.saveMemento();
        }
    });
    (0, extensions_1.registerSingleton)(exports.IWalkthroughsService, WalkthroughsService);
});
//# sourceMappingURL=gettingStartedService.js.map