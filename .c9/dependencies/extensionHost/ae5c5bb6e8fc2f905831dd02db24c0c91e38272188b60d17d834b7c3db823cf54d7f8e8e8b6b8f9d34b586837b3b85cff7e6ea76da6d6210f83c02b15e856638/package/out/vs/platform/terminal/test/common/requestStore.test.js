/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/terminal/common/requestStore"], function (require, exports, assert_1, instantiationServiceMock_1, log_1, requestStore_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('RequestStore', () => {
        let instantiationService;
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(log_1.ILogService, new log_1.LogService(new log_1.ConsoleLogger()));
        });
        test('should resolve requests', async () => {
            const store = instantiationService.createInstance(requestStore_1.RequestStore, undefined);
            let eventArgs;
            store.onCreateRequest(e => eventArgs = e);
            const request = store.createRequest({ arg: 'foo' });
            (0, assert_1.strictEqual)(typeof (eventArgs === null || eventArgs === void 0 ? void 0 : eventArgs.requestId), 'number');
            (0, assert_1.strictEqual)(eventArgs === null || eventArgs === void 0 ? void 0 : eventArgs.arg, 'foo');
            store.acceptReply(eventArgs.requestId, { data: 'bar' });
            const result = await request;
            (0, assert_1.strictEqual)(result.data, 'bar');
        });
        test('should reject the promise when the request times out', async () => {
            const store = instantiationService.createInstance(requestStore_1.RequestStore, 1);
            const request = store.createRequest({ arg: 'foo' });
            let threw = false;
            try {
                await request;
            }
            catch (e) {
                threw = true;
            }
            if (!threw) {
                (0, assert_1.fail)();
            }
        });
    });
});
//# sourceMappingURL=requestStore.test.js.map