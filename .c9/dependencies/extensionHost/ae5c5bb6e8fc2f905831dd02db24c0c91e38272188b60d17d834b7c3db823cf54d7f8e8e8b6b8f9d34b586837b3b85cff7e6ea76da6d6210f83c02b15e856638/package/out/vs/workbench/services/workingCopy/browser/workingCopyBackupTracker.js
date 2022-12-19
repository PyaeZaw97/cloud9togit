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
define(["require", "exports", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/workbench/services/workingCopy/common/workingCopyBackupTracker", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService"], function (require, exports, workingCopyBackup_1, filesConfigurationService_1, workingCopyService_1, lifecycle_1, log_1, workingCopyBackupTracker_1, workingCopyEditorService_1, editorService_1, editorGroupsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserWorkingCopyBackupTracker = void 0;
    let BrowserWorkingCopyBackupTracker = class BrowserWorkingCopyBackupTracker extends workingCopyBackupTracker_1.WorkingCopyBackupTracker {
        constructor(workingCopyBackupService, filesConfigurationService, workingCopyService, lifecycleService, logService, workingCopyEditorService, editorService, editorGroupService) {
            super(workingCopyBackupService, workingCopyService, logService, lifecycleService, filesConfigurationService, workingCopyEditorService, editorService, editorGroupService);
        }
        onFinalBeforeShutdown(reason) {
            // Web: we cannot perform long running in the shutdown phase
            // As such we need to check sync if there are any dirty working
            // copies that have not been backed up yet and then prevent the
            // shutdown if that is the case.
            const dirtyWorkingCopies = this.workingCopyService.dirtyWorkingCopies;
            if (!dirtyWorkingCopies.length) {
                return false; // no dirty: no veto
            }
            if (!this.filesConfigurationService.isHotExitEnabled) {
                return true; // dirty without backup: veto
            }
            for (const dirtyWorkingCopy of dirtyWorkingCopies) {
                if (!this.workingCopyBackupService.hasBackupSync(dirtyWorkingCopy, this.getContentVersion(dirtyWorkingCopy))) {
                    this.logService.warn('Unload veto: pending backups');
                    return true; // dirty without backup: veto
                }
            }
            return false; // dirty with backups: no veto
        }
    };
    BrowserWorkingCopyBackupTracker = __decorate([
        __param(0, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(1, filesConfigurationService_1.IFilesConfigurationService),
        __param(2, workingCopyService_1.IWorkingCopyService),
        __param(3, lifecycle_1.ILifecycleService),
        __param(4, log_1.ILogService),
        __param(5, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(6, editorService_1.IEditorService),
        __param(7, editorGroupsService_1.IEditorGroupsService)
    ], BrowserWorkingCopyBackupTracker);
    exports.BrowserWorkingCopyBackupTracker = BrowserWorkingCopyBackupTracker;
});
//# sourceMappingURL=workingCopyBackupTracker.js.map