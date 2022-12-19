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
define(["require", "exports", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHost.protocol", "vs/base/common/uri", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostRpcService", "vs/base/common/types", "vs/base/common/collections"], function (require, exports, typeConverters, extHost_protocol_1, uri_1, event_1, instantiation_1, extHostTypes_1, extHostRpcService_1, types_1, collections_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostEditorTabs = exports.IExtHostEditorTabs = void 0;
    exports.IExtHostEditorTabs = (0, instantiation_1.createDecorator)('IExtHostEditorTabs');
    class ExtHostEditorTab {
        constructor(dto, parentGroup, activeTabIdGetter) {
            this._activeTabIdGetter = activeTabIdGetter;
            this._parentGroup = parentGroup;
            this.acceptDtoUpdate(dto);
        }
        get apiObject() {
            if (!this._apiObject) {
                // Don't want to lose reference to parent `this` in the getters
                const that = this;
                const obj = {
                    get isActive() {
                        // We use a getter function here to always ensure at most 1 active tab per group and prevent iteration for being required
                        return that._dto.id === that._activeTabIdGetter();
                    },
                    get label() {
                        return that._dto.label;
                    },
                    get input() {
                        return that._input;
                    },
                    get isDirty() {
                        return that._dto.isDirty;
                    },
                    get isPinned() {
                        return that._dto.isPinned;
                    },
                    get isPreview() {
                        return that._dto.isPreview;
                    },
                    get group() {
                        return that._parentGroup.apiObject;
                    }
                };
                this._apiObject = Object.freeze(obj);
            }
            return this._apiObject;
        }
        get tabId() {
            return this._dto.id;
        }
        acceptDtoUpdate(dto) {
            this._dto = dto;
            this._input = this._initInput();
        }
        _initInput() {
            switch (this._dto.input.kind) {
                case 1 /* TabInputKind.TextInput */:
                    return new extHostTypes_1.TextTabInput(uri_1.URI.revive(this._dto.input.uri));
                case 2 /* TabInputKind.TextDiffInput */:
                    return new extHostTypes_1.TextDiffTabInput(uri_1.URI.revive(this._dto.input.original), uri_1.URI.revive(this._dto.input.modified));
                case 5 /* TabInputKind.CustomEditorInput */:
                    return new extHostTypes_1.CustomEditorTabInput(uri_1.URI.revive(this._dto.input.uri), this._dto.input.viewType);
                case 6 /* TabInputKind.WebviewEditorInput */:
                    return new extHostTypes_1.WebviewEditorTabInput(this._dto.input.viewType);
                case 3 /* TabInputKind.NotebookInput */:
                    return new extHostTypes_1.NotebookEditorTabInput(uri_1.URI.revive(this._dto.input.uri), this._dto.input.notebookType);
                case 4 /* TabInputKind.NotebookDiffInput */:
                    return new extHostTypes_1.NotebookDiffEditorTabInput(uri_1.URI.revive(this._dto.input.original), uri_1.URI.revive(this._dto.input.modified), this._dto.input.notebookType);
                case 7 /* TabInputKind.TerminalEditorInput */:
                    return new extHostTypes_1.TerminalEditorTabInput();
                default:
                    return undefined;
            }
        }
    }
    class ExtHostEditorTabGroup {
        constructor(dto, proxy, activeGroupIdGetter) {
            this._tabs = [];
            this._activeTabId = '';
            this._dto = dto;
            this._activeGroupIdGetter = activeGroupIdGetter;
            // Construct all tabs from the given dto
            for (const tabDto of dto.tabs) {
                if (tabDto.isActive) {
                    this._activeTabId = tabDto.id;
                }
                this._tabs.push(new ExtHostEditorTab(tabDto, this, () => this.activeTabId()));
            }
        }
        get apiObject() {
            if (!this._apiObject) {
                // Don't want to lose reference to parent `this` in the getters
                const that = this;
                const obj = {
                    get isActive() {
                        // We use a getter function here to always ensure at most 1 active group and prevent iteration for being required
                        return that._dto.groupId === that._activeGroupIdGetter();
                    },
                    get viewColumn() {
                        return typeConverters.ViewColumn.to(that._dto.viewColumn);
                    },
                    get activeTab() {
                        var _a;
                        return (_a = that._tabs.find(tab => tab.tabId === that._activeTabId)) === null || _a === void 0 ? void 0 : _a.apiObject;
                    },
                    get tabs() {
                        return Object.freeze(that._tabs.map(tab => tab.apiObject));
                    }
                };
                this._apiObject = Object.freeze(obj);
            }
            return this._apiObject;
        }
        get groupId() {
            return this._dto.groupId;
        }
        get tabs() {
            return this._tabs;
        }
        acceptGroupDtoUpdate(dto) {
            this._dto = dto;
        }
        acceptTabOperation(operation) {
            // In the open case we add the tab to the group
            if (operation.kind === 0 /* TabModelOperationKind.TAB_OPEN */) {
                const tab = new ExtHostEditorTab(operation.tabDto, this, () => this.activeTabId());
                // Insert tab at editor index
                this._tabs.splice(operation.index, 0, tab);
                if (operation.tabDto.isActive) {
                    this._activeTabId = tab.tabId;
                }
                return tab;
            }
            else if (operation.kind === 1 /* TabModelOperationKind.TAB_CLOSE */) {
                const tab = this._tabs.splice(operation.index, 1)[0];
                if (!tab) {
                    throw new Error(`Tab close updated received for index ${operation.index} which does not exist`);
                }
                if (tab.tabId === this._activeTabId) {
                    this._activeTabId = '';
                }
                return tab;
            }
            else if (operation.kind === 3 /* TabModelOperationKind.TAB_MOVE */) {
                if (operation.oldIndex === undefined) {
                    throw new Error('Invalid old index on move IPC');
                }
                // Splice to remove at old index and insert at new index === moving the tab
                const tab = this._tabs.splice(operation.oldIndex, 1)[0];
                if (!tab) {
                    throw new Error(`Tab move updated received for index ${operation.oldIndex} which does not exist`);
                }
                this._tabs.splice(operation.index, 0, tab);
                return tab;
            }
            const tab = this._tabs.find(extHostTab => extHostTab.tabId === operation.tabDto.id);
            if (!tab) {
                throw new Error('INVALID tab');
            }
            if (operation.tabDto.isActive) {
                this._activeTabId = operation.tabDto.id;
            }
            else if (this._activeTabId === operation.tabDto.id && !operation.tabDto.isActive) {
                // Events aren't guaranteed to be in order so if we receive a dto that matches the active tab id
                // but isn't active we mark the active tab id as empty. This prevent onDidActiveTabChange frorm
                // firing incorrectly
                this._activeTabId = '';
            }
            tab.acceptDtoUpdate(operation.tabDto);
            return tab;
        }
        // Not a getter since it must be a function to be used as a callback for the tabs
        activeTabId() {
            return this._activeTabId;
        }
    }
    let ExtHostEditorTabs = class ExtHostEditorTabs {
        constructor(extHostRpc) {
            this._onDidChangeTabs = new event_1.Emitter();
            this._onDidChangeTabGroups = new event_1.Emitter();
            this._extHostTabGroups = [];
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadEditorTabs);
        }
        get tabGroups() {
            if (!this._apiObject) {
                const that = this;
                const obj = {
                    // never changes -> simple value
                    onDidChangeTabGroups: that._onDidChangeTabGroups.event,
                    onDidChangeTabs: that._onDidChangeTabs.event,
                    // dynamic -> getters
                    get all() {
                        return Object.freeze(that._extHostTabGroups.map(group => group.apiObject));
                    },
                    get activeTabGroup() {
                        var _a;
                        const activeTabGroupId = that._activeGroupId;
                        const activeTabGroup = (0, types_1.assertIsDefined)((_a = that._extHostTabGroups.find(candidate => candidate.groupId === activeTabGroupId)) === null || _a === void 0 ? void 0 : _a.apiObject);
                        return activeTabGroup;
                    },
                    close: async (tabOrTabGroup, preserveFocus) => {
                        const tabsOrTabGroups = Array.isArray(tabOrTabGroup) ? tabOrTabGroup : [tabOrTabGroup];
                        if (!tabsOrTabGroups.length) {
                            return true;
                        }
                        // Check which type was passed in and call the appropriate close
                        // Casting is needed as typescript doesn't seem to infer enough from this
                        if (isTabGroup(tabsOrTabGroups[0])) {
                            return this._closeGroups(tabsOrTabGroups, preserveFocus);
                        }
                        else {
                            return this._closeTabs(tabsOrTabGroups, preserveFocus);
                        }
                    },
                    // move: async (tab: vscode.Tab, viewColumn: ViewColumn, index: number, preservceFocus?: boolean) => {
                    // 	const extHostTab = this._findExtHostTabFromApi(tab);
                    // 	if (!extHostTab) {
                    // 		throw new Error('Invalid tab');
                    // 	}
                    // 	this._proxy.$moveTab(extHostTab.tabId, index, typeConverters.ViewColumn.from(viewColumn), preservceFocus);
                    // 	return;
                    // }
                };
                this._apiObject = Object.freeze(obj);
            }
            return this._apiObject;
        }
        $acceptEditorTabModel(tabGroups) {
            var _a;
            const groupIdsBefore = new Set(this._extHostTabGroups.map(group => group.groupId));
            const groupIdsAfter = new Set(tabGroups.map(dto => dto.groupId));
            const diff = (0, collections_1.diffSets)(groupIdsBefore, groupIdsAfter);
            const closed = this._extHostTabGroups.filter(group => diff.removed.includes(group.groupId)).map(group => group.apiObject);
            const opened = [];
            const changed = [];
            this._extHostTabGroups = tabGroups.map(tabGroup => {
                const group = new ExtHostEditorTabGroup(tabGroup, this._proxy, () => this._activeGroupId);
                if (diff.added.includes(group.groupId)) {
                    opened.push(group.apiObject);
                }
                else {
                    changed.push(group.apiObject);
                }
                return group;
            });
            // Set the active tab group id
            const activeTabGroupId = (0, types_1.assertIsDefined)((_a = tabGroups.find(group => group.isActive === true)) === null || _a === void 0 ? void 0 : _a.groupId);
            if (activeTabGroupId !== undefined && this._activeGroupId !== activeTabGroupId) {
                this._activeGroupId = activeTabGroupId;
            }
            this._onDidChangeTabGroups.fire(Object.freeze({ opened, closed, changed }));
        }
        $acceptTabGroupUpdate(groupDto) {
            const group = this._extHostTabGroups.find(group => group.groupId === groupDto.groupId);
            if (!group) {
                throw new Error('Update Group IPC call received before group creation.');
            }
            group.acceptGroupDtoUpdate(groupDto);
            if (groupDto.isActive) {
                this._activeGroupId = groupDto.groupId;
            }
            this._onDidChangeTabGroups.fire(Object.freeze({ changed: [group.apiObject], opened: [], closed: [] }));
        }
        $acceptTabOperation(operation) {
            const group = this._extHostTabGroups.find(group => group.groupId === operation.groupId);
            if (!group) {
                throw new Error('Update Tabs IPC call received before group creation.');
            }
            const tab = group.acceptTabOperation(operation);
            // Construct the tab change event based on the operation
            switch (operation.kind) {
                case 0 /* TabModelOperationKind.TAB_OPEN */:
                    this._onDidChangeTabs.fire(Object.freeze({
                        opened: [tab.apiObject],
                        closed: [],
                        changed: []
                    }));
                    return;
                case 1 /* TabModelOperationKind.TAB_CLOSE */:
                    this._onDidChangeTabs.fire(Object.freeze({
                        opened: [],
                        closed: [tab.apiObject],
                        changed: []
                    }));
                    return;
                case 3 /* TabModelOperationKind.TAB_MOVE */:
                case 2 /* TabModelOperationKind.TAB_UPDATE */:
                    this._onDidChangeTabs.fire(Object.freeze({
                        opened: [],
                        closed: [],
                        changed: [tab.apiObject]
                    }));
                    return;
            }
        }
        _findExtHostTabFromApi(apiTab) {
            for (const group of this._extHostTabGroups) {
                for (const tab of group.tabs) {
                    if (tab.apiObject === apiTab) {
                        return tab;
                    }
                }
            }
            return;
        }
        _findExtHostTabGroupFromApi(apiTabGroup) {
            return this._extHostTabGroups.find(candidate => candidate.apiObject === apiTabGroup);
        }
        async _closeTabs(tabs, preserveFocus) {
            const extHostTabIds = [];
            for (const tab of tabs) {
                const extHostTab = this._findExtHostTabFromApi(tab);
                if (!extHostTab) {
                    throw new Error('Tab close: Invalid tab not found!');
                }
                extHostTabIds.push(extHostTab.tabId);
            }
            return this._proxy.$closeTab(extHostTabIds, preserveFocus);
        }
        async _closeGroups(groups, preserverFoucs) {
            const extHostGroupIds = [];
            for (const group of groups) {
                const extHostGroup = this._findExtHostTabGroupFromApi(group);
                if (!extHostGroup) {
                    throw new Error('Group close: Invalid group not found!');
                }
                extHostGroupIds.push(extHostGroup.groupId);
            }
            return this._proxy.$closeGroup(extHostGroupIds, preserverFoucs);
        }
    };
    ExtHostEditorTabs = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostEditorTabs);
    exports.ExtHostEditorTabs = ExtHostEditorTabs;
    //#region Utils
    function isTabGroup(obj) {
        const tabGroup = obj;
        if (tabGroup.tabs !== undefined) {
            return true;
        }
        return false;
    }
});
//#endregion
//# sourceMappingURL=extHostEditorTabs.js.map