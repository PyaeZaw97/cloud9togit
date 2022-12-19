define(["require", "exports", "assert", "vs/workbench/api/common/extHostFileSystemEventService", "vs/platform/log/common/log"], function (require, exports, assert, extHostFileSystemEventService_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostFileSystemEventService', () => {
        test('FileSystemWatcher ignore events properties are reversed #26851', function () {
            const protocol = {
                getProxy: () => { return undefined; },
                set: undefined,
                dispose: undefined,
                assertRegistered: undefined,
                drain: undefined
            };
            const watcher1 = new extHostFileSystemEventService_1.ExtHostFileSystemEventService(protocol, new log_1.NullLogService(), undefined).createFileSystemWatcher(undefined, undefined, '**/somethingInteresting', false, false, false);
            assert.strictEqual(watcher1.ignoreChangeEvents, false);
            assert.strictEqual(watcher1.ignoreCreateEvents, false);
            assert.strictEqual(watcher1.ignoreDeleteEvents, false);
            const watcher2 = new extHostFileSystemEventService_1.ExtHostFileSystemEventService(protocol, new log_1.NullLogService(), undefined).createFileSystemWatcher(undefined, undefined, '**/somethingBoring', true, true, true);
            assert.strictEqual(watcher2.ignoreChangeEvents, true);
            assert.strictEqual(watcher2.ignoreCreateEvents, true);
            assert.strictEqual(watcher2.ignoreDeleteEvents, true);
        });
    });
});
//# sourceMappingURL=extHostFileSystemEventService.test.js.map