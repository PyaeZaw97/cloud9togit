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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/arrays", "vs/base/common/color", "vs/base/common/event", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/strings", "vs/editor/common/core/range", "vs/editor/contrib/peekView/browser/peekView", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/markers/common/markers", "vs/platform/opener/common/opener", "vs/platform/severityIcon/common/severityIcon", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/css!./media/gotoErrorWidget"], function (require, exports, dom, scrollableElement_1, arrays_1, color_1, event_1, labels_1, lifecycle_1, resources_1, strings_1, range_1, peekView_1, nls, menuEntryActionViewItem_1, actions_1, contextkey_1, instantiation_1, label_1, markers_1, opener_1, severityIcon_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.editorMarkerNavigationBackground = exports.editorMarkerNavigationInfoHeader = exports.editorMarkerNavigationInfo = exports.editorMarkerNavigationWarningHeader = exports.editorMarkerNavigationWarning = exports.editorMarkerNavigationErrorHeader = exports.editorMarkerNavigationError = exports.MarkerNavigationWidget = void 0;
    class MessageWidget {
        constructor(parent, editor, onRelatedInformation, _openerService, _labelService) {
            this._openerService = _openerService;
            this._labelService = _labelService;
            this._lines = 0;
            this._longestLineLength = 0;
            this._relatedDiagnostics = new WeakMap();
            this._disposables = new lifecycle_1.DisposableStore();
            this._editor = editor;
            const domNode = document.createElement('div');
            domNode.className = 'descriptioncontainer';
            this._messageBlock = document.createElement('div');
            this._messageBlock.classList.add('message');
            this._messageBlock.setAttribute('aria-live', 'assertive');
            this._messageBlock.setAttribute('role', 'alert');
            domNode.appendChild(this._messageBlock);
            this._relatedBlock = document.createElement('div');
            domNode.appendChild(this._relatedBlock);
            this._disposables.add(dom.addStandardDisposableListener(this._relatedBlock, 'click', event => {
                event.preventDefault();
                const related = this._relatedDiagnostics.get(event.target);
                if (related) {
                    onRelatedInformation(related);
                }
            }));
            this._scrollable = new scrollableElement_1.ScrollableElement(domNode, {
                horizontal: 1 /* ScrollbarVisibility.Auto */,
                vertical: 1 /* ScrollbarVisibility.Auto */,
                useShadows: false,
                horizontalScrollbarSize: 6,
                verticalScrollbarSize: 6
            });
            parent.appendChild(this._scrollable.getDomNode());
            this._disposables.add(this._scrollable.onScroll(e => {
                domNode.style.left = `-${e.scrollLeft}px`;
                domNode.style.top = `-${e.scrollTop}px`;
            }));
            this._disposables.add(this._scrollable);
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._disposables);
        }
        update(marker) {
            const { source, message, relatedInformation, code } = marker;
            let sourceAndCodeLength = ((source === null || source === void 0 ? void 0 : source.length) || 0) + '()'.length;
            if (code) {
                if (typeof code === 'string') {
                    sourceAndCodeLength += code.length;
                }
                else {
                    sourceAndCodeLength += code.value.length;
                }
            }
            const lines = (0, strings_1.splitLines)(message);
            this._lines = lines.length;
            this._longestLineLength = 0;
            for (const line of lines) {
                this._longestLineLength = Math.max(line.length + sourceAndCodeLength, this._longestLineLength);
            }
            dom.clearNode(this._messageBlock);
            this._messageBlock.setAttribute('aria-label', this.getAriaLabel(marker));
            this._editor.applyFontInfo(this._messageBlock);
            let lastLineElement = this._messageBlock;
            for (const line of lines) {
                lastLineElement = document.createElement('div');
                lastLineElement.innerText = line;
                if (line === '') {
                    lastLineElement.style.height = this._messageBlock.style.lineHeight;
                }
                this._messageBlock.appendChild(lastLineElement);
            }
            if (source || code) {
                const detailsElement = document.createElement('span');
                detailsElement.classList.add('details');
                lastLineElement.appendChild(detailsElement);
                if (source) {
                    const sourceElement = document.createElement('span');
                    sourceElement.innerText = source;
                    sourceElement.classList.add('source');
                    detailsElement.appendChild(sourceElement);
                }
                if (code) {
                    if (typeof code === 'string') {
                        const codeElement = document.createElement('span');
                        codeElement.innerText = `(${code})`;
                        codeElement.classList.add('code');
                        detailsElement.appendChild(codeElement);
                    }
                    else {
                        this._codeLink = dom.$('a.code-link');
                        this._codeLink.setAttribute('href', `${code.target.toString()}`);
                        this._codeLink.onclick = (e) => {
                            this._openerService.open(code.target, { allowCommands: true });
                            e.preventDefault();
                            e.stopPropagation();
                        };
                        const codeElement = dom.append(this._codeLink, dom.$('span'));
                        codeElement.innerText = code.value;
                        detailsElement.appendChild(this._codeLink);
                    }
                }
            }
            dom.clearNode(this._relatedBlock);
            this._editor.applyFontInfo(this._relatedBlock);
            if ((0, arrays_1.isNonEmptyArray)(relatedInformation)) {
                const relatedInformationNode = this._relatedBlock.appendChild(document.createElement('div'));
                relatedInformationNode.style.paddingTop = `${Math.floor(this._editor.getOption(59 /* EditorOption.lineHeight */) * 0.66)}px`;
                this._lines += 1;
                for (const related of relatedInformation) {
                    let container = document.createElement('div');
                    let relatedResource = document.createElement('a');
                    relatedResource.classList.add('filename');
                    relatedResource.innerText = `${(0, labels_1.getBaseLabel)(related.resource)}(${related.startLineNumber}, ${related.startColumn}): `;
                    relatedResource.title = this._labelService.getUriLabel(related.resource);
                    this._relatedDiagnostics.set(relatedResource, related);
                    let relatedMessage = document.createElement('span');
                    relatedMessage.innerText = related.message;
                    container.appendChild(relatedResource);
                    container.appendChild(relatedMessage);
                    this._lines += 1;
                    relatedInformationNode.appendChild(container);
                }
            }
            const fontInfo = this._editor.getOption(44 /* EditorOption.fontInfo */);
            const scrollWidth = Math.ceil(fontInfo.typicalFullwidthCharacterWidth * this._longestLineLength * 0.75);
            const scrollHeight = fontInfo.lineHeight * this._lines;
            this._scrollable.setScrollDimensions({ scrollWidth, scrollHeight });
        }
        layout(height, width) {
            this._scrollable.getDomNode().style.height = `${height}px`;
            this._scrollable.getDomNode().style.width = `${width}px`;
            this._scrollable.setScrollDimensions({ width, height });
        }
        getHeightInLines() {
            return Math.min(17, this._lines);
        }
        getAriaLabel(marker) {
            let severityLabel = '';
            switch (marker.severity) {
                case markers_1.MarkerSeverity.Error:
                    severityLabel = nls.localize('Error', "Error");
                    break;
                case markers_1.MarkerSeverity.Warning:
                    severityLabel = nls.localize('Warning', "Warning");
                    break;
                case markers_1.MarkerSeverity.Info:
                    severityLabel = nls.localize('Info', "Info");
                    break;
                case markers_1.MarkerSeverity.Hint:
                    severityLabel = nls.localize('Hint', "Hint");
                    break;
            }
            let ariaLabel = nls.localize('marker aria', "{0} at {1}. ", severityLabel, marker.startLineNumber + ':' + marker.startColumn);
            const model = this._editor.getModel();
            if (model && (marker.startLineNumber <= model.getLineCount()) && (marker.startLineNumber >= 1)) {
                const lineContent = model.getLineContent(marker.startLineNumber);
                ariaLabel = `${lineContent}, ${ariaLabel}`;
            }
            return ariaLabel;
        }
    }
    let MarkerNavigationWidget = class MarkerNavigationWidget extends peekView_1.PeekViewWidget {
        constructor(editor, _themeService, _openerService, _menuService, instantiationService, _contextKeyService, _labelService) {
            super(editor, { showArrow: true, showFrame: true, isAccessible: true, frameWidth: 1 }, instantiationService);
            this._themeService = _themeService;
            this._openerService = _openerService;
            this._menuService = _menuService;
            this._contextKeyService = _contextKeyService;
            this._labelService = _labelService;
            this._callOnDispose = new lifecycle_1.DisposableStore();
            this._onDidSelectRelatedInformation = new event_1.Emitter();
            this.onDidSelectRelatedInformation = this._onDidSelectRelatedInformation.event;
            this._severity = markers_1.MarkerSeverity.Warning;
            this._backgroundColor = color_1.Color.white;
            this._applyTheme(_themeService.getColorTheme());
            this._callOnDispose.add(_themeService.onDidColorThemeChange(this._applyTheme.bind(this)));
            this.create();
        }
        _applyTheme(theme) {
            this._backgroundColor = theme.getColor(exports.editorMarkerNavigationBackground);
            let colorId = exports.editorMarkerNavigationError;
            let headerBackground = exports.editorMarkerNavigationErrorHeader;
            if (this._severity === markers_1.MarkerSeverity.Warning) {
                colorId = exports.editorMarkerNavigationWarning;
                headerBackground = exports.editorMarkerNavigationWarningHeader;
            }
            else if (this._severity === markers_1.MarkerSeverity.Info) {
                colorId = exports.editorMarkerNavigationInfo;
                headerBackground = exports.editorMarkerNavigationInfoHeader;
            }
            const frameColor = theme.getColor(colorId);
            const headerBg = theme.getColor(headerBackground);
            this.style({
                arrowColor: frameColor,
                frameColor: frameColor,
                headerBackgroundColor: headerBg,
                primaryHeadingColor: theme.getColor(peekView_1.peekViewTitleForeground),
                secondaryHeadingColor: theme.getColor(peekView_1.peekViewTitleInfoForeground)
            }); // style() will trigger _applyStyles
        }
        _applyStyles() {
            if (this._parentContainer) {
                this._parentContainer.style.backgroundColor = this._backgroundColor ? this._backgroundColor.toString() : '';
            }
            super._applyStyles();
        }
        dispose() {
            this._callOnDispose.dispose();
            super.dispose();
        }
        focus() {
            this._parentContainer.focus();
        }
        _fillHead(container) {
            super._fillHead(container);
            this._disposables.add(this._actionbarWidget.actionRunner.onBeforeRun(e => this.editor.focus()));
            const actions = [];
            const menu = this._menuService.createMenu(MarkerNavigationWidget.TitleMenu, this._contextKeyService);
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, undefined, actions);
            this._actionbarWidget.push(actions, { label: false, icon: true, index: 0 });
            menu.dispose();
        }
        _fillTitleIcon(container) {
            this._icon = dom.append(container, dom.$(''));
        }
        _fillBody(container) {
            this._parentContainer = container;
            container.classList.add('marker-widget');
            this._parentContainer.tabIndex = 0;
            this._parentContainer.setAttribute('role', 'tooltip');
            this._container = document.createElement('div');
            container.appendChild(this._container);
            this._message = new MessageWidget(this._container, this.editor, related => this._onDidSelectRelatedInformation.fire(related), this._openerService, this._labelService);
            this._disposables.add(this._message);
        }
        show() {
            throw new Error('call showAtMarker');
        }
        showAtMarker(marker, markerIdx, markerCount) {
            // update:
            // * title
            // * message
            this._container.classList.remove('stale');
            this._message.update(marker);
            // update frame color (only applied on 'show')
            this._severity = marker.severity;
            this._applyTheme(this._themeService.getColorTheme());
            // show
            let range = range_1.Range.lift(marker);
            const editorPosition = this.editor.getPosition();
            let position = editorPosition && range.containsPosition(editorPosition) ? editorPosition : range.getStartPosition();
            super.show(position, this.computeRequiredHeight());
            const model = this.editor.getModel();
            if (model) {
                const detail = markerCount > 1
                    ? nls.localize('problems', "{0} of {1} problems", markerIdx, markerCount)
                    : nls.localize('change', "{0} of {1} problem", markerIdx, markerCount);
                this.setTitle((0, resources_1.basename)(model.uri), detail);
            }
            this._icon.className = `codicon ${severityIcon_1.SeverityIcon.className(markers_1.MarkerSeverity.toSeverity(this._severity))}`;
            this.editor.revealPositionNearTop(position, 0 /* ScrollType.Smooth */);
            this.editor.focus();
        }
        updateMarker(marker) {
            this._container.classList.remove('stale');
            this._message.update(marker);
        }
        showStale() {
            this._container.classList.add('stale');
            this._relayout();
        }
        _doLayoutBody(heightInPixel, widthInPixel) {
            super._doLayoutBody(heightInPixel, widthInPixel);
            this._heightInPixel = heightInPixel;
            this._message.layout(heightInPixel, widthInPixel);
            this._container.style.height = `${heightInPixel}px`;
        }
        _onWidth(widthInPixel) {
            this._message.layout(this._heightInPixel, widthInPixel);
        }
        _relayout() {
            super._relayout(this.computeRequiredHeight());
        }
        computeRequiredHeight() {
            return 3 + this._message.getHeightInLines();
        }
    };
    MarkerNavigationWidget.TitleMenu = new actions_1.MenuId('gotoErrorTitleMenu');
    MarkerNavigationWidget = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, opener_1.IOpenerService),
        __param(3, actions_1.IMenuService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, label_1.ILabelService)
    ], MarkerNavigationWidget);
    exports.MarkerNavigationWidget = MarkerNavigationWidget;
    // theming
    let errorDefault = (0, colorRegistry_1.oneOf)(colorRegistry_1.editorErrorForeground, colorRegistry_1.editorErrorBorder);
    let warningDefault = (0, colorRegistry_1.oneOf)(colorRegistry_1.editorWarningForeground, colorRegistry_1.editorWarningBorder);
    let infoDefault = (0, colorRegistry_1.oneOf)(colorRegistry_1.editorInfoForeground, colorRegistry_1.editorInfoBorder);
    exports.editorMarkerNavigationError = (0, colorRegistry_1.registerColor)('editorMarkerNavigationError.background', { dark: errorDefault, light: errorDefault, hcDark: colorRegistry_1.contrastBorder, hcLight: colorRegistry_1.contrastBorder }, nls.localize('editorMarkerNavigationError', 'Editor marker navigation widget error color.'));
    exports.editorMarkerNavigationErrorHeader = (0, colorRegistry_1.registerColor)('editorMarkerNavigationError.headerBackground', { dark: (0, colorRegistry_1.transparent)(exports.editorMarkerNavigationError, .1), light: (0, colorRegistry_1.transparent)(exports.editorMarkerNavigationError, .1), hcDark: null, hcLight: null }, nls.localize('editorMarkerNavigationErrorHeaderBackground', 'Editor marker navigation widget error heading background.'));
    exports.editorMarkerNavigationWarning = (0, colorRegistry_1.registerColor)('editorMarkerNavigationWarning.background', { dark: warningDefault, light: warningDefault, hcDark: colorRegistry_1.contrastBorder, hcLight: colorRegistry_1.contrastBorder }, nls.localize('editorMarkerNavigationWarning', 'Editor marker navigation widget warning color.'));
    exports.editorMarkerNavigationWarningHeader = (0, colorRegistry_1.registerColor)('editorMarkerNavigationWarning.headerBackground', { dark: (0, colorRegistry_1.transparent)(exports.editorMarkerNavigationWarning, .1), light: (0, colorRegistry_1.transparent)(exports.editorMarkerNavigationWarning, .1), hcDark: '#0C141F', hcLight: (0, colorRegistry_1.transparent)(exports.editorMarkerNavigationWarning, .2) }, nls.localize('editorMarkerNavigationWarningBackground', 'Editor marker navigation widget warning heading background.'));
    exports.editorMarkerNavigationInfo = (0, colorRegistry_1.registerColor)('editorMarkerNavigationInfo.background', { dark: infoDefault, light: infoDefault, hcDark: colorRegistry_1.contrastBorder, hcLight: colorRegistry_1.contrastBorder }, nls.localize('editorMarkerNavigationInfo', 'Editor marker navigation widget info color.'));
    exports.editorMarkerNavigationInfoHeader = (0, colorRegistry_1.registerColor)('editorMarkerNavigationInfo.headerBackground', { dark: (0, colorRegistry_1.transparent)(exports.editorMarkerNavigationInfo, .1), light: (0, colorRegistry_1.transparent)(exports.editorMarkerNavigationInfo, .1), hcDark: null, hcLight: null }, nls.localize('editorMarkerNavigationInfoHeaderBackground', 'Editor marker navigation widget info heading background.'));
    exports.editorMarkerNavigationBackground = (0, colorRegistry_1.registerColor)('editorMarkerNavigation.background', { dark: colorRegistry_1.editorBackground, light: colorRegistry_1.editorBackground, hcDark: colorRegistry_1.editorBackground, hcLight: colorRegistry_1.editorBackground }, nls.localize('editorMarkerNavigationBackground', 'Editor marker navigation widget background.'));
});
//# sourceMappingURL=gotoErrorWidget.js.map