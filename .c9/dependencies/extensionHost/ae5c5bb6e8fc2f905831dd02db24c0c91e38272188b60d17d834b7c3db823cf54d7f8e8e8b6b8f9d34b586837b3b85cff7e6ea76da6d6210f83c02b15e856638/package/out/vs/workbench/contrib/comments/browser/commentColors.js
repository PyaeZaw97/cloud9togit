/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/languages", "vs/editor/contrib/peekView/browser/peekView", "vs/nls", "vs/platform/theme/common/colorRegistry"], function (require, exports, languages, peekView_1, nls, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getCommentThreadStateColor = exports.commentThreadStateBackgroundColorVar = exports.commentViewThreadStateColorVar = exports.commentThreadStateColorVar = exports.commentThreadRangeActiveBorder = exports.commentThreadRangeActiveBackground = exports.commentThreadRangeBorder = exports.commentThreadRangeBackground = void 0;
    const resolvedCommentBorder = (0, colorRegistry_1.registerColor)('editorCommentsWidget.resolvedBorder', { dark: colorRegistry_1.disabledForeground, light: colorRegistry_1.disabledForeground, hcDark: colorRegistry_1.contrastBorder, hcLight: colorRegistry_1.contrastBorder }, nls.localize('resolvedCommentBorder', 'Color of borders and arrow for resolved comments.'));
    const unresolvedCommentBorder = (0, colorRegistry_1.registerColor)('editorCommentsWidget.unresolvedBorder', { dark: peekView_1.peekViewBorder, light: peekView_1.peekViewBorder, hcDark: colorRegistry_1.contrastBorder, hcLight: colorRegistry_1.contrastBorder }, nls.localize('unresolvedCommentBorder', 'Color of borders and arrow for unresolved comments.'));
    exports.commentThreadRangeBackground = (0, colorRegistry_1.registerColor)('editorCommentsWidget.rangeBackground', { dark: (0, colorRegistry_1.transparent)(unresolvedCommentBorder, .1), light: (0, colorRegistry_1.transparent)(unresolvedCommentBorder, .1), hcDark: (0, colorRegistry_1.transparent)(unresolvedCommentBorder, .1), hcLight: (0, colorRegistry_1.transparent)(unresolvedCommentBorder, .1) }, nls.localize('commentThreadRangeBackground', 'Color of background for comment ranges.'));
    exports.commentThreadRangeBorder = (0, colorRegistry_1.registerColor)('editorCommentsWidget.rangeBorder', { dark: (0, colorRegistry_1.transparent)(unresolvedCommentBorder, .4), light: (0, colorRegistry_1.transparent)(unresolvedCommentBorder, .4), hcDark: (0, colorRegistry_1.transparent)(unresolvedCommentBorder, .4), hcLight: (0, colorRegistry_1.transparent)(unresolvedCommentBorder, .4) }, nls.localize('commentThreadRangeBorder', 'Color of border for comment ranges.'));
    exports.commentThreadRangeActiveBackground = (0, colorRegistry_1.registerColor)('editorCommentsWidget.rangeActiveBackground', { dark: (0, colorRegistry_1.transparent)(unresolvedCommentBorder, .1), light: (0, colorRegistry_1.transparent)(unresolvedCommentBorder, .1), hcDark: (0, colorRegistry_1.transparent)(unresolvedCommentBorder, .1), hcLight: (0, colorRegistry_1.transparent)(unresolvedCommentBorder, .1) }, nls.localize('commentThreadActiveRangeBackground', 'Color of background for currently selected or hovered comment range.'));
    exports.commentThreadRangeActiveBorder = (0, colorRegistry_1.registerColor)('editorCommentsWidget.rangeActiveBorder', { dark: (0, colorRegistry_1.transparent)(unresolvedCommentBorder, .4), light: (0, colorRegistry_1.transparent)(unresolvedCommentBorder, .4), hcDark: (0, colorRegistry_1.transparent)(unresolvedCommentBorder, .4), hcLight: (0, colorRegistry_1.transparent)(unresolvedCommentBorder, .2) }, nls.localize('commentThreadActiveRangeBorder', 'Color of border for currently selected or hovered comment range.'));
    const commentThreadStateColors = new Map([
        [languages.CommentThreadState.Unresolved, unresolvedCommentBorder],
        [languages.CommentThreadState.Resolved, resolvedCommentBorder],
    ]);
    exports.commentThreadStateColorVar = '--comment-thread-state-color';
    exports.commentViewThreadStateColorVar = '--comment-view-thread-state-color';
    exports.commentThreadStateBackgroundColorVar = '--comment-thread-state-background-color';
    function getCommentThreadStateColor(state, theme) {
        const colorId = (state !== undefined) ? commentThreadStateColors.get(state) : undefined;
        return (colorId !== undefined) ? theme.getColor(colorId) : undefined;
    }
    exports.getCommentThreadStateColor = getCommentThreadStateColor;
});
//# sourceMappingURL=commentColors.js.map