/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/nls", "vs/base/common/objects", "vs/base/common/types", "vs/base/common/platform", "vs/base/common/async", "vs/base/common/resources", "vs/base/common/collections", "vs/base/common/map", "vs/base/common/severity", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/extpath", "vs/platform/markers/common/markers", "vs/workbench/contrib/tasks/common/problemMatcher", "vs/workbench/contrib/markers/browser/constants", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/tasks/common/problemCollectors", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/common/taskSystem", "vs/base/common/uri", "vs/base/common/network", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/terminal/browser/terminalProcessExtHostProxy", "vs/workbench/contrib/tasks/browser/taskTerminalStatus"], function (require, exports, path, nls, Objects, Types, Platform, Async, resources, collections_1, map_1, severity_1, event_1, lifecycle_1, extpath_1, markers_1, problemMatcher_1, constants_1, terminal_1, problemCollectors_1, tasks_1, taskSystem_1, uri_1, network_1, terminal_2, terminalProcessExtHostProxy_1, taskTerminalStatus_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalTaskSystem = exports.VerifiedTask = void 0;
    class InstanceManager {
        constructor() {
            this._currentInstances = 0;
            this._counter = 0;
        }
        addInstance() {
            this._currentInstances++;
            this._counter++;
        }
        removeInstance() {
            this._currentInstances--;
        }
        get instances() {
            return this._currentInstances;
        }
        get counter() {
            return this._counter;
        }
    }
    class VariableResolver {
        constructor(workspaceFolder, taskSystemInfo, values, _service) {
            this.workspaceFolder = workspaceFolder;
            this.taskSystemInfo = taskSystemInfo;
            this.values = values;
            this._service = _service;
        }
        async resolve(value) {
            const replacers = [];
            value.replace(VariableResolver.regex, (match, ...args) => {
                replacers.push(this.replacer(match, args));
                return match;
            });
            const resolvedReplacers = await Promise.all(replacers);
            return value.replace(VariableResolver.regex, () => resolvedReplacers.shift());
        }
        async replacer(match, args) {
            // Strip out the ${} because the map contains them variables without those characters.
            let result = this.values.get(match.substring(2, match.length - 1));
            if ((result !== undefined) && (result !== null)) {
                return result;
            }
            if (this._service) {
                return this._service.resolveAsync(this.workspaceFolder, match);
            }
            return match;
        }
    }
    VariableResolver.regex = /\$\{(.*?)\}/g;
    class VerifiedTask {
        constructor(task, resolver, trigger) {
            this.task = task;
            this.resolver = resolver;
            this.trigger = trigger;
        }
        verify() {
            let verified = false;
            if (this.trigger && this.resolvedVariables && this.workspaceFolder && (this.shellLaunchConfig !== undefined)) {
                verified = true;
            }
            return verified;
        }
        getVerifiedTask() {
            if (this.verify()) {
                return { task: this.task, resolver: this.resolver, trigger: this.trigger, resolvedVariables: this.resolvedVariables, systemInfo: this.systemInfo, workspaceFolder: this.workspaceFolder, shellLaunchConfig: this.shellLaunchConfig };
            }
            else {
                throw new Error('VerifiedTask was not checked. verify must be checked before getVerifiedTask.');
            }
        }
    }
    exports.VerifiedTask = VerifiedTask;
    class TerminalTaskSystem extends lifecycle_1.Disposable {
        constructor(terminalService, terminalGroupService, outputService, paneCompositeService, viewsService, markerService, modelService, configurationResolverService, telemetryService, contextService, environmentService, outputChannelId, fileService, terminalProfileResolverService, pathService, viewDescriptorService, logService, configurationService, notificationService, taskService, taskSystemInfoResolver) {
            super();
            this.terminalService = terminalService;
            this.terminalGroupService = terminalGroupService;
            this.outputService = outputService;
            this.paneCompositeService = paneCompositeService;
            this.viewsService = viewsService;
            this.markerService = markerService;
            this.modelService = modelService;
            this.configurationResolverService = configurationResolverService;
            this.telemetryService = telemetryService;
            this.contextService = contextService;
            this.environmentService = environmentService;
            this.outputChannelId = outputChannelId;
            this.fileService = fileService;
            this.terminalProfileResolverService = terminalProfileResolverService;
            this.pathService = pathService;
            this.viewDescriptorService = viewDescriptorService;
            this.logService = logService;
            this.configurationService = configurationService;
            this.notificationService = notificationService;
            this.isRerun = false;
            this.terminalCreationQueue = Promise.resolve();
            this.activeTasks = Object.create(null);
            this.instances = Object.create(null);
            this.busyTasks = Object.create(null);
            this.terminals = Object.create(null);
            this.idleTaskTerminals = new map_1.LinkedMap();
            this.sameTaskTerminals = Object.create(null);
            this._onDidStateChange = new event_1.Emitter();
            this.taskSystemInfoResolver = taskSystemInfoResolver;
            this._register(this.terminalStatusManager = new taskTerminalStatus_1.TaskTerminalStatus(taskService));
        }
        get onDidStateChange() {
            return this._onDidStateChange.event;
        }
        log(value) {
            this.appendOutput(value + '\n');
        }
        showOutput() {
            this.outputService.showChannel(this.outputChannelId, true);
        }
        run(task, resolver, trigger = taskSystem_1.Triggers.command) {
            var _a;
            task = task.clone(); // A small amount of task state is stored in the task (instance) and tasks passed in to run may have that set already.
            const recentTaskKey = (_a = task.getRecentlyUsedKey()) !== null && _a !== void 0 ? _a : '';
            let validInstance = task.runOptions && task.runOptions.instanceLimit && this.instances[recentTaskKey] && this.instances[recentTaskKey].instances < task.runOptions.instanceLimit;
            let instance = this.instances[recentTaskKey] ? this.instances[recentTaskKey].instances : 0;
            this.currentTask = new VerifiedTask(task, resolver, trigger);
            if (instance > 0) {
                task.instance = this.instances[recentTaskKey].counter;
            }
            let lastTaskInstance = this.getLastInstance(task);
            let terminalData = lastTaskInstance ? this.activeTasks[lastTaskInstance.getMapKey()] : undefined;
            if (terminalData && terminalData.promise && !validInstance) {
                this.lastTask = this.currentTask;
                return { kind: 2 /* TaskExecuteKind.Active */, task: terminalData.task, active: { same: true, background: task.configurationProperties.isBackground }, promise: terminalData.promise };
            }
            try {
                const executeResult = { kind: 1 /* TaskExecuteKind.Started */, task, started: {}, promise: this.executeTask(task, resolver, trigger, new Set()) };
                executeResult.promise.then(summary => {
                    this.lastTask = this.currentTask;
                });
                if (tasks_1.InMemoryTask.is(task) || !this.isTaskEmpty(task)) {
                    if (!this.instances[recentTaskKey]) {
                        this.instances[recentTaskKey] = new InstanceManager();
                    }
                    this.instances[recentTaskKey].addInstance();
                }
                return executeResult;
            }
            catch (error) {
                if (error instanceof taskSystem_1.TaskError) {
                    throw error;
                }
                else if (error instanceof Error) {
                    this.log(error.message);
                    throw new taskSystem_1.TaskError(severity_1.default.Error, error.message, 7 /* TaskErrors.UnknownError */);
                }
                else {
                    this.log(error.toString());
                    throw new taskSystem_1.TaskError(severity_1.default.Error, nls.localize('TerminalTaskSystem.unknownError', 'A unknown error has occurred while executing a task. See task output log for details.'), 7 /* TaskErrors.UnknownError */);
                }
            }
        }
        rerun() {
            if (this.lastTask && this.lastTask.verify()) {
                if ((this.lastTask.task.runOptions.reevaluateOnRerun !== undefined) && !this.lastTask.task.runOptions.reevaluateOnRerun) {
                    this.isRerun = true;
                }
                const result = this.run(this.lastTask.task, this.lastTask.resolver);
                result.promise.then(summary => {
                    this.isRerun = false;
                });
                return result;
            }
            else {
                return undefined;
            }
        }
        showTaskLoadErrors(task) {
            if (task.taskLoadMessages && task.taskLoadMessages.length > 0) {
                task.taskLoadMessages.forEach(loadMessage => {
                    this.log(loadMessage + '\n');
                });
                const openOutput = 'Show Output';
                this.notificationService.prompt(severity_1.default.Warning, nls.localize('TerminalTaskSystem.taskLoadReporting', "There are issues with task \"{0}\". See the output for more details.", task._label), [{
                        label: openOutput,
                        run: () => this.showOutput()
                    }]);
            }
        }
        isTaskVisible(task) {
            let terminalData = this.activeTasks[task.getMapKey()];
            if (!terminalData) {
                return false;
            }
            const activeTerminalInstance = this.terminalService.activeInstance;
            const isPanelShowingTerminal = !!this.viewsService.getActiveViewWithId(terminal_1.TERMINAL_VIEW_ID);
            return isPanelShowingTerminal && ((activeTerminalInstance === null || activeTerminalInstance === void 0 ? void 0 : activeTerminalInstance.instanceId) === terminalData.terminal.instanceId);
        }
        revealTask(task) {
            var _a, _b;
            let terminalData = this.activeTasks[task.getMapKey()];
            if (!terminalData) {
                return false;
            }
            const isTerminalInPanel = this.viewDescriptorService.getViewLocationById(terminal_1.TERMINAL_VIEW_ID) === 1 /* ViewContainerLocation.Panel */;
            if (isTerminalInPanel && this.isTaskVisible(task)) {
                if (this.previousPanelId) {
                    if (this.previousTerminalInstance) {
                        this.terminalService.setActiveInstance(this.previousTerminalInstance);
                    }
                    this.paneCompositeService.openPaneComposite(this.previousPanelId, 1 /* ViewContainerLocation.Panel */);
                }
                else {
                    this.paneCompositeService.hideActivePaneComposite(1 /* ViewContainerLocation.Panel */);
                }
                this.previousPanelId = undefined;
                this.previousTerminalInstance = undefined;
            }
            else {
                if (isTerminalInPanel) {
                    this.previousPanelId = (_a = this.paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */)) === null || _a === void 0 ? void 0 : _a.getId();
                    if (this.previousPanelId === terminal_1.TERMINAL_VIEW_ID) {
                        this.previousTerminalInstance = (_b = this.terminalService.activeInstance) !== null && _b !== void 0 ? _b : undefined;
                    }
                }
                this.terminalService.setActiveInstance(terminalData.terminal);
                if (tasks_1.CustomTask.is(task) || tasks_1.ContributedTask.is(task)) {
                    this.terminalGroupService.showPanel(task.command.presentation.focus);
                }
            }
            return true;
        }
        isActive() {
            return Promise.resolve(this.isActiveSync());
        }
        isActiveSync() {
            return Object.keys(this.activeTasks).length > 0;
        }
        canAutoTerminate() {
            return Object.keys(this.activeTasks).every(key => !this.activeTasks[key].task.configurationProperties.promptOnClose);
        }
        getActiveTasks() {
            return Object.keys(this.activeTasks).map(key => this.activeTasks[key].task);
        }
        getLastInstance(task) {
            let lastInstance = undefined;
            const recentKey = task.getRecentlyUsedKey();
            Object.keys(this.activeTasks).forEach((key) => {
                if (recentKey && recentKey === this.activeTasks[key].task.getRecentlyUsedKey()) {
                    lastInstance = this.activeTasks[key].task;
                }
            });
            return lastInstance;
        }
        getBusyTasks() {
            return Object.keys(this.busyTasks).map(key => this.busyTasks[key]);
        }
        customExecutionComplete(task, result) {
            let activeTerminal = this.activeTasks[task.getMapKey()];
            if (!activeTerminal) {
                return Promise.reject(new Error('Expected to have a terminal for an custom execution task'));
            }
            return new Promise((resolve) => {
                // activeTerminal.terminal.rendererExit(result);
                resolve();
            });
        }
        removeInstances(task) {
            var _a;
            const recentTaskKey = (_a = task.getRecentlyUsedKey()) !== null && _a !== void 0 ? _a : '';
            if (this.instances[recentTaskKey]) {
                this.instances[recentTaskKey].removeInstance();
                if (this.instances[recentTaskKey].instances === 0) {
                    delete this.instances[recentTaskKey];
                }
            }
        }
        removeFromActiveTasks(task) {
            if (!this.activeTasks[task.getMapKey()]) {
                return;
            }
            delete this.activeTasks[task.getMapKey()];
            this.removeInstances(task);
        }
        fireTaskEvent(event) {
            if (event.__task) {
                const activeTask = this.activeTasks[event.__task.getMapKey()];
                if (activeTask) {
                    activeTask.state = event.kind;
                }
            }
            this._onDidStateChange.fire(event);
        }
        terminate(task) {
            let activeTerminal = this.activeTasks[task.getMapKey()];
            if (!activeTerminal) {
                return Promise.resolve({ success: false, task: undefined });
            }
            return new Promise((resolve, reject) => {
                let terminal = activeTerminal.terminal;
                const onExit = terminal.onExit(() => {
                    let task = activeTerminal.task;
                    try {
                        onExit.dispose();
                        this.fireTaskEvent(tasks_1.TaskEvent.create("terminated" /* TaskEventKind.Terminated */, task));
                    }
                    catch (error) {
                        // Do nothing.
                    }
                    resolve({ success: true, task: task });
                });
                terminal.dispose();
            });
        }
        terminateAll() {
            let promises = [];
            Object.keys(this.activeTasks).forEach((key) => {
                let terminalData = this.activeTasks[key];
                let terminal = terminalData.terminal;
                promises.push(new Promise((resolve, reject) => {
                    const onExit = terminal.onExit(() => {
                        let task = terminalData.task;
                        try {
                            onExit.dispose();
                            this.fireTaskEvent(tasks_1.TaskEvent.create("terminated" /* TaskEventKind.Terminated */, task));
                        }
                        catch (error) {
                            // Do nothing.
                        }
                        resolve({ success: true, task: terminalData.task });
                    });
                }));
                terminal.dispose();
            });
            this.activeTasks = Object.create(null);
            return Promise.all(promises);
        }
        showDependencyCycleMessage(task) {
            this.log(nls.localize('dependencyCycle', 'There is a dependency cycle. See task "{0}".', task._label));
            this.showOutput();
        }
        async executeTask(task, resolver, trigger, encounteredDependencies, alreadyResolved) {
            if (encounteredDependencies.has(task.getCommonTaskId())) {
                this.showDependencyCycleMessage(task);
                return {};
            }
            this.showTaskLoadErrors(task);
            alreadyResolved = alreadyResolved !== null && alreadyResolved !== void 0 ? alreadyResolved : new Map();
            let promises = [];
            if (task.configurationProperties.dependsOn) {
                for (const dependency of task.configurationProperties.dependsOn) {
                    let dependencyTask = await resolver.resolve(dependency.uri, dependency.task);
                    if (dependencyTask) {
                        let key = dependencyTask.getMapKey();
                        let promise = this.activeTasks[key] ? this.getDependencyPromise(this.activeTasks[key]) : undefined;
                        if (!promise) {
                            this.fireTaskEvent(tasks_1.TaskEvent.create("dependsOnStarted" /* TaskEventKind.DependsOnStarted */, task));
                            encounteredDependencies.add(task.getCommonTaskId());
                            promise = this.executeDependencyTask(dependencyTask, resolver, trigger, encounteredDependencies, alreadyResolved);
                        }
                        promises.push(promise);
                        if (task.configurationProperties.dependsOrder === "sequence" /* DependsOrder.sequence */) {
                            const promiseResult = await promise;
                            if (promiseResult.exitCode === 0) {
                                promise = Promise.resolve(promiseResult);
                            }
                            else {
                                promise = Promise.reject(promiseResult);
                                break;
                            }
                        }
                        promises.push(promise);
                    }
                    else {
                        this.log(nls.localize('dependencyFailed', 'Couldn\'t resolve dependent task \'{0}\' in workspace folder \'{1}\'', Types.isString(dependency.task) ? dependency.task : JSON.stringify(dependency.task, undefined, 0), dependency.uri.toString()));
                        this.showOutput();
                    }
                }
            }
            if ((tasks_1.ContributedTask.is(task) || tasks_1.CustomTask.is(task)) && (task.command)) {
                return Promise.all(promises).then((summaries) => {
                    encounteredDependencies.delete(task.getCommonTaskId());
                    for (let summary of summaries) {
                        if (summary.exitCode !== 0) {
                            this.removeInstances(task);
                            return { exitCode: summary.exitCode };
                        }
                    }
                    if (this.isRerun) {
                        return this.reexecuteCommand(task, trigger, alreadyResolved);
                    }
                    else {
                        return this.executeCommand(task, trigger, alreadyResolved);
                    }
                });
            }
            else {
                return Promise.all(promises).then((summaries) => {
                    encounteredDependencies.delete(task.getCommonTaskId());
                    for (let summary of summaries) {
                        if (summary.exitCode !== 0) {
                            return { exitCode: summary.exitCode };
                        }
                    }
                    return { exitCode: 0 };
                });
            }
        }
        createInactiveDependencyPromise(task) {
            return new Promise(resolve => {
                const taskInactiveDisposable = this.onDidStateChange(taskEvent => {
                    if ((taskEvent.kind === "inactive" /* TaskEventKind.Inactive */) && (taskEvent.__task === task)) {
                        taskInactiveDisposable.dispose();
                        resolve({ exitCode: 0 });
                    }
                });
            });
        }
        async getDependencyPromise(task) {
            if (!task.task.configurationProperties.isBackground) {
                return task.promise;
            }
            if (!task.task.configurationProperties.problemMatchers || task.task.configurationProperties.problemMatchers.length === 0) {
                return task.promise;
            }
            if (task.state === "inactive" /* TaskEventKind.Inactive */) {
                return { exitCode: 0 };
            }
            return this.createInactiveDependencyPromise(task.task);
        }
        async executeDependencyTask(task, resolver, trigger, encounteredDependencies, alreadyResolved) {
            // If the task is a background task with a watching problem matcher, we don't wait for the whole task to finish,
            // just for the problem matcher to go inactive.
            if (!task.configurationProperties.isBackground) {
                return this.executeTask(task, resolver, trigger, encounteredDependencies, alreadyResolved);
            }
            const inactivePromise = this.createInactiveDependencyPromise(task);
            return Promise.race([inactivePromise, this.executeTask(task, resolver, trigger, encounteredDependencies, alreadyResolved)]);
        }
        async resolveAndFindExecutable(systemInfo, workspaceFolder, task, cwd, envPath) {
            const command = await this.configurationResolverService.resolveAsync(workspaceFolder, tasks_1.CommandString.value(task.command.name));
            cwd = cwd ? await this.configurationResolverService.resolveAsync(workspaceFolder, cwd) : undefined;
            const paths = envPath ? await Promise.all(envPath.split(path.delimiter).map(p => this.configurationResolverService.resolveAsync(workspaceFolder, p))) : undefined;
            let foundExecutable = await (systemInfo === null || systemInfo === void 0 ? void 0 : systemInfo.findExecutable(command, cwd, paths));
            if (!foundExecutable) {
                foundExecutable = path.join(cwd !== null && cwd !== void 0 ? cwd : '', command);
            }
            return foundExecutable;
        }
        findUnresolvedVariables(variables, alreadyResolved) {
            if (alreadyResolved.size === 0) {
                return variables;
            }
            const unresolved = new Set();
            for (const variable of variables) {
                if (!alreadyResolved.has(variable.substring(2, variable.length - 1))) {
                    unresolved.add(variable);
                }
            }
            return unresolved;
        }
        mergeMaps(mergeInto, mergeFrom) {
            for (const entry of mergeFrom) {
                if (!mergeInto.has(entry[0])) {
                    mergeInto.set(entry[0], entry[1]);
                }
            }
        }
        async acquireInput(taskSystemInfo, workspaceFolder, task, variables, alreadyResolved) {
            const resolved = await this.resolveVariablesFromSet(taskSystemInfo, workspaceFolder, task, variables, alreadyResolved);
            this.fireTaskEvent(tasks_1.TaskEvent.create("acquiredInput" /* TaskEventKind.AcquiredInput */, task));
            return resolved;
        }
        resolveVariablesFromSet(taskSystemInfo, workspaceFolder, task, variables, alreadyResolved) {
            let isProcess = task.command && task.command.runtime === tasks_1.RuntimeType.Process;
            let options = task.command && task.command.options ? task.command.options : undefined;
            let cwd = options ? options.cwd : undefined;
            let envPath = undefined;
            if (options && options.env) {
                for (let key of Object.keys(options.env)) {
                    if (key.toLowerCase() === 'path') {
                        if (Types.isString(options.env[key])) {
                            envPath = options.env[key];
                        }
                        break;
                    }
                }
            }
            const unresolved = this.findUnresolvedVariables(variables, alreadyResolved);
            let resolvedVariables;
            if (taskSystemInfo && workspaceFolder) {
                let resolveSet = {
                    variables: unresolved
                };
                if (taskSystemInfo.platform === 3 /* Platform.Platform.Windows */ && isProcess) {
                    resolveSet.process = { name: tasks_1.CommandString.value(task.command.name) };
                    if (cwd) {
                        resolveSet.process.cwd = cwd;
                    }
                    if (envPath) {
                        resolveSet.process.path = envPath;
                    }
                }
                resolvedVariables = taskSystemInfo.resolveVariables(workspaceFolder, resolveSet, tasks_1.TaskSourceKind.toConfigurationTarget(task._source.kind)).then(async (resolved) => {
                    if (!resolved) {
                        return undefined;
                    }
                    this.mergeMaps(alreadyResolved, resolved.variables);
                    resolved.variables = new Map(alreadyResolved);
                    if (isProcess) {
                        let process = tasks_1.CommandString.value(task.command.name);
                        if (taskSystemInfo.platform === 3 /* Platform.Platform.Windows */) {
                            process = await this.resolveAndFindExecutable(taskSystemInfo, workspaceFolder, task, cwd, envPath);
                        }
                        resolved.variables.set(TerminalTaskSystem.ProcessVarName, process);
                    }
                    return resolved;
                });
                return resolvedVariables;
            }
            else {
                let variablesArray = new Array();
                unresolved.forEach(variable => variablesArray.push(variable));
                return new Promise((resolve, reject) => {
                    this.configurationResolverService.resolveWithInteraction(workspaceFolder, variablesArray, 'tasks', undefined, tasks_1.TaskSourceKind.toConfigurationTarget(task._source.kind)).then(async (resolvedVariablesMap) => {
                        if (resolvedVariablesMap) {
                            this.mergeMaps(alreadyResolved, resolvedVariablesMap);
                            resolvedVariablesMap = new Map(alreadyResolved);
                            if (isProcess) {
                                let processVarValue;
                                if (Platform.isWindows) {
                                    processVarValue = await this.resolveAndFindExecutable(taskSystemInfo, workspaceFolder, task, cwd, envPath);
                                }
                                else {
                                    processVarValue = await this.configurationResolverService.resolveAsync(workspaceFolder, tasks_1.CommandString.value(task.command.name));
                                }
                                resolvedVariablesMap.set(TerminalTaskSystem.ProcessVarName, processVarValue);
                            }
                            let resolvedVariablesResult = {
                                variables: resolvedVariablesMap,
                            };
                            resolve(resolvedVariablesResult);
                        }
                        else {
                            resolve(undefined);
                        }
                    }, reason => {
                        reject(reason);
                    });
                });
            }
        }
        executeCommand(task, trigger, alreadyResolved) {
            const taskWorkspaceFolder = task.getWorkspaceFolder();
            let workspaceFolder;
            if (taskWorkspaceFolder) {
                workspaceFolder = this.currentTask.workspaceFolder = taskWorkspaceFolder;
            }
            else {
                const folders = this.contextService.getWorkspace().folders;
                workspaceFolder = folders.length > 0 ? folders[0] : undefined;
            }
            const systemInfo = this.currentTask.systemInfo = this.taskSystemInfoResolver(workspaceFolder);
            let variables = new Set();
            this.collectTaskVariables(variables, task);
            const resolvedVariables = this.acquireInput(systemInfo, workspaceFolder, task, variables, alreadyResolved);
            return resolvedVariables.then((resolvedVariables) => {
                if (resolvedVariables && !this.isTaskEmpty(task)) {
                    this.currentTask.resolvedVariables = resolvedVariables;
                    return this.executeInTerminal(task, trigger, new VariableResolver(workspaceFolder, systemInfo, resolvedVariables.variables, this.configurationResolverService), workspaceFolder);
                }
                else {
                    // Allows the taskExecutions array to be updated in the extension host
                    this.fireTaskEvent(tasks_1.TaskEvent.create("end" /* TaskEventKind.End */, task));
                    return Promise.resolve({ exitCode: 0 });
                }
            }, reason => {
                return Promise.reject(reason);
            });
        }
        isTaskEmpty(task) {
            const isCustomExecution = (task.command.runtime === tasks_1.RuntimeType.CustomExecution);
            return !((task.command !== undefined) && task.command.runtime && (isCustomExecution || (task.command.name !== undefined)));
        }
        reexecuteCommand(task, trigger, alreadyResolved) {
            const lastTask = this.lastTask;
            if (!lastTask) {
                return Promise.reject(new Error('No task previously run'));
            }
            const workspaceFolder = this.currentTask.workspaceFolder = lastTask.workspaceFolder;
            let variables = new Set();
            this.collectTaskVariables(variables, task);
            // Check that the task hasn't changed to include new variables
            let hasAllVariables = true;
            variables.forEach(value => {
                if (value.substring(2, value.length - 1) in lastTask.getVerifiedTask().resolvedVariables) {
                    hasAllVariables = false;
                }
            });
            if (!hasAllVariables) {
                return this.acquireInput(lastTask.getVerifiedTask().systemInfo, lastTask.getVerifiedTask().workspaceFolder, task, variables, alreadyResolved).then((resolvedVariables) => {
                    if (!resolvedVariables) {
                        // Allows the taskExecutions array to be updated in the extension host
                        this.fireTaskEvent(tasks_1.TaskEvent.create("end" /* TaskEventKind.End */, task));
                        return { exitCode: 0 };
                    }
                    this.currentTask.resolvedVariables = resolvedVariables;
                    return this.executeInTerminal(task, trigger, new VariableResolver(lastTask.getVerifiedTask().workspaceFolder, lastTask.getVerifiedTask().systemInfo, resolvedVariables.variables, this.configurationResolverService), workspaceFolder);
                }, reason => {
                    return Promise.reject(reason);
                });
            }
            else {
                this.currentTask.resolvedVariables = lastTask.getVerifiedTask().resolvedVariables;
                return this.executeInTerminal(task, trigger, new VariableResolver(lastTask.getVerifiedTask().workspaceFolder, lastTask.getVerifiedTask().systemInfo, lastTask.getVerifiedTask().resolvedVariables.variables, this.configurationResolverService), workspaceFolder);
            }
        }
        async executeInTerminal(task, trigger, resolver, workspaceFolder) {
            let terminal = undefined;
            let executedCommand = undefined;
            let error = undefined;
            let promise = undefined;
            if (task.configurationProperties.isBackground) {
                const problemMatchers = await this.resolveMatchers(resolver, task.configurationProperties.problemMatchers);
                let watchingProblemMatcher = new problemCollectors_1.WatchingProblemCollector(problemMatchers, this.markerService, this.modelService, this.fileService);
                if ((problemMatchers.length > 0) && !watchingProblemMatcher.isWatching()) {
                    this.appendOutput(nls.localize('TerminalTaskSystem.nonWatchingMatcher', 'Task {0} is a background task but uses a problem matcher without a background pattern', task._label));
                    this.showOutput();
                }
                const toDispose = new lifecycle_1.DisposableStore();
                let eventCounter = 0;
                const mapKey = task.getMapKey();
                toDispose.add(watchingProblemMatcher.onDidStateChange((event) => {
                    if (event.kind === "backgroundProcessingBegins" /* ProblemCollectorEventKind.BackgroundProcessingBegins */) {
                        eventCounter++;
                        this.busyTasks[mapKey] = task;
                        this.fireTaskEvent(tasks_1.TaskEvent.create("active" /* TaskEventKind.Active */, task));
                    }
                    else if (event.kind === "backgroundProcessingEnds" /* ProblemCollectorEventKind.BackgroundProcessingEnds */) {
                        eventCounter--;
                        if (this.busyTasks[mapKey]) {
                            delete this.busyTasks[mapKey];
                        }
                        this.fireTaskEvent(tasks_1.TaskEvent.create("inactive" /* TaskEventKind.Inactive */, task));
                        if (eventCounter === 0) {
                            if ((watchingProblemMatcher.numberOfMatches > 0) && watchingProblemMatcher.maxMarkerSeverity &&
                                (watchingProblemMatcher.maxMarkerSeverity >= markers_1.MarkerSeverity.Error)) {
                                let reveal = task.command.presentation.reveal;
                                let revealProblems = task.command.presentation.revealProblems;
                                if (revealProblems === tasks_1.RevealProblemKind.OnProblem) {
                                    this.viewsService.openView(constants_1.default.MARKERS_VIEW_ID, true);
                                }
                                else if (reveal === tasks_1.RevealKind.Silent) {
                                    this.terminalService.setActiveInstance(terminal);
                                    this.terminalGroupService.showPanel(false);
                                }
                            }
                        }
                    }
                }));
                watchingProblemMatcher.aboutToStart();
                let delayer = undefined;
                [terminal, executedCommand, error] = await this.createTerminal(task, resolver, workspaceFolder);
                if (error) {
                    return Promise.reject(new Error(error.message));
                }
                if (!terminal) {
                    return Promise.reject(new Error(`Failed to create terminal for task ${task._label}`));
                }
                this.terminalStatusManager.addTerminal(task, terminal, watchingProblemMatcher);
                let processStartedSignaled = false;
                terminal.processReady.then(() => {
                    if (!processStartedSignaled) {
                        this.fireTaskEvent(tasks_1.TaskEvent.create("processStarted" /* TaskEventKind.ProcessStarted */, task, terminal.processId));
                        processStartedSignaled = true;
                    }
                }, (_error) => {
                    this.logService.error('Task terminal process never got ready');
                });
                this.fireTaskEvent(tasks_1.TaskEvent.create("start" /* TaskEventKind.Start */, task, terminal.instanceId));
                const onData = terminal.onLineData((line) => {
                    watchingProblemMatcher.processLine(line);
                    if (!delayer) {
                        delayer = new Async.Delayer(3000);
                    }
                    delayer.trigger(() => {
                        watchingProblemMatcher.forceDelivery();
                        delayer = undefined;
                    });
                });
                promise = new Promise((resolve, reject) => {
                    const onExit = terminal.onExit((terminalLaunchResult) => {
                        const exitCode = typeof terminalLaunchResult === 'number' ? terminalLaunchResult : terminalLaunchResult === null || terminalLaunchResult === void 0 ? void 0 : terminalLaunchResult.code;
                        onData.dispose();
                        onExit.dispose();
                        let key = task.getMapKey();
                        if (this.busyTasks[mapKey]) {
                            delete this.busyTasks[mapKey];
                        }
                        this.removeFromActiveTasks(task);
                        this.fireTaskEvent(tasks_1.TaskEvent.create("changed" /* TaskEventKind.Changed */));
                        if (terminalLaunchResult !== undefined) {
                            // Only keep a reference to the terminal if it is not being disposed.
                            switch (task.command.presentation.panel) {
                                case tasks_1.PanelKind.Dedicated:
                                    this.sameTaskTerminals[key] = terminal.instanceId.toString();
                                    break;
                                case tasks_1.PanelKind.Shared:
                                    this.idleTaskTerminals.set(key, terminal.instanceId.toString(), 1 /* Touch.AsOld */);
                                    break;
                            }
                        }
                        let reveal = task.command.presentation.reveal;
                        if ((reveal === tasks_1.RevealKind.Silent) && ((exitCode !== 0) || (watchingProblemMatcher.numberOfMatches > 0) && watchingProblemMatcher.maxMarkerSeverity &&
                            (watchingProblemMatcher.maxMarkerSeverity >= markers_1.MarkerSeverity.Error))) {
                            try {
                                this.terminalService.setActiveInstance(terminal);
                                this.terminalGroupService.showPanel(false);
                            }
                            catch (e) {
                                // If the terminal has already been disposed, then setting the active instance will fail. #99828
                                // There is nothing else to do here.
                            }
                        }
                        watchingProblemMatcher.done();
                        watchingProblemMatcher.dispose();
                        if (!processStartedSignaled) {
                            this.fireTaskEvent(tasks_1.TaskEvent.create("processStarted" /* TaskEventKind.ProcessStarted */, task, terminal.processId));
                            processStartedSignaled = true;
                        }
                        this.fireTaskEvent(tasks_1.TaskEvent.create("processEnded" /* TaskEventKind.ProcessEnded */, task, exitCode !== null && exitCode !== void 0 ? exitCode : undefined));
                        for (let i = 0; i < eventCounter; i++) {
                            this.fireTaskEvent(tasks_1.TaskEvent.create("inactive" /* TaskEventKind.Inactive */, task));
                        }
                        eventCounter = 0;
                        this.fireTaskEvent(tasks_1.TaskEvent.create("end" /* TaskEventKind.End */, task));
                        toDispose.dispose();
                        resolve({ exitCode: exitCode !== null && exitCode !== void 0 ? exitCode : undefined });
                    });
                });
            }
            else {
                [terminal, executedCommand, error] = await this.createTerminal(task, resolver, workspaceFolder);
                if (error) {
                    return Promise.reject(new Error(error.message));
                }
                if (!terminal) {
                    return Promise.reject(new Error(`Failed to create terminal for task ${task._label}`));
                }
                let processStartedSignaled = false;
                terminal.processReady.then(() => {
                    if (!processStartedSignaled) {
                        this.fireTaskEvent(tasks_1.TaskEvent.create("processStarted" /* TaskEventKind.ProcessStarted */, task, terminal.processId));
                        processStartedSignaled = true;
                    }
                }, (_error) => {
                    // The process never got ready. Need to think how to handle this.
                });
                this.fireTaskEvent(tasks_1.TaskEvent.create("start" /* TaskEventKind.Start */, task, terminal.instanceId, resolver.values));
                const mapKey = task.getMapKey();
                this.busyTasks[mapKey] = task;
                this.fireTaskEvent(tasks_1.TaskEvent.create("active" /* TaskEventKind.Active */, task));
                let problemMatchers = await this.resolveMatchers(resolver, task.configurationProperties.problemMatchers);
                let startStopProblemMatcher = new problemCollectors_1.StartStopProblemCollector(problemMatchers, this.markerService, this.modelService, 0 /* ProblemHandlingStrategy.Clean */, this.fileService);
                this.terminalStatusManager.addTerminal(task, terminal, startStopProblemMatcher);
                const onData = terminal.onLineData((line) => {
                    startStopProblemMatcher.processLine(line);
                });
                promise = new Promise((resolve, reject) => {
                    const onExit = terminal.onExit((terminalLaunchResult) => {
                        const exitCode = typeof terminalLaunchResult === 'number' ? terminalLaunchResult : terminalLaunchResult === null || terminalLaunchResult === void 0 ? void 0 : terminalLaunchResult.code;
                        onExit.dispose();
                        let key = task.getMapKey();
                        this.removeFromActiveTasks(task);
                        this.fireTaskEvent(tasks_1.TaskEvent.create("changed" /* TaskEventKind.Changed */));
                        if (terminalLaunchResult !== undefined) {
                            // Only keep a reference to the terminal if it is not being disposed.
                            switch (task.command.presentation.panel) {
                                case tasks_1.PanelKind.Dedicated:
                                    this.sameTaskTerminals[key] = terminal.instanceId.toString();
                                    break;
                                case tasks_1.PanelKind.Shared:
                                    this.idleTaskTerminals.set(key, terminal.instanceId.toString(), 1 /* Touch.AsOld */);
                                    break;
                            }
                        }
                        let reveal = task.command.presentation.reveal;
                        let revealProblems = task.command.presentation.revealProblems;
                        let revealProblemPanel = terminal && (revealProblems === tasks_1.RevealProblemKind.OnProblem) && (startStopProblemMatcher.numberOfMatches > 0);
                        if (revealProblemPanel) {
                            this.viewsService.openView(constants_1.default.MARKERS_VIEW_ID);
                        }
                        else if (terminal && (reveal === tasks_1.RevealKind.Silent) && ((exitCode !== 0) || (startStopProblemMatcher.numberOfMatches > 0) && startStopProblemMatcher.maxMarkerSeverity &&
                            (startStopProblemMatcher.maxMarkerSeverity >= markers_1.MarkerSeverity.Error))) {
                            try {
                                this.terminalService.setActiveInstance(terminal);
                                this.terminalGroupService.showPanel(false);
                            }
                            catch (e) {
                                // If the terminal has already been disposed, then setting the active instance will fail. #99828
                                // There is nothing else to do here.
                            }
                        }
                        // Hack to work around #92868 until terminal is fixed.
                        setTimeout(() => {
                            onData.dispose();
                            startStopProblemMatcher.done();
                            startStopProblemMatcher.dispose();
                        }, 100);
                        if (!processStartedSignaled && terminal) {
                            this.fireTaskEvent(tasks_1.TaskEvent.create("processStarted" /* TaskEventKind.ProcessStarted */, task, terminal.processId));
                            processStartedSignaled = true;
                        }
                        this.fireTaskEvent(tasks_1.TaskEvent.create("processEnded" /* TaskEventKind.ProcessEnded */, task, exitCode !== null && exitCode !== void 0 ? exitCode : undefined));
                        if (this.busyTasks[mapKey]) {
                            delete this.busyTasks[mapKey];
                        }
                        this.fireTaskEvent(tasks_1.TaskEvent.create("inactive" /* TaskEventKind.Inactive */, task));
                        this.fireTaskEvent(tasks_1.TaskEvent.create("end" /* TaskEventKind.End */, task));
                        resolve({ exitCode: exitCode !== null && exitCode !== void 0 ? exitCode : undefined });
                    });
                });
            }
            let showProblemPanel = task.command.presentation && (task.command.presentation.revealProblems === tasks_1.RevealProblemKind.Always);
            if (showProblemPanel) {
                this.viewsService.openView(constants_1.default.MARKERS_VIEW_ID);
            }
            else if (task.command.presentation && (task.command.presentation.reveal === tasks_1.RevealKind.Always)) {
                this.terminalService.setActiveInstance(terminal);
                this.terminalGroupService.showPanel(task.command.presentation.focus);
            }
            this.activeTasks[task.getMapKey()] = { terminal, task, promise };
            this.fireTaskEvent(tasks_1.TaskEvent.create("changed" /* TaskEventKind.Changed */));
            return promise.then((summary) => {
                try {
                    let telemetryEvent = {
                        trigger: trigger,
                        runner: 'terminal',
                        taskKind: task.getTelemetryKind(),
                        command: this.getSanitizedCommand(executedCommand),
                        success: true,
                        exitCode: summary.exitCode
                    };
                    /* __GDPR__
                        "taskService" : {
                            "${include}": [
                                "${TelemetryEvent}"
                            ]
                        }
                    */
                    this.telemetryService.publicLog(TerminalTaskSystem.TelemetryEventName, telemetryEvent);
                }
                catch (error) {
                }
                return summary;
            }, (error) => {
                try {
                    let telemetryEvent = {
                        trigger: trigger,
                        runner: 'terminal',
                        taskKind: task.getTelemetryKind(),
                        command: this.getSanitizedCommand(executedCommand),
                        success: false
                    };
                    /* __GDPR__
                        "taskService" : {
                            "${include}": [
                                "${TelemetryEvent}"
                            ]
                        }
                    */
                    this.telemetryService.publicLog(TerminalTaskSystem.TelemetryEventName, telemetryEvent);
                }
                catch (error) {
                }
                return Promise.reject(error);
            });
        }
        createTerminalName(task) {
            const needsFolderQualification = this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */;
            return needsFolderQualification ? task.getQualifiedLabel() : (task.configurationProperties.name || '');
        }
        async createShellLaunchConfig(task, workspaceFolder, variableResolver, platform, options, command, args, waitOnExit) {
            let shellLaunchConfig;
            let isShellCommand = task.command.runtime === tasks_1.RuntimeType.Shell;
            let needsFolderQualification = this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */;
            let terminalName = this.createTerminalName(task);
            const type = 'Task';
            let originalCommand = task.command.name;
            if (isShellCommand) {
                let os;
                switch (platform) {
                    case 3 /* Platform.Platform.Windows */:
                        os = 1 /* Platform.OperatingSystem.Windows */;
                        break;
                    case 1 /* Platform.Platform.Mac */:
                        os = 2 /* Platform.OperatingSystem.Macintosh */;
                        break;
                    case 2 /* Platform.Platform.Linux */:
                    default:
                        os = 3 /* Platform.OperatingSystem.Linux */;
                        break;
                }
                const defaultProfile = await this.terminalProfileResolverService.getDefaultProfile({
                    allowAutomationShell: true,
                    os,
                    remoteAuthority: this.environmentService.remoteAuthority
                });
                shellLaunchConfig = {
                    name: terminalName,
                    type,
                    executable: defaultProfile.path,
                    args: defaultProfile.args,
                    icon: defaultProfile.icon,
                    env: Object.assign({}, defaultProfile.env),
                    color: defaultProfile.color,
                    waitOnExit
                };
                let shellSpecified = false;
                let shellOptions = task.command.options && task.command.options.shell;
                if (shellOptions) {
                    if (shellOptions.executable) {
                        // Clear out the args so that we don't end up with mismatched args.
                        if (shellOptions.executable !== shellLaunchConfig.executable) {
                            shellLaunchConfig.args = undefined;
                        }
                        shellLaunchConfig.executable = await this.resolveVariable(variableResolver, shellOptions.executable);
                        shellSpecified = true;
                    }
                    if (shellOptions.args) {
                        shellLaunchConfig.args = await this.resolveVariables(variableResolver, shellOptions.args.slice());
                    }
                }
                if (shellLaunchConfig.args === undefined) {
                    shellLaunchConfig.args = [];
                }
                let shellArgs = Array.isArray(shellLaunchConfig.args) ? shellLaunchConfig.args.slice(0) : [shellLaunchConfig.args];
                let toAdd = [];
                let basename = path.posix.basename((await this.pathService.fileURI(shellLaunchConfig.executable)).path).toLowerCase();
                let commandLine = this.buildShellCommandLine(platform, basename, shellOptions, command, originalCommand, args);
                let windowsShellArgs = false;
                if (platform === 3 /* Platform.Platform.Windows */) {
                    windowsShellArgs = true;
                    // If we don't have a cwd, then the terminal uses the home dir.
                    const userHome = await this.pathService.userHome();
                    if (basename === 'cmd.exe' && ((options.cwd && (0, extpath_1.isUNC)(options.cwd)) || (!options.cwd && (0, extpath_1.isUNC)(userHome.fsPath)))) {
                        return undefined;
                    }
                    if ((basename === 'powershell.exe') || (basename === 'pwsh.exe')) {
                        if (!shellSpecified) {
                            toAdd.push('-Command');
                        }
                    }
                    else if ((basename === 'bash.exe') || (basename === 'zsh.exe')) {
                        windowsShellArgs = false;
                        if (!shellSpecified) {
                            toAdd.push('-c');
                        }
                    }
                    else if (basename === 'wsl.exe') {
                        if (!shellSpecified) {
                            toAdd.push('-e');
                        }
                    }
                    else {
                        if (!shellSpecified) {
                            toAdd.push('/d', '/c');
                        }
                    }
                }
                else {
                    if (!shellSpecified) {
                        // Under Mac remove -l to not start it as a login shell.
                        if (platform === 1 /* Platform.Platform.Mac */) {
                            // Background on -l on osx https://github.com/microsoft/vscode/issues/107563
                            const osxShellArgs = this.configurationService.inspect("terminal.integrated.shellArgs.osx" /* TerminalSettingId.ShellArgsMacOs */);
                            if ((osxShellArgs.user === undefined) && (osxShellArgs.userLocal === undefined) && (osxShellArgs.userLocalValue === undefined)
                                && (osxShellArgs.userRemote === undefined) && (osxShellArgs.userRemoteValue === undefined)
                                && (osxShellArgs.userValue === undefined) && (osxShellArgs.workspace === undefined)
                                && (osxShellArgs.workspaceFolder === undefined) && (osxShellArgs.workspaceFolderValue === undefined)
                                && (osxShellArgs.workspaceValue === undefined)) {
                                let index = shellArgs.indexOf('-l');
                                if (index !== -1) {
                                    shellArgs.splice(index, 1);
                                }
                            }
                        }
                        toAdd.push('-c');
                    }
                }
                const combinedShellArgs = this.addAllArgument(toAdd, shellArgs);
                combinedShellArgs.push(commandLine);
                shellLaunchConfig.args = windowsShellArgs ? combinedShellArgs.join(' ') : combinedShellArgs;
                if (task.command.presentation && task.command.presentation.echo) {
                    if (needsFolderQualification && workspaceFolder) {
                        shellLaunchConfig.initialText = `\x1b[1m> Executing task in folder ${workspaceFolder.name}: ${commandLine} <\x1b[0m\n`;
                    }
                    else {
                        shellLaunchConfig.initialText = `\x1b[1m> Executing task: ${commandLine} <\x1b[0m\n`;
                    }
                }
            }
            else {
                let commandExecutable = (task.command.runtime !== tasks_1.RuntimeType.CustomExecution) ? tasks_1.CommandString.value(command) : undefined;
                let executable = !isShellCommand
                    ? await this.resolveVariable(variableResolver, await this.resolveVariable(variableResolver, '${' + TerminalTaskSystem.ProcessVarName + '}'))
                    : commandExecutable;
                // When we have a process task there is no need to quote arguments. So we go ahead and take the string value.
                shellLaunchConfig = {
                    name: terminalName,
                    type,
                    executable: executable,
                    args: args.map(a => Types.isString(a) ? a : a.value),
                    waitOnExit
                };
                if (task.command.presentation && task.command.presentation.echo) {
                    let getArgsToEcho = (args) => {
                        if (!args || args.length === 0) {
                            return '';
                        }
                        if (Types.isString(args)) {
                            return args;
                        }
                        return args.join(' ');
                    };
                    if (needsFolderQualification && workspaceFolder) {
                        shellLaunchConfig.initialText = `\x1b[1m> Executing task in folder ${workspaceFolder.name}: ${shellLaunchConfig.executable} ${getArgsToEcho(shellLaunchConfig.args)} <\x1b[0m\n`;
                    }
                    else {
                        shellLaunchConfig.initialText = `\x1b[1m> Executing task: ${shellLaunchConfig.executable} ${getArgsToEcho(shellLaunchConfig.args)} <\x1b[0m\n`;
                    }
                }
            }
            if (options.cwd) {
                let cwd = options.cwd;
                if (!path.isAbsolute(cwd)) {
                    if (workspaceFolder && (workspaceFolder.uri.scheme === network_1.Schemas.file)) {
                        cwd = path.join(workspaceFolder.uri.fsPath, cwd);
                    }
                }
                // This must be normalized to the OS
                shellLaunchConfig.cwd = (0, extpath_1.isUNC)(cwd) ? cwd : resources.toLocalResource(uri_1.URI.from({ scheme: network_1.Schemas.file, path: cwd }), this.environmentService.remoteAuthority, this.pathService.defaultUriScheme);
            }
            if (options.env) {
                if (shellLaunchConfig.env) {
                    shellLaunchConfig.env = Object.assign(Object.assign({}, shellLaunchConfig.env), options.env);
                }
                else {
                    shellLaunchConfig.env = options.env;
                }
            }
            shellLaunchConfig.isFeatureTerminal = true;
            shellLaunchConfig.useShellEnvironment = true;
            return shellLaunchConfig;
        }
        addAllArgument(shellCommandArgs, configuredShellArgs) {
            const combinedShellArgs = Objects.deepClone(configuredShellArgs);
            shellCommandArgs.forEach(element => {
                const shouldAddShellCommandArg = configuredShellArgs.every((arg, index) => {
                    if ((arg.toLowerCase() === element) && (configuredShellArgs.length > index + 1)) {
                        // We can still add the argument, but only if not all of the following arguments begin with "-".
                        return !configuredShellArgs.slice(index + 1).every(testArg => testArg.startsWith('-'));
                    }
                    else {
                        return arg.toLowerCase() !== element;
                    }
                });
                if (shouldAddShellCommandArg) {
                    combinedShellArgs.push(element);
                }
            });
            return combinedShellArgs;
        }
        async doCreateTerminal(group, launchConfigs) {
            if (group) {
                // Try to find an existing terminal to split.
                // Even if an existing terminal is found, the split can fail if the terminal width is too small.
                for (const terminal of (0, collections_1.values)(this.terminals)) {
                    if (terminal.group === group) {
                        this.logService.trace(`Found terminal to split for group ${group}`);
                        const originalInstance = terminal.terminal;
                        const result = await this.terminalService.createTerminal({ location: { parentTerminal: originalInstance }, config: launchConfigs });
                        if (result) {
                            return result;
                        }
                    }
                }
                this.logService.trace(`No terminal found to split for group ${group}`);
            }
            // Either no group is used, no terminal with the group exists or splitting an existing terminal failed.
            const createdTerminal = await this.terminalService.createTerminal({ location: terminal_2.TerminalLocation.Panel, config: launchConfigs });
            this.logService.trace('Created a new task terminal');
            return createdTerminal;
        }
        async createTerminal(task, resolver, workspaceFolder) {
            let platform = resolver.taskSystemInfo ? resolver.taskSystemInfo.platform : Platform.platform;
            let options = await this.resolveOptions(resolver, task.command.options);
            const presentationOptions = task.command.presentation;
            let waitOnExit = false;
            if (!presentationOptions) {
                throw new Error('Task presentation options should not be undefined here.');
            }
            if ((presentationOptions.close === undefined) || (presentationOptions.close === false)) {
                if ((presentationOptions.reveal !== tasks_1.RevealKind.Never) || !task.configurationProperties.isBackground || (presentationOptions.close === false)) {
                    if (presentationOptions.panel === tasks_1.PanelKind.New) {
                        waitOnExit = nls.localize('closeTerminal', 'Press any key to close the terminal.');
                    }
                    else if (presentationOptions.showReuseMessage) {
                        waitOnExit = nls.localize('reuseTerminal', 'Terminal will be reused by tasks, press any key to close it.');
                    }
                    else {
                        waitOnExit = true;
                    }
                }
            }
            else {
                waitOnExit = !presentationOptions.close;
            }
            let commandExecutable;
            let command;
            let args;
            let launchConfigs;
            if (task.command.runtime === tasks_1.RuntimeType.CustomExecution) {
                this.currentTask.shellLaunchConfig = launchConfigs = {
                    customPtyImplementation: (id, cols, rows) => new terminalProcessExtHostProxy_1.TerminalProcessExtHostProxy(id, cols, rows, this.terminalService),
                    waitOnExit,
                    name: this.createTerminalName(task),
                    initialText: task.command.presentation && task.command.presentation.echo ? `\x1b[1m> Executing task: ${task._label} <\x1b[0m\n` : undefined,
                    isFeatureTerminal: true
                };
            }
            else {
                let resolvedResult = await this.resolveCommandAndArgs(resolver, task.command);
                command = resolvedResult.command;
                args = resolvedResult.args;
                commandExecutable = tasks_1.CommandString.value(command);
                this.currentTask.shellLaunchConfig = launchConfigs = await this.createShellLaunchConfig(task, workspaceFolder, resolver, platform, options, command, args, waitOnExit);
                if (launchConfigs === undefined) {
                    return [undefined, undefined, new taskSystem_1.TaskError(severity_1.default.Error, nls.localize('TerminalTaskSystem', 'Can\'t execute a shell command on an UNC drive using cmd.exe.'), 7 /* TaskErrors.UnknownError */)];
                }
            }
            let prefersSameTerminal = presentationOptions.panel === tasks_1.PanelKind.Dedicated;
            let allowsSharedTerminal = presentationOptions.panel === tasks_1.PanelKind.Shared;
            let group = presentationOptions.group;
            let taskKey = task.getMapKey();
            let terminalToReuse;
            if (prefersSameTerminal) {
                let terminalId = this.sameTaskTerminals[taskKey];
                if (terminalId) {
                    terminalToReuse = this.terminals[terminalId];
                    delete this.sameTaskTerminals[taskKey];
                }
            }
            else if (allowsSharedTerminal) {
                // Always allow to reuse the terminal previously used by the same task.
                let terminalId = this.idleTaskTerminals.remove(taskKey);
                if (!terminalId) {
                    // There is no idle terminal which was used by the same task.
                    // Search for any idle terminal used previously by a task of the same group
                    // (or, if the task has no group, a terminal used by a task without group).
                    for (const taskId of this.idleTaskTerminals.keys()) {
                        const idleTerminalId = this.idleTaskTerminals.get(taskId);
                        if (idleTerminalId && this.terminals[idleTerminalId] && this.terminals[idleTerminalId].group === group) {
                            terminalId = this.idleTaskTerminals.remove(taskId);
                            break;
                        }
                    }
                }
                if (terminalId) {
                    terminalToReuse = this.terminals[terminalId];
                }
            }
            if (terminalToReuse) {
                if (!launchConfigs) {
                    throw new Error('Task shell launch configuration should not be undefined here.');
                }
                terminalToReuse.terminal.scrollToBottom();
                await terminalToReuse.terminal.reuseTerminal(launchConfigs);
                if (task.command.presentation && task.command.presentation.clear) {
                    terminalToReuse.terminal.clearBuffer();
                }
                this.terminals[terminalToReuse.terminal.instanceId.toString()].lastTask = taskKey;
                return [terminalToReuse.terminal, commandExecutable, undefined];
            }
            this.terminalCreationQueue = this.terminalCreationQueue.then(() => this.doCreateTerminal(group, launchConfigs));
            const result = (await this.terminalCreationQueue);
            const terminalKey = result.instanceId.toString();
            result.onDisposed((terminal) => {
                let terminalData = this.terminals[terminalKey];
                if (terminalData) {
                    delete this.terminals[terminalKey];
                    delete this.sameTaskTerminals[terminalData.lastTask];
                    this.idleTaskTerminals.delete(terminalData.lastTask);
                    // Delete the task now as a work around for cases when the onExit isn't fired.
                    // This can happen if the terminal wasn't shutdown with an "immediate" flag and is expected.
                    // For correct terminal re-use, the task needs to be deleted immediately.
                    // Note that this shouldn't be a problem anymore since user initiated terminal kills are now immediate.
                    const mapKey = task.getMapKey();
                    this.removeFromActiveTasks(task);
                    if (this.busyTasks[mapKey]) {
                        delete this.busyTasks[mapKey];
                    }
                }
            });
            this.terminals[terminalKey] = { terminal: result, lastTask: taskKey, group };
            return [result, commandExecutable, undefined];
        }
        buildShellCommandLine(platform, shellExecutable, shellOptions, command, originalCommand, args) {
            let basename = path.parse(shellExecutable).name.toLowerCase();
            let shellQuoteOptions = this.getQuotingOptions(basename, shellOptions, platform);
            function needsQuotes(value) {
                if (value.length >= 2) {
                    let first = value[0] === shellQuoteOptions.strong ? shellQuoteOptions.strong : value[0] === shellQuoteOptions.weak ? shellQuoteOptions.weak : undefined;
                    if (first === value[value.length - 1]) {
                        return false;
                    }
                }
                let quote;
                for (let i = 0; i < value.length; i++) {
                    // We found the end quote.
                    let ch = value[i];
                    if (ch === quote) {
                        quote = undefined;
                    }
                    else if (quote !== undefined) {
                        // skip the character. We are quoted.
                        continue;
                    }
                    else if (ch === shellQuoteOptions.escape) {
                        // Skip the next character
                        i++;
                    }
                    else if (ch === shellQuoteOptions.strong || ch === shellQuoteOptions.weak) {
                        quote = ch;
                    }
                    else if (ch === ' ') {
                        return true;
                    }
                }
                return false;
            }
            function quote(value, kind) {
                if (kind === tasks_1.ShellQuoting.Strong && shellQuoteOptions.strong) {
                    return [shellQuoteOptions.strong + value + shellQuoteOptions.strong, true];
                }
                else if (kind === tasks_1.ShellQuoting.Weak && shellQuoteOptions.weak) {
                    return [shellQuoteOptions.weak + value + shellQuoteOptions.weak, true];
                }
                else if (kind === tasks_1.ShellQuoting.Escape && shellQuoteOptions.escape) {
                    if (Types.isString(shellQuoteOptions.escape)) {
                        return [value.replace(/ /g, shellQuoteOptions.escape + ' '), true];
                    }
                    else {
                        let buffer = [];
                        for (let ch of shellQuoteOptions.escape.charsToEscape) {
                            buffer.push(`\\${ch}`);
                        }
                        let regexp = new RegExp('[' + buffer.join(',') + ']', 'g');
                        let escapeChar = shellQuoteOptions.escape.escapeChar;
                        return [value.replace(regexp, (match) => escapeChar + match), true];
                    }
                }
                return [value, false];
            }
            function quoteIfNecessary(value) {
                if (Types.isString(value)) {
                    if (needsQuotes(value)) {
                        return quote(value, tasks_1.ShellQuoting.Strong);
                    }
                    else {
                        return [value, false];
                    }
                }
                else {
                    return quote(value.value, value.quoting);
                }
            }
            // If we have no args and the command is a string then use the command to stay backwards compatible with the old command line
            // model. To allow variable resolving with spaces we do continue if the resolved value is different than the original one
            // and the resolved one needs quoting.
            if ((!args || args.length === 0) && Types.isString(command) && (command === originalCommand || needsQuotes(originalCommand))) {
                return command;
            }
            let result = [];
            let commandQuoted = false;
            let argQuoted = false;
            let value;
            let quoted;
            [value, quoted] = quoteIfNecessary(command);
            result.push(value);
            commandQuoted = quoted;
            for (let arg of args) {
                [value, quoted] = quoteIfNecessary(arg);
                result.push(value);
                argQuoted = argQuoted || quoted;
            }
            let commandLine = result.join(' ');
            // There are special rules quoted command line in cmd.exe
            if (platform === 3 /* Platform.Platform.Windows */) {
                if (basename === 'cmd' && commandQuoted && argQuoted) {
                    commandLine = '"' + commandLine + '"';
                }
                else if ((basename === 'powershell' || basename === 'pwsh') && commandQuoted) {
                    commandLine = '& ' + commandLine;
                }
            }
            return commandLine;
        }
        getQuotingOptions(shellBasename, shellOptions, platform) {
            if (shellOptions && shellOptions.quoting) {
                return shellOptions.quoting;
            }
            return TerminalTaskSystem.shellQuotes[shellBasename] || TerminalTaskSystem.osShellQuotes[Platform.PlatformToString(platform)];
        }
        collectTaskVariables(variables, task) {
            if (task.command && task.command.name) {
                this.collectCommandVariables(variables, task.command, task);
            }
            this.collectMatcherVariables(variables, task.configurationProperties.problemMatchers);
            if (task.command.runtime === tasks_1.RuntimeType.CustomExecution && (tasks_1.CustomTask.is(task) || tasks_1.ContributedTask.is(task))) {
                let definition;
                if (tasks_1.CustomTask.is(task)) {
                    definition = task._source.config.element;
                }
                else {
                    definition = Objects.deepClone(task.defines);
                    delete definition._key;
                    delete definition.type;
                }
                this.collectDefinitionVariables(variables, definition);
            }
        }
        collectDefinitionVariables(variables, definition) {
            if (Types.isString(definition)) {
                this.collectVariables(variables, definition);
            }
            else if (Types.isArray(definition)) {
                definition.forEach((element) => this.collectDefinitionVariables(variables, element));
            }
            else if (Types.isObject(definition)) {
                for (const key in definition) {
                    this.collectDefinitionVariables(variables, definition[key]);
                }
            }
        }
        collectCommandVariables(variables, command, task) {
            // The custom execution should have everything it needs already as it provided
            // the callback.
            if (command.runtime === tasks_1.RuntimeType.CustomExecution) {
                return;
            }
            if (command.name === undefined) {
                throw new Error('Command name should never be undefined here.');
            }
            this.collectVariables(variables, command.name);
            if (command.args) {
                command.args.forEach(arg => this.collectVariables(variables, arg));
            }
            // Try to get a scope.
            const scope = task._source.scope;
            if (scope !== 1 /* TaskScope.Global */) {
                variables.add('${workspaceFolder}');
            }
            if (command.options) {
                let options = command.options;
                if (options.cwd) {
                    this.collectVariables(variables, options.cwd);
                }
                const optionsEnv = options.env;
                if (optionsEnv) {
                    Object.keys(optionsEnv).forEach((key) => {
                        let value = optionsEnv[key];
                        if (Types.isString(value)) {
                            this.collectVariables(variables, value);
                        }
                    });
                }
                if (options.shell) {
                    if (options.shell.executable) {
                        this.collectVariables(variables, options.shell.executable);
                    }
                    if (options.shell.args) {
                        options.shell.args.forEach(arg => this.collectVariables(variables, arg));
                    }
                }
            }
        }
        collectMatcherVariables(variables, values) {
            if (values === undefined || values === null || values.length === 0) {
                return;
            }
            values.forEach((value) => {
                let matcher;
                if (Types.isString(value)) {
                    if (value[0] === '$') {
                        matcher = problemMatcher_1.ProblemMatcherRegistry.get(value.substring(1));
                    }
                    else {
                        matcher = problemMatcher_1.ProblemMatcherRegistry.get(value);
                    }
                }
                else {
                    matcher = value;
                }
                if (matcher && matcher.filePrefix) {
                    this.collectVariables(variables, matcher.filePrefix);
                }
            });
        }
        collectVariables(variables, value) {
            let string = Types.isString(value) ? value : value.value;
            let r = /\$\{(.*?)\}/g;
            let matches;
            do {
                matches = r.exec(string);
                if (matches) {
                    variables.add(matches[0]);
                }
            } while (matches);
        }
        async resolveCommandAndArgs(resolver, commandConfig) {
            // First we need to use the command args:
            let args = commandConfig.args ? commandConfig.args.slice() : [];
            args = await this.resolveVariables(resolver, args);
            let command = await this.resolveVariable(resolver, commandConfig.name);
            return { command, args };
        }
        async resolveVariables(resolver, value) {
            return Promise.all(value.map(s => this.resolveVariable(resolver, s)));
        }
        async resolveMatchers(resolver, values) {
            if (values === undefined || values === null || values.length === 0) {
                return [];
            }
            let result = [];
            for (const value of values) {
                let matcher;
                if (Types.isString(value)) {
                    if (value[0] === '$') {
                        matcher = problemMatcher_1.ProblemMatcherRegistry.get(value.substring(1));
                    }
                    else {
                        matcher = problemMatcher_1.ProblemMatcherRegistry.get(value);
                    }
                }
                else {
                    matcher = value;
                }
                if (!matcher) {
                    this.appendOutput(nls.localize('unknownProblemMatcher', 'Problem matcher {0} can\'t be resolved. The matcher will be ignored'));
                    continue;
                }
                let taskSystemInfo = resolver.taskSystemInfo;
                let hasFilePrefix = matcher.filePrefix !== undefined;
                let hasUriProvider = taskSystemInfo !== undefined && taskSystemInfo.uriProvider !== undefined;
                if (!hasFilePrefix && !hasUriProvider) {
                    result.push(matcher);
                }
                else {
                    let copy = Objects.deepClone(matcher);
                    if (hasUriProvider && (taskSystemInfo !== undefined)) {
                        copy.uriProvider = taskSystemInfo.uriProvider;
                    }
                    if (hasFilePrefix) {
                        copy.filePrefix = await this.resolveVariable(resolver, copy.filePrefix);
                    }
                    result.push(copy);
                }
            }
            return result;
        }
        async resolveVariable(resolver, value) {
            // TODO@Dirk Task.getWorkspaceFolder should return a WorkspaceFolder that is defined in workspace.ts
            if (Types.isString(value)) {
                return resolver.resolve(value);
            }
            else if (value !== undefined) {
                return {
                    value: await resolver.resolve(value.value),
                    quoting: value.quoting
                };
            }
            else { // This should never happen
                throw new Error('Should never try to resolve undefined.');
            }
        }
        async resolveOptions(resolver, options) {
            if (options === undefined || options === null) {
                let cwd;
                try {
                    cwd = await this.resolveVariable(resolver, '${workspaceFolder}');
                }
                catch (e) {
                    // No workspace
                }
                return { cwd };
            }
            let result = Types.isString(options.cwd)
                ? { cwd: await this.resolveVariable(resolver, options.cwd) }
                : { cwd: await this.resolveVariable(resolver, '${workspaceFolder}') };
            if (options.env) {
                result.env = Object.create(null);
                for (const key of Object.keys(options.env)) {
                    let value = options.env[key];
                    if (Types.isString(value)) {
                        result.env[key] = await this.resolveVariable(resolver, value);
                    }
                    else {
                        result.env[key] = value.toString();
                    }
                }
            }
            return result;
        }
        getSanitizedCommand(cmd) {
            let result = cmd.toLowerCase();
            let index = result.lastIndexOf(path.sep);
            if (index !== -1) {
                result = result.substring(index + 1);
            }
            if (TerminalTaskSystem.WellKnowCommands[result]) {
                return result;
            }
            return 'other';
        }
        appendOutput(output) {
            const outputChannel = this.outputService.getChannel(this.outputChannelId);
            if (outputChannel) {
                outputChannel.append(output);
            }
        }
    }
    exports.TerminalTaskSystem = TerminalTaskSystem;
    TerminalTaskSystem.TelemetryEventName = 'taskService';
    TerminalTaskSystem.ProcessVarName = '__process__';
    TerminalTaskSystem.shellQuotes = {
        'cmd': {
            strong: '"'
        },
        'powershell': {
            escape: {
                escapeChar: '`',
                charsToEscape: ' "\'()'
            },
            strong: '\'',
            weak: '"'
        },
        'bash': {
            escape: {
                escapeChar: '\\',
                charsToEscape: ' "\''
            },
            strong: '\'',
            weak: '"'
        },
        'zsh': {
            escape: {
                escapeChar: '\\',
                charsToEscape: ' "\''
            },
            strong: '\'',
            weak: '"'
        }
    };
    TerminalTaskSystem.osShellQuotes = {
        'Linux': TerminalTaskSystem.shellQuotes['bash'],
        'Mac': TerminalTaskSystem.shellQuotes['bash'],
        'Windows': TerminalTaskSystem.shellQuotes['powershell']
    };
    TerminalTaskSystem.WellKnowCommands = {
        'ant': true,
        'cmake': true,
        'eslint': true,
        'gradle': true,
        'grunt': true,
        'gulp': true,
        'jake': true,
        'jenkins': true,
        'jshint': true,
        'make': true,
        'maven': true,
        'msbuild': true,
        'msc': true,
        'nmake': true,
        'npm': true,
        'rake': true,
        'tsc': true,
        'xbuild': true
    };
});
//# sourceMappingURL=terminalTaskSystem.js.map