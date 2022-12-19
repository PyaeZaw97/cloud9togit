/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/services/editorWorker", "vs/editor/common/services/resolverService", "vs/editor/contrib/format/browser/format", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/workbench/contrib/scm/browser/dirtydiffDecorator", "vs/workbench/contrib/scm/common/scm"], function (require, exports, arrays_1, cancellation_1, editorExtensions_1, range_1, editorContextKeys_1, editorWorker_1, resolverService_1, format_1, nls, contextkey_1, instantiation_1, progress_1, dirtydiffDecorator_1, scm_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getModifiedRanges = void 0;
    (0, editorExtensions_1.registerEditorAction)(class FormatModifiedAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.formatChanges',
                label: nls.localize('formatChanges', "Format Modified Lines"),
                alias: 'Format Modified Lines',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasDocumentSelectionFormattingProvider),
            });
        }
        async run(accessor, editor) {
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            if (!editor.hasModel()) {
                return;
            }
            const ranges = await instaService.invokeFunction(getModifiedRanges, editor.getModel());
            if ((0, arrays_1.isNonEmptyArray)(ranges)) {
                return instaService.invokeFunction(format_1.formatDocumentRangesWithSelectedProvider, editor, ranges, 1 /* FormattingMode.Explicit */, progress_1.Progress.None, cancellation_1.CancellationToken.None);
            }
        }
    });
    async function getModifiedRanges(accessor, modified) {
        const scmService = accessor.get(scm_1.ISCMService);
        const workerService = accessor.get(editorWorker_1.IEditorWorkerService);
        const modelService = accessor.get(resolverService_1.ITextModelService);
        const original = await (0, dirtydiffDecorator_1.getOriginalResource)(scmService, modified.uri);
        if (!original) {
            return null; // let undefined signify no changes, null represents no source control (there's probably a better way, but I can't think of one rn)
        }
        const ranges = [];
        const ref = await modelService.createModelReference(original);
        try {
            if (!workerService.canComputeDirtyDiff(original, modified.uri)) {
                return undefined;
            }
            const changes = await workerService.computeDirtyDiff(original, modified.uri, false);
            if (!(0, arrays_1.isNonEmptyArray)(changes)) {
                return undefined;
            }
            for (let change of changes) {
                ranges.push(modified.validateRange(new range_1.Range(change.modifiedStartLineNumber, 1, change.modifiedEndLineNumber || change.modifiedStartLineNumber /*endLineNumber is 0 when things got deleted*/, Number.MAX_SAFE_INTEGER)));
            }
        }
        finally {
            ref.dispose();
        }
        return ranges;
    }
    exports.getModifiedRanges = getModifiedRanges;
});
//# sourceMappingURL=formatModified.js.map