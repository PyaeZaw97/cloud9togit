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
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/workbench/contrib/tasks/common/taskService", "vs/base/common/collections", "vs/workbench/contrib/tasks/common/tasks", "vs/platform/storage/common/storage", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/platform/actions/common/actions", "vs/platform/workspace/common/workspaceTrust", "vs/base/common/event", "vs/platform/log/common/log"], function (require, exports, nls, resources, lifecycle_1, taskService_1, collections_1, tasks_1, storage_1, notification_1, quickInput_1, actions_1, workspaceTrust_1, event_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ManageAutomaticTaskRunning = exports.RunAutomaticTasks = void 0;
    const ARE_AUTOMATIC_TASKS_ALLOWED_IN_WORKSPACE = 'tasks.run.allowAutomatic';
    let RunAutomaticTasks = class RunAutomaticTasks extends lifecycle_1.Disposable {
        constructor(taskService, storageService, workspaceTrustManagementService, logService) {
            super();
            this.taskService = taskService;
            this.storageService = storageService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.logService = logService;
            this.tryRunTasks();
        }
        async tryRunTasks() {
            this.logService.trace('RunAutomaticTasks: Trying to run tasks.');
            // Wait until we have task system info (the extension host and workspace folders are available).
            if (!this.taskService.hasTaskSystemInfo) {
                this.logService.trace('RunAutomaticTasks: Awaiting task system info.');
                await event_1.Event.toPromise(event_1.Event.once(this.taskService.onDidChangeTaskSystemInfo));
            }
            this.logService.trace('RunAutomaticTasks: Checking if automatic tasks should run.');
            const isFolderAutomaticAllowed = this.storageService.getBoolean(ARE_AUTOMATIC_TASKS_ALLOWED_IN_WORKSPACE, 1 /* StorageScope.WORKSPACE */, undefined);
            await this.workspaceTrustManagementService.workspaceTrustInitialized;
            const isWorkspaceTrusted = this.workspaceTrustManagementService.isWorkspaceTrusted();
            // Only run if allowed. Prompting for permission occurs when a user first tries to run a task.
            if (isFolderAutomaticAllowed && isWorkspaceTrusted) {
                this.taskService.getWorkspaceTasks(2 /* TaskRunSource.FolderOpen */).then(workspaceTaskResult => {
                    let { tasks } = RunAutomaticTasks.findAutoTasks(this.taskService, workspaceTaskResult);
                    this.logService.trace(`RunAutomaticTasks: Found ${tasks.length} automatic tasks tasks`);
                    if (tasks.length > 0) {
                        RunAutomaticTasks.runTasks(this.taskService, tasks);
                    }
                });
            }
        }
        static runTasks(taskService, tasks) {
            tasks.forEach(task => {
                if (task instanceof Promise) {
                    task.then(promiseResult => {
                        if (promiseResult) {
                            taskService.run(promiseResult);
                        }
                    });
                }
                else {
                    taskService.run(task);
                }
            });
        }
        static getTaskSource(source) {
            var _a, _b;
            const taskKind = tasks_1.TaskSourceKind.toConfigurationTarget(source.kind);
            switch (taskKind) {
                case 5 /* ConfigurationTarget.WORKSPACE_FOLDER */: {
                    return resources.joinPath(source.config.workspaceFolder.uri, source.config.file);
                }
                case 4 /* ConfigurationTarget.WORKSPACE */: {
                    return (_b = (_a = source.config.workspace) === null || _a === void 0 ? void 0 : _a.configuration) !== null && _b !== void 0 ? _b : undefined;
                }
            }
            return undefined;
        }
        static findAutoTasks(taskService, workspaceTaskResult) {
            const tasks = new Array();
            const taskNames = new Array();
            const locations = new Map();
            if (workspaceTaskResult) {
                workspaceTaskResult.forEach(resultElement => {
                    if (resultElement.set) {
                        resultElement.set.tasks.forEach(task => {
                            if (task.runOptions.runOn === tasks_1.RunOnOptions.folderOpen) {
                                tasks.push(task);
                                taskNames.push(task._label);
                                const location = RunAutomaticTasks.getTaskSource(task._source);
                                if (location) {
                                    locations.set(location.fsPath, location);
                                }
                            }
                        });
                    }
                    if (resultElement.configurations) {
                        (0, collections_1.forEach)(resultElement.configurations.byIdentifier, (configedTask) => {
                            if (configedTask.value.runOptions.runOn === tasks_1.RunOnOptions.folderOpen) {
                                tasks.push(new Promise(resolve => {
                                    taskService.getTask(resultElement.workspaceFolder, configedTask.value._id, true).then(task => resolve(task));
                                }));
                                if (configedTask.value._label) {
                                    taskNames.push(configedTask.value._label);
                                }
                                else {
                                    taskNames.push(configedTask.value.configures.task);
                                }
                                const location = RunAutomaticTasks.getTaskSource(configedTask.value._source);
                                if (location) {
                                    locations.set(location.fsPath, location);
                                }
                            }
                        });
                    }
                });
            }
            return { tasks, taskNames, locations };
        }
        static async promptForPermission(taskService, storageService, notificationService, workspaceTrustManagementService, openerService, workspaceTaskResult) {
            const isWorkspaceTrusted = workspaceTrustManagementService.isWorkspaceTrusted;
            if (!isWorkspaceTrusted) {
                return;
            }
            const isFolderAutomaticAllowed = storageService.getBoolean(ARE_AUTOMATIC_TASKS_ALLOWED_IN_WORKSPACE, 1 /* StorageScope.WORKSPACE */, undefined);
            if (isFolderAutomaticAllowed !== undefined) {
                return;
            }
            let { tasks, taskNames, locations } = RunAutomaticTasks.findAutoTasks(taskService, workspaceTaskResult);
            if (taskNames.length > 0) {
                // We have automatic tasks, prompt to allow.
                this.showPrompt(notificationService, storageService, taskService, openerService, taskNames, locations).then(allow => {
                    if (allow) {
                        RunAutomaticTasks.runTasks(taskService, tasks);
                    }
                });
            }
        }
        static showPrompt(notificationService, storageService, taskService, openerService, taskNames, locations) {
            return new Promise(resolve => {
                notificationService.prompt(notification_1.Severity.Info, nls.localize('tasks.run.allowAutomatic', "This workspace has tasks ({0}) defined ({1}) that run automatically when you open this workspace. Do you allow automatic tasks to run when you open this workspace?", taskNames.join(', '), Array.from(locations.keys()).join(', ')), [{
                        label: nls.localize('allow', "Allow and run"),
                        run: () => {
                            resolve(true);
                            storageService.store(ARE_AUTOMATIC_TASKS_ALLOWED_IN_WORKSPACE, true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                        }
                    },
                    {
                        label: nls.localize('disallow', "Disallow"),
                        run: () => {
                            resolve(false);
                            storageService.store(ARE_AUTOMATIC_TASKS_ALLOWED_IN_WORKSPACE, false, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                        }
                    },
                    {
                        label: locations.size === 1 ? nls.localize('openTask', "Open file") : nls.localize('openTasks', "Open files"),
                        run: async () => {
                            for (const location of locations) {
                                await openerService.open(location[1]);
                            }
                            resolve(false);
                        }
                    }]);
            });
        }
    };
    RunAutomaticTasks = __decorate([
        __param(0, taskService_1.ITaskService),
        __param(1, storage_1.IStorageService),
        __param(2, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(3, log_1.ILogService)
    ], RunAutomaticTasks);
    exports.RunAutomaticTasks = RunAutomaticTasks;
    class ManageAutomaticTaskRunning extends actions_1.Action2 {
        constructor() {
            super({
                id: ManageAutomaticTaskRunning.ID,
                title: ManageAutomaticTaskRunning.LABEL,
                category: tasks_1.TASKS_CATEGORY
            });
        }
        async run(accessor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const storageService = accessor.get(storage_1.IStorageService);
            const allowItem = { label: nls.localize('workbench.action.tasks.allowAutomaticTasks', "Allow Automatic Tasks in Folder") };
            const disallowItem = { label: nls.localize('workbench.action.tasks.disallowAutomaticTasks', "Disallow Automatic Tasks in Folder") };
            const value = await quickInputService.pick([allowItem, disallowItem], { canPickMany: false });
            if (!value) {
                return;
            }
            storageService.store(ARE_AUTOMATIC_TASKS_ALLOWED_IN_WORKSPACE, value === allowItem, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
    }
    exports.ManageAutomaticTaskRunning = ManageAutomaticTaskRunning;
    ManageAutomaticTaskRunning.ID = 'workbench.action.tasks.manageAutomaticRunning';
    ManageAutomaticTaskRunning.LABEL = nls.localize('workbench.action.tasks.manageAutomaticRunning', "Manage Automatic Tasks in Folder");
});
//# sourceMappingURL=runAutomaticTasks.js.map