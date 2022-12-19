/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/editor/common/model/textModel", "vs/nls", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService"], function (require, exports, codicons_1, textModel_1, nls_1, iconRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FoldingDecorationProvider = exports.foldingCollapsedIcon = exports.foldingExpandedIcon = void 0;
    exports.foldingExpandedIcon = (0, iconRegistry_1.registerIcon)('folding-expanded', codicons_1.Codicon.chevronDown, (0, nls_1.localize)('foldingExpandedIcon', 'Icon for expanded ranges in the editor glyph margin.'));
    exports.foldingCollapsedIcon = (0, iconRegistry_1.registerIcon)('folding-collapsed', codicons_1.Codicon.chevronRight, (0, nls_1.localize)('foldingCollapsedIcon', 'Icon for collapsed ranges in the editor glyph margin.'));
    class FoldingDecorationProvider {
        constructor(editor) {
            this.editor = editor;
            this.autoHideFoldingControls = true;
            this.showFoldingHighlights = true;
        }
        getDecorationOption(isCollapsed, isHidden) {
            if (isHidden) {
                return FoldingDecorationProvider.HIDDEN_RANGE_DECORATION;
            }
            if (isCollapsed) {
                return this.showFoldingHighlights ? FoldingDecorationProvider.COLLAPSED_HIGHLIGHTED_VISUAL_DECORATION : FoldingDecorationProvider.COLLAPSED_VISUAL_DECORATION;
            }
            else if (this.autoHideFoldingControls) {
                return FoldingDecorationProvider.EXPANDED_AUTO_HIDE_VISUAL_DECORATION;
            }
            else {
                return FoldingDecorationProvider.EXPANDED_VISUAL_DECORATION;
            }
        }
        deltaDecorations(oldDecorations, newDecorations) {
            return this.editor.deltaDecorations(oldDecorations, newDecorations);
        }
        changeDecorations(callback) {
            return this.editor.changeDecorations(callback);
        }
    }
    exports.FoldingDecorationProvider = FoldingDecorationProvider;
    FoldingDecorationProvider.COLLAPSED_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
        description: 'folding-collapsed-visual-decoration',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
        afterContentClassName: 'inline-folded',
        isWholeLine: true,
        firstLineDecorationClassName: themeService_1.ThemeIcon.asClassName(exports.foldingCollapsedIcon)
    });
    FoldingDecorationProvider.COLLAPSED_HIGHLIGHTED_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
        description: 'folding-collapsed-highlighted-visual-decoration',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
        afterContentClassName: 'inline-folded',
        className: 'folded-background',
        isWholeLine: true,
        firstLineDecorationClassName: themeService_1.ThemeIcon.asClassName(exports.foldingCollapsedIcon)
    });
    FoldingDecorationProvider.EXPANDED_AUTO_HIDE_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
        description: 'folding-expanded-auto-hide-visual-decoration',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
        isWholeLine: true,
        firstLineDecorationClassName: themeService_1.ThemeIcon.asClassName(exports.foldingExpandedIcon)
    });
    FoldingDecorationProvider.EXPANDED_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
        description: 'folding-expanded-visual-decoration',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
        isWholeLine: true,
        firstLineDecorationClassName: 'alwaysShowFoldIcons ' + themeService_1.ThemeIcon.asClassName(exports.foldingExpandedIcon)
    });
    FoldingDecorationProvider.HIDDEN_RANGE_DECORATION = textModel_1.ModelDecorationOptions.register({
        description: 'folding-hidden-range-decoration',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */
    });
});
//# sourceMappingURL=foldingDecorations.js.map