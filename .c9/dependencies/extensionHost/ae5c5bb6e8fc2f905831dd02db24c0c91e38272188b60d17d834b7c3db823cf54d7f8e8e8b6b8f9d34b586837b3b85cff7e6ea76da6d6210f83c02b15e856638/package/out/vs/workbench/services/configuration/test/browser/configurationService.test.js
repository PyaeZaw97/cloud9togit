/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "vs/base/common/uri", "vs/platform/registry/common/platform", "vs/platform/environment/common/environment", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/services/configuration/browser/configurationService", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/services/resolverService", "vs/workbench/services/textmodelResolver/common/textModelResolverService", "vs/workbench/services/configuration/common/jsonEditingService", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/platform", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/platform/sign/browser/signService", "vs/platform/userData/common/fileUserDataProvider", "vs/workbench/services/keybinding/common/keybindingEditing", "vs/workbench/services/environment/common/environmentService", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/workbench/services/remote/browser/remoteAgentService", "vs/platform/remote/browser/remoteAuthorityResolverService", "vs/base/common/hash", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, sinon, uri_1, platform_1, environment_1, configurationRegistry_1, configurationService_1, files_1, workspace_1, configuration_1, workbenchTestServices_1, textfiles_1, resolverService_1, textModelResolverService_1, jsonEditingService_1, network_1, resources_1, platform_2, remoteAgentService_1, fileService_1, log_1, signService_1, fileUserDataProvider_1, keybindingEditing_1, environmentService_1, async_1, buffer_1, lifecycle_1, event_1, uriIdentityService_1, inMemoryFilesystemProvider_1, remoteAgentService_2, remoteAuthorityResolverService_1, hash_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getWorkspaceIdentifier = exports.ConfigurationCache = void 0;
    function convertToWorkspacePayload(folder) {
        return {
            id: (0, hash_1.hash)(folder.toString()).toString(16),
            uri: folder
        };
    }
    class ConfigurationCache {
        needsCaching(resource) { return false; }
        async read() { return ''; }
        async write() { }
        async remove() { }
    }
    exports.ConfigurationCache = ConfigurationCache;
    const ROOT = uri_1.URI.file('tests').with({ scheme: 'vscode-tests' });
    suite('WorkspaceContextService - Folder', () => {
        let folderName = 'Folder A', folder, testObject;
        const disposables = new lifecycle_1.DisposableStore();
        setup(async () => {
            const logService = new log_1.NullLogService();
            const fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            fileService.registerProvider(ROOT.scheme, fileSystemProvider);
            folder = (0, resources_1.joinPath)(ROOT, folderName);
            await fileService.createFolder(folder);
            const environmentService = workbenchTestServices_1.TestEnvironmentService;
            fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, new log_1.NullLogService())));
            testObject = disposables.add(new configurationService_1.WorkspaceService({ configurationCache: new ConfigurationCache() }, environmentService, fileService, new remoteAgentService_2.RemoteAgentService(null, environmentService, workbenchTestServices_2.TestProductService, new remoteAuthorityResolverService_1.RemoteAuthorityResolverService(undefined, undefined), new signService_1.SignService(undefined), new log_1.NullLogService()), new uriIdentityService_1.UriIdentityService(fileService), new log_1.NullLogService()));
            await testObject.initialize(convertToWorkspacePayload(folder));
        });
        teardown(() => disposables.clear());
        test('getWorkspace()', () => {
            const actual = testObject.getWorkspace();
            assert.strictEqual(actual.folders.length, 1);
            assert.strictEqual(actual.folders[0].uri.path, folder.path);
            assert.strictEqual(actual.folders[0].name, folderName);
            assert.strictEqual(actual.folders[0].index, 0);
            assert.ok(!actual.configuration);
        });
        test('getWorkbenchState()', () => {
            const actual = testObject.getWorkbenchState();
            assert.strictEqual(actual, 2 /* WorkbenchState.FOLDER */);
        });
        test('getWorkspaceFolder()', () => {
            const actual = testObject.getWorkspaceFolder((0, resources_1.joinPath)(folder, 'a'));
            assert.strictEqual(actual, testObject.getWorkspace().folders[0]);
        });
        test('getWorkspaceFolder() - queries', async () => {
            const logService = new log_1.NullLogService();
            const fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            fileService.registerProvider(ROOT.scheme, fileSystemProvider);
            const folder = (0, resources_1.joinPath)(ROOT, folderName).with({ query: 'myquery=1' });
            await fileService.createFolder(folder);
            const environmentService = workbenchTestServices_1.TestEnvironmentService;
            fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, new log_1.NullLogService())));
            const testObject = disposables.add(new configurationService_1.WorkspaceService({ configurationCache: new ConfigurationCache() }, environmentService, fileService, new remoteAgentService_2.RemoteAgentService(null, environmentService, workbenchTestServices_2.TestProductService, new remoteAuthorityResolverService_1.RemoteAuthorityResolverService(undefined, undefined), new signService_1.SignService(undefined), new log_1.NullLogService()), new uriIdentityService_1.UriIdentityService(fileService), new log_1.NullLogService()));
            await testObject.initialize(convertToWorkspacePayload(folder));
            const actual = testObject.getWorkspaceFolder((0, resources_1.joinPath)(folder, 'a'));
            assert.strictEqual(actual, testObject.getWorkspace().folders[0]);
        });
        test('isCurrentWorkspace() => true', () => {
            assert.ok(testObject.isCurrentWorkspace(folder));
        });
        test('isCurrentWorkspace() => false', () => {
            assert.ok(!testObject.isCurrentWorkspace((0, resources_1.joinPath)((0, resources_1.dirname)(folder), 'abc')));
        });
        test('workspace is complete', () => testObject.getCompleteWorkspace());
    });
    suite('WorkspaceContextService - Workspace', () => {
        let testObject;
        const disposables = new lifecycle_1.DisposableStore();
        setup(async () => {
            const logService = new log_1.NullLogService();
            const fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            fileService.registerProvider(ROOT.scheme, fileSystemProvider);
            const appSettingsHome = (0, resources_1.joinPath)(ROOT, 'user');
            const folderA = (0, resources_1.joinPath)(ROOT, 'a');
            const folderB = (0, resources_1.joinPath)(ROOT, 'b');
            const configResource = (0, resources_1.joinPath)(ROOT, 'vsctests.code-workspace');
            const workspace = { folders: [{ path: folderA.path }, { path: folderB.path }] };
            await fileService.createFolder(appSettingsHome);
            await fileService.createFolder(folderA);
            await fileService.createFolder(folderB);
            await fileService.writeFile(configResource, buffer_1.VSBuffer.fromString(JSON.stringify(workspace, null, '\t')));
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const environmentService = workbenchTestServices_1.TestEnvironmentService;
            const remoteAgentService = disposables.add(instantiationService.createInstance(remoteAgentService_2.RemoteAgentService, null));
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
            fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, new log_1.NullLogService())));
            testObject = disposables.add(new configurationService_1.WorkspaceService({ configurationCache: new ConfigurationCache() }, environmentService, fileService, remoteAgentService, new uriIdentityService_1.UriIdentityService(fileService), new log_1.NullLogService()));
            instantiationService.stub(workspace_1.IWorkspaceContextService, testObject);
            instantiationService.stub(configuration_1.IConfigurationService, testObject);
            instantiationService.stub(environment_1.IEnvironmentService, environmentService);
            await testObject.initialize(getWorkspaceIdentifier(configResource));
            testObject.acquireInstantiationService(instantiationService);
        });
        teardown(() => disposables.clear());
        test('workspace folders', () => {
            const actual = testObject.getWorkspace().folders;
            assert.strictEqual(actual.length, 2);
            assert.strictEqual((0, resources_1.basename)(actual[0].uri), 'a');
            assert.strictEqual((0, resources_1.basename)(actual[1].uri), 'b');
        });
        test('getWorkbenchState()', () => {
            const actual = testObject.getWorkbenchState();
            assert.strictEqual(actual, 3 /* WorkbenchState.WORKSPACE */);
        });
        test('workspace is complete', () => testObject.getCompleteWorkspace());
    });
    suite('WorkspaceContextService - Workspace Editing', () => {
        let testObject, fileService;
        const disposables = new lifecycle_1.DisposableStore();
        setup(async () => {
            const logService = new log_1.NullLogService();
            fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            fileService.registerProvider(ROOT.scheme, fileSystemProvider);
            const appSettingsHome = (0, resources_1.joinPath)(ROOT, 'user');
            const folderA = (0, resources_1.joinPath)(ROOT, 'a');
            const folderB = (0, resources_1.joinPath)(ROOT, 'b');
            const configResource = (0, resources_1.joinPath)(ROOT, 'vsctests.code-workspace');
            const workspace = { folders: [{ path: folderA.path }, { path: folderB.path }] };
            await fileService.createFolder(appSettingsHome);
            await fileService.createFolder(folderA);
            await fileService.createFolder(folderB);
            await fileService.writeFile(configResource, buffer_1.VSBuffer.fromString(JSON.stringify(workspace, null, '\t')));
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const environmentService = workbenchTestServices_1.TestEnvironmentService;
            const remoteAgentService = instantiationService.createInstance(remoteAgentService_2.RemoteAgentService, null);
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
            fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, new log_1.NullLogService())));
            testObject = disposables.add(new configurationService_1.WorkspaceService({ configurationCache: new ConfigurationCache() }, environmentService, fileService, remoteAgentService, new uriIdentityService_1.UriIdentityService(fileService), new log_1.NullLogService()));
            instantiationService.stub(files_1.IFileService, fileService);
            instantiationService.stub(workspace_1.IWorkspaceContextService, testObject);
            instantiationService.stub(configuration_1.IConfigurationService, testObject);
            instantiationService.stub(environment_1.IEnvironmentService, environmentService);
            await testObject.initialize(getWorkspaceIdentifier(configResource));
            instantiationService.stub(textfiles_1.ITextFileService, disposables.add(instantiationService.createInstance(workbenchTestServices_1.TestTextFileService)));
            instantiationService.stub(resolverService_1.ITextModelService, disposables.add(instantiationService.createInstance(textModelResolverService_1.TextModelResolverService)));
            testObject.acquireInstantiationService(instantiationService);
        });
        teardown(() => disposables.clear());
        test('add folders', async () => {
            await testObject.addFolders([{ uri: (0, resources_1.joinPath)(ROOT, 'd') }, { uri: (0, resources_1.joinPath)(ROOT, 'c') }]);
            const actual = testObject.getWorkspace().folders;
            assert.strictEqual(actual.length, 4);
            assert.strictEqual((0, resources_1.basename)(actual[0].uri), 'a');
            assert.strictEqual((0, resources_1.basename)(actual[1].uri), 'b');
            assert.strictEqual((0, resources_1.basename)(actual[2].uri), 'd');
            assert.strictEqual((0, resources_1.basename)(actual[3].uri), 'c');
        });
        test('add folders (at specific index)', async () => {
            await testObject.addFolders([{ uri: (0, resources_1.joinPath)(ROOT, 'd') }, { uri: (0, resources_1.joinPath)(ROOT, 'c') }], 0);
            const actual = testObject.getWorkspace().folders;
            assert.strictEqual(actual.length, 4);
            assert.strictEqual((0, resources_1.basename)(actual[0].uri), 'd');
            assert.strictEqual((0, resources_1.basename)(actual[1].uri), 'c');
            assert.strictEqual((0, resources_1.basename)(actual[2].uri), 'a');
            assert.strictEqual((0, resources_1.basename)(actual[3].uri), 'b');
        });
        test('add folders (at specific wrong index)', async () => {
            await testObject.addFolders([{ uri: (0, resources_1.joinPath)(ROOT, 'd') }, { uri: (0, resources_1.joinPath)(ROOT, 'c') }], 10);
            const actual = testObject.getWorkspace().folders;
            assert.strictEqual(actual.length, 4);
            assert.strictEqual((0, resources_1.basename)(actual[0].uri), 'a');
            assert.strictEqual((0, resources_1.basename)(actual[1].uri), 'b');
            assert.strictEqual((0, resources_1.basename)(actual[2].uri), 'd');
            assert.strictEqual((0, resources_1.basename)(actual[3].uri), 'c');
        });
        test('add folders (with name)', async () => {
            await testObject.addFolders([{ uri: (0, resources_1.joinPath)(ROOT, 'd'), name: 'DDD' }, { uri: (0, resources_1.joinPath)(ROOT, 'c'), name: 'CCC' }]);
            const actual = testObject.getWorkspace().folders;
            assert.strictEqual(actual.length, 4);
            assert.strictEqual((0, resources_1.basename)(actual[0].uri), 'a');
            assert.strictEqual((0, resources_1.basename)(actual[1].uri), 'b');
            assert.strictEqual((0, resources_1.basename)(actual[2].uri), 'd');
            assert.strictEqual((0, resources_1.basename)(actual[3].uri), 'c');
            assert.strictEqual(actual[2].name, 'DDD');
            assert.strictEqual(actual[3].name, 'CCC');
        });
        test('add folders triggers change event', async () => {
            const target = sinon.spy();
            testObject.onWillChangeWorkspaceFolders(target);
            testObject.onDidChangeWorkspaceFolders(target);
            const addedFolders = [{ uri: (0, resources_1.joinPath)(ROOT, 'd') }, { uri: (0, resources_1.joinPath)(ROOT, 'c') }];
            await testObject.addFolders(addedFolders);
            assert.strictEqual(target.callCount, 2, `Should be called only once but called ${target.callCount} times`);
            const actual_1 = target.args[1][0];
            assert.deepStrictEqual(actual_1.added.map(r => r.uri.toString()), addedFolders.map(a => a.uri.toString()));
            assert.deepStrictEqual(actual_1.removed, []);
            assert.deepStrictEqual(actual_1.changed, []);
        });
        test('remove folders', async () => {
            await testObject.removeFolders([testObject.getWorkspace().folders[0].uri]);
            const actual = testObject.getWorkspace().folders;
            assert.strictEqual(actual.length, 1);
            assert.strictEqual((0, resources_1.basename)(actual[0].uri), 'b');
        });
        test('remove folders triggers change event', async () => {
            const target = sinon.spy();
            testObject.onWillChangeWorkspaceFolders(target);
            testObject.onDidChangeWorkspaceFolders(target);
            const removedFolder = testObject.getWorkspace().folders[0];
            await testObject.removeFolders([removedFolder.uri]);
            assert.strictEqual(target.callCount, 2, `Should be called only once but called ${target.callCount} times`);
            const actual_1 = target.args[1][0];
            assert.deepStrictEqual(actual_1.added, []);
            assert.deepStrictEqual(actual_1.removed.map(r => r.uri.toString()), [removedFolder.uri.toString()]);
            assert.deepStrictEqual(actual_1.changed.map(c => c.uri.toString()), [testObject.getWorkspace().folders[0].uri.toString()]);
        });
        test('remove folders and add them back by writing into the file', async () => {
            const folders = testObject.getWorkspace().folders;
            await testObject.removeFolders([folders[0].uri]);
            const promise = new Promise((resolve, reject) => {
                testObject.onDidChangeWorkspaceFolders(actual => {
                    try {
                        assert.deepStrictEqual(actual.added.map(r => r.uri.toString()), [folders[0].uri.toString()]);
                        resolve();
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            });
            const workspace = { folders: [{ path: folders[0].uri.path }, { path: folders[1].uri.path }] };
            await fileService.writeFile(testObject.getWorkspace().configuration, buffer_1.VSBuffer.fromString(JSON.stringify(workspace, null, '\t')));
            await promise;
        });
        test('update folders (remove last and add to end)', async () => {
            const target = sinon.spy();
            testObject.onWillChangeWorkspaceFolders(target);
            testObject.onDidChangeWorkspaceFolders(target);
            const addedFolders = [{ uri: (0, resources_1.joinPath)(ROOT, 'd') }, { uri: (0, resources_1.joinPath)(ROOT, 'c') }];
            const removedFolders = [testObject.getWorkspace().folders[1]].map(f => f.uri);
            await testObject.updateFolders(addedFolders, removedFolders);
            assert.strictEqual(target.callCount, 2, `Should be called only once but called ${target.callCount} times`);
            const actual_1 = target.args[1][0];
            assert.deepStrictEqual(actual_1.added.map(r => r.uri.toString()), addedFolders.map(a => a.uri.toString()));
            assert.deepStrictEqual(actual_1.removed.map(r_1 => r_1.uri.toString()), removedFolders.map(a_1 => a_1.toString()));
            assert.deepStrictEqual(actual_1.changed, []);
        });
        test('update folders (rename first via add and remove)', async () => {
            const target = sinon.spy();
            testObject.onWillChangeWorkspaceFolders(target);
            testObject.onDidChangeWorkspaceFolders(target);
            const addedFolders = [{ uri: (0, resources_1.joinPath)(ROOT, 'a'), name: 'The Folder' }];
            const removedFolders = [testObject.getWorkspace().folders[0]].map(f => f.uri);
            await testObject.updateFolders(addedFolders, removedFolders, 0);
            assert.strictEqual(target.callCount, 2, `Should be called only once but called ${target.callCount} times`);
            const actual_1 = target.args[1][0];
            assert.deepStrictEqual(actual_1.added, []);
            assert.deepStrictEqual(actual_1.removed, []);
            assert.deepStrictEqual(actual_1.changed.map(r => r.uri.toString()), removedFolders.map(a => a.toString()));
        });
        test('update folders (remove first and add to end)', async () => {
            const target = sinon.spy();
            testObject.onWillChangeWorkspaceFolders(target);
            testObject.onDidChangeWorkspaceFolders(target);
            const addedFolders = [{ uri: (0, resources_1.joinPath)(ROOT, 'd') }, { uri: (0, resources_1.joinPath)(ROOT, 'c') }];
            const removedFolders = [testObject.getWorkspace().folders[0]].map(f => f.uri);
            const changedFolders = [testObject.getWorkspace().folders[1]].map(f => f.uri);
            await testObject.updateFolders(addedFolders, removedFolders);
            assert.strictEqual(target.callCount, 2, `Should be called only once but called ${target.callCount} times`);
            const actual_1 = target.args[1][0];
            assert.deepStrictEqual(actual_1.added.map(r => r.uri.toString()), addedFolders.map(a => a.uri.toString()));
            assert.deepStrictEqual(actual_1.removed.map(r_1 => r_1.uri.toString()), removedFolders.map(a_1 => a_1.toString()));
            assert.deepStrictEqual(actual_1.changed.map(r_2 => r_2.uri.toString()), changedFolders.map(a_2 => a_2.toString()));
        });
        test('reorder folders trigger change event', async () => {
            const target = sinon.spy();
            testObject.onWillChangeWorkspaceFolders(target);
            testObject.onDidChangeWorkspaceFolders(target);
            const workspace = { folders: [{ path: testObject.getWorkspace().folders[1].uri.path }, { path: testObject.getWorkspace().folders[0].uri.path }] };
            await fileService.writeFile(testObject.getWorkspace().configuration, buffer_1.VSBuffer.fromString(JSON.stringify(workspace, null, '\t')));
            await testObject.reloadConfiguration();
            assert.strictEqual(target.callCount, 2, `Should be called only once but called ${target.callCount} times`);
            const actual_1 = target.args[1][0];
            assert.deepStrictEqual(actual_1.added, []);
            assert.deepStrictEqual(actual_1.removed, []);
            assert.deepStrictEqual(actual_1.changed.map(c => c.uri.toString()), testObject.getWorkspace().folders.map(f => f.uri.toString()).reverse());
        });
        test('rename folders trigger change event', async () => {
            const target = sinon.spy();
            testObject.onWillChangeWorkspaceFolders(target);
            testObject.onDidChangeWorkspaceFolders(target);
            const workspace = { folders: [{ path: testObject.getWorkspace().folders[0].uri.path, name: '1' }, { path: testObject.getWorkspace().folders[1].uri.path }] };
            fileService.writeFile(testObject.getWorkspace().configuration, buffer_1.VSBuffer.fromString(JSON.stringify(workspace, null, '\t')));
            await testObject.reloadConfiguration();
            assert.strictEqual(target.callCount, 2, `Should be called only once but called ${target.callCount} times`);
            const actual_1 = target.args[1][0];
            assert.deepStrictEqual(actual_1.added, []);
            assert.deepStrictEqual(actual_1.removed, []);
            assert.deepStrictEqual(actual_1.changed.map(c => c.uri.toString()), [testObject.getWorkspace().folders[0].uri.toString()]);
        });
    });
    suite('WorkspaceService - Initialization', () => {
        let configResource, testObject, fileService, environmentService;
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        const disposables = new lifecycle_1.DisposableStore();
        suiteSetup(() => {
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'initialization.testSetting1': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 4 /* ConfigurationScope.RESOURCE */
                    },
                    'initialization.testSetting2': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 4 /* ConfigurationScope.RESOURCE */
                    }
                }
            });
        });
        setup(async () => {
            const logService = new log_1.NullLogService();
            fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            fileService.registerProvider(ROOT.scheme, fileSystemProvider);
            const appSettingsHome = (0, resources_1.joinPath)(ROOT, 'user');
            const folderA = (0, resources_1.joinPath)(ROOT, 'a');
            const folderB = (0, resources_1.joinPath)(ROOT, 'b');
            configResource = (0, resources_1.joinPath)(ROOT, 'vsctests.code-workspace');
            const workspace = { folders: [{ path: folderA.path }, { path: folderB.path }] };
            await fileService.createFolder(appSettingsHome);
            await fileService.createFolder(folderA);
            await fileService.createFolder(folderB);
            await fileService.writeFile(configResource, buffer_1.VSBuffer.fromString(JSON.stringify(workspace, null, '\t')));
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            environmentService = workbenchTestServices_1.TestEnvironmentService;
            const remoteAgentService = instantiationService.createInstance(remoteAgentService_2.RemoteAgentService, null);
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
            fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, new log_1.NullLogService())));
            testObject = disposables.add(new configurationService_1.WorkspaceService({ configurationCache: new ConfigurationCache() }, environmentService, fileService, remoteAgentService, new uriIdentityService_1.UriIdentityService(fileService), new log_1.NullLogService()));
            instantiationService.stub(files_1.IFileService, fileService);
            instantiationService.stub(workspace_1.IWorkspaceContextService, testObject);
            instantiationService.stub(configuration_1.IConfigurationService, testObject);
            instantiationService.stub(environment_1.IEnvironmentService, environmentService);
            await testObject.initialize({ id: '' });
            instantiationService.stub(textfiles_1.ITextFileService, instantiationService.createInstance(workbenchTestServices_1.TestTextFileService));
            instantiationService.stub(resolverService_1.ITextModelService, instantiationService.createInstance(textModelResolverService_1.TextModelResolverService));
            testObject.acquireInstantiationService(instantiationService);
        });
        teardown(() => disposables.clear());
        (platform_2.isMacintosh ? test.skip : test)('initialize a folder workspace from an empty workspace with no configuration changes', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "initialization.testSetting1": "userValue" }'));
            await testObject.reloadConfiguration();
            const target = sinon.spy();
            testObject.onDidChangeWorkbenchState(target);
            testObject.onDidChangeWorkspaceName(target);
            testObject.onWillChangeWorkspaceFolders(target);
            testObject.onDidChangeWorkspaceFolders(target);
            testObject.onDidChangeConfiguration(target);
            const folder = (0, resources_1.joinPath)(ROOT, 'a');
            await testObject.initialize(convertToWorkspacePayload(folder));
            assert.strictEqual(testObject.getValue('initialization.testSetting1'), 'userValue');
            assert.strictEqual(target.callCount, 4);
            assert.deepStrictEqual(target.args[0], [2 /* WorkbenchState.FOLDER */]);
            assert.deepStrictEqual(target.args[1], [undefined]);
            assert.deepStrictEqual(target.args[3][0].added.map(f => f.uri.toString()), [folder.toString()]);
            assert.deepStrictEqual(target.args[3][0].removed, []);
            assert.deepStrictEqual(target.args[3][0].changed, []);
        });
        (platform_2.isMacintosh ? test.skip : test)('initialize a folder workspace from an empty workspace with configuration changes', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "initialization.testSetting1": "userValue" }'));
            await testObject.reloadConfiguration();
            const target = sinon.spy();
            testObject.onDidChangeWorkbenchState(target);
            testObject.onDidChangeWorkspaceName(target);
            testObject.onWillChangeWorkspaceFolders(target);
            testObject.onDidChangeWorkspaceFolders(target);
            testObject.onDidChangeConfiguration(target);
            const folder = (0, resources_1.joinPath)(ROOT, 'a');
            await fileService.writeFile((0, resources_1.joinPath)(folder, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "initialization.testSetting1": "workspaceValue" }'));
            await testObject.initialize(convertToWorkspacePayload(folder));
            assert.strictEqual(testObject.getValue('initialization.testSetting1'), 'workspaceValue');
            assert.strictEqual(target.callCount, 5);
            assert.deepStrictEqual(target.args[0][0].affectedKeys, ['initialization.testSetting1']);
            assert.deepStrictEqual(target.args[1], [2 /* WorkbenchState.FOLDER */]);
            assert.deepStrictEqual(target.args[2], [undefined]);
            assert.deepStrictEqual(target.args[4][0].added.map(f => f.uri.toString()), [folder.toString()]);
            assert.deepStrictEqual(target.args[4][0].removed, []);
            assert.deepStrictEqual(target.args[4][0].changed, []);
        });
        (platform_2.isMacintosh ? test.skip : test)('initialize a multi root workspace from an empty workspace with no configuration changes', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "initialization.testSetting1": "userValue" }'));
            await testObject.reloadConfiguration();
            const target = sinon.spy();
            testObject.onDidChangeWorkbenchState(target);
            testObject.onDidChangeWorkspaceName(target);
            testObject.onWillChangeWorkspaceFolders(target);
            testObject.onDidChangeWorkspaceFolders(target);
            testObject.onDidChangeConfiguration(target);
            await testObject.initialize(getWorkspaceIdentifier(configResource));
            assert.strictEqual(target.callCount, 4);
            assert.deepStrictEqual(target.args[0], [3 /* WorkbenchState.WORKSPACE */]);
            assert.deepStrictEqual(target.args[1], [undefined]);
            assert.deepStrictEqual(target.args[3][0].added.map(folder => folder.uri.toString()), [(0, resources_1.joinPath)(ROOT, 'a').toString(), (0, resources_1.joinPath)(ROOT, 'b').toString()]);
            assert.deepStrictEqual(target.args[3][0].removed, []);
            assert.deepStrictEqual(target.args[3][0].changed, []);
        });
        (platform_2.isMacintosh ? test.skip : test)('initialize a multi root workspace from an empty workspace with configuration changes', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "initialization.testSetting1": "userValue" }'));
            await testObject.reloadConfiguration();
            const target = sinon.spy();
            testObject.onDidChangeWorkbenchState(target);
            testObject.onDidChangeWorkspaceName(target);
            testObject.onWillChangeWorkspaceFolders(target);
            testObject.onDidChangeWorkspaceFolders(target);
            testObject.onDidChangeConfiguration(target);
            await fileService.writeFile((0, resources_1.joinPath)(ROOT, 'a', '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "initialization.testSetting1": "workspaceValue1" }'));
            await fileService.writeFile((0, resources_1.joinPath)(ROOT, 'b', '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "initialization.testSetting2": "workspaceValue2" }'));
            await testObject.initialize(getWorkspaceIdentifier(configResource));
            assert.strictEqual(target.callCount, 5);
            assert.deepStrictEqual(target.args[0][0].affectedKeys, ['initialization.testSetting1', 'initialization.testSetting2']);
            assert.deepStrictEqual(target.args[1], [3 /* WorkbenchState.WORKSPACE */]);
            assert.deepStrictEqual(target.args[2], [undefined]);
            assert.deepStrictEqual(target.args[4][0].added.map(folder => folder.uri.toString()), [(0, resources_1.joinPath)(ROOT, 'a').toString(), (0, resources_1.joinPath)(ROOT, 'b').toString()]);
            assert.deepStrictEqual(target.args[4][0].removed, []);
            assert.deepStrictEqual(target.args[4][0].changed, []);
        });
        (platform_2.isMacintosh ? test.skip : test)('initialize a folder workspace from a folder workspace with no configuration changes', async () => {
            await testObject.initialize(convertToWorkspacePayload((0, resources_1.joinPath)(ROOT, 'a')));
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "initialization.testSetting1": "userValue" }'));
            await testObject.reloadConfiguration();
            const target = sinon.spy();
            testObject.onDidChangeWorkbenchState(target);
            testObject.onDidChangeWorkspaceName(target);
            testObject.onWillChangeWorkspaceFolders(target);
            testObject.onDidChangeWorkspaceFolders(target);
            testObject.onDidChangeConfiguration(target);
            await testObject.initialize(convertToWorkspacePayload((0, resources_1.joinPath)(ROOT, 'b')));
            assert.strictEqual(testObject.getValue('initialization.testSetting1'), 'userValue');
            assert.strictEqual(target.callCount, 2);
            assert.deepStrictEqual(target.args[1][0].added.map(folder_1 => folder_1.uri.toString()), [(0, resources_1.joinPath)(ROOT, 'b').toString()]);
            assert.deepStrictEqual(target.args[1][0].removed.map(folder_2 => folder_2.uri.toString()), [(0, resources_1.joinPath)(ROOT, 'a').toString()]);
            assert.deepStrictEqual(target.args[1][0].changed, []);
        });
        (platform_2.isMacintosh ? test.skip : test)('initialize a folder workspace from a folder workspace with configuration changes', async () => {
            await testObject.initialize(convertToWorkspacePayload((0, resources_1.joinPath)(ROOT, 'a')));
            const target = sinon.spy();
            testObject.onDidChangeWorkbenchState(target);
            testObject.onDidChangeWorkspaceName(target);
            testObject.onWillChangeWorkspaceFolders(target);
            testObject.onDidChangeWorkspaceFolders(target);
            testObject.onDidChangeConfiguration(target);
            await fileService.writeFile((0, resources_1.joinPath)(ROOT, 'b', '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "initialization.testSetting1": "workspaceValue2" }'));
            await testObject.initialize(convertToWorkspacePayload((0, resources_1.joinPath)(ROOT, 'b')));
            assert.strictEqual(testObject.getValue('initialization.testSetting1'), 'workspaceValue2');
            assert.strictEqual(target.callCount, 3);
            assert.deepStrictEqual(target.args[0][0].affectedKeys, ['initialization.testSetting1']);
            assert.deepStrictEqual(target.args[2][0].added.map(folder_1 => folder_1.uri.toString()), [(0, resources_1.joinPath)(ROOT, 'b').toString()]);
            assert.deepStrictEqual(target.args[2][0].removed.map(folder_2 => folder_2.uri.toString()), [(0, resources_1.joinPath)(ROOT, 'a').toString()]);
            assert.deepStrictEqual(target.args[2][0].changed, []);
        });
        (platform_2.isMacintosh ? test.skip : test)('initialize a multi folder workspace from a folder workspacce triggers change events in the right order', async () => {
            await testObject.initialize(convertToWorkspacePayload((0, resources_1.joinPath)(ROOT, 'a')));
            const target = sinon.spy();
            testObject.onDidChangeWorkbenchState(target);
            testObject.onDidChangeWorkspaceName(target);
            testObject.onWillChangeWorkspaceFolders(target);
            testObject.onDidChangeWorkspaceFolders(target);
            testObject.onDidChangeConfiguration(target);
            await fileService.writeFile((0, resources_1.joinPath)(ROOT, 'a', '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "initialization.testSetting1": "workspaceValue2" }'));
            await testObject.initialize(getWorkspaceIdentifier(configResource));
            assert.strictEqual(target.callCount, 5);
            assert.deepStrictEqual(target.args[0][0].affectedKeys, ['initialization.testSetting1']);
            assert.deepStrictEqual(target.args[1], [3 /* WorkbenchState.WORKSPACE */]);
            assert.deepStrictEqual(target.args[2], [undefined]);
            assert.deepStrictEqual(target.args[4][0].added.map(folder_1 => folder_1.uri.toString()), [(0, resources_1.joinPath)(ROOT, 'b').toString()]);
            assert.deepStrictEqual(target.args[4][0].removed, []);
            assert.deepStrictEqual(target.args[4][0].changed, []);
        });
    });
    suite('WorkspaceConfigurationService - Folder', () => {
        let testObject, workspaceService, fileService, environmentService;
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        const disposables = new lifecycle_1.DisposableStore();
        suiteSetup(() => {
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.folder.applicationSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    },
                    'configurationService.folder.machineSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* ConfigurationScope.MACHINE */
                    },
                    'configurationService.folder.machineOverridableSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */
                    },
                    'configurationService.folder.testSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 4 /* ConfigurationScope.RESOURCE */
                    },
                    'configurationService.folder.languageSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
                    },
                    'configurationService.folder.restrictedSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        restricted: true
                    },
                }
            });
            configurationRegistry.registerDefaultConfigurations([{
                    overrides: {
                        '[jsonc]': {
                            'configurationService.folder.languageSetting': 'languageValue'
                        }
                    }
                }]);
        });
        setup(async () => {
            const logService = new log_1.NullLogService();
            fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            fileService.registerProvider(ROOT.scheme, fileSystemProvider);
            const folder = (0, resources_1.joinPath)(ROOT, 'a');
            await fileService.createFolder(folder);
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            environmentService = workbenchTestServices_1.TestEnvironmentService;
            const remoteAgentService = instantiationService.createInstance(remoteAgentService_2.RemoteAgentService, null);
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
            fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, new log_1.NullLogService())));
            workspaceService = testObject = disposables.add(new configurationService_1.WorkspaceService({ configurationCache: new ConfigurationCache() }, environmentService, fileService, remoteAgentService, new uriIdentityService_1.UriIdentityService(fileService), new log_1.NullLogService()));
            instantiationService.stub(files_1.IFileService, fileService);
            instantiationService.stub(workspace_1.IWorkspaceContextService, testObject);
            instantiationService.stub(configuration_1.IConfigurationService, testObject);
            instantiationService.stub(environment_1.IEnvironmentService, environmentService);
            await workspaceService.initialize(convertToWorkspacePayload(folder));
            instantiationService.stub(keybindingEditing_1.IKeybindingEditingService, instantiationService.createInstance(keybindingEditing_1.KeybindingsEditingService));
            instantiationService.stub(textfiles_1.ITextFileService, instantiationService.createInstance(workbenchTestServices_1.TestTextFileService));
            instantiationService.stub(resolverService_1.ITextModelService, instantiationService.createInstance(textModelResolverService_1.TextModelResolverService));
            workspaceService.acquireInstantiationService(instantiationService);
        });
        teardown(() => disposables.clear());
        test('defaults', () => {
            assert.deepStrictEqual(testObject.getValue('configurationService'), { 'folder': { 'applicationSetting': 'isSet', 'machineSetting': 'isSet', 'machineOverridableSetting': 'isSet', 'testSetting': 'isSet', 'languageSetting': 'isSet', 'restrictedSetting': 'isSet' } });
        });
        test('globals override defaults', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "userValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.testSetting'), 'userValue');
        });
        test('globals', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "testworkbench.editor.tabs": true }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('testworkbench.editor.tabs'), true);
        });
        test('workspace settings', async () => {
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "testworkbench.editor.icons": true }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('testworkbench.editor.icons'), true);
        });
        test('workspace settings override user settings', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.testSetting'), 'workspaceValue');
        });
        test('machine overridable settings override user Settings', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineOverridableSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineOverridableSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.machineOverridableSetting'), 'workspaceValue');
        });
        test('workspace settings override user settings after defaults are registered ', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.newSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.newSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.folder.newSetting': {
                        'type': 'string',
                        'default': 'isSet'
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.folder.newSetting'), 'workspaceValue');
        });
        test('machine overridable settings override user settings after defaults are registered ', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.newMachineOverridableSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.newMachineOverridableSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.folder.newMachineOverridableSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.folder.newMachineOverridableSetting'), 'workspaceValue');
        });
        test('application settings are not read from workspace', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting'), 'userValue');
        });
        test('application settings are not read from workspace when workspace folder uri is passed', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting', { resource: workspaceService.getWorkspace().folders[0].uri }), 'userValue');
        });
        test('machine settings are not read from workspace', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting', { resource: workspaceService.getWorkspace().folders[0].uri }), 'userValue');
        });
        test('machine settings are not read from workspace when workspace folder uri is passed', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting', { resource: workspaceService.getWorkspace().folders[0].uri }), 'userValue');
        });
        test('get application scope settings are not loaded after defaults are registered', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting-2": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting-2": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting-2'), 'workspaceValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.folder.applicationSetting-2': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting-2'), 'userValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting-2'), 'userValue');
        });
        test('get application scope settings are not loaded after defaults are registered when workspace folder uri is passed', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting-3": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting-3": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting-3', { resource: workspaceService.getWorkspace().folders[0].uri }), 'workspaceValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.folder.applicationSetting-3': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting-3', { resource: workspaceService.getWorkspace().folders[0].uri }), 'userValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting-3', { resource: workspaceService.getWorkspace().folders[0].uri }), 'userValue');
        });
        test('get machine scope settings are not loaded after defaults are registered', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting-2": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting-2": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting-2'), 'workspaceValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.folder.machineSetting-2': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* ConfigurationScope.MACHINE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting-2'), 'userValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting-2'), 'userValue');
        });
        test('get machine scope settings are not loaded after defaults are registered when workspace folder uri is passed', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting-3": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting-3": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting-3', { resource: workspaceService.getWorkspace().folders[0].uri }), 'workspaceValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.folder.machineSetting-3': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* ConfigurationScope.MACHINE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting-3', { resource: workspaceService.getWorkspace().folders[0].uri }), 'userValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting-3', { resource: workspaceService.getWorkspace().folders[0].uri }), 'userValue');
        });
        test('reload configuration emits events after global configuraiton changes', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "testworkbench.editor.tabs": true }'));
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            await testObject.reloadConfiguration();
            assert.ok(target.called);
        });
        test('reload configuration emits events after workspace configuraiton changes', async () => {
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "workspaceValue" }'));
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            await testObject.reloadConfiguration();
            assert.ok(target.called);
        });
        test('reload configuration should not emit event if no changes', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "testworkbench.editor.tabs": true }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(() => { target(); });
            await testObject.reloadConfiguration();
            assert.ok(!target.called);
        });
        test('inspect', async () => {
            let actual = testObject.inspect('something.missing');
            assert.strictEqual(actual.defaultValue, undefined);
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, undefined);
            actual = testObject.inspect('configurationService.folder.testSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'isSet');
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "userValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.inspect('configurationService.folder.testSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.userValue, 'userValue');
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'userValue');
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.inspect('configurationService.folder.testSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.userValue, 'userValue');
            assert.strictEqual(actual.workspaceValue, 'workspaceValue');
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'workspaceValue');
        });
        test('keys', async () => {
            let actual = testObject.keys();
            assert.ok(actual.default.indexOf('configurationService.folder.testSetting') !== -1);
            assert.deepStrictEqual(actual.user, []);
            assert.deepStrictEqual(actual.workspace, []);
            assert.deepStrictEqual(actual.workspaceFolder, []);
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "userValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.keys();
            assert.ok(actual.default.indexOf('configurationService.folder.testSetting') !== -1);
            assert.deepStrictEqual(actual.user, ['configurationService.folder.testSetting']);
            assert.deepStrictEqual(actual.workspace, []);
            assert.deepStrictEqual(actual.workspaceFolder, []);
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.keys();
            assert.ok(actual.default.indexOf('configurationService.folder.testSetting') !== -1);
            assert.deepStrictEqual(actual.user, ['configurationService.folder.testSetting']);
            assert.deepStrictEqual(actual.workspace, ['configurationService.folder.testSetting']);
            assert.deepStrictEqual(actual.workspaceFolder, []);
        });
        test('update user configuration', () => {
            return testObject.updateValue('configurationService.folder.testSetting', 'value', 1 /* ConfigurationTarget.USER */)
                .then(() => assert.strictEqual(testObject.getValue('configurationService.folder.testSetting'), 'value'));
        });
        test('update workspace configuration', () => {
            return testObject.updateValue('tasks.service.testSetting', 'value', 4 /* ConfigurationTarget.WORKSPACE */)
                .then(() => assert.strictEqual(testObject.getValue('tasks.service.testSetting'), 'value'));
        });
        test('update resource configuration', () => {
            return testObject.updateValue('configurationService.folder.testSetting', 'value', { resource: workspaceService.getWorkspace().folders[0].uri }, 5 /* ConfigurationTarget.WORKSPACE_FOLDER */)
                .then(() => assert.strictEqual(testObject.getValue('configurationService.folder.testSetting'), 'value'));
        });
        test('update language configuration using configuration overrides', async () => {
            await testObject.updateValue('configurationService.folder.languageSetting', 'abcLangValue', { overrideIdentifier: 'abclang' });
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting', { overrideIdentifier: 'abclang' }), 'abcLangValue');
        });
        test('update language configuration using configuration update overrides', async () => {
            await testObject.updateValue('configurationService.folder.languageSetting', 'abcLangValue', { overrideIdentifiers: ['abclang'] });
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting', { overrideIdentifier: 'abclang' }), 'abcLangValue');
        });
        test('update language configuration for multiple languages', async () => {
            await testObject.updateValue('configurationService.folder.languageSetting', 'multiLangValue', { overrideIdentifiers: ['deflang', 'xyzlang'] }, 1 /* ConfigurationTarget.USER */);
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting', { overrideIdentifier: 'deflang' }), 'multiLangValue');
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting', { overrideIdentifier: 'xyzlang' }), 'multiLangValue');
            assert.deepStrictEqual(testObject.getValue((0, configurationRegistry_1.keyFromOverrideIdentifiers)(['deflang', 'xyzlang'])), { 'configurationService.folder.languageSetting': 'multiLangValue' });
        });
        test('update resource language configuration', async () => {
            await testObject.updateValue('configurationService.folder.languageSetting', 'value', { resource: workspaceService.getWorkspace().folders[0].uri }, 5 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting'), 'value');
        });
        test('update resource language configuration for a language using configuration overrides', async () => {
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting', { resource: workspaceService.getWorkspace().folders[0].uri, overrideIdentifier: 'jsonc' }), 'languageValue');
            await testObject.updateValue('configurationService.folder.languageSetting', 'languageValueUpdated', { resource: workspaceService.getWorkspace().folders[0].uri, overrideIdentifier: 'jsonc' }, 5 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting', { resource: workspaceService.getWorkspace().folders[0].uri, overrideIdentifier: 'jsonc' }), 'languageValueUpdated');
        });
        test('update resource language configuration for a language using configuration update overrides', async () => {
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting', { resource: workspaceService.getWorkspace().folders[0].uri, overrideIdentifier: 'jsonc' }), 'languageValue');
            await testObject.updateValue('configurationService.folder.languageSetting', 'languageValueUpdated', { resource: workspaceService.getWorkspace().folders[0].uri, overrideIdentifiers: ['jsonc'] }, 5 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting', { resource: workspaceService.getWorkspace().folders[0].uri, overrideIdentifier: 'jsonc' }), 'languageValueUpdated');
        });
        test('update application setting into workspace configuration in a workspace is not supported', () => {
            return testObject.updateValue('configurationService.folder.applicationSetting', 'workspaceValue', {}, 4 /* ConfigurationTarget.WORKSPACE */, true)
                .then(() => assert.fail('Should not be supported'), (e) => assert.strictEqual(e.code, 1 /* ConfigurationEditingErrorCode.ERROR_INVALID_WORKSPACE_CONFIGURATION_APPLICATION */));
        });
        test('update machine setting into workspace configuration in a workspace is not supported', () => {
            return testObject.updateValue('configurationService.folder.machineSetting', 'workspaceValue', {}, 4 /* ConfigurationTarget.WORKSPACE */, true)
                .then(() => assert.fail('Should not be supported'), (e) => assert.strictEqual(e.code, 2 /* ConfigurationEditingErrorCode.ERROR_INVALID_WORKSPACE_CONFIGURATION_MACHINE */));
        });
        test('update tasks configuration', () => {
            return testObject.updateValue('tasks', { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] }, 4 /* ConfigurationTarget.WORKSPACE */)
                .then(() => assert.deepStrictEqual(testObject.getValue('tasks'), { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] }));
        });
        test('update user configuration should trigger change event before promise is resolve', () => {
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            return testObject.updateValue('configurationService.folder.testSetting', 'value', 1 /* ConfigurationTarget.USER */)
                .then(() => assert.ok(target.called));
        });
        test('update workspace configuration should trigger change event before promise is resolve', () => {
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            return testObject.updateValue('configurationService.folder.testSetting', 'value', 4 /* ConfigurationTarget.WORKSPACE */)
                .then(() => assert.ok(target.called));
        });
        test('update memory configuration', () => {
            return testObject.updateValue('configurationService.folder.testSetting', 'memoryValue', 7 /* ConfigurationTarget.MEMORY */)
                .then(() => assert.strictEqual(testObject.getValue('configurationService.folder.testSetting'), 'memoryValue'));
        });
        test('update memory configuration should trigger change event before promise is resolve', () => {
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            return testObject.updateValue('configurationService.folder.testSetting', 'memoryValue', 7 /* ConfigurationTarget.MEMORY */)
                .then(() => assert.ok(target.called));
        });
        test('remove setting from all targets', async () => {
            const key = 'configurationService.folder.testSetting';
            await testObject.updateValue(key, 'workspaceValue', 4 /* ConfigurationTarget.WORKSPACE */);
            await testObject.updateValue(key, 'userValue', 1 /* ConfigurationTarget.USER */);
            await testObject.updateValue(key, undefined);
            await testObject.reloadConfiguration();
            const actual = testObject.inspect(key, { resource: workspaceService.getWorkspace().folders[0].uri });
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
        });
        test('update user configuration to default value when target is not passed', async () => {
            await testObject.updateValue('configurationService.folder.testSetting', 'value', 1 /* ConfigurationTarget.USER */);
            await testObject.updateValue('configurationService.folder.testSetting', 'isSet');
            assert.strictEqual(testObject.inspect('configurationService.folder.testSetting').userValue, undefined);
        });
        test('update user configuration to default value when target is passed', async () => {
            await testObject.updateValue('configurationService.folder.testSetting', 'value', 1 /* ConfigurationTarget.USER */);
            await testObject.updateValue('configurationService.folder.testSetting', 'isSet', 1 /* ConfigurationTarget.USER */);
            assert.strictEqual(testObject.inspect('configurationService.folder.testSetting').userValue, 'isSet');
        });
        test('update task configuration should trigger change event before promise is resolve', () => {
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            return testObject.updateValue('tasks', { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] }, 4 /* ConfigurationTarget.WORKSPACE */)
                .then(() => assert.ok(target.called));
        });
        test('no change event when there are no global tasks', async () => {
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            await (0, async_1.timeout)(5);
            assert.ok(target.notCalled);
        });
        test('change event when there are global tasks', async () => {
            await fileService.writeFile((0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'tasks.json'), buffer_1.VSBuffer.fromString('{ "version": "1.0.0", "tasks": [{ "taskName": "myTask" }'));
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            await testObject.reloadLocalUserConfiguration();
            await promise;
        });
        test('creating workspace settings', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "userValue" }'));
            await testObject.reloadConfiguration();
            await new Promise((c, e) => {
                const disposable = testObject.onDidChangeConfiguration(e => {
                    assert.ok(e.affectsConfiguration('configurationService.folder.testSetting'));
                    assert.strictEqual(testObject.getValue('configurationService.folder.testSetting'), 'workspaceValue');
                    disposable.dispose();
                    c();
                });
                fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "workspaceValue" }')).catch(e);
            });
        });
        test('deleting workspace settings', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "userValue" }'));
            const workspaceSettingsResource = (0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json');
            await fileService.writeFile(workspaceSettingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            const e = await new Promise((c, e) => {
                event_1.Event.once(testObject.onDidChangeConfiguration)(c);
                fileService.del(workspaceSettingsResource).catch(e);
            });
            assert.ok(e.affectsConfiguration('configurationService.folder.testSetting'));
            assert.strictEqual(testObject.getValue('configurationService.folder.testSetting'), 'userValue');
        });
        test('restricted setting is read from workspace when workspace is trusted', async () => {
            var _a, _b;
            testObject.updateWorkspaceTrust(true);
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.restrictedSetting', { resource: workspaceService.getWorkspace().folders[0].uri }), 'workspaceValue');
            assert.ok(testObject.restrictedSettings.default.includes('configurationService.folder.restrictedSetting'));
            assert.strictEqual(testObject.restrictedSettings.userLocal, undefined);
            assert.strictEqual(testObject.restrictedSettings.userRemote, undefined);
            assert.deepStrictEqual(testObject.restrictedSettings.workspace, ['configurationService.folder.restrictedSetting']);
            assert.strictEqual((_a = testObject.restrictedSettings.workspaceFolder) === null || _a === void 0 ? void 0 : _a.size, 1);
            assert.deepStrictEqual((_b = testObject.restrictedSettings.workspaceFolder) === null || _b === void 0 ? void 0 : _b.get(workspaceService.getWorkspace().folders[0].uri), ['configurationService.folder.restrictedSetting']);
        });
        test('restricted setting is not read from workspace when workspace is changed to trusted', async () => {
            var _a, _b;
            testObject.updateWorkspaceTrust(true);
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            testObject.updateWorkspaceTrust(false);
            assert.strictEqual(testObject.getValue('configurationService.folder.restrictedSetting', { resource: workspaceService.getWorkspace().folders[0].uri }), 'userValue');
            assert.ok(testObject.restrictedSettings.default.includes('configurationService.folder.restrictedSetting'));
            assert.strictEqual(testObject.restrictedSettings.userLocal, undefined);
            assert.strictEqual(testObject.restrictedSettings.userRemote, undefined);
            assert.deepStrictEqual(testObject.restrictedSettings.workspace, ['configurationService.folder.restrictedSetting']);
            assert.strictEqual((_a = testObject.restrictedSettings.workspaceFolder) === null || _a === void 0 ? void 0 : _a.size, 1);
            assert.deepStrictEqual((_b = testObject.restrictedSettings.workspaceFolder) === null || _b === void 0 ? void 0 : _b.get(workspaceService.getWorkspace().folders[0].uri), ['configurationService.folder.restrictedSetting']);
        });
        test('change event is triggered when workspace is changed to untrusted', async () => {
            testObject.updateWorkspaceTrust(true);
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            testObject.updateWorkspaceTrust(false);
            const event = await promise;
            assert.ok(event.affectedKeys.includes('configurationService.folder.restrictedSetting'));
            assert.ok(event.affectsConfiguration('configurationService.folder.restrictedSetting'));
        });
        test('restricted setting is not read from workspace when workspace is not trusted', async () => {
            var _a, _b;
            testObject.updateWorkspaceTrust(false);
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.restrictedSetting', { resource: workspaceService.getWorkspace().folders[0].uri }), 'userValue');
            assert.ok(testObject.restrictedSettings.default.includes('configurationService.folder.restrictedSetting'));
            assert.strictEqual(testObject.restrictedSettings.userLocal, undefined);
            assert.strictEqual(testObject.restrictedSettings.userRemote, undefined);
            assert.deepStrictEqual(testObject.restrictedSettings.workspace, ['configurationService.folder.restrictedSetting']);
            assert.strictEqual((_a = testObject.restrictedSettings.workspaceFolder) === null || _a === void 0 ? void 0 : _a.size, 1);
            assert.deepStrictEqual((_b = testObject.restrictedSettings.workspaceFolder) === null || _b === void 0 ? void 0 : _b.get(workspaceService.getWorkspace().folders[0].uri), ['configurationService.folder.restrictedSetting']);
        });
        test('restricted setting is read when workspace is changed to trusted', async () => {
            var _a, _b;
            testObject.updateWorkspaceTrust(false);
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            testObject.updateWorkspaceTrust(true);
            assert.strictEqual(testObject.getValue('configurationService.folder.restrictedSetting', { resource: workspaceService.getWorkspace().folders[0].uri }), 'workspaceValue');
            assert.ok(testObject.restrictedSettings.default.includes('configurationService.folder.restrictedSetting'));
            assert.strictEqual(testObject.restrictedSettings.userLocal, undefined);
            assert.strictEqual(testObject.restrictedSettings.userRemote, undefined);
            assert.deepStrictEqual(testObject.restrictedSettings.workspace, ['configurationService.folder.restrictedSetting']);
            assert.strictEqual((_a = testObject.restrictedSettings.workspaceFolder) === null || _a === void 0 ? void 0 : _a.size, 1);
            assert.deepStrictEqual((_b = testObject.restrictedSettings.workspaceFolder) === null || _b === void 0 ? void 0 : _b.get(workspaceService.getWorkspace().folders[0].uri), ['configurationService.folder.restrictedSetting']);
        });
        test('change event is triggered when workspace is changed to trusted', async () => {
            testObject.updateWorkspaceTrust(false);
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            testObject.updateWorkspaceTrust(true);
            const event = await promise;
            assert.ok(event.affectedKeys.includes('configurationService.folder.restrictedSetting'));
            assert.ok(event.affectsConfiguration('configurationService.folder.restrictedSetting'));
        });
        test('adding an restricted setting triggers change event', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "userValue" }'));
            testObject.updateWorkspaceTrust(false);
            const promise = event_1.Event.toPromise(testObject.onDidChangeRestrictedSettings);
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "workspaceValue" }'));
            return promise;
        });
        test('remove an unregistered setting', async () => {
            const key = 'configurationService.folder.unknownSetting';
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.unknownSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.unknownSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            await testObject.updateValue(key, undefined);
            const actual = testObject.inspect(key, { resource: workspaceService.getWorkspace().folders[0].uri });
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
        });
    });
    suite('WorkspaceConfigurationService-Multiroot', () => {
        let workspaceContextService, jsonEditingServce, testObject, fileService, environmentService;
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        const disposables = new lifecycle_1.DisposableStore();
        suiteSetup(() => {
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.testSetting': {
                        'type': 'string',
                        'default': 'isSet'
                    },
                    'configurationService.workspace.applicationSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    },
                    'configurationService.workspace.machineSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* ConfigurationScope.MACHINE */
                    },
                    'configurationService.workspace.machineOverridableSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */
                    },
                    'configurationService.workspace.testResourceSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 4 /* ConfigurationScope.RESOURCE */
                    },
                    'configurationService.workspace.testLanguageSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
                    },
                    'configurationService.workspace.testRestrictedSetting1': {
                        'type': 'string',
                        'default': 'isSet',
                        restricted: true,
                        scope: 4 /* ConfigurationScope.RESOURCE */
                    },
                    'configurationService.workspace.testRestrictedSetting2': {
                        'type': 'string',
                        'default': 'isSet',
                        restricted: true,
                        scope: 4 /* ConfigurationScope.RESOURCE */
                    }
                }
            });
        });
        setup(async () => {
            const logService = new log_1.NullLogService();
            fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            fileService.registerProvider(ROOT.scheme, fileSystemProvider);
            const appSettingsHome = (0, resources_1.joinPath)(ROOT, 'user');
            const folderA = (0, resources_1.joinPath)(ROOT, 'a');
            const folderB = (0, resources_1.joinPath)(ROOT, 'b');
            const configResource = (0, resources_1.joinPath)(ROOT, 'vsctests.code-workspace');
            const workspace = { folders: [{ path: folderA.path }, { path: folderB.path }] };
            await fileService.createFolder(appSettingsHome);
            await fileService.createFolder(folderA);
            await fileService.createFolder(folderB);
            await fileService.writeFile(configResource, buffer_1.VSBuffer.fromString(JSON.stringify(workspace, null, '\t')));
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            environmentService = workbenchTestServices_1.TestEnvironmentService;
            const remoteAgentService = instantiationService.createInstance(remoteAgentService_2.RemoteAgentService, null);
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
            fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, new log_1.NullLogService())));
            const workspaceService = disposables.add(new configurationService_1.WorkspaceService({ configurationCache: new ConfigurationCache() }, environmentService, fileService, remoteAgentService, new uriIdentityService_1.UriIdentityService(fileService), new log_1.NullLogService()));
            instantiationService.stub(files_1.IFileService, fileService);
            instantiationService.stub(workspace_1.IWorkspaceContextService, workspaceService);
            instantiationService.stub(configuration_1.IConfigurationService, workspaceService);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, environmentService);
            instantiationService.stub(environment_1.IEnvironmentService, environmentService);
            await workspaceService.initialize(getWorkspaceIdentifier(configResource));
            instantiationService.stub(keybindingEditing_1.IKeybindingEditingService, instantiationService.createInstance(keybindingEditing_1.KeybindingsEditingService));
            instantiationService.stub(textfiles_1.ITextFileService, instantiationService.createInstance(workbenchTestServices_1.TestTextFileService));
            instantiationService.stub(resolverService_1.ITextModelService, instantiationService.createInstance(textModelResolverService_1.TextModelResolverService));
            workspaceService.acquireInstantiationService(instantiationService);
            workspaceContextService = workspaceService;
            jsonEditingServce = instantiationService.createInstance(jsonEditingService_1.JSONEditingService);
            testObject = workspaceService;
        });
        teardown(() => disposables.clear());
        test('application settings are not read from workspace', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting": "userValue" }'));
            await jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, [{ path: ['settings'], value: { 'configurationService.workspace.applicationSetting': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting'), 'userValue');
        });
        test('application settings are not read from workspace when folder is passed', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting": "userValue" }'));
            await jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, [{ path: ['settings'], value: { 'configurationService.workspace.applicationSetting': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
        });
        test('machine settings are not read from workspace', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting": "userValue" }'));
            await jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, [{ path: ['settings'], value: { 'configurationService.workspace.machineSetting': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting'), 'userValue');
        });
        test('machine settings are not read from workspace when folder is passed', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting": "userValue" }'));
            await jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, [{ path: ['settings'], value: { 'configurationService.workspace.machineSetting': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
        });
        test('get application scope settings are not loaded after defaults are registered', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.newSetting": "userValue" }'));
            await jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, [{ path: ['settings'], value: { 'configurationService.workspace.newSetting': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.newSetting'), 'workspaceValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.newSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.workspace.newSetting'), 'userValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.newSetting'), 'userValue');
        });
        test('get application scope settings are not loaded after defaults are registered when workspace folder is passed', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.newSetting-2": "userValue" }'));
            await jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, [{ path: ['settings'], value: { 'configurationService.workspace.newSetting-2': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.newSetting-2', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'workspaceValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.newSetting-2': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.workspace.newSetting-2', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.newSetting-2', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
        });
        test('workspace settings override user settings after defaults are registered for machine overridable settings ', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.newMachineOverridableSetting": "userValue" }'));
            await jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, [{ path: ['settings'], value: { 'configurationService.workspace.newMachineOverridableSetting': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.newMachineOverridableSetting'), 'workspaceValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.newMachineOverridableSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.workspace.newMachineOverridableSetting'), 'workspaceValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.newMachineOverridableSetting'), 'workspaceValue');
        });
        test('application settings are not read from workspace folder', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.applicationSetting": "userValue" }'));
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.applicationSetting": "workspaceFolderValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.applicationSetting'), 'userValue');
        });
        test('application settings are not read from workspace folder when workspace folder is passed', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.applicationSetting": "userValue" }'));
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.applicationSetting": "workspaceFolderValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.applicationSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
        });
        test('machine settings are not read from workspace folder', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.machineSetting": "userValue" }'));
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.machineSetting": "workspaceFolderValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.machineSetting'), 'userValue');
        });
        test('machine settings are not read from workspace folder when workspace folder is passed', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.machineSetting": "userValue" }'));
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.machineSetting": "workspaceFolderValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.machineSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
        });
        test('application settings are not read from workspace folder after defaults are registered', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testNewApplicationSetting": "userValue" }'));
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testNewApplicationSetting": "workspaceFolderValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.testNewApplicationSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'workspaceFolderValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.testNewApplicationSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.workspace.testNewApplicationSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.testNewApplicationSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
        });
        test('application settings are not read from workspace folder after defaults are registered', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testNewMachineSetting": "userValue" }'));
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testNewMachineSetting": "workspaceFolderValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.testNewMachineSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'workspaceFolderValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.testNewMachineSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* ConfigurationScope.MACHINE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.workspace.testNewMachineSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.testNewMachineSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
        });
        test('resource setting in folder is read after it is registered later', async () => {
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testNewResourceSetting2": "workspaceFolderValue" }'));
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['settings'], value: { 'configurationService.workspace.testNewResourceSetting2': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.testNewResourceSetting2': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 4 /* ConfigurationScope.RESOURCE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.workspace.testNewResourceSetting2', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'workspaceFolderValue');
        });
        test('resource language setting in folder is read after it is registered later', async () => {
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testNewResourceLanguageSetting2": "workspaceFolderValue" }'));
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['settings'], value: { 'configurationService.workspace.testNewResourceLanguageSetting2': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.testNewResourceLanguageSetting2': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.workspace.testNewResourceLanguageSetting2', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'workspaceFolderValue');
        });
        test('machine overridable setting in folder is read after it is registered later', async () => {
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testNewMachineOverridableSetting2": "workspaceFolderValue" }'));
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['settings'], value: { 'configurationService.workspace.testNewMachineOverridableSetting2': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.testNewMachineOverridableSetting2': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.workspace.testNewMachineOverridableSetting2', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'workspaceFolderValue');
        });
        test('inspect', async () => {
            let actual = testObject.inspect('something.missing');
            assert.strictEqual(actual.defaultValue, undefined);
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, undefined);
            actual = testObject.inspect('configurationService.workspace.testResourceSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'isSet');
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testResourceSetting": "userValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.inspect('configurationService.workspace.testResourceSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.userValue, 'userValue');
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'userValue');
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['settings'], value: { 'configurationService.workspace.testResourceSetting': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            actual = testObject.inspect('configurationService.workspace.testResourceSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.userValue, 'userValue');
            assert.strictEqual(actual.workspaceValue, 'workspaceValue');
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'workspaceValue');
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testResourceSetting": "workspaceFolderValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.inspect('configurationService.workspace.testResourceSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri });
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.userValue, 'userValue');
            assert.strictEqual(actual.workspaceValue, 'workspaceValue');
            assert.strictEqual(actual.workspaceFolderValue, 'workspaceFolderValue');
            assert.strictEqual(actual.value, 'workspaceFolderValue');
        });
        test('get launch configuration', async () => {
            const expectedLaunchConfiguration = {
                'version': '0.1.0',
                'configurations': [
                    {
                        'type': 'node',
                        'request': 'launch',
                        'name': 'Gulp Build',
                        'program': '${workspaceFolder}/node_modules/gulp/bin/gulp.js',
                        'stopOnEntry': true,
                        'args': [
                            'watch-extension:json-client'
                        ],
                        'cwd': '${workspaceFolder}'
                    }
                ]
            };
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['launch'], value: expectedLaunchConfiguration }], true);
            await testObject.reloadConfiguration();
            const actual = testObject.getValue('launch');
            assert.deepStrictEqual(actual, expectedLaunchConfiguration);
        });
        test('inspect launch configuration', async () => {
            const expectedLaunchConfiguration = {
                'version': '0.1.0',
                'configurations': [
                    {
                        'type': 'node',
                        'request': 'launch',
                        'name': 'Gulp Build',
                        'program': '${workspaceFolder}/node_modules/gulp/bin/gulp.js',
                        'stopOnEntry': true,
                        'args': [
                            'watch-extension:json-client'
                        ],
                        'cwd': '${workspaceFolder}'
                    }
                ]
            };
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['launch'], value: expectedLaunchConfiguration }], true);
            await testObject.reloadConfiguration();
            const actual = testObject.inspect('launch').workspaceValue;
            assert.deepStrictEqual(actual, expectedLaunchConfiguration);
        });
        test('get tasks configuration', async () => {
            const expectedTasksConfiguration = {
                'version': '2.0.0',
                'tasks': [
                    {
                        'label': 'Run Dev',
                        'type': 'shell',
                        'command': './scripts/code.sh',
                        'windows': {
                            'command': '.\\scripts\\code.bat'
                        },
                        'problemMatcher': []
                    }
                ]
            };
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['tasks'], value: expectedTasksConfiguration }], true);
            await testObject.reloadConfiguration();
            const actual = testObject.getValue('tasks');
            assert.deepStrictEqual(actual, expectedTasksConfiguration);
        });
        test('inspect tasks configuration', async () => {
            const expectedTasksConfiguration = {
                'version': '2.0.0',
                'tasks': [
                    {
                        'label': 'Run Dev',
                        'type': 'shell',
                        'command': './scripts/code.sh',
                        'windows': {
                            'command': '.\\scripts\\code.bat'
                        },
                        'problemMatcher': []
                    }
                ]
            };
            await jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, [{ path: ['tasks'], value: expectedTasksConfiguration }], true);
            await testObject.reloadConfiguration();
            const actual = testObject.inspect('tasks').workspaceValue;
            assert.deepStrictEqual(actual, expectedTasksConfiguration);
        });
        test('update user configuration', async () => {
            await testObject.updateValue('configurationService.workspace.testSetting', 'userValue', 1 /* ConfigurationTarget.USER */);
            assert.strictEqual(testObject.getValue('configurationService.workspace.testSetting'), 'userValue');
        });
        test('update user configuration should trigger change event before promise is resolve', async () => {
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            await testObject.updateValue('configurationService.workspace.testSetting', 'userValue', 1 /* ConfigurationTarget.USER */);
            assert.ok(target.called);
        });
        test('update workspace configuration', async () => {
            await testObject.updateValue('configurationService.workspace.testSetting', 'workspaceValue', 4 /* ConfigurationTarget.WORKSPACE */);
            assert.strictEqual(testObject.getValue('configurationService.workspace.testSetting'), 'workspaceValue');
        });
        test('update workspace configuration should trigger change event before promise is resolve', async () => {
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            await testObject.updateValue('configurationService.workspace.testSetting', 'workspaceValue', 4 /* ConfigurationTarget.WORKSPACE */);
            assert.ok(target.called);
        });
        test('update application setting into workspace configuration in a workspace is not supported', () => {
            return testObject.updateValue('configurationService.workspace.applicationSetting', 'workspaceValue', {}, 4 /* ConfigurationTarget.WORKSPACE */, true)
                .then(() => assert.fail('Should not be supported'), (e) => assert.strictEqual(e.code, 1 /* ConfigurationEditingErrorCode.ERROR_INVALID_WORKSPACE_CONFIGURATION_APPLICATION */));
        });
        test('update machine setting into workspace configuration in a workspace is not supported', () => {
            return testObject.updateValue('configurationService.workspace.machineSetting', 'workspaceValue', {}, 4 /* ConfigurationTarget.WORKSPACE */, true)
                .then(() => assert.fail('Should not be supported'), (e) => assert.strictEqual(e.code, 2 /* ConfigurationEditingErrorCode.ERROR_INVALID_WORKSPACE_CONFIGURATION_MACHINE */));
        });
        test('update workspace folder configuration', () => {
            const workspace = workspaceContextService.getWorkspace();
            return testObject.updateValue('configurationService.workspace.testResourceSetting', 'workspaceFolderValue', { resource: workspace.folders[0].uri }, 5 /* ConfigurationTarget.WORKSPACE_FOLDER */)
                .then(() => assert.strictEqual(testObject.getValue('configurationService.workspace.testResourceSetting', { resource: workspace.folders[0].uri }), 'workspaceFolderValue'));
        });
        test('update resource language configuration in workspace folder', async () => {
            const workspace = workspaceContextService.getWorkspace();
            await testObject.updateValue('configurationService.workspace.testLanguageSetting', 'workspaceFolderValue', { resource: workspace.folders[0].uri }, 5 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            assert.strictEqual(testObject.getValue('configurationService.workspace.testLanguageSetting', { resource: workspace.folders[0].uri }), 'workspaceFolderValue');
        });
        test('update workspace folder configuration should trigger change event before promise is resolve', async () => {
            const workspace = workspaceContextService.getWorkspace();
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            await testObject.updateValue('configurationService.workspace.testResourceSetting', 'workspaceFolderValue', { resource: workspace.folders[0].uri }, 5 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            assert.ok(target.called);
        });
        test('update workspace folder configuration second time should trigger change event before promise is resolve', async () => {
            const workspace = workspaceContextService.getWorkspace();
            await testObject.updateValue('configurationService.workspace.testResourceSetting', 'workspaceFolderValue', { resource: workspace.folders[0].uri }, 5 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            await testObject.updateValue('configurationService.workspace.testResourceSetting', 'workspaceFolderValue2', { resource: workspace.folders[0].uri }, 5 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            assert.ok(target.called);
        });
        test('update machine overridable setting in folder', async () => {
            const workspace = workspaceContextService.getWorkspace();
            await testObject.updateValue('configurationService.workspace.machineOverridableSetting', 'workspaceFolderValue', { resource: workspace.folders[0].uri }, 5 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            assert.strictEqual(testObject.getValue('configurationService.workspace.machineOverridableSetting', { resource: workspace.folders[0].uri }), 'workspaceFolderValue');
        });
        test('update memory configuration', async () => {
            await testObject.updateValue('configurationService.workspace.testSetting', 'memoryValue', 7 /* ConfigurationTarget.MEMORY */);
            assert.strictEqual(testObject.getValue('configurationService.workspace.testSetting'), 'memoryValue');
        });
        test('update memory configuration should trigger change event before promise is resolve', async () => {
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            await testObject.updateValue('configurationService.workspace.testSetting', 'memoryValue', 7 /* ConfigurationTarget.MEMORY */);
            assert.ok(target.called);
        });
        test('remove setting from all targets', async () => {
            const workspace = workspaceContextService.getWorkspace();
            const key = 'configurationService.workspace.testResourceSetting';
            await testObject.updateValue(key, 'workspaceFolderValue', { resource: workspace.folders[0].uri }, 5 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            await testObject.updateValue(key, 'workspaceValue', 4 /* ConfigurationTarget.WORKSPACE */);
            await testObject.updateValue(key, 'userValue', 1 /* ConfigurationTarget.USER */);
            await testObject.updateValue(key, undefined, { resource: workspace.folders[0].uri });
            await testObject.reloadConfiguration();
            const actual = testObject.inspect(key, { resource: workspace.folders[0].uri });
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
        });
        test('update tasks configuration in a folder', async () => {
            const workspace = workspaceContextService.getWorkspace();
            await testObject.updateValue('tasks', { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] }, { resource: workspace.folders[0].uri }, 5 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            assert.deepStrictEqual(testObject.getValue('tasks', { resource: workspace.folders[0].uri }), { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] });
        });
        test('update launch configuration in a workspace', async () => {
            const workspace = workspaceContextService.getWorkspace();
            await testObject.updateValue('launch', { 'version': '1.0.0', configurations: [{ 'name': 'myLaunch' }] }, { resource: workspace.folders[0].uri }, 4 /* ConfigurationTarget.WORKSPACE */, true);
            assert.deepStrictEqual(testObject.getValue('launch'), { 'version': '1.0.0', configurations: [{ 'name': 'myLaunch' }] });
        });
        test('update tasks configuration in a workspace', async () => {
            const workspace = workspaceContextService.getWorkspace();
            const tasks = { 'version': '2.0.0', tasks: [{ 'label': 'myTask' }] };
            await testObject.updateValue('tasks', tasks, { resource: workspace.folders[0].uri }, 4 /* ConfigurationTarget.WORKSPACE */, true);
            assert.deepStrictEqual(testObject.getValue('tasks'), tasks);
        });
        test('configuration of newly added folder is available on configuration change event', async () => {
            const workspaceService = testObject;
            const uri = workspaceService.getWorkspace().folders[1].uri;
            await workspaceService.removeFolders([uri]);
            await fileService.writeFile((0, resources_1.joinPath)(uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testResourceSetting": "workspaceFolderValue" }'));
            return new Promise((c, e) => {
                testObject.onDidChangeConfiguration(() => {
                    try {
                        assert.strictEqual(testObject.getValue('configurationService.workspace.testResourceSetting', { resource: uri }), 'workspaceFolderValue');
                        c();
                    }
                    catch (error) {
                        e(error);
                    }
                });
                workspaceService.addFolders([{ uri }]);
            });
        });
        test('restricted setting is read from workspace folders when workspace is trusted', async () => {
            var _a, _b, _c;
            testObject.updateWorkspaceTrust(true);
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testRestrictedSetting1": "userValue", "configurationService.workspace.testRestrictedSetting2": "userValue" }'));
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['settings'], value: { 'configurationService.workspace.testRestrictedSetting1': 'workspaceValue' } }], true);
            await fileService.writeFile((0, resources_1.joinPath)(testObject.getWorkspace().folders[1].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testRestrictedSetting2": "workspaceFolder2Value" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.testRestrictedSetting1', { resource: testObject.getWorkspace().folders[0].uri }), 'workspaceValue');
            assert.strictEqual(testObject.getValue('configurationService.workspace.testRestrictedSetting2', { resource: testObject.getWorkspace().folders[1].uri }), 'workspaceFolder2Value');
            assert.ok(testObject.restrictedSettings.default.includes('configurationService.workspace.testRestrictedSetting1'));
            assert.ok(testObject.restrictedSettings.default.includes('configurationService.workspace.testRestrictedSetting2'));
            assert.strictEqual(testObject.restrictedSettings.userLocal, undefined);
            assert.strictEqual(testObject.restrictedSettings.userRemote, undefined);
            assert.deepStrictEqual(testObject.restrictedSettings.workspace, ['configurationService.workspace.testRestrictedSetting1']);
            assert.strictEqual((_a = testObject.restrictedSettings.workspaceFolder) === null || _a === void 0 ? void 0 : _a.size, 1);
            assert.strictEqual((_b = testObject.restrictedSettings.workspaceFolder) === null || _b === void 0 ? void 0 : _b.get(testObject.getWorkspace().folders[0].uri), undefined);
            assert.deepStrictEqual((_c = testObject.restrictedSettings.workspaceFolder) === null || _c === void 0 ? void 0 : _c.get(testObject.getWorkspace().folders[1].uri), ['configurationService.workspace.testRestrictedSetting2']);
        });
        test('restricted setting is not read from workspace when workspace is not trusted', async () => {
            var _a, _b, _c;
            testObject.updateWorkspaceTrust(false);
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testRestrictedSetting1": "userValue", "configurationService.workspace.testRestrictedSetting2": "userValue" }'));
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['settings'], value: { 'configurationService.workspace.testRestrictedSetting1': 'workspaceValue' } }], true);
            await fileService.writeFile((0, resources_1.joinPath)(testObject.getWorkspace().folders[1].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testRestrictedSetting2": "workspaceFolder2Value" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.testRestrictedSetting1', { resource: testObject.getWorkspace().folders[0].uri }), 'userValue');
            assert.strictEqual(testObject.getValue('configurationService.workspace.testRestrictedSetting2', { resource: testObject.getWorkspace().folders[1].uri }), 'userValue');
            assert.ok(testObject.restrictedSettings.default.includes('configurationService.workspace.testRestrictedSetting1'));
            assert.ok(testObject.restrictedSettings.default.includes('configurationService.workspace.testRestrictedSetting2'));
            assert.strictEqual(testObject.restrictedSettings.userLocal, undefined);
            assert.strictEqual(testObject.restrictedSettings.userRemote, undefined);
            assert.deepStrictEqual(testObject.restrictedSettings.workspace, ['configurationService.workspace.testRestrictedSetting1']);
            assert.strictEqual((_a = testObject.restrictedSettings.workspaceFolder) === null || _a === void 0 ? void 0 : _a.size, 1);
            assert.strictEqual((_b = testObject.restrictedSettings.workspaceFolder) === null || _b === void 0 ? void 0 : _b.get(testObject.getWorkspace().folders[0].uri), undefined);
            assert.deepStrictEqual((_c = testObject.restrictedSettings.workspaceFolder) === null || _c === void 0 ? void 0 : _c.get(testObject.getWorkspace().folders[1].uri), ['configurationService.workspace.testRestrictedSetting2']);
        });
        test('remove an unregistered setting', async () => {
            const key = 'configurationService.workspace.unknownSetting';
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.unknownSetting": "userValue" }'));
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['settings'], value: { 'configurationService.workspace.unknownSetting': 'workspaceValue' } }], true);
            await fileService.writeFile((0, resources_1.joinPath)(workspaceContextService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.unknownSetting": "workspaceFolderValue1" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceContextService.getWorkspace().folders[1].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.unknownSetting": "workspaceFolderValue2" }'));
            await testObject.reloadConfiguration();
            await testObject.updateValue(key, undefined, { resource: workspaceContextService.getWorkspace().folders[0].uri });
            let actual = testObject.inspect(key, { resource: workspaceContextService.getWorkspace().folders[0].uri });
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            await testObject.updateValue(key, undefined, { resource: workspaceContextService.getWorkspace().folders[1].uri });
            actual = testObject.inspect(key, { resource: workspaceContextService.getWorkspace().folders[1].uri });
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
        });
    });
    suite('WorkspaceConfigurationService - Remote Folder', () => {
        let testObject, folder, machineSettingsResource, remoteSettingsResource, fileSystemProvider, resolveRemoteEnvironment, instantiationService, fileService, environmentService;
        const remoteAuthority = 'configuraiton-tests';
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        const disposables = new lifecycle_1.DisposableStore();
        suiteSetup(() => {
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.remote.applicationSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    },
                    'configurationService.remote.machineSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* ConfigurationScope.MACHINE */
                    },
                    'configurationService.remote.machineOverridableSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */
                    },
                    'configurationService.remote.testSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 4 /* ConfigurationScope.RESOURCE */
                    }
                }
            });
        });
        setup(async () => {
            const logService = new log_1.NullLogService();
            fileService = disposables.add(new fileService_1.FileService(logService));
            fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            fileService.registerProvider(ROOT.scheme, fileSystemProvider);
            const appSettingsHome = (0, resources_1.joinPath)(ROOT, 'user');
            folder = (0, resources_1.joinPath)(ROOT, 'a');
            await fileService.createFolder(folder);
            await fileService.createFolder(appSettingsHome);
            machineSettingsResource = (0, resources_1.joinPath)(ROOT, 'machine-settings.json');
            remoteSettingsResource = machineSettingsResource.with({ scheme: network_1.Schemas.vscodeRemote, authority: remoteAuthority });
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            environmentService = workbenchTestServices_1.TestEnvironmentService;
            const remoteEnvironmentPromise = new Promise(c => resolveRemoteEnvironment = () => c({ settingsPath: remoteSettingsResource }));
            const remoteAgentService = instantiationService.stub(remoteAgentService_1.IRemoteAgentService, { getEnvironment: () => remoteEnvironmentPromise });
            fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, new log_1.NullLogService())));
            const configurationCache = { read: () => Promise.resolve(''), write: () => Promise.resolve(), remove: () => Promise.resolve(), needsCaching: () => false };
            testObject = disposables.add(new configurationService_1.WorkspaceService({ configurationCache, remoteAuthority }, environmentService, fileService, remoteAgentService, new uriIdentityService_1.UriIdentityService(fileService), new log_1.NullLogService()));
            instantiationService.stub(workspace_1.IWorkspaceContextService, testObject);
            instantiationService.stub(configuration_1.IConfigurationService, testObject);
            instantiationService.stub(environment_1.IEnvironmentService, environmentService);
            instantiationService.stub(files_1.IFileService, fileService);
        });
        async function initialize() {
            await testObject.initialize(convertToWorkspacePayload(folder));
            instantiationService.stub(textfiles_1.ITextFileService, instantiationService.createInstance(workbenchTestServices_1.TestTextFileService));
            instantiationService.stub(resolverService_1.ITextModelService, instantiationService.createInstance(textModelResolverService_1.TextModelResolverService));
            testObject.acquireInstantiationService(instantiationService);
        }
        function registerRemoteFileSystemProvider() {
            instantiationService.get(files_1.IFileService).registerProvider(network_1.Schemas.vscodeRemote, new workbenchTestServices_1.RemoteFileSystemProvider(fileSystemProvider, remoteAuthority));
        }
        function registerRemoteFileSystemProviderOnActivation() {
            const disposable = instantiationService.get(files_1.IFileService).onWillActivateFileSystemProvider(e => {
                if (e.scheme === network_1.Schemas.vscodeRemote) {
                    disposable.dispose();
                    e.join(Promise.resolve().then(() => registerRemoteFileSystemProvider()));
                }
            });
        }
        teardown(() => disposables.clear());
        test('remote settings override globals', async () => {
            await fileService.writeFile(machineSettingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.remote.machineSetting": "remoteValue" }'));
            registerRemoteFileSystemProvider();
            resolveRemoteEnvironment();
            await initialize();
            assert.strictEqual(testObject.getValue('configurationService.remote.machineSetting'), 'remoteValue');
        });
        test('remote settings override globals after remote provider is registered on activation', async () => {
            await fileService.writeFile(machineSettingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.remote.machineSetting": "remoteValue" }'));
            resolveRemoteEnvironment();
            registerRemoteFileSystemProviderOnActivation();
            await initialize();
            assert.strictEqual(testObject.getValue('configurationService.remote.machineSetting'), 'remoteValue');
        });
        test('remote settings override globals after remote environment is resolved', async () => {
            await fileService.writeFile(machineSettingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.remote.machineSetting": "remoteValue" }'));
            registerRemoteFileSystemProvider();
            await initialize();
            const promise = new Promise((c, e) => {
                testObject.onDidChangeConfiguration(event => {
                    try {
                        assert.strictEqual(event.source, 1 /* ConfigurationTarget.USER */);
                        assert.deepStrictEqual(event.affectedKeys, ['configurationService.remote.machineSetting']);
                        assert.strictEqual(testObject.getValue('configurationService.remote.machineSetting'), 'remoteValue');
                        c();
                    }
                    catch (error) {
                        e(error);
                    }
                });
            });
            resolveRemoteEnvironment();
            return promise;
        });
        test('remote settings override globals after remote provider is registered on activation and remote environment is resolved', async () => {
            await fileService.writeFile(machineSettingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.remote.machineSetting": "remoteValue" }'));
            registerRemoteFileSystemProviderOnActivation();
            await initialize();
            const promise = new Promise((c, e) => {
                testObject.onDidChangeConfiguration(event => {
                    try {
                        assert.strictEqual(event.source, 1 /* ConfigurationTarget.USER */);
                        assert.deepStrictEqual(event.affectedKeys, ['configurationService.remote.machineSetting']);
                        assert.strictEqual(testObject.getValue('configurationService.remote.machineSetting'), 'remoteValue');
                        c();
                    }
                    catch (error) {
                        e(error);
                    }
                });
            });
            resolveRemoteEnvironment();
            return promise;
        });
        test('machine settings in local user settings does not override defaults', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.remote.machineSetting": "globalValue" }'));
            registerRemoteFileSystemProvider();
            resolveRemoteEnvironment();
            await initialize();
            assert.strictEqual(testObject.getValue('configurationService.remote.machineSetting'), 'isSet');
        });
        test('machine overridable settings in local user settings does not override defaults', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.remote.machineOverridableSetting": "globalValue" }'));
            registerRemoteFileSystemProvider();
            resolveRemoteEnvironment();
            await initialize();
            assert.strictEqual(testObject.getValue('configurationService.remote.machineOverridableSetting'), 'isSet');
        });
        test('non machine setting is written in local settings', async () => {
            registerRemoteFileSystemProvider();
            resolveRemoteEnvironment();
            await initialize();
            await testObject.updateValue('configurationService.remote.applicationSetting', 'applicationValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.inspect('configurationService.remote.applicationSetting').userLocalValue, 'applicationValue');
        });
        test('machine setting is written in remote settings', async () => {
            registerRemoteFileSystemProvider();
            resolveRemoteEnvironment();
            await initialize();
            await testObject.updateValue('configurationService.remote.machineSetting', 'machineValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.inspect('configurationService.remote.machineSetting').userRemoteValue, 'machineValue');
        });
        test('machine overridable setting is written in remote settings', async () => {
            registerRemoteFileSystemProvider();
            resolveRemoteEnvironment();
            await initialize();
            await testObject.updateValue('configurationService.remote.machineOverridableSetting', 'machineValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.inspect('configurationService.remote.machineOverridableSetting').userRemoteValue, 'machineValue');
        });
        test('machine settings in local user settings does not override defaults after defalts are registered ', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.remote.newMachineSetting": "userValue" }'));
            registerRemoteFileSystemProvider();
            resolveRemoteEnvironment();
            await initialize();
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.remote.newMachineSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* ConfigurationScope.MACHINE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.remote.newMachineSetting'), 'isSet');
        });
        test('machine overridable settings in local user settings does not override defaults after defaults are registered ', async () => {
            await fileService.writeFile(environmentService.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.remote.newMachineOverridableSetting": "userValue" }'));
            registerRemoteFileSystemProvider();
            resolveRemoteEnvironment();
            await initialize();
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.remote.newMachineOverridableSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.remote.newMachineOverridableSetting'), 'isSet');
        });
    });
    function getWorkspaceId(configPath) {
        let workspaceConfigPath = configPath.toString();
        if (!platform_2.isLinux) {
            workspaceConfigPath = workspaceConfigPath.toLowerCase(); // sanitize for platform file system
        }
        return (0, hash_1.hash)(workspaceConfigPath).toString(16);
    }
    function getWorkspaceIdentifier(configPath) {
        return {
            configPath,
            id: getWorkspaceId(configPath)
        };
    }
    exports.getWorkspaceIdentifier = getWorkspaceIdentifier;
});
//# sourceMappingURL=configurationService.test.js.map