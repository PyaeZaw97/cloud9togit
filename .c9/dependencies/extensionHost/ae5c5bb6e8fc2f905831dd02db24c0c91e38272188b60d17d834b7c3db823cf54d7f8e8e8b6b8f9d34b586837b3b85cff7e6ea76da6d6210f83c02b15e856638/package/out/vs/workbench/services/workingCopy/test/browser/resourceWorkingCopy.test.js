/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/uri", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/files/common/files", "vs/workbench/services/workingCopy/common/resourceWorkingCopy", "vs/base/common/lifecycle"], function (require, exports, assert, event_1, uri_1, workbenchTestServices_1, files_1, resourceWorkingCopy_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ResourceWorkingCopy', function () {
        class TestResourceWorkingCopy extends resourceWorkingCopy_1.ResourceWorkingCopy {
            constructor() {
                super(...arguments);
                this.name = 'testName';
                this.typeId = 'testTypeId';
                this.capabilities = 0 /* WorkingCopyCapabilities.None */;
                this.onDidChangeDirty = event_1.Event.None;
                this.onDidChangeContent = event_1.Event.None;
                this.onDidSave = event_1.Event.None;
            }
            isDirty() { return false; }
            async backup(token) { throw new Error('Method not implemented.'); }
            async save(options) { return false; }
            async revert(options) { }
        }
        let disposables;
        let resource = uri_1.URI.file('test/resource');
        let instantiationService;
        let accessor;
        let workingCopy;
        function createWorkingCopy(uri = resource) {
            return new TestResourceWorkingCopy(uri, accessor.fileService);
        }
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            workingCopy = createWorkingCopy();
        });
        teardown(() => {
            workingCopy.dispose();
            disposables.dispose();
        });
        test('orphaned tracking', async () => {
            assert.strictEqual(workingCopy.isOrphaned(), false);
            let onDidChangeOrphanedPromise = event_1.Event.toPromise(workingCopy.onDidChangeOrphaned);
            accessor.fileService.notExistsSet.set(resource, true);
            accessor.fileService.fireFileChanges(new files_1.FileChangesEvent([{ resource, type: 2 /* FileChangeType.DELETED */ }], false));
            await onDidChangeOrphanedPromise;
            assert.strictEqual(workingCopy.isOrphaned(), true);
            onDidChangeOrphanedPromise = event_1.Event.toPromise(workingCopy.onDidChangeOrphaned);
            accessor.fileService.notExistsSet.delete(resource);
            accessor.fileService.fireFileChanges(new files_1.FileChangesEvent([{ resource, type: 1 /* FileChangeType.ADDED */ }], false));
            await onDidChangeOrphanedPromise;
            assert.strictEqual(workingCopy.isOrphaned(), false);
        });
        test('dispose, isDisposed', async () => {
            assert.strictEqual(workingCopy.isDisposed(), false);
            let disposedEvent = false;
            workingCopy.onWillDispose(() => {
                disposedEvent = true;
            });
            workingCopy.dispose();
            assert.strictEqual(workingCopy.isDisposed(), true);
            assert.strictEqual(disposedEvent, true);
        });
    });
});
//# sourceMappingURL=resourceWorkingCopy.test.js.map