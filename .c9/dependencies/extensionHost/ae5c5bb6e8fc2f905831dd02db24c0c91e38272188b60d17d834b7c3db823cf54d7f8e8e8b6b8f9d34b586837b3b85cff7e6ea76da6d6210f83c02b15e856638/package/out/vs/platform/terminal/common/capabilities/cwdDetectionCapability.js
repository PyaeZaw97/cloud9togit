/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CwdDetectionCapability = void 0;
    class CwdDetectionCapability {
        constructor() {
            this.type = 0 /* TerminalCapability.CwdDetection */;
            this._cwd = '';
            this._cwds = new Map();
            this._onDidChangeCwd = new event_1.Emitter();
            this.onDidChangeCwd = this._onDidChangeCwd.event;
        }
        /**
         * Gets the list of cwds seen in this session in order of last accessed.
         */
        get cwds() {
            return Array.from(this._cwds.keys());
        }
        getCwd() {
            return this._cwd;
        }
        updateCwd(cwd) {
            const didChange = this._cwd !== cwd;
            this._cwd = cwd;
            const count = this._cwds.get(this._cwd) || 0;
            this._cwds.delete(this._cwd); // Delete to put it at the bottom of the iterable
            this._cwds.set(this._cwd, count + 1);
            if (didChange) {
                this._onDidChangeCwd.fire(cwd);
            }
        }
    }
    exports.CwdDetectionCapability = CwdDetectionCapability;
});
//# sourceMappingURL=cwdDetectionCapability.js.map