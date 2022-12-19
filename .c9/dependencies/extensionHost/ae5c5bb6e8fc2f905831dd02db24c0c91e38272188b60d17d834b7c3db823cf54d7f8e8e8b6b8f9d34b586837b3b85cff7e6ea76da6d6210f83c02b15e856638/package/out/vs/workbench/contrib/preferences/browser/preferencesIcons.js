/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/nls", "vs/platform/theme/common/iconRegistry"], function (require, exports, codicons_1, nls_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.preferencesOpenSettingsIcon = exports.preferencesFilterIcon = exports.preferencesClearInputIcon = exports.settingsDiscardIcon = exports.settingsRemoveIcon = exports.settingsAddIcon = exports.settingsEditIcon = exports.keybindingsAddIcon = exports.keybindingsEditIcon = exports.keybindingsSortIcon = exports.keybindingsRecordKeysIcon = exports.settingsMoreActionIcon = exports.settingsScopeDropDownIcon = exports.settingsGroupCollapsedIcon = exports.settingsGroupExpandedIcon = void 0;
    exports.settingsGroupExpandedIcon = (0, iconRegistry_1.registerIcon)('settings-group-expanded', codicons_1.Codicon.chevronDown, (0, nls_1.localize)('settingsGroupExpandedIcon', 'Icon for an expanded section in the split JSON Settings editor.'));
    exports.settingsGroupCollapsedIcon = (0, iconRegistry_1.registerIcon)('settings-group-collapsed', codicons_1.Codicon.chevronRight, (0, nls_1.localize)('settingsGroupCollapsedIcon', 'Icon for a collapsed section in the split JSON Settings editor.'));
    exports.settingsScopeDropDownIcon = (0, iconRegistry_1.registerIcon)('settings-folder-dropdown', codicons_1.Codicon.triangleDown, (0, nls_1.localize)('settingsScopeDropDownIcon', 'Icon for the folder dropdown button in the split JSON Settings editor.'));
    exports.settingsMoreActionIcon = (0, iconRegistry_1.registerIcon)('settings-more-action', codicons_1.Codicon.gear, (0, nls_1.localize)('settingsMoreActionIcon', 'Icon for the \'more actions\' action in the Settings UI.'));
    exports.keybindingsRecordKeysIcon = (0, iconRegistry_1.registerIcon)('keybindings-record-keys', codicons_1.Codicon.recordKeys, (0, nls_1.localize)('keybindingsRecordKeysIcon', 'Icon for the \'record keys\' action in the keybinding UI.'));
    exports.keybindingsSortIcon = (0, iconRegistry_1.registerIcon)('keybindings-sort', codicons_1.Codicon.sortPrecedence, (0, nls_1.localize)('keybindingsSortIcon', 'Icon for the \'sort by precedence\' toggle in the keybinding UI.'));
    exports.keybindingsEditIcon = (0, iconRegistry_1.registerIcon)('keybindings-edit', codicons_1.Codicon.edit, (0, nls_1.localize)('keybindingsEditIcon', 'Icon for the edit action in the keybinding UI.'));
    exports.keybindingsAddIcon = (0, iconRegistry_1.registerIcon)('keybindings-add', codicons_1.Codicon.add, (0, nls_1.localize)('keybindingsAddIcon', 'Icon for the add action in the keybinding UI.'));
    exports.settingsEditIcon = (0, iconRegistry_1.registerIcon)('settings-edit', codicons_1.Codicon.edit, (0, nls_1.localize)('settingsEditIcon', 'Icon for the edit action in the Settings UI.'));
    exports.settingsAddIcon = (0, iconRegistry_1.registerIcon)('settings-add', codicons_1.Codicon.add, (0, nls_1.localize)('settingsAddIcon', 'Icon for the add action in the Settings UI.'));
    exports.settingsRemoveIcon = (0, iconRegistry_1.registerIcon)('settings-remove', codicons_1.Codicon.close, (0, nls_1.localize)('settingsRemoveIcon', 'Icon for the remove action in the Settings UI.'));
    exports.settingsDiscardIcon = (0, iconRegistry_1.registerIcon)('settings-discard', codicons_1.Codicon.discard, (0, nls_1.localize)('preferencesDiscardIcon', 'Icon for the discard action in the Settings UI.'));
    exports.preferencesClearInputIcon = (0, iconRegistry_1.registerIcon)('preferences-clear-input', codicons_1.Codicon.clearAll, (0, nls_1.localize)('preferencesClearInput', 'Icon for clear input in the Settings and keybinding UI.'));
    exports.preferencesFilterIcon = (0, iconRegistry_1.registerIcon)('preferences-filter', codicons_1.Codicon.filter, (0, nls_1.localize)('settingsFilter', 'Icon for the button that suggests filters for the Settings UI.'));
    exports.preferencesOpenSettingsIcon = (0, iconRegistry_1.registerIcon)('preferences-open-settings', codicons_1.Codicon.goToFile, (0, nls_1.localize)('preferencesOpenSettings', 'Icon for open settings commands.'));
});
//# sourceMappingURL=preferencesIcons.js.map