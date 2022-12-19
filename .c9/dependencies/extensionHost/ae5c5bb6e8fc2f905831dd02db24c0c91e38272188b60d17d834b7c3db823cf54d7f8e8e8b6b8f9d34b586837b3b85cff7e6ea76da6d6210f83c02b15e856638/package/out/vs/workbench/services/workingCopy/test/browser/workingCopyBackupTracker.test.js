/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/browser/editorService", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/base/test/common/utils", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/log/common/log", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices", "vs/base/common/async", "vs/workbench/services/workingCopy/browser/workingCopyBackupTracker", "vs/base/common/lifecycle", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/base/common/buffer", "vs/base/common/platform", "vs/base/common/network", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/workspaces/test/common/testWorkspaceTrustService", "vs/platform/editor/common/editor"], function (require, exports, assert, uri_1, editorService_1, editorGroupsService_1, editorService_2, workingCopyBackup_1, utils_1, filesConfigurationService_1, workingCopyService_1, log_1, lifecycle_1, untitledTextEditorInput_1, workbenchTestServices_1, workbenchTestServices_2, async_1, workingCopyBackupTracker_1, lifecycle_2, workingCopyEditorService_1, buffer_1, platform_1, network_1, workspaceTrust_1, testWorkspaceTrustService_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('WorkingCopyBackupTracker (browser)', function () {
        let accessor;
        let disposables = new lifecycle_2.DisposableStore();
        setup(() => {
            disposables.add((0, workbenchTestServices_1.registerTestResourceEditor)());
        });
        teardown(() => {
            disposables.clear();
        });
        let TestWorkingCopyBackupTracker = class TestWorkingCopyBackupTracker extends workingCopyBackupTracker_1.BrowserWorkingCopyBackupTracker {
            constructor(workingCopyBackupService, filesConfigurationService, workingCopyService, lifecycleService, logService, workingCopyEditorService, editorService, editorGroupService) {
                super(workingCopyBackupService, filesConfigurationService, workingCopyService, lifecycleService, logService, workingCopyEditorService, editorService, editorGroupService);
            }
            getBackupScheduleDelay() {
                return 10; // Reduce timeout for tests
            }
            get pendingBackupOperationCount() { return this.pendingBackupOperations.size; }
            getUnrestoredBackups() {
                return this.unrestoredBackups;
            }
            async restoreBackups(handler) {
                return super.restoreBackups(handler);
            }
        };
        TestWorkingCopyBackupTracker = __decorate([
            __param(0, workingCopyBackup_1.IWorkingCopyBackupService),
            __param(1, filesConfigurationService_1.IFilesConfigurationService),
            __param(2, workingCopyService_1.IWorkingCopyService),
            __param(3, lifecycle_1.ILifecycleService),
            __param(4, log_1.ILogService),
            __param(5, workingCopyEditorService_1.IWorkingCopyEditorService),
            __param(6, editorService_1.IEditorService),
            __param(7, editorGroupsService_1.IEditorGroupsService)
        ], TestWorkingCopyBackupTracker);
        class TestUntitledTextEditorInput extends untitledTextEditorInput_1.UntitledTextEditorInput {
            constructor() {
                super(...arguments);
                this.resolved = false;
            }
            resolve() {
                this.resolved = true;
                return super.resolve();
            }
        }
        async function createTracker() {
            const disposables = new lifecycle_2.DisposableStore();
            const workingCopyBackupService = new workbenchTestServices_1.InMemoryTestWorkingCopyBackupService();
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            instantiationService.stub(workingCopyBackup_1.IWorkingCopyBackupService, workingCopyBackupService);
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            disposables.add((0, workbenchTestServices_1.registerTestResourceEditor)());
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustRequestService, new testWorkspaceTrustService_1.TestWorkspaceTrustRequestService(false));
            const editorService = instantiationService.createInstance(editorService_2.EditorService);
            instantiationService.stub(editorService_1.IEditorService, editorService);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            const tracker = disposables.add(instantiationService.createInstance(TestWorkingCopyBackupTracker));
            return { accessor, part, tracker, workingCopyBackupService: workingCopyBackupService, instantiationService, cleanup: () => disposables.dispose() };
        }
        async function untitledBackupTest(untitled = { resource: undefined }) {
            var _a, _b;
            const { accessor, cleanup, workingCopyBackupService } = await createTracker();
            const untitledTextEditor = (_a = (await accessor.editorService.openEditor(untitled))) === null || _a === void 0 ? void 0 : _a.input;
            const untitledTextModel = await untitledTextEditor.resolve();
            if (!(untitled === null || untitled === void 0 ? void 0 : untitled.contents)) {
                (_b = untitledTextModel.textEditorModel) === null || _b === void 0 ? void 0 : _b.setValue('Super Good');
            }
            await workingCopyBackupService.joinBackupResource();
            assert.strictEqual(workingCopyBackupService.hasBackupSync(untitledTextModel), true);
            untitledTextModel.dispose();
            await workingCopyBackupService.joinDiscardBackup();
            assert.strictEqual(workingCopyBackupService.hasBackupSync(untitledTextModel), false);
            cleanup();
        }
        test('Track backups (untitled)', function () {
            return untitledBackupTest();
        });
        test('Track backups (untitled with initial contents)', function () {
            return untitledBackupTest({ resource: undefined, contents: 'Foo Bar' });
        });
        test('Track backups (custom)', async function () {
            const { accessor, tracker, cleanup, workingCopyBackupService } = await createTracker();
            class TestBackupWorkingCopy extends workbenchTestServices_2.TestWorkingCopy {
                constructor(resource) {
                    super(resource);
                    this.backupDelay = 0;
                    accessor.workingCopyService.registerWorkingCopy(this);
                }
                async backup(token) {
                    await (0, async_1.timeout)(this.backupDelay);
                    return {};
                }
            }
            const resource = utils_1.toResource.call(this, '/path/custom.txt');
            const customWorkingCopy = new TestBackupWorkingCopy(resource);
            // Normal
            customWorkingCopy.setDirty(true);
            assert.strictEqual(tracker.pendingBackupOperationCount, 1);
            await workingCopyBackupService.joinBackupResource();
            assert.strictEqual(workingCopyBackupService.hasBackupSync(customWorkingCopy), true);
            customWorkingCopy.setDirty(false);
            customWorkingCopy.setDirty(true);
            assert.strictEqual(tracker.pendingBackupOperationCount, 1);
            await workingCopyBackupService.joinBackupResource();
            assert.strictEqual(workingCopyBackupService.hasBackupSync(customWorkingCopy), true);
            customWorkingCopy.setDirty(false);
            assert.strictEqual(tracker.pendingBackupOperationCount, 1);
            await workingCopyBackupService.joinDiscardBackup();
            assert.strictEqual(workingCopyBackupService.hasBackupSync(customWorkingCopy), false);
            // Cancellation
            customWorkingCopy.setDirty(true);
            await (0, async_1.timeout)(0);
            customWorkingCopy.setDirty(false);
            assert.strictEqual(tracker.pendingBackupOperationCount, 1);
            await workingCopyBackupService.joinDiscardBackup();
            assert.strictEqual(workingCopyBackupService.hasBackupSync(customWorkingCopy), false);
            customWorkingCopy.dispose();
            cleanup();
        });
        async function restoreBackupsInit() {
            const fooFile = uri_1.URI.file(platform_1.isWindows ? 'c:\\Foo' : '/Foo');
            const barFile = uri_1.URI.file(platform_1.isWindows ? 'c:\\Bar' : '/Bar');
            const untitledFile1 = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-1' });
            const untitledFile2 = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-2' });
            const disposables = new lifecycle_2.DisposableStore();
            const workingCopyBackupService = new workbenchTestServices_1.InMemoryTestWorkingCopyBackupService();
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            instantiationService.stub(workingCopyBackup_1.IWorkingCopyBackupService, workingCopyBackupService);
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustRequestService, new testWorkspaceTrustService_1.TestWorkspaceTrustRequestService(false));
            const editorService = instantiationService.createInstance(editorService_2.EditorService);
            instantiationService.stub(editorService_1.IEditorService, editorService);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            // Backup 2 normal files and 2 untitled files
            const untitledFile1WorkingCopyId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile1);
            const untitledFile2WorkingCopyId = (0, workbenchTestServices_1.toTypedWorkingCopyId)(untitledFile2);
            await workingCopyBackupService.backup(untitledFile1WorkingCopyId, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('untitled-1')));
            await workingCopyBackupService.backup(untitledFile2WorkingCopyId, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('untitled-2')));
            const fooFileWorkingCopyId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
            const barFileWorkingCopyId = (0, workbenchTestServices_1.toTypedWorkingCopyId)(barFile);
            await workingCopyBackupService.backup(fooFileWorkingCopyId, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('fooFile')));
            await workingCopyBackupService.backup(barFileWorkingCopyId, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('barFile')));
            const tracker = disposables.add(instantiationService.createInstance(TestWorkingCopyBackupTracker));
            accessor.lifecycleService.phase = 3 /* LifecyclePhase.Restored */;
            return [tracker, accessor, disposables];
        }
        test('Restore backups (basics, some handled)', async function () {
            const [tracker, accessor, disposables] = await restoreBackupsInit();
            assert.strictEqual(tracker.getUnrestoredBackups().size, 0);
            let handlesCounter = 0;
            let isOpenCounter = 0;
            let createEditorCounter = 0;
            await tracker.restoreBackups({
                handles: workingCopy => {
                    handlesCounter++;
                    return workingCopy.typeId === 'testBackupTypeId';
                },
                isOpen: (workingCopy, editor) => {
                    isOpenCounter++;
                    return false;
                },
                createEditor: workingCopy => {
                    createEditorCounter++;
                    return accessor.instantiationService.createInstance(TestUntitledTextEditorInput, accessor.untitledTextEditorService.create({ initialValue: 'foo' }));
                }
            });
            assert.strictEqual(handlesCounter, 4);
            assert.strictEqual(isOpenCounter, 0);
            assert.strictEqual(createEditorCounter, 2);
            assert.strictEqual(accessor.editorService.count, 2);
            assert.ok(accessor.editorService.editors.every(editor => editor.isDirty()));
            assert.strictEqual(tracker.getUnrestoredBackups().size, 2);
            for (const editor of accessor.editorService.editors) {
                assert.ok(editor instanceof TestUntitledTextEditorInput);
                assert.strictEqual(editor.resolved, true);
            }
            (0, lifecycle_2.dispose)(disposables);
        });
        test('Restore backups (basics, none handled)', async function () {
            const [tracker, accessor, disposables] = await restoreBackupsInit();
            await tracker.restoreBackups({
                handles: workingCopy => false,
                isOpen: (workingCopy, editor) => { throw new Error('unexpected'); },
                createEditor: workingCopy => { throw new Error('unexpected'); }
            });
            assert.strictEqual(accessor.editorService.count, 0);
            assert.strictEqual(tracker.getUnrestoredBackups().size, 4);
            (0, lifecycle_2.dispose)(disposables);
        });
        test('Restore backups (basics, error case)', async function () {
            const [tracker, , disposables] = await restoreBackupsInit();
            try {
                await tracker.restoreBackups({
                    handles: workingCopy => true,
                    isOpen: (workingCopy, editor) => { throw new Error('unexpected'); },
                    createEditor: workingCopy => { throw new Error('unexpected'); }
                });
            }
            catch (error) {
                // ignore
            }
            assert.strictEqual(tracker.getUnrestoredBackups().size, 4);
            (0, lifecycle_2.dispose)(disposables);
        });
        test('Restore backups (multiple handlers)', async function () {
            const [tracker, accessor, disposables] = await restoreBackupsInit();
            const firstHandler = tracker.restoreBackups({
                handles: workingCopy => {
                    return workingCopy.typeId === 'testBackupTypeId';
                },
                isOpen: (workingCopy, editor) => {
                    return false;
                },
                createEditor: workingCopy => {
                    return accessor.instantiationService.createInstance(TestUntitledTextEditorInput, accessor.untitledTextEditorService.create({ initialValue: 'foo' }));
                }
            });
            const secondHandler = tracker.restoreBackups({
                handles: workingCopy => {
                    return workingCopy.typeId.length === 0;
                },
                isOpen: (workingCopy, editor) => {
                    return false;
                },
                createEditor: workingCopy => {
                    return accessor.instantiationService.createInstance(TestUntitledTextEditorInput, accessor.untitledTextEditorService.create({ initialValue: 'foo' }));
                }
            });
            await Promise.all([firstHandler, secondHandler]);
            assert.strictEqual(accessor.editorService.count, 4);
            assert.ok(accessor.editorService.editors.every(editor => editor.isDirty()));
            assert.strictEqual(tracker.getUnrestoredBackups().size, 0);
            for (const editor of accessor.editorService.editors) {
                assert.ok(editor instanceof TestUntitledTextEditorInput);
                assert.strictEqual(editor.resolved, true);
            }
            (0, lifecycle_2.dispose)(disposables);
        });
        test('Restore backups (editors already opened)', async function () {
            const [tracker, accessor, disposables] = await restoreBackupsInit();
            assert.strictEqual(tracker.getUnrestoredBackups().size, 0);
            let handlesCounter = 0;
            let isOpenCounter = 0;
            const editor1 = accessor.instantiationService.createInstance(TestUntitledTextEditorInput, accessor.untitledTextEditorService.create({ initialValue: 'foo' }));
            const editor2 = accessor.instantiationService.createInstance(TestUntitledTextEditorInput, accessor.untitledTextEditorService.create({ initialValue: 'foo' }));
            await accessor.editorService.openEditors([{ editor: editor1, options: { override: editor_1.EditorResolution.DISABLED } }, { editor: editor2, options: { override: editor_1.EditorResolution.DISABLED } }]);
            editor1.resolved = false;
            editor2.resolved = false;
            await tracker.restoreBackups({
                handles: workingCopy => {
                    handlesCounter++;
                    return workingCopy.typeId === 'testBackupTypeId';
                },
                isOpen: (workingCopy, editor) => {
                    isOpenCounter++;
                    return true;
                },
                createEditor: workingCopy => { throw new Error('unexpected'); }
            });
            assert.strictEqual(handlesCounter, 4);
            assert.strictEqual(isOpenCounter, 4);
            assert.strictEqual(accessor.editorService.count, 2);
            assert.strictEqual(tracker.getUnrestoredBackups().size, 2);
            for (const editor of accessor.editorService.editors) {
                assert.ok(editor instanceof TestUntitledTextEditorInput);
                // assert that we only call `resolve` on inactive editors
                if (accessor.editorService.isVisible(editor)) {
                    assert.strictEqual(editor.resolved, false);
                }
                else {
                    assert.strictEqual(editor.resolved, true);
                }
            }
            (0, lifecycle_2.dispose)(disposables);
        });
    });
});
//# sourceMappingURL=workingCopyBackupTracker.test.js.map