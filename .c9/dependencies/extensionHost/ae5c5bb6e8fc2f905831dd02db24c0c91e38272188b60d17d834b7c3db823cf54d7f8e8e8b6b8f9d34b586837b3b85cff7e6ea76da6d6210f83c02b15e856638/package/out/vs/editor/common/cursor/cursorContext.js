/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CursorContext = void 0;
    class CursorContext {
        constructor(model, viewModel, coordinatesConverter, cursorConfig) {
            this._cursorContextBrand = undefined;
            this.model = model;
            this.viewModel = viewModel;
            this.coordinatesConverter = coordinatesConverter;
            this.cursorConfig = cursorConfig;
        }
    }
    exports.CursorContext = CursorContext;
});
//# sourceMappingURL=cursorContext.js.map