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
define(["require", "exports", "vs/base/browser/canIUse", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/button/button", "vs/base/browser/ui/toggle/toggle", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/selectBox/selectBox", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/types", "vs/nls", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/workbench/contrib/preferences/browser/preferencesIcons", "vs/workbench/contrib/preferences/common/settingsEditorColorRegistry", "vs/css!./media/settingsWidgets"], function (require, exports, canIUse_1, DOM, actionbar_1, button_1, toggle_1, inputBox_1, selectBox_1, async_1, codicons_1, color_1, event_1, lifecycle_1, platform_1, types_1, nls_1, contextView_1, colorRegistry_1, styler_1, themeService_1, preferencesIcons_1, settingsEditorColorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObjectSettingCheckboxWidget = exports.ObjectSettingDropdownWidget = exports.ExcludeSettingWidget = exports.ListSettingWidget = exports.AbstractListSettingWidget = exports.ListSettingListModel = void 0;
    const $ = DOM.$;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const checkboxBackgroundColor = theme.getColor(settingsEditorColorRegistry_1.settingsCheckboxBackground);
        if (checkboxBackgroundColor) {
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-bool .setting-value-checkbox { background-color: ${checkboxBackgroundColor} !important; }`);
        }
        const checkboxForegroundColor = theme.getColor(settingsEditorColorRegistry_1.settingsCheckboxForeground);
        if (checkboxForegroundColor) {
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-bool .setting-value-checkbox { color: ${checkboxForegroundColor} !important; }`);
        }
        const checkboxBorderColor = theme.getColor(settingsEditorColorRegistry_1.settingsCheckboxBorder);
        if (checkboxBorderColor) {
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-bool .setting-value-checkbox { border-color: ${checkboxBorderColor} !important; }`);
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-trust-description a { color: ${link}; }`);
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-trust-description a > code { color: ${link}; }`);
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-markdown a { color: ${link}; }`);
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-markdown a > code { color: ${link}; }`);
            collector.addRule(`.monaco-select-box-dropdown-container > .select-box-details-pane > .select-box-description-markdown a { color: ${link}; }`);
            collector.addRule(`.monaco-select-box-dropdown-container > .select-box-details-pane > .select-box-description-markdown a > code { color: ${link}; }`);
            const disabledfgColor = new color_1.Color(new color_1.RGBA(link.rgba.r, link.rgba.g, link.rgba.b, 0.8));
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item.setting-item-untrusted > .setting-item-contents .setting-item-markdown a { color: ${disabledfgColor}; }`);
        }
        const activeLink = theme.getColor(colorRegistry_1.textLinkActiveForeground);
        if (activeLink) {
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-trust-description a:hover, .settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-trust-description a:active { color: ${activeLink}; }`);
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-trust-description a:hover > code, .settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-trust-description a:active > code { color: ${activeLink}; }`);
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-markdown a:hover, .settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-markdown a:active { color: ${activeLink}; }`);
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-markdown a:hover > code, .settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-markdown a:active > code { color: ${activeLink}; }`);
            collector.addRule(`.monaco-select-box-dropdown-container > .select-box-details-pane > .select-box-description-markdown a:hover, .monaco-select-box-dropdown-container > .select-box-details-pane > .select-box-description-markdown a:active { color: ${activeLink}; }`);
            collector.addRule(`.monaco-select-box-dropdown-container > .select-box-details-pane > .select-box-description-markdown a:hover > code, .monaco-select-box-dropdown-container > .select-box-details-pane > .select-box-description-markdown a:active > code { color: ${activeLink}; }`);
        }
        const headerForegroundColor = theme.getColor(settingsEditorColorRegistry_1.settingsHeaderForeground);
        if (headerForegroundColor) {
            collector.addRule(`.settings-editor > .settings-header > .settings-header-controls .settings-tabs-widget .action-label.checked { color: ${headerForegroundColor}; border-bottom-color: ${headerForegroundColor}; }`);
        }
        const foregroundColor = theme.getColor(colorRegistry_1.foreground);
        if (foregroundColor) {
            collector.addRule(`.settings-editor > .settings-header > .settings-header-controls .settings-tabs-widget .action-label { color: ${foregroundColor}; }`);
        }
        // List control
        const listHoverBackgroundColor = theme.getColor(colorRegistry_1.listHoverBackground);
        if (listHoverBackgroundColor) {
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item.setting-item-list .setting-list-row:hover { background-color: ${listHoverBackgroundColor}; }`);
        }
        const listHoverForegroundColor = theme.getColor(colorRegistry_1.listHoverForeground);
        if (listHoverForegroundColor) {
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item.setting-item-list .setting-list-row:hover { color: ${listHoverForegroundColor}; }`);
        }
        const listDropBackgroundColor = theme.getColor(colorRegistry_1.listDropBackground);
        if (listDropBackgroundColor) {
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item.setting-item-list .setting-list-row.drag-hover { background-color: ${listDropBackgroundColor}; }`);
        }
        const listSelectBackgroundColor = theme.getColor(colorRegistry_1.listActiveSelectionBackground);
        if (listSelectBackgroundColor) {
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item.setting-item-list .setting-list-row.selected:focus { background-color: ${listSelectBackgroundColor}; }`);
        }
        const listInactiveSelectionBackgroundColor = theme.getColor(colorRegistry_1.listInactiveSelectionBackground);
        if (listInactiveSelectionBackgroundColor) {
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item.setting-item-list .setting-list-row.selected:not(:focus) { background-color: ${listInactiveSelectionBackgroundColor}; }`);
        }
        const listInactiveSelectionForegroundColor = theme.getColor(colorRegistry_1.listInactiveSelectionForeground);
        if (listInactiveSelectionForegroundColor) {
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item.setting-item-list .setting-list-row.selected:not(:focus) { color: ${listInactiveSelectionForegroundColor}; }`);
        }
        const listSelectForegroundColor = theme.getColor(colorRegistry_1.listActiveSelectionForeground);
        if (listSelectForegroundColor) {
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item.setting-item-list .setting-list-row.selected:focus { color: ${listSelectForegroundColor}; }`);
        }
        const codeTextForegroundColor = theme.getColor(colorRegistry_1.textPreformatForeground);
        if (codeTextForegroundColor) {
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item .setting-item-markdown code { color: ${codeTextForegroundColor} }`);
            collector.addRule(`.monaco-select-box-dropdown-container > .select-box-details-pane > .select-box-description-markdown code { color: ${codeTextForegroundColor} }`);
            const disabledfgColor = new color_1.Color(new color_1.RGBA(codeTextForegroundColor.rgba.r, codeTextForegroundColor.rgba.g, codeTextForegroundColor.rgba.b, 0.8));
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item.setting-item-untrusted > .setting-item-contents .setting-item-description .setting-item-markdown code { color: ${disabledfgColor} }`);
        }
        const modifiedItemIndicatorColor = theme.getColor(settingsEditorColorRegistry_1.modifiedItemIndicator);
        if (modifiedItemIndicatorColor) {
            collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-contents > .setting-item-modified-indicator { border-color: ${modifiedItemIndicatorColor}; }`);
        }
    });
    class ListSettingListModel {
        constructor(newItem) {
            this._dataItems = [];
            this._editKey = null;
            this._selectedIdx = null;
            this._newDataItem = newItem;
        }
        get items() {
            const items = this._dataItems.map((item, i) => {
                const editing = typeof this._editKey === 'number' && this._editKey === i;
                return Object.assign(Object.assign({}, item), { editing, selected: i === this._selectedIdx || editing });
            });
            if (this._editKey === 'create') {
                items.push(Object.assign({ editing: true, selected: true }, this._newDataItem));
            }
            return items;
        }
        setEditKey(key) {
            this._editKey = key;
        }
        setValue(listData) {
            this._dataItems = listData;
        }
        select(idx) {
            this._selectedIdx = idx;
        }
        getSelected() {
            return this._selectedIdx;
        }
        selectNext() {
            if (typeof this._selectedIdx === 'number') {
                this._selectedIdx = Math.min(this._selectedIdx + 1, this._dataItems.length - 1);
            }
            else {
                this._selectedIdx = 0;
            }
        }
        selectPrevious() {
            if (typeof this._selectedIdx === 'number') {
                this._selectedIdx = Math.max(this._selectedIdx - 1, 0);
            }
            else {
                this._selectedIdx = 0;
            }
        }
    }
    exports.ListSettingListModel = ListSettingListModel;
    let AbstractListSettingWidget = class AbstractListSettingWidget extends lifecycle_1.Disposable {
        constructor(container, themeService, contextViewService) {
            super();
            this.container = container;
            this.themeService = themeService;
            this.contextViewService = contextViewService;
            this.rowElements = [];
            this._onDidChangeList = this._register(new event_1.Emitter());
            this.model = new ListSettingListModel(this.getEmptyItem());
            this.listDisposables = this._register(new lifecycle_1.DisposableStore());
            this.onDidChangeList = this._onDidChangeList.event;
            this.listElement = DOM.append(container, $('div'));
            this.listElement.setAttribute('role', 'list');
            this.getContainerClasses().forEach(c => this.listElement.classList.add(c));
            this.listElement.setAttribute('tabindex', '0');
            DOM.append(container, this.renderAddButton());
            this.renderList();
            this._register(DOM.addDisposableListener(this.listElement, DOM.EventType.POINTER_DOWN, e => this.onListClick(e)));
            this._register(DOM.addDisposableListener(this.listElement, DOM.EventType.DBLCLICK, e => this.onListDoubleClick(e)));
            this._register(DOM.addStandardDisposableListener(this.listElement, 'keydown', (e) => {
                if (e.equals(16 /* KeyCode.UpArrow */)) {
                    this.selectPreviousRow();
                }
                else if (e.equals(18 /* KeyCode.DownArrow */)) {
                    this.selectNextRow();
                }
                else {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
            }));
        }
        get domNode() {
            return this.listElement;
        }
        get items() {
            return this.model.items;
        }
        get inReadMode() {
            return this.model.items.every(item => !item.editing);
        }
        setValue(listData) {
            this.model.setValue(listData);
            this.renderList();
        }
        renderHeader() {
            return;
        }
        isAddButtonVisible() {
            return true;
        }
        renderList() {
            const focused = DOM.isAncestor(document.activeElement, this.listElement);
            DOM.clearNode(this.listElement);
            this.listDisposables.clear();
            const newMode = this.model.items.some(item => !!(item.editing && this.isItemNew(item)));
            this.container.classList.toggle('setting-list-hide-add-button', !this.isAddButtonVisible() || newMode);
            const header = this.renderHeader();
            const ITEM_HEIGHT = 24;
            let listHeight = ITEM_HEIGHT * this.model.items.length;
            if (header) {
                listHeight += ITEM_HEIGHT;
                this.listElement.appendChild(header);
            }
            this.rowElements = this.model.items.map((item, i) => this.renderDataOrEditItem(item, i, focused));
            this.rowElements.forEach(rowElement => this.listElement.appendChild(rowElement));
            this.listElement.style.height = listHeight + 'px';
        }
        createBasicSelectBox(value) {
            const selectBoxOptions = value.options.map(({ value, description }) => ({ text: value, description }));
            const selected = value.options.findIndex(option => value.data === option.value);
            const selectBox = new selectBox_1.SelectBox(selectBoxOptions, selected, this.contextViewService, undefined, {
                useCustomDrawn: !(platform_1.isIOS && canIUse_1.BrowserFeatures.pointerEvents)
            });
            this.listDisposables.add((0, styler_1.attachSelectBoxStyler)(selectBox, this.themeService, {
                selectBackground: settingsEditorColorRegistry_1.settingsSelectBackground,
                selectForeground: settingsEditorColorRegistry_1.settingsSelectForeground,
                selectBorder: settingsEditorColorRegistry_1.settingsSelectBorder,
                selectListBorder: settingsEditorColorRegistry_1.settingsSelectListBorder
            }));
            return selectBox;
        }
        editSetting(idx) {
            this.model.setEditKey(idx);
            this.renderList();
        }
        cancelEdit() {
            this.model.setEditKey('none');
            this.renderList();
        }
        handleItemChange(originalItem, changedItem, idx) {
            this.model.setEditKey('none');
            this._onDidChangeList.fire({
                originalItem,
                item: changedItem,
                targetIndex: idx,
            });
            this.renderList();
        }
        renderDataOrEditItem(item, idx, listFocused) {
            const rowElement = item.editing ?
                this.renderEdit(item, idx) :
                this.renderDataItem(item, idx, listFocused);
            rowElement.setAttribute('role', 'listitem');
            return rowElement;
        }
        renderDataItem(item, idx, listFocused) {
            const rowElementGroup = this.renderItem(item, idx);
            const rowElement = rowElementGroup.rowElement;
            rowElement.setAttribute('data-index', idx + '');
            rowElement.setAttribute('tabindex', item.selected ? '0' : '-1');
            rowElement.classList.toggle('selected', item.selected);
            const actionBar = new actionbar_1.ActionBar(rowElement);
            this.listDisposables.add(actionBar);
            actionBar.push(this.getActionsForItem(item, idx), { icon: true, label: true });
            this.addTooltipsToRow(rowElementGroup, item);
            if (item.selected && listFocused) {
                this.listDisposables.add((0, async_1.disposableTimeout)(() => rowElement.focus()));
            }
            return rowElement;
        }
        renderAddButton() {
            const rowElement = $('.setting-list-new-row');
            const startAddButton = this._register(new button_1.Button(rowElement));
            startAddButton.label = this.getLocalizedStrings().addButtonLabel;
            startAddButton.element.classList.add('setting-list-addButton');
            this._register((0, styler_1.attachButtonStyler)(startAddButton, this.themeService));
            this._register(startAddButton.onDidClick(() => {
                this.model.setEditKey('create');
                this.renderList();
            }));
            return rowElement;
        }
        onListClick(e) {
            const targetIdx = this.getClickedItemIndex(e);
            if (targetIdx < 0) {
                return;
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            if (this.model.getSelected() === targetIdx) {
                return;
            }
            this.selectRow(targetIdx);
        }
        onListDoubleClick(e) {
            const targetIdx = this.getClickedItemIndex(e);
            if (targetIdx < 0) {
                return;
            }
            const item = this.model.items[targetIdx];
            if (item) {
                this.editSetting(targetIdx);
                e.preventDefault();
                e.stopPropagation();
            }
        }
        getClickedItemIndex(e) {
            if (!e.target) {
                return -1;
            }
            const actionbar = DOM.findParentWithClass(e.target, 'monaco-action-bar');
            if (actionbar) {
                // Don't handle doubleclicks inside the action bar
                return -1;
            }
            const element = DOM.findParentWithClass(e.target, 'setting-list-row');
            if (!element) {
                return -1;
            }
            const targetIdxStr = element.getAttribute('data-index');
            if (!targetIdxStr) {
                return -1;
            }
            const targetIdx = parseInt(targetIdxStr);
            return targetIdx;
        }
        selectRow(idx) {
            this.model.select(idx);
            this.rowElements.forEach(row => row.classList.remove('selected'));
            const selectedRow = this.rowElements[this.model.getSelected()];
            selectedRow.classList.add('selected');
            selectedRow.focus();
        }
        selectNextRow() {
            this.model.selectNext();
            this.selectRow(this.model.getSelected());
        }
        selectPreviousRow() {
            this.model.selectPrevious();
            this.selectRow(this.model.getSelected());
        }
    };
    AbstractListSettingWidget = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, contextView_1.IContextViewService)
    ], AbstractListSettingWidget);
    exports.AbstractListSettingWidget = AbstractListSettingWidget;
    class ListSettingWidget extends AbstractListSettingWidget {
        constructor() {
            super(...arguments);
            this.showAddButton = true;
        }
        setValue(listData, options) {
            var _a;
            this.keyValueSuggester = options === null || options === void 0 ? void 0 : options.keySuggester;
            this.showAddButton = (_a = options === null || options === void 0 ? void 0 : options.showAddButton) !== null && _a !== void 0 ? _a : true;
            super.setValue(listData);
        }
        getEmptyItem() {
            return {
                value: {
                    type: 'string',
                    data: ''
                }
            };
        }
        isAddButtonVisible() {
            return this.showAddButton;
        }
        getContainerClasses() {
            return ['setting-list-widget'];
        }
        getActionsForItem(item, idx) {
            return [
                {
                    class: themeService_1.ThemeIcon.asClassName(preferencesIcons_1.settingsEditIcon),
                    enabled: true,
                    id: 'workbench.action.editListItem',
                    tooltip: this.getLocalizedStrings().editActionTooltip,
                    run: () => this.editSetting(idx)
                },
                {
                    class: themeService_1.ThemeIcon.asClassName(preferencesIcons_1.settingsRemoveIcon),
                    enabled: true,
                    id: 'workbench.action.removeListItem',
                    tooltip: this.getLocalizedStrings().deleteActionTooltip,
                    run: () => this._onDidChangeList.fire({ originalItem: item, item: undefined, targetIndex: idx })
                }
            ];
        }
        getDragImage(item) {
            const dragImage = $('.monaco-drag-image');
            dragImage.textContent = item.value.data;
            return dragImage;
        }
        renderItem(item, idx) {
            const rowElement = $('.setting-list-row');
            const valueElement = DOM.append(rowElement, $('.setting-list-value'));
            const siblingElement = DOM.append(rowElement, $('.setting-list-sibling'));
            valueElement.textContent = item.value.data.toString();
            siblingElement.textContent = item.sibling ? `when: ${item.sibling}` : null;
            this.addDragAndDrop(rowElement, item, idx);
            return { rowElement, keyElement: valueElement, valueElement: siblingElement };
        }
        addDragAndDrop(rowElement, item, idx) {
            if (this.inReadMode) {
                rowElement.draggable = true;
                rowElement.classList.add('draggable');
            }
            else {
                rowElement.draggable = false;
                rowElement.classList.remove('draggable');
            }
            this.listDisposables.add(DOM.addDisposableListener(rowElement, DOM.EventType.DRAG_START, (ev) => {
                this.dragDetails = {
                    element: rowElement,
                    item,
                    itemIndex: idx
                };
                if (ev.dataTransfer) {
                    ev.dataTransfer.dropEffect = 'move';
                    const dragImage = this.getDragImage(item);
                    document.body.appendChild(dragImage);
                    ev.dataTransfer.setDragImage(dragImage, -10, -10);
                    setTimeout(() => document.body.removeChild(dragImage), 0);
                }
            }));
            this.listDisposables.add(DOM.addDisposableListener(rowElement, DOM.EventType.DRAG_OVER, (ev) => {
                if (!this.dragDetails) {
                    return false;
                }
                ev.preventDefault();
                if (ev.dataTransfer) {
                    ev.dataTransfer.dropEffect = 'move';
                }
                return true;
            }));
            let counter = 0;
            this.listDisposables.add(DOM.addDisposableListener(rowElement, DOM.EventType.DRAG_ENTER, (ev) => {
                counter++;
                rowElement.classList.add('drag-hover');
            }));
            this.listDisposables.add(DOM.addDisposableListener(rowElement, DOM.EventType.DRAG_LEAVE, (ev) => {
                counter--;
                if (!counter) {
                    rowElement.classList.remove('drag-hover');
                }
            }));
            this.listDisposables.add(DOM.addDisposableListener(rowElement, DOM.EventType.DROP, (ev) => {
                // cancel the op if we dragged to a completely different setting
                if (!this.dragDetails) {
                    return false;
                }
                ev.preventDefault();
                counter = 0;
                if (this.dragDetails.element !== rowElement) {
                    this._onDidChangeList.fire({
                        originalItem: this.dragDetails.item,
                        sourceIndex: this.dragDetails.itemIndex,
                        item,
                        targetIndex: idx
                    });
                }
                return true;
            }));
            this.listDisposables.add(DOM.addDisposableListener(rowElement, DOM.EventType.DRAG_END, (ev) => {
                counter = 0;
                rowElement.classList.remove('drag-hover');
                if (ev.dataTransfer) {
                    ev.dataTransfer.clearData();
                }
                if (this.dragDetails) {
                    this.dragDetails = undefined;
                }
            }));
        }
        renderEdit(item, idx) {
            const rowElement = $('.setting-list-edit-row');
            let valueInput;
            let currentDisplayValue;
            let currentEnumOptions;
            if (this.keyValueSuggester) {
                const enumData = this.keyValueSuggester(this.model.items.map(({ value: { data } }) => data), idx);
                item = Object.assign(Object.assign({}, item), { value: {
                        type: 'enum',
                        data: item.value.data,
                        options: enumData ? enumData.options : []
                    } });
            }
            switch (item.value.type) {
                case 'string':
                    valueInput = this.renderInputBox(item.value, rowElement);
                    break;
                case 'enum':
                    valueInput = this.renderDropdown(item.value, rowElement);
                    currentEnumOptions = item.value.options;
                    if (item.value.options.length) {
                        currentDisplayValue = this.isItemNew(item) ?
                            currentEnumOptions[0].value : item.value.data;
                    }
                    break;
            }
            const updatedInputBoxItem = () => {
                const inputBox = valueInput;
                return {
                    value: {
                        type: 'string',
                        data: inputBox.value
                    },
                    sibling: siblingInput === null || siblingInput === void 0 ? void 0 : siblingInput.value
                };
            };
            const updatedSelectBoxItem = (selectedValue) => {
                return {
                    value: {
                        type: 'enum',
                        data: selectedValue,
                        options: currentEnumOptions !== null && currentEnumOptions !== void 0 ? currentEnumOptions : []
                    }
                };
            };
            const onKeyDown = (e) => {
                if (e.equals(3 /* KeyCode.Enter */)) {
                    this.handleItemChange(item, updatedInputBoxItem(), idx);
                }
                else if (e.equals(9 /* KeyCode.Escape */)) {
                    this.cancelEdit();
                    e.preventDefault();
                }
                rowElement === null || rowElement === void 0 ? void 0 : rowElement.focus();
            };
            if (item.value.type !== 'string') {
                const selectBox = valueInput;
                this.listDisposables.add(selectBox.onDidSelect(({ selected }) => {
                    currentDisplayValue = selected;
                }));
            }
            else {
                const inputBox = valueInput;
                this.listDisposables.add(DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.KEY_DOWN, onKeyDown));
            }
            let siblingInput;
            if (!(0, types_1.isUndefinedOrNull)(item.sibling)) {
                siblingInput = new inputBox_1.InputBox(rowElement, this.contextViewService, {
                    placeholder: this.getLocalizedStrings().siblingInputPlaceholder
                });
                siblingInput.element.classList.add('setting-list-siblingInput');
                this.listDisposables.add(siblingInput);
                this.listDisposables.add((0, styler_1.attachInputBoxStyler)(siblingInput, this.themeService, {
                    inputBackground: settingsEditorColorRegistry_1.settingsTextInputBackground,
                    inputForeground: settingsEditorColorRegistry_1.settingsTextInputForeground,
                    inputBorder: settingsEditorColorRegistry_1.settingsTextInputBorder
                }));
                siblingInput.value = item.sibling;
                this.listDisposables.add(DOM.addStandardDisposableListener(siblingInput.inputElement, DOM.EventType.KEY_DOWN, onKeyDown));
            }
            else if (valueInput instanceof inputBox_1.InputBox) {
                valueInput.element.classList.add('no-sibling');
            }
            const okButton = this._register(new button_1.Button(rowElement));
            okButton.label = (0, nls_1.localize)('okButton', "OK");
            okButton.element.classList.add('setting-list-ok-button');
            this.listDisposables.add((0, styler_1.attachButtonStyler)(okButton, this.themeService));
            this.listDisposables.add(okButton.onDidClick(() => {
                if (item.value.type === 'string') {
                    this.handleItemChange(item, updatedInputBoxItem(), idx);
                }
                else {
                    this.handleItemChange(item, updatedSelectBoxItem(currentDisplayValue), idx);
                }
            }));
            const cancelButton = this._register(new button_1.Button(rowElement, { secondary: true }));
            cancelButton.label = (0, nls_1.localize)('cancelButton', "Cancel");
            cancelButton.element.classList.add('setting-list-cancel-button');
            this.listDisposables.add((0, styler_1.attachButtonStyler)(cancelButton, this.themeService));
            this.listDisposables.add(cancelButton.onDidClick(() => this.cancelEdit()));
            this.listDisposables.add((0, async_1.disposableTimeout)(() => {
                valueInput.focus();
                if (valueInput instanceof inputBox_1.InputBox) {
                    valueInput.select();
                }
            }));
            return rowElement;
        }
        isItemNew(item) {
            return item.value.data === '';
        }
        addTooltipsToRow(rowElementGroup, { value, sibling }) {
            const title = (0, types_1.isUndefinedOrNull)(sibling)
                ? (0, nls_1.localize)('listValueHintLabel', "List item `{0}`", value.data)
                : (0, nls_1.localize)('listSiblingHintLabel', "List item `{0}` with sibling `${1}`", value.data, sibling);
            const { rowElement } = rowElementGroup;
            rowElement.title = title;
            rowElement.setAttribute('aria-label', rowElement.title);
        }
        getLocalizedStrings() {
            return {
                deleteActionTooltip: (0, nls_1.localize)('removeItem', "Remove Item"),
                editActionTooltip: (0, nls_1.localize)('editItem', "Edit Item"),
                addButtonLabel: (0, nls_1.localize)('addItem', "Add Item"),
                inputPlaceholder: (0, nls_1.localize)('itemInputPlaceholder', "Item..."),
                siblingInputPlaceholder: (0, nls_1.localize)('listSiblingInputPlaceholder', "Sibling..."),
            };
        }
        renderInputBox(value, rowElement) {
            const valueInput = new inputBox_1.InputBox(rowElement, this.contextViewService, {
                placeholder: this.getLocalizedStrings().inputPlaceholder
            });
            valueInput.element.classList.add('setting-list-valueInput');
            this.listDisposables.add((0, styler_1.attachInputBoxStyler)(valueInput, this.themeService, {
                inputBackground: settingsEditorColorRegistry_1.settingsTextInputBackground,
                inputForeground: settingsEditorColorRegistry_1.settingsTextInputForeground,
                inputBorder: settingsEditorColorRegistry_1.settingsTextInputBorder
            }));
            this.listDisposables.add(valueInput);
            valueInput.value = value.data.toString();
            return valueInput;
        }
        renderDropdown(value, rowElement) {
            if (value.type !== 'enum') {
                throw new Error('Valuetype must be enum.');
            }
            const selectBox = this.createBasicSelectBox(value);
            const wrapper = $('.setting-list-object-list-row');
            selectBox.render(wrapper);
            rowElement.appendChild(wrapper);
            return selectBox;
        }
    }
    exports.ListSettingWidget = ListSettingWidget;
    class ExcludeSettingWidget extends ListSettingWidget {
        getContainerClasses() {
            return ['setting-list-exclude-widget'];
        }
        addDragAndDrop(rowElement, item, idx) {
            return;
        }
        addTooltipsToRow(rowElementGroup, { value, sibling }) {
            const title = (0, types_1.isUndefinedOrNull)(sibling)
                ? (0, nls_1.localize)('excludePatternHintLabel', "Exclude files matching `{0}`", value.data)
                : (0, nls_1.localize)('excludeSiblingHintLabel', "Exclude files matching `{0}`, only when a file matching `{1}` is present", value.data, sibling);
            const { rowElement } = rowElementGroup;
            rowElement.title = title;
            rowElement.setAttribute('aria-label', rowElement.title);
        }
        getLocalizedStrings() {
            return {
                deleteActionTooltip: (0, nls_1.localize)('removeExcludeItem', "Remove Exclude Item"),
                editActionTooltip: (0, nls_1.localize)('editExcludeItem', "Edit Exclude Item"),
                addButtonLabel: (0, nls_1.localize)('addPattern', "Add Pattern"),
                inputPlaceholder: (0, nls_1.localize)('excludePatternInputPlaceholder', "Exclude Pattern..."),
                siblingInputPlaceholder: (0, nls_1.localize)('excludeSiblingInputPlaceholder', "When Pattern Is Present..."),
            };
        }
    }
    exports.ExcludeSettingWidget = ExcludeSettingWidget;
    class ObjectSettingDropdownWidget extends AbstractListSettingWidget {
        constructor() {
            super(...arguments);
            this.currentSettingKey = '';
            this.showAddButton = true;
            this.keySuggester = () => undefined;
            this.valueSuggester = () => undefined;
        }
        setValue(listData, options) {
            var _a, _b, _c;
            this.showAddButton = (_a = options === null || options === void 0 ? void 0 : options.showAddButton) !== null && _a !== void 0 ? _a : this.showAddButton;
            this.keySuggester = (_b = options === null || options === void 0 ? void 0 : options.keySuggester) !== null && _b !== void 0 ? _b : this.keySuggester;
            this.valueSuggester = (_c = options === null || options === void 0 ? void 0 : options.valueSuggester) !== null && _c !== void 0 ? _c : this.valueSuggester;
            if ((0, types_1.isDefined)(options) && options.settingKey !== this.currentSettingKey) {
                this.model.setEditKey('none');
                this.model.select(null);
                this.currentSettingKey = options.settingKey;
            }
            super.setValue(listData);
        }
        isItemNew(item) {
            return item.key.data === '' && item.value.data === '';
        }
        isAddButtonVisible() {
            return this.showAddButton;
        }
        getEmptyItem() {
            return {
                key: { type: 'string', data: '' },
                value: { type: 'string', data: '' },
                removable: true,
            };
        }
        getContainerClasses() {
            return ['setting-list-object-widget'];
        }
        getActionsForItem(item, idx) {
            const actions = [
                {
                    class: themeService_1.ThemeIcon.asClassName(preferencesIcons_1.settingsEditIcon),
                    enabled: true,
                    id: 'workbench.action.editListItem',
                    tooltip: this.getLocalizedStrings().editActionTooltip,
                    run: () => this.editSetting(idx)
                },
            ];
            if (item.removable) {
                actions.push({
                    class: themeService_1.ThemeIcon.asClassName(preferencesIcons_1.settingsRemoveIcon),
                    enabled: true,
                    id: 'workbench.action.removeListItem',
                    tooltip: this.getLocalizedStrings().deleteActionTooltip,
                    run: () => this._onDidChangeList.fire({ originalItem: item, item: undefined, targetIndex: idx })
                });
            }
            else {
                actions.push({
                    class: themeService_1.ThemeIcon.asClassName(preferencesIcons_1.settingsDiscardIcon),
                    enabled: true,
                    id: 'workbench.action.resetListItem',
                    tooltip: this.getLocalizedStrings().resetActionTooltip,
                    run: () => this._onDidChangeList.fire({ originalItem: item, item: undefined, targetIndex: idx })
                });
            }
            return actions;
        }
        renderHeader() {
            const header = $('.setting-list-row-header');
            const keyHeader = DOM.append(header, $('.setting-list-object-key'));
            const valueHeader = DOM.append(header, $('.setting-list-object-value'));
            const { keyHeaderText, valueHeaderText } = this.getLocalizedStrings();
            keyHeader.textContent = keyHeaderText;
            valueHeader.textContent = valueHeaderText;
            return header;
        }
        renderItem(item, idx) {
            const rowElement = $('.setting-list-row');
            rowElement.classList.add('setting-list-object-row');
            const keyElement = DOM.append(rowElement, $('.setting-list-object-key'));
            const valueElement = DOM.append(rowElement, $('.setting-list-object-value'));
            keyElement.textContent = item.key.data;
            valueElement.textContent = item.value.data.toString();
            return { rowElement, keyElement, valueElement };
        }
        renderEdit(item, idx) {
            const rowElement = $('.setting-list-edit-row.setting-list-object-row');
            const changedItem = Object.assign({}, item);
            const onKeyChange = (key) => {
                var _a;
                changedItem.key = key;
                okButton.enabled = key.data !== '';
                const suggestedValue = (_a = this.valueSuggester(key.data)) !== null && _a !== void 0 ? _a : item.value;
                if (this.shouldUseSuggestion(item.value, changedItem.value, suggestedValue)) {
                    onValueChange(suggestedValue);
                    renderLatestValue();
                }
            };
            const onValueChange = (value) => {
                changedItem.value = value;
            };
            let keyWidget;
            let keyElement;
            if (this.showAddButton) {
                if (this.isItemNew(item)) {
                    const suggestedKey = this.keySuggester(this.model.items.map(({ key: { data } }) => data));
                    if ((0, types_1.isDefined)(suggestedKey)) {
                        changedItem.key = suggestedKey;
                        const suggestedValue = this.valueSuggester(changedItem.key.data);
                        onValueChange(suggestedValue !== null && suggestedValue !== void 0 ? suggestedValue : changedItem.value);
                    }
                }
                const { widget, element } = this.renderEditWidget(changedItem.key, {
                    idx,
                    isKey: true,
                    originalItem: item,
                    changedItem,
                    update: onKeyChange,
                });
                keyWidget = widget;
                keyElement = element;
            }
            else {
                keyElement = $('.setting-list-object-key');
                keyElement.textContent = item.key.data;
            }
            let valueWidget;
            const valueContainer = $('.setting-list-object-value-container');
            const renderLatestValue = () => {
                const { widget, element } = this.renderEditWidget(changedItem.value, {
                    idx,
                    isKey: false,
                    originalItem: item,
                    changedItem,
                    update: onValueChange,
                });
                valueWidget = widget;
                DOM.clearNode(valueContainer);
                valueContainer.append(element);
            };
            renderLatestValue();
            rowElement.append(keyElement, valueContainer);
            const okButton = this._register(new button_1.Button(rowElement));
            okButton.enabled = changedItem.key.data !== '';
            okButton.label = (0, nls_1.localize)('okButton', "OK");
            okButton.element.classList.add('setting-list-ok-button');
            this.listDisposables.add((0, styler_1.attachButtonStyler)(okButton, this.themeService));
            this.listDisposables.add(okButton.onDidClick(() => this.handleItemChange(item, changedItem, idx)));
            const cancelButton = this._register(new button_1.Button(rowElement, { secondary: true }));
            cancelButton.label = (0, nls_1.localize)('cancelButton', "Cancel");
            cancelButton.element.classList.add('setting-list-cancel-button');
            this.listDisposables.add((0, styler_1.attachButtonStyler)(cancelButton, this.themeService));
            this.listDisposables.add(cancelButton.onDidClick(() => this.cancelEdit()));
            this.listDisposables.add((0, async_1.disposableTimeout)(() => {
                const widget = keyWidget !== null && keyWidget !== void 0 ? keyWidget : valueWidget;
                widget.focus();
                if (widget instanceof inputBox_1.InputBox) {
                    widget.select();
                }
            }));
            return rowElement;
        }
        renderEditWidget(keyOrValue, options) {
            switch (keyOrValue.type) {
                case 'string':
                    return this.renderStringEditWidget(keyOrValue, options);
                case 'enum':
                    return this.renderEnumEditWidget(keyOrValue, options);
                case 'boolean':
                    return this.renderEnumEditWidget({
                        type: 'enum',
                        data: keyOrValue.data.toString(),
                        options: [{ value: 'true' }, { value: 'false' }],
                    }, options);
            }
        }
        renderStringEditWidget(keyOrValue, { idx, isKey, originalItem, changedItem, update }) {
            const wrapper = $(isKey ? '.setting-list-object-input-key' : '.setting-list-object-input-value');
            const inputBox = new inputBox_1.InputBox(wrapper, this.contextViewService, {
                placeholder: isKey
                    ? (0, nls_1.localize)('objectKeyInputPlaceholder', "Key")
                    : (0, nls_1.localize)('objectValueInputPlaceholder', "Value"),
            });
            inputBox.element.classList.add('setting-list-object-input');
            this.listDisposables.add((0, styler_1.attachInputBoxStyler)(inputBox, this.themeService, {
                inputBackground: settingsEditorColorRegistry_1.settingsTextInputBackground,
                inputForeground: settingsEditorColorRegistry_1.settingsTextInputForeground,
                inputBorder: settingsEditorColorRegistry_1.settingsTextInputBorder
            }));
            this.listDisposables.add(inputBox);
            inputBox.value = keyOrValue.data;
            this.listDisposables.add(inputBox.onDidChange(value => update(Object.assign(Object.assign({}, keyOrValue), { data: value }))));
            const onKeyDown = (e) => {
                if (e.equals(3 /* KeyCode.Enter */)) {
                    this.handleItemChange(originalItem, changedItem, idx);
                }
                else if (e.equals(9 /* KeyCode.Escape */)) {
                    this.cancelEdit();
                    e.preventDefault();
                }
            };
            this.listDisposables.add(DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.KEY_DOWN, onKeyDown));
            return { widget: inputBox, element: wrapper };
        }
        renderEnumEditWidget(keyOrValue, { isKey, changedItem, update }) {
            const selectBox = this.createBasicSelectBox(keyOrValue);
            const changedKeyOrValue = isKey ? changedItem.key : changedItem.value;
            this.listDisposables.add(selectBox.onDidSelect(({ selected }) => update(changedKeyOrValue.type === 'boolean'
                ? Object.assign(Object.assign({}, changedKeyOrValue), { data: selected === 'true' ? true : false }) : Object.assign(Object.assign({}, changedKeyOrValue), { data: selected }))));
            const wrapper = $('.setting-list-object-input');
            wrapper.classList.add(isKey ? 'setting-list-object-input-key' : 'setting-list-object-input-value');
            selectBox.render(wrapper);
            // Switch to the first item if the user set something invalid in the json
            const selected = keyOrValue.options.findIndex(option => keyOrValue.data === option.value);
            if (selected === -1 && keyOrValue.options.length) {
                update(changedKeyOrValue.type === 'boolean'
                    ? Object.assign(Object.assign({}, changedKeyOrValue), { data: true }) : Object.assign(Object.assign({}, changedKeyOrValue), { data: keyOrValue.options[0].value }));
            }
            else if (changedKeyOrValue.type === 'boolean') {
                // https://github.com/microsoft/vscode/issues/129581
                update(Object.assign(Object.assign({}, changedKeyOrValue), { data: keyOrValue.data === 'true' }));
            }
            return { widget: selectBox, element: wrapper };
        }
        shouldUseSuggestion(originalValue, previousValue, newValue) {
            // suggestion is exactly the same
            if (newValue.type !== 'enum' && newValue.type === previousValue.type && newValue.data === previousValue.data) {
                return false;
            }
            // item is new, use suggestion
            if (originalValue.data === '') {
                return true;
            }
            if (previousValue.type === newValue.type && newValue.type !== 'enum') {
                return false;
            }
            // check if all enum options are the same
            if (previousValue.type === 'enum' && newValue.type === 'enum') {
                const previousEnums = new Set(previousValue.options.map(({ value }) => value));
                newValue.options.forEach(({ value }) => previousEnums.delete(value));
                // all options are the same
                if (previousEnums.size === 0) {
                    return false;
                }
            }
            return true;
        }
        addTooltipsToRow(rowElementGroup, item) {
            var _a, _b, _c;
            const { keyElement, valueElement, rowElement } = rowElementGroup;
            const accessibleDescription = (0, nls_1.localize)('objectPairHintLabel', "The property `{0}` is set to `{1}`.", item.key.data, item.value.data);
            const keyDescription = (_b = (_a = this.getEnumDescription(item.key)) !== null && _a !== void 0 ? _a : item.keyDescription) !== null && _b !== void 0 ? _b : accessibleDescription;
            keyElement.title = keyDescription;
            const valueDescription = (_c = this.getEnumDescription(item.value)) !== null && _c !== void 0 ? _c : accessibleDescription;
            valueElement.title = valueDescription;
            rowElement.setAttribute('aria-label', accessibleDescription);
        }
        getEnumDescription(keyOrValue) {
            var _a;
            const enumDescription = keyOrValue.type === 'enum'
                ? (_a = keyOrValue.options.find(({ value }) => keyOrValue.data === value)) === null || _a === void 0 ? void 0 : _a.description
                : undefined;
            return enumDescription;
        }
        getLocalizedStrings() {
            return {
                deleteActionTooltip: (0, nls_1.localize)('removeItem', "Remove Item"),
                resetActionTooltip: (0, nls_1.localize)('resetItem', "Reset Item"),
                editActionTooltip: (0, nls_1.localize)('editItem', "Edit Item"),
                addButtonLabel: (0, nls_1.localize)('addItem', "Add Item"),
                keyHeaderText: (0, nls_1.localize)('objectKeyHeader', "Item"),
                valueHeaderText: (0, nls_1.localize)('objectValueHeader', "Value"),
            };
        }
    }
    exports.ObjectSettingDropdownWidget = ObjectSettingDropdownWidget;
    class ObjectSettingCheckboxWidget extends AbstractListSettingWidget {
        constructor() {
            super(...arguments);
            this.currentSettingKey = '';
        }
        setValue(listData, options) {
            if ((0, types_1.isDefined)(options) && options.settingKey !== this.currentSettingKey) {
                this.model.setEditKey('none');
                this.model.select(null);
                this.currentSettingKey = options.settingKey;
            }
            super.setValue(listData);
        }
        isItemNew(item) {
            return !item.key.data && !item.value.data;
        }
        getEmptyItem() {
            return {
                key: { type: 'string', data: '' },
                value: { type: 'boolean', data: false },
                removable: false
            };
        }
        getContainerClasses() {
            return ['setting-list-object-widget'];
        }
        getActionsForItem(item, idx) {
            return [];
        }
        isAddButtonVisible() {
            return false;
        }
        renderHeader() {
            return undefined;
        }
        renderDataOrEditItem(item, idx, listFocused) {
            const rowElement = this.renderEdit(item, idx);
            rowElement.setAttribute('role', 'listitem');
            return rowElement;
        }
        renderItem(item, idx) {
            // Return just the containers, since we always render in edit mode anyway
            const rowElement = $('.blank-row');
            const keyElement = $('.blank-row-key');
            return { rowElement, keyElement };
        }
        renderEdit(item, idx) {
            const rowElement = $('.setting-list-edit-row.setting-list-object-row.setting-item-bool');
            const changedItem = Object.assign({}, item);
            const onValueChange = (newValue) => {
                changedItem.value.data = newValue;
                this.handleItemChange(item, changedItem, idx);
            };
            const checkboxDescription = item.keyDescription ? `${item.keyDescription} (${item.key.data})` : item.key.data;
            const { element, widget: checkbox } = this.renderEditWidget(changedItem.value.data, checkboxDescription, onValueChange);
            rowElement.appendChild(element);
            const valueElement = DOM.append(rowElement, $('.setting-list-object-value'));
            valueElement.textContent = checkboxDescription;
            // We add the tooltips here, because the method is not called by default
            // for widgets in edit mode
            const rowElementGroup = { rowElement, keyElement: valueElement, valueElement: checkbox.domNode };
            this.addTooltipsToRow(rowElementGroup, item);
            this._register(DOM.addDisposableListener(valueElement, DOM.EventType.MOUSE_DOWN, e => {
                const targetElement = e.target;
                if (targetElement.tagName.toLowerCase() !== 'a') {
                    checkbox.checked = !checkbox.checked;
                    onValueChange(checkbox.checked);
                }
                DOM.EventHelper.stop(e);
            }));
            return rowElement;
        }
        renderEditWidget(value, checkboxDescription, onValueChange) {
            const checkbox = new toggle_1.Toggle({
                icon: codicons_1.Codicon.check,
                actionClassName: 'setting-value-checkbox',
                isChecked: value,
                title: checkboxDescription
            });
            this.listDisposables.add(checkbox);
            const wrapper = $('.setting-list-object-input');
            wrapper.classList.add('setting-list-object-input-key-checkbox');
            checkbox.domNode.classList.add('setting-value-checkbox');
            wrapper.appendChild(checkbox.domNode);
            this._register(DOM.addDisposableListener(wrapper, DOM.EventType.MOUSE_DOWN, e => {
                checkbox.checked = !checkbox.checked;
                onValueChange(checkbox.checked);
                // Without this line, the settings editor assumes
                // we lost focus on this setting completely.
                e.stopImmediatePropagation();
            }));
            return { widget: checkbox, element: wrapper };
        }
        addTooltipsToRow(rowElementGroup, item) {
            var _a;
            const accessibleDescription = (0, nls_1.localize)('objectPairHintLabel', "The property `{0}` is set to `{1}`.", item.key.data, item.value.data);
            const title = (_a = item.keyDescription) !== null && _a !== void 0 ? _a : accessibleDescription;
            const { rowElement, keyElement, valueElement } = rowElementGroup;
            keyElement.title = title;
            valueElement.setAttribute('aria-label', accessibleDescription);
            rowElement.setAttribute('aria-label', accessibleDescription);
        }
        getLocalizedStrings() {
            return {
                deleteActionTooltip: (0, nls_1.localize)('removeItem', "Remove Item"),
                resetActionTooltip: (0, nls_1.localize)('resetItem', "Reset Item"),
                editActionTooltip: (0, nls_1.localize)('editItem', "Edit Item"),
                addButtonLabel: (0, nls_1.localize)('addItem', "Add Item"),
                keyHeaderText: (0, nls_1.localize)('objectKeyHeader', "Item"),
                valueHeaderText: (0, nls_1.localize)('objectValueHeader', "Value"),
            };
        }
    }
    exports.ObjectSettingCheckboxWidget = ObjectSettingCheckboxWidget;
});
//# sourceMappingURL=settingsWidgets.js.map