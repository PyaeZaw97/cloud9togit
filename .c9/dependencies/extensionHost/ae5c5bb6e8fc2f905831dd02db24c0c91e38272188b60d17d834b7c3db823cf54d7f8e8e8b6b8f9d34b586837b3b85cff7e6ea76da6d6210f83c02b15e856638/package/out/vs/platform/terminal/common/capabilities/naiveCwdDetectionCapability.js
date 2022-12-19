/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NaiveCwdDetectionCapability = void 0;
    class NaiveCwdDetectionCapability {
        constructor(_process) {
            this._process = _process;
            this.type = 1 /* TerminalCapability.NaiveCwdDetection */;
            this._cwd = '';
            this._onDidChangeCwd = new event_1.Emitter();
            this.onDidChangeCwd = this._onDidChangeCwd.event;
        }
        async getCwd() {
            if (!this._process) {
                return Promise.resolve('');
            }
            const newCwd = await this._process.getCwd();
            if (newCwd !== this._cwd) {
                this._onDidChangeCwd.fire(newCwd);
            }
            this._cwd = newCwd;
            return this._cwd;
        }
    }
    exports.NaiveCwdDetectionCapability = NaiveCwdDetectionCapability;
});
//# sourceMappingURL=naiveCwdDetectionCapability.js.map