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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/cancellation", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/base/common/lifecycle", "vs/base/common/arrays"], function (require, exports, nls_1, async_1, cancellation_1, log_1, progress_1, lifecycle_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StoredFileWorkingCopySaveParticipant = void 0;
    let StoredFileWorkingCopySaveParticipant = class StoredFileWorkingCopySaveParticipant extends lifecycle_1.Disposable {
        constructor(progressService, logService) {
            super();
            this.progressService = progressService;
            this.logService = logService;
            this.saveParticipants = [];
        }
        get length() { return this.saveParticipants.length; }
        addSaveParticipant(participant) {
            const remove = (0, arrays_1.insert)(this.saveParticipants, participant);
            return (0, lifecycle_1.toDisposable)(() => remove());
        }
        participate(workingCopy, context, token) {
            const cts = new cancellation_1.CancellationTokenSource(token);
            return this.progressService.withProgress({
                title: (0, nls_1.localize)('saveParticipants', "Saving '{0}'", workingCopy.name),
                location: 15 /* ProgressLocation.Notification */,
                cancellable: true,
                delay: workingCopy.isDirty() ? 3000 : 5000
            }, async (progress) => {
                var _a, _b;
                // undoStop before participation
                (_a = workingCopy.model) === null || _a === void 0 ? void 0 : _a.pushStackElement();
                for (const saveParticipant of this.saveParticipants) {
                    if (cts.token.isCancellationRequested || workingCopy.isDisposed()) {
                        break;
                    }
                    try {
                        const promise = saveParticipant.participate(workingCopy, context, progress, cts.token);
                        await (0, async_1.raceCancellation)(promise, cts.token);
                    }
                    catch (err) {
                        this.logService.warn(err);
                    }
                }
                // undoStop after participation
                (_b = workingCopy.model) === null || _b === void 0 ? void 0 : _b.pushStackElement();
            }, () => {
                // user cancel
                cts.dispose(true);
            });
        }
        dispose() {
            this.saveParticipants.splice(0, this.saveParticipants.length);
        }
    };
    StoredFileWorkingCopySaveParticipant = __decorate([
        __param(0, progress_1.IProgressService),
        __param(1, log_1.ILogService)
    ], StoredFileWorkingCopySaveParticipant);
    exports.StoredFileWorkingCopySaveParticipant = StoredFileWorkingCopySaveParticipant;
});
//# sourceMappingURL=storedFileWorkingCopySaveParticipant.js.map