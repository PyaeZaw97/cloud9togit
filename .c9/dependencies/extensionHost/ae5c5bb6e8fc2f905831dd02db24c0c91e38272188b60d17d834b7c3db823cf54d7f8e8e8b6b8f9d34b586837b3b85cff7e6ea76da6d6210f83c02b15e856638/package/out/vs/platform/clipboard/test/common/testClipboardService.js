/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestClipboardService = void 0;
    class TestClipboardService {
        constructor() {
            this.text = undefined;
            this.findText = undefined;
            this.resources = undefined;
        }
        async writeText(text, type) {
            this.text = text;
        }
        async readText(type) {
            var _a;
            return (_a = this.text) !== null && _a !== void 0 ? _a : '';
        }
        async readFindText() {
            var _a;
            return (_a = this.findText) !== null && _a !== void 0 ? _a : '';
        }
        async writeFindText(text) {
            this.findText = text;
        }
        async writeResources(resources) {
            this.resources = resources;
        }
        async readResources() {
            var _a;
            return (_a = this.resources) !== null && _a !== void 0 ? _a : [];
        }
        async hasResources() {
            return Array.isArray(this.resources) && this.resources.length > 0;
        }
    }
    exports.TestClipboardService = TestClipboardService;
});
//# sourceMappingURL=testClipboardService.js.map