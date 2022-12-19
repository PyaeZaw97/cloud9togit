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
define(["require", "exports", "vs/base/common/performance", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/workspace", "vs/workbench/services/extensions/common/extensions", "vs/platform/update/common/update", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/editor/common/editorService", "vs/platform/accessibility/common/accessibility", "vs/platform/telemetry/common/telemetry", "vs/base/common/async", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, perf, instantiation_1, workspace_1, extensions_1, update_1, lifecycle_1, editorService_1, accessibility_1, telemetry_1, async_1, layoutService_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimerService = exports.AbstractTimerService = exports.ITimerService = void 0;
    exports.ITimerService = (0, instantiation_1.createDecorator)('timerService');
    class PerfMarks {
        constructor() {
            this._entries = [];
        }
        setMarks(source, entries) {
            this._entries.push([source, entries]);
        }
        getDuration(from, to) {
            const fromEntry = this._findEntry(from);
            if (!fromEntry) {
                return 0;
            }
            const toEntry = this._findEntry(to);
            if (!toEntry) {
                return 0;
            }
            return toEntry.startTime - fromEntry.startTime;
        }
        _findEntry(name) {
            for (let [, marks] of this._entries) {
                for (let i = marks.length - 1; i >= 0; i--) {
                    if (marks[i].name === name) {
                        return marks[i];
                    }
                }
            }
        }
        getEntries() {
            return this._entries.slice(0);
        }
    }
    let AbstractTimerService = class AbstractTimerService {
        constructor(_lifecycleService, _contextService, _extensionService, _updateService, _paneCompositeService, _editorService, _accessibilityService, _telemetryService, layoutService) {
            this._lifecycleService = _lifecycleService;
            this._contextService = _contextService;
            this._extensionService = _extensionService;
            this._updateService = _updateService;
            this._paneCompositeService = _paneCompositeService;
            this._editorService = _editorService;
            this._accessibilityService = _accessibilityService;
            this._telemetryService = _telemetryService;
            this._barrier = new async_1.Barrier();
            this._marks = new PerfMarks();
            Promise.all([
                this._extensionService.whenInstalledExtensionsRegistered(),
                _lifecycleService.when(3 /* LifecyclePhase.Restored */),
                layoutService.whenRestored // layout restored (including visible editors resolved)
            ]).then(() => {
                // set perf mark from renderer
                this.setPerformanceMarks('renderer', perf.getMarks());
                return this._computeStartupMetrics();
            }).then(metrics => {
                this._startupMetrics = metrics;
                this._reportStartupTimes(metrics);
                this._barrier.open();
            });
        }
        whenReady() {
            return this._barrier.wait();
        }
        get startupMetrics() {
            if (!this._startupMetrics) {
                throw new Error('illegal state, MUST NOT access startupMetrics before whenReady has resolved');
            }
            return this._startupMetrics;
        }
        setPerformanceMarks(source, marks) {
            // Perf marks are a shared resource because anyone can generate them
            // and because of that we only accept marks that start with 'code/'
            this._marks.setMarks(source, marks.filter(mark => mark.name.startsWith('code/')));
        }
        getPerformanceMarks() {
            return this._marks.getEntries();
        }
        _reportStartupTimes(metrics) {
            // report IStartupMetrics as telemetry
            /* __GDPR__
                "startupTimeVaried" : {
                    "${include}": [
                        "${IStartupMetrics}"
                    ]
                }
            */
            this._telemetryService.publicLog('startupTimeVaried', metrics);
            // report raw timers as telemetry. each mark is send a separate telemetry
            // event and it is "normalized" to a relative timestamp where the first mark
            // defines the start
            for (const [source, marks] of this.getPerformanceMarks()) {
                let lastMark = marks[0];
                for (const mark of marks) {
                    let delta = mark.startTime - lastMark.startTime;
                    this._telemetryService.publicLog2('startup.timer.mark', {
                        source,
                        name: mark.name,
                        relativeStartTime: delta,
                        startTime: mark.startTime
                    });
                    lastMark = mark;
                }
            }
        }
        async _computeStartupMetrics() {
            const initialStartup = this._isInitialStartup();
            const startMark = initialStartup ? 'code/didStartMain' : 'code/willOpenNewWindow';
            const activeViewlet = this._paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            const activePanel = this._paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */);
            const info = {
                version: 2,
                ellapsed: this._marks.getDuration(startMark, 'code/didStartWorkbench'),
                // reflections
                isLatestVersion: Boolean(await this._updateService.isLatestVersion()),
                didUseCachedData: this._didUseCachedData(),
                windowKind: this._lifecycleService.startupKind,
                windowCount: await this._getWindowCount(),
                viewletId: activeViewlet === null || activeViewlet === void 0 ? void 0 : activeViewlet.getId(),
                editorIds: this._editorService.visibleEditors.map(input => input.typeId),
                panelId: activePanel ? activePanel.getId() : undefined,
                // timers
                timers: {
                    ellapsedAppReady: initialStartup ? this._marks.getDuration('code/didStartMain', 'code/mainAppReady') : undefined,
                    ellapsedNlsGeneration: initialStartup ? this._marks.getDuration('code/willGenerateNls', 'code/didGenerateNls') : undefined,
                    ellapsedLoadMainBundle: initialStartup ? this._marks.getDuration('code/willLoadMainBundle', 'code/didLoadMainBundle') : undefined,
                    ellapsedCrashReporter: initialStartup ? this._marks.getDuration('code/willStartCrashReporter', 'code/didStartCrashReporter') : undefined,
                    ellapsedMainServer: initialStartup ? this._marks.getDuration('code/willStartMainServer', 'code/didStartMainServer') : undefined,
                    ellapsedWindowCreate: initialStartup ? this._marks.getDuration('code/willCreateCodeWindow', 'code/didCreateCodeWindow') : undefined,
                    ellapsedWindowRestoreState: initialStartup ? this._marks.getDuration('code/willRestoreCodeWindowState', 'code/didRestoreCodeWindowState') : undefined,
                    ellapsedBrowserWindowCreate: initialStartup ? this._marks.getDuration('code/willCreateCodeBrowserWindow', 'code/didCreateCodeBrowserWindow') : undefined,
                    ellapsedWindowMaximize: initialStartup ? this._marks.getDuration('code/willMaximizeCodeWindow', 'code/didMaximizeCodeWindow') : undefined,
                    ellapsedWindowLoad: initialStartup ? this._marks.getDuration('code/mainAppReady', 'code/willOpenNewWindow') : undefined,
                    ellapsedWindowLoadToRequire: this._marks.getDuration('code/willOpenNewWindow', 'code/willLoadWorkbenchMain'),
                    ellapsedRequire: this._marks.getDuration('code/willLoadWorkbenchMain', 'code/didLoadWorkbenchMain'),
                    ellapsedWaitForWindowConfig: this._marks.getDuration('code/willWaitForWindowConfig', 'code/didWaitForWindowConfig'),
                    ellapsedStorageInit: this._marks.getDuration('code/willInitStorage', 'code/didInitStorage'),
                    ellapsedSharedProcesConnected: this._marks.getDuration('code/willConnectSharedProcess', 'code/didConnectSharedProcess'),
                    ellapsedWorkspaceServiceInit: this._marks.getDuration('code/willInitWorkspaceService', 'code/didInitWorkspaceService'),
                    ellapsedRequiredUserDataInit: this._marks.getDuration('code/willInitRequiredUserData', 'code/didInitRequiredUserData'),
                    ellapsedOtherUserDataInit: this._marks.getDuration('code/willInitOtherUserData', 'code/didInitOtherUserData'),
                    ellapsedExtensions: this._marks.getDuration('code/willLoadExtensions', 'code/didLoadExtensions'),
                    ellapsedEditorRestore: this._marks.getDuration('code/willRestoreEditors', 'code/didRestoreEditors'),
                    ellapsedViewletRestore: this._marks.getDuration('code/willRestoreViewlet', 'code/didRestoreViewlet'),
                    ellapsedPanelRestore: this._marks.getDuration('code/willRestorePanel', 'code/didRestorePanel'),
                    ellapsedWorkbench: this._marks.getDuration('code/willStartWorkbench', 'code/didStartWorkbench'),
                    ellapsedExtensionsReady: this._marks.getDuration(startMark, 'code/didLoadExtensions'),
                    ellapsedRenderer: this._marks.getDuration('code/didStartRenderer', 'code/didStartWorkbench')
                },
                // system info
                platform: undefined,
                release: undefined,
                arch: undefined,
                totalmem: undefined,
                freemem: undefined,
                meminfo: undefined,
                cpus: undefined,
                loadavg: undefined,
                isVMLikelyhood: undefined,
                initialStartup,
                hasAccessibilitySupport: this._accessibilityService.isScreenReaderOptimized(),
                emptyWorkbench: this._contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */
            };
            await this._extendStartupInfo(info);
            return info;
        }
    };
    AbstractTimerService = __decorate([
        __param(0, lifecycle_1.ILifecycleService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, extensions_1.IExtensionService),
        __param(3, update_1.IUpdateService),
        __param(4, panecomposite_1.IPaneCompositePartService),
        __param(5, editorService_1.IEditorService),
        __param(6, accessibility_1.IAccessibilityService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, layoutService_1.IWorkbenchLayoutService)
    ], AbstractTimerService);
    exports.AbstractTimerService = AbstractTimerService;
    class TimerService extends AbstractTimerService {
        _isInitialStartup() {
            return false;
        }
        _didUseCachedData() {
            return false;
        }
        async _getWindowCount() {
            return 1;
        }
        async _extendStartupInfo(info) {
            info.isVMLikelyhood = 0;
            info.platform = navigator.userAgent;
            info.release = navigator.appVersion;
        }
    }
    exports.TimerService = TimerService;
});
//# sourceMappingURL=timerService.js.map