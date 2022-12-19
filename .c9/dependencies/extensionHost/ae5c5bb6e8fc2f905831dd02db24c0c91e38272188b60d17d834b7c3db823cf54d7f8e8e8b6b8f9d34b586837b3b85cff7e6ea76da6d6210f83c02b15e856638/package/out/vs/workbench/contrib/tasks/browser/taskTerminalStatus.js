/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/severity", "vs/workbench/contrib/tasks/common/problemCollectors", "vs/platform/markers/common/markers", "vs/platform/theme/common/iconRegistry"], function (require, exports, nls, codicons_1, lifecycle_1, severity_1, problemCollectors_1, markers_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskTerminalStatus = void 0;
    const TASK_TERMINAL_STATUS_ID = 'task_terminal_status';
    const ACTIVE_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: iconRegistry_1.spinningLoading, severity: severity_1.default.Info, tooltip: nls.localize('taskTerminalStatus.active', "Task is running") };
    const SUCCEEDED_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.check, severity: severity_1.default.Info, tooltip: nls.localize('taskTerminalStatus.succeeded', "Task succeeded") };
    const SUCCEEDED_INACTIVE_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.check, severity: severity_1.default.Info, tooltip: nls.localize('taskTerminalStatus.succeededInactive', "Task succeeded and waiting...") };
    const FAILED_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.error, severity: severity_1.default.Error, tooltip: nls.localize('taskTerminalStatus.errors', "Task has errors") };
    const FAILED_INACTIVE_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.error, severity: severity_1.default.Error, tooltip: nls.localize('taskTerminalStatus.errorsInactive', "Task has errors and is waiting...") };
    const WARNING_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.warning, severity: severity_1.default.Warning, tooltip: nls.localize('taskTerminalStatus.warnings', "Task has warnings") };
    const WARNING_INACTIVE_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.warning, severity: severity_1.default.Warning, tooltip: nls.localize('taskTerminalStatus.warningsInactive', "Task has warnings and is waiting...") };
    const INFO_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.info, severity: severity_1.default.Info, tooltip: nls.localize('taskTerminalStatus.infos', "Task has infos") };
    const INFO_INACTIVE_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.info, severity: severity_1.default.Info, tooltip: nls.localize('taskTerminalStatus.infosInactive', "Task has infos and is waiting...") };
    class TaskTerminalStatus extends lifecycle_1.Disposable {
        constructor(taskService) {
            super();
            this.terminalMap = new Map();
            this._register(taskService.onDidStateChange((event) => {
                switch (event.kind) {
                    case "processStarted" /* TaskEventKind.ProcessStarted */:
                    case "active" /* TaskEventKind.Active */:
                        this.eventActive(event);
                        break;
                    case "inactive" /* TaskEventKind.Inactive */:
                        this.eventInactive(event);
                        break;
                    case "processEnded" /* TaskEventKind.ProcessEnded */:
                        this.eventEnd(event);
                        break;
                }
            }));
        }
        addTerminal(task, terminal, problemMatcher) {
            const status = { id: TASK_TERMINAL_STATUS_ID, severity: severity_1.default.Info };
            terminal.statusList.add(status);
            this.terminalMap.set(task, { terminal, status, problemMatcher });
        }
        terminalFromEvent(event) {
            if (!event.__task || !this.terminalMap.get(event.__task)) {
                return undefined;
            }
            return this.terminalMap.get(event.__task);
        }
        eventEnd(event) {
            const terminalData = this.terminalFromEvent(event);
            if (!terminalData) {
                return;
            }
            this.terminalMap.delete(event.__task);
            terminalData.terminal.statusList.remove(terminalData.status);
            if ((event.exitCode === 0) && (terminalData.problemMatcher.numberOfMatches === 0)) {
                terminalData.terminal.statusList.add(SUCCEEDED_TASK_STATUS);
            }
            else if (terminalData.problemMatcher.maxMarkerSeverity === markers_1.MarkerSeverity.Error) {
                terminalData.terminal.statusList.add(FAILED_TASK_STATUS);
            }
            else if (terminalData.problemMatcher.maxMarkerSeverity === markers_1.MarkerSeverity.Warning) {
                terminalData.terminal.statusList.add(WARNING_TASK_STATUS);
            }
            else if (terminalData.problemMatcher.maxMarkerSeverity === markers_1.MarkerSeverity.Info) {
                terminalData.terminal.statusList.add(INFO_TASK_STATUS);
            }
        }
        eventInactive(event) {
            const terminalData = this.terminalFromEvent(event);
            if (!terminalData || !terminalData.problemMatcher) {
                return;
            }
            terminalData.terminal.statusList.remove(terminalData.status);
            if (terminalData.problemMatcher.numberOfMatches === 0) {
                terminalData.terminal.statusList.add(SUCCEEDED_INACTIVE_TASK_STATUS);
            }
            else if (terminalData.problemMatcher.maxMarkerSeverity === markers_1.MarkerSeverity.Error) {
                terminalData.terminal.statusList.add(FAILED_INACTIVE_TASK_STATUS);
            }
            else if (terminalData.problemMatcher.maxMarkerSeverity === markers_1.MarkerSeverity.Warning) {
                terminalData.terminal.statusList.add(WARNING_INACTIVE_TASK_STATUS);
            }
            else if (terminalData.problemMatcher.maxMarkerSeverity === markers_1.MarkerSeverity.Info) {
                terminalData.terminal.statusList.add(INFO_INACTIVE_TASK_STATUS);
            }
        }
        eventActive(event) {
            var _a;
            const terminalData = this.terminalFromEvent(event);
            if (!terminalData) {
                return;
            }
            terminalData.terminal.statusList.remove(terminalData.status);
            // We don't want to show an infinite status for a background task that doesn't have a problem matcher.
            if ((terminalData.problemMatcher instanceof problemCollectors_1.StartStopProblemCollector) || (((_a = terminalData.problemMatcher) === null || _a === void 0 ? void 0 : _a.problemMatchers.length) > 0)) {
                terminalData.terminal.statusList.add(ACTIVE_TASK_STATUS);
            }
        }
    }
    exports.TaskTerminalStatus = TaskTerminalStatus;
});
//# sourceMappingURL=taskTerminalStatus.js.map