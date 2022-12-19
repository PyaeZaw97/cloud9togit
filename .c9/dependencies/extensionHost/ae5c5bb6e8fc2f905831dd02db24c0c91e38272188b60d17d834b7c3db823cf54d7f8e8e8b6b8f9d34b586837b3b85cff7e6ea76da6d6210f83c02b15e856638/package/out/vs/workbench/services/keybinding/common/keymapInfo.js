/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/platform/keyboardLayout/common/keyboardLayout"], function (require, exports, platform_1, keyboardLayout_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeymapInfo = void 0;
    function deserializeMapping(serializedMapping) {
        let mapping = serializedMapping;
        let ret = {};
        for (let key in mapping) {
            let result = mapping[key];
            if (result.length) {
                let value = result[0];
                let withShift = result[1];
                let withAltGr = result[2];
                let withShiftAltGr = result[3];
                let mask = Number(result[4]);
                let vkey = result.length === 6 ? result[5] : undefined;
                ret[key] = {
                    'value': value,
                    'vkey': vkey,
                    'withShift': withShift,
                    'withAltGr': withAltGr,
                    'withShiftAltGr': withShiftAltGr,
                    'valueIsDeadKey': (mask & 1) > 0,
                    'withShiftIsDeadKey': (mask & 2) > 0,
                    'withAltGrIsDeadKey': (mask & 4) > 0,
                    'withShiftAltGrIsDeadKey': (mask & 8) > 0
                };
            }
            else {
                ret[key] = {
                    'value': '',
                    'valueIsDeadKey': false,
                    'withShift': '',
                    'withShiftIsDeadKey': false,
                    'withAltGr': '',
                    'withAltGrIsDeadKey': false,
                    'withShiftAltGr': '',
                    'withShiftAltGrIsDeadKey': false
                };
            }
        }
        return ret;
    }
    class KeymapInfo {
        constructor(layout, secondaryLayouts, keyboardMapping, isUserKeyboardLayout) {
            this.layout = layout;
            this.secondaryLayouts = secondaryLayouts;
            this.mapping = deserializeMapping(keyboardMapping);
            this.isUserKeyboardLayout = !!isUserKeyboardLayout;
            this.layout.isUserKeyboardLayout = !!isUserKeyboardLayout;
        }
        static createKeyboardLayoutFromDebugInfo(layout, value, isUserKeyboardLayout) {
            let keyboardLayoutInfo = new KeymapInfo(layout, [], {}, true);
            keyboardLayoutInfo.mapping = value;
            return keyboardLayoutInfo;
        }
        update(other) {
            this.layout = other.layout;
            this.secondaryLayouts = other.secondaryLayouts;
            this.mapping = other.mapping;
            this.isUserKeyboardLayout = other.isUserKeyboardLayout;
            this.layout.isUserKeyboardLayout = other.isUserKeyboardLayout;
        }
        getScore(other) {
            let score = 0;
            for (let key in other) {
                if (platform_1.isWindows && (key === 'Backslash' || key === 'KeyQ')) {
                    // keymap from Chromium is probably wrong.
                    continue;
                }
                if (platform_1.isLinux && (key === 'Backspace' || key === 'Escape')) {
                    // native keymap doesn't align with keyboard event
                    continue;
                }
                let currentMapping = this.mapping[key];
                if (currentMapping === undefined) {
                    score -= 1;
                }
                let otherMapping = other[key];
                if (currentMapping && otherMapping && currentMapping.value !== otherMapping.value) {
                    score -= 1;
                }
            }
            return score;
        }
        equal(other) {
            if (this.isUserKeyboardLayout !== other.isUserKeyboardLayout) {
                return false;
            }
            if ((0, keyboardLayout_1.getKeyboardLayoutId)(this.layout) !== (0, keyboardLayout_1.getKeyboardLayoutId)(other.layout)) {
                return false;
            }
            return this.fuzzyEqual(other.mapping);
        }
        fuzzyEqual(other) {
            for (let key in other) {
                if (platform_1.isWindows && (key === 'Backslash' || key === 'KeyQ')) {
                    // keymap from Chromium is probably wrong.
                    continue;
                }
                if (this.mapping[key] === undefined) {
                    return false;
                }
                let currentMapping = this.mapping[key];
                let otherMapping = other[key];
                if (currentMapping.value !== otherMapping.value) {
                    return false;
                }
            }
            return true;
        }
    }
    exports.KeymapInfo = KeymapInfo;
});
//# sourceMappingURL=keymapInfo.js.map