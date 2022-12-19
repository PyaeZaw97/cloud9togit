/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/model/textModel"], function (require, exports, lifecycle_1, textModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentThreadRangeDecorator = void 0;
    class CommentThreadRangeDecoration {
        constructor(range, options) {
            this.range = range;
            this.options = options;
        }
        get id() {
            return this._decorationId;
        }
        set id(id) {
            this._decorationId = id;
        }
    }
    class CommentThreadRangeDecorator extends lifecycle_1.Disposable {
        constructor(commentService) {
            super();
            this.decorationIds = [];
            this.activeDecorationIds = [];
            const decorationOptions = {
                description: CommentThreadRangeDecorator.description,
                isWholeLine: false,
                zIndex: 20,
                className: 'comment-thread-range'
            };
            this.decorationOptions = textModel_1.ModelDecorationOptions.createDynamic(decorationOptions);
            const activeDecorationOptions = {
                description: CommentThreadRangeDecorator.description,
                isWholeLine: false,
                zIndex: 20,
                className: 'comment-thread-range-current'
            };
            this.activeDecorationOptions = textModel_1.ModelDecorationOptions.createDynamic(activeDecorationOptions);
            this._register(commentService.onDidChangeCurrentCommentThread(thread => {
                if (!this.editor) {
                    return;
                }
                let newDecoration = [];
                if (thread) {
                    const range = thread.range;
                    if (!((range.startLineNumber === range.endLineNumber) && (range.startColumn === range.endColumn))) {
                        newDecoration.push(new CommentThreadRangeDecoration(range, this.activeDecorationOptions));
                    }
                }
                this.activeDecorationIds = this.editor.deltaDecorations(this.activeDecorationIds, newDecoration);
                newDecoration.forEach((decoration, index) => decoration.id = this.decorationIds[index]);
            }));
        }
        update(editor, commentInfos) {
            const model = editor.getModel();
            if (!model) {
                return;
            }
            this.editor = editor;
            const commentThreadRangeDecorations = [];
            for (const info of commentInfos) {
                info.threads.forEach(thread => {
                    if (thread.isDisposed) {
                        return;
                    }
                    const range = thread.range;
                    // We only want to show a range decoration when there's the range spans either multiple lines
                    // or, when is spans multiple characters on the sample line
                    if ((range.startLineNumber === range.endLineNumber) && (range.startColumn === range.endColumn)) {
                        return;
                    }
                    commentThreadRangeDecorations.push(new CommentThreadRangeDecoration(range, this.decorationOptions));
                });
            }
            this.decorationIds = editor.deltaDecorations(this.decorationIds, commentThreadRangeDecorations);
            commentThreadRangeDecorations.forEach((decoration, index) => decoration.id = this.decorationIds[index]);
        }
    }
    exports.CommentThreadRangeDecorator = CommentThreadRangeDecorator;
    CommentThreadRangeDecorator.description = 'comment-thread-range-decorator';
});
//# sourceMappingURL=commentThreadRangeDecorator.js.map