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
define(["require", "exports", "vs/editor/common/services/resolverService", "vs/base/common/filters", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/editor/common/core/range", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/editor/common/model/textModel", "vs/workbench/contrib/bulkEdit/browser/preview/bulkEditPreview", "vs/platform/files/common/files", "vs/nls", "vs/platform/label/common/label", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/common/resources", "vs/platform/theme/common/themeService", "vs/base/common/strings", "vs/base/common/uri", "vs/platform/undoRedo/common/undoRedo", "vs/base/common/iterator", "vs/editor/browser/services/bulkEditService", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/language", "vs/editor/common/languages/modesRegistry"], function (require, exports, resolverService_1, filters_1, highlightedLabel_1, range_1, dom, lifecycle_1, textModel_1, bulkEditPreview_1, files_1, nls_1, label_1, iconLabel_1, resources_1, themeService_1, strings_1, uri_1, undoRedo_1, iterator_1, bulkEditService_1, languageConfigurationRegistry_1, language_1, modesRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkEditNaviLabelProvider = exports.BulkEditDelegate = exports.TextEditElementRenderer = exports.FileElementRenderer = exports.CategoryElementRenderer = exports.BulkEditIdentityProvider = exports.BulkEditAccessibilityProvider = exports.BulkEditSorter = exports.BulkEditDataSource = exports.TextEditElement = exports.FileElement = exports.CategoryElement = void 0;
    class CategoryElement {
        constructor(parent, category) {
            this.parent = parent;
            this.category = category;
        }
    }
    exports.CategoryElement = CategoryElement;
    class FileElement {
        constructor(parent, edit) {
            this.parent = parent;
            this.edit = edit;
        }
        isChecked() {
            let model = this.parent instanceof CategoryElement ? this.parent.parent : this.parent;
            let checked = true;
            // only text edit children -> reflect children state
            if (this.edit.type === 1 /* BulkFileOperationType.TextEdit */) {
                checked = !this.edit.textEdits.every(edit => !model.checked.isChecked(edit.textEdit));
            }
            // multiple file edits -> reflect single state
            for (let edit of this.edit.originalEdits.values()) {
                if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                    checked = checked && model.checked.isChecked(edit);
                }
            }
            // multiple categories and text change -> read all elements
            if (this.parent instanceof CategoryElement && this.edit.type === 1 /* BulkFileOperationType.TextEdit */) {
                for (let category of model.categories) {
                    for (let file of category.fileOperations) {
                        if (file.uri.toString() === this.edit.uri.toString()) {
                            for (const edit of file.originalEdits.values()) {
                                if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                                    checked = checked && model.checked.isChecked(edit);
                                }
                            }
                        }
                    }
                }
            }
            return checked;
        }
        setChecked(value) {
            let model = this.parent instanceof CategoryElement ? this.parent.parent : this.parent;
            for (const edit of this.edit.originalEdits.values()) {
                model.checked.updateChecked(edit, value);
            }
            // multiple categories and file change -> update all elements
            if (this.parent instanceof CategoryElement && this.edit.type !== 1 /* BulkFileOperationType.TextEdit */) {
                for (let category of model.categories) {
                    for (let file of category.fileOperations) {
                        if (file.uri.toString() === this.edit.uri.toString()) {
                            for (const edit of file.originalEdits.values()) {
                                model.checked.updateChecked(edit, value);
                            }
                        }
                    }
                }
            }
        }
        isDisabled() {
            if (this.parent instanceof CategoryElement && this.edit.type === 1 /* BulkFileOperationType.TextEdit */) {
                let model = this.parent.parent;
                let checked = true;
                for (let category of model.categories) {
                    for (let file of category.fileOperations) {
                        if (file.uri.toString() === this.edit.uri.toString()) {
                            for (const edit of file.originalEdits.values()) {
                                if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                                    checked = checked && model.checked.isChecked(edit);
                                }
                            }
                        }
                    }
                }
                return !checked;
            }
            return false;
        }
    }
    exports.FileElement = FileElement;
    class TextEditElement {
        constructor(parent, idx, edit, prefix, selecting, inserting, suffix) {
            this.parent = parent;
            this.idx = idx;
            this.edit = edit;
            this.prefix = prefix;
            this.selecting = selecting;
            this.inserting = inserting;
            this.suffix = suffix;
        }
        isChecked() {
            let model = this.parent.parent;
            if (model instanceof CategoryElement) {
                model = model.parent;
            }
            return model.checked.isChecked(this.edit.textEdit);
        }
        setChecked(value) {
            let model = this.parent.parent;
            if (model instanceof CategoryElement) {
                model = model.parent;
            }
            // check/uncheck this element
            model.checked.updateChecked(this.edit.textEdit, value);
            // make sure parent is checked when this element is checked...
            if (value) {
                for (const edit of this.parent.edit.originalEdits.values()) {
                    if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                        model.checked.updateChecked(edit, value);
                    }
                }
            }
        }
        isDisabled() {
            return this.parent.isDisabled();
        }
    }
    exports.TextEditElement = TextEditElement;
    // --- DATA SOURCE
    let BulkEditDataSource = class BulkEditDataSource {
        constructor(_textModelService, _undoRedoService, _languageService, _languageConfigurationService) {
            this._textModelService = _textModelService;
            this._undoRedoService = _undoRedoService;
            this._languageService = _languageService;
            this._languageConfigurationService = _languageConfigurationService;
            this.groupByFile = true;
        }
        hasChildren(element) {
            if (element instanceof FileElement) {
                return element.edit.textEdits.length > 0;
            }
            if (element instanceof TextEditElement) {
                return false;
            }
            return true;
        }
        async getChildren(element) {
            // root -> file/text edits
            if (element instanceof bulkEditPreview_1.BulkFileOperations) {
                return this.groupByFile
                    ? element.fileOperations.map(op => new FileElement(element, op))
                    : element.categories.map(cat => new CategoryElement(element, cat));
            }
            // category
            if (element instanceof CategoryElement) {
                return [...iterator_1.Iterable.map(element.category.fileOperations, op => new FileElement(element, op))];
            }
            // file: text edit
            if (element instanceof FileElement && element.edit.textEdits.length > 0) {
                // const previewUri = BulkEditPreviewProvider.asPreviewUri(element.edit.resource);
                let textModel;
                let textModelDisposable;
                try {
                    const ref = await this._textModelService.createModelReference(element.edit.uri);
                    textModel = ref.object.textEditorModel;
                    textModelDisposable = ref;
                }
                catch (_a) {
                    textModel = new textModel_1.TextModel('', modesRegistry_1.PLAINTEXT_LANGUAGE_ID, textModel_1.TextModel.DEFAULT_CREATION_OPTIONS, null, this._undoRedoService, this._languageService, this._languageConfigurationService);
                    textModelDisposable = textModel;
                }
                const result = element.edit.textEdits.map((edit, idx) => {
                    const range = range_1.Range.lift(edit.textEdit.textEdit.range);
                    //prefix-math
                    let startTokens = textModel.tokenization.getLineTokens(range.startLineNumber);
                    let prefixLen = 23; // default value for the no tokens/grammar case
                    for (let idx = startTokens.findTokenIndexAtOffset(range.startColumn) - 1; prefixLen < 50 && idx >= 0; idx--) {
                        prefixLen = range.startColumn - startTokens.getStartOffset(idx);
                    }
                    //suffix-math
                    let endTokens = textModel.tokenization.getLineTokens(range.endLineNumber);
                    let suffixLen = 0;
                    for (let idx = endTokens.findTokenIndexAtOffset(range.endColumn); suffixLen < 50 && idx < endTokens.getCount(); idx++) {
                        suffixLen += endTokens.getEndOffset(idx) - endTokens.getStartOffset(idx);
                    }
                    return new TextEditElement(element, idx, edit, textModel.getValueInRange(new range_1.Range(range.startLineNumber, range.startColumn - prefixLen, range.startLineNumber, range.startColumn)), textModel.getValueInRange(range), edit.textEdit.textEdit.text, textModel.getValueInRange(new range_1.Range(range.endLineNumber, range.endColumn, range.endLineNumber, range.endColumn + suffixLen)));
                });
                textModelDisposable.dispose();
                return result;
            }
            return [];
        }
    };
    BulkEditDataSource = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, undoRedo_1.IUndoRedoService),
        __param(2, language_1.ILanguageService),
        __param(3, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], BulkEditDataSource);
    exports.BulkEditDataSource = BulkEditDataSource;
    class BulkEditSorter {
        compare(a, b) {
            if (a instanceof FileElement && b instanceof FileElement) {
                return (0, strings_1.compare)(a.edit.uri.toString(), b.edit.uri.toString());
            }
            if (a instanceof TextEditElement && b instanceof TextEditElement) {
                return range_1.Range.compareRangesUsingStarts(a.edit.textEdit.textEdit.range, b.edit.textEdit.textEdit.range);
            }
            return 0;
        }
    }
    exports.BulkEditSorter = BulkEditSorter;
    // --- ACCESSI
    let BulkEditAccessibilityProvider = class BulkEditAccessibilityProvider {
        constructor(_labelService) {
            this._labelService = _labelService;
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('bulkEdit', "Bulk Edit");
        }
        getRole(_element) {
            return 'checkbox';
        }
        getAriaLabel(element) {
            if (element instanceof FileElement) {
                if (element.edit.textEdits.length > 0) {
                    if (element.edit.type & 8 /* BulkFileOperationType.Rename */ && element.edit.newUri) {
                        return (0, nls_1.localize)('aria.renameAndEdit', "Renaming {0} to {1}, also making text edits", this._labelService.getUriLabel(element.edit.uri, { relative: true }), this._labelService.getUriLabel(element.edit.newUri, { relative: true }));
                    }
                    else if (element.edit.type & 2 /* BulkFileOperationType.Create */) {
                        return (0, nls_1.localize)('aria.createAndEdit', "Creating {0}, also making text edits", this._labelService.getUriLabel(element.edit.uri, { relative: true }));
                    }
                    else if (element.edit.type & 4 /* BulkFileOperationType.Delete */) {
                        return (0, nls_1.localize)('aria.deleteAndEdit', "Deleting {0}, also making text edits", this._labelService.getUriLabel(element.edit.uri, { relative: true }));
                    }
                    else {
                        return (0, nls_1.localize)('aria.editOnly', "{0}, making text edits", this._labelService.getUriLabel(element.edit.uri, { relative: true }));
                    }
                }
                else {
                    if (element.edit.type & 8 /* BulkFileOperationType.Rename */ && element.edit.newUri) {
                        return (0, nls_1.localize)('aria.rename', "Renaming {0} to {1}", this._labelService.getUriLabel(element.edit.uri, { relative: true }), this._labelService.getUriLabel(element.edit.newUri, { relative: true }));
                    }
                    else if (element.edit.type & 2 /* BulkFileOperationType.Create */) {
                        return (0, nls_1.localize)('aria.create', "Creating {0}", this._labelService.getUriLabel(element.edit.uri, { relative: true }));
                    }
                    else if (element.edit.type & 4 /* BulkFileOperationType.Delete */) {
                        return (0, nls_1.localize)('aria.delete', "Deleting {0}", this._labelService.getUriLabel(element.edit.uri, { relative: true }));
                    }
                }
            }
            if (element instanceof TextEditElement) {
                if (element.selecting.length > 0 && element.inserting.length > 0) {
                    // edit: replace
                    return (0, nls_1.localize)('aria.replace', "line {0}, replacing {1} with {2}", element.edit.textEdit.textEdit.range.startLineNumber, element.selecting, element.inserting);
                }
                else if (element.selecting.length > 0 && element.inserting.length === 0) {
                    // edit: delete
                    return (0, nls_1.localize)('aria.del', "line {0}, removing {1}", element.edit.textEdit.textEdit.range.startLineNumber, element.selecting);
                }
                else if (element.selecting.length === 0 && element.inserting.length > 0) {
                    // edit: insert
                    return (0, nls_1.localize)('aria.insert', "line {0}, inserting {1}", element.edit.textEdit.textEdit.range.startLineNumber, element.selecting);
                }
            }
            return null;
        }
    };
    BulkEditAccessibilityProvider = __decorate([
        __param(0, label_1.ILabelService)
    ], BulkEditAccessibilityProvider);
    exports.BulkEditAccessibilityProvider = BulkEditAccessibilityProvider;
    // --- IDENT
    class BulkEditIdentityProvider {
        getId(element) {
            if (element instanceof FileElement) {
                return element.edit.uri + (element.parent instanceof CategoryElement ? JSON.stringify(element.parent.category.metadata) : '');
            }
            else if (element instanceof TextEditElement) {
                return element.parent.edit.uri.toString() + element.idx;
            }
            else {
                return JSON.stringify(element.category.metadata);
            }
        }
    }
    exports.BulkEditIdentityProvider = BulkEditIdentityProvider;
    // --- RENDERER
    class CategoryElementTemplate {
        constructor(container) {
            container.classList.add('category');
            this.icon = document.createElement('div');
            container.appendChild(this.icon);
            this.label = new iconLabel_1.IconLabel(container);
        }
    }
    let CategoryElementRenderer = class CategoryElementRenderer {
        constructor(_themeService) {
            this._themeService = _themeService;
            this.templateId = CategoryElementRenderer.id;
        }
        renderTemplate(container) {
            return new CategoryElementTemplate(container);
        }
        renderElement(node, _index, template) {
            var _a, _b;
            template.icon.style.setProperty('--background-dark', null);
            template.icon.style.setProperty('--background-light', null);
            template.icon.style.color = '';
            const { metadata } = node.element.category;
            if (themeService_1.ThemeIcon.isThemeIcon(metadata.iconPath)) {
                // css
                const className = themeService_1.ThemeIcon.asClassName(metadata.iconPath);
                template.icon.className = className ? `theme-icon ${className}` : '';
                template.icon.style.color = metadata.iconPath.color ? (_b = (_a = this._themeService.getColorTheme().getColor(metadata.iconPath.color.id)) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : '' : '';
            }
            else if (uri_1.URI.isUri(metadata.iconPath)) {
                // background-image
                template.icon.className = 'uri-icon';
                template.icon.style.setProperty('--background-dark', dom.asCSSUrl(metadata.iconPath));
                template.icon.style.setProperty('--background-light', dom.asCSSUrl(metadata.iconPath));
            }
            else if (metadata.iconPath) {
                // background-image
                template.icon.className = 'uri-icon';
                template.icon.style.setProperty('--background-dark', dom.asCSSUrl(metadata.iconPath.dark));
                template.icon.style.setProperty('--background-light', dom.asCSSUrl(metadata.iconPath.light));
            }
            template.label.setLabel(metadata.label, metadata.description, {
                descriptionMatches: (0, filters_1.createMatches)(node.filterData),
            });
        }
        disposeTemplate(template) {
            template.label.dispose();
        }
    };
    CategoryElementRenderer.id = 'CategoryElementRenderer';
    CategoryElementRenderer = __decorate([
        __param(0, themeService_1.IThemeService)
    ], CategoryElementRenderer);
    exports.CategoryElementRenderer = CategoryElementRenderer;
    let FileElementTemplate = class FileElementTemplate {
        constructor(container, resourceLabels, _labelService) {
            this._labelService = _labelService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._localDisposables = new lifecycle_1.DisposableStore();
            this._checkbox = document.createElement('input');
            this._checkbox.className = 'edit-checkbox';
            this._checkbox.type = 'checkbox';
            this._checkbox.setAttribute('role', 'checkbox');
            container.appendChild(this._checkbox);
            this._label = resourceLabels.create(container, { supportHighlights: true });
            this._details = document.createElement('span');
            this._details.className = 'details';
            container.appendChild(this._details);
        }
        dispose() {
            this._localDisposables.dispose();
            this._disposables.dispose();
            this._label.dispose();
        }
        set(element, score) {
            this._localDisposables.clear();
            this._checkbox.checked = element.isChecked();
            this._checkbox.disabled = element.isDisabled();
            this._localDisposables.add(dom.addDisposableListener(this._checkbox, 'change', () => {
                element.setChecked(this._checkbox.checked);
            }));
            if (element.edit.type & 8 /* BulkFileOperationType.Rename */ && element.edit.newUri) {
                // rename: oldName → newName
                this._label.setResource({
                    resource: element.edit.uri,
                    name: (0, nls_1.localize)('rename.label', "{0} → {1}", this._labelService.getUriLabel(element.edit.uri, { relative: true }), this._labelService.getUriLabel(element.edit.newUri, { relative: true })),
                }, {
                    fileDecorations: { colors: true, badges: false }
                });
                this._details.innerText = (0, nls_1.localize)('detail.rename', "(renaming)");
            }
            else {
                // create, delete, edit: NAME
                const options = {
                    matches: (0, filters_1.createMatches)(score),
                    fileKind: files_1.FileKind.FILE,
                    fileDecorations: { colors: true, badges: false },
                    extraClasses: []
                };
                if (element.edit.type & 2 /* BulkFileOperationType.Create */) {
                    this._details.innerText = (0, nls_1.localize)('detail.create', "(creating)");
                }
                else if (element.edit.type & 4 /* BulkFileOperationType.Delete */) {
                    this._details.innerText = (0, nls_1.localize)('detail.del', "(deleting)");
                    options.extraClasses.push('delete');
                }
                else {
                    this._details.innerText = '';
                }
                this._label.setFile(element.edit.uri, options);
            }
        }
    };
    FileElementTemplate = __decorate([
        __param(2, label_1.ILabelService)
    ], FileElementTemplate);
    let FileElementRenderer = class FileElementRenderer {
        constructor(_resourceLabels, _labelService) {
            this._resourceLabels = _resourceLabels;
            this._labelService = _labelService;
            this.templateId = FileElementRenderer.id;
        }
        renderTemplate(container) {
            return new FileElementTemplate(container, this._resourceLabels, this._labelService);
        }
        renderElement(node, _index, template) {
            template.set(node.element, node.filterData);
        }
        disposeTemplate(template) {
            template.dispose();
        }
    };
    FileElementRenderer.id = 'FileElementRenderer';
    FileElementRenderer = __decorate([
        __param(1, label_1.ILabelService)
    ], FileElementRenderer);
    exports.FileElementRenderer = FileElementRenderer;
    let TextEditElementTemplate = class TextEditElementTemplate {
        constructor(container, _themeService) {
            this._themeService = _themeService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._localDisposables = new lifecycle_1.DisposableStore();
            container.classList.add('textedit');
            this._checkbox = document.createElement('input');
            this._checkbox.className = 'edit-checkbox';
            this._checkbox.type = 'checkbox';
            this._checkbox.setAttribute('role', 'checkbox');
            container.appendChild(this._checkbox);
            this._icon = document.createElement('div');
            container.appendChild(this._icon);
            this._label = new highlightedLabel_1.HighlightedLabel(container);
        }
        dispose() {
            this._localDisposables.dispose();
            this._disposables.dispose();
        }
        set(element) {
            var _a, _b;
            this._localDisposables.clear();
            this._localDisposables.add(dom.addDisposableListener(this._checkbox, 'change', e => {
                element.setChecked(this._checkbox.checked);
                e.preventDefault();
            }));
            if (element.parent.isChecked()) {
                this._checkbox.checked = element.isChecked();
                this._checkbox.disabled = element.isDisabled();
            }
            else {
                this._checkbox.checked = element.isChecked();
                this._checkbox.disabled = element.isDisabled();
            }
            let value = '';
            value += element.prefix;
            value += element.selecting;
            value += element.inserting;
            value += element.suffix;
            let selectHighlight = { start: element.prefix.length, end: element.prefix.length + element.selecting.length, extraClasses: ['remove'] };
            let insertHighlight = { start: selectHighlight.end, end: selectHighlight.end + element.inserting.length, extraClasses: ['insert'] };
            let title;
            let { metadata } = element.edit.textEdit;
            if (metadata && metadata.description) {
                title = (0, nls_1.localize)('title', "{0} - {1}", metadata.label, metadata.description);
            }
            else if (metadata) {
                title = metadata.label;
            }
            const iconPath = metadata === null || metadata === void 0 ? void 0 : metadata.iconPath;
            if (!iconPath) {
                this._icon.style.display = 'none';
            }
            else {
                this._icon.style.display = 'block';
                this._icon.style.setProperty('--background-dark', null);
                this._icon.style.setProperty('--background-light', null);
                if (themeService_1.ThemeIcon.isThemeIcon(iconPath)) {
                    // css
                    const className = themeService_1.ThemeIcon.asClassName(iconPath);
                    this._icon.className = className ? `theme-icon ${className}` : '';
                    this._icon.style.color = iconPath.color ? (_b = (_a = this._themeService.getColorTheme().getColor(iconPath.color.id)) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : '' : '';
                }
                else if (uri_1.URI.isUri(iconPath)) {
                    // background-image
                    this._icon.className = 'uri-icon';
                    this._icon.style.setProperty('--background-dark', dom.asCSSUrl(iconPath));
                    this._icon.style.setProperty('--background-light', dom.asCSSUrl(iconPath));
                }
                else {
                    // background-image
                    this._icon.className = 'uri-icon';
                    this._icon.style.setProperty('--background-dark', dom.asCSSUrl(iconPath.dark));
                    this._icon.style.setProperty('--background-light', dom.asCSSUrl(iconPath.light));
                }
            }
            this._label.set(value, [selectHighlight, insertHighlight], title, true);
            this._icon.title = title || '';
        }
    };
    TextEditElementTemplate = __decorate([
        __param(1, themeService_1.IThemeService)
    ], TextEditElementTemplate);
    let TextEditElementRenderer = class TextEditElementRenderer {
        constructor(_themeService) {
            this._themeService = _themeService;
            this.templateId = TextEditElementRenderer.id;
        }
        renderTemplate(container) {
            return new TextEditElementTemplate(container, this._themeService);
        }
        renderElement({ element }, _index, template) {
            template.set(element);
        }
        disposeTemplate(_template) { }
    };
    TextEditElementRenderer.id = 'TextEditElementRenderer';
    TextEditElementRenderer = __decorate([
        __param(0, themeService_1.IThemeService)
    ], TextEditElementRenderer);
    exports.TextEditElementRenderer = TextEditElementRenderer;
    class BulkEditDelegate {
        getHeight() {
            return 23;
        }
        getTemplateId(element) {
            if (element instanceof FileElement) {
                return FileElementRenderer.id;
            }
            else if (element instanceof TextEditElement) {
                return TextEditElementRenderer.id;
            }
            else {
                return CategoryElementRenderer.id;
            }
        }
    }
    exports.BulkEditDelegate = BulkEditDelegate;
    class BulkEditNaviLabelProvider {
        getKeyboardNavigationLabel(element) {
            if (element instanceof FileElement) {
                return (0, resources_1.basename)(element.edit.uri);
            }
            else if (element instanceof CategoryElement) {
                return element.category.metadata.label;
            }
            return undefined;
        }
    }
    exports.BulkEditNaviLabelProvider = BulkEditNaviLabelProvider;
});
//# sourceMappingURL=bulkEditTree.js.map