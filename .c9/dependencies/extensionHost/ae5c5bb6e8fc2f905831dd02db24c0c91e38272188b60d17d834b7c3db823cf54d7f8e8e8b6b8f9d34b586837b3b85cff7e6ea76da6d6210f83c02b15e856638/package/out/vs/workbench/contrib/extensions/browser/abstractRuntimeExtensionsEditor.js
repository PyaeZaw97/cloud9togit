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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/workbench/browser/parts/editor/editorPane", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/theme/common/themeService", "vs/workbench/services/extensions/common/extensions", "vs/platform/list/browser/listService", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/lifecycle", "vs/base/common/async", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/contextview/browser/contextView", "vs/base/common/decorators", "vs/base/common/arrays", "vs/platform/notification/common/notification", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/platform/label/common/label", "vs/base/browser/ui/iconLabel/iconLabels", "vs/platform/extensions/common/extensions", "vs/base/common/network", "vs/workbench/services/environment/common/environmentService", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/extensions/common/runtimeExtensionsInput", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/css!./media/runtimeExtensionsEditor"], function (require, exports, nls, actions_1, editorPane_1, telemetry_1, instantiation_1, extensions_1, themeService_1, extensions_2, listService_1, dom_1, actionbar_1, lifecycle_1, async_1, extensionManagement_1, contextView_1, decorators_1, arrays_1, notification_1, contextkey_1, storage_1, label_1, iconLabels_1, extensions_3, network_1, environmentService_1, colorRegistry_1, editorService_1, runtimeExtensionsInput_1, actions_2, actions_3, clipboardService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShowRuntimeExtensionsAction = exports.AbstractRuntimeExtensionsEditor = void 0;
    let AbstractRuntimeExtensionsEditor = class AbstractRuntimeExtensionsEditor extends editorPane_1.EditorPane {
        constructor(telemetryService, themeService, contextKeyService, _extensionsWorkbenchService, _extensionService, _notificationService, _contextMenuService, _instantiationService, storageService, _labelService, _environmentService, _clipboardService) {
            super(AbstractRuntimeExtensionsEditor.ID, telemetryService, themeService, storageService);
            this._extensionsWorkbenchService = _extensionsWorkbenchService;
            this._extensionService = _extensionService;
            this._notificationService = _notificationService;
            this._contextMenuService = _contextMenuService;
            this._instantiationService = _instantiationService;
            this._labelService = _labelService;
            this._environmentService = _environmentService;
            this._clipboardService = _clipboardService;
            this._list = null;
            this._elements = null;
            this._updateSoon = this._register(new async_1.RunOnceScheduler(() => this._updateExtensions(), 200));
            this._register(this._extensionService.onDidChangeExtensionsStatus(() => this._updateSoon.schedule()));
            this._updateExtensions();
        }
        async _updateExtensions() {
            this._elements = await this._resolveExtensions();
            if (this._list) {
                this._list.splice(0, this._list.length, this._elements);
            }
        }
        async _resolveExtensions() {
            // We only deal with extensions with source code!
            const extensionsDescriptions = (await this._extensionService.getExtensions()).filter((extension) => {
                return Boolean(extension.main) || Boolean(extension.browser);
            });
            let marketplaceMap = Object.create(null);
            const marketPlaceExtensions = await this._extensionsWorkbenchService.queryLocal();
            for (let extension of marketPlaceExtensions) {
                marketplaceMap[extensions_3.ExtensionIdentifier.toKey(extension.identifier.id)] = extension;
            }
            let statusMap = this._extensionService.getExtensionsStatus();
            // group profile segments by extension
            let segments = Object.create(null);
            const profileInfo = this._getProfileInfo();
            if (profileInfo) {
                let currentStartTime = profileInfo.startTime;
                for (let i = 0, len = profileInfo.deltas.length; i < len; i++) {
                    const id = profileInfo.ids[i];
                    const delta = profileInfo.deltas[i];
                    let extensionSegments = segments[extensions_3.ExtensionIdentifier.toKey(id)];
                    if (!extensionSegments) {
                        extensionSegments = [];
                        segments[extensions_3.ExtensionIdentifier.toKey(id)] = extensionSegments;
                    }
                    extensionSegments.push(currentStartTime);
                    currentStartTime = currentStartTime + delta;
                    extensionSegments.push(currentStartTime);
                }
            }
            let result = [];
            for (let i = 0, len = extensionsDescriptions.length; i < len; i++) {
                const extensionDescription = extensionsDescriptions[i];
                let extProfileInfo = null;
                if (profileInfo) {
                    let extensionSegments = segments[extensions_3.ExtensionIdentifier.toKey(extensionDescription.identifier)] || [];
                    let extensionTotalTime = 0;
                    for (let j = 0, lenJ = extensionSegments.length / 2; j < lenJ; j++) {
                        const startTime = extensionSegments[2 * j];
                        const endTime = extensionSegments[2 * j + 1];
                        extensionTotalTime += (endTime - startTime);
                    }
                    extProfileInfo = {
                        segments: extensionSegments,
                        totalTime: extensionTotalTime
                    };
                }
                result[i] = {
                    originalIndex: i,
                    description: extensionDescription,
                    marketplaceInfo: marketplaceMap[extensions_3.ExtensionIdentifier.toKey(extensionDescription.identifier)],
                    status: statusMap[extensionDescription.identifier.value],
                    profileInfo: extProfileInfo || undefined,
                    unresponsiveProfile: this._getUnresponsiveProfile(extensionDescription.identifier)
                };
            }
            result = result.filter(element => element.status.activationTimes);
            // bubble up extensions that have caused slowness
            const isUnresponsive = (extension) => extension.unresponsiveProfile === profileInfo;
            const profileTime = (extension) => { var _a, _b; return (_b = (_a = extension.profileInfo) === null || _a === void 0 ? void 0 : _a.totalTime) !== null && _b !== void 0 ? _b : 0; };
            const activationTime = (extension) => {
                var _a, _b, _c, _d;
                return ((_b = (_a = extension.status.activationTimes) === null || _a === void 0 ? void 0 : _a.codeLoadingTime) !== null && _b !== void 0 ? _b : 0) +
                    ((_d = (_c = extension.status.activationTimes) === null || _c === void 0 ? void 0 : _c.activateCallTime) !== null && _d !== void 0 ? _d : 0);
            };
            result = result.sort((a, b) => {
                if (isUnresponsive(a) || isUnresponsive(b)) {
                    return +isUnresponsive(b) - +isUnresponsive(a);
                }
                else if (profileTime(a) || profileTime(b)) {
                    return profileTime(b) - profileTime(a);
                }
                else if (activationTime(a) || activationTime(b)) {
                    return activationTime(b) - activationTime(a);
                }
                return a.originalIndex - b.originalIndex;
            });
            return result;
        }
        createEditor(parent) {
            parent.classList.add('runtime-extensions-editor');
            const TEMPLATE_ID = 'runtimeExtensionElementTemplate';
            const delegate = new class {
                getHeight(element) {
                    return 62;
                }
                getTemplateId(element) {
                    return TEMPLATE_ID;
                }
            };
            const renderer = {
                templateId: TEMPLATE_ID,
                renderTemplate: (root) => {
                    const element = (0, dom_1.append)(root, (0, dom_1.$)('.extension'));
                    const iconContainer = (0, dom_1.append)(element, (0, dom_1.$)('.icon-container'));
                    const icon = (0, dom_1.append)(iconContainer, (0, dom_1.$)('img.icon'));
                    const desc = (0, dom_1.append)(element, (0, dom_1.$)('div.desc'));
                    const headerContainer = (0, dom_1.append)(desc, (0, dom_1.$)('.header-container'));
                    const header = (0, dom_1.append)(headerContainer, (0, dom_1.$)('.header'));
                    const name = (0, dom_1.append)(header, (0, dom_1.$)('div.name'));
                    const version = (0, dom_1.append)(header, (0, dom_1.$)('span.version'));
                    const msgContainer = (0, dom_1.append)(desc, (0, dom_1.$)('div.msg'));
                    const actionbar = new actionbar_1.ActionBar(desc, { animated: false });
                    actionbar.onDidRun(({ error }) => error && this._notificationService.error(error));
                    const timeContainer = (0, dom_1.append)(element, (0, dom_1.$)('.time'));
                    const activationTime = (0, dom_1.append)(timeContainer, (0, dom_1.$)('div.activation-time'));
                    const profileTime = (0, dom_1.append)(timeContainer, (0, dom_1.$)('div.profile-time'));
                    const disposables = [actionbar];
                    return {
                        root,
                        element,
                        icon,
                        name,
                        version,
                        actionbar,
                        activationTime,
                        profileTime,
                        msgContainer,
                        disposables,
                        elementDisposables: [],
                    };
                },
                renderElement: (element, index, data) => {
                    var _a, _b;
                    data.elementDisposables = (0, lifecycle_1.dispose)(data.elementDisposables);
                    data.root.classList.toggle('odd', index % 2 === 1);
                    data.elementDisposables.push((0, dom_1.addDisposableListener)(data.icon, 'error', () => { var _a; return data.icon.src = ((_a = element.marketplaceInfo) === null || _a === void 0 ? void 0 : _a.iconUrlFallback) || extensionManagement_1.DefaultIconPath; }, { once: true }));
                    data.icon.src = ((_a = element.marketplaceInfo) === null || _a === void 0 ? void 0 : _a.iconUrl) || extensionManagement_1.DefaultIconPath;
                    if (!data.icon.complete) {
                        data.icon.style.visibility = 'hidden';
                        data.icon.onload = () => data.icon.style.visibility = 'inherit';
                    }
                    else {
                        data.icon.style.visibility = 'inherit';
                    }
                    data.name.textContent = (((_b = element.marketplaceInfo) === null || _b === void 0 ? void 0 : _b.displayName) || element.description.identifier.value).substr(0, 50);
                    data.version.textContent = element.description.version;
                    const activationTimes = element.status.activationTimes;
                    let syncTime = activationTimes.codeLoadingTime + activationTimes.activateCallTime;
                    data.activationTime.textContent = activationTimes.activationReason.startup ? `Startup Activation: ${syncTime}ms` : `Activation: ${syncTime}ms`;
                    data.actionbar.clear();
                    const slowExtensionAction = this._createSlowExtensionAction(element);
                    if (slowExtensionAction) {
                        data.actionbar.push(slowExtensionAction, { icon: true, label: true });
                    }
                    if ((0, arrays_1.isNonEmptyArray)(element.status.runtimeErrors)) {
                        const reportExtensionIssueAction = this._createReportExtensionIssueAction(element);
                        if (reportExtensionIssueAction) {
                            data.actionbar.push(reportExtensionIssueAction, { icon: true, label: true });
                        }
                    }
                    let title;
                    const activationId = activationTimes.activationReason.extensionId.value;
                    const activationEvent = activationTimes.activationReason.activationEvent;
                    if (activationEvent === '*') {
                        title = nls.localize({
                            key: 'starActivation',
                            comment: [
                                '{0} will be an extension identifier'
                            ]
                        }, "Activated by {0} on start-up", activationId);
                    }
                    else if (/^workspaceContains:/.test(activationEvent)) {
                        let fileNameOrGlob = activationEvent.substr('workspaceContains:'.length);
                        if (fileNameOrGlob.indexOf('*') >= 0 || fileNameOrGlob.indexOf('?') >= 0) {
                            title = nls.localize({
                                key: 'workspaceContainsGlobActivation',
                                comment: [
                                    '{0} will be a glob pattern',
                                    '{1} will be an extension identifier'
                                ]
                            }, "Activated by {1} because a file matching {0} exists in your workspace", fileNameOrGlob, activationId);
                        }
                        else {
                            title = nls.localize({
                                key: 'workspaceContainsFileActivation',
                                comment: [
                                    '{0} will be a file name',
                                    '{1} will be an extension identifier'
                                ]
                            }, "Activated by {1} because file {0} exists in your workspace", fileNameOrGlob, activationId);
                        }
                    }
                    else if (/^workspaceContainsTimeout:/.test(activationEvent)) {
                        const glob = activationEvent.substr('workspaceContainsTimeout:'.length);
                        title = nls.localize({
                            key: 'workspaceContainsTimeout',
                            comment: [
                                '{0} will be a glob pattern',
                                '{1} will be an extension identifier'
                            ]
                        }, "Activated by {1} because searching for {0} took too long", glob, activationId);
                    }
                    else if (activationEvent === 'onStartupFinished') {
                        title = nls.localize({
                            key: 'startupFinishedActivation',
                            comment: [
                                'This refers to an extension. {0} will be an activation event.'
                            ]
                        }, "Activated by {0} after start-up finished", activationId);
                    }
                    else if (/^onLanguage:/.test(activationEvent)) {
                        let language = activationEvent.substr('onLanguage:'.length);
                        title = nls.localize('languageActivation', "Activated by {1} because you opened a {0} file", language, activationId);
                    }
                    else {
                        title = nls.localize({
                            key: 'workspaceGenericActivation',
                            comment: [
                                '{0} will be an activation event, like e.g. \'language:typescript\', \'debug\', etc.',
                                '{1} will be an extension identifier'
                            ]
                        }, "Activated by {1} on {0}", activationEvent, activationId);
                    }
                    data.activationTime.title = title;
                    (0, dom_1.clearNode)(data.msgContainer);
                    if (this._getUnresponsiveProfile(element.description.identifier)) {
                        const el = (0, dom_1.$)('span', undefined, ...(0, iconLabels_1.renderLabelWithIcons)(` $(alert) Unresponsive`));
                        el.title = nls.localize('unresponsive.title', "Extension has caused the extension host to freeze.");
                        data.msgContainer.appendChild(el);
                    }
                    if ((0, arrays_1.isNonEmptyArray)(element.status.runtimeErrors)) {
                        const el = (0, dom_1.$)('span', undefined, ...(0, iconLabels_1.renderLabelWithIcons)(`$(bug) ${nls.localize('errors', "{0} uncaught errors", element.status.runtimeErrors.length)}`));
                        data.msgContainer.appendChild(el);
                    }
                    if (element.status.messages && element.status.messages.length > 0) {
                        const el = (0, dom_1.$)('span', undefined, ...(0, iconLabels_1.renderLabelWithIcons)(`$(alert) ${element.status.messages[0].message}`));
                        data.msgContainer.appendChild(el);
                    }
                    let extraLabel = null;
                    if (element.status.runningLocation && element.status.runningLocation.equals(new extensions_2.LocalWebWorkerRunningLocation())) {
                        extraLabel = `$(globe) web worker`;
                    }
                    else if (element.description.extensionLocation.scheme === network_1.Schemas.vscodeRemote) {
                        const hostLabel = this._labelService.getHostLabel(network_1.Schemas.vscodeRemote, this._environmentService.remoteAuthority);
                        if (hostLabel) {
                            extraLabel = `$(remote) ${hostLabel}`;
                        }
                        else {
                            extraLabel = `$(remote) ${element.description.extensionLocation.authority}`;
                        }
                    }
                    else if (element.status.runningLocation && element.status.runningLocation.affinity > 0) {
                        extraLabel = `$(server-process) local process ${element.status.runningLocation.affinity + 1}`;
                    }
                    if (extraLabel) {
                        const el = (0, dom_1.$)('span', undefined, ...(0, iconLabels_1.renderLabelWithIcons)(extraLabel));
                        data.msgContainer.appendChild(el);
                    }
                    if (element.profileInfo) {
                        data.profileTime.textContent = `Profile: ${(element.profileInfo.totalTime / 1000).toFixed(2)}ms`;
                    }
                    else {
                        data.profileTime.textContent = '';
                    }
                },
                disposeTemplate: (data) => {
                    data.disposables = (0, lifecycle_1.dispose)(data.disposables);
                }
            };
            this._list = this._instantiationService.createInstance(listService_1.WorkbenchList, 'RuntimeExtensions', parent, delegate, [renderer], {
                multipleSelectionSupport: false,
                setRowLineHeight: false,
                horizontalScrolling: false,
                overrideStyles: {
                    listBackground: colorRegistry_1.editorBackground
                },
                accessibilityProvider: new class {
                    getWidgetAriaLabel() {
                        return nls.localize('runtimeExtensions', "Runtime Extensions");
                    }
                    getAriaLabel(element) {
                        return element.description.name;
                    }
                }
            });
            this._list.splice(0, this._list.length, this._elements || undefined);
            this._list.onContextMenu((e) => {
                if (!e.element) {
                    return;
                }
                const actions = [];
                actions.push(new actions_1.Action('runtimeExtensionsEditor.action.copyId', nls.localize('copy id', "Copy id ({0})", e.element.description.identifier.value), undefined, true, () => {
                    this._clipboardService.writeText(e.element.description.identifier.value);
                }));
                const reportExtensionIssueAction = this._createReportExtensionIssueAction(e.element);
                if (reportExtensionIssueAction) {
                    actions.push(reportExtensionIssueAction);
                }
                actions.push(new actions_1.Separator());
                if (e.element.marketplaceInfo) {
                    actions.push(new actions_1.Action('runtimeExtensionsEditor.action.disableWorkspace', nls.localize('disable workspace', "Disable (Workspace)"), undefined, true, () => this._extensionsWorkbenchService.setEnablement(e.element.marketplaceInfo, 7 /* EnablementState.DisabledWorkspace */)));
                    actions.push(new actions_1.Action('runtimeExtensionsEditor.action.disable', nls.localize('disable', "Disable"), undefined, true, () => this._extensionsWorkbenchService.setEnablement(e.element.marketplaceInfo, 6 /* EnablementState.DisabledGlobally */)));
                }
                actions.push(new actions_1.Separator());
                const profileAction = this._createProfileAction();
                if (profileAction) {
                    actions.push(profileAction);
                }
                const saveExtensionHostProfileAction = this.saveExtensionHostProfileAction;
                if (saveExtensionHostProfileAction) {
                    actions.push(saveExtensionHostProfileAction);
                }
                this._contextMenuService.showContextMenu({
                    getAnchor: () => e.anchor,
                    getActions: () => actions
                });
            });
        }
        get saveExtensionHostProfileAction() {
            return this._createSaveExtensionHostProfileAction();
        }
        layout(dimension) {
            if (this._list) {
                this._list.layout(dimension.height);
            }
        }
    };
    AbstractRuntimeExtensionsEditor.ID = 'workbench.editor.runtimeExtensions';
    __decorate([
        decorators_1.memoize
    ], AbstractRuntimeExtensionsEditor.prototype, "saveExtensionHostProfileAction", null);
    AbstractRuntimeExtensionsEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, extensions_1.IExtensionsWorkbenchService),
        __param(4, extensions_2.IExtensionService),
        __param(5, notification_1.INotificationService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, storage_1.IStorageService),
        __param(9, label_1.ILabelService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService),
        __param(11, clipboardService_1.IClipboardService)
    ], AbstractRuntimeExtensionsEditor);
    exports.AbstractRuntimeExtensionsEditor = AbstractRuntimeExtensionsEditor;
    class ShowRuntimeExtensionsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.showRuntimeExtensions',
                title: { value: nls.localize('showRuntimeExtensions', "Show Running Extensions"), original: 'Show Running Extensions' },
                category: actions_3.CATEGORIES.Developer,
                f1: true,
                menu: {
                    id: actions_2.MenuId.ViewContainerTitle,
                    when: contextkey_1.ContextKeyExpr.equals('viewContainer', 'workbench.view.extensions'),
                    group: '2_enablement',
                    order: 3
                }
            });
        }
        async run(accessor) {
            await accessor.get(editorService_1.IEditorService).openEditor(runtimeExtensionsInput_1.RuntimeExtensionsInput.instance, { pinned: true });
        }
    }
    exports.ShowRuntimeExtensionsAction = ShowRuntimeExtensionsAction;
});
//# sourceMappingURL=abstractRuntimeExtensionsEditor.js.map