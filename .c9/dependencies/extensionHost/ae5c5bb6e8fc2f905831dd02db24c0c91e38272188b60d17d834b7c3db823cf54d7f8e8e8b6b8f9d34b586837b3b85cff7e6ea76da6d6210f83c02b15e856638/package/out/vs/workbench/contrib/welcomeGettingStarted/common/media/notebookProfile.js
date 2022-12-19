/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/nls"], function (require, exports, strings_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const profileArg = (profile) => encodeURIComponent(JSON.stringify({ profile }));
    const imageSize = 400;
    exports.default = () => `
<vertically-centered>
<checklist>
	<checkbox on-checked="command:notebook.setProfile?${profileArg('default')}" checked-on="config.notebook.cellFocusIndicator == 'border' && config.notebook.insertToolbarLocation == 'both' && config.notebook.globalToolbar == false && config.notebook.compactView == true && config.notebook.showCellStatusBar == 'visible'">
		<img width="${imageSize}" src="./notebookThemes/default.png"/>
		${(0, strings_1.escape)((0, nls_1.localize)('default', "Default"))}
	</checkbox>
	<checkbox on-checked="command:notebook.setProfile?${profileArg('jupyter')}" checked-on="config.notebook.cellFocusIndicator == 'gutter' && config.notebook.insertToolbarLocation == 'notebookToolbar' && config.notebook.globalToolbar == true && config.notebook.compactView == true  && config.notebook.showCellStatusBar == 'visible'">
		<img width="${imageSize}" src="./notebookThemes/jupyter.png"/>
		${(0, strings_1.escape)((0, nls_1.localize)('jupyter', "Jupyter"))}
	</checkbox>
	<checkbox on-checked="command:notebook.setProfile?${profileArg('colab')}" checked-on="config.notebook.cellFocusIndicator == 'border' && config.notebook.insertToolbarLocation == 'betweenCells' && config.notebook.globalToolbar == false && config.notebook.compactView == false && config.notebook.showCellStatusBar == 'hidden'">
		<img width="${imageSize}" src="./notebookThemes/colab.png"/>
		${(0, strings_1.escape)((0, nls_1.localize)('colab', "Colab"))}
	</checkbox>
</checklist>
</vertically-centered>
`;
});
//# sourceMappingURL=notebookProfile.js.map