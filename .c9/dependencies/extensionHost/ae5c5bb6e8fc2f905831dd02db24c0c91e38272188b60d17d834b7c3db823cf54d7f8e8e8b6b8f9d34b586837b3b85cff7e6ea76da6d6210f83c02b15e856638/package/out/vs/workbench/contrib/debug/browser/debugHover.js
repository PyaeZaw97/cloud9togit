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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/editor/common/core/range", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/editor/common/model/textModel", "vs/workbench/contrib/debug/common/debugUtils", "vs/platform/list/browser/listService", "vs/base/common/arrays", "vs/workbench/contrib/debug/browser/variablesView", "vs/base/common/cancellation", "vs/base/common/platform", "vs/workbench/contrib/debug/browser/linkDetector", "vs/editor/common/services/languageFeatures"], function (require, exports, nls, lifecycle, dom, range_1, instantiation_1, debug_1, debugModel_1, baseDebugView_1, scrollableElement_1, styler_1, themeService_1, colorRegistry_1, textModel_1, debugUtils_1, listService_1, arrays_1, variablesView_1, cancellation_1, platform_1, linkDetector_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugHoverWidget = exports.findExpressionInStackFrame = void 0;
    const $ = dom.$;
    async function doFindExpression(container, namesToFind) {
        if (!container) {
            return Promise.resolve(null);
        }
        const children = await container.getChildren();
        // look for our variable in the list. First find the parents of the hovered variable if there are any.
        const filtered = children.filter(v => namesToFind[0] === v.name);
        if (filtered.length !== 1) {
            return null;
        }
        if (namesToFind.length === 1) {
            return filtered[0];
        }
        else {
            return doFindExpression(filtered[0], namesToFind.slice(1));
        }
    }
    async function findExpressionInStackFrame(stackFrame, namesToFind) {
        const scopes = await stackFrame.getScopes();
        const nonExpensive = scopes.filter(s => !s.expensive);
        const expressions = (0, arrays_1.coalesce)(await Promise.all(nonExpensive.map(scope => doFindExpression(scope, namesToFind))));
        // only show if all expressions found have the same value
        return expressions.length > 0 && expressions.every(e => e.value === expressions[0].value) ? expressions[0] : undefined;
    }
    exports.findExpressionInStackFrame = findExpressionInStackFrame;
    let DebugHoverWidget = class DebugHoverWidget {
        constructor(editor, debugService, instantiationService, themeService, languageFeaturesService) {
            this.editor = editor;
            this.debugService = debugService;
            this.instantiationService = instantiationService;
            this.themeService = themeService;
            this.languageFeaturesService = languageFeaturesService;
            // editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = true;
            this.toDispose = [];
            this._isVisible = false;
            this.showAtPosition = null;
            this.highlightDecorations = [];
            this.positionPreference = [1 /* ContentWidgetPositionPreference.ABOVE */, 2 /* ContentWidgetPositionPreference.BELOW */];
        }
        create() {
            this.domNode = $('.debug-hover-widget');
            this.complexValueContainer = dom.append(this.domNode, $('.complex-value'));
            this.complexValueTitle = dom.append(this.complexValueContainer, $('.title'));
            this.treeContainer = dom.append(this.complexValueContainer, $('.debug-hover-tree'));
            this.treeContainer.setAttribute('role', 'tree');
            const tip = dom.append(this.complexValueContainer, $('.tip'));
            tip.textContent = nls.localize({ key: 'quickTip', comment: ['"switch to editor language hover" means to show the programming language hover widget instead of the debug hover'] }, 'Hold {0} key to switch to editor language hover', platform_1.isMacintosh ? 'Option' : 'Alt');
            const dataSource = new DebugHoverDataSource();
            const linkeDetector = this.instantiationService.createInstance(linkDetector_1.LinkDetector);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'DebugHover', this.treeContainer, new DebugHoverDelegate(), [this.instantiationService.createInstance(variablesView_1.VariablesRenderer, linkeDetector)], dataSource, {
                accessibilityProvider: new DebugHoverAccessibilityProvider(),
                mouseSupport: false,
                horizontalScrolling: true,
                useShadows: false,
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: (e) => e.name },
                filterOnType: false,
                simpleKeyboardNavigation: true,
                overrideStyles: {
                    listBackground: colorRegistry_1.editorHoverBackground
                }
            });
            this.valueContainer = $('.value');
            this.valueContainer.tabIndex = 0;
            this.valueContainer.setAttribute('role', 'tooltip');
            this.scrollbar = new scrollableElement_1.DomScrollableElement(this.valueContainer, { horizontal: 2 /* ScrollbarVisibility.Hidden */ });
            this.domNode.appendChild(this.scrollbar.getDomNode());
            this.toDispose.push(this.scrollbar);
            this.editor.applyFontInfo(this.domNode);
            this.toDispose.push((0, styler_1.attachStylerCallback)(this.themeService, { editorHoverBackground: colorRegistry_1.editorHoverBackground, editorHoverBorder: colorRegistry_1.editorHoverBorder, editorHoverForeground: colorRegistry_1.editorHoverForeground }, colors => {
                if (colors.editorHoverBackground) {
                    this.domNode.style.backgroundColor = colors.editorHoverBackground.toString();
                }
                else {
                    this.domNode.style.backgroundColor = '';
                }
                if (colors.editorHoverBorder) {
                    this.domNode.style.border = `1px solid ${colors.editorHoverBorder}`;
                }
                else {
                    this.domNode.style.border = '';
                }
                if (colors.editorHoverForeground) {
                    this.domNode.style.color = colors.editorHoverForeground.toString();
                }
                else {
                    this.domNode.style.color = '';
                }
            }));
            this.toDispose.push(this.tree.onDidChangeContentHeight(() => this.layoutTreeAndContainer(false)));
            this.registerListeners();
            this.editor.addContentWidget(this);
        }
        registerListeners() {
            this.toDispose.push(dom.addStandardDisposableListener(this.domNode, 'keydown', (e) => {
                if (e.equals(9 /* KeyCode.Escape */)) {
                    this.hide();
                }
            }));
            this.toDispose.push(this.editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(44 /* EditorOption.fontInfo */)) {
                    this.editor.applyFontInfo(this.domNode);
                }
            }));
            this.toDispose.push(this.debugService.getViewModel().onDidEvaluateLazyExpression(async (e) => {
                if (e instanceof debugModel_1.Variable && this.tree.hasNode(e)) {
                    await this.tree.updateChildren(e, false, true);
                    await this.tree.expand(e);
                }
            }));
        }
        isHovered() {
            var _a;
            return !!((_a = this.domNode) === null || _a === void 0 ? void 0 : _a.matches(':hover'));
        }
        isVisible() {
            return this._isVisible;
        }
        willBeVisible() {
            return !!this.showCancellationSource;
        }
        getId() {
            return DebugHoverWidget.ID;
        }
        getDomNode() {
            return this.domNode;
        }
        async showAt(range, focus) {
            var _a;
            (_a = this.showCancellationSource) === null || _a === void 0 ? void 0 : _a.cancel();
            const cancellationSource = this.showCancellationSource = new cancellation_1.CancellationTokenSource();
            const session = this.debugService.getViewModel().focusedSession;
            if (!session || !this.editor.hasModel()) {
                return Promise.resolve(this.hide());
            }
            const model = this.editor.getModel();
            const pos = range.getStartPosition();
            let rng = undefined;
            let matchingExpression;
            if (this.languageFeaturesService.evaluatableExpressionProvider.has(model)) {
                const supports = this.languageFeaturesService.evaluatableExpressionProvider.ordered(model);
                const promises = supports.map(support => {
                    return Promise.resolve(support.provideEvaluatableExpression(model, pos, cancellationSource.token)).then(expression => {
                        return expression;
                    }, err => {
                        //onUnexpectedExternalError(err);
                        return undefined;
                    });
                });
                const results = await Promise.all(promises).then(arrays_1.coalesce);
                if (results.length > 0) {
                    matchingExpression = results[0].expression;
                    rng = results[0].range;
                    if (!matchingExpression) {
                        const lineContent = model.getLineContent(pos.lineNumber);
                        matchingExpression = lineContent.substring(rng.startColumn - 1, rng.endColumn - 1);
                    }
                }
            }
            else { // old one-size-fits-all strategy
                const lineContent = model.getLineContent(pos.lineNumber);
                const { start, end } = (0, debugUtils_1.getExactExpressionStartAndEnd)(lineContent, range.startColumn, range.endColumn);
                // use regex to extract the sub-expression #9821
                matchingExpression = lineContent.substring(start - 1, end);
                rng = new range_1.Range(pos.lineNumber, start, pos.lineNumber, start + matchingExpression.length);
            }
            if (!matchingExpression) {
                return Promise.resolve(this.hide());
            }
            let expression;
            if (session.capabilities.supportsEvaluateForHovers) {
                expression = new debugModel_1.Expression(matchingExpression);
                await expression.evaluate(session, this.debugService.getViewModel().focusedStackFrame, 'hover');
            }
            else {
                const focusedStackFrame = this.debugService.getViewModel().focusedStackFrame;
                if (focusedStackFrame) {
                    expression = await findExpressionInStackFrame(focusedStackFrame, (0, arrays_1.coalesce)(matchingExpression.split('.').map(word => word.trim())));
                }
            }
            if (cancellationSource.token.isCancellationRequested || !expression || (expression instanceof debugModel_1.Expression && !expression.available)) {
                this.hide();
                return;
            }
            if (rng) {
                this.highlightDecorations = this.editor.deltaDecorations(this.highlightDecorations, [{
                        range: rng,
                        options: DebugHoverWidget._HOVER_HIGHLIGHT_DECORATION_OPTIONS
                    }]);
            }
            return this.doShow(pos, expression, focus);
        }
        async doShow(position, expression, focus, forceValueHover = false) {
            if (!this.domNode) {
                this.create();
            }
            this.showAtPosition = position;
            this._isVisible = true;
            if (!expression.hasChildren || forceValueHover) {
                this.complexValueContainer.hidden = true;
                this.valueContainer.hidden = false;
                (0, baseDebugView_1.renderExpressionValue)(expression, this.valueContainer, {
                    showChanged: false,
                    colorize: true
                });
                this.valueContainer.title = '';
                this.editor.layoutContentWidget(this);
                this.scrollbar.scanDomNode();
                if (focus) {
                    this.editor.render();
                    this.valueContainer.focus();
                }
                return Promise.resolve(undefined);
            }
            this.valueContainer.hidden = true;
            await this.tree.setInput(expression);
            this.complexValueTitle.textContent = expression.value;
            this.complexValueTitle.title = expression.value;
            this.layoutTreeAndContainer(true);
            this.tree.scrollTop = 0;
            this.tree.scrollLeft = 0;
            this.complexValueContainer.hidden = false;
            if (focus) {
                this.editor.render();
                this.tree.domFocus();
            }
        }
        layoutTreeAndContainer(initialLayout) {
            const scrollBarHeight = 10;
            const treeHeight = Math.min(Math.max(266, this.editor.getLayoutInfo().height * 0.55), this.tree.contentHeight + scrollBarHeight);
            this.treeContainer.style.height = `${treeHeight}px`;
            this.tree.layout(treeHeight, initialLayout ? 400 : undefined);
            this.editor.layoutContentWidget(this);
            this.scrollbar.scanDomNode();
        }
        afterRender(positionPreference) {
            if (positionPreference) {
                // Remember where the editor placed you to keep position stable #109226
                this.positionPreference = [positionPreference];
            }
        }
        hide() {
            if (this.showCancellationSource) {
                this.showCancellationSource.cancel();
                this.showCancellationSource = undefined;
            }
            if (!this._isVisible) {
                return;
            }
            if (dom.isAncestor(document.activeElement, this.domNode)) {
                this.editor.focus();
            }
            this._isVisible = false;
            this.editor.deltaDecorations(this.highlightDecorations, []);
            this.highlightDecorations = [];
            this.editor.layoutContentWidget(this);
            this.positionPreference = [1 /* ContentWidgetPositionPreference.ABOVE */, 2 /* ContentWidgetPositionPreference.BELOW */];
        }
        getPosition() {
            return this._isVisible ? {
                position: this.showAtPosition,
                preference: this.positionPreference
            } : null;
        }
        dispose() {
            this.toDispose = lifecycle.dispose(this.toDispose);
        }
    };
    DebugHoverWidget.ID = 'debug.hoverWidget';
    DebugHoverWidget._HOVER_HIGHLIGHT_DECORATION_OPTIONS = textModel_1.ModelDecorationOptions.register({
        description: 'bdebug-hover-highlight',
        className: 'hoverHighlight'
    });
    DebugHoverWidget = __decorate([
        __param(1, debug_1.IDebugService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, themeService_1.IThemeService),
        __param(4, languageFeatures_1.ILanguageFeaturesService)
    ], DebugHoverWidget);
    exports.DebugHoverWidget = DebugHoverWidget;
    class DebugHoverAccessibilityProvider {
        getWidgetAriaLabel() {
            return nls.localize('treeAriaLabel', "Debug Hover");
        }
        getAriaLabel(element) {
            return nls.localize({ key: 'variableAriaLabel', comment: ['Do not translate placeholders. Placeholders are name and value of a variable.'] }, "{0}, value {1}, variables, debug", element.name, element.value);
        }
    }
    class DebugHoverDataSource {
        hasChildren(element) {
            return element.hasChildren;
        }
        getChildren(element) {
            return element.getChildren();
        }
    }
    class DebugHoverDelegate {
        getHeight(element) {
            return 18;
        }
        getTemplateId(element) {
            return variablesView_1.VariablesRenderer.ID;
        }
    }
});
//# sourceMappingURL=debugHover.js.map