/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/nls"], function (require, exports, strings_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = () => `
<checklist>
	<checkbox when-checked="setTheme:Default Light+" checked-on="config.workbench.colorTheme == 'Default Light+'">
		<img width="150" src="./light.png"/>
		${(0, strings_1.escape)((0, nls_1.localize)('light', "Light"))}
	</checkbox>
	<checkbox when-checked="setTheme:Default Dark+" checked-on="config.workbench.colorTheme == 'Default Dark+'">
		<img width="150" src="./dark.png"/>
		${(0, strings_1.escape)((0, nls_1.localize)('dark', "Dark"))}
	</checkbox>
	<checkbox when-checked="setTheme:Default High Contrast" checked-on="config.workbench.colorTheme == 'Default High Contrast'">
		<img width="150" src="./dark-hc.png"/>
		${(0, strings_1.escape)((0, nls_1.localize)('HighContrast', "Dark High Contrast"))}
	</checkbox>
	<checkbox when-checked="setTheme:Default High Contrast Light" checked-on="config.workbench.colorTheme == 'Default High Contrast Light'">
		<img width="150" src="./light-hc.png"/>
		${(0, strings_1.escape)((0, nls_1.localize)('HighContrastLight', "Light High Contrast"))}
	</checkbox>
</checklist>
<checkbox when-checked="command:workbench.action.selectTheme" checked-on="false">
	${(0, strings_1.escape)((0, nls_1.localize)('seeMore', "See More Themes..."))}
</checkbox>
`;
});
//# sourceMappingURL=theme_picker.js.map