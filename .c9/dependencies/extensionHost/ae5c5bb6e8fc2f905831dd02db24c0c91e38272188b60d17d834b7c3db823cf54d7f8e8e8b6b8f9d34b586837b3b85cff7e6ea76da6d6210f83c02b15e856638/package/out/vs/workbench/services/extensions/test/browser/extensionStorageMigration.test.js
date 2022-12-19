/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/log/common/log", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/extensionManagement/common/extensionStorage", "vs/base/common/uri", "vs/base/common/resources", "vs/base/common/buffer", "vs/platform/workspace/test/common/testWorkspace", "vs/workbench/services/extensions/common/extensionStorageMigration", "vs/platform/storage/common/storage"], function (require, exports, assert, lifecycle_1, environment_1, files_1, fileService_1, inMemoryFilesystemProvider_1, log_1, workbenchTestServices_1, extensionStorage_1, uri_1, resources_1, buffer_1, testWorkspace_1, extensionStorageMigration_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtensionStorageMigration', () => {
        const disposables = new lifecycle_1.DisposableStore();
        const ROOT = uri_1.URI.file('tests').with({ scheme: 'vscode-tests' });
        const globalStorageHome = (0, resources_1.joinPath)(ROOT, 'globalStorageHome'), workspaceStorageHome = (0, resources_1.joinPath)(ROOT, 'workspaceStorageHome');
        let instantiationService;
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const fileService = disposables.add(new fileService_1.FileService(new log_1.NullLogService()));
            fileService.registerProvider(ROOT.scheme, disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider()));
            instantiationService.stub(files_1.IFileService, fileService);
            instantiationService.stub(environment_1.IEnvironmentService, { globalStorageHome, workspaceStorageHome });
            instantiationService.stub(extensionStorage_1.IExtensionStorageService, instantiationService.createInstance(extensionStorage_1.ExtensionStorageService));
        });
        teardown(() => disposables.clear());
        test('migrate extension storage', async () => {
            const fromExtensionId = 'pub.from', toExtensionId = 'pub.to', storageMigratedKey = `extensionStorage.migrate.${fromExtensionId}-${toExtensionId}`;
            const extensionStorageService = instantiationService.get(extensionStorage_1.IExtensionStorageService), fileService = instantiationService.get(files_1.IFileService), storageService = instantiationService.get(storage_1.IStorageService);
            extensionStorageService.setExtensionState(fromExtensionId, { globalKey: 'hello global state' }, true);
            extensionStorageService.setExtensionState(fromExtensionId, { workspaceKey: 'hello workspace state' }, false);
            await fileService.writeFile((0, resources_1.joinPath)(globalStorageHome, fromExtensionId), buffer_1.VSBuffer.fromString('hello global storage'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceStorageHome, testWorkspace_1.TestWorkspace.id, fromExtensionId), buffer_1.VSBuffer.fromString('hello workspace storage'));
            await (0, extensionStorageMigration_1.migrateExtensionStorage)(fromExtensionId, toExtensionId, true, instantiationService);
            await (0, extensionStorageMigration_1.migrateExtensionStorage)(fromExtensionId, toExtensionId, false, instantiationService);
            assert.deepStrictEqual(extensionStorageService.getExtensionState(fromExtensionId, true), undefined);
            assert.deepStrictEqual(extensionStorageService.getExtensionState(fromExtensionId, false), undefined);
            assert.deepStrictEqual((await fileService.exists((0, resources_1.joinPath)(globalStorageHome, fromExtensionId))), false);
            assert.deepStrictEqual((await fileService.exists((0, resources_1.joinPath)(workspaceStorageHome, testWorkspace_1.TestWorkspace.id, fromExtensionId))), false);
            assert.deepStrictEqual(extensionStorageService.getExtensionState(toExtensionId, true), { globalKey: 'hello global state' });
            assert.deepStrictEqual(extensionStorageService.getExtensionState(toExtensionId, false), { workspaceKey: 'hello workspace state' });
            assert.deepStrictEqual((await fileService.readFile((0, resources_1.joinPath)(globalStorageHome, toExtensionId))).value.toString(), 'hello global storage');
            assert.deepStrictEqual((await fileService.readFile((0, resources_1.joinPath)(workspaceStorageHome, testWorkspace_1.TestWorkspace.id, toExtensionId))).value.toString(), 'hello workspace storage');
            assert.deepStrictEqual(storageService.get(storageMigratedKey, 0 /* StorageScope.GLOBAL */), 'true');
            assert.deepStrictEqual(storageService.get(storageMigratedKey, 1 /* StorageScope.WORKSPACE */), 'true');
        });
        test('migrate extension storage when does not exist', async () => {
            const fromExtensionId = 'pub.from', toExtensionId = 'pub.to', storageMigratedKey = `extensionStorage.migrate.${fromExtensionId}-${toExtensionId}`;
            const extensionStorageService = instantiationService.get(extensionStorage_1.IExtensionStorageService), fileService = instantiationService.get(files_1.IFileService), storageService = instantiationService.get(storage_1.IStorageService);
            await (0, extensionStorageMigration_1.migrateExtensionStorage)(fromExtensionId, toExtensionId, true, instantiationService);
            await (0, extensionStorageMigration_1.migrateExtensionStorage)(fromExtensionId, toExtensionId, false, instantiationService);
            assert.deepStrictEqual(extensionStorageService.getExtensionState(fromExtensionId, true), undefined);
            assert.deepStrictEqual(extensionStorageService.getExtensionState(fromExtensionId, false), undefined);
            assert.deepStrictEqual((await fileService.exists((0, resources_1.joinPath)(globalStorageHome, fromExtensionId))), false);
            assert.deepStrictEqual((await fileService.exists((0, resources_1.joinPath)(workspaceStorageHome, testWorkspace_1.TestWorkspace.id, fromExtensionId))), false);
            assert.deepStrictEqual(extensionStorageService.getExtensionState(toExtensionId, true), undefined);
            assert.deepStrictEqual(extensionStorageService.getExtensionState(toExtensionId, false), undefined);
            assert.deepStrictEqual((await fileService.exists((0, resources_1.joinPath)(globalStorageHome, toExtensionId))), false);
            assert.deepStrictEqual((await fileService.exists((0, resources_1.joinPath)(workspaceStorageHome, testWorkspace_1.TestWorkspace.id, toExtensionId))), false);
            assert.deepStrictEqual(storageService.get(storageMigratedKey, 0 /* StorageScope.GLOBAL */), 'true');
            assert.deepStrictEqual(storageService.get(storageMigratedKey, 1 /* StorageScope.WORKSPACE */), 'true');
        });
    });
});
//# sourceMappingURL=extensionStorageMigration.test.js.map