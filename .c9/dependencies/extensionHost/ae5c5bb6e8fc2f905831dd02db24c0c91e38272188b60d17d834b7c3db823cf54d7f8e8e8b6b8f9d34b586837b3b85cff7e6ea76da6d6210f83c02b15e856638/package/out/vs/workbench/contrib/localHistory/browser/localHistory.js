/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/codicons", "vs/base/common/platform", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/iconRegistry", "vs/base/common/async"], function (require, exports, nls_1, codicons_1, platform_1, contextkey_1, iconRegistry_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LOCAL_HISTORY_ICON_RESTORE = exports.LOCAL_HISTORY_ICON_ENTRY = exports.LOCAL_HISTORY_MENU_CONTEXT_KEY = exports.LOCAL_HISTORY_MENU_CONTEXT_VALUE = exports.LOCAL_HISTORY_DATE_FORMATTER = void 0;
    exports.LOCAL_HISTORY_DATE_FORMATTER = new async_1.IdleValue(() => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
        let formatter;
        try {
            formatter = new Intl.DateTimeFormat(platform_1.language, options);
        }
        catch (error) {
            formatter = new Intl.DateTimeFormat(undefined, options); // error can happen when language is invalid (https://github.com/microsoft/vscode/issues/147086)
        }
        return {
            format: date => formatter.format(date)
        };
    });
    exports.LOCAL_HISTORY_MENU_CONTEXT_VALUE = 'localHistory:item';
    exports.LOCAL_HISTORY_MENU_CONTEXT_KEY = contextkey_1.ContextKeyExpr.equals('timelineItem', exports.LOCAL_HISTORY_MENU_CONTEXT_VALUE);
    exports.LOCAL_HISTORY_ICON_ENTRY = (0, iconRegistry_1.registerIcon)('localHistory-icon', codicons_1.Codicon.circleOutline, (0, nls_1.localize)('localHistoryIcon', "Icon for a local history entry in the timeline view."));
    exports.LOCAL_HISTORY_ICON_RESTORE = (0, iconRegistry_1.registerIcon)('localHistory-restore', codicons_1.Codicon.check, (0, nls_1.localize)('localHistoryRestore', "Icon for restoring contents of a local history entry."));
});
//# sourceMappingURL=localHistory.js.map