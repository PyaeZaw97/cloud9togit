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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation"], function (require, exports, async_1, cancellation_1, lifecycle_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IEditorProgressService = exports.LongRunningOperation = exports.UnmanagedProgress = exports.Progress = exports.emptyProgressRunner = exports.ProgressLocation = exports.IProgressService = void 0;
    exports.IProgressService = (0, instantiation_1.createDecorator)('progressService');
    var ProgressLocation;
    (function (ProgressLocation) {
        ProgressLocation[ProgressLocation["Explorer"] = 1] = "Explorer";
        ProgressLocation[ProgressLocation["Scm"] = 3] = "Scm";
        ProgressLocation[ProgressLocation["Extensions"] = 5] = "Extensions";
        ProgressLocation[ProgressLocation["Window"] = 10] = "Window";
        ProgressLocation[ProgressLocation["Notification"] = 15] = "Notification";
        ProgressLocation[ProgressLocation["Dialog"] = 20] = "Dialog";
    })(ProgressLocation = exports.ProgressLocation || (exports.ProgressLocation = {}));
    exports.emptyProgressRunner = Object.freeze({
        total() { },
        worked() { },
        done() { }
    });
    class Progress {
        constructor(callback) {
            this.callback = callback;
        }
        get value() { return this._value; }
        report(item) {
            this._value = item;
            this.callback(this._value);
        }
    }
    exports.Progress = Progress;
    Progress.None = Object.freeze({ report() { } });
    /**
     * RAII-style progress instance that allows imperative reporting and hides
     * once `dispose()` is called.
     */
    let UnmanagedProgress = class UnmanagedProgress extends lifecycle_1.Disposable {
        constructor(options, progressService) {
            super();
            this.deferred = new async_1.DeferredPromise();
            progressService.withProgress(options, reporter => {
                this.reporter = reporter;
                if (this.lastStep) {
                    reporter.report(this.lastStep);
                }
                return this.deferred.p;
            });
            this._register((0, lifecycle_1.toDisposable)(() => this.deferred.complete()));
        }
        report(step) {
            if (this.reporter) {
                this.reporter.report(step);
            }
            else {
                this.lastStep = step;
            }
        }
    };
    UnmanagedProgress = __decorate([
        __param(1, exports.IProgressService)
    ], UnmanagedProgress);
    exports.UnmanagedProgress = UnmanagedProgress;
    class LongRunningOperation extends lifecycle_1.Disposable {
        constructor(progressIndicator) {
            super();
            this.progressIndicator = progressIndicator;
            this.currentOperationId = 0;
            this.currentOperationDisposables = this._register(new lifecycle_1.DisposableStore());
        }
        start(progressDelay) {
            // Stop any previous operation
            this.stop();
            // Start new
            const newOperationId = ++this.currentOperationId;
            const newOperationToken = new cancellation_1.CancellationTokenSource();
            this.currentProgressTimeout = setTimeout(() => {
                if (newOperationId === this.currentOperationId) {
                    this.currentProgressRunner = this.progressIndicator.show(true);
                }
            }, progressDelay);
            this.currentOperationDisposables.add((0, lifecycle_1.toDisposable)(() => clearTimeout(this.currentProgressTimeout)));
            this.currentOperationDisposables.add((0, lifecycle_1.toDisposable)(() => newOperationToken.cancel()));
            this.currentOperationDisposables.add((0, lifecycle_1.toDisposable)(() => this.currentProgressRunner ? this.currentProgressRunner.done() : undefined));
            return {
                id: newOperationId,
                token: newOperationToken.token,
                stop: () => this.doStop(newOperationId),
                isCurrent: () => this.currentOperationId === newOperationId
            };
        }
        stop() {
            this.doStop(this.currentOperationId);
        }
        doStop(operationId) {
            if (this.currentOperationId === operationId) {
                this.currentOperationDisposables.clear();
            }
        }
    }
    exports.LongRunningOperation = LongRunningOperation;
    exports.IEditorProgressService = (0, instantiation_1.createDecorator)('editorProgressService');
});
//# sourceMappingURL=progress.js.map