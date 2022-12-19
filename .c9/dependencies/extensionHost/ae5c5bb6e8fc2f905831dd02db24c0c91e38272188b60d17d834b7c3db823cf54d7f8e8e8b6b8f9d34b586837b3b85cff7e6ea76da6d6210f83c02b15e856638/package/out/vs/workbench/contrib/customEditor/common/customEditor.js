/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/editor/common/editorResolverService"], function (require, exports, arrays_1, nls, contextkey_1, instantiation_1, editorResolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomEditorInfoCollection = exports.CustomEditorInfo = exports.CustomEditorPriority = exports.CONTEXT_FOCUSED_CUSTOM_EDITOR_IS_EDITABLE = exports.CONTEXT_ACTIVE_CUSTOM_EDITOR_ID = exports.ICustomEditorService = void 0;
    exports.ICustomEditorService = (0, instantiation_1.createDecorator)('customEditorService');
    exports.CONTEXT_ACTIVE_CUSTOM_EDITOR_ID = new contextkey_1.RawContextKey('activeCustomEditorId', '', {
        type: 'string',
        description: nls.localize('context.customEditor', "The viewType of the currently active custom editor."),
    });
    exports.CONTEXT_FOCUSED_CUSTOM_EDITOR_IS_EDITABLE = new contextkey_1.RawContextKey('focusedCustomEditorIsEditable', false);
    var CustomEditorPriority;
    (function (CustomEditorPriority) {
        CustomEditorPriority["default"] = "default";
        CustomEditorPriority["builtin"] = "builtin";
        CustomEditorPriority["option"] = "option";
    })(CustomEditorPriority = exports.CustomEditorPriority || (exports.CustomEditorPriority = {}));
    class CustomEditorInfo {
        constructor(descriptor) {
            this.id = descriptor.id;
            this.displayName = descriptor.displayName;
            this.providerDisplayName = descriptor.providerDisplayName;
            this.priority = descriptor.priority;
            this.selector = descriptor.selector;
        }
        matches(resource) {
            return this.selector.some(selector => selector.filenamePattern && (0, editorResolverService_1.globMatchesResource)(selector.filenamePattern, resource));
        }
    }
    exports.CustomEditorInfo = CustomEditorInfo;
    class CustomEditorInfoCollection {
        constructor(editors) {
            this.allEditors = (0, arrays_1.distinct)(editors, editor => editor.id);
        }
        get length() { return this.allEditors.length; }
        /**
         * Find the single default editor to use (if any) by looking at the editor's priority and the
         * other contributed editors.
         */
        get defaultEditor() {
            return this.allEditors.find(editor => {
                switch (editor.priority) {
                    case editorResolverService_1.RegisteredEditorPriority.default:
                    case editorResolverService_1.RegisteredEditorPriority.builtin:
                        // A default editor must have higher priority than all other contributed editors.
                        return this.allEditors.every(otherEditor => otherEditor === editor || isLowerPriority(otherEditor, editor));
                    default:
                        return false;
                }
            });
        }
        /**
         * Find the best available editor to use.
         *
         * Unlike the `defaultEditor`, a bestAvailableEditor can exist even if there are other editors with
         * the same priority.
         */
        get bestAvailableEditor() {
            const editors = Array.from(this.allEditors).sort((a, b) => {
                return (0, editorResolverService_1.priorityToRank)(a.priority) - (0, editorResolverService_1.priorityToRank)(b.priority);
            });
            return editors[0];
        }
    }
    exports.CustomEditorInfoCollection = CustomEditorInfoCollection;
    function isLowerPriority(otherEditor, editor) {
        return (0, editorResolverService_1.priorityToRank)(otherEditor.priority) < (0, editorResolverService_1.priorityToRank)(editor.priority);
    }
});
//# sourceMappingURL=customEditor.js.map