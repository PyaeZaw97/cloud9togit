/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform"], function (require, exports, async_1, lifecycle_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalAutoResponder = void 0;
    /**
     * Tracks a terminal process's data stream and responds immediately when a matching string is
     * received. This is done in a low overhead way and is ideally run on the same process as the
     * where the process is handled to minimize latency.
     */
    class TerminalAutoResponder extends lifecycle_1.Disposable {
        constructor(proc, matchWord, response) {
            super();
            this._pointer = 0;
            this._paused = false;
            /**
             * Each reply is throttled by a second to avoid resource starvation and responding to screen
             * reprints on Winodws.
             */
            this._throttled = false;
            this._register(proc.onProcessData(e => {
                if (this._paused || this._throttled) {
                    return;
                }
                const data = typeof e === 'string' ? e : e.data;
                for (let i = 0; i < data.length; i++) {
                    if (data[i] === matchWord[this._pointer]) {
                        this._pointer++;
                    }
                    else {
                        this._reset();
                    }
                    // Auto reply and reset
                    if (this._pointer === matchWord.length) {
                        proc.input(response);
                        this._throttled = true;
                        (0, async_1.timeout)(1000).then(() => this._throttled = false);
                        this._reset();
                    }
                }
            }));
        }
        _reset() {
            this._pointer = 0;
        }
        /**
         * No auto response will happen after a resize on Windows in case the resize is a result of
         * reprinting the screen.
         */
        handleResize() {
            if (platform_1.isWindows) {
                this._paused = true;
            }
        }
        handleInput() {
            this._paused = false;
        }
    }
    exports.TerminalAutoResponder = TerminalAutoResponder;
});
//# sourceMappingURL=terminalAutoResponder.js.map