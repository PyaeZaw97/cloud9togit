/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/editor", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/editor", "vs/workbench/contrib/files/browser/editors/textFileEditor"], function (require, exports, nls_1, platform_1, editor_1, fileEditorInput_1, descriptors_1, editor_2, textFileEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register file editor
    platform_1.Registry.as(editor_1.EditorExtensions.EditorPane).registerEditorPane(editor_2.EditorPaneDescriptor.create(textFileEditor_1.TextFileEditor, textFileEditor_1.TextFileEditor.ID, (0, nls_1.localize)('textFileEditor', "Text File Editor")), [
        new descriptors_1.SyncDescriptor(fileEditorInput_1.FileEditorInput)
    ]);
});
//# sourceMappingURL=files.web.contribution.js.map