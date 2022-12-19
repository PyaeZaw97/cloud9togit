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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/progress/common/progress", "vs/workbench/common/views", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, event_1, lifecycle_1, progress_1, views_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompositeProgressIndicator = exports.CompositeProgressScope = exports.EditorProgressIndicator = void 0;
    class EditorProgressIndicator extends lifecycle_1.Disposable {
        constructor(progressBar, group) {
            super();
            this.progressBar = progressBar;
            this.group = group;
            this.registerListeners();
        }
        registerListeners() {
            // Stop any running progress when the active editor changes or
            // the group becomes empty.
            // In contrast to the composite progress indicator, we do not
            // track active editor progress and replay it later (yet).
            this._register(this.group.onDidModelChange(e => {
                if (e.kind === 6 /* GroupModelChangeKind.EDITOR_ACTIVE */ ||
                    (e.kind === 4 /* GroupModelChangeKind.EDITOR_CLOSE */ && this.group.isEmpty)) {
                    this.progressBar.stop().hide();
                }
            }));
        }
        show(infiniteOrTotal, delay) {
            // No editor open: ignore any progress reporting
            if (this.group.isEmpty) {
                return progress_1.emptyProgressRunner;
            }
            if (infiniteOrTotal === true) {
                return this.doShow(true, delay);
            }
            return this.doShow(infiniteOrTotal, delay);
        }
        doShow(infiniteOrTotal, delay) {
            if (typeof infiniteOrTotal === 'boolean') {
                this.progressBar.infinite().show(delay);
            }
            else {
                this.progressBar.total(infiniteOrTotal).show(delay);
            }
            return {
                total: (total) => {
                    this.progressBar.total(total);
                },
                worked: (worked) => {
                    if (this.progressBar.hasTotal()) {
                        this.progressBar.worked(worked);
                    }
                    else {
                        this.progressBar.infinite().show();
                    }
                },
                done: () => {
                    this.progressBar.stop().hide();
                }
            };
        }
        async showWhile(promise, delay) {
            // No editor open: ignore any progress reporting
            if (this.group.isEmpty) {
                try {
                    await promise;
                }
                catch (error) {
                    // ignore
                }
            }
            return this.doShowWhile(promise, delay);
        }
        async doShowWhile(promise, delay) {
            try {
                this.progressBar.infinite().show(delay);
                await promise;
            }
            catch (error) {
                // ignore
            }
            finally {
                this.progressBar.stop().hide();
            }
        }
    }
    exports.EditorProgressIndicator = EditorProgressIndicator;
    var ProgressIndicatorState;
    (function (ProgressIndicatorState) {
        let Type;
        (function (Type) {
            Type[Type["None"] = 0] = "None";
            Type[Type["Done"] = 1] = "Done";
            Type[Type["Infinite"] = 2] = "Infinite";
            Type[Type["While"] = 3] = "While";
            Type[Type["Work"] = 4] = "Work";
        })(Type = ProgressIndicatorState.Type || (ProgressIndicatorState.Type = {}));
        ProgressIndicatorState.None = { type: 0 /* Type.None */ };
        ProgressIndicatorState.Done = { type: 1 /* Type.Done */ };
        ProgressIndicatorState.Infinite = { type: 2 /* Type.Infinite */ };
        class While {
            constructor(whilePromise, whileStart, whileDelay) {
                this.whilePromise = whilePromise;
                this.whileStart = whileStart;
                this.whileDelay = whileDelay;
                this.type = 3 /* Type.While */;
            }
        }
        ProgressIndicatorState.While = While;
        class Work {
            constructor(total, worked) {
                this.total = total;
                this.worked = worked;
                this.type = 4 /* Type.Work */;
            }
        }
        ProgressIndicatorState.Work = Work;
    })(ProgressIndicatorState || (ProgressIndicatorState = {}));
    class ScopedProgressIndicator extends lifecycle_1.Disposable {
        constructor(progressBar, scope) {
            super();
            this.progressBar = progressBar;
            this.scope = scope;
            this.progressState = ProgressIndicatorState.None;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.scope.onDidChangeActive(() => {
                if (this.scope.isActive) {
                    this.onDidScopeActivate();
                }
                else {
                    this.onDidScopeDeactivate();
                }
            }));
        }
        onDidScopeActivate() {
            // Return early if progress state indicates that progress is done
            if (this.progressState.type === ProgressIndicatorState.Done.type) {
                return;
            }
            // Replay Infinite Progress from Promise
            if (this.progressState.type === 3 /* ProgressIndicatorState.Type.While */) {
                let delay;
                if (this.progressState.whileDelay > 0) {
                    const remainingDelay = this.progressState.whileDelay - (Date.now() - this.progressState.whileStart);
                    if (remainingDelay > 0) {
                        delay = remainingDelay;
                    }
                }
                this.doShowWhile(delay);
            }
            // Replay Infinite Progress
            else if (this.progressState.type === 2 /* ProgressIndicatorState.Type.Infinite */) {
                this.progressBar.infinite().show();
            }
            // Replay Finite Progress (Total & Worked)
            else if (this.progressState.type === 4 /* ProgressIndicatorState.Type.Work */) {
                if (this.progressState.total) {
                    this.progressBar.total(this.progressState.total).show();
                }
                if (this.progressState.worked) {
                    this.progressBar.worked(this.progressState.worked).show();
                }
            }
        }
        onDidScopeDeactivate() {
            this.progressBar.stop().hide();
        }
        show(infiniteOrTotal, delay) {
            // Sort out Arguments
            if (typeof infiniteOrTotal === 'boolean') {
                this.progressState = ProgressIndicatorState.Infinite;
            }
            else {
                this.progressState = new ProgressIndicatorState.Work(infiniteOrTotal, undefined);
            }
            // Active: Show Progress
            if (this.scope.isActive) {
                // Infinite: Start Progressbar and Show after Delay
                if (this.progressState.type === 2 /* ProgressIndicatorState.Type.Infinite */) {
                    this.progressBar.infinite().show(delay);
                }
                // Finite: Start Progressbar and Show after Delay
                else if (this.progressState.type === 4 /* ProgressIndicatorState.Type.Work */ && typeof this.progressState.total === 'number') {
                    this.progressBar.total(this.progressState.total).show(delay);
                }
            }
            return {
                total: (total) => {
                    this.progressState = new ProgressIndicatorState.Work(total, this.progressState.type === 4 /* ProgressIndicatorState.Type.Work */ ? this.progressState.worked : undefined);
                    if (this.scope.isActive) {
                        this.progressBar.total(total);
                    }
                },
                worked: (worked) => {
                    // Verify first that we are either not active or the progressbar has a total set
                    if (!this.scope.isActive || this.progressBar.hasTotal()) {
                        this.progressState = new ProgressIndicatorState.Work(this.progressState.type === 4 /* ProgressIndicatorState.Type.Work */ ? this.progressState.total : undefined, this.progressState.type === 4 /* ProgressIndicatorState.Type.Work */ && typeof this.progressState.worked === 'number' ? this.progressState.worked + worked : worked);
                        if (this.scope.isActive) {
                            this.progressBar.worked(worked);
                        }
                    }
                    // Otherwise the progress bar does not support worked(), we fallback to infinite() progress
                    else {
                        this.progressState = ProgressIndicatorState.Infinite;
                        this.progressBar.infinite().show();
                    }
                },
                done: () => {
                    this.progressState = ProgressIndicatorState.Done;
                    if (this.scope.isActive) {
                        this.progressBar.stop().hide();
                    }
                }
            };
        }
        async showWhile(promise, delay) {
            // Join with existing running promise to ensure progress is accurate
            if (this.progressState.type === 3 /* ProgressIndicatorState.Type.While */) {
                promise = Promise.all([promise, this.progressState.whilePromise]);
            }
            // Keep Promise in State
            this.progressState = new ProgressIndicatorState.While(promise, delay || 0, Date.now());
            try {
                this.doShowWhile(delay);
                await promise;
            }
            catch (error) {
                // ignore
            }
            finally {
                // If this is not the last promise in the list of joined promises, skip this
                if (this.progressState.type !== 3 /* ProgressIndicatorState.Type.While */ || this.progressState.whilePromise === promise) {
                    // The while promise is either null or equal the promise we last hooked on
                    this.progressState = ProgressIndicatorState.None;
                    if (this.scope.isActive) {
                        this.progressBar.stop().hide();
                    }
                }
            }
        }
        doShowWhile(delay) {
            // Show Progress when active
            if (this.scope.isActive) {
                this.progressBar.infinite().show(delay);
            }
        }
    }
    class CompositeProgressScope extends lifecycle_1.Disposable {
        constructor(paneCompositeService, viewsService, scopeId, _isActive) {
            super();
            this.paneCompositeService = paneCompositeService;
            this.viewsService = viewsService;
            this.scopeId = scopeId;
            this._isActive = _isActive;
            this._onDidChangeActive = this._register(new event_1.Emitter());
            this.onDidChangeActive = this._onDidChangeActive.event;
            this.registerListeners();
        }
        get isActive() { return this._isActive; }
        registerListeners() {
            this._register(this.viewsService.onDidChangeViewVisibility(e => e.visible ? this.onScopeOpened(e.id) : this.onScopeClosed(e.id)));
            this._register(this.paneCompositeService.onDidPaneCompositeOpen(e => this.onScopeOpened(e.composite.getId())));
            this._register(this.paneCompositeService.onDidPaneCompositeClose(e => this.onScopeClosed(e.composite.getId())));
        }
        onScopeOpened(scopeId) {
            if (scopeId === this.scopeId) {
                if (!this._isActive) {
                    this._isActive = true;
                    this._onDidChangeActive.fire();
                }
            }
        }
        onScopeClosed(scopeId) {
            if (scopeId === this.scopeId) {
                if (this._isActive) {
                    this._isActive = false;
                    this._onDidChangeActive.fire();
                }
            }
        }
    }
    exports.CompositeProgressScope = CompositeProgressScope;
    let CompositeProgressIndicator = class CompositeProgressIndicator extends ScopedProgressIndicator {
        constructor(progressbar, scopeId, isActive, paneCompositeService, viewsService) {
            super(progressbar, new CompositeProgressScope(paneCompositeService, viewsService, scopeId, isActive));
        }
    };
    CompositeProgressIndicator = __decorate([
        __param(3, panecomposite_1.IPaneCompositePartService),
        __param(4, views_1.IViewsService)
    ], CompositeProgressIndicator);
    exports.CompositeProgressIndicator = CompositeProgressIndicator;
});
//# sourceMappingURL=progressIndicator.js.map