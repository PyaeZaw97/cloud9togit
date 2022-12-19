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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/resources", "vs/base/browser/ui/iconLabel/iconLabel", "vs/editor/common/languages/language", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/editor/common/services/model", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/decorations/common/decorations", "vs/base/common/network", "vs/platform/files/common/files", "vs/platform/theme/common/themeService", "vs/base/common/event", "vs/platform/label/common/label", "vs/editor/common/services/getIconClasses", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/base/common/labels"], function (require, exports, uri_1, resources_1, iconLabel_1, language_1, workspace_1, configuration_1, model_1, textfiles_1, decorations_1, network_1, files_1, themeService_1, event_1, label_1, getIconClasses_1, lifecycle_1, instantiation_1, labels_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceLabel = exports.ResourceLabels = exports.DEFAULT_LABELS_CONTAINER = void 0;
    function toResource(props) {
        if (!props || !props.resource) {
            return undefined;
        }
        if (uri_1.URI.isUri(props.resource)) {
            return props.resource;
        }
        return props.resource.primary;
    }
    exports.DEFAULT_LABELS_CONTAINER = {
        onDidChangeVisibility: event_1.Event.None
    };
    let ResourceLabels = class ResourceLabels extends lifecycle_1.Disposable {
        constructor(container, instantiationService, configurationService, modelService, languageService, decorationsService, themeService, labelService, textFileService) {
            super();
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.modelService = modelService;
            this.languageService = languageService;
            this.decorationsService = decorationsService;
            this.themeService = themeService;
            this.labelService = labelService;
            this.textFileService = textFileService;
            this._onDidChangeDecorations = this._register(new event_1.Emitter());
            this.onDidChangeDecorations = this._onDidChangeDecorations.event;
            this.widgets = [];
            this.labels = [];
            this.registerListeners(container);
        }
        registerListeners(container) {
            // notify when visibility changes
            this._register(container.onDidChangeVisibility(visible => {
                this.widgets.forEach(widget => widget.notifyVisibilityChanged(visible));
            }));
            // notify when extensions are registered with potentially new languages
            this._register(this.languageService.onDidChange(() => this.widgets.forEach(widget => widget.notifyExtensionsRegistered())));
            // notify when model language changes
            this._register(this.modelService.onModelLanguageChanged(e => {
                if (!e.model.uri) {
                    return; // we need the resource to compare
                }
                this.widgets.forEach(widget => widget.notifyModelLanguageChanged(e.model));
            }));
            // notify when model is added
            this._register(this.modelService.onModelAdded(model => {
                if (!model.uri) {
                    return; // we need the resource to compare
                }
                this.widgets.forEach(widget => widget.notifyModelAdded(model));
            }));
            // notify when file decoration changes
            this._register(this.decorationsService.onDidChangeDecorations(e => {
                let notifyDidChangeDecorations = false;
                this.widgets.forEach(widget => {
                    if (widget.notifyFileDecorationsChanges(e)) {
                        notifyDidChangeDecorations = true;
                    }
                });
                if (notifyDidChangeDecorations) {
                    this._onDidChangeDecorations.fire();
                }
            }));
            // notify when theme changes
            this._register(this.themeService.onDidColorThemeChange(() => this.widgets.forEach(widget => widget.notifyThemeChange())));
            // notify when files.associations changes
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(files_1.FILES_ASSOCIATIONS_CONFIG)) {
                    this.widgets.forEach(widget => widget.notifyFileAssociationsChange());
                }
            }));
            // notify when label formatters change
            this._register(this.labelService.onDidChangeFormatters(e => {
                this.widgets.forEach(widget => widget.notifyFormattersChange(e.scheme));
            }));
            // notify when untitled labels change
            this._register(this.textFileService.untitled.onDidChangeLabel(model => {
                this.widgets.forEach(widget => widget.notifyUntitledLabelChange(model.resource));
            }));
        }
        get(index) {
            return this.labels[index];
        }
        create(container, options) {
            const widget = this.instantiationService.createInstance(ResourceLabelWidget, container, options);
            // Only expose a handle to the outside
            const label = {
                element: widget.element,
                onDidRender: widget.onDidRender,
                setLabel: (label, description, options) => widget.setLabel(label, description, options),
                setResource: (label, options) => widget.setResource(label, options),
                setFile: (resource, options) => widget.setFile(resource, options),
                clear: () => widget.clear(),
                dispose: () => this.disposeWidget(widget)
            };
            // Store
            this.labels.push(label);
            this.widgets.push(widget);
            return label;
        }
        disposeWidget(widget) {
            const index = this.widgets.indexOf(widget);
            if (index > -1) {
                this.widgets.splice(index, 1);
                this.labels.splice(index, 1);
            }
            (0, lifecycle_1.dispose)(widget);
        }
        clear() {
            this.widgets = (0, lifecycle_1.dispose)(this.widgets);
            this.labels = [];
        }
        dispose() {
            super.dispose();
            this.clear();
        }
    };
    ResourceLabels = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, model_1.IModelService),
        __param(4, language_1.ILanguageService),
        __param(5, decorations_1.IDecorationsService),
        __param(6, themeService_1.IThemeService),
        __param(7, label_1.ILabelService),
        __param(8, textfiles_1.ITextFileService)
    ], ResourceLabels);
    exports.ResourceLabels = ResourceLabels;
    /**
     * Note: please consider to use `ResourceLabels` if you are in need
     * of more than one label for your widget.
     */
    let ResourceLabel = class ResourceLabel extends ResourceLabels {
        constructor(container, options, instantiationService, configurationService, modelService, languageService, decorationsService, themeService, labelService, textFileService) {
            super(exports.DEFAULT_LABELS_CONTAINER, instantiationService, configurationService, modelService, languageService, decorationsService, themeService, labelService, textFileService);
            this.label = this._register(this.create(container, options));
        }
        get element() { return this.label; }
    };
    ResourceLabel = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, model_1.IModelService),
        __param(5, language_1.ILanguageService),
        __param(6, decorations_1.IDecorationsService),
        __param(7, themeService_1.IThemeService),
        __param(8, label_1.ILabelService),
        __param(9, textfiles_1.ITextFileService)
    ], ResourceLabel);
    exports.ResourceLabel = ResourceLabel;
    var Redraw;
    (function (Redraw) {
        Redraw[Redraw["Basic"] = 1] = "Basic";
        Redraw[Redraw["Full"] = 2] = "Full";
    })(Redraw || (Redraw = {}));
    let ResourceLabelWidget = class ResourceLabelWidget extends iconLabel_1.IconLabel {
        constructor(container, options, languageService, modelService, decorationsService, labelService, textFileService, contextService) {
            super(container, options);
            this.languageService = languageService;
            this.modelService = modelService;
            this.decorationsService = decorationsService;
            this.labelService = labelService;
            this.textFileService = textFileService;
            this.contextService = contextService;
            this._onDidRender = this._register(new event_1.Emitter());
            this.onDidRender = this._onDidRender.event;
            this.label = undefined;
            this.decoration = this._register(new lifecycle_1.MutableDisposable());
            this.options = undefined;
            this.computedIconClasses = undefined;
            this.computedLanguageId = undefined;
            this.computedPathLabel = undefined;
            this.needsRedraw = undefined;
            this.isHidden = false;
        }
        notifyVisibilityChanged(visible) {
            if (visible === this.isHidden) {
                this.isHidden = !visible;
                if (visible && this.needsRedraw) {
                    this.render({
                        updateIcon: this.needsRedraw === Redraw.Full,
                        updateDecoration: this.needsRedraw === Redraw.Full
                    });
                    this.needsRedraw = undefined;
                }
            }
        }
        notifyModelLanguageChanged(model) {
            this.handleModelEvent(model);
        }
        notifyModelAdded(model) {
            this.handleModelEvent(model);
        }
        handleModelEvent(model) {
            const resource = toResource(this.label);
            if (!resource) {
                return; // only update if resource exists
            }
            if ((0, resources_1.isEqual)(model.uri, resource)) {
                if (this.computedLanguageId !== model.getLanguageId()) {
                    this.computedLanguageId = model.getLanguageId();
                    this.render({ updateIcon: true, updateDecoration: false }); // update if the language id of the model has changed from our last known state
                }
            }
        }
        notifyFileDecorationsChanges(e) {
            if (!this.options) {
                return false;
            }
            const resource = toResource(this.label);
            if (!resource) {
                return false;
            }
            if (this.options.fileDecorations && e.affectsResource(resource)) {
                return this.render({ updateIcon: false, updateDecoration: true });
            }
            return false;
        }
        notifyExtensionsRegistered() {
            this.render({ updateIcon: true, updateDecoration: false });
        }
        notifyThemeChange() {
            this.render({ updateIcon: false, updateDecoration: false });
        }
        notifyFileAssociationsChange() {
            this.render({ updateIcon: true, updateDecoration: false });
        }
        notifyFormattersChange(scheme) {
            var _a;
            if (((_a = toResource(this.label)) === null || _a === void 0 ? void 0 : _a.scheme) === scheme) {
                this.render({ updateIcon: false, updateDecoration: false });
            }
        }
        notifyUntitledLabelChange(resource) {
            if ((0, resources_1.isEqual)(resource, toResource(this.label))) {
                this.render({ updateIcon: false, updateDecoration: false });
            }
        }
        setFile(resource, options) {
            const hideLabel = options === null || options === void 0 ? void 0 : options.hideLabel;
            let name;
            if (!hideLabel) {
                if ((options === null || options === void 0 ? void 0 : options.fileKind) === files_1.FileKind.ROOT_FOLDER) {
                    const workspaceFolder = this.contextService.getWorkspaceFolder(resource);
                    if (workspaceFolder) {
                        name = workspaceFolder.name;
                    }
                }
                if (!name) {
                    name = (0, labels_1.normalizeDriveLetter)((0, resources_1.basenameOrAuthority)(resource));
                }
            }
            let description;
            if (!(options === null || options === void 0 ? void 0 : options.hidePath)) {
                description = this.labelService.getUriLabel((0, resources_1.dirname)(resource), { relative: true });
            }
            this.setResource({ resource, name, description }, options);
        }
        setResource(label, options = Object.create(null)) {
            const resource = toResource(label);
            const isSideBySideEditor = (label === null || label === void 0 ? void 0 : label.resource) && !uri_1.URI.isUri(label.resource);
            if (!options.forceLabel && !isSideBySideEditor && (resource === null || resource === void 0 ? void 0 : resource.scheme) === network_1.Schemas.untitled) {
                // Untitled labels are very dynamic because they may change
                // whenever the content changes (unless a path is associated).
                // As such we always ask the actual editor for it's name and
                // description to get latest in case name/description are
                // provided. If they are not provided from the label we got
                // we assume that the client does not want to display them
                // and as such do not override.
                //
                // We do not touch the label if it represents a primary-secondary
                // because in that case we expect it to carry a proper label
                // and description.
                const untitledModel = this.textFileService.untitled.get(resource);
                if (untitledModel && !untitledModel.hasAssociatedFilePath) {
                    if (typeof label.name === 'string') {
                        label.name = untitledModel.name;
                    }
                    if (typeof label.description === 'string') {
                        let untitledDescription = untitledModel.resource.path;
                        if (label.name !== untitledDescription) {
                            label.description = untitledDescription;
                        }
                        else {
                            label.description = undefined;
                        }
                    }
                    let untitledTitle = untitledModel.resource.path;
                    if (untitledModel.name !== untitledTitle) {
                        options.title = `${untitledModel.name} • ${untitledTitle}`;
                    }
                    else {
                        options.title = untitledTitle;
                    }
                }
            }
            const hasResourceChanged = this.hasResourceChanged(label);
            const hasPathLabelChanged = hasResourceChanged || this.hasPathLabelChanged(label);
            const hasFileKindChanged = this.hasFileKindChanged(options);
            this.label = label;
            this.options = options;
            if (hasResourceChanged) {
                this.computedLanguageId = undefined; // reset computed language since resource changed
            }
            if (hasPathLabelChanged) {
                this.computedPathLabel = undefined; // reset path label due to resource/path-label change
            }
            this.render({
                updateIcon: hasResourceChanged || hasFileKindChanged,
                updateDecoration: hasResourceChanged || hasFileKindChanged
            });
        }
        hasFileKindChanged(newOptions) {
            var _a;
            const newFileKind = newOptions === null || newOptions === void 0 ? void 0 : newOptions.fileKind;
            const oldFileKind = (_a = this.options) === null || _a === void 0 ? void 0 : _a.fileKind;
            return newFileKind !== oldFileKind; // same resource but different kind (file, folder)
        }
        hasResourceChanged(newLabel) {
            const newResource = toResource(newLabel);
            const oldResource = toResource(this.label);
            if (newResource && oldResource) {
                return newResource.toString() !== oldResource.toString();
            }
            if (!newResource && !oldResource) {
                return false;
            }
            return true;
        }
        hasPathLabelChanged(newLabel) {
            const newResource = toResource(newLabel);
            return !!newResource && this.computedPathLabel !== this.labelService.getUriLabel(newResource);
        }
        clear() {
            this.label = undefined;
            this.options = undefined;
            this.computedLanguageId = undefined;
            this.computedIconClasses = undefined;
            this.computedPathLabel = undefined;
            this.setLabel('');
        }
        render(options) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            if (this.isHidden) {
                if (this.needsRedraw !== Redraw.Full) {
                    this.needsRedraw = (options.updateIcon || options.updateDecoration) ? Redraw.Full : Redraw.Basic;
                }
                return false;
            }
            if (options.updateIcon) {
                this.computedIconClasses = undefined;
            }
            if (!this.label) {
                return false;
            }
            const iconLabelOptions = {
                title: '',
                italic: (_a = this.options) === null || _a === void 0 ? void 0 : _a.italic,
                strikethrough: (_b = this.options) === null || _b === void 0 ? void 0 : _b.strikethrough,
                matches: (_c = this.options) === null || _c === void 0 ? void 0 : _c.matches,
                descriptionMatches: (_d = this.options) === null || _d === void 0 ? void 0 : _d.descriptionMatches,
                extraClasses: [],
                separator: (_e = this.options) === null || _e === void 0 ? void 0 : _e.separator,
                domId: (_f = this.options) === null || _f === void 0 ? void 0 : _f.domId
            };
            const resource = toResource(this.label);
            const label = this.label.name;
            if (((_g = this.options) === null || _g === void 0 ? void 0 : _g.title) !== undefined) {
                iconLabelOptions.title = this.options.title;
            }
            if (resource && resource.scheme !== network_1.Schemas.data /* do not accidentally inline Data URIs */
                && ((!((_h = this.options) === null || _h === void 0 ? void 0 : _h.title))
                    || ((typeof this.options.title !== 'string') && !this.options.title.markdownNotSupportedFallback))) {
                if (!this.computedPathLabel) {
                    this.computedPathLabel = this.labelService.getUriLabel(resource);
                }
                if (!iconLabelOptions.title || (typeof iconLabelOptions.title === 'string')) {
                    iconLabelOptions.title = this.computedPathLabel;
                }
                else if (!iconLabelOptions.title.markdownNotSupportedFallback) {
                    iconLabelOptions.title.markdownNotSupportedFallback = this.computedPathLabel;
                }
            }
            if (this.options && !this.options.hideIcon) {
                if (!this.computedIconClasses) {
                    this.computedIconClasses = (0, getIconClasses_1.getIconClasses)(this.modelService, this.languageService, resource, this.options.fileKind);
                }
                iconLabelOptions.extraClasses = this.computedIconClasses.slice(0);
            }
            if ((_j = this.options) === null || _j === void 0 ? void 0 : _j.extraClasses) {
                iconLabelOptions.extraClasses.push(...this.options.extraClasses);
            }
            if (((_k = this.options) === null || _k === void 0 ? void 0 : _k.fileDecorations) && resource) {
                if (options.updateDecoration) {
                    this.decoration.value = this.decorationsService.getDecoration(resource, this.options.fileKind !== files_1.FileKind.FILE);
                }
                const decoration = this.decoration.value;
                if (decoration) {
                    if (decoration.tooltip && (typeof iconLabelOptions.title === 'string')) {
                        iconLabelOptions.title = `${iconLabelOptions.title} • ${decoration.tooltip}`;
                    }
                    if (decoration.strikethrough) {
                        iconLabelOptions.strikethrough = true;
                    }
                    if (this.options.fileDecorations.colors) {
                        iconLabelOptions.extraClasses.push(decoration.labelClassName);
                    }
                    if (this.options.fileDecorations.badges) {
                        iconLabelOptions.extraClasses.push(decoration.badgeClassName);
                        iconLabelOptions.extraClasses.push(decoration.iconClassName);
                    }
                }
            }
            this.setLabel(label || '', this.label.description, iconLabelOptions);
            this._onDidRender.fire();
            return true;
        }
        dispose() {
            super.dispose();
            this.label = undefined;
            this.options = undefined;
            this.computedLanguageId = undefined;
            this.computedIconClasses = undefined;
            this.computedPathLabel = undefined;
        }
    };
    ResourceLabelWidget = __decorate([
        __param(2, language_1.ILanguageService),
        __param(3, model_1.IModelService),
        __param(4, decorations_1.IDecorationsService),
        __param(5, label_1.ILabelService),
        __param(6, textfiles_1.ITextFileService),
        __param(7, workspace_1.IWorkspaceContextService)
    ], ResourceLabelWidget);
});
//# sourceMappingURL=labels.js.map