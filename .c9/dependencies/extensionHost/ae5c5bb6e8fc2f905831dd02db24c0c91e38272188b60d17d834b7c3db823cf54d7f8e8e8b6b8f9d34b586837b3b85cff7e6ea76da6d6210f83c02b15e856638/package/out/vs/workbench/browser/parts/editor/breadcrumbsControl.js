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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/browser/ui/breadcrumbs/breadcrumbsWidget", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/list/browser/listService", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/workbench/browser/labels", "vs/workbench/browser/parts/editor/breadcrumbs", "vs/workbench/browser/parts/editor/breadcrumbsModel", "vs/workbench/browser/parts/editor/breadcrumbsPicker", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/browser/browser", "vs/platform/label/common/label", "vs/workbench/common/actions", "vs/platform/theme/common/iconRegistry", "vs/base/common/codicons", "vs/css!./media/breadcrumbscontrol"], function (require, exports, dom, mouseEvent_1, breadcrumbsWidget_1, arrays_1, async_1, lifecycle_1, resources_1, uri_1, nls_1, actions_1, commands_1, configuration_1, contextkey_1, contextView_1, files_1, instantiation_1, keybindingsRegistry_1, listService_1, quickInput_1, styler_1, themeService_1, labels_1, breadcrumbs_1, breadcrumbsModel_1, breadcrumbsPicker_1, editor_1, editorService_1, editorGroupsService_1, browser_1, label_1, actions_2, iconRegistry_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreadcrumbsControl = void 0;
    class OutlineItem extends breadcrumbsWidget_1.BreadcrumbsItem {
        constructor(model, element, options) {
            super();
            this.model = model;
            this.element = element;
            this.options = options;
            this._disposables = new lifecycle_1.DisposableStore();
        }
        dispose() {
            this._disposables.dispose();
        }
        equals(other) {
            if (!(other instanceof OutlineItem)) {
                return false;
            }
            return this.element.element === other.element.element &&
                this.options.showFileIcons === other.options.showFileIcons &&
                this.options.showSymbolIcons === other.options.showSymbolIcons;
        }
        render(container) {
            const { element, outline } = this.element;
            if (element === outline) {
                const element = dom.$('span', undefined, '…');
                container.appendChild(element);
                return;
            }
            const templateId = outline.config.delegate.getTemplateId(element);
            const renderer = outline.config.renderers.find(renderer => renderer.templateId === templateId);
            if (!renderer) {
                container.innerText = '<<NO RENDERER>>';
                return;
            }
            const template = renderer.renderTemplate(container);
            renderer.renderElement({
                element,
                children: [],
                depth: 0,
                visibleChildrenCount: 0,
                visibleChildIndex: 0,
                collapsible: false,
                collapsed: false,
                visible: true,
                filterData: undefined
            }, 0, template, undefined);
            this._disposables.add((0, lifecycle_1.toDisposable)(() => { renderer.disposeTemplate(template); }));
        }
    }
    let FileItem = class FileItem extends breadcrumbsWidget_1.BreadcrumbsItem {
        constructor(model, element, options, _instantiationService) {
            super();
            this.model = model;
            this.element = element;
            this.options = options;
            this._instantiationService = _instantiationService;
            this._disposables = new lifecycle_1.DisposableStore();
        }
        dispose() {
            this._disposables.dispose();
        }
        equals(other) {
            if (!(other instanceof FileItem)) {
                return false;
            }
            return (resources_1.extUri.isEqual(this.element.uri, other.element.uri) &&
                this.options.showFileIcons === other.options.showFileIcons &&
                this.options.showSymbolIcons === other.options.showSymbolIcons);
        }
        render(container) {
            // file/folder
            let label = this._instantiationService.createInstance(labels_1.ResourceLabel, container, {});
            label.element.setFile(this.element.uri, {
                hidePath: true,
                hideIcon: this.element.kind === files_1.FileKind.FOLDER || !this.options.showFileIcons,
                fileKind: this.element.kind,
                fileDecorations: { colors: this.options.showDecorationColors, badges: false },
            });
            container.classList.add(files_1.FileKind[this.element.kind].toLowerCase());
            this._disposables.add(label);
        }
    };
    FileItem = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], FileItem);
    const separatorIcon = (0, iconRegistry_1.registerIcon)('breadcrumb-separator', codicons_1.Codicon.chevronRight, (0, nls_1.localize)('separatorIcon', 'Icon for the separator in the breadcrumbs.'));
    let BreadcrumbsControl = class BreadcrumbsControl {
        constructor(container, _options, _editorGroup, _contextKeyService, _contextViewService, _instantiationService, _themeService, _quickInputService, _fileService, _editorService, _labelService, configurationService, breadcrumbsService) {
            var _a;
            this._options = _options;
            this._editorGroup = _editorGroup;
            this._contextKeyService = _contextKeyService;
            this._contextViewService = _contextViewService;
            this._instantiationService = _instantiationService;
            this._themeService = _themeService;
            this._quickInputService = _quickInputService;
            this._fileService = _fileService;
            this._editorService = _editorService;
            this._labelService = _labelService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._breadcrumbsDisposables = new lifecycle_1.DisposableStore();
            this._breadcrumbsPickerShowing = false;
            this.domNode = document.createElement('div');
            this.domNode.classList.add('breadcrumbs-control');
            dom.append(container, this.domNode);
            this._cfUseQuickPick = breadcrumbs_1.BreadcrumbsConfig.UseQuickPick.bindTo(configurationService);
            this._cfShowIcons = breadcrumbs_1.BreadcrumbsConfig.Icons.bindTo(configurationService);
            this._cfTitleScrollbarSizing = breadcrumbs_1.BreadcrumbsConfig.TitleScrollbarSizing.bindTo(configurationService);
            const sizing = (_a = this._cfTitleScrollbarSizing.getValue()) !== null && _a !== void 0 ? _a : 'default';
            this._widget = new breadcrumbsWidget_1.BreadcrumbsWidget(this.domNode, BreadcrumbsControl.SCROLLBAR_SIZES[sizing], separatorIcon);
            this._widget.onDidSelectItem(this._onSelectEvent, this, this._disposables);
            this._widget.onDidFocusItem(this._onFocusEvent, this, this._disposables);
            this._widget.onDidChangeFocus(this._updateCkBreadcrumbsActive, this, this._disposables);
            this._disposables.add((0, styler_1.attachBreadcrumbsStyler)(this._widget, this._themeService, { breadcrumbsBackground: _options.breadcrumbsBackground }));
            this._ckBreadcrumbsPossible = BreadcrumbsControl.CK_BreadcrumbsPossible.bindTo(this._contextKeyService);
            this._ckBreadcrumbsVisible = BreadcrumbsControl.CK_BreadcrumbsVisible.bindTo(this._contextKeyService);
            this._ckBreadcrumbsActive = BreadcrumbsControl.CK_BreadcrumbsActive.bindTo(this._contextKeyService);
            this._disposables.add(breadcrumbsService.register(this._editorGroup.id, this._widget));
            this.hide();
        }
        dispose() {
            this._disposables.dispose();
            this._breadcrumbsDisposables.dispose();
            this._ckBreadcrumbsPossible.reset();
            this._ckBreadcrumbsVisible.reset();
            this._ckBreadcrumbsActive.reset();
            this._cfUseQuickPick.dispose();
            this._cfShowIcons.dispose();
            this._widget.dispose();
            this.domNode.remove();
        }
        layout(dim) {
            this._widget.layout(dim);
        }
        isHidden() {
            return this.domNode.classList.contains('hidden');
        }
        hide() {
            this._breadcrumbsDisposables.clear();
            this._ckBreadcrumbsVisible.set(false);
            this.domNode.classList.toggle('hidden', true);
        }
        update() {
            this._breadcrumbsDisposables.clear();
            // honor diff editors and such
            const uri = editor_1.EditorResourceAccessor.getCanonicalUri(this._editorGroup.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            const wasHidden = this.isHidden();
            if (!uri || !this._fileService.hasProvider(uri)) {
                // cleanup and return when there is no input or when
                // we cannot handle this input
                this._ckBreadcrumbsPossible.set(false);
                if (!wasHidden) {
                    this.hide();
                    return true;
                }
                else {
                    return false;
                }
            }
            // display uri which can be derived from certain inputs
            const fileInfoUri = editor_1.EditorResourceAccessor.getOriginalUri(this._editorGroup.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            this.domNode.classList.toggle('hidden', false);
            this._ckBreadcrumbsVisible.set(true);
            this._ckBreadcrumbsPossible.set(true);
            const model = this._instantiationService.createInstance(breadcrumbsModel_1.BreadcrumbsModel, fileInfoUri !== null && fileInfoUri !== void 0 ? fileInfoUri : uri, this._editorGroup.activeEditorPane);
            this.domNode.classList.toggle('relative-path', model.isRelative());
            this.domNode.classList.toggle('backslash-path', this._labelService.getSeparator(uri.scheme, uri.authority) === '\\');
            const updateBreadcrumbs = () => {
                const showIcons = this._cfShowIcons.getValue();
                const options = Object.assign(Object.assign({}, this._options), { showFileIcons: this._options.showFileIcons && showIcons, showSymbolIcons: this._options.showSymbolIcons && showIcons });
                const items = model.getElements().map(element => element instanceof breadcrumbsModel_1.FileElement ? new FileItem(model, element, options, this._instantiationService) : new OutlineItem(model, element, options));
                if (items.length === 0) {
                    this._widget.setEnabled(false);
                    this._widget.setItems([new class extends breadcrumbsWidget_1.BreadcrumbsItem {
                            render(container) {
                                container.innerText = (0, nls_1.localize)('empty', "no elements");
                            }
                            equals(other) {
                                return other === this;
                            }
                        }]);
                }
                else {
                    this._widget.setEnabled(true);
                    this._widget.setItems(items);
                    this._widget.reveal(items[items.length - 1]);
                }
            };
            const listener = model.onDidUpdate(updateBreadcrumbs);
            const configListener = this._cfShowIcons.onDidChange(updateBreadcrumbs);
            updateBreadcrumbs();
            this._breadcrumbsDisposables.clear();
            this._breadcrumbsDisposables.add(listener);
            this._breadcrumbsDisposables.add(model);
            this._breadcrumbsDisposables.add(configListener);
            this._breadcrumbsDisposables.add((0, lifecycle_1.toDisposable)(() => this._widget.setItems([])));
            const updateScrollbarSizing = () => {
                var _a;
                const sizing = (_a = this._cfTitleScrollbarSizing.getValue()) !== null && _a !== void 0 ? _a : 'default';
                this._widget.setHorizontalScrollbarSize(BreadcrumbsControl.SCROLLBAR_SIZES[sizing]);
            };
            updateScrollbarSizing();
            const updateScrollbarSizeListener = this._cfTitleScrollbarSizing.onDidChange(updateScrollbarSizing);
            this._breadcrumbsDisposables.add(updateScrollbarSizeListener);
            // close picker on hide/update
            this._breadcrumbsDisposables.add({
                dispose: () => {
                    if (this._breadcrumbsPickerShowing) {
                        this._contextViewService.hideContextView({ source: this });
                    }
                }
            });
            return wasHidden !== this.isHidden();
        }
        _onFocusEvent(event) {
            if (event.item && this._breadcrumbsPickerShowing) {
                this._breadcrumbsPickerIgnoreOnceItem = undefined;
                this._widget.setSelection(event.item);
            }
        }
        _onSelectEvent(event) {
            if (!event.item) {
                return;
            }
            if (event.item === this._breadcrumbsPickerIgnoreOnceItem) {
                this._breadcrumbsPickerIgnoreOnceItem = undefined;
                this._widget.setFocused(undefined);
                this._widget.setSelection(undefined);
                return;
            }
            const { element } = event.item;
            this._editorGroup.focus();
            const group = this._getEditorGroup(event.payload);
            if (group !== undefined) {
                // reveal the item
                this._widget.setFocused(undefined);
                this._widget.setSelection(undefined);
                this._revealInEditor(event, element, group);
                return;
            }
            if (this._cfUseQuickPick.getValue()) {
                // using quick pick
                this._widget.setFocused(undefined);
                this._widget.setSelection(undefined);
                this._quickInputService.quickAccess.show(element instanceof breadcrumbsModel_1.OutlineElement2 ? '@' : '');
                return;
            }
            // show picker
            let picker;
            let pickerAnchor;
            this._contextViewService.showContextView({
                render: (parent) => {
                    if (event.item instanceof FileItem) {
                        picker = this._instantiationService.createInstance(breadcrumbsPicker_1.BreadcrumbsFilePicker, parent, event.item.model.resource);
                    }
                    else if (event.item instanceof OutlineItem) {
                        picker = this._instantiationService.createInstance(breadcrumbsPicker_1.BreadcrumbsOutlinePicker, parent, event.item.model.resource);
                    }
                    let selectListener = picker.onWillPickElement(() => this._contextViewService.hideContextView({ source: this, didPick: true }));
                    let zoomListener = browser_1.PixelRatio.onDidChange(() => this._contextViewService.hideContextView({ source: this }));
                    let focusTracker = dom.trackFocus(parent);
                    let blurListener = focusTracker.onDidBlur(() => {
                        this._breadcrumbsPickerIgnoreOnceItem = this._widget.isDOMFocused() ? event.item : undefined;
                        this._contextViewService.hideContextView({ source: this });
                    });
                    this._breadcrumbsPickerShowing = true;
                    this._updateCkBreadcrumbsActive();
                    return (0, lifecycle_1.combinedDisposable)(picker, selectListener, zoomListener, focusTracker, blurListener);
                },
                getAnchor: () => {
                    if (!pickerAnchor) {
                        let maxInnerWidth = window.innerWidth - 8 /*a little less the full widget*/;
                        let maxHeight = Math.min(window.innerHeight * 0.7, 300);
                        let pickerWidth = Math.min(maxInnerWidth, Math.max(240, maxInnerWidth / 4.17));
                        let pickerArrowSize = 8;
                        let pickerArrowOffset;
                        let data = dom.getDomNodePagePosition(event.node.firstChild);
                        let y = data.top + data.height + pickerArrowSize;
                        if (y + maxHeight >= window.innerHeight) {
                            maxHeight = window.innerHeight - y - 30 /* room for shadow and status bar*/;
                        }
                        let x = data.left;
                        if (x + pickerWidth >= maxInnerWidth) {
                            x = maxInnerWidth - pickerWidth;
                        }
                        if (event.payload instanceof mouseEvent_1.StandardMouseEvent) {
                            let maxPickerArrowOffset = pickerWidth - 2 * pickerArrowSize;
                            pickerArrowOffset = event.payload.posx - x;
                            if (pickerArrowOffset > maxPickerArrowOffset) {
                                x = Math.min(maxInnerWidth - pickerWidth, x + pickerArrowOffset - maxPickerArrowOffset);
                                pickerArrowOffset = maxPickerArrowOffset;
                            }
                        }
                        else {
                            pickerArrowOffset = (data.left + (data.width * 0.3)) - x;
                        }
                        picker.show(element, maxHeight, pickerWidth, pickerArrowSize, Math.max(0, pickerArrowOffset));
                        pickerAnchor = { x, y };
                    }
                    return pickerAnchor;
                },
                onHide: (data) => {
                    if (!(data === null || data === void 0 ? void 0 : data.didPick)) {
                        picker.restoreViewState();
                    }
                    this._breadcrumbsPickerShowing = false;
                    this._updateCkBreadcrumbsActive();
                    if ((data === null || data === void 0 ? void 0 : data.source) === this) {
                        this._widget.setFocused(undefined);
                        this._widget.setSelection(undefined);
                    }
                    picker.dispose();
                }
            });
        }
        _updateCkBreadcrumbsActive() {
            const value = this._widget.isDOMFocused() || this._breadcrumbsPickerShowing;
            this._ckBreadcrumbsActive.set(value);
        }
        async _revealInEditor(event, element, group, pinned = false) {
            if (element instanceof breadcrumbsModel_1.FileElement) {
                if (element.kind === files_1.FileKind.FILE) {
                    await this._editorService.openEditor({ resource: element.uri, options: { pinned } }, group);
                }
                else {
                    // show next picker
                    let items = this._widget.getItems();
                    let idx = items.indexOf(event.item);
                    this._widget.setFocused(items[idx + 1]);
                    this._widget.setSelection(items[idx + 1], BreadcrumbsControl.Payload_Pick);
                }
            }
            else {
                element.outline.reveal(element, { pinned }, group === editorService_1.SIDE_GROUP);
            }
        }
        _getEditorGroup(data) {
            if (data === BreadcrumbsControl.Payload_RevealAside) {
                return editorService_1.SIDE_GROUP;
            }
            else if (data === BreadcrumbsControl.Payload_Reveal) {
                return editorService_1.ACTIVE_GROUP;
            }
            else {
                return undefined;
            }
        }
    };
    BreadcrumbsControl.HEIGHT = 22;
    BreadcrumbsControl.SCROLLBAR_SIZES = {
        default: 3,
        large: 8
    };
    BreadcrumbsControl.Payload_Reveal = {};
    BreadcrumbsControl.Payload_RevealAside = {};
    BreadcrumbsControl.Payload_Pick = {};
    BreadcrumbsControl.CK_BreadcrumbsPossible = new contextkey_1.RawContextKey('breadcrumbsPossible', false, (0, nls_1.localize)('breadcrumbsPossible', "Whether the editor can show breadcrumbs"));
    BreadcrumbsControl.CK_BreadcrumbsVisible = new contextkey_1.RawContextKey('breadcrumbsVisible', false, (0, nls_1.localize)('breadcrumbsVisible', "Whether breadcrumbs are currently visible"));
    BreadcrumbsControl.CK_BreadcrumbsActive = new contextkey_1.RawContextKey('breadcrumbsActive', false, (0, nls_1.localize)('breadcrumbsActive', "Whether breadcrumbs have focus"));
    BreadcrumbsControl = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, contextView_1.IContextViewService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, themeService_1.IThemeService),
        __param(7, quickInput_1.IQuickInputService),
        __param(8, files_1.IFileService),
        __param(9, editorService_1.IEditorService),
        __param(10, label_1.ILabelService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, breadcrumbs_1.IBreadcrumbsService)
    ], BreadcrumbsControl);
    exports.BreadcrumbsControl = BreadcrumbsControl;
    //#region commands
    // toggle command
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: 'breadcrumbs.toggle',
            title: { value: (0, nls_1.localize)('cmd.toggle', "Toggle Breadcrumbs"), original: 'Toggle Breadcrumbs' },
            category: actions_2.CATEGORIES.View
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
        group: '5_editor',
        order: 3,
        command: {
            id: 'breadcrumbs.toggle',
            title: (0, nls_1.localize)('miShowBreadcrumbs', "Show &&Breadcrumbs"),
            toggled: contextkey_1.ContextKeyExpr.equals('config.breadcrumbs.enabled', true)
        }
    });
    commands_1.CommandsRegistry.registerCommand('breadcrumbs.toggle', accessor => {
        let config = accessor.get(configuration_1.IConfigurationService);
        let value = breadcrumbs_1.BreadcrumbsConfig.IsEnabled.bindTo(config).getValue();
        breadcrumbs_1.BreadcrumbsConfig.IsEnabled.bindTo(config).updateValue(!value);
    });
    // focus/focus-and-select
    function focusAndSelectHandler(accessor, select) {
        // find widget and focus/select
        const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
        const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
        const widget = breadcrumbs.getWidget(groups.activeGroup.id);
        if (widget) {
            const item = (0, arrays_1.tail)(widget.getItems());
            widget.setFocused(item);
            if (select) {
                widget.setSelection(item, BreadcrumbsControl.Payload_Pick);
            }
        }
    }
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: 'breadcrumbs.focusAndSelect',
            title: { value: (0, nls_1.localize)('cmd.focus', "Focus Breadcrumbs"), original: 'Focus Breadcrumbs' },
            precondition: BreadcrumbsControl.CK_BreadcrumbsVisible
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focusAndSelect',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 84 /* KeyCode.Period */,
        when: BreadcrumbsControl.CK_BreadcrumbsPossible,
        handler: accessor => focusAndSelectHandler(accessor, true)
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focus',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 80 /* KeyCode.Semicolon */,
        when: BreadcrumbsControl.CK_BreadcrumbsPossible,
        handler: accessor => focusAndSelectHandler(accessor, false)
    });
    // this commands is only enabled when breadcrumbs are
    // disabled which it then enables and focuses
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.toggleToOn',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 84 /* KeyCode.Period */,
        when: contextkey_1.ContextKeyExpr.not('config.breadcrumbs.enabled'),
        handler: async (accessor) => {
            const instant = accessor.get(instantiation_1.IInstantiationService);
            const config = accessor.get(configuration_1.IConfigurationService);
            // check if enabled and iff not enable
            const isEnabled = breadcrumbs_1.BreadcrumbsConfig.IsEnabled.bindTo(config);
            if (!isEnabled.getValue()) {
                await isEnabled.updateValue(true);
                await (0, async_1.timeout)(50); // hacky - the widget might not be ready yet...
            }
            return instant.invokeFunction(focusAndSelectHandler, true);
        }
    });
    // navigation
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focusNext',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 17 /* KeyCode.RightArrow */,
        secondary: [2048 /* KeyMod.CtrlCmd */ | 17 /* KeyCode.RightArrow */],
        mac: {
            primary: 17 /* KeyCode.RightArrow */,
            secondary: [512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */],
        },
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.focusNext();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focusPrevious',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 15 /* KeyCode.LeftArrow */,
        secondary: [2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */],
        mac: {
            primary: 15 /* KeyCode.LeftArrow */,
            secondary: [512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */],
        },
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.focusPrev();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focusNextWithPicker',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
        primary: 2048 /* KeyMod.CtrlCmd */ | 17 /* KeyCode.RightArrow */,
        mac: {
            primary: 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */,
        },
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive, listService_1.WorkbenchListFocusContextKey),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.focusNext();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focusPreviousWithPicker',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
        primary: 2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */,
        mac: {
            primary: 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */,
        },
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive, listService_1.WorkbenchListFocusContextKey),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.focusPrev();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.selectFocused',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 3 /* KeyCode.Enter */,
        secondary: [18 /* KeyCode.DownArrow */],
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.setSelection(widget.getFocused(), BreadcrumbsControl.Payload_Pick);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.revealFocused',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 10 /* KeyCode.Space */,
        secondary: [2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */],
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.setSelection(widget.getFocused(), BreadcrumbsControl.Payload_Reveal);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.selectEditor',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
        primary: 9 /* KeyCode.Escape */,
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.setFocused(undefined);
            widget.setSelection(undefined);
            if (groups.activeGroup.activeEditorPane) {
                groups.activeGroup.activeEditorPane.focus();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.revealFocusedFromTreeAside',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive, listService_1.WorkbenchListFocusContextKey),
        handler(accessor) {
            const editors = accessor.get(editorService_1.IEditorService);
            const lists = accessor.get(listService_1.IListService);
            const tree = lists.lastFocusedList;
            if (!(tree instanceof listService_1.WorkbenchDataTree)) {
                return;
            }
            const element = tree.getFocus()[0];
            if (uri_1.URI.isUri(element === null || element === void 0 ? void 0 : element.resource)) {
                // IFileStat: open file in editor
                return editors.openEditor({
                    resource: element.resource,
                    options: { pinned: true }
                }, editorService_1.SIDE_GROUP);
            }
            // IOutline: check if this the outline and iff so reveal element
            const input = tree.getInput();
            if (input && typeof input.outlineKind === 'string') {
                return input.reveal(element, {
                    pinned: true,
                    preserveFocus: false
                }, true);
            }
        }
    });
});
//#endregion
//# sourceMappingURL=breadcrumbsControl.js.map