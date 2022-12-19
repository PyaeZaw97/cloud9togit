/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.stop = exports.stopEvent = exports.DomEmitter = void 0;
    class DomEmitter {
        constructor(element, type, useCapture) {
            const fn = (e) => this.emitter.fire(e);
            this.emitter = new event_1.Emitter({
                onFirstListenerAdd: () => element.addEventListener(type, fn, useCapture),
                onLastListenerRemove: () => element.removeEventListener(type, fn, useCapture)
            });
        }
        get event() {
            return this.emitter.event;
        }
        dispose() {
            this.emitter.dispose();
        }
    }
    exports.DomEmitter = DomEmitter;
    function stopEvent(event) {
        event.preventDefault();
        event.stopPropagation();
        return event;
    }
    exports.stopEvent = stopEvent;
    function stop(event) {
        return event_1.Event.map(event, stopEvent);
    }
    exports.stop = stop;
});
//# sourceMappingURL=event.js.map