/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewContext = void 0;
    class ViewContext {
        constructor(notebookOptions, eventDispatcher) {
            this.notebookOptions = notebookOptions;
            this.eventDispatcher = eventDispatcher;
        }
    }
    exports.ViewContext = ViewContext;
});
//# sourceMappingURL=viewContext.js.map