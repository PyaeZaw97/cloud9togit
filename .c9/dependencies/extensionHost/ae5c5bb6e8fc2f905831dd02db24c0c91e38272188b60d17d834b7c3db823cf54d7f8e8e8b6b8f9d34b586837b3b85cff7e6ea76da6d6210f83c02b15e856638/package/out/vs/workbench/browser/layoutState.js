/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/services/layout/browser/layoutService"], function (require, exports, dom_1, event_1, lifecycle_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchLayoutSettings = exports.LayoutStateModel = exports.LayoutStateKeys = void 0;
    class WorkbenchLayoutStateKey {
        constructor(name, scope, target, defaultValue) {
            this.name = name;
            this.scope = scope;
            this.target = target;
            this.defaultValue = defaultValue;
        }
    }
    class RuntimeStateKey extends WorkbenchLayoutStateKey {
        constructor(name, scope, target, defaultValue, zenModeIgnore) {
            super(name, scope, target, defaultValue);
            this.zenModeIgnore = zenModeIgnore;
            this.runtime = true;
        }
    }
    class InitializationStateKey extends WorkbenchLayoutStateKey {
        constructor() {
            super(...arguments);
            this.runtime = false;
        }
    }
    exports.LayoutStateKeys = {
        // Editor
        EDITOR_CENTERED: new RuntimeStateKey('editor.centered', 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */, false),
        // Zen Mode
        ZEN_MODE_ACTIVE: new RuntimeStateKey('zenMode.active', 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */, false),
        ZEN_MODE_EXIT_INFO: new RuntimeStateKey('zenMode.exitInfo', 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */, {
            transitionedToCenteredEditorLayout: false,
            transitionedToFullScreen: false,
            wasVisible: {
                auxiliaryBar: false,
                panel: false,
                sideBar: false,
            },
        }),
        // Part Sizing
        GRID_SIZE: new InitializationStateKey('grid.size', 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */, { width: 800, height: 600 }),
        SIDEBAR_SIZE: new InitializationStateKey('sideBar.size', 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */, 200),
        AUXILIARYBAR_SIZE: new InitializationStateKey('auxiliaryBar.size', 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */, 200),
        PANEL_SIZE: new InitializationStateKey('panel.size', 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */, 300),
        PANEL_LAST_NON_MAXIMIZED_HEIGHT: new RuntimeStateKey('panel.lastNonMaximizedHeight', 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */, 300),
        PANEL_LAST_NON_MAXIMIZED_WIDTH: new RuntimeStateKey('panel.lastNonMaximizedWidth', 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */, 300),
        PANEL_WAS_LAST_MAXIMIZED: new RuntimeStateKey('panel.wasLastMaximized', 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */, false),
        // Part Positions
        SIDEBAR_POSITON: new RuntimeStateKey('sideBar.position', 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */, 0 /* Position.LEFT */),
        PANEL_POSITION: new RuntimeStateKey('panel.position', 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */, 2 /* Position.BOTTOM */),
        PANEL_ALIGNMENT: new RuntimeStateKey('panel.alignment', 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */, 'center'),
        // Part Visibility
        ACTIVITYBAR_HIDDEN: new RuntimeStateKey('activityBar.hidden', 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */, false, true),
        SIDEBAR_HIDDEN: new RuntimeStateKey('sideBar.hidden', 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */, false),
        EDITOR_HIDDEN: new RuntimeStateKey('editor.hidden', 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */, false),
        PANEL_HIDDEN: new RuntimeStateKey('panel.hidden', 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */, true),
        AUXILIARYBAR_HIDDEN: new RuntimeStateKey('auxiliaryBar.hidden', 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */, true),
        STATUSBAR_HIDDEN: new RuntimeStateKey('statusBar.hidden', 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */, false, true),
    };
    class LayoutStateModel extends lifecycle_1.Disposable {
        constructor(storageService, configurationService, contextService, container) {
            super();
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.container = container;
            this.stateCache = new Map();
            this._onDidChangeState = this._register(new event_1.Emitter());
            this.onDidChangeState = this._onDidChangeState.event;
            this._register(this.configurationService.onDidChangeConfiguration(configurationChange => this.updateStateFromLegacySettings(configurationChange)));
        }
        updateStateFromLegacySettings(configurationChangeEvent) {
            var _a;
            const isZenMode = this.getRuntimeValue(exports.LayoutStateKeys.ZEN_MODE_ACTIVE);
            if (configurationChangeEvent.affectsConfiguration(LegacyWorkbenchLayoutSettings.ACTIVITYBAR_VISIBLE) && !isZenMode) {
                this.setRuntimeValueAndFire(exports.LayoutStateKeys.ACTIVITYBAR_HIDDEN, !this.configurationService.getValue(LegacyWorkbenchLayoutSettings.ACTIVITYBAR_VISIBLE));
            }
            if (configurationChangeEvent.affectsConfiguration(LegacyWorkbenchLayoutSettings.STATUSBAR_VISIBLE) && !isZenMode) {
                this.setRuntimeValueAndFire(exports.LayoutStateKeys.STATUSBAR_HIDDEN, !this.configurationService.getValue(LegacyWorkbenchLayoutSettings.STATUSBAR_VISIBLE));
            }
            if (configurationChangeEvent.affectsConfiguration(LegacyWorkbenchLayoutSettings.SIDEBAR_POSITION)) {
                this.setRuntimeValueAndFire(exports.LayoutStateKeys.SIDEBAR_POSITON, (0, layoutService_1.positionFromString)((_a = this.configurationService.getValue(LegacyWorkbenchLayoutSettings.SIDEBAR_POSITION)) !== null && _a !== void 0 ? _a : 'left'));
            }
        }
        updateLegacySettingsFromState(key, value) {
            const isZenMode = this.getRuntimeValue(exports.LayoutStateKeys.ZEN_MODE_ACTIVE);
            if (key.zenModeIgnore && isZenMode) {
                return;
            }
            if (key === exports.LayoutStateKeys.ACTIVITYBAR_HIDDEN) {
                this.configurationService.updateValue(LegacyWorkbenchLayoutSettings.ACTIVITYBAR_VISIBLE, !value);
            }
            else if (key === exports.LayoutStateKeys.STATUSBAR_HIDDEN) {
                this.configurationService.updateValue(LegacyWorkbenchLayoutSettings.STATUSBAR_VISIBLE, !value);
            }
            else if (key === exports.LayoutStateKeys.SIDEBAR_POSITON) {
                this.configurationService.updateValue(LegacyWorkbenchLayoutSettings.SIDEBAR_POSITION, (0, layoutService_1.positionToString)(value));
            }
        }
        load() {
            var _a, _b, _c;
            let key;
            // Load stored values for all keys
            for (key in exports.LayoutStateKeys) {
                const stateKey = exports.LayoutStateKeys[key];
                const value = this.loadKeyFromStorage(stateKey);
                if (value !== undefined) {
                    this.stateCache.set(stateKey.name, value);
                }
            }
            // Apply legacy settings
            this.stateCache.set(exports.LayoutStateKeys.ACTIVITYBAR_HIDDEN.name, !this.configurationService.getValue(LegacyWorkbenchLayoutSettings.ACTIVITYBAR_VISIBLE));
            this.stateCache.set(exports.LayoutStateKeys.STATUSBAR_HIDDEN.name, !this.configurationService.getValue(LegacyWorkbenchLayoutSettings.STATUSBAR_VISIBLE));
            this.stateCache.set(exports.LayoutStateKeys.SIDEBAR_POSITON.name, (0, layoutService_1.positionFromString)((_a = this.configurationService.getValue(LegacyWorkbenchLayoutSettings.SIDEBAR_POSITION)) !== null && _a !== void 0 ? _a : 'left'));
            // Set dynamic defaults: part sizing and side bar visibility
            const workbenchDimensions = (0, dom_1.getClientArea)(this.container);
            exports.LayoutStateKeys.PANEL_POSITION.defaultValue = (0, layoutService_1.positionFromString)((_b = this.configurationService.getValue(WorkbenchLayoutSettings.PANEL_POSITION)) !== null && _b !== void 0 ? _b : 'bottom');
            exports.LayoutStateKeys.GRID_SIZE.defaultValue = { height: workbenchDimensions.height, width: workbenchDimensions.width };
            exports.LayoutStateKeys.SIDEBAR_SIZE.defaultValue = Math.min(300, workbenchDimensions.width / 4);
            exports.LayoutStateKeys.AUXILIARYBAR_SIZE.defaultValue = Math.min(300, workbenchDimensions.width / 4);
            exports.LayoutStateKeys.PANEL_SIZE.defaultValue = ((_c = this.stateCache.get(exports.LayoutStateKeys.PANEL_POSITION.name)) !== null && _c !== void 0 ? _c : exports.LayoutStateKeys.PANEL_POSITION.defaultValue) === 'bottom' ? workbenchDimensions.height / 3 : workbenchDimensions.width / 4;
            exports.LayoutStateKeys.SIDEBAR_HIDDEN.defaultValue = this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */;
            // Apply all defaults
            for (key in exports.LayoutStateKeys) {
                const stateKey = exports.LayoutStateKeys[key];
                if (this.stateCache.get(stateKey.name) === undefined) {
                    this.stateCache.set(stateKey.name, stateKey.defaultValue);
                }
            }
            // Register for runtime key changes
            this._register(this.storageService.onDidChangeValue(storageChangeEvent => {
                var _a;
                let key;
                for (key in exports.LayoutStateKeys) {
                    const stateKey = exports.LayoutStateKeys[key];
                    if (stateKey instanceof RuntimeStateKey && stateKey.scope === 0 /* StorageScope.GLOBAL */ && stateKey.target === 0 /* StorageTarget.USER */) {
                        if (`${LayoutStateModel.STORAGE_PREFIX}${stateKey.name}` === storageChangeEvent.key) {
                            const value = (_a = this.loadKeyFromStorage(stateKey)) !== null && _a !== void 0 ? _a : stateKey.defaultValue;
                            if (this.stateCache.get(stateKey.name) !== value) {
                                this.stateCache.set(stateKey.name, value);
                                this._onDidChangeState.fire({ key: stateKey, value });
                            }
                        }
                    }
                }
            }));
        }
        save(workspace, global) {
            let key;
            const isZenMode = this.getRuntimeValue(exports.LayoutStateKeys.ZEN_MODE_ACTIVE);
            for (key in exports.LayoutStateKeys) {
                const stateKey = exports.LayoutStateKeys[key];
                if ((workspace && stateKey.scope === 1 /* StorageScope.WORKSPACE */) ||
                    (global && stateKey.scope === 0 /* StorageScope.GLOBAL */)) {
                    // Don't write out specific keys while in zen mode
                    if (isZenMode && stateKey instanceof RuntimeStateKey && stateKey.zenModeIgnore) {
                        continue;
                    }
                    this.saveKeyToStorage(stateKey);
                }
            }
        }
        getInitializationValue(key) {
            return this.stateCache.get(key.name);
        }
        setInitializationValue(key, value) {
            this.stateCache.set(key.name, value);
        }
        getRuntimeValue(key, readFromDisk) {
            if (readFromDisk) {
                const fromDiskValue = this.loadKeyFromStorage(key);
                this.stateCache.set(key.name, fromDiskValue !== null && fromDiskValue !== void 0 ? fromDiskValue : key.defaultValue);
            }
            return this.stateCache.get(key.name);
        }
        setRuntimeValue(key, value) {
            this.stateCache.set(key.name, value);
            const isZenMode = this.getRuntimeValue(exports.LayoutStateKeys.ZEN_MODE_ACTIVE);
            if (key.scope === 0 /* StorageScope.GLOBAL */) {
                if (!isZenMode || !key.zenModeIgnore) {
                    this.saveKeyToStorage(key);
                    this.updateLegacySettingsFromState(key, value);
                }
            }
        }
        setRuntimeValueAndFire(key, value) {
            const previousValue = this.stateCache.get(key.name);
            if (previousValue === value) {
                return;
            }
            this.setRuntimeValue(key, value);
            this._onDidChangeState.fire({ key, value });
        }
        saveKeyToStorage(key) {
            const value = this.stateCache.get(key.name);
            this.storageService.store(`${LayoutStateModel.STORAGE_PREFIX}${key.name}`, typeof value === 'object' ? JSON.stringify(value) : value, key.scope, key.target);
        }
        loadKeyFromStorage(key) {
            let value = this.storageService.get(`${LayoutStateModel.STORAGE_PREFIX}${key.name}`, key.scope);
            if (value !== undefined) {
                switch (typeof key.defaultValue) {
                    case 'boolean':
                        value = value === 'true';
                        break;
                    case 'number':
                        value = parseInt(value);
                        break;
                    case 'object':
                        value = JSON.parse(value);
                        break;
                }
            }
            return value;
        }
    }
    exports.LayoutStateModel = LayoutStateModel;
    LayoutStateModel.STORAGE_PREFIX = 'workbench.';
    var WorkbenchLayoutSettings;
    (function (WorkbenchLayoutSettings) {
        WorkbenchLayoutSettings["PANEL_POSITION"] = "workbench.panel.defaultLocation";
        WorkbenchLayoutSettings["PANEL_OPENS_MAXIMIZED"] = "workbench.panel.opensMaximized";
        WorkbenchLayoutSettings["ZEN_MODE_CONFIG"] = "zenMode";
        WorkbenchLayoutSettings["ZEN_MODE_SILENT_NOTIFICATIONS"] = "zenMode.silentNotifications";
        WorkbenchLayoutSettings["EDITOR_CENTERED_LAYOUT_AUTO_RESIZE"] = "workbench.editor.centeredLayoutAutoResize";
    })(WorkbenchLayoutSettings = exports.WorkbenchLayoutSettings || (exports.WorkbenchLayoutSettings = {}));
    var LegacyWorkbenchLayoutSettings;
    (function (LegacyWorkbenchLayoutSettings) {
        LegacyWorkbenchLayoutSettings["ACTIVITYBAR_VISIBLE"] = "workbench.activityBar.visible";
        LegacyWorkbenchLayoutSettings["STATUSBAR_VISIBLE"] = "workbench.statusBar.visible";
        LegacyWorkbenchLayoutSettings["SIDEBAR_POSITION"] = "workbench.sideBar.location";
    })(LegacyWorkbenchLayoutSettings || (LegacyWorkbenchLayoutSettings = {}));
});
//# sourceMappingURL=layoutState.js.map