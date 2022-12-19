/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri", "vs/nls", "vs/workbench/common/editor/editorInput", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/path"], function (require, exports, network_1, uri_1, nls_1, editorInput_1, extensionManagementUtil_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsInput = void 0;
    class ExtensionsInput extends editorInput_1.EditorInput {
        constructor(_extension) {
            super();
            this._extension = _extension;
        }
        get typeId() {
            return ExtensionsInput.ID;
        }
        get capabilities() {
            return 2 /* EditorInputCapabilities.Readonly */ | 8 /* EditorInputCapabilities.Singleton */;
        }
        get resource() {
            return uri_1.URI.from({
                scheme: network_1.Schemas.extension,
                path: (0, path_1.join)(this._extension.identifier.id, 'extension')
            });
        }
        get extension() { return this._extension; }
        getName() {
            return (0, nls_1.localize)('extensionsInputName', "Extension: {0}", this._extension.displayName);
        }
        matches(other) {
            if (super.matches(other)) {
                return true;
            }
            return other instanceof ExtensionsInput && (0, extensionManagementUtil_1.areSameExtensions)(this._extension.identifier, other._extension.identifier);
        }
    }
    exports.ExtensionsInput = ExtensionsInput;
    ExtensionsInput.ID = 'workbench.extensions.input2';
});
//# sourceMappingURL=extensionsInput.js.map