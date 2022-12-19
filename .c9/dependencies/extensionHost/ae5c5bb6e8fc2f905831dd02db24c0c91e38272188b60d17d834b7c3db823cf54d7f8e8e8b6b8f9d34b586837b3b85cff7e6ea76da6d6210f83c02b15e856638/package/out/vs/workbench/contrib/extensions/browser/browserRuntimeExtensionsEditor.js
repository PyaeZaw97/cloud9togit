/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/extensions/browser/abstractRuntimeExtensionsEditor"], function (require, exports, abstractRuntimeExtensionsEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RuntimeExtensionsEditor = void 0;
    class RuntimeExtensionsEditor extends abstractRuntimeExtensionsEditor_1.AbstractRuntimeExtensionsEditor {
        _getProfileInfo() {
            return null;
        }
        _getUnresponsiveProfile(extensionId) {
            return undefined;
        }
        _createSlowExtensionAction(element) {
            return null;
        }
        _createReportExtensionIssueAction(element) {
            return null;
        }
        _createSaveExtensionHostProfileAction() {
            return null;
        }
        _createProfileAction() {
            return null;
        }
    }
    exports.RuntimeExtensionsEditor = RuntimeExtensionsEditor;
});
//# sourceMappingURL=browserRuntimeExtensionsEditor.js.map