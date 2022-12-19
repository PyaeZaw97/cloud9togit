/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/registry/common/platform", "vs/platform/userDataSync/common/settingsSync", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/test/common/userDataSyncClient"], function (require, exports, assert, buffer_1, event_1, lifecycle_1, configuration_1, configurationRegistry_1, environment_1, files_1, platform_1, settingsSync_1, userDataSync_1, userDataSyncClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        'id': 'settingsSync',
        'type': 'object',
        'properties': {
            'settingsSync.machine': {
                'type': 'string',
                'scope': 2 /* ConfigurationScope.MACHINE */
            },
            'settingsSync.machineOverridable': {
                'type': 'string',
                'scope': 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */
            }
        }
    });
    suite('SettingsSync - Auto', () => {
        const disposableStore = new lifecycle_1.DisposableStore();
        const server = new userDataSyncClient_1.UserDataSyncTestServer();
        let client;
        let testObject;
        setup(async () => {
            client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client.setUp(true);
            testObject = client.getSynchronizer("settings" /* SyncResource.Settings */);
            disposableStore.add((0, lifecycle_1.toDisposable)(() => client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService).clear()));
        });
        teardown(() => disposableStore.clear());
        test('when settings file does not exist', async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const settingResource = client.instantiationService.get(environment_1.IEnvironmentService).settingsResource;
            assert.deepStrictEqual(await testObject.getLastSyncUserData(), null);
            let manifest = await client.manifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, [
                { type: 'GET', url: `${server.url}/v1/resource/${testObject.resource}/latest`, headers: {} },
            ]);
            assert.ok(!await fileService.exists(settingResource));
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.deepStrictEqual(lastSyncUserData.ref, remoteUserData.ref);
            assert.deepStrictEqual(lastSyncUserData.syncData, remoteUserData.syncData);
            assert.strictEqual(lastSyncUserData.syncData, null);
            manifest = await client.manifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, []);
            manifest = await client.manifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, []);
        });
        test('when settings file is empty and remote has no changes', async () => {
            var _a, _b;
            const fileService = client.instantiationService.get(files_1.IFileService);
            const settingsResource = client.instantiationService.get(environment_1.IEnvironmentService).settingsResource;
            await fileService.writeFile(settingsResource, buffer_1.VSBuffer.fromString(''));
            await testObject.sync(await client.manifest());
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((_a = (0, settingsSync_1.parseSettingsSyncContent)(lastSyncUserData.syncData.content)) === null || _a === void 0 ? void 0 : _a.settings, '{}');
            assert.strictEqual((_b = (0, settingsSync_1.parseSettingsSyncContent)(remoteUserData.syncData.content)) === null || _b === void 0 ? void 0 : _b.settings, '{}');
            assert.strictEqual((await fileService.readFile(settingsResource)).value.toString(), '');
        });
        test('when settings file is empty and remote has changes', async () => {
            var _a, _b;
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const content = `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",
	"workbench.tree.indent": 20,
	"workbench.colorCustomizations": {
		"editorLineNumber.activeForeground": "#ff0000",
		"[GitHub Sharp]": {
			"statusBarItem.remoteBackground": "#24292E",
			"editorPane.background": "#f3f1f11a"
		}
	},

	"gitBranch.base": "remote-repo/master",

	// Experimental
	"workbench.view.experimental.allowMovingToNewContainer": true,
}`;
            await client2.instantiationService.get(files_1.IFileService).writeFile(client2.instantiationService.get(environment_1.IEnvironmentService).settingsResource, buffer_1.VSBuffer.fromString(content));
            await client2.sync();
            const fileService = client.instantiationService.get(files_1.IFileService);
            const settingsResource = client.instantiationService.get(environment_1.IEnvironmentService).settingsResource;
            await fileService.writeFile(settingsResource, buffer_1.VSBuffer.fromString(''));
            await testObject.sync(await client.manifest());
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((_a = (0, settingsSync_1.parseSettingsSyncContent)(lastSyncUserData.syncData.content)) === null || _a === void 0 ? void 0 : _a.settings, content);
            assert.strictEqual((_b = (0, settingsSync_1.parseSettingsSyncContent)(remoteUserData.syncData.content)) === null || _b === void 0 ? void 0 : _b.settings, content);
            assert.strictEqual((await fileService.readFile(settingsResource)).value.toString(), content);
        });
        test('when settings file is created after first sync', async () => {
            var _a;
            const fileService = client.instantiationService.get(files_1.IFileService);
            const settingsResource = client.instantiationService.get(environment_1.IEnvironmentService).settingsResource;
            await testObject.sync(await client.manifest());
            await fileService.createFile(settingsResource, buffer_1.VSBuffer.fromString('{}'));
            let lastSyncUserData = await testObject.getLastSyncUserData();
            const manifest = await client.manifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, [
                { type: 'POST', url: `${server.url}/v1/resource/${testObject.resource}`, headers: { 'If-Match': lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.ref } },
            ]);
            lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.deepStrictEqual(lastSyncUserData.ref, remoteUserData.ref);
            assert.deepStrictEqual(lastSyncUserData.syncData, remoteUserData.syncData);
            assert.strictEqual((_a = (0, settingsSync_1.parseSettingsSyncContent)(lastSyncUserData.syncData.content)) === null || _a === void 0 ? void 0 : _a.settings, '{}');
        });
        test('sync for first time to the server', async () => {
            const expected = `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",
	"workbench.tree.indent": 20,
	"workbench.colorCustomizations": {
		"editorLineNumber.activeForeground": "#ff0000",
		"[GitHub Sharp]": {
			"statusBarItem.remoteBackground": "#24292E",
			"editorPane.background": "#f3f1f11a"
		}
	},

	"gitBranch.base": "remote-repo/master",

	// Experimental
	"workbench.view.experimental.allowMovingToNewContainer": true,
}`;
            await updateSettings(expected, client);
            await testObject.sync(await client.manifest());
            const { content } = await client.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSettings(content);
            assert.deepStrictEqual(actual, expected);
        });
        test('do not sync machine settings', async () => {
            const settingsContent = `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",

	// Machine
	"settingsSync.machine": "someValue",
	"settingsSync.machineOverridable": "someValue"
}`;
            await updateSettings(settingsContent, client);
            await testObject.sync(await client.manifest());
            const { content } = await client.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSettings(content);
            assert.deepStrictEqual(actual, `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp"
}`);
        });
        test('do not sync machine settings when spread across file', async () => {
            const settingsContent = `{
	// Always
	"files.autoSave": "afterDelay",
	"settingsSync.machine": "someValue",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",

	// Machine
	"settingsSync.machineOverridable": "someValue"
}`;
            await updateSettings(settingsContent, client);
            await testObject.sync(await client.manifest());
            const { content } = await client.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSettings(content);
            assert.deepStrictEqual(actual, `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp"
}`);
        });
        test('do not sync machine settings when spread across file - 2', async () => {
            const settingsContent = `{
	// Always
	"files.autoSave": "afterDelay",
	"settingsSync.machine": "someValue",

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",

	// Machine
	"settingsSync.machineOverridable": "someValue",
	"files.simpleDialog.enable": true,
}`;
            await updateSettings(settingsContent, client);
            await testObject.sync(await client.manifest());
            const { content } = await client.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSettings(content);
            assert.deepStrictEqual(actual, `{
	// Always
	"files.autoSave": "afterDelay",

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",
	"files.simpleDialog.enable": true,
}`);
        });
        test('sync when all settings are machine settings', async () => {
            const settingsContent = `{
	// Machine
	"settingsSync.machine": "someValue",
	"settingsSync.machineOverridable": "someValue"
}`;
            await updateSettings(settingsContent, client);
            await testObject.sync(await client.manifest());
            const { content } = await client.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSettings(content);
            assert.deepStrictEqual(actual, `{
}`);
        });
        test('sync when all settings are machine settings with trailing comma', async () => {
            const settingsContent = `{
	// Machine
	"settingsSync.machine": "someValue",
	"settingsSync.machineOverridable": "someValue",
}`;
            await updateSettings(settingsContent, client);
            await testObject.sync(await client.manifest());
            const { content } = await client.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSettings(content);
            assert.deepStrictEqual(actual, `{
	,
}`);
        });
        test('local change event is triggered when settings are changed', async () => {
            const content = `{
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,
}`;
            await updateSettings(content, client);
            await testObject.sync(await client.manifest());
            const promise = event_1.Event.toPromise(testObject.onDidChangeLocal);
            await updateSettings(`{
	"files.autoSave": "off",
	"files.simpleDialog.enable": true,
}`, client);
            await promise;
        });
        test('do not sync ignored settings', async () => {
            const settingsContent = `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Editor
	"editor.fontFamily": "Fira Code",

	// Terminal
	"terminal.integrated.shell.osx": "some path",

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",

	// Ignored
	"settingsSync.ignoredSettings": [
		"editor.fontFamily",
		"terminal.integrated.shell.osx"
	]
}`;
            await updateSettings(settingsContent, client);
            await testObject.sync(await client.manifest());
            const { content } = await client.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSettings(content);
            assert.deepStrictEqual(actual, `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",

	// Ignored
	"settingsSync.ignoredSettings": [
		"editor.fontFamily",
		"terminal.integrated.shell.osx"
	]
}`);
        });
        test('do not sync ignored and machine settings', async () => {
            const settingsContent = `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Editor
	"editor.fontFamily": "Fira Code",

	// Terminal
	"terminal.integrated.shell.osx": "some path",

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",

	// Ignored
	"settingsSync.ignoredSettings": [
		"editor.fontFamily",
		"terminal.integrated.shell.osx"
	],

	// Machine
	"settingsSync.machine": "someValue",
}`;
            await updateSettings(settingsContent, client);
            await testObject.sync(await client.manifest());
            const { content } = await client.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSettings(content);
            assert.deepStrictEqual(actual, `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",

	// Ignored
	"settingsSync.ignoredSettings": [
		"editor.fontFamily",
		"terminal.integrated.shell.osx"
	],
}`);
        });
        test('sync throws invalid content error', async () => {
            const expected = `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",
	"workbench.tree.indent": 20,
	"workbench.colorCustomizations": {
		"editorLineNumber.activeForeground": "#ff0000",
		"[GitHub Sharp]": {
			"statusBarItem.remoteBackground": "#24292E",
			"editorPane.background": "#f3f1f11a"
		}
	}

	"gitBranch.base": "remote-repo/master",

	// Experimental
	"workbench.view.experimental.allowMovingToNewContainer": true,
}`;
            await updateSettings(expected, client);
            try {
                await testObject.sync(await client.manifest());
                assert.fail('should fail with invalid content error');
            }
            catch (e) {
                assert.ok(e instanceof userDataSync_1.UserDataSyncError);
                assert.deepStrictEqual(e.code, "LocalInvalidContent" /* UserDataSyncErrorCode.LocalInvalidContent */);
            }
        });
        test('sync when there are conflicts', async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            await updateSettings(JSON.stringify({
                'a': 1,
                'b': 2,
                'settingsSync.ignoredSettings': ['a']
            }), client2);
            await client2.sync();
            await updateSettings(JSON.stringify({
                'a': 2,
                'b': 1,
                'settingsSync.ignoredSettings': ['a']
            }), client);
            await testObject.sync(await client.manifest());
            assert.strictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            assert.strictEqual(testObject.conflicts[0].localResource.toString(), testObject.localResource.toString());
            const fileService = client.instantiationService.get(files_1.IFileService);
            const mergeContent = (await fileService.readFile(testObject.conflicts[0].previewResource)).value.toString();
            assert.deepStrictEqual(JSON.parse(mergeContent), {
                'b': 1,
                'settingsSync.ignoredSettings': ['a']
            });
        });
    });
    suite('SettingsSync - Manual', () => {
        const disposableStore = new lifecycle_1.DisposableStore();
        const server = new userDataSyncClient_1.UserDataSyncTestServer();
        let client;
        let testObject;
        setup(async () => {
            client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client.setUp(true);
            testObject = client.getSynchronizer("settings" /* SyncResource.Settings */);
            disposableStore.add((0, lifecycle_1.toDisposable)(() => client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService).clear()));
        });
        teardown(() => disposableStore.clear());
        test('do not sync ignored settings', async () => {
            const settingsContent = `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Editor
	"editor.fontFamily": "Fira Code",

	// Terminal
	"terminal.integrated.shell.osx": "some path",

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",

	// Ignored
	"settingsSync.ignoredSettings": [
		"editor.fontFamily",
		"terminal.integrated.shell.osx"
	]
}`;
            await updateSettings(settingsContent, client);
            let preview = await testObject.preview(await client.manifest(), {});
            assert.strictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource);
            preview = await testObject.apply(false);
            const { content } = await client.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSettings(content);
            assert.deepStrictEqual(actual, `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",

	// Ignored
	"settingsSync.ignoredSettings": [
		"editor.fontFamily",
		"terminal.integrated.shell.osx"
	]
}`);
        });
    });
    function parseSettings(content) {
        const syncData = JSON.parse(content);
        const settingsSyncContent = JSON.parse(syncData.content);
        return settingsSyncContent.settings;
    }
    async function updateSettings(content, client) {
        await client.instantiationService.get(files_1.IFileService).writeFile(client.instantiationService.get(environment_1.IEnvironmentService).settingsResource, buffer_1.VSBuffer.fromString(content));
        await client.instantiationService.get(configuration_1.IConfigurationService).reloadConfiguration();
    }
});
//# sourceMappingURL=settingsSync.test.js.map