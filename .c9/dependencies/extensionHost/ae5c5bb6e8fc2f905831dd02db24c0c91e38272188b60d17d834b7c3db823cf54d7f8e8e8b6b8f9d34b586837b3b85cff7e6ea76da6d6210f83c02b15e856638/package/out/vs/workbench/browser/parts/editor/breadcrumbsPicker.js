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
define(["require", "exports", "vs/base/common/comparers", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/filters", "vs/base/common/glob", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/platform/theme/common/colorRegistry", "vs/platform/workspace/common/workspace", "vs/workbench/browser/labels", "vs/workbench/browser/parts/editor/breadcrumbs", "vs/platform/theme/common/themeService", "vs/nls", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/textResourceConfiguration", "vs/css!./media/breadcrumbscontrol"], function (require, exports, comparers_1, errors_1, event_1, filters_1, glob, lifecycle_1, path_1, resources_1, uri_1, configuration_1, files_1, instantiation_1, listService_1, colorRegistry_1, workspace_1, labels_1, breadcrumbs_1, themeService_1, nls_1, editorService_1, textResourceConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreadcrumbsOutlinePicker = exports.BreadcrumbsFilePicker = exports.FileSorter = exports.BreadcrumbsPicker = void 0;
    let BreadcrumbsPicker = class BreadcrumbsPicker {
        constructor(parent, resource, _instantiationService, _themeService, _configurationService) {
            this.resource = resource;
            this._instantiationService = _instantiationService;
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._fakeEvent = new UIEvent('fakeEvent');
            this._onWillPickElement = new event_1.Emitter();
            this.onWillPickElement = this._onWillPickElement.event;
            this._previewDispoables = new lifecycle_1.MutableDisposable();
            this._domNode = document.createElement('div');
            this._domNode.className = 'monaco-breadcrumbs-picker show-file-icons';
            parent.appendChild(this._domNode);
        }
        dispose() {
            this._disposables.dispose();
            this._previewDispoables.dispose();
            this._onWillPickElement.dispose();
            this._domNode.remove();
            setTimeout(() => this._tree.dispose(), 0); // tree cannot be disposed while being opened...
        }
        async show(input, maxHeight, width, arrowSize, arrowOffset) {
            const theme = this._themeService.getColorTheme();
            const color = theme.getColor(colorRegistry_1.breadcrumbsPickerBackground);
            this._arrow = document.createElement('div');
            this._arrow.className = 'arrow';
            this._arrow.style.borderColor = `transparent transparent ${color ? color.toString() : ''}`;
            this._domNode.appendChild(this._arrow);
            this._treeContainer = document.createElement('div');
            this._treeContainer.style.background = color ? color.toString() : '';
            this._treeContainer.style.paddingTop = '2px';
            this._treeContainer.style.boxShadow = `0 0 8px 2px ${this._themeService.getColorTheme().getColor(colorRegistry_1.widgetShadow)}`;
            this._domNode.appendChild(this._treeContainer);
            this._layoutInfo = { maxHeight, width, arrowSize, arrowOffset, inputHeight: 0 };
            this._tree = this._createTree(this._treeContainer, input);
            this._disposables.add(this._tree.onDidOpen(async (e) => {
                const { element, editorOptions, sideBySide } = e;
                const didReveal = await this._revealElement(element, Object.assign(Object.assign({}, editorOptions), { preserveFocus: false }), sideBySide);
                if (!didReveal) {
                    return;
                }
            }));
            this._disposables.add(this._tree.onDidChangeFocus(e => {
                this._previewDispoables.value = this._previewElement(e.elements[0]);
            }));
            this._disposables.add(this._tree.onDidChangeContentHeight(() => {
                this._layout();
            }));
            this._domNode.focus();
            try {
                await this._setInput(input);
                this._layout();
            }
            catch (err) {
                (0, errors_1.onUnexpectedError)(err);
            }
        }
        _layout() {
            const headerHeight = 2 * this._layoutInfo.arrowSize;
            const treeHeight = Math.min(this._layoutInfo.maxHeight - headerHeight, this._tree.contentHeight);
            const totalHeight = treeHeight + headerHeight;
            this._domNode.style.height = `${totalHeight}px`;
            this._domNode.style.width = `${this._layoutInfo.width}px`;
            this._arrow.style.top = `-${2 * this._layoutInfo.arrowSize}px`;
            this._arrow.style.borderWidth = `${this._layoutInfo.arrowSize}px`;
            this._arrow.style.marginLeft = `${this._layoutInfo.arrowOffset}px`;
            this._treeContainer.style.height = `${treeHeight}px`;
            this._treeContainer.style.width = `${this._layoutInfo.width}px`;
            this._tree.layout(treeHeight, this._layoutInfo.width);
        }
        restoreViewState() { }
    };
    BreadcrumbsPicker = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, themeService_1.IThemeService),
        __param(4, configuration_1.IConfigurationService)
    ], BreadcrumbsPicker);
    exports.BreadcrumbsPicker = BreadcrumbsPicker;
    //#region - Files
    class FileVirtualDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(_element) {
            return 'FileStat';
        }
    }
    class FileIdentityProvider {
        getId(element) {
            if (uri_1.URI.isUri(element)) {
                return element.toString();
            }
            else if ((0, workspace_1.isWorkspace)(element)) {
                return element.id;
            }
            else if ((0, workspace_1.isWorkspaceFolder)(element)) {
                return element.uri.toString();
            }
            else {
                return element.resource.toString();
            }
        }
    }
    let FileDataSource = class FileDataSource {
        constructor(_fileService) {
            this._fileService = _fileService;
        }
        hasChildren(element) {
            return uri_1.URI.isUri(element)
                || (0, workspace_1.isWorkspace)(element)
                || (0, workspace_1.isWorkspaceFolder)(element)
                || element.isDirectory;
        }
        async getChildren(element) {
            var _a;
            if ((0, workspace_1.isWorkspace)(element)) {
                return element.folders;
            }
            let uri;
            if ((0, workspace_1.isWorkspaceFolder)(element)) {
                uri = element.uri;
            }
            else if (uri_1.URI.isUri(element)) {
                uri = element;
            }
            else {
                uri = element.resource;
            }
            const stat = await this._fileService.resolve(uri);
            return (_a = stat.children) !== null && _a !== void 0 ? _a : [];
        }
    };
    FileDataSource = __decorate([
        __param(0, files_1.IFileService)
    ], FileDataSource);
    let FileRenderer = class FileRenderer {
        constructor(_labels, _configService) {
            this._labels = _labels;
            this._configService = _configService;
            this.templateId = 'FileStat';
        }
        renderTemplate(container) {
            return this._labels.create(container, { supportHighlights: true });
        }
        renderElement(node, index, templateData) {
            const fileDecorations = this._configService.getValue('explorer.decorations');
            const { element } = node;
            let resource;
            let fileKind;
            if ((0, workspace_1.isWorkspaceFolder)(element)) {
                resource = element.uri;
                fileKind = files_1.FileKind.ROOT_FOLDER;
            }
            else {
                resource = element.resource;
                fileKind = element.isDirectory ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
            }
            templateData.setFile(resource, {
                fileKind,
                hidePath: true,
                fileDecorations: fileDecorations,
                matches: (0, filters_1.createMatches)(node.filterData),
                extraClasses: ['picker-item']
            });
        }
        disposeTemplate(templateData) {
            templateData.dispose();
        }
    };
    FileRenderer = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], FileRenderer);
    class FileNavigationLabelProvider {
        getKeyboardNavigationLabel(element) {
            return element.name;
        }
    }
    class FileAccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('breadcrumbs', "Breadcrumbs");
        }
        getAriaLabel(element) {
            return element.name;
        }
    }
    let FileFilter = class FileFilter {
        constructor(_workspaceService, configService) {
            this._workspaceService = _workspaceService;
            this._cachedExpressions = new Map();
            this._disposables = new lifecycle_1.DisposableStore();
            const config = breadcrumbs_1.BreadcrumbsConfig.FileExcludes.bindTo(configService);
            const update = () => {
                _workspaceService.getWorkspace().folders.forEach(folder => {
                    const excludesConfig = config.getValue({ resource: folder.uri });
                    if (!excludesConfig) {
                        return;
                    }
                    // adjust patterns to be absolute in case they aren't
                    // free floating (**/)
                    const adjustedConfig = {};
                    for (const pattern in excludesConfig) {
                        if (typeof excludesConfig[pattern] !== 'boolean') {
                            continue;
                        }
                        let patternAbs = pattern.indexOf('**/') !== 0
                            ? path_1.posix.join(folder.uri.path, pattern)
                            : pattern;
                        adjustedConfig[patternAbs] = excludesConfig[pattern];
                    }
                    this._cachedExpressions.set(folder.uri.toString(), glob.parse(adjustedConfig));
                });
            };
            update();
            this._disposables.add(config);
            this._disposables.add(config.onDidChange(update));
            this._disposables.add(_workspaceService.onDidChangeWorkspaceFolders(update));
        }
        dispose() {
            this._disposables.dispose();
        }
        filter(element, _parentVisibility) {
            if ((0, workspace_1.isWorkspaceFolder)(element)) {
                // not a file
                return true;
            }
            const folder = this._workspaceService.getWorkspaceFolder(element.resource);
            if (!folder || !this._cachedExpressions.has(folder.uri.toString())) {
                // no folder or no filer
                return true;
            }
            const expression = this._cachedExpressions.get(folder.uri.toString());
            return !expression((0, path_1.relative)(folder.uri.path, element.resource.path), (0, resources_1.basename)(element.resource));
        }
    };
    FileFilter = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, configuration_1.IConfigurationService)
    ], FileFilter);
    class FileSorter {
        compare(a, b) {
            if ((0, workspace_1.isWorkspaceFolder)(a) && (0, workspace_1.isWorkspaceFolder)(b)) {
                return a.index - b.index;
            }
            if (a.isDirectory === b.isDirectory) {
                // same type -> compare on names
                return (0, comparers_1.compareFileNames)(a.name, b.name);
            }
            else if (a.isDirectory) {
                return -1;
            }
            else {
                return 1;
            }
        }
    }
    exports.FileSorter = FileSorter;
    let BreadcrumbsFilePicker = class BreadcrumbsFilePicker extends BreadcrumbsPicker {
        constructor(parent, resource, instantiationService, themeService, configService, _workspaceService, _editorService) {
            super(parent, resource, instantiationService, themeService, configService);
            this._workspaceService = _workspaceService;
            this._editorService = _editorService;
        }
        _createTree(container) {
            // tree icon theme specials
            this._treeContainer.classList.add('file-icon-themable-tree');
            this._treeContainer.classList.add('show-file-icons');
            const onFileIconThemeChange = (fileIconTheme) => {
                this._treeContainer.classList.toggle('align-icons-and-twisties', fileIconTheme.hasFileIcons && !fileIconTheme.hasFolderIcons);
                this._treeContainer.classList.toggle('hide-arrows', fileIconTheme.hidesExplorerArrows === true);
            };
            this._disposables.add(this._themeService.onDidFileIconThemeChange(onFileIconThemeChange));
            onFileIconThemeChange(this._themeService.getFileIconTheme());
            const labels = this._instantiationService.createInstance(labels_1.ResourceLabels, labels_1.DEFAULT_LABELS_CONTAINER /* TODO@Jo visibility propagation */);
            this._disposables.add(labels);
            return this._instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'BreadcrumbsFilePicker', container, new FileVirtualDelegate(), [this._instantiationService.createInstance(FileRenderer, labels)], this._instantiationService.createInstance(FileDataSource), {
                multipleSelectionSupport: false,
                sorter: new FileSorter(),
                filter: this._instantiationService.createInstance(FileFilter),
                identityProvider: new FileIdentityProvider(),
                keyboardNavigationLabelProvider: new FileNavigationLabelProvider(),
                accessibilityProvider: this._instantiationService.createInstance(FileAccessibilityProvider),
                overrideStyles: {
                    listBackground: colorRegistry_1.breadcrumbsPickerBackground
                },
            });
        }
        async _setInput(element) {
            const { uri, kind } = element;
            let input;
            if (kind === files_1.FileKind.ROOT_FOLDER) {
                input = this._workspaceService.getWorkspace();
            }
            else {
                input = (0, resources_1.dirname)(uri);
            }
            const tree = this._tree;
            await tree.setInput(input);
            let focusElement;
            for (const { element } of tree.getNode().children) {
                if ((0, workspace_1.isWorkspaceFolder)(element) && (0, resources_1.isEqual)(element.uri, uri)) {
                    focusElement = element;
                    break;
                }
                else if ((0, resources_1.isEqual)(element.resource, uri)) {
                    focusElement = element;
                    break;
                }
            }
            if (focusElement) {
                tree.reveal(focusElement, 0.5);
                tree.setFocus([focusElement], this._fakeEvent);
            }
            tree.domFocus();
        }
        _previewElement(_element) {
            return lifecycle_1.Disposable.None;
        }
        async _revealElement(element, options, sideBySide) {
            if (!(0, workspace_1.isWorkspaceFolder)(element) && element.isFile) {
                this._onWillPickElement.fire();
                await this._editorService.openEditor({ resource: element.resource, options }, sideBySide ? editorService_1.SIDE_GROUP : undefined);
                return true;
            }
            return false;
        }
    };
    BreadcrumbsFilePicker = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, themeService_1.IThemeService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, editorService_1.IEditorService)
    ], BreadcrumbsFilePicker);
    exports.BreadcrumbsFilePicker = BreadcrumbsFilePicker;
    //#endregion
    //#region - Outline
    let OutlineTreeSorter = class OutlineTreeSorter {
        constructor(comparator, uri, configService) {
            this.comparator = comparator;
            this._order = configService.getValue(uri, 'breadcrumbs.symbolSortOrder');
        }
        compare(a, b) {
            if (this._order === 'name') {
                return this.comparator.compareByName(a, b);
            }
            else if (this._order === 'type') {
                return this.comparator.compareByType(a, b);
            }
            else {
                return this.comparator.compareByPosition(a, b);
            }
        }
    };
    OutlineTreeSorter = __decorate([
        __param(2, textResourceConfiguration_1.ITextResourceConfigurationService)
    ], OutlineTreeSorter);
    class BreadcrumbsOutlinePicker extends BreadcrumbsPicker {
        _createTree(container, input) {
            const { config } = input.outline;
            return this._instantiationService.createInstance(listService_1.WorkbenchDataTree, 'BreadcrumbsOutlinePicker', container, config.delegate, config.renderers, config.treeDataSource, Object.assign(Object.assign({}, config.options), { sorter: this._instantiationService.createInstance(OutlineTreeSorter, config.comparator, undefined), collapseByDefault: true, expandOnlyOnTwistieClick: true, multipleSelectionSupport: false }));
        }
        _setInput(input) {
            const viewState = input.outline.captureViewState();
            this.restoreViewState = () => { viewState.dispose(); };
            const tree = this._tree;
            tree.setInput(input.outline);
            if (input.element !== input.outline) {
                tree.reveal(input.element, 0.5);
                tree.setFocus([input.element], this._fakeEvent);
            }
            tree.domFocus();
            return Promise.resolve();
        }
        _previewElement(element) {
            const outline = this._tree.getInput();
            return outline.preview(element);
        }
        async _revealElement(element, options, sideBySide) {
            this._onWillPickElement.fire();
            const outline = this._tree.getInput();
            await outline.reveal(element, options, sideBySide);
            return true;
        }
    }
    exports.BreadcrumbsOutlinePicker = BreadcrumbsOutlinePicker;
});
//#endregion
//# sourceMappingURL=breadcrumbsPicker.js.map