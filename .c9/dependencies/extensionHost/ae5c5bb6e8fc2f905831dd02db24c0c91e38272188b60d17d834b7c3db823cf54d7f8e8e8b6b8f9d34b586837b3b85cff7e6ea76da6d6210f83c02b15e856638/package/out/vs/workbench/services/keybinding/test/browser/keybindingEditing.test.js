/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/json", "vs/base/common/keybindings", "vs/base/common/platform", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/platform/log/common/log", "vs/workbench/services/keybinding/common/keybindingEditing", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/files/common/fileService", "vs/base/common/network", "vs/base/common/uri", "vs/platform/userData/common/fileUserDataProvider", "vs/platform/configuration/test/common/testConfigurationService", "vs/base/common/resources", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/base/common/lifecycle", "vs/base/common/buffer"], function (require, exports, assert, json, keybindings_1, platform_1, contextkey_1, resolvedKeybindingItem_1, usLayoutResolvedKeybinding_1, log_1, keybindingEditing_1, textfiles_1, workbenchTestServices_1, fileService_1, network_1, uri_1, fileUserDataProvider_1, testConfigurationService_1, resources_1, inMemoryFilesystemProvider_1, lifecycle_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ROOT = uri_1.URI.file('tests').with({ scheme: 'vscode-tests' });
    suite('KeybindingsEditing', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let instantiationService;
        let fileService;
        let environmentService;
        let testObject;
        setup(async () => {
            environmentService = workbenchTestServices_1.TestEnvironmentService;
            const logService = new log_1.NullLogService();
            fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(ROOT.scheme, fileSystemProvider));
            disposables.add(fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, new log_1.NullLogService()))));
            const userFolder = (0, resources_1.joinPath)(ROOT, 'User');
            await fileService.createFolder(userFolder);
            const configService = new testConfigurationService_1.TestConfigurationService();
            configService.setUserConfiguration('files', { 'eol': '\n' });
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)({
                fileService: () => fileService,
                configurationService: () => configService,
                environmentService: () => environmentService
            }, disposables);
            testObject = disposables.add(instantiationService.createInstance(keybindingEditing_1.KeybindingsEditingService));
        });
        teardown(() => disposables.clear());
        test('errors cases - parse errors', async () => {
            await fileService.writeFile(environmentService.keybindingsResource, buffer_1.VSBuffer.fromString(',,,,,,,,,,,,,,'));
            try {
                await testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* KeyCode.Escape */ } }), 'alt+c', undefined);
                assert.fail('Should fail with parse errors');
            }
            catch (error) {
                assert.strictEqual(error.message, 'Unable to write to the keybindings configuration file. Please open it to correct errors/warnings in the file and try again.');
            }
        });
        test('errors cases - parse errors 2', async () => {
            await fileService.writeFile(environmentService.keybindingsResource, buffer_1.VSBuffer.fromString('[{"key": }]'));
            try {
                await testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* KeyCode.Escape */ } }), 'alt+c', undefined);
                assert.fail('Should fail with parse errors');
            }
            catch (error) {
                assert.strictEqual(error.message, 'Unable to write to the keybindings configuration file. Please open it to correct errors/warnings in the file and try again.');
            }
        });
        test('errors cases - dirty', () => {
            instantiationService.stub(textfiles_1.ITextFileService, 'isDirty', true);
            return testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* KeyCode.Escape */ } }), 'alt+c', undefined)
                .then(() => assert.fail('Should fail with dirty error'), error => assert.strictEqual(error.message, 'Unable to write because the keybindings configuration file has unsaved changes. Please save it first and then try again.'));
        });
        test('errors cases - did not find an array', async () => {
            await fileService.writeFile(environmentService.keybindingsResource, buffer_1.VSBuffer.fromString('{"key": "alt+c", "command": "hello"}'));
            try {
                await testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* KeyCode.Escape */ } }), 'alt+c', undefined);
                assert.fail('Should fail');
            }
            catch (error) {
                assert.strictEqual(error.message, 'Unable to write to the keybindings configuration file. It has an object which is not of type Array. Please open the file to clean up and try again.');
            }
        });
        test('edit a default keybinding to an empty file', async () => {
            await fileService.writeFile(environmentService.keybindingsResource, buffer_1.VSBuffer.fromString(''));
            const expected = [{ key: 'alt+c', command: 'a' }, { key: 'escape', command: '-a' }];
            await testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* KeyCode.Escape */ }, command: 'a' }), 'alt+c', undefined);
            assert.deepStrictEqual(await getUserKeybindings(), expected);
        });
        test('edit a default keybinding to an empty array', async () => {
            await writeToKeybindingsFile();
            const expected = [{ key: 'alt+c', command: 'a' }, { key: 'escape', command: '-a' }];
            await testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* KeyCode.Escape */ }, command: 'a' }), 'alt+c', undefined);
            return assert.deepStrictEqual(await getUserKeybindings(), expected);
        });
        test('edit a default keybinding in an existing array', async () => {
            await writeToKeybindingsFile({ command: 'b', key: 'shift+c' });
            const expected = [{ key: 'shift+c', command: 'b' }, { key: 'alt+c', command: 'a' }, { key: 'escape', command: '-a' }];
            await testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* KeyCode.Escape */ }, command: 'a' }), 'alt+c', undefined);
            return assert.deepStrictEqual(await getUserKeybindings(), expected);
        });
        test('add another keybinding', async () => {
            const expected = [{ key: 'alt+c', command: 'a' }];
            await testObject.addKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* KeyCode.Escape */ }, command: 'a' }), 'alt+c', undefined);
            return assert.deepStrictEqual(await getUserKeybindings(), expected);
        });
        test('add a new default keybinding', async () => {
            const expected = [{ key: 'alt+c', command: 'a' }];
            await testObject.addKeybinding(aResolvedKeybindingItem({ command: 'a' }), 'alt+c', undefined);
            return assert.deepStrictEqual(await getUserKeybindings(), expected);
        });
        test('add a new default keybinding using edit', async () => {
            const expected = [{ key: 'alt+c', command: 'a' }];
            await testObject.editKeybinding(aResolvedKeybindingItem({ command: 'a' }), 'alt+c', undefined);
            assert.deepStrictEqual(await getUserKeybindings(), expected);
        });
        test('edit an user keybinding', async () => {
            await writeToKeybindingsFile({ key: 'escape', command: 'b' });
            const expected = [{ key: 'alt+c', command: 'b' }];
            await testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* KeyCode.Escape */ }, command: 'b', isDefault: false }), 'alt+c', undefined);
            assert.deepStrictEqual(await getUserKeybindings(), expected);
        });
        test('edit an user keybinding with more than one element', async () => {
            await writeToKeybindingsFile({ key: 'escape', command: 'b' }, { key: 'alt+shift+g', command: 'c' });
            const expected = [{ key: 'alt+c', command: 'b' }, { key: 'alt+shift+g', command: 'c' }];
            await testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* KeyCode.Escape */ }, command: 'b', isDefault: false }), 'alt+c', undefined);
            assert.deepStrictEqual(await getUserKeybindings(), expected);
        });
        test('remove a default keybinding', async () => {
            const expected = [{ key: 'alt+c', command: '-a' }];
            await testObject.removeKeybinding(aResolvedKeybindingItem({ command: 'a', firstPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { altKey: true } } }));
            assert.deepStrictEqual(await getUserKeybindings(), expected);
        });
        test('remove a default keybinding should not ad duplicate entries', async () => {
            const expected = [{ key: 'alt+c', command: '-a' }];
            await testObject.removeKeybinding(aResolvedKeybindingItem({ command: 'a', firstPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { altKey: true } } }));
            await testObject.removeKeybinding(aResolvedKeybindingItem({ command: 'a', firstPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { altKey: true } } }));
            await testObject.removeKeybinding(aResolvedKeybindingItem({ command: 'a', firstPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { altKey: true } } }));
            await testObject.removeKeybinding(aResolvedKeybindingItem({ command: 'a', firstPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { altKey: true } } }));
            await testObject.removeKeybinding(aResolvedKeybindingItem({ command: 'a', firstPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { altKey: true } } }));
            assert.deepStrictEqual(await getUserKeybindings(), expected);
        });
        test('remove a user keybinding', async () => {
            await writeToKeybindingsFile({ key: 'alt+c', command: 'b' });
            await testObject.removeKeybinding(aResolvedKeybindingItem({ command: 'b', firstPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { altKey: true } }, isDefault: false }));
            assert.deepStrictEqual(await getUserKeybindings(), []);
        });
        test('reset an edited keybinding', async () => {
            await writeToKeybindingsFile({ key: 'alt+c', command: 'b' });
            await testObject.resetKeybinding(aResolvedKeybindingItem({ command: 'b', firstPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { altKey: true } }, isDefault: false }));
            assert.deepStrictEqual(await getUserKeybindings(), []);
        });
        test('reset a removed keybinding', async () => {
            await writeToKeybindingsFile({ key: 'alt+c', command: '-b' });
            await testObject.resetKeybinding(aResolvedKeybindingItem({ command: 'b', isDefault: false }));
            assert.deepStrictEqual(await getUserKeybindings(), []);
        });
        test('reset multiple removed keybindings', async () => {
            await writeToKeybindingsFile({ key: 'alt+c', command: '-b' });
            await writeToKeybindingsFile({ key: 'alt+shift+c', command: '-b' });
            await writeToKeybindingsFile({ key: 'escape', command: '-b' });
            await testObject.resetKeybinding(aResolvedKeybindingItem({ command: 'b', isDefault: false }));
            assert.deepStrictEqual(await getUserKeybindings(), []);
        });
        test('add a new keybinding to unassigned keybinding', async () => {
            await writeToKeybindingsFile({ key: 'alt+c', command: '-a' });
            const expected = [{ key: 'alt+c', command: '-a' }, { key: 'shift+alt+c', command: 'a' }];
            await testObject.editKeybinding(aResolvedKeybindingItem({ command: 'a', isDefault: false }), 'shift+alt+c', undefined);
            assert.deepStrictEqual(await getUserKeybindings(), expected);
        });
        test('add when expression', async () => {
            await writeToKeybindingsFile({ key: 'alt+c', command: '-a' });
            const expected = [{ key: 'alt+c', command: '-a' }, { key: 'shift+alt+c', command: 'a', when: 'editorTextFocus' }];
            await testObject.editKeybinding(aResolvedKeybindingItem({ command: 'a', isDefault: false }), 'shift+alt+c', 'editorTextFocus');
            assert.deepStrictEqual(await getUserKeybindings(), expected);
        });
        test('update command and when expression', async () => {
            await writeToKeybindingsFile({ key: 'alt+c', command: '-a', when: 'editorTextFocus && !editorReadonly' });
            const expected = [{ key: 'alt+c', command: '-a', when: 'editorTextFocus && !editorReadonly' }, { key: 'shift+alt+c', command: 'a', when: 'editorTextFocus' }];
            await testObject.editKeybinding(aResolvedKeybindingItem({ command: 'a', isDefault: false }), 'shift+alt+c', 'editorTextFocus');
            assert.deepStrictEqual(await getUserKeybindings(), expected);
        });
        test('update when expression', async () => {
            await writeToKeybindingsFile({ key: 'alt+c', command: '-a', when: 'editorTextFocus && !editorReadonly' }, { key: 'shift+alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' });
            const expected = [{ key: 'alt+c', command: '-a', when: 'editorTextFocus && !editorReadonly' }, { key: 'shift+alt+c', command: 'a', when: 'editorTextFocus' }];
            await testObject.editKeybinding(aResolvedKeybindingItem({ command: 'a', isDefault: false, when: 'editorTextFocus && !editorReadonly' }), 'shift+alt+c', 'editorTextFocus');
            assert.deepStrictEqual(await getUserKeybindings(), expected);
        });
        test('remove when expression', async () => {
            await writeToKeybindingsFile({ key: 'alt+c', command: '-a', when: 'editorTextFocus && !editorReadonly' });
            const expected = [{ key: 'alt+c', command: '-a', when: 'editorTextFocus && !editorReadonly' }, { key: 'shift+alt+c', command: 'a' }];
            await testObject.editKeybinding(aResolvedKeybindingItem({ command: 'a', isDefault: false }), 'shift+alt+c', undefined);
            assert.deepStrictEqual(await getUserKeybindings(), expected);
        });
        async function writeToKeybindingsFile(...keybindings) {
            await fileService.writeFile(environmentService.keybindingsResource, buffer_1.VSBuffer.fromString(JSON.stringify(keybindings || [])));
        }
        async function getUserKeybindings() {
            return json.parse((await fileService.readFile(environmentService.keybindingsResource)).value.toString());
        }
        function aResolvedKeybindingItem({ command, when, isDefault, firstPart, chordPart }) {
            const aSimpleKeybinding = function (part) {
                const { ctrlKey, shiftKey, altKey, metaKey } = part.modifiers || { ctrlKey: false, shiftKey: false, altKey: false, metaKey: false };
                return new keybindings_1.SimpleKeybinding(ctrlKey, shiftKey, altKey, metaKey, part.keyCode);
            };
            let parts = [];
            if (firstPart) {
                parts.push(aSimpleKeybinding(firstPart));
                if (chordPart) {
                    parts.push(aSimpleKeybinding(chordPart));
                }
            }
            const keybinding = parts.length > 0 ? new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(new keybindings_1.ChordKeybinding(parts), platform_1.OS) : undefined;
            return new resolvedKeybindingItem_1.ResolvedKeybindingItem(keybinding, command || 'some command', null, when ? contextkey_1.ContextKeyExpr.deserialize(when) : undefined, isDefault === undefined ? true : isDefault, null, false);
        }
    });
});
//# sourceMappingURL=keybindingEditing.test.js.map