/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/standalone/common/standaloneTheme", "vs/editor/common/standaloneStrings", "vs/platform/theme/common/theme"], function (require, exports, editorExtensions_1, standaloneTheme_1, standaloneStrings_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ToggleHighContrast extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.toggleHighContrast',
                label: standaloneStrings_1.ToggleHighContrastNLS.toggleHighContrast,
                alias: 'Toggle High Contrast Theme',
                precondition: undefined
            });
            this._originalThemeName = null;
        }
        run(accessor, editor) {
            const standaloneThemeService = accessor.get(standaloneTheme_1.IStandaloneThemeService);
            if ((0, theme_1.isHighContrast)(standaloneThemeService.getColorTheme().type)) {
                // We must toggle back to the integrator's theme
                standaloneThemeService.setTheme(this._originalThemeName || 'vs');
                this._originalThemeName = null;
            }
            else {
                this._originalThemeName = standaloneThemeService.getColorTheme().themeName;
                standaloneThemeService.setTheme('hc-black');
            }
        }
    }
    (0, editorExtensions_1.registerEditorAction)(ToggleHighContrast);
});
//# sourceMappingURL=toggleHighContrast.js.map