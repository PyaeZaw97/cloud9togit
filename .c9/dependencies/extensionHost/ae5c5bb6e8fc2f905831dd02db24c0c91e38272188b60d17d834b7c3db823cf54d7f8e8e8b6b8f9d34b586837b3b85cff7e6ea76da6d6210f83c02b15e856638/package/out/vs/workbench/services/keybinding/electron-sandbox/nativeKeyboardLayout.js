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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/keyboardLayout/common/keyboardLayout", "vs/base/common/event", "vs/base/common/platform", "vs/platform/keyboardLayout/common/keyboardMapper", "vs/workbench/services/keybinding/common/windowsKeyboardMapper", "vs/workbench/services/keybinding/common/macLinuxFallbackKeyboardMapper", "vs/workbench/services/keybinding/common/macLinuxKeyboardMapper", "vs/platform/ipc/electron-sandbox/services", "vs/base/parts/ipc/common/ipc"], function (require, exports, lifecycle_1, keyboardLayout_1, event_1, platform_1, keyboardMapper_1, windowsKeyboardMapper_1, macLinuxFallbackKeyboardMapper_1, macLinuxKeyboardMapper_1, services_1, ipc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeyboardLayoutService = void 0;
    let KeyboardLayoutService = class KeyboardLayoutService extends lifecycle_1.Disposable {
        constructor(mainProcessService) {
            super();
            this._onDidChangeKeyboardLayout = this._register(new event_1.Emitter());
            this.onDidChangeKeyboardLayout = this._onDidChangeKeyboardLayout.event;
            this._keyboardLayoutService = ipc_1.ProxyChannel.toService(mainProcessService.getChannel('keyboardLayout'));
            this._initPromise = null;
            this._keyboardMapping = null;
            this._keyboardLayoutInfo = null;
            this._keyboardMapper = new macLinuxFallbackKeyboardMapper_1.MacLinuxFallbackKeyboardMapper(platform_1.OS);
            this._register(this._keyboardLayoutService.onDidChangeKeyboardLayout(async ({ keyboardLayoutInfo, keyboardMapping }) => {
                await this.initialize();
                if (keyboardMappingEquals(this._keyboardMapping, keyboardMapping)) {
                    // the mappings are equal
                    return;
                }
                this._keyboardMapping = keyboardMapping;
                this._keyboardLayoutInfo = keyboardLayoutInfo;
                this._keyboardMapper = new keyboardMapper_1.CachedKeyboardMapper(createKeyboardMapper(this._keyboardLayoutInfo, this._keyboardMapping));
                this._onDidChangeKeyboardLayout.fire();
            }));
        }
        initialize() {
            if (!this._initPromise) {
                this._initPromise = this._doInitialize();
            }
            return this._initPromise;
        }
        async _doInitialize() {
            const keyboardLayoutData = await this._keyboardLayoutService.getKeyboardLayoutData();
            const { keyboardLayoutInfo, keyboardMapping } = keyboardLayoutData;
            this._keyboardMapping = keyboardMapping;
            this._keyboardLayoutInfo = keyboardLayoutInfo;
            this._keyboardMapper = new keyboardMapper_1.CachedKeyboardMapper(createKeyboardMapper(this._keyboardLayoutInfo, this._keyboardMapping));
        }
        getRawKeyboardMapping() {
            return this._keyboardMapping;
        }
        getCurrentKeyboardLayout() {
            return this._keyboardLayoutInfo;
        }
        getAllKeyboardLayouts() {
            return [];
        }
        getKeyboardMapper(dispatchConfig) {
            if (dispatchConfig === 1 /* DispatchConfig.KeyCode */) {
                // Forcefully set to use keyCode
                return new macLinuxFallbackKeyboardMapper_1.MacLinuxFallbackKeyboardMapper(platform_1.OS);
            }
            return this._keyboardMapper;
        }
        validateCurrentKeyboardMapping(keyboardEvent) {
            return;
        }
    };
    KeyboardLayoutService = __decorate([
        __param(0, services_1.IMainProcessService)
    ], KeyboardLayoutService);
    exports.KeyboardLayoutService = KeyboardLayoutService;
    function keyboardMappingEquals(a, b) {
        if (platform_1.OS === 1 /* OperatingSystem.Windows */) {
            return (0, keyboardLayout_1.windowsKeyboardMappingEquals)(a, b);
        }
        return (0, keyboardLayout_1.macLinuxKeyboardMappingEquals)(a, b);
    }
    function createKeyboardMapper(layoutInfo, rawMapping) {
        const _isUSStandard = isUSStandard(layoutInfo);
        if (platform_1.OS === 1 /* OperatingSystem.Windows */) {
            return new windowsKeyboardMapper_1.WindowsKeyboardMapper(_isUSStandard, rawMapping);
        }
        if (!rawMapping || Object.keys(rawMapping).length === 0) {
            // Looks like reading the mappings failed (most likely Mac + Japanese/Chinese keyboard layouts)
            return new macLinuxFallbackKeyboardMapper_1.MacLinuxFallbackKeyboardMapper(platform_1.OS);
        }
        if (platform_1.OS === 2 /* OperatingSystem.Macintosh */) {
            const kbInfo = layoutInfo;
            if (kbInfo.id === 'com.apple.keylayout.DVORAK-QWERTYCMD') {
                // Use keyCode based dispatching for DVORAK - QWERTY ⌘
                return new macLinuxFallbackKeyboardMapper_1.MacLinuxFallbackKeyboardMapper(platform_1.OS);
            }
        }
        return new macLinuxKeyboardMapper_1.MacLinuxKeyboardMapper(_isUSStandard, rawMapping, platform_1.OS);
    }
    function isUSStandard(_kbInfo) {
        if (!_kbInfo) {
            return false;
        }
        if (platform_1.OS === 3 /* OperatingSystem.Linux */) {
            const kbInfo = _kbInfo;
            const layouts = kbInfo.layout.split(/,/g);
            return (layouts[kbInfo.group] === 'us');
        }
        if (platform_1.OS === 2 /* OperatingSystem.Macintosh */) {
            const kbInfo = _kbInfo;
            return (kbInfo.id === 'com.apple.keylayout.US');
        }
        if (platform_1.OS === 1 /* OperatingSystem.Windows */) {
            const kbInfo = _kbInfo;
            return (kbInfo.name === '00000409');
        }
        return false;
    }
});
//# sourceMappingURL=nativeKeyboardLayout.js.map