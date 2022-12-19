/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/editor/contrib/suggest/browser/suggestController", "vs/nls", "vs/platform/contextview/browser/contextView", "vs/workbench/contrib/preferences/common/preferences"], function (require, exports, dropdownActionViewItem_1, suggestController_1, nls_1, contextView_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingsSearchFilterDropdownMenuActionViewItem = void 0;
    let SettingsSearchFilterDropdownMenuActionViewItem = class SettingsSearchFilterDropdownMenuActionViewItem extends dropdownActionViewItem_1.DropdownMenuActionViewItem {
        constructor(action, actionRunner, searchWidget, contextMenuService) {
            super(action, { getActions: () => this.getActions() }, contextMenuService, {
                actionRunner,
                classNames: action.class,
                anchorAlignmentProvider: () => 1 /* AnchorAlignment.RIGHT */,
                menuAsChild: true
            });
            this.searchWidget = searchWidget;
            this.suggestController = suggestController_1.SuggestController.get(this.searchWidget.inputWidget);
        }
        render(container) {
            super.render(container);
        }
        doSearchWidgetAction(queryToAppend, triggerSuggest) {
            this.searchWidget.setValue(this.searchWidget.getValue().trimEnd() + ' ' + queryToAppend);
            this.searchWidget.focus();
            if (triggerSuggest && this.suggestController) {
                this.suggestController.triggerSuggest();
            }
        }
        /**
         * The created action appends a query to the search widget search string. It optionally triggers suggestions.
         */
        createAction(id, label, tooltip, queryToAppend, triggerSuggest) {
            return {
                id,
                label,
                tooltip,
                class: undefined,
                enabled: true,
                checked: false,
                run: () => { this.doSearchWidgetAction(queryToAppend, triggerSuggest); },
                dispose: () => { }
            };
        }
        /**
         * The created action appends a query to the search widget search string, if the query does not exist.
         * Otherwise, it removes the query from the search widget search string.
         * The action does not trigger suggestions after adding or removing the query.
         */
        createToggleAction(id, label, tooltip, queryToAppend) {
            const splitCurrentQuery = this.searchWidget.getValue().split(' ');
            const queryContainsQueryToAppend = splitCurrentQuery.includes(queryToAppend);
            return {
                id,
                label,
                tooltip,
                class: undefined,
                enabled: true,
                checked: queryContainsQueryToAppend,
                run: () => {
                    if (!queryContainsQueryToAppend) {
                        const trimmedCurrentQuery = this.searchWidget.getValue().trimEnd();
                        const newQuery = trimmedCurrentQuery ? trimmedCurrentQuery + ' ' + queryToAppend : queryToAppend;
                        this.searchWidget.setValue(newQuery);
                    }
                    else {
                        const queryWithRemovedTags = this.searchWidget.getValue().split(' ')
                            .filter(word => word !== queryToAppend).join(' ');
                        this.searchWidget.setValue(queryWithRemovedTags);
                    }
                    this.searchWidget.focus();
                },
                dispose: () => { }
            };
        }
        getActions() {
            return [
                this.createToggleAction('modifiedSettingsSearch', (0, nls_1.localize)('modifiedSettingsSearch', "Modified"), (0, nls_1.localize)('modifiedSettingsSearchTooltip', "Add or remove modified settings filter"), `@${preferences_1.MODIFIED_SETTING_TAG}`),
                this.createAction('extSettingsSearch', (0, nls_1.localize)('extSettingsSearch', "Extension ID..."), (0, nls_1.localize)('extSettingsSearchTooltip', "Add extension ID filter"), `@${preferences_1.EXTENSION_SETTING_TAG}`, true),
                this.createAction('featuresSettingsSearch', (0, nls_1.localize)('featureSettingsSearch', "Feature..."), (0, nls_1.localize)('featureSettingsSearchTooltip', "Add feature filter"), `@${preferences_1.FEATURE_SETTING_TAG}`, true),
                this.createAction('tagSettingsSearch', (0, nls_1.localize)('tagSettingsSearch', "Tag..."), (0, nls_1.localize)('tagSettingsSearchTooltip', "Add tag filter"), `@${preferences_1.GENERAL_TAG_SETTING_TAG}`, true),
                this.createAction('langSettingsSearch', (0, nls_1.localize)('langSettingsSearch', "Language..."), (0, nls_1.localize)('langSettingsSearchTooltip', "Add language ID filter"), `@${preferences_1.LANGUAGE_SETTING_TAG}`, true),
                this.createToggleAction('onlineSettingsSearch', (0, nls_1.localize)('onlineSettingsSearch', "Online services"), (0, nls_1.localize)('onlineSettingsSearchTooltip', "Show settings for online services"), '@tag:usesOnlineServices')
            ];
        }
    };
    SettingsSearchFilterDropdownMenuActionViewItem = __decorate([
        __param(3, contextView_1.IContextMenuService)
    ], SettingsSearchFilterDropdownMenuActionViewItem);
    exports.SettingsSearchFilterDropdownMenuActionViewItem = SettingsSearchFilterDropdownMenuActionViewItem;
});
//# sourceMappingURL=settingsSearchMenu.js.map