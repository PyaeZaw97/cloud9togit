/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/driver/browser/driver"], function (require, exports, driver_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerWindowDriver = void 0;
    class NativeWindowDriver extends driver_1.BrowserWindowDriver {
        constructor(helper) {
            super();
            this.helper = helper;
        }
        exitApplication() {
            return this.helper.exitApplication();
        }
    }
    function registerWindowDriver(helper) {
        Object.assign(window, { driver: new NativeWindowDriver(helper) });
    }
    exports.registerWindowDriver = registerWindowDriver;
});
//# sourceMappingURL=driver.js.map