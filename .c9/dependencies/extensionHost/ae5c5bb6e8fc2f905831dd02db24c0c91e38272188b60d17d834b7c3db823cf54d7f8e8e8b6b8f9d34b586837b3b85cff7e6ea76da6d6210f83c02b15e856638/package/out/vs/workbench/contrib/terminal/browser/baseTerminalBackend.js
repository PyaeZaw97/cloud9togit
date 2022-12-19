/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/types", "vs/nls", "vs/platform/notification/common/notification"], function (require, exports, event_1, lifecycle_1, network_1, types_1, nls_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseTerminalBackend = void 0;
    class BaseTerminalBackend extends lifecycle_1.Disposable {
        constructor(eventSource, _logService, notificationService, historyService, configurationResolverService, _workspaceContextService) {
            super();
            this._logService = _logService;
            this._workspaceContextService = _workspaceContextService;
            this._isPtyHostUnresponsive = false;
            this._onPtyHostRestart = this._register(new event_1.Emitter());
            this.onPtyHostRestart = this._onPtyHostRestart.event;
            this._onPtyHostUnresponsive = this._register(new event_1.Emitter());
            this.onPtyHostUnresponsive = this._onPtyHostUnresponsive.event;
            this._onPtyHostResponsive = this._register(new event_1.Emitter());
            this.onPtyHostResponsive = this._onPtyHostResponsive.event;
            // Attach pty host listeners
            if (eventSource.onPtyHostExit) {
                this._register(eventSource.onPtyHostExit(() => {
                    this._logService.error(`The terminal's pty host process exited, the connection to all terminal processes was lost`);
                }));
            }
            let unresponsiveNotification;
            if (eventSource.onPtyHostStart) {
                this._register(eventSource.onPtyHostStart(() => {
                    this._logService.info(`ptyHost restarted`);
                    this._onPtyHostRestart.fire();
                    unresponsiveNotification === null || unresponsiveNotification === void 0 ? void 0 : unresponsiveNotification.close();
                    unresponsiveNotification = undefined;
                    this._isPtyHostUnresponsive = false;
                }));
            }
            if (eventSource.onPtyHostUnresponsive) {
                this._register(eventSource.onPtyHostUnresponsive(() => {
                    const choices = [{
                            label: (0, nls_1.localize)('restartPtyHost', "Restart pty host"),
                            run: () => eventSource.restartPtyHost()
                        }];
                    unresponsiveNotification = notificationService.prompt(notification_1.Severity.Error, (0, nls_1.localize)('nonResponsivePtyHost', "The connection to the terminal's pty host process is unresponsive, the terminals may stop working."), choices);
                    this._isPtyHostUnresponsive = true;
                    this._onPtyHostUnresponsive.fire();
                }));
            }
            if (eventSource.onPtyHostResponsive) {
                this._register(eventSource.onPtyHostResponsive(() => {
                    if (!this._isPtyHostUnresponsive) {
                        return;
                    }
                    this._logService.info('The pty host became responsive again');
                    unresponsiveNotification === null || unresponsiveNotification === void 0 ? void 0 : unresponsiveNotification.close();
                    unresponsiveNotification = undefined;
                    this._isPtyHostUnresponsive = false;
                    this._onPtyHostResponsive.fire();
                }));
            }
            if (eventSource.onPtyHostRequestResolveVariables) {
                this._register(eventSource.onPtyHostRequestResolveVariables(async (e) => {
                    var _a;
                    // Only answer requests for this workspace
                    if (e.workspaceId !== this._workspaceContextService.getWorkspace().id) {
                        return;
                    }
                    const activeWorkspaceRootUri = historyService.getLastActiveWorkspaceRoot(network_1.Schemas.file);
                    const lastActiveWorkspaceRoot = activeWorkspaceRootUri ? (0, types_1.withNullAsUndefined)(this._workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri)) : undefined;
                    const resolveCalls = e.originalText.map(t => {
                        return configurationResolverService.resolveAsync(lastActiveWorkspaceRoot, t);
                    });
                    const result = await Promise.all(resolveCalls);
                    (_a = eventSource.acceptPtyHostResolvedVariables) === null || _a === void 0 ? void 0 : _a.call(eventSource, e.requestId, result);
                }));
            }
        }
        _deserializeTerminalState(serializedState) {
            if (serializedState === undefined) {
                return undefined;
            }
            const parsedUnknown = JSON.parse(serializedState);
            if (!('version' in parsedUnknown) || !('state' in parsedUnknown) || !Array.isArray(parsedUnknown.state)) {
                this._logService.warn('Could not revive serialized processes, wrong format', parsedUnknown);
                return undefined;
            }
            const parsedCrossVersion = parsedUnknown;
            if (parsedCrossVersion.version !== 1) {
                this._logService.warn(`Could not revive serialized processes, wrong version "${parsedCrossVersion.version}"`, parsedCrossVersion);
                return undefined;
            }
            return parsedCrossVersion.state;
        }
    }
    exports.BaseTerminalBackend = BaseTerminalBackend;
});
//# sourceMappingURL=baseTerminalBackend.js.map