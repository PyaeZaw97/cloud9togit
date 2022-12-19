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
define(["require", "exports", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/base/common/linkedList"], function (require, exports, log_1, lifecycle_1, configuration_1, linkedList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkingCopyFileOperationParticipant = void 0;
    let WorkingCopyFileOperationParticipant = class WorkingCopyFileOperationParticipant extends lifecycle_1.Disposable {
        constructor(logService, configurationService) {
            super();
            this.logService = logService;
            this.configurationService = configurationService;
            this.participants = new linkedList_1.LinkedList();
        }
        addFileOperationParticipant(participant) {
            const remove = this.participants.push(participant);
            return (0, lifecycle_1.toDisposable)(() => remove());
        }
        async participate(files, operation, undoInfo, token) {
            const timeout = this.configurationService.getValue('files.participants.timeout');
            if (typeof timeout !== 'number' || timeout <= 0) {
                return; // disabled
            }
            // For each participant
            for (const participant of this.participants) {
                try {
                    await participant.participate(files, operation, undoInfo, timeout, token);
                }
                catch (err) {
                    this.logService.warn(err);
                }
            }
        }
        dispose() {
            this.participants.clear();
        }
    };
    WorkingCopyFileOperationParticipant = __decorate([
        __param(0, log_1.ILogService),
        __param(1, configuration_1.IConfigurationService)
    ], WorkingCopyFileOperationParticipant);
    exports.WorkingCopyFileOperationParticipant = WorkingCopyFileOperationParticipant;
});
//# sourceMappingURL=workingCopyFileOperationParticipant.js.map