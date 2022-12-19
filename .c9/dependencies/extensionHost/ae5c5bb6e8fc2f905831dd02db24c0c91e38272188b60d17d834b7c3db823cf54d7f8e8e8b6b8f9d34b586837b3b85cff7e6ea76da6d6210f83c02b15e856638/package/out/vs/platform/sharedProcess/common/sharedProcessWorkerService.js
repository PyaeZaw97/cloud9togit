/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/hash", "vs/platform/instantiation/common/instantiation"], function (require, exports, hash_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ipcSharedProcessWorkerChannelName = exports.ISharedProcessWorkerService = exports.hash = void 0;
    /**
     * Converts the process configuration into a hash to
     * identify processes of the same kind by taking those
     * components that make the process and reply unique.
     */
    function hash(configuration) {
        return (0, hash_1.hash)({
            moduleId: configuration.process.moduleId,
            windowId: configuration.reply.windowId
        });
    }
    exports.hash = hash;
    exports.ISharedProcessWorkerService = (0, instantiation_1.createDecorator)('sharedProcessWorkerService');
    exports.ipcSharedProcessWorkerChannelName = 'sharedProcessWorker';
});
//# sourceMappingURL=sharedProcessWorkerService.js.map