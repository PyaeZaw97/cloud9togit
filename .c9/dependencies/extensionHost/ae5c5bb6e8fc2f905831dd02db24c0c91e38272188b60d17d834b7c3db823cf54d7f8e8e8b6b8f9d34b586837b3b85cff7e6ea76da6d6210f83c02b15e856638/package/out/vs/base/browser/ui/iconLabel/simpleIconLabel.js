/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabels"], function (require, exports, dom_1, iconLabels_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleIconLabel = void 0;
    class SimpleIconLabel {
        constructor(_container) {
            this._container = _container;
        }
        set text(text) {
            (0, dom_1.reset)(this._container, ...(0, iconLabels_1.renderLabelWithIcons)(text !== null && text !== void 0 ? text : ''));
        }
        set title(title) {
            this._container.title = title;
        }
    }
    exports.SimpleIconLabel = SimpleIconLabel;
});
//# sourceMappingURL=simpleIconLabel.js.map