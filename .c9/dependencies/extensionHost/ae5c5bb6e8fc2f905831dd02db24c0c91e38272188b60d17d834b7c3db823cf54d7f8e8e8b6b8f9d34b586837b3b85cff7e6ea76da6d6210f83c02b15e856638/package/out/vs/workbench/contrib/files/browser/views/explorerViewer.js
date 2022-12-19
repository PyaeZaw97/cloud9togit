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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/glob", "vs/platform/progress/common/progress", "vs/platform/notification/common/notification", "vs/platform/files/common/files", "vs/workbench/services/layout/browser/layoutService", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/themeService", "vs/platform/configuration/common/configuration", "vs/base/common/resources", "vs/base/browser/ui/inputbox/inputBox", "vs/nls", "vs/platform/theme/common/styler", "vs/base/common/functional", "vs/base/common/objects", "vs/base/common/path", "vs/workbench/contrib/files/common/explorerModel", "vs/base/common/comparers", "vs/workbench/browser/dnd", "vs/platform/instantiation/common/instantiation", "vs/base/browser/dnd", "vs/base/common/network", "vs/base/browser/ui/list/listView", "vs/base/common/platform", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/files/browser/fileActions", "vs/base/common/filters", "vs/base/common/event", "vs/platform/label/common/label", "vs/base/common/types", "vs/platform/uriIdentity/common/uriIdentity", "vs/editor/browser/services/bulkEditService", "vs/workbench/contrib/files/browser/files", "vs/workbench/contrib/files/browser/fileImportExport", "vs/base/common/errorMessage", "vs/platform/files/browser/webFileSystemAccess"], function (require, exports, DOM, glob, progress_1, notification_1, files_1, layoutService_1, workspace_1, lifecycle_1, contextView_1, themeService_1, configuration_1, resources_1, inputBox_1, nls_1, styler_1, functional_1, objects_1, path, explorerModel_1, comparers_1, dnd_1, instantiation_1, dnd_2, network_1, listView_1, platform_1, dialogs_1, workspaceEditing_1, editorService_1, fileActions_1, filters_1, event_1, label_1, types_1, uriIdentity_1, bulkEditService_1, files_2, fileImportExport_1, errorMessage_1, webFileSystemAccess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExplorerCompressionDelegate = exports.isCompressedFolderName = exports.FileDragAndDrop = exports.FileSorter = exports.FilesFilter = exports.FilesRenderer = exports.CompressedNavigationController = exports.ExplorerDataSource = exports.explorerRootErrorEmitter = exports.ExplorerDelegate = void 0;
    class ExplorerDelegate {
        getHeight(element) {
            return ExplorerDelegate.ITEM_HEIGHT;
        }
        getTemplateId(element) {
            return FilesRenderer.ID;
        }
    }
    exports.ExplorerDelegate = ExplorerDelegate;
    ExplorerDelegate.ITEM_HEIGHT = 22;
    exports.explorerRootErrorEmitter = new event_1.Emitter();
    let ExplorerDataSource = class ExplorerDataSource {
        constructor(fileFilter, progressService, configService, notificationService, layoutService, fileService, explorerService, contextService) {
            this.fileFilter = fileFilter;
            this.progressService = progressService;
            this.configService = configService;
            this.notificationService = notificationService;
            this.layoutService = layoutService;
            this.fileService = fileService;
            this.explorerService = explorerService;
            this.contextService = contextService;
        }
        hasChildren(element) {
            // don't render nest parents as containing children when all the children are filtered out
            return Array.isArray(element) || element.hasChildren((stat) => this.fileFilter.filter(stat, 1 /* TreeVisibility.Visible */));
        }
        getChildren(element) {
            if (Array.isArray(element)) {
                return element;
            }
            const wasError = element.isError;
            const sortOrder = this.explorerService.sortOrderConfiguration.sortOrder;
            const children = element.fetchChildren(sortOrder);
            if (Array.isArray(children)) {
                // fast path when children are known sync (i.e. nested children)
                return children;
            }
            const promise = children.then(children => {
                // Clear previous error decoration on root folder
                if (element instanceof explorerModel_1.ExplorerItem && element.isRoot && !element.isError && wasError && this.contextService.getWorkbenchState() !== 2 /* WorkbenchState.FOLDER */) {
                    exports.explorerRootErrorEmitter.fire(element.resource);
                }
                return children;
            }, e => {
                if (element instanceof explorerModel_1.ExplorerItem && element.isRoot) {
                    if (this.contextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                        // Single folder create a dummy explorer item to show error
                        const placeholder = new explorerModel_1.ExplorerItem(element.resource, this.fileService, this.configService, undefined, undefined, false);
                        placeholder.isError = true;
                        return [placeholder];
                    }
                    else {
                        exports.explorerRootErrorEmitter.fire(element.resource);
                    }
                }
                else {
                    // Do not show error for roots since we already use an explorer decoration to notify user
                    this.notificationService.error(e);
                }
                return []; // we could not resolve any children because of an error
            });
            this.progressService.withProgress({
                location: 1 /* ProgressLocation.Explorer */,
                delay: this.layoutService.isRestored() ? 800 : 1500 // reduce progress visibility when still restoring
            }, _progress => promise);
            return promise;
        }
    };
    ExplorerDataSource = __decorate([
        __param(1, progress_1.IProgressService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, notification_1.INotificationService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, files_1.IFileService),
        __param(6, files_2.IExplorerService),
        __param(7, workspace_1.IWorkspaceContextService)
    ], ExplorerDataSource);
    exports.ExplorerDataSource = ExplorerDataSource;
    class CompressedNavigationController {
        constructor(id, items, templateData, depth, collapsed) {
            this.id = id;
            this.items = items;
            this.depth = depth;
            this.collapsed = collapsed;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._index = items.length - 1;
            this.updateLabels(templateData);
            this._updateLabelDisposable = templateData.label.onDidRender(() => this.updateLabels(templateData));
        }
        get index() { return this._index; }
        get count() { return this.items.length; }
        get current() { return this.items[this._index]; }
        get currentId() { return `${this.id}_${this.index}`; }
        get labels() { return this._labels; }
        updateLabels(templateData) {
            this._labels = Array.from(templateData.container.querySelectorAll('.label-name'));
            let parents = '';
            for (let i = 0; i < this.labels.length; i++) {
                const ariaLabel = parents.length ? `${this.items[i].name}, compact, ${parents}` : this.items[i].name;
                this.labels[i].setAttribute('aria-label', ariaLabel);
                this.labels[i].setAttribute('aria-level', `${this.depth + i}`);
                parents = parents.length ? `${this.items[i].name} ${parents}` : this.items[i].name;
            }
            this.updateCollapsed(this.collapsed);
            if (this._index < this.labels.length) {
                this.labels[this._index].classList.add('active');
            }
        }
        previous() {
            if (this._index <= 0) {
                return;
            }
            this.setIndex(this._index - 1);
        }
        next() {
            if (this._index >= this.items.length - 1) {
                return;
            }
            this.setIndex(this._index + 1);
        }
        first() {
            if (this._index === 0) {
                return;
            }
            this.setIndex(0);
        }
        last() {
            if (this._index === this.items.length - 1) {
                return;
            }
            this.setIndex(this.items.length - 1);
        }
        setIndex(index) {
            if (index < 0 || index >= this.items.length) {
                return;
            }
            this.labels[this._index].classList.remove('active');
            this._index = index;
            this.labels[this._index].classList.add('active');
            this._onDidChange.fire();
        }
        updateCollapsed(collapsed) {
            this.collapsed = collapsed;
            for (let i = 0; i < this.labels.length; i++) {
                this.labels[i].setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            }
        }
        dispose() {
            this._onDidChange.dispose();
            this._updateLabelDisposable.dispose();
        }
    }
    exports.CompressedNavigationController = CompressedNavigationController;
    CompressedNavigationController.ID = 0;
    let FilesRenderer = class FilesRenderer {
        constructor(labels, updateWidth, contextViewService, themeService, configurationService, explorerService, labelService, contextService) {
            this.labels = labels;
            this.updateWidth = updateWidth;
            this.contextViewService = contextViewService;
            this.themeService = themeService;
            this.configurationService = configurationService;
            this.explorerService = explorerService;
            this.labelService = labelService;
            this.contextService = contextService;
            this.compressedNavigationControllers = new Map();
            this._onDidChangeActiveDescendant = new event_1.EventMultiplexer();
            this.onDidChangeActiveDescendant = this._onDidChangeActiveDescendant.event;
            this.config = this.configurationService.getValue();
            this.styler = DOM.createStyleSheet();
            const buildOffsetStyles = () => {
                const indent = this.configurationService.getValue('workbench.tree.indent');
                const offset = Math.max(22 - indent, 0); // derived via inspection
                const rule = `.explorer-viewlet .explorer-item.align-nest-icon-with-parent-icon { margin-left: ${offset}px }`;
                if (this.styler.innerText !== rule) {
                    this.styler.innerText = rule;
                }
            };
            this.configListener = this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('explorer')) {
                    this.config = this.configurationService.getValue();
                }
                if (e.affectsConfiguration('workbench.tree.indent')) {
                    buildOffsetStyles();
                }
            });
            buildOffsetStyles();
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('treeAriaLabel', "Files Explorer");
        }
        get templateId() {
            return FilesRenderer.ID;
        }
        renderTemplate(container) {
            const elementDisposable = lifecycle_1.Disposable.None;
            const label = this.labels.create(container, { supportHighlights: true });
            return { elementDisposable, label, container };
        }
        renderElement(node, index, templateData) {
            templateData.elementDisposable.dispose();
            const stat = node.element;
            const editableData = this.explorerService.getEditableData(stat);
            templateData.label.element.classList.remove('compressed');
            // File Label
            if (!editableData) {
                templateData.label.element.style.display = 'flex';
                templateData.elementDisposable = this.renderStat(stat, stat.name, undefined, node.filterData, templateData);
            }
            // Input Box
            else {
                templateData.label.element.style.display = 'none';
                templateData.elementDisposable = this.renderInputBox(templateData.container, stat, editableData);
            }
        }
        renderCompressedElements(node, index, templateData, height) {
            templateData.elementDisposable.dispose();
            const stat = node.element.elements[node.element.elements.length - 1];
            const editable = node.element.elements.filter(e => this.explorerService.isEditable(e));
            const editableData = editable.length === 0 ? undefined : this.explorerService.getEditableData(editable[0]);
            // File Label
            if (!editableData) {
                templateData.label.element.classList.add('compressed');
                templateData.label.element.style.display = 'flex';
                const disposables = new lifecycle_1.DisposableStore();
                const id = `compressed-explorer_${CompressedNavigationController.ID++}`;
                const label = node.element.elements.map(e => e.name);
                disposables.add(this.renderStat(stat, label, id, node.filterData, templateData));
                const compressedNavigationController = new CompressedNavigationController(id, node.element.elements, templateData, node.depth, node.collapsed);
                disposables.add(compressedNavigationController);
                this.compressedNavigationControllers.set(stat, compressedNavigationController);
                // accessibility
                disposables.add(this._onDidChangeActiveDescendant.add(compressedNavigationController.onDidChange));
                disposables.add(DOM.addDisposableListener(templateData.container, 'mousedown', e => {
                    const result = getIconLabelNameFromHTMLElement(e.target);
                    if (result) {
                        compressedNavigationController.setIndex(result.index);
                    }
                }));
                disposables.add((0, lifecycle_1.toDisposable)(() => this.compressedNavigationControllers.delete(stat)));
                templateData.elementDisposable = disposables;
            }
            // Input Box
            else {
                templateData.label.element.classList.remove('compressed');
                templateData.label.element.style.display = 'none';
                templateData.elementDisposable = this.renderInputBox(templateData.container, editable[0], editableData);
            }
        }
        renderStat(stat, label, domId, filterData, templateData) {
            const elementDisposables = new lifecycle_1.DisposableStore();
            templateData.label.element.style.display = 'flex';
            const extraClasses = ['explorer-item'];
            if (this.explorerService.isCut(stat)) {
                extraClasses.push('cut');
            }
            const setResourceData = () => {
                var _a, _b;
                // Offset nested children unless folders have both chevrons and icons, otherwise alignment breaks
                const theme = this.themeService.getFileIconTheme();
                // Hack to always render chevrons for file nests, or else may not be able to identify them.
                const twistieContainer = (_b = (_a = templateData.container.parentElement) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.querySelector('.monaco-tl-twistie');
                if (twistieContainer) {
                    if (stat.hasNests && theme.hidesExplorerArrows) {
                        twistieContainer.classList.add('force-twistie');
                    }
                    else {
                        twistieContainer.classList.remove('force-twistie');
                    }
                }
                // when explorer arrows are hidden or there are no folder icons, nests get misaligned as they are forced to have arrows and files typically have icons
                // Apply some CSS magic to get things looking as reasonable as possible.
                const themeIsUnhappyWithNesting = theme.hasFileIcons && (theme.hidesExplorerArrows || !theme.hasFolderIcons);
                const realignNestedChildren = stat.nestedParent && themeIsUnhappyWithNesting;
                templateData.label.setResource({ resource: stat.resource, name: label }, {
                    fileKind: stat.isRoot ? files_1.FileKind.ROOT_FOLDER : stat.isDirectory ? files_1.FileKind.FOLDER : files_1.FileKind.FILE,
                    extraClasses: realignNestedChildren ? [...extraClasses, 'align-nest-icon-with-parent-icon'] : extraClasses,
                    fileDecorations: this.config.explorer.decorations,
                    matches: (0, filters_1.createMatches)(filterData),
                    separator: this.labelService.getSeparator(stat.resource.scheme, stat.resource.authority),
                    domId
                });
            };
            elementDisposables.add(this.themeService.onDidFileIconThemeChange(() => setResourceData()));
            setResourceData();
            elementDisposables.add(templateData.label.onDidRender(() => {
                try {
                    this.updateWidth(stat);
                }
                catch (e) {
                    // noop since the element might no longer be in the tree, no update of width necessary
                }
            }));
            return elementDisposables;
        }
        renderInputBox(container, stat, editableData) {
            // Use a file label only for the icon next to the input box
            const label = this.labels.create(container);
            const extraClasses = ['explorer-item', 'explorer-item-edited'];
            const fileKind = stat.isRoot ? files_1.FileKind.ROOT_FOLDER : stat.isDirectory ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
            const theme = this.themeService.getFileIconTheme();
            const themeIsUnhappyWithNesting = theme.hasFileIcons && (theme.hidesExplorerArrows || !theme.hasFolderIcons);
            const realignNestedChildren = stat.nestedParent && themeIsUnhappyWithNesting;
            const labelOptions = {
                hidePath: true,
                hideLabel: true,
                fileKind,
                extraClasses: realignNestedChildren ? [...extraClasses, 'align-nest-icon-with-parent-icon'] : extraClasses,
            };
            const parent = stat.name ? (0, resources_1.dirname)(stat.resource) : stat.resource;
            const value = stat.name || '';
            label.setFile((0, resources_1.joinPath)(parent, value || ' '), labelOptions); // Use icon for ' ' if name is empty.
            // hack: hide label
            label.element.firstElementChild.style.display = 'none';
            // Input field for name
            const inputBox = new inputBox_1.InputBox(label.element, this.contextViewService, {
                validationOptions: {
                    validation: (value) => {
                        const message = editableData.validationMessage(value);
                        if (!message || message.severity !== notification_1.Severity.Error) {
                            return null;
                        }
                        return {
                            content: message.content,
                            formatContent: true,
                            type: 3 /* MessageType.ERROR */
                        };
                    }
                },
                ariaLabel: (0, nls_1.localize)('fileInputAriaLabel', "Type file name. Press Enter to confirm or Escape to cancel.")
            });
            const styler = (0, styler_1.attachInputBoxStyler)(inputBox, this.themeService);
            const lastDot = value.lastIndexOf('.');
            inputBox.value = value;
            inputBox.focus();
            inputBox.select({ start: 0, end: lastDot > 0 && !stat.isDirectory ? lastDot : value.length });
            const done = (0, functional_1.once)((success, finishEditing) => {
                label.element.style.display = 'none';
                const value = inputBox.value;
                (0, lifecycle_1.dispose)(toDispose);
                label.element.remove();
                if (finishEditing) {
                    editableData.onFinish(value, success);
                }
            });
            const showInputBoxNotification = () => {
                if (inputBox.isInputValid()) {
                    const message = editableData.validationMessage(inputBox.value);
                    if (message) {
                        inputBox.showMessage({
                            content: message.content,
                            formatContent: true,
                            type: message.severity === notification_1.Severity.Info ? 1 /* MessageType.INFO */ : message.severity === notification_1.Severity.Warning ? 2 /* MessageType.WARNING */ : 3 /* MessageType.ERROR */
                        });
                    }
                    else {
                        inputBox.hideMessage();
                    }
                }
            };
            showInputBoxNotification();
            const toDispose = [
                inputBox,
                inputBox.onDidChange(value => {
                    label.setFile((0, resources_1.joinPath)(parent, value || ' '), labelOptions); // update label icon while typing!
                }),
                DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.KEY_DOWN, (e) => {
                    if (e.equals(3 /* KeyCode.Enter */)) {
                        if (!inputBox.validate()) {
                            done(true, true);
                        }
                    }
                    else if (e.equals(9 /* KeyCode.Escape */)) {
                        done(false, true);
                    }
                }),
                DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.KEY_UP, (e) => {
                    showInputBoxNotification();
                }),
                DOM.addDisposableListener(inputBox.inputElement, DOM.EventType.BLUR, () => {
                    done(inputBox.isInputValid(), true);
                }),
                label,
                styler
            ];
            return (0, lifecycle_1.toDisposable)(() => {
                done(false, false);
            });
        }
        disposeElement(element, index, templateData) {
            templateData.elementDisposable.dispose();
        }
        disposeCompressedElements(node, index, templateData) {
            templateData.elementDisposable.dispose();
        }
        disposeTemplate(templateData) {
            templateData.elementDisposable.dispose();
            templateData.label.dispose();
        }
        getCompressedNavigationController(stat) {
            return this.compressedNavigationControllers.get(stat);
        }
        // IAccessibilityProvider
        getAriaLabel(element) {
            return element.name;
        }
        getAriaLevel(element) {
            // We need to comput aria level on our own since children of compact folders will otherwise have an incorrect level	#107235
            let depth = 0;
            let parent = element.parent;
            while (parent) {
                parent = parent.parent;
                depth++;
            }
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                depth = depth + 1;
            }
            return depth;
        }
        getActiveDescendantId(stat) {
            const compressedNavigationController = this.compressedNavigationControllers.get(stat);
            return compressedNavigationController === null || compressedNavigationController === void 0 ? void 0 : compressedNavigationController.currentId;
        }
        dispose() {
            this.configListener.dispose();
            this.styler.innerText = '';
        }
    };
    FilesRenderer.ID = 'file';
    FilesRenderer = __decorate([
        __param(2, contextView_1.IContextViewService),
        __param(3, themeService_1.IThemeService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, files_2.IExplorerService),
        __param(6, label_1.ILabelService),
        __param(7, workspace_1.IWorkspaceContextService)
    ], FilesRenderer);
    exports.FilesRenderer = FilesRenderer;
    /**
     * Respectes files.exclude setting in filtering out content from the explorer.
     * Makes sure that visible editors are always shown in the explorer even if they are filtered out by settings.
     */
    let FilesFilter = class FilesFilter {
        constructor(contextService, configurationService, explorerService, editorService, uriIdentityService) {
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.explorerService = explorerService;
            this.editorService = editorService;
            this.uriIdentityService = uriIdentityService;
            this.hiddenExpressionPerRoot = new Map();
            this.editorsAffectingFilter = new Set();
            this._onDidChange = new event_1.Emitter();
            this.toDispose = [];
            this.toDispose.push(this.contextService.onDidChangeWorkspaceFolders(() => this.updateConfiguration()));
            this.toDispose.push(this.configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('files.exclude')) {
                    this.updateConfiguration();
                }
            }));
            this.toDispose.push(this.editorService.onDidVisibleEditorsChange(() => {
                const editors = this.editorService.visibleEditors;
                let shouldFire = false;
                for (const e of editors) {
                    if (!e.resource) {
                        continue;
                    }
                    const stat = this.explorerService.findClosest(e.resource);
                    if (stat && stat.isExcluded) {
                        // A filtered resource suddenly became visible since user opened an editor
                        shouldFire = true;
                        break;
                    }
                }
                for (const e of this.editorsAffectingFilter) {
                    if (!editors.includes(e)) {
                        // Editor that was affecting filtering is no longer visible
                        shouldFire = true;
                        break;
                    }
                }
                if (shouldFire) {
                    this.editorsAffectingFilter.clear();
                    this._onDidChange.fire();
                }
            }));
            this.updateConfiguration();
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
        updateConfiguration() {
            let shouldFire = false;
            this.contextService.getWorkspace().folders.forEach(folder => {
                var _a;
                const configuration = this.configurationService.getValue({ resource: folder.uri });
                const excludesConfig = ((_a = configuration === null || configuration === void 0 ? void 0 : configuration.files) === null || _a === void 0 ? void 0 : _a.exclude) || Object.create(null);
                if (!shouldFire) {
                    const cached = this.hiddenExpressionPerRoot.get(folder.uri.toString());
                    shouldFire = !cached || !(0, objects_1.equals)(cached.original, excludesConfig);
                }
                const excludesConfigCopy = (0, objects_1.deepClone)(excludesConfig); // do not keep the config, as it gets mutated under our hoods
                this.hiddenExpressionPerRoot.set(folder.uri.toString(), { original: excludesConfigCopy, parsed: glob.parse(excludesConfigCopy) });
            });
            if (shouldFire) {
                this.editorsAffectingFilter.clear();
                this._onDidChange.fire();
            }
        }
        filter(stat, parentVisibility) {
            return this.isVisible(stat, parentVisibility);
        }
        isVisible(stat, parentVisibility) {
            var _a;
            stat.isExcluded = false;
            if (parentVisibility === 0 /* TreeVisibility.Hidden */) {
                stat.isExcluded = true;
                return false;
            }
            if (this.explorerService.getEditableData(stat)) {
                return true; // always visible
            }
            // Hide those that match Hidden Patterns
            const cached = this.hiddenExpressionPerRoot.get(stat.root.resource.toString());
            if ((cached && cached.parsed(path.relative(stat.root.resource.path, stat.resource.path), stat.name, name => !!(stat.parent && stat.parent.getChild(name)))) || ((_a = stat.parent) === null || _a === void 0 ? void 0 : _a.isExcluded)) {
                stat.isExcluded = true;
                const editors = this.editorService.visibleEditors;
                const editor = editors.find(e => e.resource && this.uriIdentityService.extUri.isEqualOrParent(e.resource, stat.resource));
                if (editor && stat.root === this.explorerService.findClosestRoot(stat.resource)) {
                    this.editorsAffectingFilter.add(editor);
                    return true; // Show all opened files and their parents
                }
                return false; // hidden through pattern
            }
            return true;
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.toDispose);
        }
    };
    FilesFilter = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, files_2.IExplorerService),
        __param(3, editorService_1.IEditorService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], FilesFilter);
    exports.FilesFilter = FilesFilter;
    // Explorer Sorter
    let FileSorter = class FileSorter {
        constructor(explorerService, contextService) {
            this.explorerService = explorerService;
            this.contextService = contextService;
        }
        compare(statA, statB) {
            // Do not sort roots
            if (statA.isRoot) {
                if (statB.isRoot) {
                    const workspaceA = this.contextService.getWorkspaceFolder(statA.resource);
                    const workspaceB = this.contextService.getWorkspaceFolder(statB.resource);
                    return workspaceA && workspaceB ? (workspaceA.index - workspaceB.index) : -1;
                }
                return -1;
            }
            if (statB.isRoot) {
                return 1;
            }
            const sortOrder = this.explorerService.sortOrderConfiguration.sortOrder;
            const lexicographicOptions = this.explorerService.sortOrderConfiguration.lexicographicOptions;
            let compareFileNames;
            let compareFileExtensions;
            switch (lexicographicOptions) {
                case 'upper':
                    compareFileNames = comparers_1.compareFileNamesUpper;
                    compareFileExtensions = comparers_1.compareFileExtensionsUpper;
                    break;
                case 'lower':
                    compareFileNames = comparers_1.compareFileNamesLower;
                    compareFileExtensions = comparers_1.compareFileExtensionsLower;
                    break;
                case 'unicode':
                    compareFileNames = comparers_1.compareFileNamesUnicode;
                    compareFileExtensions = comparers_1.compareFileExtensionsUnicode;
                    break;
                default:
                    // 'default'
                    compareFileNames = comparers_1.compareFileNamesDefault;
                    compareFileExtensions = comparers_1.compareFileExtensionsDefault;
            }
            // Sort Directories
            switch (sortOrder) {
                case 'type':
                    if (statA.isDirectory && !statB.isDirectory) {
                        return -1;
                    }
                    if (statB.isDirectory && !statA.isDirectory) {
                        return 1;
                    }
                    if (statA.isDirectory && statB.isDirectory) {
                        return compareFileNames(statA.name, statB.name);
                    }
                    break;
                case 'filesFirst':
                    if (statA.isDirectory && !statB.isDirectory) {
                        return 1;
                    }
                    if (statB.isDirectory && !statA.isDirectory) {
                        return -1;
                    }
                    break;
                case 'foldersNestsFiles':
                    if (statA.isDirectory && !statB.isDirectory) {
                        return -1;
                    }
                    if (statB.isDirectory && !statA.isDirectory) {
                        return 1;
                    }
                    if (statA.hasNests && !statB.hasNests) {
                        return -1;
                    }
                    if (statB.hasNests && !statA.hasNests) {
                        return 1;
                    }
                    break;
                case 'mixed':
                    break; // not sorting when "mixed" is on
                default: /* 'default', 'modified' */
                    if (statA.isDirectory && !statB.isDirectory) {
                        return -1;
                    }
                    if (statB.isDirectory && !statA.isDirectory) {
                        return 1;
                    }
                    break;
            }
            // Sort Files
            switch (sortOrder) {
                case 'type':
                    return compareFileExtensions(statA.name, statB.name);
                case 'modified':
                    if (statA.mtime !== statB.mtime) {
                        return (statA.mtime && statB.mtime && statA.mtime < statB.mtime) ? 1 : -1;
                    }
                    return compareFileNames(statA.name, statB.name);
                default: /* 'default', 'mixed', 'filesFirst' */
                    return compareFileNames(statA.name, statB.name);
            }
        }
    };
    FileSorter = __decorate([
        __param(0, files_2.IExplorerService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], FileSorter);
    exports.FileSorter = FileSorter;
    let FileDragAndDrop = class FileDragAndDrop {
        constructor(isCollapsed, explorerService, editorService, dialogService, contextService, fileService, configurationService, instantiationService, workspaceEditingService, uriIdentityService) {
            this.isCollapsed = isCollapsed;
            this.explorerService = explorerService;
            this.editorService = editorService;
            this.dialogService = dialogService;
            this.contextService = contextService;
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.workspaceEditingService = workspaceEditingService;
            this.uriIdentityService = uriIdentityService;
            this.compressedDropTargetDisposable = lifecycle_1.Disposable.None;
            this.dropEnabled = false;
            this.toDispose = [];
            const updateDropEnablement = () => {
                this.dropEnabled = this.configurationService.getValue('explorer.enableDragAndDrop');
            };
            updateDropEnablement();
            this.toDispose.push(this.configurationService.onDidChangeConfiguration((e) => updateDropEnablement()));
        }
        onDragOver(data, target, targetIndex, originalEvent) {
            if (!this.dropEnabled) {
                return false;
            }
            // Compressed folders
            if (target) {
                const compressedTarget = FileDragAndDrop.getCompressedStatFromDragEvent(target, originalEvent);
                if (compressedTarget) {
                    const iconLabelName = getIconLabelNameFromHTMLElement(originalEvent.target);
                    if (iconLabelName && iconLabelName.index < iconLabelName.count - 1) {
                        const result = this.handleDragOver(data, compressedTarget, targetIndex, originalEvent);
                        if (result) {
                            if (iconLabelName.element !== this.compressedDragOverElement) {
                                this.compressedDragOverElement = iconLabelName.element;
                                this.compressedDropTargetDisposable.dispose();
                                this.compressedDropTargetDisposable = (0, lifecycle_1.toDisposable)(() => {
                                    iconLabelName.element.classList.remove('drop-target');
                                    this.compressedDragOverElement = undefined;
                                });
                                iconLabelName.element.classList.add('drop-target');
                            }
                            return typeof result === 'boolean' ? result : Object.assign(Object.assign({}, result), { feedback: [] });
                        }
                        this.compressedDropTargetDisposable.dispose();
                        return false;
                    }
                }
            }
            this.compressedDropTargetDisposable.dispose();
            return this.handleDragOver(data, target, targetIndex, originalEvent);
        }
        handleDragOver(data, target, targetIndex, originalEvent) {
            const isCopy = originalEvent && ((originalEvent.ctrlKey && !platform_1.isMacintosh) || (originalEvent.altKey && platform_1.isMacintosh));
            const isNative = data instanceof listView_1.NativeDragAndDropData;
            const effect = (isNative || isCopy) ? 0 /* ListDragOverEffect.Copy */ : 1 /* ListDragOverEffect.Move */;
            // Native DND
            if (isNative) {
                if (!(0, dnd_1.containsDragType)(originalEvent, dnd_2.DataTransfers.FILES, dnd_1.CodeDataTransfers.FILES, dnd_2.DataTransfers.RESOURCES)) {
                    return false;
                }
            }
            // Other-Tree DND
            else if (data instanceof listView_1.ExternalElementsDragAndDropData) {
                return false;
            }
            // In-Explorer DND
            else {
                const items = FileDragAndDrop.getStatsFromDragAndDropData(data);
                if (!target) {
                    // Dropping onto the empty area. Do not accept if items dragged are already
                    // children of the root unless we are copying the file
                    if (!isCopy && items.every(i => !!i.parent && i.parent.isRoot)) {
                        return false;
                    }
                    return { accept: true, bubble: 0 /* TreeDragOverBubble.Down */, effect, autoExpand: false };
                }
                if (!Array.isArray(items)) {
                    return false;
                }
                if (items.some((source) => {
                    if (source.isRoot && target instanceof explorerModel_1.ExplorerItem && !target.isRoot) {
                        return true; // Root folder can not be moved to a non root file stat.
                    }
                    if (this.uriIdentityService.extUri.isEqual(source.resource, target.resource)) {
                        return true; // Can not move anything onto itself
                    }
                    if (source.isRoot && target instanceof explorerModel_1.ExplorerItem && target.isRoot) {
                        // Disable moving workspace roots in one another
                        return false;
                    }
                    if (!isCopy && this.uriIdentityService.extUri.isEqual((0, resources_1.dirname)(source.resource), target.resource)) {
                        return true; // Can not move a file to the same parent unless we copy
                    }
                    if (this.uriIdentityService.extUri.isEqualOrParent(target.resource, source.resource)) {
                        return true; // Can not move a parent folder into one of its children
                    }
                    return false;
                })) {
                    return false;
                }
            }
            // All (target = model)
            if (!target) {
                return { accept: true, bubble: 0 /* TreeDragOverBubble.Down */, effect };
            }
            // All (target = file/folder)
            else {
                if (target.isDirectory) {
                    if (target.isReadonly) {
                        return false;
                    }
                    return { accept: true, bubble: 0 /* TreeDragOverBubble.Down */, effect, autoExpand: true };
                }
                if (this.contextService.getWorkspace().folders.every(folder => folder.uri.toString() !== target.resource.toString())) {
                    return { accept: true, bubble: 1 /* TreeDragOverBubble.Up */, effect };
                }
            }
            return false;
        }
        getDragURI(element) {
            if (this.explorerService.isEditable(element)) {
                return null;
            }
            return element.resource.toString();
        }
        getDragLabel(elements, originalEvent) {
            if (elements.length === 1) {
                const stat = FileDragAndDrop.getCompressedStatFromDragEvent(elements[0], originalEvent);
                return stat.name;
            }
            return String(elements.length);
        }
        onDragStart(data, originalEvent) {
            const items = FileDragAndDrop.getStatsFromDragAndDropData(data, originalEvent);
            if (items && items.length && originalEvent.dataTransfer) {
                // Apply some datatransfer types to allow for dragging the element outside of the application
                this.instantiationService.invokeFunction(accessor => (0, dnd_1.fillEditorsDragData)(accessor, items, originalEvent));
                // The only custom data transfer we set from the explorer is a file transfer
                // to be able to DND between multiple code file explorers across windows
                const fileResources = items.filter(s => s.resource.scheme === network_1.Schemas.file).map(r => r.resource.fsPath);
                if (fileResources.length) {
                    originalEvent.dataTransfer.setData(dnd_1.CodeDataTransfers.FILES, JSON.stringify(fileResources));
                }
            }
        }
        async drop(data, target, targetIndex, originalEvent) {
            this.compressedDropTargetDisposable.dispose();
            // Find compressed target
            if (target) {
                const compressedTarget = FileDragAndDrop.getCompressedStatFromDragEvent(target, originalEvent);
                if (compressedTarget) {
                    target = compressedTarget;
                }
            }
            // Find parent to add to
            if (!target) {
                target = this.explorerService.roots[this.explorerService.roots.length - 1];
            }
            if (!target.isDirectory && target.parent) {
                target = target.parent;
            }
            if (target.isReadonly) {
                return;
            }
            const resolvedTarget = target;
            if (!resolvedTarget) {
                return;
            }
            try {
                // External file DND (Import/Upload file)
                if (data instanceof listView_1.NativeDragAndDropData) {
                    // Use local file import when supported
                    if (!platform_1.isWeb || ((0, workspace_1.isTemporaryWorkspace)(this.contextService.getWorkspace()) && webFileSystemAccess_1.WebFileSystemAccess.supported(window))) {
                        const fileImport = this.instantiationService.createInstance(fileImportExport_1.ExternalFileImport);
                        await fileImport.import(resolvedTarget, originalEvent);
                    }
                    // Otherwise fallback to browser based file upload
                    else {
                        const browserUpload = this.instantiationService.createInstance(fileImportExport_1.BrowserFileUpload);
                        await browserUpload.upload(target, originalEvent);
                    }
                }
                // In-Explorer DND (Move/Copy file)
                else {
                    await this.handleExplorerDrop(data, resolvedTarget, originalEvent);
                }
            }
            catch (error) {
                this.dialogService.show(notification_1.Severity.Error, (0, errorMessage_1.toErrorMessage)(error));
            }
        }
        async handleExplorerDrop(data, target, originalEvent) {
            const elementsData = FileDragAndDrop.getStatsFromDragAndDropData(data);
            const distinctItems = new Set(elementsData);
            for (const item of distinctItems) {
                if (this.isCollapsed(item)) {
                    const nestedChildren = item.nestedChildren;
                    if (nestedChildren) {
                        for (const child of nestedChildren) {
                            distinctItems.add(child);
                        }
                    }
                }
            }
            const items = (0, resources_1.distinctParents)([...distinctItems], s => s.resource);
            const isCopy = (originalEvent.ctrlKey && !platform_1.isMacintosh) || (originalEvent.altKey && platform_1.isMacintosh);
            // Handle confirm setting
            const confirmDragAndDrop = !isCopy && this.configurationService.getValue(FileDragAndDrop.CONFIRM_DND_SETTING_KEY);
            if (confirmDragAndDrop) {
                const message = items.length > 1 && items.every(s => s.isRoot) ? (0, nls_1.localize)('confirmRootsMove', "Are you sure you want to change the order of multiple root folders in your workspace?")
                    : items.length > 1 ? (0, nls_1.localize)('confirmMultiMove', "Are you sure you want to move the following {0} files into '{1}'?", items.length, target.name)
                        : items[0].isRoot ? (0, nls_1.localize)('confirmRootMove', "Are you sure you want to change the order of root folder '{0}' in your workspace?", items[0].name)
                            : (0, nls_1.localize)('confirmMove', "Are you sure you want to move '{0}' into '{1}'?", items[0].name, target.name);
                const detail = items.length > 1 && !items.every(s => s.isRoot) ? (0, dialogs_1.getFileNamesMessage)(items.map(i => i.resource)) : undefined;
                const confirmation = await this.dialogService.confirm({
                    message,
                    detail,
                    checkbox: {
                        label: (0, nls_1.localize)('doNotAskAgain', "Do not ask me again")
                    },
                    type: 'question',
                    primaryButton: (0, nls_1.localize)({ key: 'moveButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Move")
                });
                if (!confirmation.confirmed) {
                    return;
                }
                // Check for confirmation checkbox
                if (confirmation.checkboxChecked === true) {
                    await this.configurationService.updateValue(FileDragAndDrop.CONFIRM_DND_SETTING_KEY, false);
                }
            }
            await this.doHandleRootDrop(items.filter(s => s.isRoot), target);
            const sources = items.filter(s => !s.isRoot);
            if (isCopy) {
                return this.doHandleExplorerDropOnCopy(sources, target);
            }
            return this.doHandleExplorerDropOnMove(sources, target);
        }
        async doHandleRootDrop(roots, target) {
            if (roots.length === 0) {
                return;
            }
            const folders = this.contextService.getWorkspace().folders;
            let targetIndex;
            const workspaceCreationData = [];
            const rootsToMove = [];
            for (let index = 0; index < folders.length; index++) {
                const data = {
                    uri: folders[index].uri,
                    name: folders[index].name
                };
                if (target instanceof explorerModel_1.ExplorerItem && this.uriIdentityService.extUri.isEqual(folders[index].uri, target.resource)) {
                    targetIndex = index;
                }
                if (roots.every(r => r.resource.toString() !== folders[index].uri.toString())) {
                    workspaceCreationData.push(data);
                }
                else {
                    rootsToMove.push(data);
                }
            }
            if (targetIndex === undefined) {
                targetIndex = workspaceCreationData.length;
            }
            workspaceCreationData.splice(targetIndex, 0, ...rootsToMove);
            return this.workspaceEditingService.updateFolders(0, workspaceCreationData.length, workspaceCreationData);
        }
        async doHandleExplorerDropOnCopy(sources, target) {
            // Reuse duplicate action when user copies
            const explorerConfig = this.configurationService.getValue().explorer;
            const resourceFileEdits = sources.map(({ resource, isDirectory }) => (new bulkEditService_1.ResourceFileEdit(resource, (0, fileActions_1.findValidPasteFileTarget)(this.explorerService, target, { resource, isDirectory, allowOverwrite: false }, explorerConfig.incrementalNaming), { copy: true })));
            const labelSufix = getFileOrFolderLabelSufix(sources);
            await this.explorerService.applyBulkEdit(resourceFileEdits, {
                confirmBeforeUndo: explorerConfig.confirmUndo === "default" /* UndoConfirmLevel.Default */ || explorerConfig.confirmUndo === "verbose" /* UndoConfirmLevel.Verbose */,
                undoLabel: (0, nls_1.localize)('copy', "Copy {0}", labelSufix),
                progressLabel: (0, nls_1.localize)('copying', "Copying {0}", labelSufix),
            });
            const editors = resourceFileEdits.filter(edit => {
                const item = edit.newResource ? this.explorerService.findClosest(edit.newResource) : undefined;
                return item && !item.isDirectory;
            }).map(edit => ({ resource: edit.newResource, options: { pinned: true } }));
            await this.editorService.openEditors(editors);
        }
        async doHandleExplorerDropOnMove(sources, target) {
            // Do not allow moving readonly items
            const resourceFileEdits = sources.filter(source => !source.isReadonly).map(source => new bulkEditService_1.ResourceFileEdit(source.resource, (0, resources_1.joinPath)(target.resource, source.name)));
            const labelSufix = getFileOrFolderLabelSufix(sources);
            const options = {
                confirmBeforeUndo: this.configurationService.getValue().explorer.confirmUndo === "verbose" /* UndoConfirmLevel.Verbose */,
                undoLabel: (0, nls_1.localize)('move', "Move {0}", labelSufix),
                progressLabel: (0, nls_1.localize)('moving', "Moving {0}", labelSufix)
            };
            try {
                await this.explorerService.applyBulkEdit(resourceFileEdits, options);
            }
            catch (error) {
                // Conflict
                if (error.fileOperationResult === 4 /* FileOperationResult.FILE_MOVE_CONFLICT */) {
                    const overwrites = [];
                    for (const edit of resourceFileEdits) {
                        if (edit.newResource && await this.fileService.exists(edit.newResource)) {
                            overwrites.push(edit.newResource);
                        }
                    }
                    // Move with overwrite if the user confirms
                    const confirm = (0, fileImportExport_1.getMultipleFilesOverwriteConfirm)(overwrites);
                    const { confirmed } = await this.dialogService.confirm(confirm);
                    if (confirmed) {
                        await this.explorerService.applyBulkEdit(resourceFileEdits.map(re => new bulkEditService_1.ResourceFileEdit(re.oldResource, re.newResource, { overwrite: true })), options);
                    }
                }
                // Any other error: bubble up
                else {
                    throw error;
                }
            }
        }
        static getStatsFromDragAndDropData(data, dragStartEvent) {
            if (data.context) {
                return data.context;
            }
            // Detect compressed folder dragging
            if (dragStartEvent && data.elements.length === 1) {
                data.context = [FileDragAndDrop.getCompressedStatFromDragEvent(data.elements[0], dragStartEvent)];
                return data.context;
            }
            return data.elements;
        }
        static getCompressedStatFromDragEvent(stat, dragEvent) {
            const target = document.elementFromPoint(dragEvent.clientX, dragEvent.clientY);
            const iconLabelName = getIconLabelNameFromHTMLElement(target);
            if (iconLabelName) {
                const { count, index } = iconLabelName;
                let i = count - 1;
                while (i > index && stat.parent) {
                    stat = stat.parent;
                    i--;
                }
                return stat;
            }
            return stat;
        }
        onDragEnd() {
            this.compressedDropTargetDisposable.dispose();
        }
    };
    FileDragAndDrop.CONFIRM_DND_SETTING_KEY = 'explorer.confirmDragAndDrop';
    FileDragAndDrop = __decorate([
        __param(1, files_2.IExplorerService),
        __param(2, editorService_1.IEditorService),
        __param(3, dialogs_1.IDialogService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, files_1.IFileService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, workspaceEditing_1.IWorkspaceEditingService),
        __param(9, uriIdentity_1.IUriIdentityService)
    ], FileDragAndDrop);
    exports.FileDragAndDrop = FileDragAndDrop;
    function getIconLabelNameFromHTMLElement(target) {
        if (!(target instanceof HTMLElement)) {
            return null;
        }
        let element = target;
        while (element && !element.classList.contains('monaco-list-row')) {
            if (element.classList.contains('label-name') && element.hasAttribute('data-icon-label-count')) {
                const count = Number(element.getAttribute('data-icon-label-count'));
                const index = Number(element.getAttribute('data-icon-label-index'));
                if ((0, types_1.isNumber)(count) && (0, types_1.isNumber)(index)) {
                    return { element: element, count, index };
                }
            }
            element = element.parentElement;
        }
        return null;
    }
    function isCompressedFolderName(target) {
        return !!getIconLabelNameFromHTMLElement(target);
    }
    exports.isCompressedFolderName = isCompressedFolderName;
    class ExplorerCompressionDelegate {
        isIncompressible(stat) {
            return stat.isRoot || !stat.isDirectory || stat instanceof explorerModel_1.NewExplorerItem || (!stat.parent || stat.parent.isRoot);
        }
    }
    exports.ExplorerCompressionDelegate = ExplorerCompressionDelegate;
    function getFileOrFolderLabelSufix(items) {
        if (items.length === 1) {
            return items[0].name;
        }
        if (items.every(i => i.isDirectory)) {
            return (0, nls_1.localize)('numberOfFolders', "{0} folders", items.length);
        }
        if (items.every(i => !i.isDirectory)) {
            return (0, nls_1.localize)('numberOfFiles', "{0} files", items.length);
        }
        return `${items.length} files and folders`;
    }
});
//# sourceMappingURL=explorerViewer.js.map