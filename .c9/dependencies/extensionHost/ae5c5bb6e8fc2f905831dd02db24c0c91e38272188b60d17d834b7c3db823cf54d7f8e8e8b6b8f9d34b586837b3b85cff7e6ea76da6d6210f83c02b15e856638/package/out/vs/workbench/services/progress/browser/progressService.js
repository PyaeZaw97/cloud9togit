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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/progress/common/progress", "vs/workbench/services/statusbar/browser/statusbar", "vs/base/common/async", "vs/workbench/services/activity/common/activity", "vs/platform/notification/common/notification", "vs/base/common/actions", "vs/base/common/event", "vs/platform/instantiation/common/extensions", "vs/platform/layout/browser/layoutService", "vs/base/browser/ui/dialog/dialog", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/keybinding/common/keybinding", "vs/base/browser/dom", "vs/base/common/linkedText", "vs/workbench/common/views", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/common/iconLabels", "vs/css!./media/progressService"], function (require, exports, nls_1, lifecycle_1, progress_1, statusbar_1, async_1, activity_1, notification_1, actions_1, event_1, extensions_1, layoutService_1, dialog_1, styler_1, themeService_1, keybinding_1, dom_1, linkedText_1, views_1, panecomposite_1, iconLabels_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProgressService = void 0;
    let ProgressService = class ProgressService extends lifecycle_1.Disposable {
        constructor(activityService, paneCompositeService, viewDescriptorService, viewsService, notificationService, statusbarService, layoutService, themeService, keybindingService) {
            super();
            this.activityService = activityService;
            this.paneCompositeService = paneCompositeService;
            this.viewDescriptorService = viewDescriptorService;
            this.viewsService = viewsService;
            this.notificationService = notificationService;
            this.statusbarService = statusbarService;
            this.layoutService = layoutService;
            this.themeService = themeService;
            this.keybindingService = keybindingService;
            this.windowProgressStack = [];
            this.windowProgressStatusEntry = undefined;
        }
        async withProgress(options, task, onDidCancel) {
            const { location } = options;
            const handleStringLocation = (location) => {
                const viewContainer = this.viewDescriptorService.getViewContainerById(location);
                if (viewContainer) {
                    const viewContainerLocation = this.viewDescriptorService.getViewContainerLocation(viewContainer);
                    if (viewContainerLocation !== null) {
                        return this.withPaneCompositeProgress(location, viewContainerLocation, task, Object.assign(Object.assign({}, options), { location }));
                    }
                }
                if (this.viewDescriptorService.getViewDescriptorById(location) !== null) {
                    return this.withViewProgress(location, task, Object.assign(Object.assign({}, options), { location }));
                }
                throw new Error(`Bad progress location: ${location}`);
            };
            if (typeof location === 'string') {
                return handleStringLocation(location);
            }
            switch (location) {
                case 15 /* ProgressLocation.Notification */:
                    return this.withNotificationProgress(Object.assign(Object.assign({}, options), { location }), task, onDidCancel);
                case 10 /* ProgressLocation.Window */:
                    if (options.command) {
                        // Window progress with command get's shown in the status bar
                        return this.withWindowProgress(Object.assign(Object.assign({}, options), { location }), task);
                    }
                    // Window progress without command can be shown as silent notification
                    // which will first appear in the status bar and can then be brought to
                    // the front when clicking.
                    return this.withNotificationProgress(Object.assign(Object.assign({ delay: 150 /* default for ProgressLocation.Window */ }, options), { silent: true, location: 15 /* ProgressLocation.Notification */ }), task, onDidCancel);
                case 1 /* ProgressLocation.Explorer */:
                    return this.withPaneCompositeProgress('workbench.view.explorer', 0 /* ViewContainerLocation.Sidebar */, task, Object.assign(Object.assign({}, options), { location }));
                case 3 /* ProgressLocation.Scm */:
                    return handleStringLocation('workbench.scm');
                case 5 /* ProgressLocation.Extensions */:
                    return this.withPaneCompositeProgress('workbench.view.extensions', 0 /* ViewContainerLocation.Sidebar */, task, Object.assign(Object.assign({}, options), { location }));
                case 20 /* ProgressLocation.Dialog */:
                    return this.withDialogProgress(options, task, onDidCancel);
                default:
                    throw new Error(`Bad progress location: ${location}`);
            }
        }
        withWindowProgress(options, callback) {
            const task = [options, new progress_1.Progress(() => this.updateWindowProgress())];
            const promise = callback(task[1]);
            let delayHandle = setTimeout(() => {
                delayHandle = undefined;
                this.windowProgressStack.unshift(task);
                this.updateWindowProgress();
                // show progress for at least 150ms
                Promise.all([
                    (0, async_1.timeout)(150),
                    promise
                ]).finally(() => {
                    const idx = this.windowProgressStack.indexOf(task);
                    this.windowProgressStack.splice(idx, 1);
                    this.updateWindowProgress();
                });
            }, 150);
            // cancel delay if promise finishes below 150ms
            return promise.finally(() => clearTimeout(delayHandle));
        }
        updateWindowProgress(idx = 0) {
            var _a;
            // We still have progress to show
            if (idx < this.windowProgressStack.length) {
                const [options, progress] = this.windowProgressStack[idx];
                let progressTitle = options.title;
                let progressMessage = progress.value && progress.value.message;
                let progressCommand = options.command;
                let text;
                let title;
                const source = options.source && typeof options.source !== 'string' ? options.source.label : options.source;
                if (progressTitle && progressMessage) {
                    // <title>: <message>
                    text = (0, nls_1.localize)('progress.text2', "{0}: {1}", progressTitle, progressMessage);
                    title = source ? (0, nls_1.localize)('progress.title3', "[{0}] {1}: {2}", source, progressTitle, progressMessage) : text;
                }
                else if (progressTitle) {
                    // <title>
                    text = progressTitle;
                    title = source ? (0, nls_1.localize)('progress.title2', "[{0}]: {1}", source, progressTitle) : text;
                }
                else if (progressMessage) {
                    // <message>
                    text = progressMessage;
                    title = source ? (0, nls_1.localize)('progress.title2', "[{0}]: {1}", source, progressMessage) : text;
                }
                else {
                    // no title, no message -> no progress. try with next on stack
                    this.updateWindowProgress(idx + 1);
                    return;
                }
                const statusEntryProperties = {
                    name: (0, nls_1.localize)('status.progress', "Progress Message"),
                    text,
                    showProgress: true,
                    ariaLabel: text,
                    tooltip: title,
                    command: progressCommand
                };
                if (this.windowProgressStatusEntry) {
                    this.windowProgressStatusEntry.update(statusEntryProperties);
                }
                else {
                    this.windowProgressStatusEntry = this.statusbarService.addEntry(statusEntryProperties, 'status.progress', 0 /* StatusbarAlignment.LEFT */);
                }
            }
            // Progress is done so we remove the status entry
            else {
                (_a = this.windowProgressStatusEntry) === null || _a === void 0 ? void 0 : _a.dispose();
                this.windowProgressStatusEntry = undefined;
            }
        }
        withNotificationProgress(options, callback, onDidCancel) {
            const progressStateModel = new class extends lifecycle_1.Disposable {
                constructor() {
                    super();
                    this._onDidReport = this._register(new event_1.Emitter());
                    this.onDidReport = this._onDidReport.event;
                    this._onWillDispose = this._register(new event_1.Emitter());
                    this.onWillDispose = this._onWillDispose.event;
                    this._step = undefined;
                    this._done = false;
                    this.promise = callback(this);
                    this.promise.finally(() => {
                        this.dispose();
                    });
                }
                get step() { return this._step; }
                get done() { return this._done; }
                report(step) {
                    this._step = step;
                    this._onDidReport.fire(step);
                }
                cancel(choice) {
                    onDidCancel === null || onDidCancel === void 0 ? void 0 : onDidCancel(choice);
                    this.dispose();
                }
                dispose() {
                    this._done = true;
                    this._onWillDispose.fire();
                    super.dispose();
                }
            };
            const createWindowProgress = () => {
                // Create a promise that we can resolve as needed
                // when the outside calls dispose on us
                const promise = new async_1.DeferredPromise();
                this.withWindowProgress({
                    location: 10 /* ProgressLocation.Window */,
                    title: options.title ? (0, linkedText_1.parseLinkedText)(options.title).toString() : undefined,
                    command: 'notifications.showList'
                }, progress => {
                    function reportProgress(step) {
                        if (step.message) {
                            progress.report({
                                message: (0, linkedText_1.parseLinkedText)(step.message).toString() // convert markdown links => string
                            });
                        }
                    }
                    // Apply any progress that was made already
                    if (progressStateModel.step) {
                        reportProgress(progressStateModel.step);
                    }
                    // Continue to report progress as it happens
                    const onDidReportListener = progressStateModel.onDidReport(step => reportProgress(step));
                    promise.p.finally(() => onDidReportListener.dispose());
                    // When the progress model gets disposed, we are done as well
                    event_1.Event.once(progressStateModel.onWillDispose)(() => promise.complete());
                    return promise.p;
                });
                // Dispose means completing our promise
                return (0, lifecycle_1.toDisposable)(() => promise.complete());
            };
            const createNotification = (message, silent, increment) => {
                const notificationDisposables = new lifecycle_1.DisposableStore();
                const primaryActions = options.primaryActions ? Array.from(options.primaryActions) : [];
                const secondaryActions = options.secondaryActions ? Array.from(options.secondaryActions) : [];
                if (options.buttons) {
                    options.buttons.forEach((button, index) => {
                        const buttonAction = new class extends actions_1.Action {
                            constructor() {
                                super(`progress.button.${button}`, button, undefined, true);
                            }
                            async run() {
                                progressStateModel.cancel(index);
                            }
                        };
                        notificationDisposables.add(buttonAction);
                        primaryActions.push(buttonAction);
                    });
                }
                if (options.cancellable) {
                    const cancelAction = new class extends actions_1.Action {
                        constructor() {
                            super('progress.cancel', (0, nls_1.localize)('cancel', "Cancel"), undefined, true);
                        }
                        async run() {
                            progressStateModel.cancel();
                        }
                    };
                    notificationDisposables.add(cancelAction);
                    primaryActions.push(cancelAction);
                }
                const notification = this.notificationService.notify({
                    severity: notification_1.Severity.Info,
                    message: (0, iconLabels_1.stripIcons)(message),
                    source: options.source,
                    actions: { primary: primaryActions, secondary: secondaryActions },
                    progress: typeof increment === 'number' && increment >= 0 ? { total: 100, worked: increment } : { infinite: true },
                    silent
                });
                // Switch to window based progress once the notification
                // changes visibility to hidden and is still ongoing.
                // Remove that window based progress once the notification
                // shows again.
                let windowProgressDisposable = undefined;
                const onVisibilityChange = (visible) => {
                    // Clear any previous running window progress
                    (0, lifecycle_1.dispose)(windowProgressDisposable);
                    // Create new window progress if notification got hidden
                    if (!visible && !progressStateModel.done) {
                        windowProgressDisposable = createWindowProgress();
                    }
                };
                notificationDisposables.add(notification.onDidChangeVisibility(onVisibilityChange));
                if (silent) {
                    onVisibilityChange(false);
                }
                // Clear upon dispose
                event_1.Event.once(notification.onDidClose)(() => notificationDisposables.dispose());
                return notification;
            };
            const updateProgress = (notification, increment) => {
                if (typeof increment === 'number' && increment >= 0) {
                    notification.progress.total(100); // always percentage based
                    notification.progress.worked(increment);
                }
                else {
                    notification.progress.infinite();
                }
            };
            let notificationHandle;
            let notificationTimeout;
            let titleAndMessage; // hoisted to make sure a delayed notification shows the most recent message
            const updateNotification = (step) => {
                // full message (inital or update)
                if ((step === null || step === void 0 ? void 0 : step.message) && options.title) {
                    titleAndMessage = `${options.title}: ${step.message}`; // always prefix with overall title if we have it (https://github.com/microsoft/vscode/issues/50932)
                }
                else {
                    titleAndMessage = options.title || (step === null || step === void 0 ? void 0 : step.message);
                }
                if (!notificationHandle && titleAndMessage) {
                    // create notification now or after a delay
                    if (typeof options.delay === 'number' && options.delay > 0) {
                        if (typeof notificationTimeout !== 'number') {
                            notificationTimeout = setTimeout(() => notificationHandle = createNotification(titleAndMessage, !!options.silent, step === null || step === void 0 ? void 0 : step.increment), options.delay);
                        }
                    }
                    else {
                        notificationHandle = createNotification(titleAndMessage, !!options.silent, step === null || step === void 0 ? void 0 : step.increment);
                    }
                }
                if (notificationHandle) {
                    if (titleAndMessage) {
                        notificationHandle.updateMessage(titleAndMessage);
                    }
                    if (typeof (step === null || step === void 0 ? void 0 : step.increment) === 'number') {
                        updateProgress(notificationHandle, step.increment);
                    }
                }
            };
            // Show initially
            updateNotification(progressStateModel.step);
            const listener = progressStateModel.onDidReport(step => updateNotification(step));
            event_1.Event.once(progressStateModel.onWillDispose)(() => listener.dispose());
            // Clean up eventually
            (async () => {
                try {
                    // with a delay we only wait for the finish of the promise
                    if (typeof options.delay === 'number' && options.delay > 0) {
                        await progressStateModel.promise;
                    }
                    // without a delay we show the notification for at least 800ms
                    // to reduce the chance of the notification flashing up and hiding
                    else {
                        await Promise.all([(0, async_1.timeout)(800), progressStateModel.promise]);
                    }
                }
                finally {
                    clearTimeout(notificationTimeout);
                    notificationHandle === null || notificationHandle === void 0 ? void 0 : notificationHandle.close();
                }
            })();
            return progressStateModel.promise;
        }
        withPaneCompositeProgress(paneCompositeId, viewContainerLocation, task, options) {
            // show in viewlet
            const progressIndicator = this.paneCompositeService.getProgressIndicator(paneCompositeId, viewContainerLocation);
            const promise = progressIndicator ? this.withCompositeProgress(progressIndicator, task, options) : task({ report: () => { } });
            // show on activity bar
            if (viewContainerLocation === 0 /* ViewContainerLocation.Sidebar */) {
                this.showOnActivityBar(paneCompositeId, options, promise);
            }
            return promise;
        }
        withViewProgress(viewId, task, options) {
            var _a;
            // show in viewlet
            const progressIndicator = this.viewsService.getViewProgressIndicator(viewId);
            const promise = progressIndicator ? this.withCompositeProgress(progressIndicator, task, options) : task({ report: () => { } });
            const location = this.viewDescriptorService.getViewLocationById(viewId);
            if (location !== 0 /* ViewContainerLocation.Sidebar */) {
                return promise;
            }
            const viewletId = (_a = this.viewDescriptorService.getViewContainerByViewId(viewId)) === null || _a === void 0 ? void 0 : _a.id;
            if (viewletId === undefined) {
                return promise;
            }
            // show on activity bar
            this.showOnActivityBar(viewletId, options, promise);
            return promise;
        }
        showOnActivityBar(viewletId, options, promise) {
            let activityProgress;
            let delayHandle = setTimeout(() => {
                delayHandle = undefined;
                const handle = this.activityService.showViewContainerActivity(viewletId, { badge: new activity_1.ProgressBadge(() => ''), clazz: 'progress-badge', priority: 100 });
                const startTimeVisible = Date.now();
                const minTimeVisible = 300;
                activityProgress = {
                    dispose() {
                        const d = Date.now() - startTimeVisible;
                        if (d < minTimeVisible) {
                            // should at least show for Nms
                            setTimeout(() => handle.dispose(), minTimeVisible - d);
                        }
                        else {
                            // shown long enough
                            handle.dispose();
                        }
                    }
                };
            }, options.delay || 300);
            promise.finally(() => {
                clearTimeout(delayHandle);
                (0, lifecycle_1.dispose)(activityProgress);
            });
        }
        withCompositeProgress(progressIndicator, task, options) {
            let discreteProgressRunner = undefined;
            function updateProgress(stepOrTotal) {
                var _a;
                // Figure out whether discrete progress applies
                // by figuring out the "total" progress to show
                // and the increment if any.
                let total = undefined;
                let increment = undefined;
                if (typeof stepOrTotal !== 'undefined') {
                    if (typeof stepOrTotal === 'number') {
                        total = stepOrTotal;
                    }
                    else if (typeof stepOrTotal.increment === 'number') {
                        total = (_a = stepOrTotal.total) !== null && _a !== void 0 ? _a : 100; // always percentage based
                        increment = stepOrTotal.increment;
                    }
                }
                // Discrete
                if (typeof total === 'number') {
                    if (!discreteProgressRunner) {
                        discreteProgressRunner = progressIndicator.show(total, options.delay);
                        promise.catch(() => undefined /* ignore */).finally(() => discreteProgressRunner === null || discreteProgressRunner === void 0 ? void 0 : discreteProgressRunner.done());
                    }
                    if (typeof increment === 'number') {
                        discreteProgressRunner.worked(increment);
                    }
                }
                // Infinite
                else {
                    if (discreteProgressRunner) {
                        discreteProgressRunner.done();
                    }
                    progressIndicator.showWhile(promise, options.delay);
                }
                return discreteProgressRunner;
            }
            const promise = task({
                report: progress => {
                    updateProgress(progress);
                }
            });
            updateProgress(options.total);
            return promise;
        }
        withDialogProgress(options, task, onDidCancel) {
            var _a;
            const disposables = new lifecycle_1.DisposableStore();
            const allowableCommands = [
                'workbench.action.quit',
                'workbench.action.reloadWindow',
                'copy',
                'cut',
                'editor.action.clipboardCopyAction',
                'editor.action.clipboardCutAction'
            ];
            let dialog;
            const createDialog = (message) => {
                const buttons = options.buttons || [];
                if (!options.sticky) {
                    buttons.push(options.cancellable ? (0, nls_1.localize)('cancel', "Cancel") : (0, nls_1.localize)('dismiss', "Dismiss"));
                }
                dialog = new dialog_1.Dialog(this.layoutService.container, message, buttons, {
                    type: 'pending',
                    detail: options.detail,
                    cancelId: buttons.length - 1,
                    disableCloseAction: options.sticky,
                    disableDefaultAction: options.sticky,
                    keyEventProcessor: (event) => {
                        const resolved = this.keybindingService.softDispatch(event, this.layoutService.container);
                        if (resolved === null || resolved === void 0 ? void 0 : resolved.commandId) {
                            if (!allowableCommands.includes(resolved.commandId)) {
                                dom_1.EventHelper.stop(event, true);
                            }
                        }
                    }
                });
                disposables.add(dialog);
                disposables.add((0, styler_1.attachDialogStyler)(dialog, this.themeService));
                dialog.show().then(dialogResult => {
                    onDidCancel === null || onDidCancel === void 0 ? void 0 : onDidCancel(dialogResult.button);
                    (0, lifecycle_1.dispose)(dialog);
                });
                return dialog;
            };
            // In order to support the `delay` option, we use a scheduler
            // that will guard each access to the dialog behind a delay
            // that is either the original delay for one invocation and
            // otherwise runs without delay.
            let delay = (_a = options.delay) !== null && _a !== void 0 ? _a : 0;
            let latestMessage = undefined;
            const scheduler = disposables.add(new async_1.RunOnceScheduler(() => {
                delay = 0; // since we have run once, we reset the delay
                if (latestMessage && !dialog) {
                    dialog = createDialog(latestMessage);
                }
                else if (latestMessage) {
                    dialog.updateMessage(latestMessage);
                }
            }, 0));
            const updateDialog = function (message) {
                latestMessage = message;
                // Make sure to only run one dialog update and not multiple
                if (!scheduler.isScheduled()) {
                    scheduler.schedule(delay);
                }
            };
            const promise = task({
                report: progress => {
                    updateDialog(progress.message);
                }
            });
            promise.finally(() => {
                (0, lifecycle_1.dispose)(disposables);
            });
            if (options.title) {
                updateDialog(options.title);
            }
            return promise;
        }
    };
    ProgressService = __decorate([
        __param(0, activity_1.IActivityService),
        __param(1, panecomposite_1.IPaneCompositePartService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, views_1.IViewsService),
        __param(4, notification_1.INotificationService),
        __param(5, statusbar_1.IStatusbarService),
        __param(6, layoutService_1.ILayoutService),
        __param(7, themeService_1.IThemeService),
        __param(8, keybinding_1.IKeybindingService)
    ], ProgressService);
    exports.ProgressService = ProgressService;
    (0, extensions_1.registerSingleton)(progress_1.IProgressService, ProgressService, true);
});
//# sourceMappingURL=progressService.js.map