/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/workingCopy/common/storedFileWorkingCopy", "vs/base/common/buffer", "vs/workbench/services/workingCopy/test/browser/storedFileWorkingCopy.test", "vs/base/common/network", "vs/workbench/services/workingCopy/common/fileWorkingCopyManager", "vs/workbench/services/workingCopy/test/browser/untitledFileWorkingCopy.test", "vs/workbench/services/workingCopy/common/untitledFileWorkingCopy", "vs/base/common/lifecycle"], function (require, exports, assert, uri_1, workbenchTestServices_1, storedFileWorkingCopy_1, buffer_1, storedFileWorkingCopy_test_1, network_1, fileWorkingCopyManager_1, untitledFileWorkingCopy_test_1, untitledFileWorkingCopy_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('FileWorkingCopyManager', () => {
        let disposables;
        let instantiationService;
        let accessor;
        let manager;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            accessor.fileService.registerProvider(network_1.Schemas.file, new workbenchTestServices_1.TestInMemoryFileSystemProvider());
            accessor.fileService.registerProvider(network_1.Schemas.vscodeRemote, new workbenchTestServices_1.TestInMemoryFileSystemProvider());
            manager = new fileWorkingCopyManager_1.FileWorkingCopyManager('testFileWorkingCopyType', new storedFileWorkingCopy_test_1.TestStoredFileWorkingCopyModelFactory(), new untitledFileWorkingCopy_test_1.TestUntitledFileWorkingCopyModelFactory(), accessor.fileService, accessor.lifecycleService, accessor.labelService, accessor.logService, accessor.workingCopyFileService, accessor.workingCopyBackupService, accessor.uriIdentityService, accessor.fileDialogService, accessor.filesConfigurationService, accessor.workingCopyService, accessor.notificationService, accessor.workingCopyEditorService, accessor.editorService, accessor.elevatedFileService, accessor.pathService, accessor.environmentService, accessor.dialogService, accessor.decorationsService);
        });
        teardown(() => {
            manager.dispose();
            disposables.dispose();
        });
        test('onDidCreate, get, workingCopies', async () => {
            let createCounter = 0;
            manager.onDidCreate(e => {
                createCounter++;
            });
            const fileUri = uri_1.URI.file('/test.html');
            assert.strictEqual(manager.workingCopies.length, 0);
            assert.strictEqual(manager.get(fileUri), undefined);
            const fileWorkingCopy = await manager.resolve(fileUri);
            const untitledFileWorkingCopy = await manager.resolve();
            assert.strictEqual(manager.workingCopies.length, 2);
            assert.strictEqual(createCounter, 2);
            assert.strictEqual(manager.get(fileWorkingCopy.resource), fileWorkingCopy);
            assert.strictEqual(manager.get(untitledFileWorkingCopy.resource), untitledFileWorkingCopy);
            const sameFileWorkingCopy = await manager.resolve(fileUri);
            const sameUntitledFileWorkingCopy = await manager.resolve({ untitledResource: untitledFileWorkingCopy.resource });
            assert.strictEqual(sameFileWorkingCopy, fileWorkingCopy);
            assert.strictEqual(sameUntitledFileWorkingCopy, untitledFileWorkingCopy);
            assert.strictEqual(manager.workingCopies.length, 2);
            assert.strictEqual(createCounter, 2);
            fileWorkingCopy.dispose();
            untitledFileWorkingCopy.dispose();
        });
        test('resolve', async () => {
            const fileWorkingCopy = await manager.resolve(uri_1.URI.file('/test.html'));
            assert.ok(fileWorkingCopy instanceof storedFileWorkingCopy_1.StoredFileWorkingCopy);
            assert.strictEqual(await manager.stored.resolve(fileWorkingCopy.resource), fileWorkingCopy);
            const untitledFileWorkingCopy = await manager.resolve();
            assert.ok(untitledFileWorkingCopy instanceof untitledFileWorkingCopy_1.UntitledFileWorkingCopy);
            assert.strictEqual(await manager.untitled.resolve({ untitledResource: untitledFileWorkingCopy.resource }), untitledFileWorkingCopy);
            assert.strictEqual(await manager.resolve(untitledFileWorkingCopy.resource), untitledFileWorkingCopy);
            fileWorkingCopy.dispose();
            untitledFileWorkingCopy.dispose();
        });
        test('destroy', async () => {
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 0);
            await manager.resolve(uri_1.URI.file('/test.html'));
            await manager.resolve({ contents: { value: (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString('Hello Untitled')) } });
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 2);
            assert.strictEqual(manager.stored.workingCopies.length, 1);
            assert.strictEqual(manager.untitled.workingCopies.length, 1);
            await manager.destroy();
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 0);
            assert.strictEqual(manager.stored.workingCopies.length, 0);
            assert.strictEqual(manager.untitled.workingCopies.length, 0);
        });
        test('saveAs - file (same target, unresolved source, unresolved target)', () => {
            const source = uri_1.URI.file('/path/source.txt');
            return testSaveAsFile(source, source, false, false);
        });
        test('saveAs - file (same target, different case, unresolved source, unresolved target)', async () => {
            const source = uri_1.URI.file('/path/source.txt');
            const target = uri_1.URI.file('/path/SOURCE.txt');
            return testSaveAsFile(source, target, false, false);
        });
        test('saveAs - file (different target, unresolved source, unresolved target)', async () => {
            const source = uri_1.URI.file('/path/source.txt');
            const target = uri_1.URI.file('/path/target.txt');
            return testSaveAsFile(source, target, false, false);
        });
        test('saveAs - file (same target, resolved source, unresolved target)', () => {
            const source = uri_1.URI.file('/path/source.txt');
            return testSaveAsFile(source, source, true, false);
        });
        test('saveAs - file (same target, different case, resolved source, unresolved target)', async () => {
            const source = uri_1.URI.file('/path/source.txt');
            const target = uri_1.URI.file('/path/SOURCE.txt');
            return testSaveAsFile(source, target, true, false);
        });
        test('saveAs - file (different target, resolved source, unresolved target)', async () => {
            const source = uri_1.URI.file('/path/source.txt');
            const target = uri_1.URI.file('/path/target.txt');
            return testSaveAsFile(source, target, true, false);
        });
        test('saveAs - file (same target, unresolved source, resolved target)', () => {
            const source = uri_1.URI.file('/path/source.txt');
            return testSaveAsFile(source, source, false, true);
        });
        test('saveAs - file (same target, different case, unresolved source, resolved target)', async () => {
            const source = uri_1.URI.file('/path/source.txt');
            const target = uri_1.URI.file('/path/SOURCE.txt');
            return testSaveAsFile(source, target, false, true);
        });
        test('saveAs - file (different target, unresolved source, resolved target)', async () => {
            const source = uri_1.URI.file('/path/source.txt');
            const target = uri_1.URI.file('/path/target.txt');
            return testSaveAsFile(source, target, false, true);
        });
        test('saveAs - file (same target, resolved source, resolved target)', () => {
            const source = uri_1.URI.file('/path/source.txt');
            return testSaveAsFile(source, source, true, true);
        });
        test('saveAs - file (different target, resolved source, resolved target)', async () => {
            const source = uri_1.URI.file('/path/source.txt');
            const target = uri_1.URI.file('/path/target.txt');
            return testSaveAsFile(source, target, true, true);
        });
        async function testSaveAsFile(source, target, resolveSource, resolveTarget) {
            var _a, _b;
            let sourceWorkingCopy = undefined;
            if (resolveSource) {
                sourceWorkingCopy = await manager.resolve(source);
                (_a = sourceWorkingCopy.model) === null || _a === void 0 ? void 0 : _a.updateContents('hello world');
                assert.ok(sourceWorkingCopy.isDirty());
            }
            let targetWorkingCopy = undefined;
            if (resolveTarget) {
                targetWorkingCopy = await manager.resolve(target);
                (_b = targetWorkingCopy.model) === null || _b === void 0 ? void 0 : _b.updateContents('hello world');
                assert.ok(targetWorkingCopy.isDirty());
            }
            const result = await manager.saveAs(source, target);
            if (accessor.uriIdentityService.extUri.isEqual(source, target) && resolveSource) {
                // if the uris are considered equal (different case on macOS/Windows)
                // and the source is to be resolved, the resulting working copy resource
                // will be the source resource because we consider file working copies
                // the same in that case
                assert.strictEqual(source.toString(), result === null || result === void 0 ? void 0 : result.resource.toString());
            }
            else {
                if (resolveSource || resolveTarget) {
                    assert.strictEqual(target.toString(), result === null || result === void 0 ? void 0 : result.resource.toString());
                }
                else {
                    if (accessor.uriIdentityService.extUri.isEqual(source, target)) {
                        assert.strictEqual(undefined, result);
                    }
                    else {
                        assert.strictEqual(target.toString(), result === null || result === void 0 ? void 0 : result.resource.toString());
                    }
                }
            }
            if (resolveSource) {
                assert.strictEqual(sourceWorkingCopy === null || sourceWorkingCopy === void 0 ? void 0 : sourceWorkingCopy.isDirty(), false);
            }
            if (resolveTarget) {
                assert.strictEqual(targetWorkingCopy === null || targetWorkingCopy === void 0 ? void 0 : targetWorkingCopy.isDirty(), false);
            }
        }
        test('saveAs - untitled (without associated resource)', async () => {
            var _a;
            const workingCopy = await manager.resolve();
            (_a = workingCopy.model) === null || _a === void 0 ? void 0 : _a.updateContents('Simple Save As');
            const target = uri_1.URI.file('simple/file.txt');
            accessor.fileDialogService.setPickFileToSave(target);
            const result = await manager.saveAs(workingCopy.resource, undefined);
            assert.strictEqual(result === null || result === void 0 ? void 0 : result.resource.toString(), target.toString());
            assert.strictEqual((result === null || result === void 0 ? void 0 : result.model).contents, 'Simple Save As');
            assert.strictEqual(manager.untitled.get(workingCopy.resource), undefined);
            workingCopy.dispose();
        });
        test('saveAs - untitled (with associated resource)', async () => {
            var _a;
            const workingCopy = await manager.resolve({ associatedResource: { path: '/some/associated.txt' } });
            (_a = workingCopy.model) === null || _a === void 0 ? void 0 : _a.updateContents('Simple Save As with associated resource');
            const target = uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/some/associated.txt' });
            accessor.fileService.notExistsSet.set(target, true);
            const result = await manager.saveAs(workingCopy.resource, undefined);
            assert.strictEqual(result === null || result === void 0 ? void 0 : result.resource.toString(), target.toString());
            assert.strictEqual((result === null || result === void 0 ? void 0 : result.model).contents, 'Simple Save As with associated resource');
            assert.strictEqual(manager.untitled.get(workingCopy.resource), undefined);
            workingCopy.dispose();
        });
        test('saveAs - untitled (target exists and is resolved)', async () => {
            var _a;
            const workingCopy = await manager.resolve();
            (_a = workingCopy.model) === null || _a === void 0 ? void 0 : _a.updateContents('Simple Save As');
            const target = uri_1.URI.file('simple/file.txt');
            const targetFileWorkingCopy = await manager.resolve(target);
            accessor.fileDialogService.setPickFileToSave(target);
            const result = await manager.saveAs(workingCopy.resource, undefined);
            assert.strictEqual(result, targetFileWorkingCopy);
            assert.strictEqual((result === null || result === void 0 ? void 0 : result.model).contents, 'Simple Save As');
            assert.strictEqual(manager.untitled.get(workingCopy.resource), undefined);
            workingCopy.dispose();
        });
    });
});
//# sourceMappingURL=fileWorkingCopyManager.test.js.map