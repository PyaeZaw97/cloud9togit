/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/terminal/common/terminal"], function (require, exports, event_1, lifecycle_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HeartbeatService = void 0;
    class HeartbeatService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onBeat = this._register(new event_1.Emitter());
            this.onBeat = this._onBeat.event;
            const interval = setInterval(() => {
                this._onBeat.fire();
            }, terminal_1.HeartbeatConstants.BeatInterval);
            this._register((0, lifecycle_1.toDisposable)(() => clearInterval(interval)));
        }
    }
    exports.HeartbeatService = HeartbeatService;
});
//# sourceMappingURL=heartbeatService.js.map