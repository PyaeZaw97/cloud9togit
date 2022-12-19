/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/platform/instantiation/common/instantiation"], function (require, exports, keyCodes_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.macLinuxKeyboardMappingEquals = exports.windowsKeyboardMappingEquals = exports.getKeyboardLayoutId = exports.parseKeyboardLayoutDescription = exports.areKeyboardLayoutsEqual = exports.IKeyboardLayoutService = void 0;
    exports.IKeyboardLayoutService = (0, instantiation_1.createDecorator)('keyboardLayoutService');
    function areKeyboardLayoutsEqual(a, b) {
        if (!a || !b) {
            return false;
        }
        if (a.name && b.name && a.name === b.name) {
            return true;
        }
        if (a.id && b.id && a.id === b.id) {
            return true;
        }
        if (a.model &&
            b.model &&
            a.model === b.model &&
            a.layout === b.layout) {
            return true;
        }
        return false;
    }
    exports.areKeyboardLayoutsEqual = areKeyboardLayoutsEqual;
    function parseKeyboardLayoutDescription(layout) {
        if (!layout) {
            return { label: '', description: '' };
        }
        if (layout.name) {
            // windows
            let windowsLayout = layout;
            return {
                label: windowsLayout.text,
                description: ''
            };
        }
        if (layout.id) {
            let macLayout = layout;
            if (macLayout.localizedName) {
                return {
                    label: macLayout.localizedName,
                    description: ''
                };
            }
            if (/^com\.apple\.keylayout\./.test(macLayout.id)) {
                return {
                    label: macLayout.id.replace(/^com\.apple\.keylayout\./, '').replace(/-/, ' '),
                    description: ''
                };
            }
            if (/^.*inputmethod\./.test(macLayout.id)) {
                return {
                    label: macLayout.id.replace(/^.*inputmethod\./, '').replace(/[-\.]/, ' '),
                    description: `Input Method (${macLayout.lang})`
                };
            }
            return {
                label: macLayout.lang,
                description: ''
            };
        }
        let linuxLayout = layout;
        return {
            label: linuxLayout.layout,
            description: ''
        };
    }
    exports.parseKeyboardLayoutDescription = parseKeyboardLayoutDescription;
    function getKeyboardLayoutId(layout) {
        if (layout.name) {
            return layout.name;
        }
        if (layout.id) {
            return layout.id;
        }
        return layout.layout;
    }
    exports.getKeyboardLayoutId = getKeyboardLayoutId;
    function windowsKeyMappingEquals(a, b) {
        if (!a && !b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        return (a.vkey === b.vkey
            && a.value === b.value
            && a.withShift === b.withShift
            && a.withAltGr === b.withAltGr
            && a.withShiftAltGr === b.withShiftAltGr);
    }
    function windowsKeyboardMappingEquals(a, b) {
        if (!a && !b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        for (let scanCode = 0; scanCode < 193 /* ScanCode.MAX_VALUE */; scanCode++) {
            const strScanCode = keyCodes_1.ScanCodeUtils.toString(scanCode);
            const aEntry = a[strScanCode];
            const bEntry = b[strScanCode];
            if (!windowsKeyMappingEquals(aEntry, bEntry)) {
                return false;
            }
        }
        return true;
    }
    exports.windowsKeyboardMappingEquals = windowsKeyboardMappingEquals;
    function macLinuxKeyMappingEquals(a, b) {
        if (!a && !b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        return (a.value === b.value
            && a.withShift === b.withShift
            && a.withAltGr === b.withAltGr
            && a.withShiftAltGr === b.withShiftAltGr);
    }
    function macLinuxKeyboardMappingEquals(a, b) {
        if (!a && !b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        for (let scanCode = 0; scanCode < 193 /* ScanCode.MAX_VALUE */; scanCode++) {
            const strScanCode = keyCodes_1.ScanCodeUtils.toString(scanCode);
            const aEntry = a[strScanCode];
            const bEntry = b[strScanCode];
            if (!macLinuxKeyMappingEquals(aEntry, bEntry)) {
                return false;
            }
        }
        return true;
    }
    exports.macLinuxKeyboardMappingEquals = macLinuxKeyboardMappingEquals;
});
//# sourceMappingURL=keyboardLayout.js.map