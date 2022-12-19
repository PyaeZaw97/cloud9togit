/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/workbench/services/workingCopy/common/fileWorkingCopyManager", "vs/workbench/services/workingCopy/common/workingCopy", "vs/workbench/services/workingCopy/test/browser/storedFileWorkingCopy.test", "vs/workbench/services/workingCopy/test/browser/untitledFileWorkingCopy.test", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, buffer_1, lifecycle_1, network_1, uri_1, fileWorkingCopyManager_1, workingCopy_1, storedFileWorkingCopy_test_1, untitledFileWorkingCopy_test_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('UntitledFileWorkingCopyManager', () => {
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
            manager = new fileWorkingCopyManager_1.FileWorkingCopyManager('testUntitledFileWorkingCopyType', new storedFileWorkingCopy_test_1.TestStoredFileWorkingCopyModelFactory(), new untitledFileWorkingCopy_test_1.TestUntitledFileWorkingCopyModelFactory(), accessor.fileService, accessor.lifecycleService, accessor.labelService, accessor.logService, accessor.workingCopyFileService, accessor.workingCopyBackupService, accessor.uriIdentityService, accessor.fileDialogService, accessor.filesConfigurationService, accessor.workingCopyService, accessor.notificationService, accessor.workingCopyEditorService, accessor.editorService, accessor.elevatedFileService, accessor.pathService, accessor.environmentService, accessor.dialogService, accessor.decorationsService);
        });
        teardown(() => {
            manager.dispose();
            disposables.dispose();
        });
        test('basics', async () => {
            var _a, _b, _c;
            let createCounter = 0;
            manager.untitled.onDidCreate(e => {
                createCounter++;
            });
            let disposeCounter = 0;
            manager.untitled.onWillDispose(e => {
                disposeCounter++;
            });
            let dirtyCounter = 0;
            manager.untitled.onDidChangeDirty(e => {
                dirtyCounter++;
            });
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 0);
            assert.strictEqual(manager.untitled.workingCopies.length, 0);
            assert.strictEqual(manager.untitled.get(uri_1.URI.file('/some/invalidPath')), undefined);
            assert.strictEqual(manager.untitled.get(uri_1.URI.file('/some/invalidPath').with({ scheme: network_1.Schemas.untitled })), undefined);
            const workingCopy1 = await manager.untitled.resolve();
            const workingCopy2 = await manager.untitled.resolve();
            assert.strictEqual(workingCopy1.typeId, 'testUntitledFileWorkingCopyType');
            assert.strictEqual(workingCopy1.resource.scheme, network_1.Schemas.untitled);
            assert.strictEqual(createCounter, 2);
            assert.strictEqual(manager.untitled.get(workingCopy1.resource), workingCopy1);
            assert.strictEqual(manager.untitled.get(workingCopy2.resource), workingCopy2);
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 2);
            assert.strictEqual(manager.untitled.workingCopies.length, 2);
            assert.notStrictEqual(workingCopy1.resource.toString(), workingCopy2.resource.toString());
            for (const workingCopy of [workingCopy1, workingCopy2]) {
                assert.strictEqual(workingCopy.capabilities, 2 /* WorkingCopyCapabilities.Untitled */);
                assert.strictEqual(workingCopy.isDirty(), false);
                assert.ok(workingCopy.model);
            }
            (_a = workingCopy1.model) === null || _a === void 0 ? void 0 : _a.updateContents('Hello World');
            assert.strictEqual(workingCopy1.isDirty(), true);
            assert.strictEqual(dirtyCounter, 1);
            (_b = workingCopy1.model) === null || _b === void 0 ? void 0 : _b.updateContents(''); // change to empty clears dirty flag
            assert.strictEqual(workingCopy1.isDirty(), false);
            assert.strictEqual(dirtyCounter, 2);
            (_c = workingCopy2.model) === null || _c === void 0 ? void 0 : _c.fireContentChangeEvent({ isInitial: false });
            assert.strictEqual(workingCopy2.isDirty(), true);
            assert.strictEqual(dirtyCounter, 3);
            workingCopy1.dispose();
            assert.strictEqual(manager.untitled.workingCopies.length, 1);
            assert.strictEqual(manager.untitled.get(workingCopy1.resource), undefined);
            workingCopy2.dispose();
            assert.strictEqual(manager.untitled.workingCopies.length, 0);
            assert.strictEqual(manager.untitled.get(workingCopy2.resource), undefined);
            assert.strictEqual(disposeCounter, 2);
        });
        test('resolve - with initial value', async () => {
            var _a, _b;
            let dirtyCounter = 0;
            manager.untitled.onDidChangeDirty(e => {
                dirtyCounter++;
            });
            const workingCopy1 = await manager.untitled.resolve({ contents: { value: (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString('Hello World')) } });
            assert.strictEqual(workingCopy1.isDirty(), true);
            assert.strictEqual(dirtyCounter, 1);
            assert.strictEqual((_a = workingCopy1.model) === null || _a === void 0 ? void 0 : _a.contents, 'Hello World');
            workingCopy1.dispose();
            const workingCopy2 = await manager.untitled.resolve({ contents: { value: (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString('Hello World')), markDirty: true } });
            assert.strictEqual(workingCopy2.isDirty(), true);
            assert.strictEqual(dirtyCounter, 2);
            assert.strictEqual((_b = workingCopy2.model) === null || _b === void 0 ? void 0 : _b.contents, 'Hello World');
            workingCopy2.dispose();
        });
        test('resolve - with initial value but markDirty: false', async () => {
            var _a;
            let dirtyCounter = 0;
            manager.untitled.onDidChangeDirty(e => {
                dirtyCounter++;
            });
            const workingCopy = await manager.untitled.resolve({ contents: { value: (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString('Hello World')), markDirty: false } });
            assert.strictEqual(workingCopy.isDirty(), false);
            assert.strictEqual(dirtyCounter, 0);
            assert.strictEqual((_a = workingCopy.model) === null || _a === void 0 ? void 0 : _a.contents, 'Hello World');
            workingCopy.dispose();
        });
        test('resolve begins counter from 1 for disposed untitled', async () => {
            const untitled1 = await manager.untitled.resolve();
            untitled1.dispose();
            const untitled1Again = await manager.untitled.resolve();
            assert.strictEqual(untitled1.resource.toString(), untitled1Again.resource.toString());
        });
        test('resolve - existing', async () => {
            let createCounter = 0;
            manager.untitled.onDidCreate(e => {
                createCounter++;
            });
            const workingCopy1 = await manager.untitled.resolve();
            assert.strictEqual(createCounter, 1);
            const workingCopy2 = await manager.untitled.resolve({ untitledResource: workingCopy1.resource });
            assert.strictEqual(workingCopy1, workingCopy2);
            assert.strictEqual(createCounter, 1);
            const workingCopy3 = await manager.untitled.resolve({ untitledResource: uri_1.URI.file('/invalid/untitled') });
            assert.strictEqual(workingCopy3.resource.scheme, network_1.Schemas.untitled);
            workingCopy1.dispose();
            workingCopy2.dispose();
            workingCopy3.dispose();
        });
        test('resolve - untitled resource used for new working copy', async () => {
            const invalidUntitledResource = uri_1.URI.file('my/untitled.txt');
            const validUntitledResource = invalidUntitledResource.with({ scheme: network_1.Schemas.untitled });
            const workingCopy1 = await manager.untitled.resolve({ untitledResource: invalidUntitledResource });
            assert.notStrictEqual(workingCopy1.resource.toString(), invalidUntitledResource.toString());
            const workingCopy2 = await manager.untitled.resolve({ untitledResource: validUntitledResource });
            assert.strictEqual(workingCopy2.resource.toString(), validUntitledResource.toString());
            workingCopy1.dispose();
            workingCopy2.dispose();
        });
        test('resolve - with associated resource', async () => {
            const workingCopy = await manager.untitled.resolve({ associatedResource: { path: '/some/associated.txt' } });
            assert.strictEqual(workingCopy.hasAssociatedFilePath, true);
            assert.strictEqual(workingCopy.resource.path, '/some/associated.txt');
            workingCopy.dispose();
        });
        test('save - without associated resource', async () => {
            var _a;
            const workingCopy = await manager.untitled.resolve();
            (_a = workingCopy.model) === null || _a === void 0 ? void 0 : _a.updateContents('Simple Save');
            accessor.fileDialogService.setPickFileToSave(uri_1.URI.file('simple/file.txt'));
            const result = await workingCopy.save();
            assert.ok(result);
            assert.strictEqual(manager.untitled.get(workingCopy.resource), undefined);
            workingCopy.dispose();
        });
        test('save - with associated resource', async () => {
            var _a;
            const workingCopy = await manager.untitled.resolve({ associatedResource: { path: '/some/associated.txt' } });
            (_a = workingCopy.model) === null || _a === void 0 ? void 0 : _a.updateContents('Simple Save with associated resource');
            accessor.fileService.notExistsSet.set(uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/some/associated.txt' }), true);
            const result = await workingCopy.save();
            assert.ok(result);
            assert.strictEqual(manager.untitled.get(workingCopy.resource), undefined);
            workingCopy.dispose();
        });
        test('save - with associated resource (asks to overwrite)', async () => {
            var _a;
            const workingCopy = await manager.untitled.resolve({ associatedResource: { path: '/some/associated.txt' } });
            (_a = workingCopy.model) === null || _a === void 0 ? void 0 : _a.updateContents('Simple Save with associated resource');
            let result = await workingCopy.save();
            assert.ok(!result); // not confirmed
            assert.strictEqual(manager.untitled.get(workingCopy.resource), workingCopy);
            accessor.dialogService.setConfirmResult({ confirmed: true });
            result = await workingCopy.save();
            assert.ok(result); // confirmed
            assert.strictEqual(manager.untitled.get(workingCopy.resource), undefined);
            workingCopy.dispose();
        });
        test('destroy', async () => {
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 0);
            await manager.untitled.resolve();
            await manager.untitled.resolve();
            await manager.untitled.resolve();
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 3);
            assert.strictEqual(manager.untitled.workingCopies.length, 3);
            await manager.untitled.destroy();
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 0);
            assert.strictEqual(manager.untitled.workingCopies.length, 0);
        });
        test('manager with different types produce different URIs', async () => {
            try {
                manager = new fileWorkingCopyManager_1.FileWorkingCopyManager('someOtherUntitledTypeId', new storedFileWorkingCopy_test_1.TestStoredFileWorkingCopyModelFactory(), new untitledFileWorkingCopy_test_1.TestUntitledFileWorkingCopyModelFactory(), accessor.fileService, accessor.lifecycleService, accessor.labelService, accessor.logService, accessor.workingCopyFileService, accessor.workingCopyBackupService, accessor.uriIdentityService, accessor.fileDialogService, accessor.filesConfigurationService, accessor.workingCopyService, accessor.notificationService, accessor.workingCopyEditorService, accessor.editorService, accessor.elevatedFileService, accessor.pathService, accessor.environmentService, accessor.dialogService, accessor.decorationsService);
                const untitled1OriginalType = await manager.untitled.resolve();
                const untitled1OtherType = await manager.untitled.resolve();
                assert.notStrictEqual(untitled1OriginalType.resource.toString(), untitled1OtherType.resource.toString());
            }
            finally {
                manager.destroy();
            }
        });
        test('manager without typeId produces backwards compatible URIs', async () => {
            try {
                manager = new fileWorkingCopyManager_1.FileWorkingCopyManager(workingCopy_1.NO_TYPE_ID, new storedFileWorkingCopy_test_1.TestStoredFileWorkingCopyModelFactory(), new untitledFileWorkingCopy_test_1.TestUntitledFileWorkingCopyModelFactory(), accessor.fileService, accessor.lifecycleService, accessor.labelService, accessor.logService, accessor.workingCopyFileService, accessor.workingCopyBackupService, accessor.uriIdentityService, accessor.fileDialogService, accessor.filesConfigurationService, accessor.workingCopyService, accessor.notificationService, accessor.workingCopyEditorService, accessor.editorService, accessor.elevatedFileService, accessor.pathService, accessor.environmentService, accessor.dialogService, accessor.decorationsService);
                const result = await manager.untitled.resolve();
                assert.strictEqual(result.resource.scheme, network_1.Schemas.untitled);
                assert.ok(result.resource.path.length > 0);
                assert.strictEqual(result.resource.query, '');
                assert.strictEqual(result.resource.authority, '');
                assert.strictEqual(result.resource.fragment, '');
            }
            finally {
                manager.destroy();
            }
        });
    });
});
//# sourceMappingURL=untitledFileWorkingCopyManager.test.js.map