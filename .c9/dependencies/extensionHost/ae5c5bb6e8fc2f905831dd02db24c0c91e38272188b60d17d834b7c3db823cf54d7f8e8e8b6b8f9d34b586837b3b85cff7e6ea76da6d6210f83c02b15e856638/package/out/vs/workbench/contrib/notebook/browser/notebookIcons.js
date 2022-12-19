/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/nls", "vs/platform/theme/common/iconRegistry"], function (require, exports, codicons_1, nls_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mimetypeIcon = exports.renderOutputIcon = exports.revertIcon = exports.openAsTextIcon = exports.expandedIcon = exports.collapsedIcon = exports.executingStateIcon = exports.pendingStateIcon = exports.errorStateIcon = exports.successStateIcon = exports.unfoldIcon = exports.splitCellIcon = exports.clearIcon = exports.moveDownIcon = exports.moveUpIcon = exports.stopEditIcon = exports.editIcon = exports.executeAllIcon = exports.deleteCellIcon = exports.stopIcon = exports.executeBelowIcon = exports.executeAboveIcon = exports.executeIcon = exports.selectKernelIcon = exports.configureKernelIcon = void 0;
    exports.configureKernelIcon = (0, iconRegistry_1.registerIcon)('notebook-kernel-configure', codicons_1.Codicon.gear, (0, nls_1.localize)('configureKernel', 'Configure icon in kernel configuration widget in notebook editors.'));
    exports.selectKernelIcon = (0, iconRegistry_1.registerIcon)('notebook-kernel-select', codicons_1.Codicon.serverEnvironment, (0, nls_1.localize)('selectKernelIcon', 'Configure icon to select a kernel in notebook editors.'));
    exports.executeIcon = (0, iconRegistry_1.registerIcon)('notebook-execute', codicons_1.Codicon.play, (0, nls_1.localize)('executeIcon', 'Icon to execute in notebook editors.'));
    exports.executeAboveIcon = (0, iconRegistry_1.registerIcon)('notebook-execute-above', codicons_1.Codicon.runAbove, (0, nls_1.localize)('executeAboveIcon', 'Icon to execute above cells in notebook editors.'));
    exports.executeBelowIcon = (0, iconRegistry_1.registerIcon)('notebook-execute-below', codicons_1.Codicon.runBelow, (0, nls_1.localize)('executeBelowIcon', 'Icon to execute below cells in notebook editors.'));
    exports.stopIcon = (0, iconRegistry_1.registerIcon)('notebook-stop', codicons_1.Codicon.primitiveSquare, (0, nls_1.localize)('stopIcon', 'Icon to stop an execution in notebook editors.'));
    exports.deleteCellIcon = (0, iconRegistry_1.registerIcon)('notebook-delete-cell', codicons_1.Codicon.trash, (0, nls_1.localize)('deleteCellIcon', 'Icon to delete a cell in notebook editors.'));
    exports.executeAllIcon = (0, iconRegistry_1.registerIcon)('notebook-execute-all', codicons_1.Codicon.runAll, (0, nls_1.localize)('executeAllIcon', 'Icon to execute all cells in notebook editors.'));
    exports.editIcon = (0, iconRegistry_1.registerIcon)('notebook-edit', codicons_1.Codicon.pencil, (0, nls_1.localize)('editIcon', 'Icon to edit a cell in notebook editors.'));
    exports.stopEditIcon = (0, iconRegistry_1.registerIcon)('notebook-stop-edit', codicons_1.Codicon.check, (0, nls_1.localize)('stopEditIcon', 'Icon to stop editing a cell in notebook editors.'));
    exports.moveUpIcon = (0, iconRegistry_1.registerIcon)('notebook-move-up', codicons_1.Codicon.arrowUp, (0, nls_1.localize)('moveUpIcon', 'Icon to move up a cell in notebook editors.'));
    exports.moveDownIcon = (0, iconRegistry_1.registerIcon)('notebook-move-down', codicons_1.Codicon.arrowDown, (0, nls_1.localize)('moveDownIcon', 'Icon to move down a cell in notebook editors.'));
    exports.clearIcon = (0, iconRegistry_1.registerIcon)('notebook-clear', codicons_1.Codicon.clearAll, (0, nls_1.localize)('clearIcon', 'Icon to clear cell outputs in notebook editors.'));
    exports.splitCellIcon = (0, iconRegistry_1.registerIcon)('notebook-split-cell', codicons_1.Codicon.splitVertical, (0, nls_1.localize)('splitCellIcon', 'Icon to split a cell in notebook editors.'));
    exports.unfoldIcon = (0, iconRegistry_1.registerIcon)('notebook-unfold', codicons_1.Codicon.unfold, (0, nls_1.localize)('unfoldIcon', 'Icon to unfold a cell in notebook editors.'));
    exports.successStateIcon = (0, iconRegistry_1.registerIcon)('notebook-state-success', codicons_1.Codicon.check, (0, nls_1.localize)('successStateIcon', 'Icon to indicate a success state in notebook editors.'));
    exports.errorStateIcon = (0, iconRegistry_1.registerIcon)('notebook-state-error', codicons_1.Codicon.error, (0, nls_1.localize)('errorStateIcon', 'Icon to indicate an error state in notebook editors.'));
    exports.pendingStateIcon = (0, iconRegistry_1.registerIcon)('notebook-state-pending', codicons_1.Codicon.clock, (0, nls_1.localize)('pendingStateIcon', 'Icon to indicate a pending state in notebook editors.'));
    exports.executingStateIcon = (0, iconRegistry_1.registerIcon)('notebook-state-executing', codicons_1.Codicon.sync, (0, nls_1.localize)('executingStateIcon', 'Icon to indicate an executing state in notebook editors.'));
    exports.collapsedIcon = (0, iconRegistry_1.registerIcon)('notebook-collapsed', codicons_1.Codicon.chevronRight, (0, nls_1.localize)('collapsedIcon', 'Icon to annotate a collapsed section in notebook editors.'));
    exports.expandedIcon = (0, iconRegistry_1.registerIcon)('notebook-expanded', codicons_1.Codicon.chevronDown, (0, nls_1.localize)('expandedIcon', 'Icon to annotate an expanded section in notebook editors.'));
    exports.openAsTextIcon = (0, iconRegistry_1.registerIcon)('notebook-open-as-text', codicons_1.Codicon.fileCode, (0, nls_1.localize)('openAsTextIcon', 'Icon to open the notebook in a text editor.'));
    exports.revertIcon = (0, iconRegistry_1.registerIcon)('notebook-revert', codicons_1.Codicon.discard, (0, nls_1.localize)('revertIcon', 'Icon to revert in notebook editors.'));
    exports.renderOutputIcon = (0, iconRegistry_1.registerIcon)('notebook-render-output', codicons_1.Codicon.preview, (0, nls_1.localize)('renderOutputIcon', 'Icon to render output in diff editor.'));
    exports.mimetypeIcon = (0, iconRegistry_1.registerIcon)('notebook-mimetype', codicons_1.Codicon.code, (0, nls_1.localize)('mimetypeIcon', 'Icon for a mime type in notebook editors.'));
});
//# sourceMappingURL=notebookIcons.js.map