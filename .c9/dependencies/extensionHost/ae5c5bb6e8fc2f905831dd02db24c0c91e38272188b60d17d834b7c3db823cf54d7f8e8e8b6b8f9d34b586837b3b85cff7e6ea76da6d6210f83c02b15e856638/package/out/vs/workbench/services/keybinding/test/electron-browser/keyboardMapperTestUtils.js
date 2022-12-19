/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/path", "vs/base/test/node/testUtils", "vs/base/node/pfs"], function (require, exports, assert, path, testUtils_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assertMapping = exports.readRawMapping = exports.assertResolveUserBinding = exports.assertResolveKeyboardEvent = exports.assertResolveKeybinding = void 0;
    function toIResolvedKeybinding(kb) {
        return {
            label: kb.getLabel(),
            ariaLabel: kb.getAriaLabel(),
            electronAccelerator: kb.getElectronAccelerator(),
            userSettingsLabel: kb.getUserSettingsLabel(),
            isWYSIWYG: kb.isWYSIWYG(),
            isChord: kb.isChord(),
            dispatchParts: kb.getDispatchParts(),
            singleModifierDispatchParts: kb.getSingleModifierDispatchParts()
        };
    }
    function assertResolveKeybinding(mapper, keybinding, expected) {
        let actual = mapper.resolveKeybinding(keybinding).map(toIResolvedKeybinding);
        assert.deepStrictEqual(actual, expected);
    }
    exports.assertResolveKeybinding = assertResolveKeybinding;
    function assertResolveKeyboardEvent(mapper, keyboardEvent, expected) {
        let actual = toIResolvedKeybinding(mapper.resolveKeyboardEvent(keyboardEvent));
        assert.deepStrictEqual(actual, expected);
    }
    exports.assertResolveKeyboardEvent = assertResolveKeyboardEvent;
    function assertResolveUserBinding(mapper, parts, expected) {
        let actual = mapper.resolveUserBinding(parts).map(toIResolvedKeybinding);
        assert.deepStrictEqual(actual, expected);
    }
    exports.assertResolveUserBinding = assertResolveUserBinding;
    function readRawMapping(file) {
        return pfs_1.Promises.readFile((0, testUtils_1.getPathFromAmdModule)(require, `vs/workbench/services/keybinding/test/electron-browser/${file}.js`)).then((buff) => {
            let contents = buff.toString();
            let func = new Function('define', contents);
            let rawMappings = null;
            func(function (value) {
                rawMappings = value;
            });
            return rawMappings;
        });
    }
    exports.readRawMapping = readRawMapping;
    function assertMapping(writeFileIfDifferent, mapper, file) {
        const filePath = path.normalize((0, testUtils_1.getPathFromAmdModule)(require, `vs/workbench/services/keybinding/test/electron-browser/${file}`));
        return pfs_1.Promises.readFile(filePath).then((buff) => {
            const expected = buff.toString().replace(/\r\n/g, '\n');
            const actual = mapper.dumpDebugInfo().replace(/\r\n/g, '\n');
            if (actual !== expected && writeFileIfDifferent) {
                const destPath = filePath.replace(/[\/\\]out[\/\\]vs[\/\\]workbench/, '/src/vs/workbench');
                pfs_1.Promises.writeFile(destPath, actual);
            }
            assert.deepStrictEqual(actual, expected);
        });
    }
    exports.assertMapping = assertMapping;
});
//# sourceMappingURL=keyboardMapperTestUtils.js.map