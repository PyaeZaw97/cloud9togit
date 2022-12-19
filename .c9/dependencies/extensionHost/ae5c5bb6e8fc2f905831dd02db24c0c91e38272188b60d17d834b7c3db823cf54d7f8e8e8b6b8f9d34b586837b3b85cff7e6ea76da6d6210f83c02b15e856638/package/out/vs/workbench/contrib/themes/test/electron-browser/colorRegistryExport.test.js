/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry"], function (require, exports, color_1, platform_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ColorRegistry', () => {
        if (process.env.VSCODE_COLOR_REGISTRY_EXPORT) {
            test('exports', () => {
                const themingRegistry = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution);
                const colors = themingRegistry.getColors();
                const replacer = (_key, value) => value instanceof color_1.Color ? color_1.Color.Format.CSS.formatHexA(value) : value;
                console.log(`#colors:${JSON.stringify(colors, replacer)}\n`);
            });
        }
    });
});
//# sourceMappingURL=colorRegistryExport.test.js.map