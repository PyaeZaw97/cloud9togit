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
define(["require", "exports", "vs/nls", "vs/base/common/severity", "vs/workbench/contrib/markers/browser/constants", "vs/workbench/contrib/tasks/common/taskService", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/base/common/types", "vs/platform/markers/common/markers", "vs/workbench/common/views", "vs/platform/storage/common/storage", "vs/base/common/errorMessage", "vs/base/common/actions", "vs/workbench/contrib/debug/browser/debugCommands", "vs/platform/commands/common/commands"], function (require, exports, nls, severity_1, constants_1, taskService_1, configuration_1, dialogs_1, types_1, markers_1, views_1, storage_1, errorMessage_1, actions_1, debugCommands_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugTaskRunner = exports.TaskRunResult = void 0;
    function once(match, event) {
        return (listener, thisArgs = null, disposables) => {
            const result = event(e => {
                if (match(e)) {
                    result.dispose();
                    return listener.call(thisArgs, e);
                }
            }, null, disposables);
            return result;
        };
    }
    var TaskRunResult;
    (function (TaskRunResult) {
        TaskRunResult[TaskRunResult["Failure"] = 0] = "Failure";
        TaskRunResult[TaskRunResult["Success"] = 1] = "Success";
    })(TaskRunResult = exports.TaskRunResult || (exports.TaskRunResult = {}));
    const DEBUG_TASK_ERROR_CHOICE_KEY = 'debug.taskerrorchoice';
    let DebugTaskRunner = class DebugTaskRunner {
        constructor(taskService, markerService, configurationService, viewsService, dialogService, storageService, commandService) {
            this.taskService = taskService;
            this.markerService = markerService;
            this.configurationService = configurationService;
            this.viewsService = viewsService;
            this.dialogService = dialogService;
            this.storageService = storageService;
            this.commandService = commandService;
            this.canceled = false;
        }
        cancel() {
            this.canceled = true;
        }
        async runTaskAndCheckErrors(root, taskId) {
            try {
                this.canceled = false;
                const taskSummary = await this.runTask(root, taskId);
                if (this.canceled || (taskSummary && taskSummary.exitCode === undefined)) {
                    // User canceled, either debugging, or the prelaunch task
                    return 0 /* TaskRunResult.Failure */;
                }
                const errorCount = taskId ? this.markerService.read({ severities: markers_1.MarkerSeverity.Error, take: 2 }).length : 0;
                const successExitCode = taskSummary && taskSummary.exitCode === 0;
                const failureExitCode = taskSummary && taskSummary.exitCode !== 0;
                const onTaskErrors = this.configurationService.getValue('debug').onTaskErrors;
                if (successExitCode || onTaskErrors === 'debugAnyway' || (errorCount === 0 && !failureExitCode)) {
                    return 1 /* TaskRunResult.Success */;
                }
                if (onTaskErrors === 'showErrors') {
                    await this.viewsService.openView(constants_1.default.MARKERS_VIEW_ID, true);
                    return Promise.resolve(0 /* TaskRunResult.Failure */);
                }
                if (onTaskErrors === 'abort') {
                    return Promise.resolve(0 /* TaskRunResult.Failure */);
                }
                const taskLabel = typeof taskId === 'string' ? taskId : taskId ? taskId.name : '';
                const message = errorCount > 1
                    ? nls.localize('preLaunchTaskErrors', "Errors exist after running preLaunchTask '{0}'.", taskLabel)
                    : errorCount === 1
                        ? nls.localize('preLaunchTaskError', "Error exists after running preLaunchTask '{0}'.", taskLabel)
                        : taskSummary && typeof taskSummary.exitCode === 'number'
                            ? nls.localize('preLaunchTaskExitCode', "The preLaunchTask '{0}' terminated with exit code {1}.", taskLabel, taskSummary.exitCode)
                            : nls.localize('preLaunchTaskTerminated', "The preLaunchTask '{0}' terminated.", taskLabel);
                const result = await this.dialogService.show(severity_1.default.Warning, message, [nls.localize('debugAnyway', "Debug Anyway"), nls.localize('showErrors', "Show Errors"), nls.localize('abort', "Abort")], {
                    checkbox: {
                        label: nls.localize('remember', "Remember my choice in user settings"),
                    },
                    cancelId: 2
                });
                const debugAnyway = result.choice === 0;
                const abort = result.choice === 2;
                if (result.checkboxChecked) {
                    this.configurationService.updateValue('debug.onTaskErrors', result.choice === 0 ? 'debugAnyway' : abort ? 'abort' : 'showErrors');
                }
                if (abort) {
                    return Promise.resolve(0 /* TaskRunResult.Failure */);
                }
                if (debugAnyway) {
                    return 1 /* TaskRunResult.Success */;
                }
                await this.viewsService.openView(constants_1.default.MARKERS_VIEW_ID, true);
                return Promise.resolve(0 /* TaskRunResult.Failure */);
            }
            catch (err) {
                const taskConfigureAction = this.taskService.configureAction();
                const choiceMap = JSON.parse(this.storageService.get(DEBUG_TASK_ERROR_CHOICE_KEY, 1 /* StorageScope.WORKSPACE */, '{}'));
                let choice = -1;
                if (choiceMap[err.message] !== undefined) {
                    choice = choiceMap[err.message];
                }
                else {
                    const showResult = await this.dialogService.show(severity_1.default.Error, err.message, [nls.localize('debugAnyway', "Debug Anyway"), taskConfigureAction.label, nls.localize('cancel', "Cancel")], {
                        cancelId: 2,
                        checkbox: {
                            label: nls.localize('rememberTask', "Remember my choice for this task")
                        }
                    });
                    choice = showResult.choice;
                    if (showResult.checkboxChecked) {
                        choiceMap[err.message] = choice;
                        this.storageService.store(DEBUG_TASK_ERROR_CHOICE_KEY, JSON.stringify(choiceMap), 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
                    }
                }
                if (choice === 1) {
                    await taskConfigureAction.run();
                }
                return choice === 0 ? 1 /* TaskRunResult.Success */ : 0 /* TaskRunResult.Failure */;
            }
        }
        async runTask(root, taskId) {
            if (!taskId) {
                return Promise.resolve(null);
            }
            if (!root) {
                return Promise.reject(new Error(nls.localize('invalidTaskReference', "Task '{0}' can not be referenced from a launch configuration that is in a different workspace folder.", typeof taskId === 'string' ? taskId : taskId.type)));
            }
            // run a task before starting a debug session
            const task = await this.taskService.getTask(root, taskId);
            if (!task) {
                const errorMessage = typeof taskId === 'string'
                    ? nls.localize('DebugTaskNotFoundWithTaskId', "Could not find the task '{0}'.", taskId)
                    : nls.localize('DebugTaskNotFound', "Could not find the specified task.");
                return Promise.reject((0, errorMessage_1.createErrorWithActions)(errorMessage, [new actions_1.Action(debugCommands_1.DEBUG_CONFIGURE_COMMAND_ID, debugCommands_1.DEBUG_CONFIGURE_LABEL, undefined, true, () => this.commandService.executeCommand(debugCommands_1.DEBUG_CONFIGURE_COMMAND_ID))]));
            }
            // If a task is missing the problem matcher the promise will never complete, so we need to have a workaround #35340
            let taskStarted = false;
            const inactivePromise = new Promise((c, e) => once(e => {
                // When a task isBackground it will go inactive when it is safe to launch.
                // But when a background task is terminated by the user, it will also fire an inactive event.
                // This means that we will not get to see the real exit code from running the task (undefined when terminated by the user).
                // Catch the ProcessEnded event here, which occurs before inactive, and capture the exit code to prevent this.
                return (e.kind === "inactive" /* TaskEventKind.Inactive */
                    || (e.kind === "processEnded" /* TaskEventKind.ProcessEnded */ && e.exitCode === undefined))
                    && e.taskId === task._id;
            }, this.taskService.onDidStateChange)(e => {
                taskStarted = true;
                c(e.kind === "processEnded" /* TaskEventKind.ProcessEnded */ ? { exitCode: e.exitCode } : null);
            }));
            const promise = this.taskService.getActiveTasks().then(async (tasks) => {
                if (tasks.find(t => t._id === task._id)) {
                    // Check that the task isn't busy and if it is, wait for it
                    const busyTasks = await this.taskService.getBusyTasks();
                    if (busyTasks.find(t => t._id === task._id)) {
                        taskStarted = true;
                        return inactivePromise;
                    }
                    // task is already running and isn't busy - nothing to do.
                    return Promise.resolve(null);
                }
                once(e => ((e.kind === "active" /* TaskEventKind.Active */) || (e.kind === "dependsOnStarted" /* TaskEventKind.DependsOnStarted */)) && e.taskId === task._id, this.taskService.onDidStateChange)(() => {
                    // Task is active, so everything seems to be fine, no need to prompt after 10 seconds
                    // Use case being a slow running task should not be prompted even though it takes more than 10 seconds
                    taskStarted = true;
                });
                const taskPromise = this.taskService.run(task);
                if (task.configurationProperties.isBackground) {
                    return inactivePromise;
                }
                return taskPromise.then(types_1.withUndefinedAsNull);
            });
            return new Promise((c, e) => {
                const waitForInput = new Promise(resolve => once(e => (e.kind === "acquiredInput" /* TaskEventKind.AcquiredInput */) && e.taskId === task._id, this.taskService.onDidStateChange)(() => {
                    resolve();
                }));
                promise.then(result => {
                    taskStarted = true;
                    c(result);
                }, error => e(error));
                waitForInput.then(() => {
                    const waitTime = task.configurationProperties.isBackground ? 5000 : 10000;
                    setTimeout(() => {
                        if (!taskStarted) {
                            const errorMessage = typeof taskId === 'string'
                                ? nls.localize('taskNotTrackedWithTaskId', "The task '{0}' cannot be tracked. Make sure to have a problem matcher defined.", taskId)
                                : nls.localize('taskNotTracked', "The task '{0}' cannot be tracked. Make sure to have a problem matcher defined.", JSON.stringify(taskId));
                            e({ severity: severity_1.default.Error, message: errorMessage });
                        }
                    }, waitTime);
                });
            });
        }
    };
    DebugTaskRunner = __decorate([
        __param(0, taskService_1.ITaskService),
        __param(1, markers_1.IMarkerService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, views_1.IViewsService),
        __param(4, dialogs_1.IDialogService),
        __param(5, storage_1.IStorageService),
        __param(6, commands_1.ICommandService)
    ], DebugTaskRunner);
    exports.DebugTaskRunner = DebugTaskRunner;
});
//# sourceMappingURL=debugTaskRunner.js.map