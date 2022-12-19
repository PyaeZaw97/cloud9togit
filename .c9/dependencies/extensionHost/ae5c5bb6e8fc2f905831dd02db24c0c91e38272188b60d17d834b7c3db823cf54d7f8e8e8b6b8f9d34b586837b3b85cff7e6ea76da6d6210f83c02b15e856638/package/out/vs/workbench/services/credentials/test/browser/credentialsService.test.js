/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/workbench/services/credentials/browser/credentialsService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, lifecycle_1, credentialsService_1, workbenchTestServices_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('CredentialsService - web', () => {
        const serviceId1 = 'test.credentialsService1';
        const serviceId2 = 'test.credentialsService2';
        const disposables = new lifecycle_1.DisposableStore();
        let credentialsService;
        setup(async () => {
            credentialsService = disposables.add(new credentialsService_1.BrowserCredentialsService(workbenchTestServices_1.TestEnvironmentService, new workbenchTestServices_1.TestRemoteAgentService(), workbenchTestServices_2.TestProductService));
            await credentialsService.setPassword(serviceId1, 'me1', '1');
            await credentialsService.setPassword(serviceId1, 'me2', '2');
            await credentialsService.setPassword(serviceId2, 'me3', '3');
        });
        teardown(() => disposables.clear());
        test('Gets correct values for service', async () => {
            const credentials = await credentialsService.findCredentials(serviceId1);
            assert.strictEqual(credentials.length, 2);
            assert.strictEqual(credentials[0].password, '1');
        });
        test('Gets correct value for credential', async () => {
            const credentials = await credentialsService.getPassword(serviceId1, 'me1');
            assert.strictEqual(credentials, '1');
        });
        test('Gets null for no account', async () => {
            const credentials = await credentialsService.getPassword(serviceId1, 'doesnotexist');
            assert.strictEqual(credentials, null);
        });
        test('Gets null for no service or a different service', async () => {
            let credentials = await credentialsService.getPassword('doesnotexist', 'me1');
            assert.strictEqual(credentials, null);
            credentials = await credentialsService.getPassword(serviceId2, 'me1');
            assert.strictEqual(credentials, null);
        });
        test('Delete removes the value', async () => {
            const result = await credentialsService.deletePassword(serviceId1, 'me1');
            assert.strictEqual(result, true);
            const pass = await credentialsService.getPassword(serviceId1, 'me1');
            assert.strictEqual(pass, null);
        });
        test('Clear removes all values for service', async () => {
            await credentialsService.clear();
            const credentials = await credentialsService.findCredentials(serviceId1);
            assert.strictEqual(credentials.length, 0);
        });
    });
});
//# sourceMappingURL=credentialsService.test.js.map