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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/list/listPaging", "vs/base/browser/ui/list/listWidget", "vs/base/browser/ui/table/tableWidget", "vs/base/browser/ui/tree/asyncDataTree", "vs/base/browser/ui/tree/dataTree", "vs/base/browser/ui/tree/objectTree", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/registry/common/platform", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService"], function (require, exports, dom_1, listPaging_1, listWidget_1, tableWidget_1, asyncDataTree_1, dataTree_1, objectTree_1, event_1, lifecycle_1, nls_1, accessibility_1, configuration_1, configurationRegistry_1, contextkey_1, contextkeys_1, instantiation_1, keybinding_1, platform_1, styler_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchCompressibleAsyncDataTree = exports.WorkbenchAsyncDataTree = exports.WorkbenchDataTree = exports.WorkbenchCompressibleObjectTree = exports.WorkbenchObjectTree = exports.getSelectionKeyboardEvent = exports.WorkbenchTable = exports.WorkbenchPagedList = exports.WorkbenchList = exports.WorkbenchListAutomaticKeyboardNavigationKey = exports.WorkbenchTreeElementHasChild = exports.WorkbenchTreeElementCanExpand = exports.WorkbenchTreeElementHasParent = exports.WorkbenchTreeElementCanCollapse = exports.WorkbenchListSelectionNavigation = exports.WorkbenchListMultiSelection = exports.WorkbenchListDoubleSelection = exports.WorkbenchListHasSelectionOrFocus = exports.WorkbenchListFocusContextKey = exports.WorkbenchListSupportsMultiSelectContextKey = exports.ListService = exports.IListService = void 0;
    exports.IListService = (0, instantiation_1.createDecorator)('listService');
    let ListService = class ListService {
        constructor(_themeService) {
            this._themeService = _themeService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.lists = [];
            this._lastFocusedWidget = undefined;
            this._hasCreatedStyleController = false;
        }
        get lastFocusedList() {
            return this._lastFocusedWidget;
        }
        setLastFocusedList(widget) {
            var _a, _b;
            if (widget === this._lastFocusedWidget) {
                return;
            }
            (_a = this._lastFocusedWidget) === null || _a === void 0 ? void 0 : _a.getHTMLElement().classList.remove('last-focused');
            this._lastFocusedWidget = widget;
            (_b = this._lastFocusedWidget) === null || _b === void 0 ? void 0 : _b.getHTMLElement().classList.add('last-focused');
        }
        register(widget, extraContextKeys) {
            if (!this._hasCreatedStyleController) {
                this._hasCreatedStyleController = true;
                // create a shared default tree style sheet for performance reasons
                const styleController = new listWidget_1.DefaultStyleController((0, dom_1.createStyleSheet)(), '');
                this.disposables.add((0, styler_1.attachListStyler)(styleController, this._themeService));
            }
            if (this.lists.some(l => l.widget === widget)) {
                throw new Error('Cannot register the same widget multiple times');
            }
            // Keep in our lists list
            const registeredList = { widget, extraContextKeys };
            this.lists.push(registeredList);
            // Check for currently being focused
            if (widget.getHTMLElement() === document.activeElement) {
                this.setLastFocusedList(widget);
            }
            return (0, lifecycle_1.combinedDisposable)(widget.onDidFocus(() => this.setLastFocusedList(widget)), (0, lifecycle_1.toDisposable)(() => this.lists.splice(this.lists.indexOf(registeredList), 1)), widget.onDidDispose(() => {
                this.lists = this.lists.filter(l => l !== registeredList);
                if (this._lastFocusedWidget === widget) {
                    this.setLastFocusedList(undefined);
                }
            }));
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    ListService = __decorate([
        __param(0, themeService_1.IThemeService)
    ], ListService);
    exports.ListService = ListService;
    const RawWorkbenchListFocusContextKey = new contextkey_1.RawContextKey('listFocus', true);
    exports.WorkbenchListSupportsMultiSelectContextKey = new contextkey_1.RawContextKey('listSupportsMultiselect', true);
    exports.WorkbenchListFocusContextKey = contextkey_1.ContextKeyExpr.and(RawWorkbenchListFocusContextKey, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey));
    exports.WorkbenchListHasSelectionOrFocus = new contextkey_1.RawContextKey('listHasSelectionOrFocus', false);
    exports.WorkbenchListDoubleSelection = new contextkey_1.RawContextKey('listDoubleSelection', false);
    exports.WorkbenchListMultiSelection = new contextkey_1.RawContextKey('listMultiSelection', false);
    exports.WorkbenchListSelectionNavigation = new contextkey_1.RawContextKey('listSelectionNavigation', false);
    exports.WorkbenchTreeElementCanCollapse = new contextkey_1.RawContextKey('treeElementCanCollapse', false);
    exports.WorkbenchTreeElementHasParent = new contextkey_1.RawContextKey('treeElementHasParent', false);
    exports.WorkbenchTreeElementCanExpand = new contextkey_1.RawContextKey('treeElementCanExpand', false);
    exports.WorkbenchTreeElementHasChild = new contextkey_1.RawContextKey('treeElementHasChild', false);
    exports.WorkbenchListAutomaticKeyboardNavigationKey = 'listAutomaticKeyboardNavigation';
    function createScopedContextKeyService(contextKeyService, widget) {
        const result = contextKeyService.createScoped(widget.getHTMLElement());
        RawWorkbenchListFocusContextKey.bindTo(result);
        return result;
    }
    const multiSelectModifierSettingKey = 'workbench.list.multiSelectModifier';
    const openModeSettingKey = 'workbench.list.openMode';
    const horizontalScrollingKey = 'workbench.list.horizontalScrolling';
    const keyboardNavigationSettingKey = 'workbench.list.keyboardNavigation';
    const automaticKeyboardNavigationSettingKey = 'workbench.list.automaticKeyboardNavigation';
    const treeIndentKey = 'workbench.tree.indent';
    const treeRenderIndentGuidesKey = 'workbench.tree.renderIndentGuides';
    const listSmoothScrolling = 'workbench.list.smoothScrolling';
    const mouseWheelScrollSensitivityKey = 'workbench.list.mouseWheelScrollSensitivity';
    const fastScrollSensitivityKey = 'workbench.list.fastScrollSensitivity';
    const treeExpandMode = 'workbench.tree.expandMode';
    function useAltAsMultipleSelectionModifier(configurationService) {
        return configurationService.getValue(multiSelectModifierSettingKey) === 'alt';
    }
    class MultipleSelectionController extends lifecycle_1.Disposable {
        constructor(configurationService) {
            super();
            this.configurationService = configurationService;
            this.useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(configurationService);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(multiSelectModifierSettingKey)) {
                    this.useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(this.configurationService);
                }
            }));
        }
        isSelectionSingleChangeEvent(event) {
            if (this.useAltAsMultipleSelectionModifier) {
                return event.browserEvent.altKey;
            }
            return (0, listWidget_1.isSelectionSingleChangeEvent)(event);
        }
        isSelectionRangeChangeEvent(event) {
            return (0, listWidget_1.isSelectionRangeChangeEvent)(event);
        }
    }
    function toWorkbenchListOptions(options, configurationService, keybindingService) {
        var _a;
        const disposables = new lifecycle_1.DisposableStore();
        const result = Object.assign(Object.assign({}, options), { keyboardNavigationDelegate: { mightProducePrintableCharacter(e) { return keybindingService.mightProducePrintableCharacter(e); } }, smoothScrolling: Boolean(configurationService.getValue(listSmoothScrolling)), mouseWheelScrollSensitivity: configurationService.getValue(mouseWheelScrollSensitivityKey), fastScrollSensitivity: configurationService.getValue(fastScrollSensitivityKey), multipleSelectionController: (_a = options.multipleSelectionController) !== null && _a !== void 0 ? _a : disposables.add(new MultipleSelectionController(configurationService)) });
        return [result, disposables];
    }
    let WorkbenchList = class WorkbenchList extends listWidget_1.List {
        constructor(user, container, delegate, renderers, options, contextKeyService, listService, themeService, configurationService, keybindingService) {
            const horizontalScrolling = typeof options.horizontalScrolling !== 'undefined' ? options.horizontalScrolling : Boolean(configurationService.getValue(horizontalScrollingKey));
            const [workbenchListOptions, workbenchListOptionsDisposable] = toWorkbenchListOptions(options, configurationService, keybindingService);
            super(user, container, delegate, renderers, Object.assign(Object.assign(Object.assign({ keyboardSupport: false }, (0, styler_1.computeStyles)(themeService.getColorTheme(), styler_1.defaultListStyles)), workbenchListOptions), { horizontalScrolling }));
            this.disposables.add(workbenchListOptionsDisposable);
            this.contextKeyService = createScopedContextKeyService(contextKeyService, this);
            this.themeService = themeService;
            this.listSupportsMultiSelect = exports.WorkbenchListSupportsMultiSelectContextKey.bindTo(this.contextKeyService);
            this.listSupportsMultiSelect.set(options.multipleSelectionSupport !== false);
            const listSelectionNavigation = exports.WorkbenchListSelectionNavigation.bindTo(this.contextKeyService);
            listSelectionNavigation.set(Boolean(options.selectionNavigation));
            this.listHasSelectionOrFocus = exports.WorkbenchListHasSelectionOrFocus.bindTo(this.contextKeyService);
            this.listDoubleSelection = exports.WorkbenchListDoubleSelection.bindTo(this.contextKeyService);
            this.listMultiSelection = exports.WorkbenchListMultiSelection.bindTo(this.contextKeyService);
            this.horizontalScrolling = options.horizontalScrolling;
            this._useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(configurationService);
            this.disposables.add(this.contextKeyService);
            this.disposables.add(listService.register(this));
            if (options.overrideStyles) {
                this.updateStyles(options.overrideStyles);
            }
            this.disposables.add(this.onDidChangeSelection(() => {
                const selection = this.getSelection();
                const focus = this.getFocus();
                this.contextKeyService.bufferChangeEvents(() => {
                    this.listHasSelectionOrFocus.set(selection.length > 0 || focus.length > 0);
                    this.listMultiSelection.set(selection.length > 1);
                    this.listDoubleSelection.set(selection.length === 2);
                });
            }));
            this.disposables.add(this.onDidChangeFocus(() => {
                const selection = this.getSelection();
                const focus = this.getFocus();
                this.listHasSelectionOrFocus.set(selection.length > 0 || focus.length > 0);
            }));
            this.disposables.add(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(multiSelectModifierSettingKey)) {
                    this._useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(configurationService);
                }
                let options = {};
                if (e.affectsConfiguration(horizontalScrollingKey) && this.horizontalScrolling === undefined) {
                    const horizontalScrolling = Boolean(configurationService.getValue(horizontalScrollingKey));
                    options = Object.assign(Object.assign({}, options), { horizontalScrolling });
                }
                if (e.affectsConfiguration(listSmoothScrolling)) {
                    const smoothScrolling = Boolean(configurationService.getValue(listSmoothScrolling));
                    options = Object.assign(Object.assign({}, options), { smoothScrolling });
                }
                if (e.affectsConfiguration(mouseWheelScrollSensitivityKey)) {
                    const mouseWheelScrollSensitivity = configurationService.getValue(mouseWheelScrollSensitivityKey);
                    options = Object.assign(Object.assign({}, options), { mouseWheelScrollSensitivity });
                }
                if (e.affectsConfiguration(fastScrollSensitivityKey)) {
                    const fastScrollSensitivity = configurationService.getValue(fastScrollSensitivityKey);
                    options = Object.assign(Object.assign({}, options), { fastScrollSensitivity });
                }
                if (Object.keys(options).length > 0) {
                    this.updateOptions(options);
                }
            }));
            this.navigator = new ListResourceNavigator(this, Object.assign({ configurationService }, options));
            this.disposables.add(this.navigator);
        }
        get onDidOpen() { return this.navigator.onDidOpen; }
        updateOptions(options) {
            super.updateOptions(options);
            if (options.overrideStyles) {
                this.updateStyles(options.overrideStyles);
            }
            if (options.multipleSelectionSupport !== undefined) {
                this.listSupportsMultiSelect.set(!!options.multipleSelectionSupport);
            }
        }
        updateStyles(styles) {
            var _a;
            (_a = this._styler) === null || _a === void 0 ? void 0 : _a.dispose();
            this._styler = (0, styler_1.attachListStyler)(this, this.themeService, styles);
        }
        get useAltAsMultipleSelectionModifier() {
            return this._useAltAsMultipleSelectionModifier;
        }
        dispose() {
            var _a;
            (_a = this._styler) === null || _a === void 0 ? void 0 : _a.dispose();
            super.dispose();
        }
    };
    WorkbenchList = __decorate([
        __param(5, contextkey_1.IContextKeyService),
        __param(6, exports.IListService),
        __param(7, themeService_1.IThemeService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, keybinding_1.IKeybindingService)
    ], WorkbenchList);
    exports.WorkbenchList = WorkbenchList;
    let WorkbenchPagedList = class WorkbenchPagedList extends listPaging_1.PagedList {
        constructor(user, container, delegate, renderers, options, contextKeyService, listService, themeService, configurationService, keybindingService) {
            const horizontalScrolling = typeof options.horizontalScrolling !== 'undefined' ? options.horizontalScrolling : Boolean(configurationService.getValue(horizontalScrollingKey));
            const [workbenchListOptions, workbenchListOptionsDisposable] = toWorkbenchListOptions(options, configurationService, keybindingService);
            super(user, container, delegate, renderers, Object.assign(Object.assign(Object.assign({ keyboardSupport: false }, (0, styler_1.computeStyles)(themeService.getColorTheme(), styler_1.defaultListStyles)), workbenchListOptions), { horizontalScrolling }));
            this.disposables = new lifecycle_1.DisposableStore();
            this.disposables.add(workbenchListOptionsDisposable);
            this.contextKeyService = createScopedContextKeyService(contextKeyService, this);
            this.themeService = themeService;
            this.horizontalScrolling = options.horizontalScrolling;
            this.listSupportsMultiSelect = exports.WorkbenchListSupportsMultiSelectContextKey.bindTo(this.contextKeyService);
            this.listSupportsMultiSelect.set(options.multipleSelectionSupport !== false);
            const listSelectionNavigation = exports.WorkbenchListSelectionNavigation.bindTo(this.contextKeyService);
            listSelectionNavigation.set(Boolean(options.selectionNavigation));
            this._useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(configurationService);
            this.disposables.add(this.contextKeyService);
            this.disposables.add(listService.register(this));
            if (options.overrideStyles) {
                this.updateStyles(options.overrideStyles);
            }
            if (options.overrideStyles) {
                this.disposables.add((0, styler_1.attachListStyler)(this, themeService, options.overrideStyles));
            }
            this.disposables.add(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(multiSelectModifierSettingKey)) {
                    this._useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(configurationService);
                }
                let options = {};
                if (e.affectsConfiguration(horizontalScrollingKey) && this.horizontalScrolling === undefined) {
                    const horizontalScrolling = Boolean(configurationService.getValue(horizontalScrollingKey));
                    options = Object.assign(Object.assign({}, options), { horizontalScrolling });
                }
                if (e.affectsConfiguration(listSmoothScrolling)) {
                    const smoothScrolling = Boolean(configurationService.getValue(listSmoothScrolling));
                    options = Object.assign(Object.assign({}, options), { smoothScrolling });
                }
                if (e.affectsConfiguration(mouseWheelScrollSensitivityKey)) {
                    const mouseWheelScrollSensitivity = configurationService.getValue(mouseWheelScrollSensitivityKey);
                    options = Object.assign(Object.assign({}, options), { mouseWheelScrollSensitivity });
                }
                if (e.affectsConfiguration(fastScrollSensitivityKey)) {
                    const fastScrollSensitivity = configurationService.getValue(fastScrollSensitivityKey);
                    options = Object.assign(Object.assign({}, options), { fastScrollSensitivity });
                }
                if (Object.keys(options).length > 0) {
                    this.updateOptions(options);
                }
            }));
            this.navigator = new ListResourceNavigator(this, Object.assign({ configurationService }, options));
            this.disposables.add(this.navigator);
        }
        get onDidOpen() { return this.navigator.onDidOpen; }
        updateOptions(options) {
            super.updateOptions(options);
            if (options.overrideStyles) {
                this.updateStyles(options.overrideStyles);
            }
            if (options.multipleSelectionSupport !== undefined) {
                this.listSupportsMultiSelect.set(!!options.multipleSelectionSupport);
            }
        }
        updateStyles(styles) {
            var _a;
            (_a = this._styler) === null || _a === void 0 ? void 0 : _a.dispose();
            this._styler = (0, styler_1.attachListStyler)(this, this.themeService, styles);
        }
        get useAltAsMultipleSelectionModifier() {
            return this._useAltAsMultipleSelectionModifier;
        }
        dispose() {
            var _a;
            (_a = this._styler) === null || _a === void 0 ? void 0 : _a.dispose();
            this.disposables.dispose();
            super.dispose();
        }
    };
    WorkbenchPagedList = __decorate([
        __param(5, contextkey_1.IContextKeyService),
        __param(6, exports.IListService),
        __param(7, themeService_1.IThemeService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, keybinding_1.IKeybindingService)
    ], WorkbenchPagedList);
    exports.WorkbenchPagedList = WorkbenchPagedList;
    let WorkbenchTable = class WorkbenchTable extends tableWidget_1.Table {
        constructor(user, container, delegate, columns, renderers, options, contextKeyService, listService, themeService, configurationService, keybindingService) {
            const horizontalScrolling = typeof options.horizontalScrolling !== 'undefined' ? options.horizontalScrolling : Boolean(configurationService.getValue(horizontalScrollingKey));
            const [workbenchListOptions, workbenchListOptionsDisposable] = toWorkbenchListOptions(options, configurationService, keybindingService);
            super(user, container, delegate, columns, renderers, Object.assign(Object.assign(Object.assign({ keyboardSupport: false }, (0, styler_1.computeStyles)(themeService.getColorTheme(), styler_1.defaultListStyles)), workbenchListOptions), { horizontalScrolling }));
            this.disposables.add(workbenchListOptionsDisposable);
            this.contextKeyService = createScopedContextKeyService(contextKeyService, this);
            this.themeService = themeService;
            this.listSupportsMultiSelect = exports.WorkbenchListSupportsMultiSelectContextKey.bindTo(this.contextKeyService);
            this.listSupportsMultiSelect.set(options.multipleSelectionSupport !== false);
            const listSelectionNavigation = exports.WorkbenchListSelectionNavigation.bindTo(this.contextKeyService);
            listSelectionNavigation.set(Boolean(options.selectionNavigation));
            this.listHasSelectionOrFocus = exports.WorkbenchListHasSelectionOrFocus.bindTo(this.contextKeyService);
            this.listDoubleSelection = exports.WorkbenchListDoubleSelection.bindTo(this.contextKeyService);
            this.listMultiSelection = exports.WorkbenchListMultiSelection.bindTo(this.contextKeyService);
            this.horizontalScrolling = options.horizontalScrolling;
            this._useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(configurationService);
            this.disposables.add(this.contextKeyService);
            this.disposables.add(listService.register(this));
            if (options.overrideStyles) {
                this.updateStyles(options.overrideStyles);
            }
            this.disposables.add(this.onDidChangeSelection(() => {
                const selection = this.getSelection();
                const focus = this.getFocus();
                this.contextKeyService.bufferChangeEvents(() => {
                    this.listHasSelectionOrFocus.set(selection.length > 0 || focus.length > 0);
                    this.listMultiSelection.set(selection.length > 1);
                    this.listDoubleSelection.set(selection.length === 2);
                });
            }));
            this.disposables.add(this.onDidChangeFocus(() => {
                const selection = this.getSelection();
                const focus = this.getFocus();
                this.listHasSelectionOrFocus.set(selection.length > 0 || focus.length > 0);
            }));
            this.disposables.add(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(multiSelectModifierSettingKey)) {
                    this._useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(configurationService);
                }
                let options = {};
                if (e.affectsConfiguration(horizontalScrollingKey) && this.horizontalScrolling === undefined) {
                    const horizontalScrolling = Boolean(configurationService.getValue(horizontalScrollingKey));
                    options = Object.assign(Object.assign({}, options), { horizontalScrolling });
                }
                if (e.affectsConfiguration(listSmoothScrolling)) {
                    const smoothScrolling = Boolean(configurationService.getValue(listSmoothScrolling));
                    options = Object.assign(Object.assign({}, options), { smoothScrolling });
                }
                if (e.affectsConfiguration(mouseWheelScrollSensitivityKey)) {
                    const mouseWheelScrollSensitivity = configurationService.getValue(mouseWheelScrollSensitivityKey);
                    options = Object.assign(Object.assign({}, options), { mouseWheelScrollSensitivity });
                }
                if (e.affectsConfiguration(fastScrollSensitivityKey)) {
                    const fastScrollSensitivity = configurationService.getValue(fastScrollSensitivityKey);
                    options = Object.assign(Object.assign({}, options), { fastScrollSensitivity });
                }
                if (Object.keys(options).length > 0) {
                    this.updateOptions(options);
                }
            }));
            this.navigator = new TableResourceNavigator(this, Object.assign({ configurationService }, options));
            this.disposables.add(this.navigator);
        }
        get onDidOpen() { return this.navigator.onDidOpen; }
        updateOptions(options) {
            super.updateOptions(options);
            if (options.overrideStyles) {
                this.updateStyles(options.overrideStyles);
            }
            if (options.multipleSelectionSupport !== undefined) {
                this.listSupportsMultiSelect.set(!!options.multipleSelectionSupport);
            }
        }
        updateStyles(styles) {
            var _a;
            (_a = this._styler) === null || _a === void 0 ? void 0 : _a.dispose();
            this._styler = (0, styler_1.attachListStyler)(this, this.themeService, styles);
        }
        get useAltAsMultipleSelectionModifier() {
            return this._useAltAsMultipleSelectionModifier;
        }
        dispose() {
            var _a;
            (_a = this._styler) === null || _a === void 0 ? void 0 : _a.dispose();
            this.disposables.dispose();
            super.dispose();
        }
    };
    WorkbenchTable = __decorate([
        __param(6, contextkey_1.IContextKeyService),
        __param(7, exports.IListService),
        __param(8, themeService_1.IThemeService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, keybinding_1.IKeybindingService)
    ], WorkbenchTable);
    exports.WorkbenchTable = WorkbenchTable;
    function getSelectionKeyboardEvent(typeArg = 'keydown', preserveFocus, pinned) {
        const e = new KeyboardEvent(typeArg);
        e.preserveFocus = preserveFocus;
        e.pinned = pinned;
        e.__forceEvent = true;
        return e;
    }
    exports.getSelectionKeyboardEvent = getSelectionKeyboardEvent;
    class ResourceNavigator extends lifecycle_1.Disposable {
        constructor(widget, options) {
            var _a;
            super();
            this.widget = widget;
            this._onDidOpen = this._register(new event_1.Emitter());
            this.onDidOpen = this._onDidOpen.event;
            this._register(event_1.Event.filter(this.widget.onDidChangeSelection, e => e.browserEvent instanceof KeyboardEvent)(e => this.onSelectionFromKeyboard(e)));
            this._register(this.widget.onPointer((e) => this.onPointer(e.element, e.browserEvent)));
            this._register(this.widget.onMouseDblClick((e) => this.onMouseDblClick(e.element, e.browserEvent)));
            if (typeof (options === null || options === void 0 ? void 0 : options.openOnSingleClick) !== 'boolean' && (options === null || options === void 0 ? void 0 : options.configurationService)) {
                this.openOnSingleClick = (options === null || options === void 0 ? void 0 : options.configurationService.getValue(openModeSettingKey)) !== 'doubleClick';
                this._register(options === null || options === void 0 ? void 0 : options.configurationService.onDidChangeConfiguration(() => {
                    this.openOnSingleClick = (options === null || options === void 0 ? void 0 : options.configurationService.getValue(openModeSettingKey)) !== 'doubleClick';
                }));
            }
            else {
                this.openOnSingleClick = (_a = options === null || options === void 0 ? void 0 : options.openOnSingleClick) !== null && _a !== void 0 ? _a : true;
            }
        }
        onSelectionFromKeyboard(event) {
            if (event.elements.length !== 1) {
                return;
            }
            const selectionKeyboardEvent = event.browserEvent;
            const preserveFocus = typeof selectionKeyboardEvent.preserveFocus === 'boolean' ? selectionKeyboardEvent.preserveFocus : true;
            const pinned = typeof selectionKeyboardEvent.pinned === 'boolean' ? selectionKeyboardEvent.pinned : !preserveFocus;
            const sideBySide = false;
            this._open(this.getSelectedElement(), preserveFocus, pinned, sideBySide, event.browserEvent);
        }
        onPointer(element, browserEvent) {
            if (!this.openOnSingleClick) {
                return;
            }
            const isDoubleClick = browserEvent.detail === 2;
            if (isDoubleClick) {
                return;
            }
            const isMiddleClick = browserEvent.button === 1;
            const preserveFocus = true;
            const pinned = isMiddleClick;
            const sideBySide = browserEvent.ctrlKey || browserEvent.metaKey || browserEvent.altKey;
            this._open(element, preserveFocus, pinned, sideBySide, browserEvent);
        }
        onMouseDblClick(element, browserEvent) {
            if (!browserEvent) {
                return;
            }
            // copied from AbstractTree
            const target = browserEvent.target;
            const onTwistie = target.classList.contains('monaco-tl-twistie')
                || (target.classList.contains('monaco-icon-label') && target.classList.contains('folder-icon') && browserEvent.offsetX < 16);
            if (onTwistie) {
                return;
            }
            const preserveFocus = false;
            const pinned = true;
            const sideBySide = (browserEvent.ctrlKey || browserEvent.metaKey || browserEvent.altKey);
            this._open(element, preserveFocus, pinned, sideBySide, browserEvent);
        }
        _open(element, preserveFocus, pinned, sideBySide, browserEvent) {
            if (!element) {
                return;
            }
            this._onDidOpen.fire({
                editorOptions: {
                    preserveFocus,
                    pinned,
                    revealIfVisible: true
                },
                sideBySide,
                element,
                browserEvent
            });
        }
    }
    class ListResourceNavigator extends ResourceNavigator {
        constructor(widget, options) {
            super(widget, options);
            this.widget = widget;
        }
        getSelectedElement() {
            return this.widget.getSelectedElements()[0];
        }
    }
    class TableResourceNavigator extends ResourceNavigator {
        constructor(widget, options) {
            super(widget, options);
        }
        getSelectedElement() {
            return this.widget.getSelectedElements()[0];
        }
    }
    class TreeResourceNavigator extends ResourceNavigator {
        constructor(widget, options) {
            super(widget, options);
        }
        getSelectedElement() {
            var _a;
            return (_a = this.widget.getSelection()[0]) !== null && _a !== void 0 ? _a : undefined;
        }
    }
    function createKeyboardNavigationEventFilter(container, keybindingService) {
        let inChord = false;
        return event => {
            if (event.toKeybinding().isModifierKey()) {
                return false;
            }
            if (inChord) {
                inChord = false;
                return false;
            }
            const result = keybindingService.softDispatch(event, container);
            if (result && result.enterChord) {
                inChord = true;
                return false;
            }
            inChord = false;
            return true;
        };
    }
    let WorkbenchObjectTree = class WorkbenchObjectTree extends objectTree_1.ObjectTree {
        constructor(user, container, delegate, renderers, options, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService) {
            const { options: treeOptions, getAutomaticKeyboardNavigation, disposable } = workbenchTreeDataPreamble(container, options, contextKeyService, configurationService, keybindingService, accessibilityService);
            super(user, container, delegate, renderers, treeOptions);
            this.disposables.add(disposable);
            this.internals = new WorkbenchTreeInternals(this, options, getAutomaticKeyboardNavigation, options.overrideStyles, contextKeyService, listService, themeService, configurationService, accessibilityService);
            this.disposables.add(this.internals);
        }
        get contextKeyService() { return this.internals.contextKeyService; }
        get useAltAsMultipleSelectionModifier() { return this.internals.useAltAsMultipleSelectionModifier; }
        get onDidOpen() { return this.internals.onDidOpen; }
        updateOptions(options) {
            super.updateOptions(options);
            this.internals.updateOptions(options);
        }
    };
    WorkbenchObjectTree = __decorate([
        __param(5, contextkey_1.IContextKeyService),
        __param(6, exports.IListService),
        __param(7, themeService_1.IThemeService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, accessibility_1.IAccessibilityService)
    ], WorkbenchObjectTree);
    exports.WorkbenchObjectTree = WorkbenchObjectTree;
    let WorkbenchCompressibleObjectTree = class WorkbenchCompressibleObjectTree extends objectTree_1.CompressibleObjectTree {
        constructor(user, container, delegate, renderers, options, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService) {
            const { options: treeOptions, getAutomaticKeyboardNavigation, disposable } = workbenchTreeDataPreamble(container, options, contextKeyService, configurationService, keybindingService, accessibilityService);
            super(user, container, delegate, renderers, treeOptions);
            this.disposables.add(disposable);
            this.internals = new WorkbenchTreeInternals(this, options, getAutomaticKeyboardNavigation, options.overrideStyles, contextKeyService, listService, themeService, configurationService, accessibilityService);
            this.disposables.add(this.internals);
        }
        get contextKeyService() { return this.internals.contextKeyService; }
        get useAltAsMultipleSelectionModifier() { return this.internals.useAltAsMultipleSelectionModifier; }
        get onDidOpen() { return this.internals.onDidOpen; }
        updateOptions(options = {}) {
            super.updateOptions(options);
            if (options.overrideStyles) {
                this.internals.updateStyleOverrides(options.overrideStyles);
            }
            this.internals.updateOptions(options);
        }
    };
    WorkbenchCompressibleObjectTree = __decorate([
        __param(5, contextkey_1.IContextKeyService),
        __param(6, exports.IListService),
        __param(7, themeService_1.IThemeService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, accessibility_1.IAccessibilityService)
    ], WorkbenchCompressibleObjectTree);
    exports.WorkbenchCompressibleObjectTree = WorkbenchCompressibleObjectTree;
    let WorkbenchDataTree = class WorkbenchDataTree extends dataTree_1.DataTree {
        constructor(user, container, delegate, renderers, dataSource, options, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService) {
            const { options: treeOptions, getAutomaticKeyboardNavigation, disposable } = workbenchTreeDataPreamble(container, options, contextKeyService, configurationService, keybindingService, accessibilityService);
            super(user, container, delegate, renderers, dataSource, treeOptions);
            this.disposables.add(disposable);
            this.internals = new WorkbenchTreeInternals(this, options, getAutomaticKeyboardNavigation, options.overrideStyles, contextKeyService, listService, themeService, configurationService, accessibilityService);
            this.disposables.add(this.internals);
        }
        get contextKeyService() { return this.internals.contextKeyService; }
        get useAltAsMultipleSelectionModifier() { return this.internals.useAltAsMultipleSelectionModifier; }
        get onDidOpen() { return this.internals.onDidOpen; }
        updateOptions(options = {}) {
            super.updateOptions(options);
            if (options.overrideStyles) {
                this.internals.updateStyleOverrides(options.overrideStyles);
            }
            this.internals.updateOptions(options);
        }
    };
    WorkbenchDataTree = __decorate([
        __param(6, contextkey_1.IContextKeyService),
        __param(7, exports.IListService),
        __param(8, themeService_1.IThemeService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, keybinding_1.IKeybindingService),
        __param(11, accessibility_1.IAccessibilityService)
    ], WorkbenchDataTree);
    exports.WorkbenchDataTree = WorkbenchDataTree;
    let WorkbenchAsyncDataTree = class WorkbenchAsyncDataTree extends asyncDataTree_1.AsyncDataTree {
        constructor(user, container, delegate, renderers, dataSource, options, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService) {
            const { options: treeOptions, getAutomaticKeyboardNavigation, disposable } = workbenchTreeDataPreamble(container, options, contextKeyService, configurationService, keybindingService, accessibilityService);
            super(user, container, delegate, renderers, dataSource, treeOptions);
            this.disposables.add(disposable);
            this.internals = new WorkbenchTreeInternals(this, options, getAutomaticKeyboardNavigation, options.overrideStyles, contextKeyService, listService, themeService, configurationService, accessibilityService);
            this.disposables.add(this.internals);
        }
        get contextKeyService() { return this.internals.contextKeyService; }
        get useAltAsMultipleSelectionModifier() { return this.internals.useAltAsMultipleSelectionModifier; }
        get onDidOpen() { return this.internals.onDidOpen; }
        updateOptions(options = {}) {
            super.updateOptions(options);
            if (options.overrideStyles) {
                this.internals.updateStyleOverrides(options.overrideStyles);
            }
            this.internals.updateOptions(options);
        }
    };
    WorkbenchAsyncDataTree = __decorate([
        __param(6, contextkey_1.IContextKeyService),
        __param(7, exports.IListService),
        __param(8, themeService_1.IThemeService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, keybinding_1.IKeybindingService),
        __param(11, accessibility_1.IAccessibilityService)
    ], WorkbenchAsyncDataTree);
    exports.WorkbenchAsyncDataTree = WorkbenchAsyncDataTree;
    let WorkbenchCompressibleAsyncDataTree = class WorkbenchCompressibleAsyncDataTree extends asyncDataTree_1.CompressibleAsyncDataTree {
        constructor(user, container, virtualDelegate, compressionDelegate, renderers, dataSource, options, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService) {
            const { options: treeOptions, getAutomaticKeyboardNavigation, disposable } = workbenchTreeDataPreamble(container, options, contextKeyService, configurationService, keybindingService, accessibilityService);
            super(user, container, virtualDelegate, compressionDelegate, renderers, dataSource, treeOptions);
            this.disposables.add(disposable);
            this.internals = new WorkbenchTreeInternals(this, options, getAutomaticKeyboardNavigation, options.overrideStyles, contextKeyService, listService, themeService, configurationService, accessibilityService);
            this.disposables.add(this.internals);
        }
        get contextKeyService() { return this.internals.contextKeyService; }
        get useAltAsMultipleSelectionModifier() { return this.internals.useAltAsMultipleSelectionModifier; }
        get onDidOpen() { return this.internals.onDidOpen; }
        updateOptions(options) {
            super.updateOptions(options);
            this.internals.updateOptions(options);
        }
    };
    WorkbenchCompressibleAsyncDataTree = __decorate([
        __param(7, contextkey_1.IContextKeyService),
        __param(8, exports.IListService),
        __param(9, themeService_1.IThemeService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, keybinding_1.IKeybindingService),
        __param(12, accessibility_1.IAccessibilityService)
    ], WorkbenchCompressibleAsyncDataTree);
    exports.WorkbenchCompressibleAsyncDataTree = WorkbenchCompressibleAsyncDataTree;
    function workbenchTreeDataPreamble(container, options, contextKeyService, configurationService, keybindingService, accessibilityService) {
        var _a;
        const getAutomaticKeyboardNavigation = () => {
            // give priority to the context key value to disable this completely
            let automaticKeyboardNavigation = Boolean(contextKeyService.getContextKeyValue(exports.WorkbenchListAutomaticKeyboardNavigationKey));
            if (automaticKeyboardNavigation) {
                automaticKeyboardNavigation = Boolean(configurationService.getValue(automaticKeyboardNavigationSettingKey));
            }
            return automaticKeyboardNavigation;
        };
        const accessibilityOn = accessibilityService.isScreenReaderOptimized();
        const keyboardNavigation = options.simpleKeyboardNavigation || accessibilityOn ? 'simple' : configurationService.getValue(keyboardNavigationSettingKey);
        const horizontalScrolling = options.horizontalScrolling !== undefined ? options.horizontalScrolling : Boolean(configurationService.getValue(horizontalScrollingKey));
        const [workbenchListOptions, disposable] = toWorkbenchListOptions(options, configurationService, keybindingService);
        const additionalScrollHeight = options.additionalScrollHeight;
        return {
            getAutomaticKeyboardNavigation,
            disposable,
            options: Object.assign(Object.assign({ 
                // ...options, // TODO@Joao why is this not splatted here?
                keyboardSupport: false }, workbenchListOptions), { indent: typeof configurationService.getValue(treeIndentKey) === 'number' ? configurationService.getValue(treeIndentKey) : undefined, renderIndentGuides: configurationService.getValue(treeRenderIndentGuidesKey), smoothScrolling: Boolean(configurationService.getValue(listSmoothScrolling)), automaticKeyboardNavigation: getAutomaticKeyboardNavigation(), simpleKeyboardNavigation: keyboardNavigation === 'simple', filterOnType: keyboardNavigation === 'filter', horizontalScrolling, keyboardNavigationEventFilter: createKeyboardNavigationEventFilter(container, keybindingService), additionalScrollHeight, hideTwistiesOfChildlessElements: options.hideTwistiesOfChildlessElements, expandOnlyOnTwistieClick: (_a = options.expandOnlyOnTwistieClick) !== null && _a !== void 0 ? _a : (configurationService.getValue(treeExpandMode) === 'doubleClick') })
        };
    }
    let WorkbenchTreeInternals = class WorkbenchTreeInternals {
        constructor(tree, options, getAutomaticKeyboardNavigation, overrideStyles, contextKeyService, listService, themeService, configurationService, accessibilityService) {
            this.tree = tree;
            this.themeService = themeService;
            this.disposables = [];
            this.contextKeyService = createScopedContextKeyService(contextKeyService, tree);
            this.listSupportsMultiSelect = exports.WorkbenchListSupportsMultiSelectContextKey.bindTo(this.contextKeyService);
            this.listSupportsMultiSelect.set(options.multipleSelectionSupport !== false);
            const listSelectionNavigation = exports.WorkbenchListSelectionNavigation.bindTo(this.contextKeyService);
            listSelectionNavigation.set(Boolean(options.selectionNavigation));
            this.hasSelectionOrFocus = exports.WorkbenchListHasSelectionOrFocus.bindTo(this.contextKeyService);
            this.hasDoubleSelection = exports.WorkbenchListDoubleSelection.bindTo(this.contextKeyService);
            this.hasMultiSelection = exports.WorkbenchListMultiSelection.bindTo(this.contextKeyService);
            this.treeElementCanCollapse = exports.WorkbenchTreeElementCanCollapse.bindTo(this.contextKeyService);
            this.treeElementHasParent = exports.WorkbenchTreeElementHasParent.bindTo(this.contextKeyService);
            this.treeElementCanExpand = exports.WorkbenchTreeElementCanExpand.bindTo(this.contextKeyService);
            this.treeElementHasChild = exports.WorkbenchTreeElementHasChild.bindTo(this.contextKeyService);
            this._useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(configurationService);
            const interestingContextKeys = new Set();
            interestingContextKeys.add(exports.WorkbenchListAutomaticKeyboardNavigationKey);
            const updateKeyboardNavigation = () => {
                const accessibilityOn = accessibilityService.isScreenReaderOptimized();
                const keyboardNavigation = accessibilityOn ? 'simple' : configurationService.getValue(keyboardNavigationSettingKey);
                tree.updateOptions({
                    simpleKeyboardNavigation: keyboardNavigation === 'simple',
                    filterOnType: keyboardNavigation === 'filter'
                });
            };
            this.updateStyleOverrides(overrideStyles);
            const updateCollapseContextKeys = () => {
                const focus = tree.getFocus()[0];
                if (!focus) {
                    return;
                }
                const node = tree.getNode(focus);
                this.treeElementCanCollapse.set(node.collapsible && !node.collapsed);
                this.treeElementHasParent.set(!!tree.getParentElement(focus));
                this.treeElementCanExpand.set(node.collapsible && node.collapsed);
                this.treeElementHasChild.set(!!tree.getFirstElementChild(focus));
            };
            this.disposables.push(this.contextKeyService, listService.register(tree), tree.onDidChangeSelection(() => {
                const selection = tree.getSelection();
                const focus = tree.getFocus();
                this.contextKeyService.bufferChangeEvents(() => {
                    this.hasSelectionOrFocus.set(selection.length > 0 || focus.length > 0);
                    this.hasMultiSelection.set(selection.length > 1);
                    this.hasDoubleSelection.set(selection.length === 2);
                });
            }), tree.onDidChangeFocus(() => {
                const selection = tree.getSelection();
                const focus = tree.getFocus();
                this.hasSelectionOrFocus.set(selection.length > 0 || focus.length > 0);
                updateCollapseContextKeys();
            }), tree.onDidChangeCollapseState(updateCollapseContextKeys), tree.onDidChangeModel(updateCollapseContextKeys), configurationService.onDidChangeConfiguration(e => {
                let newOptions = {};
                if (e.affectsConfiguration(multiSelectModifierSettingKey)) {
                    this._useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(configurationService);
                }
                if (e.affectsConfiguration(treeIndentKey)) {
                    const indent = configurationService.getValue(treeIndentKey);
                    newOptions = Object.assign(Object.assign({}, newOptions), { indent });
                }
                if (e.affectsConfiguration(treeRenderIndentGuidesKey)) {
                    const renderIndentGuides = configurationService.getValue(treeRenderIndentGuidesKey);
                    newOptions = Object.assign(Object.assign({}, newOptions), { renderIndentGuides });
                }
                if (e.affectsConfiguration(listSmoothScrolling)) {
                    const smoothScrolling = Boolean(configurationService.getValue(listSmoothScrolling));
                    newOptions = Object.assign(Object.assign({}, newOptions), { smoothScrolling });
                }
                if (e.affectsConfiguration(keyboardNavigationSettingKey)) {
                    updateKeyboardNavigation();
                }
                if (e.affectsConfiguration(automaticKeyboardNavigationSettingKey)) {
                    newOptions = Object.assign(Object.assign({}, newOptions), { automaticKeyboardNavigation: getAutomaticKeyboardNavigation() });
                }
                if (e.affectsConfiguration(horizontalScrollingKey) && options.horizontalScrolling === undefined) {
                    const horizontalScrolling = Boolean(configurationService.getValue(horizontalScrollingKey));
                    newOptions = Object.assign(Object.assign({}, newOptions), { horizontalScrolling });
                }
                if (e.affectsConfiguration(treeExpandMode) && options.expandOnlyOnTwistieClick === undefined) {
                    newOptions = Object.assign(Object.assign({}, newOptions), { expandOnlyOnTwistieClick: configurationService.getValue(treeExpandMode) === 'doubleClick' });
                }
                if (e.affectsConfiguration(mouseWheelScrollSensitivityKey)) {
                    const mouseWheelScrollSensitivity = configurationService.getValue(mouseWheelScrollSensitivityKey);
                    newOptions = Object.assign(Object.assign({}, newOptions), { mouseWheelScrollSensitivity });
                }
                if (e.affectsConfiguration(fastScrollSensitivityKey)) {
                    const fastScrollSensitivity = configurationService.getValue(fastScrollSensitivityKey);
                    newOptions = Object.assign(Object.assign({}, newOptions), { fastScrollSensitivity });
                }
                if (Object.keys(newOptions).length > 0) {
                    tree.updateOptions(newOptions);
                }
            }), this.contextKeyService.onDidChangeContext(e => {
                if (e.affectsSome(interestingContextKeys)) {
                    tree.updateOptions({ automaticKeyboardNavigation: getAutomaticKeyboardNavigation() });
                }
            }), accessibilityService.onDidChangeScreenReaderOptimized(() => updateKeyboardNavigation()));
            this.navigator = new TreeResourceNavigator(tree, Object.assign({ configurationService }, options));
            this.disposables.push(this.navigator);
        }
        get onDidOpen() { return this.navigator.onDidOpen; }
        get useAltAsMultipleSelectionModifier() {
            return this._useAltAsMultipleSelectionModifier;
        }
        updateOptions(options) {
            if (options.multipleSelectionSupport !== undefined) {
                this.listSupportsMultiSelect.set(!!options.multipleSelectionSupport);
            }
        }
        updateStyleOverrides(overrideStyles) {
            (0, lifecycle_1.dispose)(this.styler);
            this.styler = overrideStyles ? (0, styler_1.attachListStyler)(this.tree, this.themeService, overrideStyles) : lifecycle_1.Disposable.None;
        }
        dispose() {
            this.disposables = (0, lifecycle_1.dispose)(this.disposables);
            (0, lifecycle_1.dispose)(this.styler);
            this.styler = undefined;
        }
    };
    WorkbenchTreeInternals = __decorate([
        __param(4, contextkey_1.IContextKeyService),
        __param(5, exports.IListService),
        __param(6, themeService_1.IThemeService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, accessibility_1.IAccessibilityService)
    ], WorkbenchTreeInternals);
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'workbench',
        order: 7,
        title: (0, nls_1.localize)('workbenchConfigurationTitle', "Workbench"),
        type: 'object',
        properties: {
            [multiSelectModifierSettingKey]: {
                type: 'string',
                enum: ['ctrlCmd', 'alt'],
                markdownEnumDescriptions: [
                    (0, nls_1.localize)('multiSelectModifier.ctrlCmd', "Maps to `Control` on Windows and Linux and to `Command` on macOS."),
                    (0, nls_1.localize)('multiSelectModifier.alt', "Maps to `Alt` on Windows and Linux and to `Option` on macOS.")
                ],
                default: 'ctrlCmd',
                description: (0, nls_1.localize)({
                    key: 'multiSelectModifier',
                    comment: [
                        '- `ctrlCmd` refers to a value the setting can take and should not be localized.',
                        '- `Control` and `Command` refer to the modifier keys Ctrl or Cmd on the keyboard and can be localized.'
                    ]
                }, "The modifier to be used to add an item in trees and lists to a multi-selection with the mouse (for example in the explorer, open editors and scm view). The 'Open to Side' mouse gestures - if supported - will adapt such that they do not conflict with the multiselect modifier.")
            },
            [openModeSettingKey]: {
                type: 'string',
                enum: ['singleClick', 'doubleClick'],
                default: 'singleClick',
                description: (0, nls_1.localize)({
                    key: 'openModeModifier',
                    comment: ['`singleClick` and `doubleClick` refers to a value the setting can take and should not be localized.']
                }, "Controls how to open items in trees and lists using the mouse (if supported). Note that some trees and lists might choose to ignore this setting if it is not applicable.")
            },
            [horizontalScrollingKey]: {
                type: 'boolean',
                default: false,
                description: (0, nls_1.localize)('horizontalScrolling setting', "Controls whether lists and trees support horizontal scrolling in the workbench. Warning: turning on this setting has a performance implication.")
            },
            [treeIndentKey]: {
                type: 'number',
                default: 8,
                minimum: 4,
                maximum: 40,
                description: (0, nls_1.localize)('tree indent setting', "Controls tree indentation in pixels.")
            },
            [treeRenderIndentGuidesKey]: {
                type: 'string',
                enum: ['none', 'onHover', 'always'],
                default: 'onHover',
                description: (0, nls_1.localize)('render tree indent guides', "Controls whether the tree should render indent guides.")
            },
            [listSmoothScrolling]: {
                type: 'boolean',
                default: false,
                description: (0, nls_1.localize)('list smoothScrolling setting', "Controls whether lists and trees have smooth scrolling."),
            },
            [mouseWheelScrollSensitivityKey]: {
                type: 'number',
                default: 1,
                markdownDescription: (0, nls_1.localize)('Mouse Wheel Scroll Sensitivity', "A multiplier to be used on the `deltaX` and `deltaY` of mouse wheel scroll events.")
            },
            [fastScrollSensitivityKey]: {
                type: 'number',
                default: 5,
                description: (0, nls_1.localize)('Fast Scroll Sensitivity', "Scrolling speed multiplier when pressing `Alt`.")
            },
            [keyboardNavigationSettingKey]: {
                type: 'string',
                enum: ['simple', 'highlight', 'filter'],
                enumDescriptions: [
                    (0, nls_1.localize)('keyboardNavigationSettingKey.simple', "Simple keyboard navigation focuses elements which match the keyboard input. Matching is done only on prefixes."),
                    (0, nls_1.localize)('keyboardNavigationSettingKey.highlight', "Highlight keyboard navigation highlights elements which match the keyboard input. Further up and down navigation will traverse only the highlighted elements."),
                    (0, nls_1.localize)('keyboardNavigationSettingKey.filter', "Filter keyboard navigation will filter out and hide all the elements which do not match the keyboard input.")
                ],
                default: 'highlight',
                description: (0, nls_1.localize)('keyboardNavigationSettingKey', "Controls the keyboard navigation style for lists and trees in the workbench. Can be simple, highlight and filter.")
            },
            [automaticKeyboardNavigationSettingKey]: {
                type: 'boolean',
                default: true,
                markdownDescription: (0, nls_1.localize)('automatic keyboard navigation setting', "Controls whether keyboard navigation in lists and trees is automatically triggered simply by typing. If set to `false`, keyboard navigation is only triggered when executing the `list.toggleKeyboardNavigation` command, for which you can assign a keyboard shortcut.")
            },
            [treeExpandMode]: {
                type: 'string',
                enum: ['singleClick', 'doubleClick'],
                default: 'singleClick',
                description: (0, nls_1.localize)('expand mode', "Controls how tree folders are expanded when clicking the folder names. Note that some trees and lists might choose to ignore this setting if it is not applicable."),
            }
        }
    });
});
//# sourceMappingURL=listService.js.map