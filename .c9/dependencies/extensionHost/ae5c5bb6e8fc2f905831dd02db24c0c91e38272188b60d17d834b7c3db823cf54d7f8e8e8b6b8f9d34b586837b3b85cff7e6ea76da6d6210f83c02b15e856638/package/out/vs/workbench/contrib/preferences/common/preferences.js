/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey"], function (require, exports, instantiation_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ENABLE_LANGUAGE_FILTER = exports.KEYBOARD_LAYOUT_OPEN_PICKER = exports.REQUIRE_TRUSTED_WORKSPACE_SETTING_TAG = exports.WORKSPACE_TRUST_SETTING_TAG = exports.GENERAL_TAG_SETTING_TAG = exports.LANGUAGE_SETTING_TAG = exports.ID_SETTING_TAG = exports.FEATURE_SETTING_TAG = exports.EXTENSION_SETTING_TAG = exports.MODIFIED_SETTING_TAG = exports.KEYBINDINGS_EDITOR_SHOW_EXTENSION_KEYBINDINGS = exports.KEYBINDINGS_EDITOR_SHOW_USER_KEYBINDINGS = exports.KEYBINDINGS_EDITOR_SHOW_DEFAULT_KEYBINDINGS = exports.KEYBINDINGS_EDITOR_COMMAND_FOCUS_KEYBINDINGS = exports.KEYBINDINGS_EDITOR_COMMAND_SHOW_SIMILAR = exports.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND_TITLE = exports.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND = exports.KEYBINDINGS_EDITOR_COMMAND_COPY = exports.KEYBINDINGS_EDITOR_COMMAND_RESET = exports.KEYBINDINGS_EDITOR_COMMAND_REMOVE = exports.KEYBINDINGS_EDITOR_COMMAND_DEFINE_WHEN = exports.KEYBINDINGS_EDITOR_COMMAND_ADD = exports.KEYBINDINGS_EDITOR_COMMAND_DEFINE = exports.KEYBINDINGS_EDITOR_COMMAND_SORTBY_PRECEDENCE = exports.KEYBINDINGS_EDITOR_COMMAND_RECORD_SEARCH_KEYS = exports.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS = exports.KEYBINDINGS_EDITOR_COMMAND_SEARCH = exports.CONTEXT_WHEN_FOCUS = exports.CONTEXT_KEYBINDING_FOCUS = exports.CONTEXT_KEYBINDINGS_SEARCH_FOCUS = exports.CONTEXT_KEYBINDINGS_EDITOR = exports.CONTEXT_SETTINGS_ROW_FOCUS = exports.CONTEXT_TOC_ROW_FOCUS = exports.CONTEXT_SETTINGS_SEARCH_FOCUS = exports.CONTEXT_SETTINGS_JSON_EDITOR = exports.CONTEXT_SETTINGS_EDITOR = exports.SETTINGS_EDITOR_COMMAND_SUGGEST_FILTERS = exports.SETTINGS_EDITOR_COMMAND_SHOW_CONTEXT_MENU = exports.SETTINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS = exports.IPreferencesSearchService = void 0;
    exports.IPreferencesSearchService = (0, instantiation_1.createDecorator)('preferencesSearchService');
    exports.SETTINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS = 'settings.action.clearSearchResults';
    exports.SETTINGS_EDITOR_COMMAND_SHOW_CONTEXT_MENU = 'settings.action.showContextMenu';
    exports.SETTINGS_EDITOR_COMMAND_SUGGEST_FILTERS = 'settings.action.suggestFilters';
    exports.CONTEXT_SETTINGS_EDITOR = new contextkey_1.RawContextKey('inSettingsEditor', false);
    exports.CONTEXT_SETTINGS_JSON_EDITOR = new contextkey_1.RawContextKey('inSettingsJSONEditor', false);
    exports.CONTEXT_SETTINGS_SEARCH_FOCUS = new contextkey_1.RawContextKey('inSettingsSearch', false);
    exports.CONTEXT_TOC_ROW_FOCUS = new contextkey_1.RawContextKey('settingsTocRowFocus', false);
    exports.CONTEXT_SETTINGS_ROW_FOCUS = new contextkey_1.RawContextKey('settingRowFocus', false);
    exports.CONTEXT_KEYBINDINGS_EDITOR = new contextkey_1.RawContextKey('inKeybindings', false);
    exports.CONTEXT_KEYBINDINGS_SEARCH_FOCUS = new contextkey_1.RawContextKey('inKeybindingsSearch', false);
    exports.CONTEXT_KEYBINDING_FOCUS = new contextkey_1.RawContextKey('keybindingFocus', false);
    exports.CONTEXT_WHEN_FOCUS = new contextkey_1.RawContextKey('whenFocus', false);
    exports.KEYBINDINGS_EDITOR_COMMAND_SEARCH = 'keybindings.editor.searchKeybindings';
    exports.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS = 'keybindings.editor.clearSearchResults';
    exports.KEYBINDINGS_EDITOR_COMMAND_RECORD_SEARCH_KEYS = 'keybindings.editor.recordSearchKeys';
    exports.KEYBINDINGS_EDITOR_COMMAND_SORTBY_PRECEDENCE = 'keybindings.editor.toggleSortByPrecedence';
    exports.KEYBINDINGS_EDITOR_COMMAND_DEFINE = 'keybindings.editor.defineKeybinding';
    exports.KEYBINDINGS_EDITOR_COMMAND_ADD = 'keybindings.editor.addKeybinding';
    exports.KEYBINDINGS_EDITOR_COMMAND_DEFINE_WHEN = 'keybindings.editor.defineWhenExpression';
    exports.KEYBINDINGS_EDITOR_COMMAND_REMOVE = 'keybindings.editor.removeKeybinding';
    exports.KEYBINDINGS_EDITOR_COMMAND_RESET = 'keybindings.editor.resetKeybinding';
    exports.KEYBINDINGS_EDITOR_COMMAND_COPY = 'keybindings.editor.copyKeybindingEntry';
    exports.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND = 'keybindings.editor.copyCommandKeybindingEntry';
    exports.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND_TITLE = 'keybindings.editor.copyCommandTitle';
    exports.KEYBINDINGS_EDITOR_COMMAND_SHOW_SIMILAR = 'keybindings.editor.showConflicts';
    exports.KEYBINDINGS_EDITOR_COMMAND_FOCUS_KEYBINDINGS = 'keybindings.editor.focusKeybindings';
    exports.KEYBINDINGS_EDITOR_SHOW_DEFAULT_KEYBINDINGS = 'keybindings.editor.showDefaultKeybindings';
    exports.KEYBINDINGS_EDITOR_SHOW_USER_KEYBINDINGS = 'keybindings.editor.showUserKeybindings';
    exports.KEYBINDINGS_EDITOR_SHOW_EXTENSION_KEYBINDINGS = 'keybindings.editor.showExtensionKeybindings';
    exports.MODIFIED_SETTING_TAG = 'modified';
    exports.EXTENSION_SETTING_TAG = 'ext:';
    exports.FEATURE_SETTING_TAG = 'feature:';
    exports.ID_SETTING_TAG = 'id:';
    exports.LANGUAGE_SETTING_TAG = 'lang:';
    exports.GENERAL_TAG_SETTING_TAG = 'tag:';
    exports.WORKSPACE_TRUST_SETTING_TAG = 'workspaceTrust';
    exports.REQUIRE_TRUSTED_WORKSPACE_SETTING_TAG = 'requireTrustedWorkspace';
    exports.KEYBOARD_LAYOUT_OPEN_PICKER = 'workbench.action.openKeyboardLayoutPicker';
    exports.ENABLE_LANGUAGE_FILTER = true;
});
//# sourceMappingURL=preferences.js.map