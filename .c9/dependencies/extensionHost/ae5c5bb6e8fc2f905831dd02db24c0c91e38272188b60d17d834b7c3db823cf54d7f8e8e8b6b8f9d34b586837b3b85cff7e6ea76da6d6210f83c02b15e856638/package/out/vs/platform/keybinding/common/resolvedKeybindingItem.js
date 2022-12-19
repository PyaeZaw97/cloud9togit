/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.removeElementsAfterNulls = exports.ResolvedKeybindingItem = void 0;
    class ResolvedKeybindingItem {
        constructor(resolvedKeybinding, command, commandArgs, when, isDefault, extensionId, isBuiltinExtension) {
            this._resolvedKeybindingItemBrand = undefined;
            this.resolvedKeybinding = resolvedKeybinding;
            this.keypressParts = resolvedKeybinding ? removeElementsAfterNulls(resolvedKeybinding.getDispatchParts()) : [];
            if (resolvedKeybinding && this.keypressParts.length === 0) {
                // handle possible single modifier chord keybindings
                this.keypressParts = removeElementsAfterNulls(resolvedKeybinding.getSingleModifierDispatchParts());
            }
            this.bubble = (command ? command.charCodeAt(0) === 94 /* CharCode.Caret */ : false);
            this.command = this.bubble ? command.substr(1) : command;
            this.commandArgs = commandArgs;
            this.when = when;
            this.isDefault = isDefault;
            this.extensionId = extensionId;
            this.isBuiltinExtension = isBuiltinExtension;
        }
    }
    exports.ResolvedKeybindingItem = ResolvedKeybindingItem;
    function removeElementsAfterNulls(arr) {
        let result = [];
        for (let i = 0, len = arr.length; i < len; i++) {
            const element = arr[i];
            if (!element) {
                // stop processing at first encountered null
                return result;
            }
            result.push(element);
        }
        return result;
    }
    exports.removeElementsAfterNulls = removeElementsAfterNulls;
});
//# sourceMappingURL=resolvedKeybindingItem.js.map