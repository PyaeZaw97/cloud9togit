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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/electron-main/lifecycleMainService"], function (require, exports, event_1, lifecycle_1, instantiation_1, lifecycleMainService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeyboardLayoutMainService = exports.IKeyboardLayoutMainService = void 0;
    exports.IKeyboardLayoutMainService = (0, instantiation_1.createDecorator)('keyboardLayoutMainService');
    let KeyboardLayoutMainService = class KeyboardLayoutMainService extends lifecycle_1.Disposable {
        constructor(lifecycleMainService) {
            super();
            this._onDidChangeKeyboardLayout = this._register(new event_1.Emitter());
            this.onDidChangeKeyboardLayout = this._onDidChangeKeyboardLayout.event;
            this._initPromise = null;
            this._keyboardLayoutData = null;
            // perf: automatically trigger initialize after windows
            // have opened so that we can do this work in parallel
            // to the window load.
            lifecycleMainService.when(3 /* LifecycleMainPhase.AfterWindowOpen */).then(() => this._initialize());
        }
        _initialize() {
            if (!this._initPromise) {
                this._initPromise = this._doInitialize();
            }
            return this._initPromise;
        }
        async _doInitialize() {
            const nativeKeymapMod = await new Promise((resolve_1, reject_1) => { require(['native-keymap'], resolve_1, reject_1); });
            this._keyboardLayoutData = readKeyboardLayoutData(nativeKeymapMod);
            nativeKeymapMod.onDidChangeKeyboardLayout(() => {
                this._keyboardLayoutData = readKeyboardLayoutData(nativeKeymapMod);
                this._onDidChangeKeyboardLayout.fire(this._keyboardLayoutData);
            });
        }
        async getKeyboardLayoutData() {
            await this._initialize();
            return this._keyboardLayoutData;
        }
    };
    KeyboardLayoutMainService = __decorate([
        __param(0, lifecycleMainService_1.ILifecycleMainService)
    ], KeyboardLayoutMainService);
    exports.KeyboardLayoutMainService = KeyboardLayoutMainService;
    function readKeyboardLayoutData(nativeKeymapMod) {
        const keyboardMapping = nativeKeymapMod.getKeyMap();
        const keyboardLayoutInfo = nativeKeymapMod.getCurrentKeyboardLayout();
        return { keyboardMapping, keyboardLayoutInfo };
    }
});
//# sourceMappingURL=keyboardLayoutMainService.js.map