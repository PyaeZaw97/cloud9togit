/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async"], function (require, exports, dom_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerZIndex = exports.ZIndex = void 0;
    var ZIndex;
    (function (ZIndex) {
        ZIndex[ZIndex["Base"] = 0] = "Base";
        ZIndex[ZIndex["Sash"] = 35] = "Sash";
        ZIndex[ZIndex["SuggestWidget"] = 40] = "SuggestWidget";
        ZIndex[ZIndex["Hover"] = 50] = "Hover";
        ZIndex[ZIndex["DragImage"] = 1000] = "DragImage";
        ZIndex[ZIndex["MenubarMenuItemsHolder"] = 2000] = "MenubarMenuItemsHolder";
        ZIndex[ZIndex["ContextView"] = 2500] = "ContextView";
        ZIndex[ZIndex["ModalDialog"] = 2600] = "ModalDialog";
        ZIndex[ZIndex["PaneDropOverlay"] = 10000] = "PaneDropOverlay";
    })(ZIndex = exports.ZIndex || (exports.ZIndex = {}));
    const ZIndexValues = Object.keys(ZIndex).filter(key => !isNaN(Number(key))).map(key => Number(key)).sort((a, b) => b - a);
    function findBase(z) {
        for (const zi of ZIndexValues) {
            if (z >= zi) {
                return zi;
            }
        }
        return -1;
    }
    class ZIndexRegistry {
        constructor() {
            this.styleSheet = (0, dom_1.createStyleSheet)();
            this.zIndexMap = new Map();
            this.scheduler = new async_1.RunOnceScheduler(() => this.updateStyleElement(), 200);
        }
        registerZIndex(relativeLayer, z, name) {
            if (this.zIndexMap.get(name)) {
                throw new Error(`z-index with name ${name} has already been registered.`);
            }
            const proposedZValue = relativeLayer + z;
            if (findBase(proposedZValue) !== relativeLayer) {
                throw new Error(`Relative layer: ${relativeLayer} + z-index: ${z} exceeds next layer ${proposedZValue}.`);
            }
            this.zIndexMap.set(name, proposedZValue);
            this.scheduler.schedule();
            return this.getVarName(name);
        }
        getVarName(name) {
            return `--z-index-${name}`;
        }
        updateStyleElement() {
            (0, dom_1.clearNode)(this.styleSheet);
            let ruleBuilder = '';
            this.zIndexMap.forEach((zIndex, name) => {
                ruleBuilder += `${this.getVarName(name)}: ${zIndex};\n`;
            });
            (0, dom_1.createCSSRule)(':root', ruleBuilder, this.styleSheet);
        }
    }
    const zIndexRegistry = new ZIndexRegistry();
    function registerZIndex(relativeLayer, z, name) {
        return zIndexRegistry.registerZIndex(relativeLayer, z, name);
    }
    exports.registerZIndex = registerZIndex;
});
//# sourceMappingURL=zIndexRegistry.js.map