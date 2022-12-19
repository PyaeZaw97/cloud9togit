/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/keybindings", "vs/editor/contrib/codeAction/browser/codeAction", "vs/editor/contrib/codeAction/browser/codeActionMenu", "vs/editor/contrib/codeAction/browser/types", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keybinding/common/usLayoutResolvedKeybinding"], function (require, exports, assert, keybindings_1, codeAction_1, codeActionMenu_1, types_1, resolvedKeybindingItem_1, usLayoutResolvedKeybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('CodeActionKeybindingResolver', () => {
        const refactorKeybinding = createCodeActionKeybinding(31 /* KeyCode.KeyA */, codeAction_1.refactorCommandId, { kind: types_1.CodeActionKind.Refactor.value });
        const refactorExtractKeybinding = createCodeActionKeybinding(32 /* KeyCode.KeyB */, codeAction_1.refactorCommandId, { kind: types_1.CodeActionKind.Refactor.append('extract').value });
        const organizeImportsKeybinding = createCodeActionKeybinding(33 /* KeyCode.KeyC */, codeAction_1.organizeImportsCommandId, undefined);
        test('Should match refactor keybindings', async function () {
            const resolver = new codeActionMenu_1.CodeActionKeybindingResolver({
                getKeybindings: () => {
                    return [refactorKeybinding];
                },
            }).getResolver();
            assert.strictEqual(resolver({ title: '' }), undefined);
            assert.strictEqual(resolver({ title: '', kind: types_1.CodeActionKind.Refactor.value }), refactorKeybinding.resolvedKeybinding);
            assert.strictEqual(resolver({ title: '', kind: types_1.CodeActionKind.Refactor.append('extract').value }), refactorKeybinding.resolvedKeybinding);
            assert.strictEqual(resolver({ title: '', kind: types_1.CodeActionKind.QuickFix.value }), undefined);
        });
        test('Should prefer most specific keybinding', async function () {
            const resolver = new codeActionMenu_1.CodeActionKeybindingResolver({
                getKeybindings: () => {
                    return [refactorKeybinding, refactorExtractKeybinding, organizeImportsKeybinding];
                },
            }).getResolver();
            assert.strictEqual(resolver({ title: '', kind: types_1.CodeActionKind.Refactor.value }), refactorKeybinding.resolvedKeybinding);
            assert.strictEqual(resolver({ title: '', kind: types_1.CodeActionKind.Refactor.append('extract').value }), refactorExtractKeybinding.resolvedKeybinding);
        });
        test('Organize imports should still return a keybinding even though it does not have args', async function () {
            const resolver = new codeActionMenu_1.CodeActionKeybindingResolver({
                getKeybindings: () => {
                    return [refactorKeybinding, refactorExtractKeybinding, organizeImportsKeybinding];
                },
            }).getResolver();
            assert.strictEqual(resolver({ title: '', kind: types_1.CodeActionKind.SourceOrganizeImports.value }), organizeImportsKeybinding.resolvedKeybinding);
        });
    });
    function createCodeActionKeybinding(keycode, command, commandArgs) {
        return new resolvedKeybindingItem_1.ResolvedKeybindingItem(new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(new keybindings_1.ChordKeybinding([new keybindings_1.SimpleKeybinding(false, true, false, false, keycode)]), 3 /* OperatingSystem.Linux */), command, commandArgs, undefined, false, null, false);
    }
});
//# sourceMappingURL=codeActionKeybindingResolver.test.js.map