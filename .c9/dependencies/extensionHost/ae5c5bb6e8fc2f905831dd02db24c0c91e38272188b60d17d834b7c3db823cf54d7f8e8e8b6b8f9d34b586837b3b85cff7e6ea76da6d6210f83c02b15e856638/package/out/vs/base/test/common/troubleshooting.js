/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.endLoggingFS = exports.beginLoggingFS = exports.endTrackingDisposables = exports.beginTrackingDisposables = void 0;
    class DisposableTracker {
        constructor() {
            this.allDisposables = [];
        }
        trackDisposable(x) {
            this.allDisposables.push([x, new Error().stack]);
        }
        setParent(child, parent) {
            for (let idx = 0; idx < this.allDisposables.length; idx++) {
                if (this.allDisposables[idx][0] === child) {
                    this.allDisposables.splice(idx, 1);
                    return;
                }
            }
        }
        markAsDisposed(x) {
            for (let idx = 0; idx < this.allDisposables.length; idx++) {
                if (this.allDisposables[idx][0] === x) {
                    this.allDisposables.splice(idx, 1);
                    return;
                }
            }
        }
        markAsSingleton(disposable) {
            // noop
        }
    }
    let currentTracker = null;
    function beginTrackingDisposables() {
        currentTracker = new DisposableTracker();
        (0, lifecycle_1.setDisposableTracker)(currentTracker);
    }
    exports.beginTrackingDisposables = beginTrackingDisposables;
    function endTrackingDisposables() {
        if (currentTracker) {
            (0, lifecycle_1.setDisposableTracker)(null);
            console.log(currentTracker.allDisposables.map(e => `${e[0]}\n${e[1]}`).join('\n\n'));
            currentTracker = null;
        }
    }
    exports.endTrackingDisposables = endTrackingDisposables;
    function beginLoggingFS(withStacks = false) {
        if (self.beginLoggingFS) {
            self.beginLoggingFS(withStacks);
        }
    }
    exports.beginLoggingFS = beginLoggingFS;
    function endLoggingFS() {
        if (self.endLoggingFS) {
            self.endLoggingFS();
        }
    }
    exports.endLoggingFS = endLoggingFS;
});
//# sourceMappingURL=troubleshooting.js.map