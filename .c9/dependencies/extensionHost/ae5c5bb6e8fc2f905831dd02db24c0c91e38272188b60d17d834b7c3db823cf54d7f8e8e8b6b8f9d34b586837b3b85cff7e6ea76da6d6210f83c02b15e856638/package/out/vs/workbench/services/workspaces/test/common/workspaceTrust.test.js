/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/mock", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/files/common/fileService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/platform/workspace/test/common/testWorkspace", "vs/workbench/common/memento", "vs/workbench/services/environment/common/environmentService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/workbench/services/workspaces/common/workspaceTrust", "vs/workbench/services/workspaces/test/common/testWorkspaceTrustService", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, uri_1, mock_1, configuration_1, testConfigurationService_1, fileService_1, instantiationServiceMock_1, log_1, remoteAuthorityResolver_1, storage_1, workspace_1, workspaceTrust_1, testWorkspace_1, memento_1, environmentService_1, uriIdentity_1, uriIdentityService_1, workspaceTrust_2, testWorkspaceTrustService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workspace Trust', () => {
        let instantiationService;
        let configurationService;
        let environmentService;
        setup(async () => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            configurationService = new testConfigurationService_1.TestConfigurationService();
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            environmentService = {};
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, environmentService);
            instantiationService.stub(uriIdentity_1.IUriIdentityService, new uriIdentityService_1.UriIdentityService(new fileService_1.FileService(new log_1.NullLogService())));
            instantiationService.stub(remoteAuthorityResolver_1.IRemoteAuthorityResolverService, new class extends (0, mock_1.mock)() {
            });
        });
        suite('Enablement', () => {
            let testObject;
            teardown(() => testObject.dispose());
            test('workspace trust enabled', async () => {
                await configurationService.setUserConfiguration('security', getUserSettings(true, true));
                testObject = instantiationService.createInstance(workspaceTrust_2.WorkspaceTrustEnablementService);
                assert.strictEqual(testObject.isWorkspaceTrustEnabled(), true);
            });
            test('workspace trust disabled (user setting)', async () => {
                await configurationService.setUserConfiguration('security', getUserSettings(false, true));
                testObject = instantiationService.createInstance(workspaceTrust_2.WorkspaceTrustEnablementService);
                assert.strictEqual(testObject.isWorkspaceTrustEnabled(), false);
            });
            test('workspace trust disabled (--disable-workspace-trust)', () => {
                instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, Object.assign(Object.assign({}, environmentService), { disableWorkspaceTrust: true }));
                testObject = instantiationService.createInstance(workspaceTrust_2.WorkspaceTrustEnablementService);
                assert.strictEqual(testObject.isWorkspaceTrustEnabled(), false);
            });
        });
        suite('Management', () => {
            let testObject;
            let storageService;
            let workspaceService;
            setup(() => {
                storageService = new workbenchTestServices_1.TestStorageService();
                instantiationService.stub(storage_1.IStorageService, storageService);
                workspaceService = new workbenchTestServices_1.TestContextService();
                instantiationService.stub(workspace_1.IWorkspaceContextService, workspaceService);
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new testWorkspaceTrustService_1.TestWorkspaceTrustEnablementService());
            });
            teardown(() => {
                testObject.dispose();
                memento_1.Memento.clear(1 /* StorageScope.WORKSPACE */);
            });
            test('empty workspace - trusted', async () => {
                await configurationService.setUserConfiguration('security', getUserSettings(true, true));
                workspaceService.setWorkspace(new testWorkspace_1.Workspace('empty-workspace'));
                testObject = await initializeTestObject();
                assert.strictEqual(true, testObject.isWorkspaceTrusted());
            });
            test('empty workspace - untrusted', async () => {
                await configurationService.setUserConfiguration('security', getUserSettings(true, false));
                workspaceService.setWorkspace(new testWorkspace_1.Workspace('empty-workspace'));
                testObject = await initializeTestObject();
                assert.strictEqual(false, testObject.isWorkspaceTrusted());
            });
            test('empty workspace - trusted, open trusted file', async () => {
                await configurationService.setUserConfiguration('security', getUserSettings(true, true));
                const trustInfo = { uriTrustInfo: [{ uri: uri_1.URI.parse('file:///Folder'), trusted: true }] };
                storageService.store(workspaceTrust_2.WORKSPACE_TRUST_STORAGE_KEY, JSON.stringify(trustInfo), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                environmentService.filesToOpenOrCreate = [{ fileUri: uri_1.URI.parse('file:///Folder/file.txt') }];
                instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, Object.assign({}, environmentService));
                workspaceService.setWorkspace(new testWorkspace_1.Workspace('empty-workspace'));
                testObject = await initializeTestObject();
                assert.strictEqual(true, testObject.isWorkspaceTrusted());
            });
            test('empty workspace - trusted, open untrusted file', async () => {
                await configurationService.setUserConfiguration('security', getUserSettings(true, true));
                environmentService.filesToOpenOrCreate = [{ fileUri: uri_1.URI.parse('file:///Folder/foo.txt') }];
                instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, Object.assign({}, environmentService));
                workspaceService.setWorkspace(new testWorkspace_1.Workspace('empty-workspace'));
                testObject = await initializeTestObject();
                assert.strictEqual(false, testObject.isWorkspaceTrusted());
            });
            async function initializeTestObject() {
                const workspaceTrustManagementService = instantiationService.createInstance(workspaceTrust_2.WorkspaceTrustManagementService);
                await workspaceTrustManagementService.workspaceTrustInitialized;
                return workspaceTrustManagementService;
            }
        });
        function getUserSettings(enabled, emptyWindow) {
            return { workspace: { trust: { emptyWindow, enabled } } };
        }
    });
});
//# sourceMappingURL=workspaceTrust.test.js.map