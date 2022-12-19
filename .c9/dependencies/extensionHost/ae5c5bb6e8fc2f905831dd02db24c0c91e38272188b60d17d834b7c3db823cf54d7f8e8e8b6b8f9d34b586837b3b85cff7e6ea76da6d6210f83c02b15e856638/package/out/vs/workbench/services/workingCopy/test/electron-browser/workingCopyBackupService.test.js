/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "os", "crypto", "vs/base/common/arrays", "vs/base/common/hash", "vs/base/common/resources", "fs", "vs/base/common/path", "vs/base/node/pfs", "vs/base/common/uri", "vs/workbench/services/workingCopy/common/workingCopyBackupService", "vs/editor/test/common/testTextModel", "vs/base/test/node/testUtils", "vs/base/common/network", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/platform/files/node/diskFileSystemProvider", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/workingCopy/electron-sandbox/workingCopyBackupService", "vs/platform/userData/common/fileUserDataProvider", "vs/base/common/buffer", "vs/workbench/test/electron-browser/workbenchTestServices", "vs/workbench/test/browser/workbenchTestServices", "vs/base/common/cancellation", "vs/base/common/stream", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, platform_1, os_1, crypto_1, arrays_1, hash_1, resources_1, fs_1, path_1, pfs_1, uri_1, workingCopyBackupService_1, testTextModel_1, testUtils_1, network_1, fileService_1, log_1, diskFileSystemProvider_1, environmentService_1, textfiles_1, workingCopyBackupService_2, fileUserDataProvider_1, buffer_1, workbenchTestServices_1, workbenchTestServices_2, cancellation_1, stream_1, workbenchTestServices_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeTestWorkingCopyBackupService = void 0;
    class TestWorkbenchEnvironmentService extends environmentService_1.NativeWorkbenchEnvironmentService {
        constructor(testDir, backupPath) {
            super(Object.assign(Object.assign({}, workbenchTestServices_1.TestNativeWindowConfiguration), { backupPath, 'user-data-dir': testDir }), workbenchTestServices_3.TestProductService);
        }
    }
    class NodeTestWorkingCopyBackupService extends workingCopyBackupService_2.NativeWorkingCopyBackupService {
        constructor(testDir, workspaceBackupPath) {
            const environmentService = new TestWorkbenchEnvironmentService(testDir, workspaceBackupPath);
            const logService = new log_1.NullLogService();
            const fileService = new fileService_1.FileService(logService);
            const lifecycleService = new workbenchTestServices_2.TestLifecycleService();
            super(environmentService, fileService, logService, lifecycleService);
            this.diskFileSystemProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(logService);
            fileService.registerProvider(network_1.Schemas.file, this.diskFileSystemProvider);
            fileService.registerProvider(network_1.Schemas.vscodeUserData, new fileUserDataProvider_1.FileUserDataProvider(network_1.Schemas.file, this.diskFileSystemProvider, network_1.Schemas.vscodeUserData, logService));
            this.fileService = fileService;
            this.backupResourceJoiners = [];
            this.discardBackupJoiners = [];
            this.discardedBackups = [];
            this.pendingBackupsArr = [];
            this.discardedAllBackups = false;
        }
        async waitForAllBackups() {
            await Promise.all(this.pendingBackupsArr);
        }
        joinBackupResource() {
            return new Promise(resolve => this.backupResourceJoiners.push(resolve));
        }
        async backup(identifier, content, versionId, meta, token) {
            const p = super.backup(identifier, content, versionId, meta, token);
            const removeFromPendingBackups = (0, arrays_1.insert)(this.pendingBackupsArr, p.then(undefined, undefined));
            try {
                await p;
            }
            finally {
                removeFromPendingBackups();
            }
            while (this.backupResourceJoiners.length) {
                this.backupResourceJoiners.pop()();
            }
        }
        joinDiscardBackup() {
            return new Promise(resolve => this.discardBackupJoiners.push(resolve));
        }
        async discardBackup(identifier) {
            await super.discardBackup(identifier);
            this.discardedBackups.push(identifier);
            while (this.discardBackupJoiners.length) {
                this.discardBackupJoiners.pop()();
            }
        }
        async discardBackups(filter) {
            this.discardedAllBackups = true;
            return super.discardBackups(filter);
        }
        async getBackupContents(identifier) {
            const backupResource = this.toBackupResource(identifier);
            const fileContents = await this.fileService.readFile(backupResource);
            return fileContents.value.toString();
        }
        dispose() {
            this.diskFileSystemProvider.dispose();
        }
    }
    exports.NodeTestWorkingCopyBackupService = NodeTestWorkingCopyBackupService;
    (0, testUtils_1.flakySuite)('WorkingCopyBackupService', () => {
        let testDir;
        let backupHome;
        let workspacesJsonPath;
        let workspaceBackupPath;
        let service;
        let workspaceResource = uri_1.URI.file(platform_1.isWindows ? 'c:\\workspace' : '/workspace');
        let fooFile = uri_1.URI.file(platform_1.isWindows ? 'c:\\Foo' : '/Foo');
        let customFile = uri_1.URI.parse('customScheme://some/path');
        let customFileWithFragment = uri_1.URI.parse('customScheme2://some/path#fragment');
        let barFile = uri_1.URI.file(platform_1.isWindows ? 'c:\\Bar' : '/Bar');
        let fooBarFile = uri_1.URI.file(platform_1.isWindows ? 'c:\\Foo Bar' : '/Foo Bar');
        let untitledFile = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-1' });
        setup(async () => {
            testDir = (0, testUtils_1.getRandomTestPath)((0, os_1.tmpdir)(), 'vsctests', 'workingcopybackupservice');
            backupHome = (0, path_1.join)(testDir, 'Backups');
            workspacesJsonPath = (0, path_1.join)(backupHome, 'workspaces.json');
            workspaceBackupPath = (0, path_1.join)(backupHome, (0, hash_1.hash)(workspaceResource.fsPath).toString(16));
            service = new NodeTestWorkingCopyBackupService(testDir, workspaceBackupPath);
            await pfs_1.Promises.mkdir(backupHome, { recursive: true });
            return pfs_1.Promises.writeFile(workspacesJsonPath, '');
        });
        teardown(() => {
            service.dispose();
            return pfs_1.Promises.rm(testDir);
        });
        suite('hashIdentifier', () => {
            test('should correctly hash the identifier for untitled scheme URIs', () => {
                const uri = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-1' });
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes change people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                const untypedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)((0, workbenchTestServices_2.toUntypedWorkingCopyId)(uri));
                assert.strictEqual(untypedBackupHash, '-7f9c1a2e');
                assert.strictEqual(untypedBackupHash, (0, hash_1.hash)(uri.fsPath).toString(16));
                const typedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)({ typeId: 'hashTest', resource: uri });
                if (platform_1.isWindows) {
                    assert.strictEqual(typedBackupHash, '-17c47cdc');
                }
                else {
                    assert.strictEqual(typedBackupHash, '-8ad5f4f');
                }
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes collide people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                assert.notStrictEqual(untypedBackupHash, typedBackupHash);
            });
            test('should correctly hash the identifier for file scheme URIs', () => {
                const uri = uri_1.URI.file('/foo');
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes change people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                const untypedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)((0, workbenchTestServices_2.toUntypedWorkingCopyId)(uri));
                if (platform_1.isWindows) {
                    assert.strictEqual(untypedBackupHash, '20ffaa13');
                }
                else {
                    assert.strictEqual(untypedBackupHash, '20eb3560');
                }
                assert.strictEqual(untypedBackupHash, (0, hash_1.hash)(uri.fsPath).toString(16));
                const typedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)({ typeId: 'hashTest', resource: uri });
                if (platform_1.isWindows) {
                    assert.strictEqual(typedBackupHash, '-55fc55db');
                }
                else {
                    assert.strictEqual(typedBackupHash, '51e56bf');
                }
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes collide people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                assert.notStrictEqual(untypedBackupHash, typedBackupHash);
            });
            test('should correctly hash the identifier for custom scheme URIs', () => {
                const uri = uri_1.URI.from({
                    scheme: 'vscode-custom',
                    path: 'somePath'
                });
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes change people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                const untypedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)((0, workbenchTestServices_2.toUntypedWorkingCopyId)(uri));
                assert.strictEqual(untypedBackupHash, '-44972d98');
                assert.strictEqual(untypedBackupHash, (0, hash_1.hash)(uri.toString()).toString(16));
                const typedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)({ typeId: 'hashTest', resource: uri });
                assert.strictEqual(typedBackupHash, '502149c7');
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes collide people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                assert.notStrictEqual(untypedBackupHash, typedBackupHash);
            });
            test('should not fail for URIs without path', () => {
                const uri = uri_1.URI.from({
                    scheme: 'vscode-fragment',
                    fragment: 'frag'
                });
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes change people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                const untypedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)((0, workbenchTestServices_2.toUntypedWorkingCopyId)(uri));
                assert.strictEqual(untypedBackupHash, '-2f6b2f1b');
                assert.strictEqual(untypedBackupHash, (0, hash_1.hash)(uri.toString()).toString(16));
                const typedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)({ typeId: 'hashTest', resource: uri });
                assert.strictEqual(typedBackupHash, '6e82ca57');
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes collide people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                assert.notStrictEqual(untypedBackupHash, typedBackupHash);
            });
        });
        suite('getBackupResource', () => {
            test('should get the correct backup path for text files', () => {
                // Format should be: <backupHome>/<workspaceHash>/<scheme>/<filePathHash>
                const backupResource = fooFile;
                const workspaceHash = (0, hash_1.hash)(workspaceResource.fsPath).toString(16);
                // No Type ID
                let backupId = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(backupResource);
                let filePathHash = (0, workingCopyBackupService_1.hashIdentifier)(backupId);
                let expectedPath = uri_1.URI.file((0, path_1.join)(backupHome, workspaceHash, network_1.Schemas.file, filePathHash)).with({ scheme: network_1.Schemas.vscodeUserData }).toString();
                assert.strictEqual(service.toBackupResource(backupId).toString(), expectedPath);
                // With Type ID
                backupId = (0, workbenchTestServices_2.toTypedWorkingCopyId)(backupResource);
                filePathHash = (0, workingCopyBackupService_1.hashIdentifier)(backupId);
                expectedPath = uri_1.URI.file((0, path_1.join)(backupHome, workspaceHash, network_1.Schemas.file, filePathHash)).with({ scheme: network_1.Schemas.vscodeUserData }).toString();
                assert.strictEqual(service.toBackupResource(backupId).toString(), expectedPath);
            });
            test('should get the correct backup path for untitled files', () => {
                // Format should be: <backupHome>/<workspaceHash>/<scheme>/<filePathHash>
                const backupResource = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-1' });
                const workspaceHash = (0, hash_1.hash)(workspaceResource.fsPath).toString(16);
                // No Type ID
                let backupId = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(backupResource);
                let filePathHash = (0, workingCopyBackupService_1.hashIdentifier)(backupId);
                let expectedPath = uri_1.URI.file((0, path_1.join)(backupHome, workspaceHash, network_1.Schemas.untitled, filePathHash)).with({ scheme: network_1.Schemas.vscodeUserData }).toString();
                assert.strictEqual(service.toBackupResource(backupId).toString(), expectedPath);
                // With Type ID
                backupId = (0, workbenchTestServices_2.toTypedWorkingCopyId)(backupResource);
                filePathHash = (0, workingCopyBackupService_1.hashIdentifier)(backupId);
                expectedPath = uri_1.URI.file((0, path_1.join)(backupHome, workspaceHash, network_1.Schemas.untitled, filePathHash)).with({ scheme: network_1.Schemas.vscodeUserData }).toString();
                assert.strictEqual(service.toBackupResource(backupId).toString(), expectedPath);
            });
            test('should get the correct backup path for custom files', () => {
                // Format should be: <backupHome>/<workspaceHash>/<scheme>/<filePathHash>
                const backupResource = uri_1.URI.from({ scheme: 'custom', path: 'custom/file.txt' });
                const workspaceHash = (0, hash_1.hash)(workspaceResource.fsPath).toString(16);
                // No Type ID
                let backupId = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(backupResource);
                let filePathHash = (0, workingCopyBackupService_1.hashIdentifier)(backupId);
                let expectedPath = uri_1.URI.file((0, path_1.join)(backupHome, workspaceHash, 'custom', filePathHash)).with({ scheme: network_1.Schemas.vscodeUserData }).toString();
                assert.strictEqual(service.toBackupResource(backupId).toString(), expectedPath);
                // With Type ID
                backupId = (0, workbenchTestServices_2.toTypedWorkingCopyId)(backupResource);
                filePathHash = (0, workingCopyBackupService_1.hashIdentifier)(backupId);
                expectedPath = uri_1.URI.file((0, path_1.join)(backupHome, workspaceHash, 'custom', filePathHash)).with({ scheme: network_1.Schemas.vscodeUserData }).toString();
                assert.strictEqual(service.toBackupResource(backupId).toString(), expectedPath);
            });
        });
        suite('backup', () => {
            function toExpectedPreamble(identifier, content = '', meta) {
                return `${identifier.resource.toString()} ${JSON.stringify(Object.assign(Object.assign({}, meta), { typeId: identifier.typeId }))}\n${content}`;
            }
            test('joining', async () => {
                let backupJoined = false;
                const joinBackupsPromise = service.joinBackups();
                joinBackupsPromise.then(() => backupJoined = true);
                await joinBackupsPromise;
                assert.strictEqual(backupJoined, true);
                backupJoined = false;
                service.joinBackups().then(() => backupJoined = true);
                const identifier = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const backupPromise = service.backup(identifier);
                assert.strictEqual(backupJoined, false);
                await backupPromise;
                assert.strictEqual(backupJoined, true);
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 1);
                assert.strictEqual((0, fs_1.existsSync)(backupPath), true);
                assert.strictEqual((0, fs_1.readFileSync)(backupPath).toString(), toExpectedPreamble(identifier));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('no text', async () => {
                const identifier = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier);
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 1);
                assert.strictEqual((0, fs_1.existsSync)(backupPath), true);
                assert.strictEqual((0, fs_1.readFileSync)(backupPath).toString(), toExpectedPreamble(identifier));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('text file', async () => {
                const identifier = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 1);
                assert.strictEqual((0, fs_1.existsSync)(backupPath), true);
                assert.strictEqual((0, fs_1.readFileSync)(backupPath).toString(), toExpectedPreamble(identifier, 'test'));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('text file (with version)', async () => {
                const identifier = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')), 666);
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 1);
                assert.strictEqual((0, fs_1.existsSync)(backupPath), true);
                assert.strictEqual((0, fs_1.readFileSync)(backupPath).toString(), toExpectedPreamble(identifier, 'test'));
                assert.ok(!service.hasBackupSync(identifier, 555));
                assert.ok(service.hasBackupSync(identifier, 666));
            });
            test('text file (with meta)', async () => {
                const identifier = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const meta = { etag: '678', orphaned: true };
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')), undefined, meta);
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 1);
                assert.strictEqual((0, fs_1.existsSync)(backupPath), true);
                assert.strictEqual((0, fs_1.readFileSync)(backupPath).toString(), toExpectedPreamble(identifier, 'test', meta));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('text file with whitespace in name and type (with meta)', async () => {
                let fileWithSpace = uri_1.URI.file(platform_1.isWindows ? 'c:\\Foo \n Bar' : '/Foo \n Bar');
                const identifier = (0, workbenchTestServices_2.toTypedWorkingCopyId)(fileWithSpace, ' test id \n');
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const meta = { etag: '678 \n k', orphaned: true };
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')), undefined, meta);
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 1);
                assert.strictEqual((0, fs_1.existsSync)(backupPath), true);
                assert.strictEqual((0, fs_1.readFileSync)(backupPath).toString(), toExpectedPreamble(identifier, 'test', meta));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('text file with unicode character in name and type (with meta)', async () => {
                let fileWithUnicode = uri_1.URI.file(platform_1.isWindows ? 'c:\\so𒀅meࠄ' : '/so𒀅meࠄ');
                const identifier = (0, workbenchTestServices_2.toTypedWorkingCopyId)(fileWithUnicode, ' test so𒀅meࠄ id \n');
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const meta = { etag: '678so𒀅meࠄ', orphaned: true };
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')), undefined, meta);
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 1);
                assert.strictEqual((0, fs_1.existsSync)(backupPath), true);
                assert.strictEqual((0, fs_1.readFileSync)(backupPath).toString(), toExpectedPreamble(identifier, 'test', meta));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('untitled file', async () => {
                const identifier = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(untitledFile);
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'untitled')).length, 1);
                assert.strictEqual((0, fs_1.existsSync)(backupPath), true);
                assert.strictEqual((0, fs_1.readFileSync)(backupPath).toString(), toExpectedPreamble(identifier, 'test'));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('text file (readable)', async () => {
                const identifier = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const model = (0, testTextModel_1.createTextModel)('test');
                await service.backup(identifier, (0, textfiles_1.toBufferOrReadable)(model.createSnapshot()));
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 1);
                assert.strictEqual((0, fs_1.existsSync)(backupPath), true);
                assert.strictEqual((0, fs_1.readFileSync)(backupPath).toString(), toExpectedPreamble(identifier, 'test'));
                assert.ok(service.hasBackupSync(identifier));
                model.dispose();
            });
            test('untitled file (readable)', async () => {
                const identifier = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(untitledFile);
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const model = (0, testTextModel_1.createTextModel)('test');
                await service.backup(identifier, (0, textfiles_1.toBufferOrReadable)(model.createSnapshot()));
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'untitled')).length, 1);
                assert.strictEqual((0, fs_1.existsSync)(backupPath), true);
                assert.strictEqual((0, fs_1.readFileSync)(backupPath).toString(), toExpectedPreamble(identifier, 'test'));
                model.dispose();
            });
            test('text file (large file, stream)', () => {
                const largeString = (new Array(30 * 1024)).join('Large String\n');
                return testLargeTextFile(largeString, (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString(largeString)));
            });
            test('text file (large file, readable)', async () => {
                const largeString = (new Array(30 * 1024)).join('Large String\n');
                const model = (0, testTextModel_1.createTextModel)(largeString);
                await testLargeTextFile(largeString, (0, textfiles_1.toBufferOrReadable)(model.createSnapshot()));
                model.dispose();
            });
            async function testLargeTextFile(largeString, buffer) {
                const identifier = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, buffer, undefined, { largeTest: true });
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 1);
                assert.strictEqual((0, fs_1.existsSync)(backupPath), true);
                assert.strictEqual((0, fs_1.readFileSync)(backupPath).toString(), toExpectedPreamble(identifier, largeString, { largeTest: true }));
                assert.ok(service.hasBackupSync(identifier));
            }
            test('untitled file (large file, readable)', async () => {
                const identifier = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(untitledFile);
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const largeString = (new Array(30 * 1024)).join('Large String\n');
                const model = (0, testTextModel_1.createTextModel)(largeString);
                await service.backup(identifier, (0, textfiles_1.toBufferOrReadable)(model.createSnapshot()));
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'untitled')).length, 1);
                assert.strictEqual((0, fs_1.existsSync)(backupPath), true);
                assert.strictEqual((0, fs_1.readFileSync)(backupPath).toString(), toExpectedPreamble(identifier, largeString));
                assert.ok(service.hasBackupSync(identifier));
                model.dispose();
            });
            test('cancellation', async () => {
                const identifier = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const cts = new cancellation_1.CancellationTokenSource();
                const promise = service.backup(identifier, undefined, undefined, undefined, cts.token);
                cts.cancel();
                await promise;
                assert.strictEqual((0, fs_1.existsSync)(backupPath), false);
                assert.ok(!service.hasBackupSync(identifier));
            });
            test('multiple', async () => {
                const identifier = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await Promise.all([
                    service.backup(identifier),
                    service.backup(identifier),
                    service.backup(identifier),
                    service.backup(identifier)
                ]);
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 1);
                assert.strictEqual((0, fs_1.existsSync)(backupPath), true);
                assert.strictEqual((0, fs_1.readFileSync)(backupPath).toString(), toExpectedPreamble(identifier));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('multiple same resource, different type id', async () => {
                const backupId1 = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const backupId2 = (0, workbenchTestServices_2.toTypedWorkingCopyId)(fooFile, 'type1');
                const backupId3 = (0, workbenchTestServices_2.toTypedWorkingCopyId)(fooFile, 'type2');
                await service.backup(backupId1);
                await service.backup(backupId2);
                await service.backup(backupId3);
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 3);
                for (const backupId of [backupId1, backupId2, backupId3]) {
                    const fooBackupPath = (0, path_1.join)(workspaceBackupPath, backupId.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId));
                    assert.strictEqual((0, fs_1.existsSync)(fooBackupPath), true);
                    assert.strictEqual((0, fs_1.readFileSync)(fooBackupPath).toString(), toExpectedPreamble(backupId));
                    assert.ok(service.hasBackupSync(backupId));
                }
            });
        });
        suite('discardBackup', () => {
            test('joining', async () => {
                const identifier = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 1);
                assert.ok(service.hasBackupSync(identifier));
                let backupJoined = false;
                service.joinBackups().then(() => backupJoined = true);
                const discardBackupPromise = service.discardBackup(identifier);
                assert.strictEqual(backupJoined, false);
                await discardBackupPromise;
                assert.strictEqual(backupJoined, true);
                assert.strictEqual((0, fs_1.existsSync)(backupPath), false);
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 0);
                assert.ok(!service.hasBackupSync(identifier));
            });
            test('text file', async () => {
                const identifier = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 1);
                assert.ok(service.hasBackupSync(identifier));
                await service.discardBackup(identifier);
                assert.strictEqual((0, fs_1.existsSync)(backupPath), false);
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 0);
                assert.ok(!service.hasBackupSync(identifier));
            });
            test('untitled file', async () => {
                const identifier = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(untitledFile);
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'untitled')).length, 1);
                await service.discardBackup(identifier);
                assert.strictEqual((0, fs_1.existsSync)(backupPath), false);
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'untitled')).length, 0);
            });
            test('multiple same resource, different type id', async () => {
                const backupId1 = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const backupId2 = (0, workbenchTestServices_2.toTypedWorkingCopyId)(fooFile, 'type1');
                const backupId3 = (0, workbenchTestServices_2.toTypedWorkingCopyId)(fooFile, 'type2');
                await service.backup(backupId1);
                await service.backup(backupId2);
                await service.backup(backupId3);
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 3);
                for (const backupId of [backupId1, backupId2, backupId3]) {
                    const backupPath = (0, path_1.join)(workspaceBackupPath, backupId.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId));
                    await service.discardBackup(backupId);
                    assert.strictEqual((0, fs_1.existsSync)(backupPath), false);
                }
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 0);
            });
        });
        suite('discardBackups (all)', () => {
            test('text file', async () => {
                const backupId1 = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const backupId2 = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(barFile);
                const backupId3 = (0, workbenchTestServices_2.toTypedWorkingCopyId)(barFile);
                await service.backup(backupId1, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 1);
                await service.backup(backupId2, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 2);
                await service.backup(backupId3, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 3);
                await service.discardBackups();
                for (const backupId of [backupId1, backupId2, backupId3]) {
                    const backupPath = (0, path_1.join)(workspaceBackupPath, backupId.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId));
                    assert.strictEqual((0, fs_1.existsSync)(backupPath), false);
                }
                assert.strictEqual((0, fs_1.existsSync)((0, path_1.join)(workspaceBackupPath, 'file')), false);
            });
            test('untitled file', async () => {
                const backupId = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(untitledFile);
                const backupPath = (0, path_1.join)(workspaceBackupPath, backupId.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId));
                await service.backup(backupId, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'untitled')).length, 1);
                await service.discardBackups();
                assert.strictEqual((0, fs_1.existsSync)(backupPath), false);
                assert.strictEqual((0, fs_1.existsSync)((0, path_1.join)(workspaceBackupPath, 'untitled')), false);
            });
            test('can backup after discarding all', async () => {
                await service.discardBackups();
                await service.backup((0, workbenchTestServices_2.toUntypedWorkingCopyId)(untitledFile), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((0, fs_1.existsSync)(workspaceBackupPath), true);
            });
        });
        suite('discardBackups (except some)', () => {
            test('text file', async () => {
                const backupId1 = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const backupId2 = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(barFile);
                const backupId3 = (0, workbenchTestServices_2.toTypedWorkingCopyId)(barFile);
                await service.backup(backupId1, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 1);
                await service.backup(backupId2, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 2);
                await service.backup(backupId3, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'file')).length, 3);
                await service.discardBackups({ except: [backupId2, backupId3] });
                let backupPath = (0, path_1.join)(workspaceBackupPath, backupId1.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId1));
                assert.strictEqual((0, fs_1.existsSync)(backupPath), false);
                backupPath = (0, path_1.join)(workspaceBackupPath, backupId2.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId2));
                assert.strictEqual((0, fs_1.existsSync)(backupPath), true);
                backupPath = (0, path_1.join)(workspaceBackupPath, backupId3.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId3));
                assert.strictEqual((0, fs_1.existsSync)(backupPath), true);
                await service.discardBackups({ except: [backupId1] });
                for (const backupId of [backupId1, backupId2, backupId3]) {
                    const backupPath = (0, path_1.join)(workspaceBackupPath, backupId.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId));
                    assert.strictEqual((0, fs_1.existsSync)(backupPath), false);
                }
            });
            test('untitled file', async () => {
                const backupId = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(untitledFile);
                const backupPath = (0, path_1.join)(workspaceBackupPath, backupId.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId));
                await service.backup(backupId, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((0, fs_1.existsSync)(backupPath), true);
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, 'untitled')).length, 1);
                await service.discardBackups({ except: [backupId] });
                assert.strictEqual((0, fs_1.existsSync)(backupPath), true);
            });
        });
        suite('getBackups', () => {
            test('text file', async () => {
                await service.backup((0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                await service.backup((0, workbenchTestServices_2.toTypedWorkingCopyId)(fooFile, 'type1'), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                await service.backup((0, workbenchTestServices_2.toTypedWorkingCopyId)(fooFile, 'type2'), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                let backups = await service.getBackups();
                assert.strictEqual(backups.length, 3);
                for (const backup of backups) {
                    if (backup.typeId === '') {
                        assert.strictEqual(backup.resource.toString(), fooFile.toString());
                    }
                    else if (backup.typeId === 'type1') {
                        assert.strictEqual(backup.resource.toString(), fooFile.toString());
                    }
                    else if (backup.typeId === 'type2') {
                        assert.strictEqual(backup.resource.toString(), fooFile.toString());
                    }
                    else {
                        assert.fail('Unexpected backup');
                    }
                }
                await service.backup((0, workbenchTestServices_2.toUntypedWorkingCopyId)(barFile), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                backups = await service.getBackups();
                assert.strictEqual(backups.length, 4);
            });
            test('untitled file', async () => {
                await service.backup((0, workbenchTestServices_2.toUntypedWorkingCopyId)(untitledFile), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                await service.backup((0, workbenchTestServices_2.toTypedWorkingCopyId)(untitledFile, 'type1'), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                await service.backup((0, workbenchTestServices_2.toTypedWorkingCopyId)(untitledFile, 'type2'), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                const backups = await service.getBackups();
                assert.strictEqual(backups.length, 3);
                for (const backup of backups) {
                    if (backup.typeId === '') {
                        assert.strictEqual(backup.resource.toString(), untitledFile.toString());
                    }
                    else if (backup.typeId === 'type1') {
                        assert.strictEqual(backup.resource.toString(), untitledFile.toString());
                    }
                    else if (backup.typeId === 'type2') {
                        assert.strictEqual(backup.resource.toString(), untitledFile.toString());
                    }
                    else {
                        assert.fail('Unexpected backup');
                    }
                }
            });
        });
        suite('resolve', () => {
            test('should restore the original contents (untitled file)', async () => {
                const contents = 'test\nand more stuff';
                await testResolveBackup(untitledFile, contents);
            });
            test('should restore the original contents (untitled file with metadata)', async () => {
                const contents = 'test\nand more stuff';
                const meta = {
                    etag: 'the Etag',
                    size: 666,
                    mtime: Date.now(),
                    orphaned: true
                };
                await testResolveBackup(untitledFile, contents, meta);
            });
            test('should restore the original contents (untitled file empty with metadata)', async () => {
                const contents = '';
                const meta = {
                    etag: 'the Etag',
                    size: 666,
                    mtime: Date.now(),
                    orphaned: true
                };
                await testResolveBackup(untitledFile, contents, meta);
            });
            test('should restore the original contents (untitled large file with metadata)', async () => {
                const contents = (new Array(30 * 1024)).join('Large String\n');
                const meta = {
                    etag: 'the Etag',
                    size: 666,
                    mtime: Date.now(),
                    orphaned: true
                };
                await testResolveBackup(untitledFile, contents, meta);
            });
            test('should restore the original contents (text file)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'consectetur ',
                    'adipiscing ßß elit'
                ].join('');
                await testResolveBackup(fooFile, contents);
            });
            test('should restore the original contents (text file - custom scheme)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'consectetur ',
                    'adipiscing ßß elit'
                ].join('');
                await testResolveBackup(customFile, contents);
            });
            test('should restore the original contents (text file with metadata)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooFile, contents, meta);
            });
            test('should restore the original contents (empty text file with metadata)', async () => {
                const contents = '';
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooFile, contents, meta);
            });
            test('should restore the original contents (large text file with metadata)', async () => {
                const contents = (new Array(30 * 1024)).join('Large String\n');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooFile, contents, meta);
            });
            test('should restore the original contents (text file with metadata changed once)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooFile, contents, meta);
                // Change meta and test again
                meta.size = 999;
                await testResolveBackup(fooFile, contents, meta);
            });
            test('should restore the original contents (text file with metadata and fragment URI)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(customFileWithFragment, contents, meta);
            });
            test('should restore the original contents (text file with space in name with metadata)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooBarFile, contents, meta);
            });
            test('should restore the original contents (text file with too large metadata to persist)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: (new Array(100 * 1024)).join('Large String'),
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooFile, contents, meta, true);
            });
            async function testResolveBackup(resource, contents, meta, expectNoMeta) {
                await doTestResolveBackup((0, workbenchTestServices_2.toUntypedWorkingCopyId)(resource), contents, meta, expectNoMeta);
                await doTestResolveBackup((0, workbenchTestServices_2.toTypedWorkingCopyId)(resource), contents, meta, expectNoMeta);
            }
            async function doTestResolveBackup(identifier, contents, meta, expectNoMeta) {
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents)), 1, meta);
                const backup = await service.resolve(identifier);
                assert.ok(backup);
                assert.strictEqual(contents, (await (0, buffer_1.streamToBuffer)(backup.value)).toString());
                if (expectNoMeta || !meta) {
                    assert.strictEqual(backup.meta, undefined);
                }
                else {
                    assert.ok(backup.meta);
                    assert.strictEqual(backup.meta.etag, meta.etag);
                    assert.strictEqual(backup.meta.size, meta.size);
                    assert.strictEqual(backup.meta.mtime, meta.mtime);
                    assert.strictEqual(backup.meta.orphaned, meta.orphaned);
                    assert.strictEqual(Object.keys(meta).length, Object.keys(backup.meta).length);
                }
            }
            test('should restore the original contents (text file with broken metadata)', async () => {
                await testShouldRestoreOriginalContentsWithBrokenBackup((0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile));
                await testShouldRestoreOriginalContentsWithBrokenBackup((0, workbenchTestServices_2.toTypedWorkingCopyId)(fooFile));
            });
            async function testShouldRestoreOriginalContentsWithBrokenBackup(identifier) {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents)), 1, meta);
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const fileContents = (0, fs_1.readFileSync)(backupPath).toString();
                assert.strictEqual(fileContents.indexOf(identifier.resource.toString()), 0);
                const metaIndex = fileContents.indexOf('{');
                const newFileContents = fileContents.substring(0, metaIndex) + '{{' + fileContents.substr(metaIndex);
                (0, fs_1.writeFileSync)(backupPath, newFileContents);
                const backup = await service.resolve(identifier);
                assert.ok(backup);
                assert.strictEqual(contents, (await (0, buffer_1.streamToBuffer)(backup.value)).toString());
                assert.strictEqual(backup.meta, undefined);
            }
            test('should update metadata from file into model when resolving', async () => {
                await testShouldUpdateMetaFromFileWhenResolving((0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile));
                await testShouldUpdateMetaFromFileWhenResolving((0, workbenchTestServices_2.toTypedWorkingCopyId)(fooFile));
            });
            async function testShouldUpdateMetaFromFileWhenResolving(identifier) {
                const contents = 'Foo Bar';
                const meta = {
                    etag: 'theEtagForThisMetadataTest',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                const updatedMeta = Object.assign(Object.assign({}, meta), { etag: meta.etag + meta.etag });
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents)), 1, meta);
                const backupPath = (0, path_1.join)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                // Simulate the condition of the backups model loading initially without
                // meta data information and then getting the meta data updated on the
                // first call to resolve the backup. We simulate this by explicitly changing
                // the meta data in the file and then verifying that the updated meta data
                // is persisted back into the model (verified via `hasBackupSync`).
                // This is not really something that would happen in real life because any
                // backup that is made via backup service will update the model accordingly.
                const originalFileContents = (0, fs_1.readFileSync)(backupPath).toString();
                (0, fs_1.writeFileSync)(backupPath, originalFileContents.replace(meta.etag, updatedMeta.etag));
                await service.resolve(identifier);
                assert.strictEqual(service.hasBackupSync(identifier, undefined, meta), false);
                assert.strictEqual(service.hasBackupSync(identifier, undefined, updatedMeta), true);
                (0, fs_1.writeFileSync)(backupPath, originalFileContents);
                await service.getBackups();
                assert.strictEqual(service.hasBackupSync(identifier, undefined, meta), true);
                assert.strictEqual(service.hasBackupSync(identifier, undefined, updatedMeta), false);
            }
            test('should ignore invalid backups (empty file)', async () => {
                const contents = 'test\nand more stuff';
                await service.backup((0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents)), 1);
                let backup = await service.resolve((0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile));
                assert.ok(backup);
                await service.fileService.writeFile(service.toBackupResource((0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile)), buffer_1.VSBuffer.fromString(''));
                backup = await service.resolve((0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile));
                assert.ok(!backup);
            });
            test('should ignore invalid backups (no preamble)', async () => {
                const contents = 'testand more stuff';
                await service.backup((0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents)), 1);
                let backup = await service.resolve((0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile));
                assert.ok(backup);
                await service.fileService.writeFile(service.toBackupResource((0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile)), buffer_1.VSBuffer.fromString(contents));
                backup = await service.resolve((0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile));
                assert.ok(!backup);
            });
            test('file with binary data', async () => {
                const identifier = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const sourceDir = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures');
                const buffer = await pfs_1.Promises.readFile((0, path_1.join)(sourceDir, 'binary.txt'));
                const hash = (0, crypto_1.createHash)('md5').update(buffer).digest('base64');
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.wrap(buffer)), undefined, { binaryTest: 'true' });
                const backup = await service.resolve((0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile));
                assert.ok(backup);
                const backupBuffer = await (0, stream_1.consumeStream)(backup.value, chunks => buffer_1.VSBuffer.concat(chunks));
                assert.strictEqual(backupBuffer.buffer.byteLength, buffer.byteLength);
                const backupHash = (0, crypto_1.createHash)('md5').update(backupBuffer.buffer).digest('base64');
                assert.strictEqual(hash, backupHash);
            });
        });
        suite('WorkingCopyBackupsModel', () => {
            test('simple', async () => {
                const model = await workingCopyBackupService_1.WorkingCopyBackupsModel.create(uri_1.URI.file(workspaceBackupPath), service.fileService);
                const resource1 = uri_1.URI.file('test.html');
                assert.strictEqual(model.has(resource1), false);
                model.add(resource1);
                assert.strictEqual(model.has(resource1), true);
                assert.strictEqual(model.has(resource1, 0), true);
                assert.strictEqual(model.has(resource1, 1), false);
                assert.strictEqual(model.has(resource1, 1, { foo: 'bar' }), false);
                model.remove(resource1);
                assert.strictEqual(model.has(resource1), false);
                model.add(resource1);
                assert.strictEqual(model.has(resource1), true);
                assert.strictEqual(model.has(resource1, 0), true);
                assert.strictEqual(model.has(resource1, 1), false);
                model.clear();
                assert.strictEqual(model.has(resource1), false);
                model.add(resource1, 1);
                assert.strictEqual(model.has(resource1), true);
                assert.strictEqual(model.has(resource1, 0), false);
                assert.strictEqual(model.has(resource1, 1), true);
                const resource2 = uri_1.URI.file('test1.html');
                const resource3 = uri_1.URI.file('test2.html');
                const resource4 = uri_1.URI.file('test3.html');
                model.add(resource2);
                model.add(resource3);
                model.add(resource4, undefined, { foo: 'bar' });
                assert.strictEqual(model.has(resource1), true);
                assert.strictEqual(model.has(resource2), true);
                assert.strictEqual(model.has(resource3), true);
                assert.strictEqual(model.has(resource4), true);
                assert.strictEqual(model.has(resource4, undefined, { foo: 'bar' }), true);
                assert.strictEqual(model.has(resource4, undefined, { bar: 'foo' }), false);
                model.update(resource4, { foo: 'nothing' });
                assert.strictEqual(model.has(resource4, undefined, { foo: 'nothing' }), true);
                assert.strictEqual(model.has(resource4, undefined, { foo: 'bar' }), false);
                model.update(resource4);
                assert.strictEqual(model.has(resource4), true);
                assert.strictEqual(model.has(resource4, undefined, { foo: 'nothing' }), false);
                const resource5 = uri_1.URI.file('test4.html');
                model.move(resource4, resource5);
                assert.strictEqual(model.has(resource4), false);
                assert.strictEqual(model.has(resource5), true);
            });
            test('create', async () => {
                const fooBackupPath = (0, path_1.join)(workspaceBackupPath, fooFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)((0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile)));
                await pfs_1.Promises.mkdir((0, path_1.dirname)(fooBackupPath), { recursive: true });
                (0, fs_1.writeFileSync)(fooBackupPath, 'foo');
                const model = await workingCopyBackupService_1.WorkingCopyBackupsModel.create(uri_1.URI.file(workspaceBackupPath), service.fileService);
                assert.strictEqual(model.has(uri_1.URI.file(fooBackupPath)), true);
            });
            test('get', async () => {
                const model = await workingCopyBackupService_1.WorkingCopyBackupsModel.create(uri_1.URI.file(workspaceBackupPath), service.fileService);
                assert.deepStrictEqual(model.get(), []);
                const file1 = uri_1.URI.file('/root/file/foo.html');
                const file2 = uri_1.URI.file('/root/file/bar.html');
                const untitled = uri_1.URI.file('/root/untitled/bar.html');
                model.add(file1);
                model.add(file2);
                model.add(untitled);
                assert.deepStrictEqual(model.get().map(f => f.fsPath), [file1.fsPath, file2.fsPath, untitled.fsPath]);
            });
        });
        suite('Hash migration', () => {
            test('works', async () => {
                const fooBackupId = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const untitledBackupId = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(untitledFile);
                const customBackupId = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(customFile);
                const fooBackupPath = (0, path_1.join)(workspaceBackupPath, fooFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(fooBackupId));
                const untitledBackupPath = (0, path_1.join)(workspaceBackupPath, untitledFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(untitledBackupId));
                const customFileBackupPath = (0, path_1.join)(workspaceBackupPath, customFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(customBackupId));
                // Prepare backups of the old MD5 hash format
                (0, fs_1.mkdirSync)((0, path_1.join)(workspaceBackupPath, fooFile.scheme), { recursive: true });
                (0, fs_1.mkdirSync)((0, path_1.join)(workspaceBackupPath, untitledFile.scheme), { recursive: true });
                (0, fs_1.mkdirSync)((0, path_1.join)(workspaceBackupPath, customFile.scheme), { recursive: true });
                (0, fs_1.writeFileSync)((0, path_1.join)(workspaceBackupPath, fooFile.scheme, '8a8589a2f1c9444b89add38166f50229'), `${fooFile.toString()}\ntest file`);
                (0, fs_1.writeFileSync)((0, path_1.join)(workspaceBackupPath, untitledFile.scheme, '13264068d108c6901b3592ea654fcd57'), `${untitledFile.toString()}\ntest untitled`);
                (0, fs_1.writeFileSync)((0, path_1.join)(workspaceBackupPath, customFile.scheme, 'bf018572af7b38746b502893bd0adf6c'), `${customFile.toString()}\ntest custom`);
                service.reinitialize(uri_1.URI.file(workspaceBackupPath));
                const backups = await service.getBackups();
                assert.strictEqual(backups.length, 3);
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, fooFile)));
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, untitledFile)));
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, customFile)));
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, fooFile.scheme)).length, 1);
                assert.strictEqual((0, fs_1.existsSync)(fooBackupPath), true);
                assert.strictEqual((0, fs_1.readFileSync)(fooBackupPath).toString(), `${fooFile.toString()}\ntest file`);
                assert.ok(service.hasBackupSync(fooBackupId));
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, untitledFile.scheme)).length, 1);
                assert.strictEqual((0, fs_1.existsSync)(untitledBackupPath), true);
                assert.strictEqual((0, fs_1.readFileSync)(untitledBackupPath).toString(), `${untitledFile.toString()}\ntest untitled`);
                assert.ok(service.hasBackupSync(untitledBackupId));
                assert.strictEqual((0, pfs_1.readdirSync)((0, path_1.join)(workspaceBackupPath, customFile.scheme)).length, 1);
                assert.strictEqual((0, fs_1.existsSync)(customFileBackupPath), true);
                assert.strictEqual((0, fs_1.readFileSync)(customFileBackupPath).toString(), `${customFile.toString()}\ntest custom`);
                assert.ok(service.hasBackupSync(customBackupId));
            });
        });
        suite('typeId migration', () => {
            test('works (when meta is missing)', async () => {
                const fooBackupId = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const untitledBackupId = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(untitledFile);
                const customBackupId = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(customFile);
                const fooBackupPath = (0, path_1.join)(workspaceBackupPath, fooFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(fooBackupId));
                const untitledBackupPath = (0, path_1.join)(workspaceBackupPath, untitledFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(untitledBackupId));
                const customFileBackupPath = (0, path_1.join)(workspaceBackupPath, customFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(customBackupId));
                // Prepare backups of the old format without meta
                (0, fs_1.mkdirSync)((0, path_1.join)(workspaceBackupPath, fooFile.scheme), { recursive: true });
                (0, fs_1.mkdirSync)((0, path_1.join)(workspaceBackupPath, untitledFile.scheme), { recursive: true });
                (0, fs_1.mkdirSync)((0, path_1.join)(workspaceBackupPath, customFile.scheme), { recursive: true });
                (0, fs_1.writeFileSync)(fooBackupPath, `${fooFile.toString()}\ntest file`);
                (0, fs_1.writeFileSync)(untitledBackupPath, `${untitledFile.toString()}\ntest untitled`);
                (0, fs_1.writeFileSync)(customFileBackupPath, `${customFile.toString()}\ntest custom`);
                service.reinitialize(uri_1.URI.file(workspaceBackupPath));
                const backups = await service.getBackups();
                assert.strictEqual(backups.length, 3);
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, fooFile)));
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, untitledFile)));
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, customFile)));
                assert.ok(backups.every(backup => backup.typeId === ''));
            });
            test('works (when typeId in meta is missing)', async () => {
                const fooBackupId = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(fooFile);
                const untitledBackupId = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(untitledFile);
                const customBackupId = (0, workbenchTestServices_2.toUntypedWorkingCopyId)(customFile);
                const fooBackupPath = (0, path_1.join)(workspaceBackupPath, fooFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(fooBackupId));
                const untitledBackupPath = (0, path_1.join)(workspaceBackupPath, untitledFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(untitledBackupId));
                const customFileBackupPath = (0, path_1.join)(workspaceBackupPath, customFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(customBackupId));
                // Prepare backups of the old format without meta
                (0, fs_1.mkdirSync)((0, path_1.join)(workspaceBackupPath, fooFile.scheme), { recursive: true });
                (0, fs_1.mkdirSync)((0, path_1.join)(workspaceBackupPath, untitledFile.scheme), { recursive: true });
                (0, fs_1.mkdirSync)((0, path_1.join)(workspaceBackupPath, customFile.scheme), { recursive: true });
                (0, fs_1.writeFileSync)(fooBackupPath, `${fooFile.toString()} ${JSON.stringify({ foo: 'bar' })}\ntest file`);
                (0, fs_1.writeFileSync)(untitledBackupPath, `${untitledFile.toString()} ${JSON.stringify({ foo: 'bar' })}\ntest untitled`);
                (0, fs_1.writeFileSync)(customFileBackupPath, `${customFile.toString()} ${JSON.stringify({ foo: 'bar' })}\ntest custom`);
                service.reinitialize(uri_1.URI.file(workspaceBackupPath));
                const backups = await service.getBackups();
                assert.strictEqual(backups.length, 3);
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, fooFile)));
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, untitledFile)));
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, customFile)));
                assert.ok(backups.every(backup => backup.typeId === ''));
            });
        });
    });
});
//# sourceMappingURL=workingCopyBackupService.test.js.map