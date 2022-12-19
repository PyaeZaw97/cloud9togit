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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/network", "vs/base/common/path", "vs/base/browser/ui/countBadge/countBadge", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/platform/markers/common/markers", "vs/workbench/contrib/markers/browser/markersModel", "vs/workbench/contrib/markers/browser/messages", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/base/common/lifecycle", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/contrib/markers/browser/markersViewActions", "vs/platform/label/common/label", "vs/base/common/resources", "vs/workbench/contrib/markers/browser/markersFilterOptions", "vs/base/common/event", "vs/base/common/types", "vs/base/common/actions", "vs/nls", "vs/base/common/async", "vs/editor/common/services/model", "vs/editor/common/core/range", "vs/editor/contrib/codeAction/browser/codeAction", "vs/editor/contrib/codeAction/browser/types", "vs/workbench/services/editor/common/editorService", "vs/editor/contrib/codeAction/browser/codeActionCommands", "vs/platform/severityIcon/common/severityIcon", "vs/platform/opener/common/opener", "vs/platform/files/common/files", "vs/platform/progress/common/progress", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/platform/opener/browser/link", "vs/editor/common/services/languageFeatures"], function (require, exports, dom, network, paths, countBadge_1, highlightedLabel_1, markers_1, markersModel_1, messages_1, instantiation_1, styler_1, themeService_1, lifecycle_1, actionbar_1, markersViewActions_1, label_1, resources_1, markersFilterOptions_1, event_1, types_1, actions_1, nls_1, async_1, model_1, range_1, codeAction_1, types_2, editorService_1, codeActionCommands_1, severityIcon_1, opener_1, files_1, progress_1, actionViewItems_1, codicons_1, iconRegistry_1, link_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkersViewModel = exports.MarkerViewModel = exports.Filter = exports.RelatedInformationRenderer = exports.MarkerRenderer = exports.FileResourceMarkersRenderer = exports.ResourceMarkersRenderer = exports.VirtualDelegate = exports.MarkersTreeAccessibilityProvider = void 0;
    let MarkersTreeAccessibilityProvider = class MarkersTreeAccessibilityProvider {
        constructor(labelService) {
            this.labelService = labelService;
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('problemsView', "Problems View");
        }
        getAriaLabel(element) {
            if (element instanceof markersModel_1.ResourceMarkers) {
                const path = this.labelService.getUriLabel(element.resource, { relative: true }) || element.resource.fsPath;
                return messages_1.default.MARKERS_TREE_ARIA_LABEL_RESOURCE(element.markers.length, element.name, paths.dirname(path));
            }
            if (element instanceof markersModel_1.Marker) {
                return messages_1.default.MARKERS_TREE_ARIA_LABEL_MARKER(element);
            }
            if (element instanceof markersModel_1.RelatedInformation) {
                return messages_1.default.MARKERS_TREE_ARIA_LABEL_RELATED_INFORMATION(element.raw);
            }
            return null;
        }
    };
    MarkersTreeAccessibilityProvider = __decorate([
        __param(0, label_1.ILabelService)
    ], MarkersTreeAccessibilityProvider);
    exports.MarkersTreeAccessibilityProvider = MarkersTreeAccessibilityProvider;
    var TemplateId;
    (function (TemplateId) {
        TemplateId["ResourceMarkers"] = "rm";
        TemplateId["Marker"] = "m";
        TemplateId["RelatedInformation"] = "ri";
    })(TemplateId || (TemplateId = {}));
    class VirtualDelegate {
        constructor(markersViewState) {
            this.markersViewState = markersViewState;
        }
        getHeight(element) {
            if (element instanceof markersModel_1.Marker) {
                const viewModel = this.markersViewState.getViewModel(element);
                const noOfLines = !viewModel || viewModel.multiline ? element.lines.length : 1;
                return noOfLines * VirtualDelegate.LINE_HEIGHT;
            }
            return VirtualDelegate.LINE_HEIGHT;
        }
        getTemplateId(element) {
            if (element instanceof markersModel_1.ResourceMarkers) {
                return "rm" /* TemplateId.ResourceMarkers */;
            }
            else if (element instanceof markersModel_1.Marker) {
                return "m" /* TemplateId.Marker */;
            }
            else {
                return "ri" /* TemplateId.RelatedInformation */;
            }
        }
    }
    exports.VirtualDelegate = VirtualDelegate;
    VirtualDelegate.LINE_HEIGHT = 22;
    var FilterDataType;
    (function (FilterDataType) {
        FilterDataType[FilterDataType["ResourceMarkers"] = 0] = "ResourceMarkers";
        FilterDataType[FilterDataType["Marker"] = 1] = "Marker";
        FilterDataType[FilterDataType["RelatedInformation"] = 2] = "RelatedInformation";
    })(FilterDataType || (FilterDataType = {}));
    let ResourceMarkersRenderer = class ResourceMarkersRenderer {
        constructor(labels, onDidChangeRenderNodeCount, themeService, labelService, fileService) {
            this.labels = labels;
            this.themeService = themeService;
            this.labelService = labelService;
            this.fileService = fileService;
            this.renderedNodes = new Map();
            this.disposables = new lifecycle_1.DisposableStore();
            this.templateId = "rm" /* TemplateId.ResourceMarkers */;
            onDidChangeRenderNodeCount(this.onDidChangeRenderNodeCount, this, this.disposables);
        }
        renderTemplate(container) {
            const data = Object.create(null);
            const resourceLabelContainer = dom.append(container, dom.$('.resource-label-container'));
            data.resourceLabel = this.labels.create(resourceLabelContainer, { supportHighlights: true });
            const badgeWrapper = dom.append(container, dom.$('.count-badge-wrapper'));
            data.count = new countBadge_1.CountBadge(badgeWrapper);
            data.styler = (0, styler_1.attachBadgeStyler)(data.count, this.themeService);
            return data;
        }
        renderElement(node, _, templateData) {
            const resourceMarkers = node.element;
            const uriMatches = node.filterData && node.filterData.uriMatches || [];
            if (this.fileService.hasProvider(resourceMarkers.resource) || resourceMarkers.resource.scheme === network.Schemas.untitled) {
                templateData.resourceLabel.setFile(resourceMarkers.resource, { matches: uriMatches });
            }
            else {
                templateData.resourceLabel.setResource({ name: resourceMarkers.name, description: this.labelService.getUriLabel((0, resources_1.dirname)(resourceMarkers.resource), { relative: true }), resource: resourceMarkers.resource }, { matches: uriMatches });
            }
            this.updateCount(node, templateData);
            this.renderedNodes.set(node, templateData);
        }
        disposeElement(node) {
            this.renderedNodes.delete(node);
        }
        disposeTemplate(templateData) {
            templateData.resourceLabel.dispose();
            templateData.styler.dispose();
        }
        onDidChangeRenderNodeCount(node) {
            const templateData = this.renderedNodes.get(node);
            if (!templateData) {
                return;
            }
            this.updateCount(node, templateData);
        }
        updateCount(node, templateData) {
            templateData.count.setCount(node.children.reduce((r, n) => r + (n.visible ? 1 : 0), 0));
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    ResourceMarkersRenderer = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, label_1.ILabelService),
        __param(4, files_1.IFileService)
    ], ResourceMarkersRenderer);
    exports.ResourceMarkersRenderer = ResourceMarkersRenderer;
    class FileResourceMarkersRenderer extends ResourceMarkersRenderer {
    }
    exports.FileResourceMarkersRenderer = FileResourceMarkersRenderer;
    let MarkerRenderer = class MarkerRenderer {
        constructor(markersViewState, instantiationService, openerService) {
            this.markersViewState = markersViewState;
            this.instantiationService = instantiationService;
            this.openerService = openerService;
            this.templateId = "m" /* TemplateId.Marker */;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.markerWidget = new MarkerWidget(container, this.markersViewState, this.openerService, this.instantiationService);
            return data;
        }
        renderElement(node, _, templateData) {
            templateData.markerWidget.render(node.element, node.filterData);
        }
        disposeTemplate(templateData) {
            templateData.markerWidget.dispose();
        }
    };
    MarkerRenderer = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, opener_1.IOpenerService)
    ], MarkerRenderer);
    exports.MarkerRenderer = MarkerRenderer;
    const expandedIcon = (0, iconRegistry_1.registerIcon)('markers-view-multi-line-expanded', codicons_1.Codicon.chevronUp, (0, nls_1.localize)('expandedIcon', 'Icon indicating that multiple lines are shown in the markers view.'));
    const collapsedIcon = (0, iconRegistry_1.registerIcon)('markers-view-multi-line-collapsed', codicons_1.Codicon.chevronDown, (0, nls_1.localize)('collapsedIcon', 'Icon indicating that multiple lines are collapsed in the markers view.'));
    const toggleMultilineAction = 'problems.action.toggleMultiline';
    class ToggleMultilineActionViewItem extends actionViewItems_1.ActionViewItem {
        render(container) {
            super.render(container);
            this.updateExpandedAttribute();
        }
        updateClass() {
            super.updateClass();
            this.updateExpandedAttribute();
        }
        updateExpandedAttribute() {
            if (this.element) {
                this.element.setAttribute('aria-expanded', `${this._action.class === themeService_1.ThemeIcon.asClassName(expandedIcon)}`);
            }
        }
    }
    class MarkerWidget extends lifecycle_1.Disposable {
        constructor(parent, markersViewModel, _openerService, _instantiationService) {
            super();
            this.parent = parent;
            this.markersViewModel = markersViewModel;
            this._openerService = _openerService;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            this.actionBar = this._register(new actionbar_1.ActionBar(dom.append(parent, dom.$('.actions')), {
                actionViewItemProvider: (action) => action.id === markersViewActions_1.QuickFixAction.ID ? _instantiationService.createInstance(markersViewActions_1.QuickFixActionViewItem, action) : undefined
            }));
            this.icon = dom.append(parent, dom.$(''));
            this.messageAndDetailsContainer = dom.append(parent, dom.$('.marker-message-details-container'));
        }
        render(element, filterData) {
            this.actionBar.clear();
            this.disposables.clear();
            dom.clearNode(this.messageAndDetailsContainer);
            this.icon.className = `marker-icon codicon ${severityIcon_1.SeverityIcon.className(markers_1.MarkerSeverity.toSeverity(element.marker.severity))}`;
            this.renderQuickfixActionbar(element);
            this.renderMessageAndDetails(element, filterData);
            this.disposables.add(dom.addDisposableListener(this.parent, dom.EventType.MOUSE_OVER, () => this.markersViewModel.onMarkerMouseHover(element)));
            this.disposables.add(dom.addDisposableListener(this.parent, dom.EventType.MOUSE_LEAVE, () => this.markersViewModel.onMarkerMouseLeave(element)));
        }
        renderQuickfixActionbar(marker) {
            const viewModel = this.markersViewModel.getViewModel(marker);
            if (viewModel) {
                const quickFixAction = viewModel.quickFixAction;
                this.actionBar.push([quickFixAction], { icon: true, label: false });
                this.icon.classList.toggle('quickFix', quickFixAction.enabled);
                quickFixAction.onDidChange(({ enabled }) => {
                    if (!(0, types_1.isUndefinedOrNull)(enabled)) {
                        this.icon.classList.toggle('quickFix', enabled);
                    }
                }, this, this.disposables);
                quickFixAction.onShowQuickFixes(() => {
                    const quickFixActionViewItem = this.actionBar.viewItems[0];
                    if (quickFixActionViewItem) {
                        quickFixActionViewItem.showQuickFixes();
                    }
                }, this, this.disposables);
            }
        }
        renderMultilineActionbar(marker, parent) {
            const multilineActionbar = this.disposables.add(new actionbar_1.ActionBar(dom.append(parent, dom.$('.multiline-actions')), {
                actionViewItemProvider: (action) => {
                    if (action.id === toggleMultilineAction) {
                        return new ToggleMultilineActionViewItem(undefined, action, { icon: true });
                    }
                    return undefined;
                }
            }));
            this.disposables.add((0, lifecycle_1.toDisposable)(() => multilineActionbar.dispose()));
            const viewModel = this.markersViewModel.getViewModel(marker);
            const multiline = viewModel && viewModel.multiline;
            const action = new actions_1.Action(toggleMultilineAction);
            action.enabled = !!viewModel && marker.lines.length > 1;
            action.tooltip = multiline ? (0, nls_1.localize)('single line', "Show message in single line") : (0, nls_1.localize)('multi line', "Show message in multiple lines");
            action.class = themeService_1.ThemeIcon.asClassName(multiline ? expandedIcon : collapsedIcon);
            action.run = () => { if (viewModel) {
                viewModel.multiline = !viewModel.multiline;
            } return Promise.resolve(); };
            multilineActionbar.push([action], { icon: true, label: false });
        }
        renderMessageAndDetails(element, filterData) {
            const { marker, lines } = element;
            const viewState = this.markersViewModel.getViewModel(element);
            const multiline = !viewState || viewState.multiline;
            const lineMatches = filterData && filterData.lineMatches || [];
            this.messageAndDetailsContainer.title = element.marker.message;
            const lineElements = [];
            for (let index = 0; index < (multiline ? lines.length : 1); index++) {
                const lineElement = dom.append(this.messageAndDetailsContainer, dom.$('.marker-message-line'));
                const messageElement = dom.append(lineElement, dom.$('.marker-message'));
                const highlightedLabel = new highlightedLabel_1.HighlightedLabel(messageElement);
                highlightedLabel.set(lines[index].length > 1000 ? `${lines[index].substring(0, 1000)}...` : lines[index], lineMatches[index]);
                if (lines[index] === '') {
                    lineElement.style.height = `${VirtualDelegate.LINE_HEIGHT}px`;
                }
                lineElements.push(lineElement);
            }
            this.renderDetails(marker, filterData, lineElements[0]);
            this.renderMultilineActionbar(element, lineElements[0]);
        }
        renderDetails(marker, filterData, parent) {
            parent.classList.add('details-container');
            if (marker.source || marker.code) {
                const source = new highlightedLabel_1.HighlightedLabel(dom.append(parent, dom.$('.marker-source')));
                const sourceMatches = filterData && filterData.sourceMatches || [];
                source.set(marker.source, sourceMatches);
                if (marker.code) {
                    if (typeof marker.code === 'string') {
                        const code = new highlightedLabel_1.HighlightedLabel(dom.append(parent, dom.$('.marker-code')));
                        const codeMatches = filterData && filterData.codeMatches || [];
                        code.set(marker.code, codeMatches);
                    }
                    else {
                        // TODO@sandeep: these widgets should be disposed
                        const container = dom.$('.marker-code');
                        const code = new highlightedLabel_1.HighlightedLabel(container);
                        new link_1.Link(parent, { href: marker.code.target.toString(), label: container, title: marker.code.target.toString() }, undefined, this._openerService);
                        const codeMatches = filterData && filterData.codeMatches || [];
                        code.set(marker.code.value, codeMatches);
                    }
                }
            }
            const lnCol = dom.append(parent, dom.$('span.marker-line'));
            lnCol.textContent = messages_1.default.MARKERS_PANEL_AT_LINE_COL_NUMBER(marker.startLineNumber, marker.startColumn);
        }
    }
    let RelatedInformationRenderer = class RelatedInformationRenderer {
        constructor(labelService) {
            this.labelService = labelService;
            this.templateId = "ri" /* TemplateId.RelatedInformation */;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            dom.append(container, dom.$('.actions'));
            dom.append(container, dom.$('.icon'));
            data.resourceLabel = new highlightedLabel_1.HighlightedLabel(dom.append(container, dom.$('.related-info-resource')));
            data.lnCol = dom.append(container, dom.$('span.marker-line'));
            const separator = dom.append(container, dom.$('span.related-info-resource-separator'));
            separator.textContent = ':';
            separator.style.paddingRight = '4px';
            data.description = new highlightedLabel_1.HighlightedLabel(dom.append(container, dom.$('.marker-description')));
            return data;
        }
        renderElement(node, _, templateData) {
            const relatedInformation = node.element.raw;
            const uriMatches = node.filterData && node.filterData.uriMatches || [];
            const messageMatches = node.filterData && node.filterData.messageMatches || [];
            templateData.resourceLabel.set((0, resources_1.basename)(relatedInformation.resource), uriMatches);
            templateData.resourceLabel.element.title = this.labelService.getUriLabel(relatedInformation.resource, { relative: true });
            templateData.lnCol.textContent = messages_1.default.MARKERS_PANEL_AT_LINE_COL_NUMBER(relatedInformation.startLineNumber, relatedInformation.startColumn);
            templateData.description.set(relatedInformation.message, messageMatches);
            templateData.description.element.title = relatedInformation.message;
        }
        disposeTemplate(templateData) {
            // noop
        }
    };
    RelatedInformationRenderer = __decorate([
        __param(0, label_1.ILabelService)
    ], RelatedInformationRenderer);
    exports.RelatedInformationRenderer = RelatedInformationRenderer;
    class Filter {
        constructor(options) {
            this.options = options;
        }
        filter(element, parentVisibility) {
            if (element instanceof markersModel_1.ResourceMarkers) {
                return this.filterResourceMarkers(element);
            }
            else if (element instanceof markersModel_1.Marker) {
                return this.filterMarker(element, parentVisibility);
            }
            else {
                return this.filterRelatedInformation(element, parentVisibility);
            }
        }
        filterResourceMarkers(resourceMarkers) {
            if (resourceMarkers.resource.scheme === network.Schemas.walkThrough || resourceMarkers.resource.scheme === network.Schemas.walkThroughSnippet) {
                return false;
            }
            // Filter resource by pattern first (globs)
            // Excludes pattern
            if (this.options.excludesMatcher.matches(resourceMarkers.resource)) {
                return false;
            }
            // Includes pattern
            if (this.options.includesMatcher.matches(resourceMarkers.resource)) {
                return true;
            }
            // Fiter by text. Do not apply negated filters on resources instead use exclude patterns
            if (this.options.textFilter.text && !this.options.textFilter.negate) {
                const uriMatches = markersFilterOptions_1.FilterOptions._filter(this.options.textFilter.text, (0, resources_1.basename)(resourceMarkers.resource));
                if (uriMatches) {
                    return { visibility: true, data: { type: 0 /* FilterDataType.ResourceMarkers */, uriMatches: uriMatches || [] } };
                }
            }
            return 2 /* TreeVisibility.Recurse */;
        }
        filterMarker(marker, parentVisibility) {
            const matchesSeverity = this.options.showErrors && markers_1.MarkerSeverity.Error === marker.marker.severity ||
                this.options.showWarnings && markers_1.MarkerSeverity.Warning === marker.marker.severity ||
                this.options.showInfos && markers_1.MarkerSeverity.Info === marker.marker.severity;
            if (!matchesSeverity) {
                return false;
            }
            if (!this.options.textFilter.text) {
                return true;
            }
            const lineMatches = [];
            for (const line of marker.lines) {
                const lineMatch = markersFilterOptions_1.FilterOptions._messageFilter(this.options.textFilter.text, line);
                lineMatches.push(lineMatch || []);
            }
            const sourceMatches = marker.marker.source ? markersFilterOptions_1.FilterOptions._filter(this.options.textFilter.text, marker.marker.source) : undefined;
            const codeMatches = marker.marker.code ? markersFilterOptions_1.FilterOptions._filter(this.options.textFilter.text, typeof marker.marker.code === 'string' ? marker.marker.code : marker.marker.code.value) : undefined;
            const matched = sourceMatches || codeMatches || lineMatches.some(lineMatch => lineMatch.length > 0);
            // Matched and not negated
            if (matched && !this.options.textFilter.negate) {
                return { visibility: true, data: { type: 1 /* FilterDataType.Marker */, lineMatches, sourceMatches: sourceMatches || [], codeMatches: codeMatches || [] } };
            }
            // Matched and negated - exclude it only if parent visibility is not set
            if (matched && this.options.textFilter.negate && parentVisibility === 2 /* TreeVisibility.Recurse */) {
                return false;
            }
            // Not matched and negated - include it only if parent visibility is not set
            if (!matched && this.options.textFilter.negate && parentVisibility === 2 /* TreeVisibility.Recurse */) {
                return true;
            }
            return parentVisibility;
        }
        filterRelatedInformation(relatedInformation, parentVisibility) {
            if (!this.options.textFilter.text) {
                return true;
            }
            const uriMatches = markersFilterOptions_1.FilterOptions._filter(this.options.textFilter.text, (0, resources_1.basename)(relatedInformation.raw.resource));
            const messageMatches = markersFilterOptions_1.FilterOptions._messageFilter(this.options.textFilter.text, paths.basename(relatedInformation.raw.message));
            const matched = uriMatches || messageMatches;
            // Matched and not negated
            if (matched && !this.options.textFilter.negate) {
                return { visibility: true, data: { type: 2 /* FilterDataType.RelatedInformation */, uriMatches: uriMatches || [], messageMatches: messageMatches || [] } };
            }
            // Matched and negated - exclude it only if parent visibility is not set
            if (matched && this.options.textFilter.negate && parentVisibility === 2 /* TreeVisibility.Recurse */) {
                return false;
            }
            // Not matched and negated - include it only if parent visibility is not set
            if (!matched && this.options.textFilter.negate && parentVisibility === 2 /* TreeVisibility.Recurse */) {
                return true;
            }
            return parentVisibility;
        }
    }
    exports.Filter = Filter;
    let MarkerViewModel = class MarkerViewModel extends lifecycle_1.Disposable {
        constructor(marker, modelService, instantiationService, editorService, languageFeaturesService) {
            super();
            this.marker = marker;
            this.modelService = modelService;
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.languageFeaturesService = languageFeaturesService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.modelPromise = null;
            this.codeActionsPromise = null;
            this._multiline = true;
            this._quickFixAction = null;
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (this.modelPromise) {
                    this.modelPromise.cancel();
                }
                if (this.codeActionsPromise) {
                    this.codeActionsPromise.cancel();
                }
            }));
        }
        get multiline() {
            return this._multiline;
        }
        set multiline(value) {
            if (this._multiline !== value) {
                this._multiline = value;
                this._onDidChange.fire();
            }
        }
        get quickFixAction() {
            if (!this._quickFixAction) {
                this._quickFixAction = this._register(this.instantiationService.createInstance(markersViewActions_1.QuickFixAction, this.marker));
            }
            return this._quickFixAction;
        }
        showLightBulb() {
            this.setQuickFixes(true);
        }
        showQuickfixes() {
            this.setQuickFixes(false).then(() => this.quickFixAction.run());
        }
        async getQuickFixes(waitForModel) {
            const codeActions = await this.getCodeActions(waitForModel);
            return codeActions ? this.toActions(codeActions) : [];
        }
        async setQuickFixes(waitForModel) {
            const codeActions = await this.getCodeActions(waitForModel);
            this.quickFixAction.quickFixes = codeActions ? this.toActions(codeActions) : [];
            this.quickFixAction.autoFixable(!!codeActions && codeActions.hasAutoFix);
        }
        getCodeActions(waitForModel) {
            if (this.codeActionsPromise !== null) {
                return this.codeActionsPromise;
            }
            return this.getModel(waitForModel)
                .then(model => {
                if (model) {
                    if (!this.codeActionsPromise) {
                        this.codeActionsPromise = (0, async_1.createCancelablePromise)(cancellationToken => {
                            return (0, codeAction_1.getCodeActions)(this.languageFeaturesService.codeActionProvider, model, new range_1.Range(this.marker.range.startLineNumber, this.marker.range.startColumn, this.marker.range.endLineNumber, this.marker.range.endColumn), {
                                type: 1 /* CodeActionTriggerType.Invoke */, filter: { include: types_2.CodeActionKind.QuickFix }
                            }, progress_1.Progress.None, cancellationToken).then(actions => {
                                return this._register(actions);
                            });
                        });
                    }
                    return this.codeActionsPromise;
                }
                return null;
            });
        }
        toActions(codeActions) {
            return codeActions.validActions.map(item => new actions_1.Action(item.action.command ? item.action.command.id : item.action.title, item.action.title, undefined, true, () => {
                return this.openFileAtMarker(this.marker)
                    .then(() => this.instantiationService.invokeFunction(codeActionCommands_1.applyCodeAction, item));
            }));
        }
        openFileAtMarker(element) {
            const { resource, selection } = { resource: element.resource, selection: element.range };
            return this.editorService.openEditor({
                resource,
                options: {
                    selection,
                    preserveFocus: true,
                    pinned: false,
                    revealIfVisible: true
                },
            }, editorService_1.ACTIVE_GROUP).then(() => undefined);
        }
        getModel(waitForModel) {
            const model = this.modelService.getModel(this.marker.resource);
            if (model) {
                return Promise.resolve(model);
            }
            if (waitForModel) {
                if (!this.modelPromise) {
                    this.modelPromise = (0, async_1.createCancelablePromise)(cancellationToken => {
                        return new Promise((c) => {
                            this._register(this.modelService.onModelAdded(model => {
                                if ((0, resources_1.isEqual)(model.uri, this.marker.resource)) {
                                    c(model);
                                }
                            }));
                        });
                    });
                }
                return this.modelPromise;
            }
            return Promise.resolve(null);
        }
    };
    MarkerViewModel = __decorate([
        __param(1, model_1.IModelService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, editorService_1.IEditorService),
        __param(4, languageFeatures_1.ILanguageFeaturesService)
    ], MarkerViewModel);
    exports.MarkerViewModel = MarkerViewModel;
    let MarkersViewModel = class MarkersViewModel extends lifecycle_1.Disposable {
        constructor(multiline = true, instantiationService) {
            super();
            this.instantiationService = instantiationService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.markersViewStates = new Map();
            this.markersPerResource = new Map();
            this.bulkUpdate = false;
            this.hoveredMarker = null;
            this.hoverDelayer = new async_1.Delayer(300);
            this._multiline = true;
            this._multiline = multiline;
        }
        add(marker) {
            if (!this.markersViewStates.has(marker.id)) {
                const viewModel = this.instantiationService.createInstance(MarkerViewModel, marker);
                const disposables = [viewModel];
                viewModel.multiline = this.multiline;
                viewModel.onDidChange(() => {
                    if (!this.bulkUpdate) {
                        this._onDidChange.fire(marker);
                    }
                }, this, disposables);
                this.markersViewStates.set(marker.id, { viewModel, disposables });
                const markers = this.markersPerResource.get(marker.resource.toString()) || [];
                markers.push(marker);
                this.markersPerResource.set(marker.resource.toString(), markers);
            }
        }
        remove(resource) {
            const markers = this.markersPerResource.get(resource.toString()) || [];
            for (const marker of markers) {
                const value = this.markersViewStates.get(marker.id);
                if (value) {
                    (0, lifecycle_1.dispose)(value.disposables);
                }
                this.markersViewStates.delete(marker.id);
                if (this.hoveredMarker === marker) {
                    this.hoveredMarker = null;
                }
            }
            this.markersPerResource.delete(resource.toString());
        }
        getViewModel(marker) {
            const value = this.markersViewStates.get(marker.id);
            return value ? value.viewModel : null;
        }
        onMarkerMouseHover(marker) {
            this.hoveredMarker = marker;
            this.hoverDelayer.trigger(() => {
                if (this.hoveredMarker) {
                    const model = this.getViewModel(this.hoveredMarker);
                    if (model) {
                        model.showLightBulb();
                    }
                }
            });
        }
        onMarkerMouseLeave(marker) {
            if (this.hoveredMarker === marker) {
                this.hoveredMarker = null;
            }
        }
        get multiline() {
            return this._multiline;
        }
        set multiline(value) {
            let changed = false;
            if (this._multiline !== value) {
                this._multiline = value;
                changed = true;
            }
            this.bulkUpdate = true;
            this.markersViewStates.forEach(({ viewModel }) => {
                if (viewModel.multiline !== value) {
                    viewModel.multiline = value;
                    changed = true;
                }
            });
            this.bulkUpdate = false;
            if (changed) {
                this._onDidChange.fire(undefined);
            }
        }
        dispose() {
            this.markersViewStates.forEach(({ disposables }) => (0, lifecycle_1.dispose)(disposables));
            this.markersViewStates.clear();
            this.markersPerResource.clear();
            super.dispose();
        }
    };
    MarkersViewModel = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], MarkersViewModel);
    exports.MarkersViewModel = MarkersViewModel;
});
//# sourceMappingURL=markersTreeViewer.js.map