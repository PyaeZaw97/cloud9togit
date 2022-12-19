/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/common/keyCodes", "vs/base/common/keybindings", "vs/base/common/platform"], function (require, exports, browser, keyCodes_1, keybindings_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StandardKeyboardEvent = exports.printStandardKeyboardEvent = exports.printKeyboardEvent = void 0;
    function extractKeyCode(e) {
        if (e.charCode) {
            // "keypress" events mostly
            let char = String.fromCharCode(e.charCode).toUpperCase();
            return keyCodes_1.KeyCodeUtils.fromString(char);
        }
        const keyCode = e.keyCode;
        // browser quirks
        if (keyCode === 3) {
            return 7 /* KeyCode.PauseBreak */;
        }
        else if (browser.isFirefox) {
            if (keyCode === 59) {
                return 80 /* KeyCode.Semicolon */;
            }
            else if (keyCode === 107) {
                return 81 /* KeyCode.Equal */;
            }
            else if (keyCode === 109) {
                return 83 /* KeyCode.Minus */;
            }
            else if (platform.isMacintosh && keyCode === 224) {
                return 57 /* KeyCode.Meta */;
            }
        }
        else if (browser.isWebKit) {
            if (keyCode === 91) {
                return 57 /* KeyCode.Meta */;
            }
            else if (platform.isMacintosh && keyCode === 93) {
                // the two meta keys in the Mac have different key codes (91 and 93)
                return 57 /* KeyCode.Meta */;
            }
            else if (!platform.isMacintosh && keyCode === 92) {
                return 57 /* KeyCode.Meta */;
            }
        }
        // cross browser keycodes:
        return keyCodes_1.EVENT_KEY_CODE_MAP[keyCode] || 0 /* KeyCode.Unknown */;
    }
    const ctrlKeyMod = (platform.isMacintosh ? 256 /* KeyMod.WinCtrl */ : 2048 /* KeyMod.CtrlCmd */);
    const altKeyMod = 512 /* KeyMod.Alt */;
    const shiftKeyMod = 1024 /* KeyMod.Shift */;
    const metaKeyMod = (platform.isMacintosh ? 2048 /* KeyMod.CtrlCmd */ : 256 /* KeyMod.WinCtrl */);
    function printKeyboardEvent(e) {
        let modifiers = [];
        if (e.ctrlKey) {
            modifiers.push(`ctrl`);
        }
        if (e.shiftKey) {
            modifiers.push(`shift`);
        }
        if (e.altKey) {
            modifiers.push(`alt`);
        }
        if (e.metaKey) {
            modifiers.push(`meta`);
        }
        return `modifiers: [${modifiers.join(',')}], code: ${e.code}, keyCode: ${e.keyCode}, key: ${e.key}`;
    }
    exports.printKeyboardEvent = printKeyboardEvent;
    function printStandardKeyboardEvent(e) {
        let modifiers = [];
        if (e.ctrlKey) {
            modifiers.push(`ctrl`);
        }
        if (e.shiftKey) {
            modifiers.push(`shift`);
        }
        if (e.altKey) {
            modifiers.push(`alt`);
        }
        if (e.metaKey) {
            modifiers.push(`meta`);
        }
        return `modifiers: [${modifiers.join(',')}], code: ${e.code}, keyCode: ${e.keyCode} ('${keyCodes_1.KeyCodeUtils.toString(e.keyCode)}')`;
    }
    exports.printStandardKeyboardEvent = printStandardKeyboardEvent;
    class StandardKeyboardEvent {
        constructor(source) {
            this._standardKeyboardEventBrand = true;
            let e = source;
            this.browserEvent = e;
            this.target = e.target;
            this.ctrlKey = e.ctrlKey;
            this.shiftKey = e.shiftKey;
            this.altKey = e.altKey;
            this.metaKey = e.metaKey;
            this.keyCode = extractKeyCode(e);
            this.code = e.code;
            // console.info(e.type + ": keyCode: " + e.keyCode + ", which: " + e.which + ", charCode: " + e.charCode + ", detail: " + e.detail + " ====> " + this.keyCode + ' -- ' + KeyCode[this.keyCode]);
            this.ctrlKey = this.ctrlKey || this.keyCode === 5 /* KeyCode.Ctrl */;
            this.altKey = this.altKey || this.keyCode === 6 /* KeyCode.Alt */;
            this.shiftKey = this.shiftKey || this.keyCode === 4 /* KeyCode.Shift */;
            this.metaKey = this.metaKey || this.keyCode === 57 /* KeyCode.Meta */;
            this._asKeybinding = this._computeKeybinding();
            this._asRuntimeKeybinding = this._computeRuntimeKeybinding();
            // console.log(`code: ${e.code}, keyCode: ${e.keyCode}, key: ${e.key}`);
        }
        preventDefault() {
            if (this.browserEvent && this.browserEvent.preventDefault) {
                this.browserEvent.preventDefault();
            }
        }
        stopPropagation() {
            if (this.browserEvent && this.browserEvent.stopPropagation) {
                this.browserEvent.stopPropagation();
            }
        }
        toKeybinding() {
            return this._asRuntimeKeybinding;
        }
        equals(other) {
            return this._asKeybinding === other;
        }
        _computeKeybinding() {
            let key = 0 /* KeyCode.Unknown */;
            if (this.keyCode !== 5 /* KeyCode.Ctrl */ && this.keyCode !== 4 /* KeyCode.Shift */ && this.keyCode !== 6 /* KeyCode.Alt */ && this.keyCode !== 57 /* KeyCode.Meta */) {
                key = this.keyCode;
            }
            let result = 0;
            if (this.ctrlKey) {
                result |= ctrlKeyMod;
            }
            if (this.altKey) {
                result |= altKeyMod;
            }
            if (this.shiftKey) {
                result |= shiftKeyMod;
            }
            if (this.metaKey) {
                result |= metaKeyMod;
            }
            result |= key;
            return result;
        }
        _computeRuntimeKeybinding() {
            let key = 0 /* KeyCode.Unknown */;
            if (this.keyCode !== 5 /* KeyCode.Ctrl */ && this.keyCode !== 4 /* KeyCode.Shift */ && this.keyCode !== 6 /* KeyCode.Alt */ && this.keyCode !== 57 /* KeyCode.Meta */) {
                key = this.keyCode;
            }
            return new keybindings_1.SimpleKeybinding(this.ctrlKey, this.shiftKey, this.altKey, this.metaKey, key);
        }
    }
    exports.StandardKeyboardEvent = StandardKeyboardEvent;
});
//# sourceMappingURL=keyboardEvent.js.map