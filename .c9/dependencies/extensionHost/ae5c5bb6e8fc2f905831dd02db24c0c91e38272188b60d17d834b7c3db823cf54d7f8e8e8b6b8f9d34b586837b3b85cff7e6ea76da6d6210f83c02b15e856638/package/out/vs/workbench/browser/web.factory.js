/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/browser/web.api", "vs/workbench/browser/web.main", "vs/base/common/lifecycle", "vs/platform/commands/common/commands", "vs/base/common/performance", "vs/platform/actions/common/actions", "vs/base/common/async", "vs/base/common/arrays"], function (require, exports, web_api_1, web_main_1, lifecycle_1, commands_1, performance_1, actions_1, async_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.window = exports.env = exports.commands = exports.create = void 0;
    let created = false;
    const workbenchPromise = new async_1.DeferredPromise();
    /**
     * Creates the workbench with the provided options in the provided container.
     *
     * @param domElement the container to create the workbench in
     * @param options for setting up the workbench
     */
    function create(domElement, options) {
        var _a;
        // Mark start of workbench
        (0, performance_1.mark)('code/didLoadWorkbenchMain');
        // Assert that the workbench is not created more than once. We currently
        // do not support this and require a full context switch to clean-up.
        if (created) {
            throw new Error('Unable to create the VSCode workbench more than once.');
        }
        else {
            created = true;
        }
        // Register commands if any
        if (Array.isArray(options.commands)) {
            for (const command of options.commands) {
                commands_1.CommandsRegistry.registerCommand(command.id, (accessor, ...args) => {
                    // we currently only pass on the arguments but not the accessor
                    // to the command to reduce our exposure of internal API.
                    return command.handler(...args);
                });
                // Commands with labels appear in the command palette
                if (command.label) {
                    for (const menu of (0, arrays_1.asArray)((_a = command.menu) !== null && _a !== void 0 ? _a : web_api_1.Menu.CommandPalette)) {
                        actions_1.MenuRegistry.appendMenuItem(asMenuId(menu), { command: { id: command.id, title: command.label } });
                    }
                }
            }
        }
        commands_1.CommandsRegistry.registerCommand('_workbench.getTarballProxyEndpoints', () => { var _a; return ((_a = options._tarballProxyEndpoints) !== null && _a !== void 0 ? _a : {}); });
        // Startup workbench and resolve waiters
        let instantiatedWorkbench = undefined;
        new web_main_1.BrowserMain(domElement, options).open().then(workbench => {
            instantiatedWorkbench = workbench;
            workbenchPromise.complete(workbench);
        });
        return (0, lifecycle_1.toDisposable)(() => {
            if (instantiatedWorkbench) {
                instantiatedWorkbench.shutdown();
            }
            else {
                workbenchPromise.p.then(instantiatedWorkbench => instantiatedWorkbench.shutdown());
            }
        });
    }
    exports.create = create;
    function asMenuId(menu) {
        switch (menu) {
            case web_api_1.Menu.CommandPalette: return actions_1.MenuId.CommandPalette;
            case web_api_1.Menu.StatusBarWindowIndicatorMenu: return actions_1.MenuId.StatusBarWindowIndicatorMenu;
        }
    }
    var commands;
    (function (commands) {
        /**
         * {@linkcode IWorkbench.commands IWorkbench.commands.executeCommand}
         */
        async function executeCommand(command, ...args) {
            const workbench = await workbenchPromise.p;
            return workbench.commands.executeCommand(command, ...args);
        }
        commands.executeCommand = executeCommand;
    })(commands = exports.commands || (exports.commands = {}));
    var env;
    (function (env) {
        /**
         * {@linkcode IWorkbench.env IWorkbench.env.retrievePerformanceMarks}
         */
        async function retrievePerformanceMarks() {
            const workbench = await workbenchPromise.p;
            return workbench.env.retrievePerformanceMarks();
        }
        env.retrievePerformanceMarks = retrievePerformanceMarks;
        /**
         * {@linkcode IWorkbench.env IWorkbench.env.getUriScheme}
         */
        async function getUriScheme() {
            const workbench = await workbenchPromise.p;
            return workbench.env.getUriScheme();
        }
        env.getUriScheme = getUriScheme;
        /**
         * {@linkcode IWorkbench.env IWorkbench.env.openUri}
         */
        async function openUri(target) {
            const workbench = await workbenchPromise.p;
            return workbench.env.openUri(target);
        }
        env.openUri = openUri;
        env.telemetryLevel = workbenchPromise.p.then(workbench => workbench.env.telemetryLevel);
    })(env = exports.env || (exports.env = {}));
    var window;
    (function (window) {
        /**
         * {@linkcode IWorkbench.window IWorkbench.window.withProgress}
         */
        async function withProgress(options, task) {
            const workbench = await workbenchPromise.p;
            return workbench.window.withProgress(options, task);
        }
        window.withProgress = withProgress;
    })(window = exports.window || (exports.window = {}));
});
//# sourceMappingURL=web.factory.js.map