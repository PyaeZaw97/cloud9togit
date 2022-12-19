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
define(["require", "exports", "assert", "vs/base/common/platform", "os", "vs/base/common/path", "vs/base/node/pfs", "vs/base/common/uri", "vs/base/test/node/testUtils", "vs/base/common/hash", "vs/workbench/services/workingCopy/electron-sandbox/workingCopyBackupTracker", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/browser/editorService", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/workbench/services/workingCopy/test/electron-browser/workingCopyBackupService.test", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/log/common/log", "vs/platform/files/common/files", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/dialogs/common/dialogs", "vs/platform/workspace/common/workspace", "vs/platform/native/electron-sandbox/native", "vs/workbench/test/electron-browser/workbenchTestServices", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/configuration/common/configuration", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/environment/common/environment", "vs/platform/workspace/test/common/testWorkspace", "vs/platform/progress/common/progress", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/workbench/test/common/workbenchTestServices", "vs/base/common/event"], function (require, exports, assert, platform_1, os_1, path_1, pfs_1, uri_1, testUtils_1, hash_1, workingCopyBackupTracker_1, editorService_1, editorGroupsService_1, editorService_2, workingCopyBackup_1, workingCopyBackupService_test_1, lifecycle_1, utils_1, filesConfigurationService_1, workingCopyService_1, log_1, files_1, lifecycle_2, dialogs_1, workspace_1, native_1, workbenchTestServices_1, testConfigurationService_1, configuration_1, workbenchTestServices_2, mockKeybindingService_1, environment_1, testWorkspace_1, progress_1, workingCopyEditorService_1, workbenchTestServices_3, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, testUtils_1.flakySuite)('WorkingCopyBackupTracker (native)', function () {
        let TestWorkingCopyBackupTracker = class TestWorkingCopyBackupTracker extends workingCopyBackupTracker_1.NativeWorkingCopyBackupTracker {
            constructor(workingCopyBackupService, filesConfigurationService, workingCopyService, lifecycleService, fileDialogService, dialogService, contextService, nativeHostService, logService, editorService, environmentService, progressService, workingCopyEditorService, editorGroupService) {
                super(workingCopyBackupService, filesConfigurationService, workingCopyService, lifecycleService, fileDialogService, dialogService, contextService, nativeHostService, logService, environmentService, progressService, workingCopyEditorService, editorService, editorGroupService);
                this._onDidResume = this._register(new event_1.Emitter());
                this.onDidResume = this._onDidResume.event;
                this._onDidSuspend = this._register(new event_1.Emitter());
                this.onDidSuspend = this._onDidSuspend.event;
            }
            getBackupScheduleDelay() {
                return 10; // Reduce timeout for tests
            }
            waitForReady() {
                return super.whenReady;
            }
            get pendingBackupOperationCount() { return this.pendingBackupOperations.size; }
            dispose() {
                super.dispose();
                for (const [_, disposable] of this.pendingBackupOperations) {
                    disposable.dispose();
                }
            }
            suspendBackupOperations() {
                const { resume } = super.suspendBackupOperations();
                this._onDidSuspend.fire();
                return {
                    resume: () => {
                        resume();
                        this._onDidResume.fire();
                    }
                };
            }
        };
        TestWorkingCopyBackupTracker = __decorate([
            __param(0, workingCopyBackup_1.IWorkingCopyBackupService),
            __param(1, filesConfigurationService_1.IFilesConfigurationService),
            __param(2, workingCopyService_1.IWorkingCopyService),
            __param(3, lifecycle_2.ILifecycleService),
            __param(4, dialogs_1.IFileDialogService),
            __param(5, dialogs_1.IDialogService),
            __param(6, workspace_1.IWorkspaceContextService),
            __param(7, native_1.INativeHostService),
            __param(8, log_1.ILogService),
            __param(9, editorService_1.IEditorService),
            __param(10, environment_1.IEnvironmentService),
            __param(11, progress_1.IProgressService),
            __param(12, workingCopyEditorService_1.IWorkingCopyEditorService),
            __param(13, editorGroupsService_1.IEditorGroupsService)
        ], TestWorkingCopyBackupTracker);
        let testDir;
        let backupHome;
        let workspaceBackupPath;
        let accessor;
        let disposables;
        setup(async () => {
            disposables = new lifecycle_1.DisposableStore();
            testDir = (0, testUtils_1.getRandomTestPath)((0, os_1.tmpdir)(), 'vsctests', 'backuprestorer');
            backupHome = (0, path_1.join)(testDir, 'Backups');
            const workspacesJsonPath = (0, path_1.join)(backupHome, 'workspaces.json');
            const workspaceResource = uri_1.URI.file(platform_1.isWindows ? 'c:\\workspace' : '/workspace');
            workspaceBackupPath = (0, path_1.join)(backupHome, (0, hash_1.hash)(workspaceResource.fsPath).toString(16));
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            disposables.add(accessor.textFileService.files);
            disposables.add((0, workbenchTestServices_2.registerTestFileEditor)());
            await pfs_1.Promises.mkdir(backupHome, { recursive: true });
            await pfs_1.Promises.mkdir(workspaceBackupPath, { recursive: true });
            return pfs_1.Promises.writeFile(workspacesJsonPath, '');
        });
        teardown(async () => {
            disposables.dispose();
            return pfs_1.Promises.rm(testDir);
        });
        async function createTracker(autoSaveEnabled = false) {
            const workingCopyBackupService = new workingCopyBackupService_test_1.NodeTestWorkingCopyBackupService(testDir, workspaceBackupPath);
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(disposables);
            instantiationService.stub(workingCopyBackup_1.IWorkingCopyBackupService, workingCopyBackupService);
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            if (autoSaveEnabled) {
                configurationService.setUserConfiguration('files', { autoSave: 'afterDelay', autoSaveDelay: 1 });
            }
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            instantiationService.stub(filesConfigurationService_1.IFilesConfigurationService, new workbenchTestServices_2.TestFilesConfigurationService(instantiationService.createInstance(mockKeybindingService_1.MockContextKeyService), configurationService, new workbenchTestServices_3.TestContextService(testWorkspace_1.TestWorkspace)));
            const part = await (0, workbenchTestServices_2.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            const editorService = instantiationService.createInstance(editorService_2.EditorService);
            instantiationService.stub(editorService_1.IEditorService, editorService);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            const tracker = instantiationService.createInstance(TestWorkingCopyBackupTracker);
            const cleanup = async () => {
                // File changes could also schedule some backup operations so we need to wait for them before finishing the test
                await accessor.workingCopyBackupService.waitForAllBackups();
                part.dispose();
                tracker.dispose();
            };
            return { accessor, part, tracker, instantiationService, cleanup };
        }
        test('Track backups (file, auto save off)', function () {
            return trackBackupsTest(utils_1.toResource.call(this, '/path/index.txt'), false);
        });
        test('Track backups (file, auto save on)', function () {
            return trackBackupsTest(utils_1.toResource.call(this, '/path/index.txt'), true);
        });
        async function trackBackupsTest(resource, autoSave) {
            var _a;
            const { accessor, cleanup } = await createTracker(autoSave);
            await accessor.editorService.openEditor({ resource, options: { pinned: true } });
            const fileModel = accessor.textFileService.files.get(resource);
            assert.ok(fileModel);
            (_a = fileModel.textEditorModel) === null || _a === void 0 ? void 0 : _a.setValue('Super Good');
            await accessor.workingCopyBackupService.joinBackupResource();
            assert.strictEqual(accessor.workingCopyBackupService.hasBackupSync(fileModel), true);
            fileModel.dispose();
            await accessor.workingCopyBackupService.joinDiscardBackup();
            assert.strictEqual(accessor.workingCopyBackupService.hasBackupSync(fileModel), false);
            await cleanup();
        }
        test('onWillShutdown - no veto if no dirty files', async function () {
            const { accessor, cleanup } = await createTracker();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await accessor.editorService.openEditor({ resource, options: { pinned: true } });
            const event = new workbenchTestServices_2.TestBeforeShutdownEvent();
            accessor.lifecycleService.fireBeforeShutdown(event);
            const veto = await event.value;
            assert.ok(!veto);
            await cleanup();
        });
        test('onWillShutdown - veto if user cancels (hot.exit: off)', async function () {
            var _a;
            const { accessor, cleanup } = await createTracker();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await accessor.editorService.openEditor({ resource, options: { pinned: true } });
            const model = accessor.textFileService.files.get(resource);
            accessor.fileDialogService.setConfirmResult(2 /* ConfirmResult.CANCEL */);
            accessor.filesConfigurationService.onFilesConfigurationChange({ files: { hotExit: 'off' } });
            await (model === null || model === void 0 ? void 0 : model.resolve());
            (_a = model === null || model === void 0 ? void 0 : model.textEditorModel) === null || _a === void 0 ? void 0 : _a.setValue('foo');
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
            const event = new workbenchTestServices_2.TestBeforeShutdownEvent();
            accessor.lifecycleService.fireBeforeShutdown(event);
            const veto = await event.value;
            assert.ok(veto);
            await cleanup();
        });
        test('onWillShutdown - no veto if auto save is on', async function () {
            var _a;
            const { accessor, cleanup } = await createTracker(true /* auto save enabled */);
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await accessor.editorService.openEditor({ resource, options: { pinned: true } });
            const model = accessor.textFileService.files.get(resource);
            await (model === null || model === void 0 ? void 0 : model.resolve());
            (_a = model === null || model === void 0 ? void 0 : model.textEditorModel) === null || _a === void 0 ? void 0 : _a.setValue('foo');
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
            const event = new workbenchTestServices_2.TestBeforeShutdownEvent();
            accessor.lifecycleService.fireBeforeShutdown(event);
            const veto = await event.value;
            assert.ok(!veto);
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 0);
            await cleanup();
        });
        test('onWillShutdown - no veto and backups cleaned up if user does not want to save (hot.exit: off)', async function () {
            var _a;
            const { accessor, cleanup } = await createTracker();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await accessor.editorService.openEditor({ resource, options: { pinned: true } });
            const model = accessor.textFileService.files.get(resource);
            accessor.fileDialogService.setConfirmResult(1 /* ConfirmResult.DONT_SAVE */);
            accessor.filesConfigurationService.onFilesConfigurationChange({ files: { hotExit: 'off' } });
            await (model === null || model === void 0 ? void 0 : model.resolve());
            (_a = model === null || model === void 0 ? void 0 : model.textEditorModel) === null || _a === void 0 ? void 0 : _a.setValue('foo');
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
            const event = new workbenchTestServices_2.TestBeforeShutdownEvent();
            accessor.lifecycleService.fireBeforeShutdown(event);
            const veto = await event.value;
            assert.ok(!veto);
            assert.ok(accessor.workingCopyBackupService.discardedBackups.length > 0);
            await cleanup();
        });
        test('onWillShutdown - no backups discarded when shutdown without dirty but tracker not ready', async function () {
            const { accessor, cleanup } = await createTracker();
            const event = new workbenchTestServices_2.TestBeforeShutdownEvent();
            accessor.lifecycleService.fireBeforeShutdown(event);
            const veto = await event.value;
            assert.ok(!veto);
            assert.ok(!accessor.workingCopyBackupService.discardedAllBackups);
            await cleanup();
        });
        test('onWillShutdown - backups discarded when shutdown without dirty', async function () {
            const { accessor, tracker, cleanup } = await createTracker();
            await tracker.waitForReady();
            const event = new workbenchTestServices_2.TestBeforeShutdownEvent();
            accessor.lifecycleService.fireBeforeShutdown(event);
            const veto = await event.value;
            assert.ok(!veto);
            assert.ok(!accessor.workingCopyBackupService.discardedAllBackups);
            await cleanup();
        });
        test('onWillShutdown - save (hot.exit: off)', async function () {
            var _a;
            const { accessor, cleanup } = await createTracker();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await accessor.editorService.openEditor({ resource, options: { pinned: true } });
            const model = accessor.textFileService.files.get(resource);
            accessor.fileDialogService.setConfirmResult(0 /* ConfirmResult.SAVE */);
            accessor.filesConfigurationService.onFilesConfigurationChange({ files: { hotExit: 'off' } });
            await (model === null || model === void 0 ? void 0 : model.resolve());
            (_a = model === null || model === void 0 ? void 0 : model.textEditorModel) === null || _a === void 0 ? void 0 : _a.setValue('foo');
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
            const event = new workbenchTestServices_2.TestBeforeShutdownEvent();
            accessor.lifecycleService.fireBeforeShutdown(event);
            const veto = await event.value;
            assert.ok(!veto);
            assert.ok(!(model === null || model === void 0 ? void 0 : model.isDirty()));
            await cleanup();
        });
        test('onWillShutdown - veto if backup fails', async function () {
            var _a;
            const { accessor, cleanup } = await createTracker();
            class TestBackupWorkingCopy extends workbenchTestServices_3.TestWorkingCopy {
                constructor(resource) {
                    super(resource);
                    accessor.workingCopyService.registerWorkingCopy(this);
                }
                async backup(token) {
                    throw new Error('unable to backup');
                }
            }
            const resource = utils_1.toResource.call(this, '/path/custom.txt');
            const customWorkingCopy = new TestBackupWorkingCopy(resource);
            customWorkingCopy.setDirty(true);
            const event = new workbenchTestServices_2.TestBeforeShutdownEvent();
            event.reason = 2 /* ShutdownReason.QUIT */;
            accessor.lifecycleService.fireBeforeShutdown(event);
            const veto = await event.value;
            assert.ok(veto);
            const finalVeto = await ((_a = event.finalValue) === null || _a === void 0 ? void 0 : _a.call(event));
            assert.ok(finalVeto); // assert the tracker uses the internal finalVeto API
            await cleanup();
        });
        test('onWillShutdown - pending backup operations canceled and tracker suspended/resumsed', async function () {
            var _a, _b, _c;
            const { accessor, tracker, cleanup } = await createTracker();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await accessor.editorService.openEditor({ resource, options: { pinned: true } });
            const model = accessor.textFileService.files.get(resource);
            await (model === null || model === void 0 ? void 0 : model.resolve());
            (_a = model === null || model === void 0 ? void 0 : model.textEditorModel) === null || _a === void 0 ? void 0 : _a.setValue('foo');
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
            assert.strictEqual(tracker.pendingBackupOperationCount, 1);
            const onSuspend = event_1.Event.toPromise(tracker.onDidSuspend);
            const event = new workbenchTestServices_2.TestBeforeShutdownEvent();
            event.reason = 2 /* ShutdownReason.QUIT */;
            accessor.lifecycleService.fireBeforeShutdown(event);
            await onSuspend;
            assert.strictEqual(tracker.pendingBackupOperationCount, 0);
            // Ops are suspended during shutdown!
            (_b = model === null || model === void 0 ? void 0 : model.textEditorModel) === null || _b === void 0 ? void 0 : _b.setValue('bar');
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
            assert.strictEqual(tracker.pendingBackupOperationCount, 0);
            const onResume = event_1.Event.toPromise(tracker.onDidResume);
            await event.value;
            // Ops are resumed after shutdown!
            (_c = model === null || model === void 0 ? void 0 : model.textEditorModel) === null || _c === void 0 ? void 0 : _c.setValue('foo');
            await onResume;
            assert.strictEqual(tracker.pendingBackupOperationCount, 1);
            await cleanup();
        });
        suite('Hot Exit', () => {
            suite('"onExit" setting', () => {
                test('should hot exit on non-Mac (reason: CLOSE, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* ShutdownReason.CLOSE */, false, true, !!platform_1.isMacintosh);
                });
                test('should hot exit on non-Mac (reason: CLOSE, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* ShutdownReason.CLOSE */, false, false, !!platform_1.isMacintosh);
                });
                test('should NOT hot exit (reason: CLOSE, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* ShutdownReason.CLOSE */, true, true, true);
                });
                test('should NOT hot exit (reason: CLOSE, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* ShutdownReason.CLOSE */, true, false, true);
                });
                test('should hot exit (reason: QUIT, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* ShutdownReason.QUIT */, false, true, false);
                });
                test('should hot exit (reason: QUIT, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* ShutdownReason.QUIT */, false, false, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* ShutdownReason.QUIT */, true, true, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* ShutdownReason.QUIT */, true, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* ShutdownReason.RELOAD */, false, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* ShutdownReason.RELOAD */, false, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* ShutdownReason.RELOAD */, true, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* ShutdownReason.RELOAD */, true, false, false);
                });
                test('should NOT hot exit (reason: LOAD, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* ShutdownReason.LOAD */, false, true, true);
                });
                test('should NOT hot exit (reason: LOAD, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* ShutdownReason.LOAD */, false, false, true);
                });
                test('should NOT hot exit (reason: LOAD, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* ShutdownReason.LOAD */, true, true, true);
                });
                test('should NOT hot exit (reason: LOAD, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* ShutdownReason.LOAD */, true, false, true);
                });
            });
            suite('"onExitAndWindowClose" setting', () => {
                test('should hot exit (reason: CLOSE, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* ShutdownReason.CLOSE */, false, true, false);
                });
                test('should hot exit (reason: CLOSE, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* ShutdownReason.CLOSE */, false, false, !!platform_1.isMacintosh);
                });
                test('should hot exit (reason: CLOSE, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* ShutdownReason.CLOSE */, true, true, false);
                });
                test('should NOT hot exit (reason: CLOSE, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* ShutdownReason.CLOSE */, true, false, true);
                });
                test('should hot exit (reason: QUIT, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* ShutdownReason.QUIT */, false, true, false);
                });
                test('should hot exit (reason: QUIT, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* ShutdownReason.QUIT */, false, false, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* ShutdownReason.QUIT */, true, true, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* ShutdownReason.QUIT */, true, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* ShutdownReason.RELOAD */, false, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* ShutdownReason.RELOAD */, false, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* ShutdownReason.RELOAD */, true, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* ShutdownReason.RELOAD */, true, false, false);
                });
                test('should hot exit (reason: LOAD, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* ShutdownReason.LOAD */, false, true, false);
                });
                test('should NOT hot exit (reason: LOAD, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* ShutdownReason.LOAD */, false, false, true);
                });
                test('should hot exit (reason: LOAD, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* ShutdownReason.LOAD */, true, true, false);
                });
                test('should NOT hot exit (reason: LOAD, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* ShutdownReason.LOAD */, true, false, true);
                });
            });
            async function hotExitTest(setting, shutdownReason, multipleWindows, workspace, shouldVeto) {
                var _a;
                const { accessor, cleanup } = await createTracker();
                const resource = utils_1.toResource.call(this, '/path/index.txt');
                await accessor.editorService.openEditor({ resource, options: { pinned: true } });
                const model = accessor.textFileService.files.get(resource);
                // Set hot exit config
                accessor.filesConfigurationService.onFilesConfigurationChange({ files: { hotExit: setting } });
                // Set empty workspace if required
                if (!workspace) {
                    accessor.contextService.setWorkspace(new testWorkspace_1.Workspace('empty:1508317022751'));
                }
                // Set multiple windows if required
                if (multipleWindows) {
                    accessor.nativeHostService.windowCount = Promise.resolve(2);
                }
                // Set cancel to force a veto if hot exit does not trigger
                accessor.fileDialogService.setConfirmResult(2 /* ConfirmResult.CANCEL */);
                await (model === null || model === void 0 ? void 0 : model.resolve());
                (_a = model === null || model === void 0 ? void 0 : model.textEditorModel) === null || _a === void 0 ? void 0 : _a.setValue('foo');
                assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
                const event = new workbenchTestServices_2.TestBeforeShutdownEvent();
                event.reason = shutdownReason;
                accessor.lifecycleService.fireBeforeShutdown(event);
                const veto = await event.value;
                assert.ok(typeof event.finalValue === 'function'); // assert the tracker uses the internal finalVeto API
                assert.strictEqual(accessor.workingCopyBackupService.discardedBackups.length, 0); // When hot exit is set, backups should never be cleaned since the confirm result is cancel
                assert.strictEqual(veto, shouldVeto);
                await cleanup();
            }
        });
    });
});
//# sourceMappingURL=workingCopyBackupTracker.test.js.map