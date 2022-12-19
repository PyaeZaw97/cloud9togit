/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/rgba", "vs/editor/common/languages"], function (require, exports, event_1, lifecycle_1, rgba_1, languages_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MinimapTokensColorTracker = void 0;
    class MinimapTokensColorTracker extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._updateColorMap();
            this._register(languages_1.TokenizationRegistry.onDidChange(e => {
                if (e.changedColorMap) {
                    this._updateColorMap();
                }
            }));
        }
        static getInstance() {
            if (!this._INSTANCE) {
                this._INSTANCE = (0, lifecycle_1.markAsSingleton)(new MinimapTokensColorTracker());
            }
            return this._INSTANCE;
        }
        _updateColorMap() {
            const colorMap = languages_1.TokenizationRegistry.getColorMap();
            if (!colorMap) {
                this._colors = [rgba_1.RGBA8.Empty];
                this._backgroundIsLight = true;
                return;
            }
            this._colors = [rgba_1.RGBA8.Empty];
            for (let colorId = 1; colorId < colorMap.length; colorId++) {
                const source = colorMap[colorId].rgba;
                // Use a VM friendly data-type
                this._colors[colorId] = new rgba_1.RGBA8(source.r, source.g, source.b, Math.round(source.a * 255));
            }
            const backgroundLuminosity = colorMap[2 /* ColorId.DefaultBackground */].getRelativeLuminance();
            this._backgroundIsLight = backgroundLuminosity >= 0.5;
            this._onDidChange.fire(undefined);
        }
        getColor(colorId) {
            if (colorId < 1 || colorId >= this._colors.length) {
                // background color (basically invisible)
                colorId = 2 /* ColorId.DefaultBackground */;
            }
            return this._colors[colorId];
        }
        backgroundIsLight() {
            return this._backgroundIsLight;
        }
    }
    exports.MinimapTokensColorTracker = MinimapTokensColorTracker;
    MinimapTokensColorTracker._INSTANCE = null;
});
//# sourceMappingURL=minimapTokensColorTracker.js.map