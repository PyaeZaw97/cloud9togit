/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/keybindings", "vs/base/common/platform", "vs/platform/keybinding/common/usLayoutResolvedKeybinding"], function (require, exports, event_1, keybindings_1, platform_1, usLayoutResolvedKeybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MockKeybindingService = exports.MockScopableContextKeyService = exports.MockContextKeyService = void 0;
    class MockKeybindingContextKey {
        constructor(defaultValue) {
            this._defaultValue = defaultValue;
            this._value = this._defaultValue;
        }
        set(value) {
            this._value = value;
        }
        reset() {
            this._value = this._defaultValue;
        }
        get() {
            return this._value;
        }
    }
    class MockContextKeyService {
        constructor() {
            this._keys = new Map();
        }
        dispose() {
            //
        }
        createKey(key, defaultValue) {
            let ret = new MockKeybindingContextKey(defaultValue);
            this._keys.set(key, ret);
            return ret;
        }
        contextMatchesRules(rules) {
            return false;
        }
        get onDidChangeContext() {
            return event_1.Event.None;
        }
        bufferChangeEvents(callback) { callback(); }
        getContextKeyValue(key) {
            const value = this._keys.get(key);
            if (value) {
                return value.get();
            }
        }
        getContext(domNode) {
            return null;
        }
        createScoped(domNode) {
            return this;
        }
        createOverlay() {
            return this;
        }
        updateParent(_parentContextKeyService) {
            // no-op
        }
    }
    exports.MockContextKeyService = MockContextKeyService;
    class MockScopableContextKeyService extends MockContextKeyService {
        /**
         * Don't implement this for all tests since we rarely depend on this behavior and it isn't implemented fully
         */
        createScoped(domNote) {
            return new MockContextKeyService();
        }
    }
    exports.MockScopableContextKeyService = MockScopableContextKeyService;
    class MockKeybindingService {
        constructor() {
            this.inChordMode = false;
        }
        get onDidUpdateKeybindings() {
            return event_1.Event.None;
        }
        getDefaultKeybindingsContent() {
            return '';
        }
        getDefaultKeybindings() {
            return [];
        }
        getKeybindings() {
            return [];
        }
        resolveKeybinding(keybinding) {
            return [new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(keybinding, platform_1.OS)];
        }
        resolveKeyboardEvent(keyboardEvent) {
            let keybinding = new keybindings_1.SimpleKeybinding(keyboardEvent.ctrlKey, keyboardEvent.shiftKey, keyboardEvent.altKey, keyboardEvent.metaKey, keyboardEvent.keyCode);
            return this.resolveKeybinding(keybinding.toChord())[0];
        }
        resolveUserBinding(userBinding) {
            return [];
        }
        lookupKeybindings(commandId) {
            return [];
        }
        lookupKeybinding(commandId) {
            return undefined;
        }
        customKeybindingsCount() {
            return 0;
        }
        softDispatch(keybinding, target) {
            return null;
        }
        dispatchByUserSettingsLabel(userSettingsLabel, target) {
        }
        dispatchEvent(e, target) {
            return false;
        }
        mightProducePrintableCharacter(e) {
            return false;
        }
        toggleLogging() {
            return false;
        }
        _dumpDebugInfo() {
            return '';
        }
        _dumpDebugInfoJSON() {
            return '';
        }
        registerSchemaContribution() {
            // noop
        }
    }
    exports.MockKeybindingService = MockKeybindingService;
});
//# sourceMappingURL=mockKeybindingService.js.map