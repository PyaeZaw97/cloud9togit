/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uuid"], function (require, exports, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InspectProfilingService = void 0;
    class InspectProfilingService {
        constructor() {
            this._sessions = new Map();
        }
        async startProfiling(options) {
            const prof = await new Promise((resolve_1, reject_1) => { require(['v8-inspect-profiler'], resolve_1, reject_1); });
            const session = await prof.startProfiling({ port: options.port, checkForPaused: true });
            const id = (0, uuid_1.generateUuid)();
            this._sessions.set(id, session);
            return id;
        }
        async stopProfiling(sessionId) {
            const session = this._sessions.get(sessionId);
            if (!session) {
                throw new Error(`UNKNOWN session '${sessionId}'`);
            }
            const result = await session.stop();
            this._sessions.delete(sessionId);
            return result.profile;
        }
    }
    exports.InspectProfilingService = InspectProfilingService;
});
//# sourceMappingURL=profilingService.js.map