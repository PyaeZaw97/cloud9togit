/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/cursor/cursorWordOperations", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/contrib/wordOperations/browser/wordOperations", "vs/platform/commands/common/commands"], function (require, exports, editorExtensions_1, cursorWordOperations_1, range_1, editorContextKeys_1, wordOperations_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CursorWordPartRightSelect = exports.CursorWordPartRight = exports.WordPartRightCommand = exports.CursorWordPartLeftSelect = exports.CursorWordPartLeft = exports.WordPartLeftCommand = exports.DeleteWordPartRight = exports.DeleteWordPartLeft = void 0;
    class DeleteWordPartLeft extends wordOperations_1.DeleteWordCommand {
        constructor() {
            super({
                whitespaceHeuristics: true,
                wordNavigationType: 0 /* WordNavigationType.WordStart */,
                id: 'deleteWordPartLeft',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 1 /* KeyCode.Backspace */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        _delete(ctx, wordNavigationType) {
            let r = cursorWordOperations_1.WordPartOperations.deleteWordPartLeft(ctx);
            if (r) {
                return r;
            }
            return new range_1.Range(1, 1, 1, 1);
        }
    }
    exports.DeleteWordPartLeft = DeleteWordPartLeft;
    class DeleteWordPartRight extends wordOperations_1.DeleteWordCommand {
        constructor() {
            super({
                whitespaceHeuristics: true,
                wordNavigationType: 2 /* WordNavigationType.WordEnd */,
                id: 'deleteWordPartRight',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 20 /* KeyCode.Delete */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        _delete(ctx, wordNavigationType) {
            let r = cursorWordOperations_1.WordPartOperations.deleteWordPartRight(ctx);
            if (r) {
                return r;
            }
            const lineCount = ctx.model.getLineCount();
            const maxColumn = ctx.model.getLineMaxColumn(lineCount);
            return new range_1.Range(lineCount, maxColumn, lineCount, maxColumn);
        }
    }
    exports.DeleteWordPartRight = DeleteWordPartRight;
    class WordPartLeftCommand extends wordOperations_1.MoveWordCommand {
        _move(wordSeparators, model, position, wordNavigationType) {
            return cursorWordOperations_1.WordPartOperations.moveWordPartLeft(wordSeparators, model, position);
        }
    }
    exports.WordPartLeftCommand = WordPartLeftCommand;
    class CursorWordPartLeft extends WordPartLeftCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 0 /* WordNavigationType.WordStart */,
                id: 'cursorWordPartLeft',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    exports.CursorWordPartLeft = CursorWordPartLeft;
    // Register previous id for compatibility purposes
    commands_1.CommandsRegistry.registerCommandAlias('cursorWordPartStartLeft', 'cursorWordPartLeft');
    class CursorWordPartLeftSelect extends WordPartLeftCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 0 /* WordNavigationType.WordStart */,
                id: 'cursorWordPartLeftSelect',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    exports.CursorWordPartLeftSelect = CursorWordPartLeftSelect;
    // Register previous id for compatibility purposes
    commands_1.CommandsRegistry.registerCommandAlias('cursorWordPartStartLeftSelect', 'cursorWordPartLeftSelect');
    class WordPartRightCommand extends wordOperations_1.MoveWordCommand {
        _move(wordSeparators, model, position, wordNavigationType) {
            return cursorWordOperations_1.WordPartOperations.moveWordPartRight(wordSeparators, model, position);
        }
    }
    exports.WordPartRightCommand = WordPartRightCommand;
    class CursorWordPartRight extends WordPartRightCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 2 /* WordNavigationType.WordEnd */,
                id: 'cursorWordPartRight',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    exports.CursorWordPartRight = CursorWordPartRight;
    class CursorWordPartRightSelect extends WordPartRightCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 2 /* WordNavigationType.WordEnd */,
                id: 'cursorWordPartRightSelect',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    exports.CursorWordPartRightSelect = CursorWordPartRightSelect;
    (0, editorExtensions_1.registerEditorCommand)(new DeleteWordPartLeft());
    (0, editorExtensions_1.registerEditorCommand)(new DeleteWordPartRight());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordPartLeft());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordPartLeftSelect());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordPartRight());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordPartRightSelect());
});
//# sourceMappingURL=wordPartOperations.js.map