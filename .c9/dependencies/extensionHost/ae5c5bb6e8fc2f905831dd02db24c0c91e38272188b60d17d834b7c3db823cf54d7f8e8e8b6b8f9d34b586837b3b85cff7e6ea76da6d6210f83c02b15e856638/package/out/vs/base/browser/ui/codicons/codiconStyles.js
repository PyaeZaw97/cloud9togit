/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/css!./codicon/codicon", "vs/css!./codicon/codicon-modifiers"], function (require, exports, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.formatRule = void 0;
    function formatRule(c) {
        let def = c.definition;
        while (def instanceof codicons_1.Codicon) {
            def = def.definition;
        }
        return `.codicon-${c.id}:before { content: '${def.fontCharacter}'; }`;
    }
    exports.formatRule = formatRule;
});
//# sourceMappingURL=codiconStyles.js.map