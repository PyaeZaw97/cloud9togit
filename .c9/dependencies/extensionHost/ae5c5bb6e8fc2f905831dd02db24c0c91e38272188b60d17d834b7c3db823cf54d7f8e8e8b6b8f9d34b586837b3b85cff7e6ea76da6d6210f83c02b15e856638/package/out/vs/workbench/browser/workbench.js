/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/async", "vs/base/browser/browser", "vs/base/common/performance", "vs/base/common/errors", "vs/platform/registry/common/platform", "vs/base/common/platform", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/platform/instantiation/common/extensions", "vs/workbench/services/layout/browser/layoutService", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/notification/common/notification", "vs/workbench/browser/parts/notifications/notificationsCenter", "vs/workbench/browser/parts/notifications/notificationsAlerts", "vs/workbench/browser/parts/notifications/notificationsStatus", "vs/workbench/browser/parts/notifications/notificationsTelemetry", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/workbench/browser/parts/notifications/notificationsToasts", "vs/base/browser/ui/aria/aria", "vs/editor/browser/config/fontMeasurements", "vs/editor/common/config/fontInfo", "vs/base/common/errorMessage", "vs/workbench/browser/contextkeys", "vs/base/common/arrays", "vs/platform/instantiation/common/instantiationService", "vs/workbench/browser/layout", "vs/workbench/services/host/browser/host", "vs/platform/dialogs/common/dialogs", "vs/workbench/browser/style"], function (require, exports, nls_1, event_1, async_1, browser_1, performance_1, errors_1, platform_1, platform_2, contributions_1, editor_1, extensions_1, layoutService_1, storage_1, configuration_1, lifecycle_1, notification_1, notificationsCenter_1, notificationsAlerts_1, notificationsStatus_1, notificationsTelemetry_1, notificationsCommands_1, notificationsToasts_1, aria_1, fontMeasurements_1, fontInfo_1, errorMessage_1, contextkeys_1, arrays_1, instantiationService_1, layout_1, host_1, dialogs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Workbench = void 0;
    class Workbench extends layout_1.Layout {
        constructor(parent, options, serviceCollection, logService) {
            super(parent);
            this.options = options;
            this.serviceCollection = serviceCollection;
            this._onWillShutdown = this._register(new event_1.Emitter());
            this.onWillShutdown = this._onWillShutdown.event;
            this._onDidShutdown = this._register(new event_1.Emitter());
            this.onDidShutdown = this._onDidShutdown.event;
            this.previousUnexpectedError = { message: undefined, time: 0 };
            // Perf: measure workbench startup time
            (0, performance_1.mark)('code/willStartWorkbench');
            this.registerErrorHandler(logService);
        }
        registerErrorHandler(logService) {
            // Listen on unhandled rejection events
            window.addEventListener('unhandledrejection', (event) => {
                // See https://developer.mozilla.org/en-US/docs/Web/API/PromiseRejectionEvent
                (0, errors_1.onUnexpectedError)(event.reason);
                // Prevent the printing of this event to the console
                event.preventDefault();
            });
            // Install handler for unexpected errors
            (0, errors_1.setUnexpectedErrorHandler)(error => this.handleUnexpectedError(error, logService));
            window.require.config({
                onError: (err) => {
                    if (err.phase === 'loading') {
                        (0, errors_1.onUnexpectedError)(new Error((0, nls_1.localize)('loaderErrorNative', "Failed to load a required file. Please restart the application to try again. Details: {0}", JSON.stringify(err))));
                    }
                    console.error(err);
                }
            });
        }
        handleUnexpectedError(error, logService) {
            const message = (0, errorMessage_1.toErrorMessage)(error, true);
            if (!message) {
                return;
            }
            const now = Date.now();
            if (message === this.previousUnexpectedError.message && now - this.previousUnexpectedError.time <= 1000) {
                return; // Return if error message identical to previous and shorter than 1 second
            }
            this.previousUnexpectedError.time = now;
            this.previousUnexpectedError.message = message;
            // Log it
            logService.error(message);
        }
        startup() {
            try {
                // Configure emitter leak warning threshold
                (0, event_1.setGlobalLeakWarningThreshold)(175);
                // Services
                const instantiationService = this.initServices(this.serviceCollection);
                instantiationService.invokeFunction(accessor => {
                    const lifecycleService = accessor.get(lifecycle_1.ILifecycleService);
                    const storageService = accessor.get(storage_1.IStorageService);
                    const configurationService = accessor.get(configuration_1.IConfigurationService);
                    const hostService = accessor.get(host_1.IHostService);
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    // Layout
                    this.initLayout(accessor);
                    // Registries
                    platform_1.Registry.as(contributions_1.Extensions.Workbench).start(accessor);
                    platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).start(accessor);
                    // Context Keys
                    this._register(instantiationService.createInstance(contextkeys_1.WorkbenchContextKeysHandler));
                    // Register Listeners
                    this.registerListeners(lifecycleService, storageService, configurationService, hostService, dialogService);
                    // Render Workbench
                    this.renderWorkbench(instantiationService, accessor.get(notification_1.INotificationService), storageService, configurationService);
                    // Workbench Layout
                    this.createWorkbenchLayout();
                    // Layout
                    this.layout();
                    // Restore
                    this.restore(lifecycleService);
                });
                return instantiationService;
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
                throw error; // rethrow because this is a critical issue we cannot handle properly here
            }
        }
        initServices(serviceCollection) {
            // Layout Service
            serviceCollection.set(layoutService_1.IWorkbenchLayoutService, this);
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //
            // NOTE: Please do NOT register services here. Use `registerSingleton()`
            //       from `workbench.common.main.ts` if the service is shared between
            //       native and web or `workbench.sandbox.main.ts` if the service
            //       is native only.
            //
            //       DO NOT add services to `workbench.desktop.main.ts`, always add
            //       to `workbench.sandbox.main.ts` to support our Electron sandbox
            //
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // All Contributed Services
            const contributedServices = (0, extensions_1.getSingletonServiceDescriptors)();
            for (let [id, descriptor] of contributedServices) {
                serviceCollection.set(id, descriptor);
            }
            const instantiationService = new instantiationService_1.InstantiationService(serviceCollection, true);
            // Wrap up
            instantiationService.invokeFunction(accessor => {
                const lifecycleService = accessor.get(lifecycle_1.ILifecycleService);
                // TODO@Sandeep debt around cyclic dependencies
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                if (typeof configurationService.acquireInstantiationService === 'function') {
                    configurationService.acquireInstantiationService(instantiationService);
                }
                // Signal to lifecycle that services are set
                lifecycleService.phase = 2 /* LifecyclePhase.Ready */;
            });
            return instantiationService;
        }
        registerListeners(lifecycleService, storageService, configurationService, hostService, dialogService) {
            // Configuration changes
            this._register(configurationService.onDidChangeConfiguration(() => this.setFontAliasing(configurationService)));
            // Font Info
            if (platform_2.isNative) {
                this._register(storageService.onWillSaveState(e => {
                    if (e.reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                        this.storeFontInfo(storageService);
                    }
                }));
            }
            else {
                this._register(lifecycleService.onWillShutdown(() => this.storeFontInfo(storageService)));
            }
            // Lifecycle
            this._register(lifecycleService.onWillShutdown(event => this._onWillShutdown.fire(event)));
            this._register(lifecycleService.onDidShutdown(() => {
                this._onDidShutdown.fire();
                this.dispose();
            }));
            // In some environments we do not get enough time to persist state on shutdown.
            // In other cases, VSCode might crash, so we periodically save state to reduce
            // the chance of loosing any state.
            // The window loosing focus is a good indication that the user has stopped working
            // in that window so we pick that at a time to collect state.
            this._register(hostService.onDidChangeFocus(focus => {
                if (!focus) {
                    storageService.flush();
                }
            }));
            // Dialogs showing/hiding
            this._register(dialogService.onWillShowDialog(() => this.container.classList.add('modal-dialog-visible')));
            this._register(dialogService.onDidShowDialog(() => this.container.classList.remove('modal-dialog-visible')));
        }
        setFontAliasing(configurationService) {
            if (!platform_2.isMacintosh) {
                return; // macOS only
            }
            const aliasing = configurationService.getValue('workbench.fontAliasing');
            if (this.fontAliasing === aliasing) {
                return;
            }
            this.fontAliasing = aliasing;
            // Remove all
            const fontAliasingValues = ['antialiased', 'none', 'auto'];
            this.container.classList.remove(...fontAliasingValues.map(value => `monaco-font-aliasing-${value}`));
            // Add specific
            if (fontAliasingValues.some(option => option === aliasing)) {
                this.container.classList.add(`monaco-font-aliasing-${aliasing}`);
            }
        }
        restoreFontInfo(storageService, configurationService) {
            const storedFontInfoRaw = storageService.get('editorFontInfo', 0 /* StorageScope.GLOBAL */);
            if (storedFontInfoRaw) {
                try {
                    const storedFontInfo = JSON.parse(storedFontInfoRaw);
                    if (Array.isArray(storedFontInfo)) {
                        fontMeasurements_1.FontMeasurements.restoreFontInfo(storedFontInfo);
                    }
                }
                catch (err) {
                    /* ignore */
                }
            }
            fontMeasurements_1.FontMeasurements.readFontInfo(fontInfo_1.BareFontInfo.createFromRawSettings(configurationService.getValue('editor'), browser_1.PixelRatio.value));
        }
        storeFontInfo(storageService) {
            const serializedFontInfo = fontMeasurements_1.FontMeasurements.serializeFontInfo();
            if (serializedFontInfo) {
                storageService.store('editorFontInfo', JSON.stringify(serializedFontInfo), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            }
        }
        renderWorkbench(instantiationService, notificationService, storageService, configurationService) {
            var _a;
            // ARIA
            (0, aria_1.setARIAContainer)(this.container);
            // State specific classes
            const platformClass = platform_2.isWindows ? 'windows' : platform_2.isLinux ? 'linux' : 'mac';
            const workbenchClasses = (0, arrays_1.coalesce)([
                'monaco-workbench',
                platformClass,
                platform_2.isWeb ? 'web' : undefined,
                browser_1.isChrome ? 'chromium' : browser_1.isFirefox ? 'firefox' : browser_1.isSafari ? 'safari' : undefined,
                ...this.getLayoutClasses(),
                ...(((_a = this.options) === null || _a === void 0 ? void 0 : _a.extraClasses) ? this.options.extraClasses : [])
            ]);
            this.container.classList.add(...workbenchClasses);
            document.body.classList.add(platformClass); // used by our fonts
            if (platform_2.isWeb) {
                document.body.classList.add('web');
            }
            // Apply font aliasing
            this.setFontAliasing(configurationService);
            // Warm up font cache information before building up too many dom elements
            this.restoreFontInfo(storageService, configurationService);
            // Create Parts
            for (const { id, role, classes, options } of [
                { id: "workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, role: 'contentinfo', classes: ['titlebar'] },
                { id: "workbench.parts.banner" /* Parts.BANNER_PART */, role: 'banner', classes: ['banner'] },
                { id: "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */, role: 'none', classes: ['activitybar', this.getSideBarPosition() === 0 /* Position.LEFT */ ? 'left' : 'right'] },
                { id: "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */, role: 'none', classes: ['sidebar', this.getSideBarPosition() === 0 /* Position.LEFT */ ? 'left' : 'right'] },
                { id: "workbench.parts.editor" /* Parts.EDITOR_PART */, role: 'main', classes: ['editor'], options: { restorePreviousState: this.willRestoreEditors() } },
                { id: "workbench.parts.panel" /* Parts.PANEL_PART */, role: 'none', classes: ['panel', 'basepanel', (0, layoutService_1.positionToString)(this.getPanelPosition())] },
                { id: "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */, role: 'none', classes: ['auxiliarybar', 'basepanel', this.getSideBarPosition() === 0 /* Position.LEFT */ ? 'right' : 'left'] },
                { id: "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */, role: 'status', classes: ['statusbar'] }
            ]) {
                const partContainer = this.createPart(id, role, classes);
                this.getPart(id).create(partContainer, options);
            }
            // Notification Handlers
            this.createNotificationsHandlers(instantiationService, notificationService);
            // Add Workbench to DOM
            this.parent.appendChild(this.container);
        }
        createPart(id, role, classes) {
            const part = document.createElement(role === 'status' ? 'footer' /* Use footer element for status bar #98376 */ : 'div');
            part.classList.add('part', ...classes);
            part.id = id;
            part.setAttribute('role', role);
            if (role === 'status') {
                part.setAttribute('aria-live', 'off');
            }
            return part;
        }
        createNotificationsHandlers(instantiationService, notificationService) {
            // Instantiate Notification components
            const notificationsCenter = this._register(instantiationService.createInstance(notificationsCenter_1.NotificationsCenter, this.container, notificationService.model));
            const notificationsToasts = this._register(instantiationService.createInstance(notificationsToasts_1.NotificationsToasts, this.container, notificationService.model));
            this._register(instantiationService.createInstance(notificationsAlerts_1.NotificationsAlerts, notificationService.model));
            const notificationsStatus = instantiationService.createInstance(notificationsStatus_1.NotificationsStatus, notificationService.model);
            this._register(instantiationService.createInstance(notificationsTelemetry_1.NotificationsTelemetry));
            // Visibility
            this._register(notificationsCenter.onDidChangeVisibility(() => {
                notificationsStatus.update(notificationsCenter.isVisible, notificationsToasts.isVisible);
                notificationsToasts.update(notificationsCenter.isVisible);
            }));
            this._register(notificationsToasts.onDidChangeVisibility(() => {
                notificationsStatus.update(notificationsCenter.isVisible, notificationsToasts.isVisible);
            }));
            // Register Commands
            (0, notificationsCommands_1.registerNotificationCommands)(notificationsCenter, notificationsToasts, notificationService.model);
            // Register with Layout
            this.registerNotifications({
                onDidChangeNotificationsVisibility: event_1.Event.map(event_1.Event.any(notificationsToasts.onDidChangeVisibility, notificationsCenter.onDidChangeVisibility), () => notificationsToasts.isVisible || notificationsCenter.isVisible)
            });
        }
        restore(lifecycleService) {
            // Ask each part to restore
            try {
                this.restoreParts();
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
            }
            // Transition into restored phase after layout has restored
            // but do not wait indefinitly on this to account for slow
            // editors restoring. Since the workbench is fully functional
            // even when the visible editors have not resolved, we still
            // want contributions on the `Restored` phase to work before
            // slow editors have resolved. But we also do not want fast
            // editors to resolve slow when too many contributions get
            // instantiated, so we find a middle ground solution via
            // `Promise.race`
            this.whenReady.finally(() => Promise.race([
                this.whenRestored,
                (0, async_1.timeout)(2000)
            ]).finally(() => {
                // Set lifecycle phase to `Restored`
                lifecycleService.phase = 3 /* LifecyclePhase.Restored */;
                // Set lifecycle phase to `Eventually` after a short delay and when idle (min 2.5sec, max 5sec)
                const eventuallyPhaseScheduler = this._register(new async_1.RunOnceScheduler(() => {
                    this._register((0, async_1.runWhenIdle)(() => lifecycleService.phase = 4 /* LifecyclePhase.Eventually */, 2500));
                }, 2500));
                eventuallyPhaseScheduler.schedule();
                // Update perf marks only when the layout is fully
                // restored. We want the time it takes to restore
                // editors to be included in these numbers
                function markDidStartWorkbench() {
                    (0, performance_1.mark)('code/didStartWorkbench');
                    performance.measure('perf: workbench create & restore', 'code/didLoadWorkbenchMain', 'code/didStartWorkbench');
                }
                if (this.isRestored()) {
                    markDidStartWorkbench();
                }
                else {
                    this.whenRestored.finally(() => markDidStartWorkbench());
                }
            }));
        }
    }
    exports.Workbench = Workbench;
});
//# sourceMappingURL=workbench.js.map