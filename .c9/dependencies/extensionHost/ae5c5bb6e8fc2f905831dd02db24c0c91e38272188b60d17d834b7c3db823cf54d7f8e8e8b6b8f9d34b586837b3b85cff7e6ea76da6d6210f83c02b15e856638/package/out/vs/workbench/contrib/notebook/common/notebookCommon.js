/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/glob", "vs/base/common/iterator", "vs/base/common/mime", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/platform/contextkey/common/contextkey"], function (require, exports, glob, iterator_1, mime_1, network_1, path_1, platform_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookWorkingCopyTypeIdentifier = exports.CellStatusbarAlignment = exports.NotebookSetting = exports.notebookDocumentFilterMatch = exports.isDocumentExcludePattern = exports.NotebookEditorPriority = exports.NOTEBOOK_EDITOR_CURSOR_BOUNDARY = exports.diff = exports.MimeTypeDisplayOrder = exports.CellUri = exports.CellEditType = exports.SelectionStateType = exports.NotebookCellsChangeType = exports.RendererMessagingSpec = exports.NotebookRendererMatch = exports.NotebookCellExecutionState = exports.NotebookRunState = exports.RENDERER_NOT_AVAILABLE = exports.RENDERER_EQUIVALENT_EXTENSIONS = exports.ACCESSIBLE_NOTEBOOK_DISPLAY_ORDER = exports.NOTEBOOK_DISPLAY_ORDER = exports.CellKind = exports.NOTEBOOK_DIFF_EDITOR_ID = exports.NOTEBOOK_EDITOR_ID = void 0;
    exports.NOTEBOOK_EDITOR_ID = 'workbench.editor.notebook';
    exports.NOTEBOOK_DIFF_EDITOR_ID = 'workbench.editor.notebookTextDiffEditor';
    var CellKind;
    (function (CellKind) {
        CellKind[CellKind["Markup"] = 1] = "Markup";
        CellKind[CellKind["Code"] = 2] = "Code";
    })(CellKind = exports.CellKind || (exports.CellKind = {}));
    exports.NOTEBOOK_DISPLAY_ORDER = [
        'application/json',
        'application/javascript',
        'text/html',
        'image/svg+xml',
        mime_1.Mimes.latex,
        mime_1.Mimes.markdown,
        'image/png',
        'image/jpeg',
        mime_1.Mimes.text
    ];
    exports.ACCESSIBLE_NOTEBOOK_DISPLAY_ORDER = [
        mime_1.Mimes.latex,
        mime_1.Mimes.markdown,
        'application/json',
        mime_1.Mimes.text,
        'text/html',
        'image/svg+xml',
        'image/png',
        'image/jpeg',
    ];
    /**
     * A mapping of extension IDs who contain renderers, to notebook ids who they
     * should be treated as the same in the renderer selection logic. This is used
     * to prefer the 1st party Jupyter renderers even though they're in a separate
     * extension, for instance. See #136247.
     */
    exports.RENDERER_EQUIVALENT_EXTENSIONS = new Map([
        ['ms-toolsai.jupyter', new Set(['jupyter-notebook', 'interactive'])],
        ['ms-toolsai.jupyter-renderers', new Set(['jupyter-notebook', 'interactive'])],
    ]);
    exports.RENDERER_NOT_AVAILABLE = '_notAvailable';
    var NotebookRunState;
    (function (NotebookRunState) {
        NotebookRunState[NotebookRunState["Running"] = 1] = "Running";
        NotebookRunState[NotebookRunState["Idle"] = 2] = "Idle";
    })(NotebookRunState = exports.NotebookRunState || (exports.NotebookRunState = {}));
    var NotebookCellExecutionState;
    (function (NotebookCellExecutionState) {
        NotebookCellExecutionState[NotebookCellExecutionState["Unconfirmed"] = 1] = "Unconfirmed";
        NotebookCellExecutionState[NotebookCellExecutionState["Pending"] = 2] = "Pending";
        NotebookCellExecutionState[NotebookCellExecutionState["Executing"] = 3] = "Executing";
    })(NotebookCellExecutionState = exports.NotebookCellExecutionState || (exports.NotebookCellExecutionState = {}));
    /** Note: enum values are used for sorting */
    var NotebookRendererMatch;
    (function (NotebookRendererMatch) {
        /** Renderer has a hard dependency on an available kernel */
        NotebookRendererMatch[NotebookRendererMatch["WithHardKernelDependency"] = 0] = "WithHardKernelDependency";
        /** Renderer works better with an available kernel */
        NotebookRendererMatch[NotebookRendererMatch["WithOptionalKernelDependency"] = 1] = "WithOptionalKernelDependency";
        /** Renderer is kernel-agnostic */
        NotebookRendererMatch[NotebookRendererMatch["Pure"] = 2] = "Pure";
        /** Renderer is for a different mimeType or has a hard dependency which is unsatisfied */
        NotebookRendererMatch[NotebookRendererMatch["Never"] = 3] = "Never";
    })(NotebookRendererMatch = exports.NotebookRendererMatch || (exports.NotebookRendererMatch = {}));
    /**
     * Renderer messaging requirement. While this allows for 'optional' messaging,
     * VS Code effectively treats it the same as true right now. "Partial
     * activation" of extensions is a very tricky problem, which could allow
     * solving this. But for now, optional is mostly only honored for aznb.
     */
    var RendererMessagingSpec;
    (function (RendererMessagingSpec) {
        RendererMessagingSpec["Always"] = "always";
        RendererMessagingSpec["Never"] = "never";
        RendererMessagingSpec["Optional"] = "optional";
    })(RendererMessagingSpec = exports.RendererMessagingSpec || (exports.RendererMessagingSpec = {}));
    var NotebookCellsChangeType;
    (function (NotebookCellsChangeType) {
        NotebookCellsChangeType[NotebookCellsChangeType["ModelChange"] = 1] = "ModelChange";
        NotebookCellsChangeType[NotebookCellsChangeType["Move"] = 2] = "Move";
        NotebookCellsChangeType[NotebookCellsChangeType["ChangeCellLanguage"] = 5] = "ChangeCellLanguage";
        NotebookCellsChangeType[NotebookCellsChangeType["Initialize"] = 6] = "Initialize";
        NotebookCellsChangeType[NotebookCellsChangeType["ChangeCellMetadata"] = 7] = "ChangeCellMetadata";
        NotebookCellsChangeType[NotebookCellsChangeType["Output"] = 8] = "Output";
        NotebookCellsChangeType[NotebookCellsChangeType["OutputItem"] = 9] = "OutputItem";
        NotebookCellsChangeType[NotebookCellsChangeType["ChangeCellContent"] = 10] = "ChangeCellContent";
        NotebookCellsChangeType[NotebookCellsChangeType["ChangeDocumentMetadata"] = 11] = "ChangeDocumentMetadata";
        NotebookCellsChangeType[NotebookCellsChangeType["ChangeCellInternalMetadata"] = 12] = "ChangeCellInternalMetadata";
        NotebookCellsChangeType[NotebookCellsChangeType["ChangeCellMime"] = 13] = "ChangeCellMime";
        NotebookCellsChangeType[NotebookCellsChangeType["Unknown"] = 100] = "Unknown";
    })(NotebookCellsChangeType = exports.NotebookCellsChangeType || (exports.NotebookCellsChangeType = {}));
    var SelectionStateType;
    (function (SelectionStateType) {
        SelectionStateType[SelectionStateType["Handle"] = 0] = "Handle";
        SelectionStateType[SelectionStateType["Index"] = 1] = "Index";
    })(SelectionStateType = exports.SelectionStateType || (exports.SelectionStateType = {}));
    var CellEditType;
    (function (CellEditType) {
        CellEditType[CellEditType["Replace"] = 1] = "Replace";
        CellEditType[CellEditType["Output"] = 2] = "Output";
        CellEditType[CellEditType["Metadata"] = 3] = "Metadata";
        CellEditType[CellEditType["CellLanguage"] = 4] = "CellLanguage";
        CellEditType[CellEditType["DocumentMetadata"] = 5] = "DocumentMetadata";
        CellEditType[CellEditType["Move"] = 6] = "Move";
        CellEditType[CellEditType["OutputItems"] = 7] = "OutputItems";
        CellEditType[CellEditType["PartialMetadata"] = 8] = "PartialMetadata";
        CellEditType[CellEditType["PartialInternalMetadata"] = 9] = "PartialInternalMetadata";
    })(CellEditType = exports.CellEditType || (exports.CellEditType = {}));
    var CellUri;
    (function (CellUri) {
        CellUri.scheme = network_1.Schemas.vscodeNotebookCell;
        const _regex = /^ch(\d{7,})/;
        function generate(notebook, handle) {
            return notebook.with({
                scheme: CellUri.scheme,
                fragment: `ch${handle.toString().padStart(7, '0')}${notebook.scheme !== network_1.Schemas.file ? notebook.scheme : ''}`
            });
        }
        CellUri.generate = generate;
        function parse(cell) {
            if (cell.scheme !== CellUri.scheme) {
                return undefined;
            }
            const match = _regex.exec(cell.fragment);
            if (!match) {
                return undefined;
            }
            const handle = Number(match[1]);
            return {
                handle,
                notebook: cell.with({
                    scheme: cell.fragment.substring(match[0].length) || network_1.Schemas.file,
                    fragment: null
                })
            };
        }
        CellUri.parse = parse;
        function generateCellOutputUri(notebook, outputId) {
            return notebook.with({
                scheme: network_1.Schemas.vscodeNotebookCellOutput,
                fragment: `op${outputId !== null && outputId !== void 0 ? outputId : ''},${notebook.scheme !== network_1.Schemas.file ? notebook.scheme : ''}`
            });
        }
        CellUri.generateCellOutputUri = generateCellOutputUri;
        function parseCellOutputUri(uri) {
            if (uri.scheme !== network_1.Schemas.vscodeNotebookCellOutput) {
                return;
            }
            const match = /^op([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?\,(.*)$/i.exec(uri.fragment);
            if (!match) {
                return undefined;
            }
            const outputId = (match[1] && match[1] !== '') ? match[1] : undefined;
            const scheme = match[2];
            return {
                outputId,
                notebook: uri.with({
                    scheme: scheme || network_1.Schemas.file,
                    fragment: null
                })
            };
        }
        CellUri.parseCellOutputUri = parseCellOutputUri;
        function generateCellUri(notebook, handle, scheme) {
            return notebook.with({
                scheme: scheme,
                fragment: `ch${handle.toString().padStart(7, '0')}${notebook.scheme !== network_1.Schemas.file ? notebook.scheme : ''}`
            });
        }
        CellUri.generateCellUri = generateCellUri;
        function parseCellUri(metadata, scheme) {
            if (metadata.scheme !== scheme) {
                return undefined;
            }
            const match = _regex.exec(metadata.fragment);
            if (!match) {
                return undefined;
            }
            const handle = Number(match[1]);
            return {
                handle,
                notebook: metadata.with({
                    scheme: metadata.fragment.substring(match[0].length) || network_1.Schemas.file,
                    fragment: null
                })
            };
        }
        CellUri.parseCellUri = parseCellUri;
    })(CellUri = exports.CellUri || (exports.CellUri = {}));
    const normalizeSlashes = (str) => platform_1.isWindows ? str.replace(/\//g, '\\') : str;
    class MimeTypeDisplayOrder {
        constructor(initialValue = [], defaultOrder = exports.NOTEBOOK_DISPLAY_ORDER) {
            this.defaultOrder = defaultOrder;
            this.order = [...new Set(initialValue)].map(pattern => ({
                pattern,
                matches: glob.parse(normalizeSlashes(pattern))
            }));
        }
        /**
         * Returns a sorted array of the input mimetypes.
         */
        sort(mimetypes) {
            const remaining = new Map(iterator_1.Iterable.map(mimetypes, m => [m, normalizeSlashes(m)]));
            let sorted = [];
            for (const { matches } of this.order) {
                for (const [original, normalized] of remaining) {
                    if (matches(normalized)) {
                        sorted.push(original);
                        remaining.delete(original);
                        break;
                    }
                }
            }
            if (remaining.size) {
                sorted = sorted.concat([...remaining.keys()].sort((a, b) => this.defaultOrder.indexOf(a) - this.defaultOrder.indexOf(b)));
            }
            return sorted;
        }
        /**
         * Records that the user selected the given mimetype over the other
         * possible mimetypes, prioritizing it for future reference.
         */
        prioritize(chosenMimetype, otherMimetypes) {
            const chosenIndex = this.findIndex(chosenMimetype);
            if (chosenIndex === -1) {
                // always first, nothing more to do
                this.order.unshift({ pattern: chosenMimetype, matches: glob.parse(normalizeSlashes(chosenMimetype)) });
                return;
            }
            // Get the other mimetypes that are before the chosenMimetype. Then, move
            // them after it, retaining order.
            const uniqueIndicies = new Set(otherMimetypes.map(m => this.findIndex(m, chosenIndex)));
            uniqueIndicies.delete(-1);
            const otherIndices = Array.from(uniqueIndicies).sort();
            this.order.splice(chosenIndex + 1, 0, ...otherIndices.map(i => this.order[i]));
            for (let oi = otherIndices.length - 1; oi >= 0; oi--) {
                this.order.splice(otherIndices[oi], 1);
            }
        }
        /**
         * Gets an array of in-order mimetype preferences.
         */
        toArray() {
            return this.order.map(o => o.pattern);
        }
        findIndex(mimeType, maxIndex = this.order.length) {
            const normalized = normalizeSlashes(mimeType);
            for (let i = 0; i < maxIndex; i++) {
                if (this.order[i].matches(normalized)) {
                    return i;
                }
            }
            return -1;
        }
    }
    exports.MimeTypeDisplayOrder = MimeTypeDisplayOrder;
    function diff(before, after, contains, equal = (a, b) => a === b) {
        const result = [];
        function pushSplice(start, deleteCount, toInsert) {
            if (deleteCount === 0 && toInsert.length === 0) {
                return;
            }
            const latest = result[result.length - 1];
            if (latest && latest.start + latest.deleteCount === start) {
                latest.deleteCount += deleteCount;
                latest.toInsert.push(...toInsert);
            }
            else {
                result.push({ start, deleteCount, toInsert });
            }
        }
        let beforeIdx = 0;
        let afterIdx = 0;
        while (true) {
            if (beforeIdx === before.length) {
                pushSplice(beforeIdx, 0, after.slice(afterIdx));
                break;
            }
            if (afterIdx === after.length) {
                pushSplice(beforeIdx, before.length - beforeIdx, []);
                break;
            }
            const beforeElement = before[beforeIdx];
            const afterElement = after[afterIdx];
            if (equal(beforeElement, afterElement)) {
                // equal
                beforeIdx += 1;
                afterIdx += 1;
                continue;
            }
            if (contains(afterElement)) {
                // `afterElement` exists before, which means some elements before `afterElement` are deleted
                pushSplice(beforeIdx, 1, []);
                beforeIdx += 1;
            }
            else {
                // `afterElement` added
                pushSplice(beforeIdx, 0, [afterElement]);
                afterIdx += 1;
            }
        }
        return result;
    }
    exports.diff = diff;
    exports.NOTEBOOK_EDITOR_CURSOR_BOUNDARY = new contextkey_1.RawContextKey('notebookEditorCursorAtBoundary', 'none');
    var NotebookEditorPriority;
    (function (NotebookEditorPriority) {
        NotebookEditorPriority["default"] = "default";
        NotebookEditorPriority["option"] = "option";
    })(NotebookEditorPriority = exports.NotebookEditorPriority || (exports.NotebookEditorPriority = {}));
    //TODO@rebornix test
    function isDocumentExcludePattern(filenamePattern) {
        const arg = filenamePattern;
        if ((typeof arg.include === 'string' || glob.isRelativePattern(arg.include))
            && (typeof arg.exclude === 'string' || glob.isRelativePattern(arg.exclude))) {
            return true;
        }
        return false;
    }
    exports.isDocumentExcludePattern = isDocumentExcludePattern;
    function notebookDocumentFilterMatch(filter, viewType, resource) {
        if (Array.isArray(filter.viewType) && filter.viewType.indexOf(viewType) >= 0) {
            return true;
        }
        if (filter.viewType === viewType) {
            return true;
        }
        if (filter.filenamePattern) {
            const filenamePattern = isDocumentExcludePattern(filter.filenamePattern) ? filter.filenamePattern.include : filter.filenamePattern;
            const excludeFilenamePattern = isDocumentExcludePattern(filter.filenamePattern) ? filter.filenamePattern.exclude : undefined;
            if (glob.match(filenamePattern, (0, path_1.basename)(resource.fsPath).toLowerCase())) {
                if (excludeFilenamePattern) {
                    if (glob.match(excludeFilenamePattern, (0, path_1.basename)(resource.fsPath).toLowerCase())) {
                        // should exclude
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    }
    exports.notebookDocumentFilterMatch = notebookDocumentFilterMatch;
    exports.NotebookSetting = {
        displayOrder: 'notebook.displayOrder',
        cellToolbarLocation: 'notebook.cellToolbarLocation',
        cellToolbarVisibility: 'notebook.cellToolbarVisibility',
        showCellStatusBar: 'notebook.showCellStatusBar',
        textDiffEditorPreview: 'notebook.diff.enablePreview',
        experimentalInsertToolbarAlignment: 'notebook.experimental.insertToolbarAlignment',
        compactView: 'notebook.compactView',
        focusIndicator: 'notebook.cellFocusIndicator',
        insertToolbarLocation: 'notebook.insertToolbarLocation',
        globalToolbar: 'notebook.globalToolbar',
        undoRedoPerCell: 'notebook.undoRedoPerCell',
        consolidatedOutputButton: 'notebook.consolidatedOutputButton',
        showFoldingControls: 'notebook.showFoldingControls',
        dragAndDropEnabled: 'notebook.dragAndDropEnabled',
        cellEditorOptionsCustomizations: 'notebook.editorOptionsCustomizations',
        consolidatedRunButton: 'notebook.consolidatedRunButton',
        openGettingStarted: 'notebook.experimental.openGettingStarted',
        textOutputLineLimit: 'notebook.output.textLineLimit',
        globalToolbarShowLabel: 'notebook.globalToolbarShowLabel',
        markupFontSize: 'notebook.markup.fontSize',
        interactiveWindowCollapseCodeCells: 'interactiveWindow.collapseCellInputCode',
        outputLineHeight: 'notebook.outputLineHeight',
        outputFontSize: 'notebook.outputFontSize',
        outputFontFamily: 'notebook.outputFontFamily'
    };
    var CellStatusbarAlignment;
    (function (CellStatusbarAlignment) {
        CellStatusbarAlignment[CellStatusbarAlignment["Left"] = 1] = "Left";
        CellStatusbarAlignment[CellStatusbarAlignment["Right"] = 2] = "Right";
    })(CellStatusbarAlignment = exports.CellStatusbarAlignment || (exports.CellStatusbarAlignment = {}));
    class NotebookWorkingCopyTypeIdentifier {
        static create(viewType) {
            return `${NotebookWorkingCopyTypeIdentifier._prefix}${viewType}`;
        }
        static parse(candidate) {
            if (candidate.startsWith(NotebookWorkingCopyTypeIdentifier._prefix)) {
                return candidate.substring(NotebookWorkingCopyTypeIdentifier._prefix.length);
            }
            return undefined;
        }
    }
    exports.NotebookWorkingCopyTypeIdentifier = NotebookWorkingCopyTypeIdentifier;
    NotebookWorkingCopyTypeIdentifier._prefix = 'notebook/';
});
//# sourceMappingURL=notebookCommon.js.map