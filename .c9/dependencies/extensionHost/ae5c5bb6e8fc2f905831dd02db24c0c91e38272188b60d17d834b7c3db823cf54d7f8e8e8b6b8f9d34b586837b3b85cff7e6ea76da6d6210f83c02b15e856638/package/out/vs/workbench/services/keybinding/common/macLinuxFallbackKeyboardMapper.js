/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keybindings", "vs/platform/keybinding/common/usLayoutResolvedKeybinding"], function (require, exports, keybindings_1, usLayoutResolvedKeybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MacLinuxFallbackKeyboardMapper = void 0;
    /**
     * A keyboard mapper to be used when reading the keymap from the OS fails.
     */
    class MacLinuxFallbackKeyboardMapper {
        constructor(OS) {
            this._OS = OS;
        }
        dumpDebugInfo() {
            return 'FallbackKeyboardMapper dispatching on keyCode';
        }
        resolveKeybinding(keybinding) {
            return [new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(keybinding, this._OS)];
        }
        resolveKeyboardEvent(keyboardEvent) {
            const keybinding = new keybindings_1.SimpleKeybinding(keyboardEvent.ctrlKey, keyboardEvent.shiftKey, keyboardEvent.altKey, keyboardEvent.metaKey, keyboardEvent.keyCode);
            return new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(keybinding.toChord(), this._OS);
        }
        resolveUserBinding(input) {
            return usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding.resolveUserBinding(input, this._OS);
        }
    }
    exports.MacLinuxFallbackKeyboardMapper = MacLinuxFallbackKeyboardMapper;
});
//# sourceMappingURL=macLinuxFallbackKeyboardMapper.js.map