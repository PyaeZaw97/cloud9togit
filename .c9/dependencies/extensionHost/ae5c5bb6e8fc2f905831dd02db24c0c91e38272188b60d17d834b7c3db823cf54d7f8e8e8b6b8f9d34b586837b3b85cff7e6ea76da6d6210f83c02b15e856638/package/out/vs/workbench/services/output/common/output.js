/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/platform/registry/common/platform", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/files/common/files", "vs/base/common/errors", "vs/base/common/async"], function (require, exports, event_1, platform_1, contextkey_1, instantiation_1, files_1, errors_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerLogChannel = exports.Extensions = exports.OutputChannelUpdateMode = exports.IOutputService = exports.CONTEXT_OUTPUT_SCROLL_LOCK = exports.CONTEXT_ACTIVE_LOG_OUTPUT = exports.CONTEXT_IN_OUTPUT = exports.MAX_OUTPUT_LENGTH = exports.OUTPUT_SERVICE_ID = exports.OUTPUT_VIEW_ID = exports.LOG_MODE_ID = exports.LOG_SCHEME = exports.LOG_MIME = exports.OUTPUT_MODE_ID = exports.OUTPUT_SCHEME = exports.OUTPUT_MIME = void 0;
    /**
     * Mime type used by the output editor.
     */
    exports.OUTPUT_MIME = 'text/x-code-output';
    /**
     * Output resource scheme.
     */
    exports.OUTPUT_SCHEME = 'output';
    /**
     * Id used by the output editor.
     */
    exports.OUTPUT_MODE_ID = 'Log';
    /**
     * Mime type used by the log output editor.
     */
    exports.LOG_MIME = 'text/x-code-log-output';
    /**
     * Log resource scheme.
     */
    exports.LOG_SCHEME = 'log';
    /**
     * Id used by the log output editor.
     */
    exports.LOG_MODE_ID = 'log';
    /**
     * Output view id
     */
    exports.OUTPUT_VIEW_ID = 'workbench.panel.output';
    exports.OUTPUT_SERVICE_ID = 'outputService';
    exports.MAX_OUTPUT_LENGTH = 10000 /* Max. number of output lines to show in output */ * 100 /* Guestimated chars per line */;
    exports.CONTEXT_IN_OUTPUT = new contextkey_1.RawContextKey('inOutput', false);
    exports.CONTEXT_ACTIVE_LOG_OUTPUT = new contextkey_1.RawContextKey('activeLogOutput', false);
    exports.CONTEXT_OUTPUT_SCROLL_LOCK = new contextkey_1.RawContextKey(`outputView.scrollLock`, false);
    exports.IOutputService = (0, instantiation_1.createDecorator)(exports.OUTPUT_SERVICE_ID);
    var OutputChannelUpdateMode;
    (function (OutputChannelUpdateMode) {
        OutputChannelUpdateMode[OutputChannelUpdateMode["Append"] = 1] = "Append";
        OutputChannelUpdateMode[OutputChannelUpdateMode["Replace"] = 2] = "Replace";
        OutputChannelUpdateMode[OutputChannelUpdateMode["Clear"] = 3] = "Clear";
    })(OutputChannelUpdateMode = exports.OutputChannelUpdateMode || (exports.OutputChannelUpdateMode = {}));
    exports.Extensions = {
        OutputChannels: 'workbench.contributions.outputChannels'
    };
    class OutputChannelRegistry {
        constructor() {
            this.channels = new Map();
            this._onDidRegisterChannel = new event_1.Emitter();
            this.onDidRegisterChannel = this._onDidRegisterChannel.event;
            this._onDidRemoveChannel = new event_1.Emitter();
            this.onDidRemoveChannel = this._onDidRemoveChannel.event;
        }
        registerChannel(descriptor) {
            if (!this.channels.has(descriptor.id)) {
                this.channels.set(descriptor.id, descriptor);
                this._onDidRegisterChannel.fire(descriptor.id);
            }
        }
        getChannels() {
            const result = [];
            this.channels.forEach(value => result.push(value));
            return result;
        }
        getChannel(id) {
            return this.channels.get(id);
        }
        removeChannel(id) {
            this.channels.delete(id);
            this._onDidRemoveChannel.fire(id);
        }
    }
    platform_1.Registry.add(exports.Extensions.OutputChannels, new OutputChannelRegistry());
    function registerLogChannel(id, label, file, fileService, logService) {
        return (0, async_1.createCancelablePromise)(async (token) => {
            await (0, files_1.whenProviderRegistered)(file, fileService);
            const outputChannelRegistry = platform_1.Registry.as(exports.Extensions.OutputChannels);
            try {
                await whenFileExists(file, 1, fileService, logService, token);
                outputChannelRegistry.registerChannel({ id, label, file, log: true });
            }
            catch (error) {
                if (!(0, errors_1.isCancellationError)(error)) {
                    logService.error('Error while registering log channel', file.toString(), (0, errors_1.getErrorMessage)(error));
                }
            }
        });
    }
    exports.registerLogChannel = registerLogChannel;
    async function whenFileExists(file, trial, fileService, logService, token) {
        const exists = await fileService.exists(file);
        if (exists) {
            return;
        }
        if (token.isCancellationRequested) {
            throw new errors_1.CancellationError();
        }
        if (trial > 10) {
            throw new Error(`Timed out while waiting for file to be created`);
        }
        logService.debug(`[Registering Log Channel] File does not exist. Waiting for 1s to retry.`, file.toString());
        await (0, async_1.timeout)(1000, token);
        await whenFileExists(file, trial + 1, fileService, logService, token);
    }
});
//# sourceMappingURL=output.js.map