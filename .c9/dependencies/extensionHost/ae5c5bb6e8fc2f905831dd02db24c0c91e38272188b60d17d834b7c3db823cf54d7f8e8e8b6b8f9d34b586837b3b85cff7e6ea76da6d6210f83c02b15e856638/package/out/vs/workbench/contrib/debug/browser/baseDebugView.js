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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/browser/ui/inputbox/inputBox", "vs/base/common/codicons", "vs/base/common/filters", "vs/base/common/functional", "vs/base/common/lifecycle", "vs/nls", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/replModel"], function (require, exports, dom, actionbar_1, highlightedLabel_1, inputBox_1, codicons_1, filters_1, functional_1, lifecycle_1, nls_1, contextView_1, styler_1, themeService_1, debug_1, debugModel_1, replModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractExpressionsRenderer = exports.renderVariable = exports.renderExpressionValue = exports.renderViewTree = exports.twistiePixels = exports.MAX_VALUE_RENDER_LENGTH_IN_VIEWLET = void 0;
    exports.MAX_VALUE_RENDER_LENGTH_IN_VIEWLET = 1024;
    exports.twistiePixels = 20;
    const booleanRegex = /^(true|false)$/i;
    const stringRegex = /^(['"]).*\1$/;
    const $ = dom.$;
    function renderViewTree(container) {
        const treeContainer = $('.');
        treeContainer.classList.add('debug-view-content');
        container.appendChild(treeContainer);
        return treeContainer;
    }
    exports.renderViewTree = renderViewTree;
    function renderExpressionValue(expressionOrValue, container, options) {
        let value = typeof expressionOrValue === 'string' ? expressionOrValue : expressionOrValue.value;
        // remove stale classes
        container.className = 'value';
        // when resolving expressions we represent errors from the server as a variable with name === null.
        if (value === null || ((expressionOrValue instanceof debugModel_1.Expression || expressionOrValue instanceof debugModel_1.Variable || expressionOrValue instanceof replModel_1.ReplEvaluationResult) && !expressionOrValue.available)) {
            container.classList.add('unavailable');
            if (value !== debugModel_1.Expression.DEFAULT_VALUE) {
                container.classList.add('error');
            }
        }
        else if ((expressionOrValue instanceof debugModel_1.ExpressionContainer) && options.showChanged && expressionOrValue.valueChanged && value !== debugModel_1.Expression.DEFAULT_VALUE) {
            // value changed color has priority over other colors.
            container.className = 'value changed';
            expressionOrValue.valueChanged = false;
        }
        if (options.colorize && typeof expressionOrValue !== 'string') {
            if (expressionOrValue.type === 'number' || expressionOrValue.type === 'boolean' || expressionOrValue.type === 'string') {
                container.classList.add(expressionOrValue.type);
            }
            else if (!isNaN(+value)) {
                container.classList.add('number');
            }
            else if (booleanRegex.test(value)) {
                container.classList.add('boolean');
            }
            else if (stringRegex.test(value)) {
                container.classList.add('string');
            }
        }
        if (options.maxValueLength && value && value.length > options.maxValueLength) {
            value = value.substring(0, options.maxValueLength) + '...';
        }
        if (!value) {
            value = '';
        }
        if (options.linkDetector) {
            container.textContent = '';
            const session = (expressionOrValue instanceof debugModel_1.ExpressionContainer) ? expressionOrValue.getSession() : undefined;
            container.appendChild(options.linkDetector.linkify(value, false, session ? session.root : undefined));
        }
        else {
            container.textContent = value;
        }
        if (options.showHover) {
            container.title = value || '';
        }
    }
    exports.renderExpressionValue = renderExpressionValue;
    function renderVariable(variable, data, showChanged, highlights, linkDetector) {
        var _a, _b, _c;
        if (variable.available) {
            let text = variable.name;
            if (variable.value && typeof variable.name === 'string') {
                text += ':';
            }
            data.label.set(text, highlights, variable.type ? variable.type : variable.name);
            data.name.classList.toggle('virtual', ((_a = variable.presentationHint) === null || _a === void 0 ? void 0 : _a.kind) === 'virtual');
            data.name.classList.toggle('internal', ((_b = variable.presentationHint) === null || _b === void 0 ? void 0 : _b.visibility) === 'internal');
        }
        else if (variable.value && typeof variable.name === 'string' && variable.name) {
            data.label.set(':');
        }
        data.expression.classList.toggle('lazy', !!((_c = variable.presentationHint) === null || _c === void 0 ? void 0 : _c.lazy));
        renderExpressionValue(variable, data.value, {
            showChanged,
            maxValueLength: exports.MAX_VALUE_RENDER_LENGTH_IN_VIEWLET,
            showHover: true,
            colorize: true,
            linkDetector
        });
    }
    exports.renderVariable = renderVariable;
    let AbstractExpressionsRenderer = class AbstractExpressionsRenderer {
        constructor(debugService, contextViewService, themeService) {
            this.debugService = debugService;
            this.contextViewService = contextViewService;
            this.themeService = themeService;
        }
        renderTemplate(container) {
            const expression = dom.append(container, $('.expression'));
            const name = dom.append(expression, $('span.name'));
            const lazyButton = dom.append(expression, $('span.lazy-button'));
            lazyButton.classList.add(...codicons_1.Codicon.eye.classNamesArray);
            lazyButton.title = (0, nls_1.localize)('debug.lazyButton.tooltip', "Click to expand");
            const value = dom.append(expression, $('span.value'));
            const label = new highlightedLabel_1.HighlightedLabel(name);
            const inputBoxContainer = dom.append(expression, $('.inputBoxContainer'));
            const templateDisposable = new lifecycle_1.DisposableStore();
            let actionBar;
            if (this.renderActionBar) {
                dom.append(expression, $('.span.actionbar-spacer'));
                actionBar = templateDisposable.add(new actionbar_1.ActionBar(expression));
            }
            const template = { expression, name, value, label, inputBoxContainer, actionBar, elementDisposable: [], templateDisposable, lazyButton, currentElement: undefined };
            templateDisposable.add(dom.addDisposableListener(lazyButton, dom.EventType.CLICK, () => {
                if (template.currentElement) {
                    this.debugService.getViewModel().evaluateLazyExpression(template.currentElement);
                }
            }));
            return template;
        }
        renderElement(node, index, data) {
            const { element } = node;
            data.currentElement = element;
            this.renderExpression(element, data, (0, filters_1.createMatches)(node.filterData));
            if (data.actionBar) {
                this.renderActionBar(data.actionBar, element, data);
            }
            const selectedExpression = this.debugService.getViewModel().getSelectedExpression();
            if (element === (selectedExpression === null || selectedExpression === void 0 ? void 0 : selectedExpression.expression) || (element instanceof debugModel_1.Variable && element.errorMessage)) {
                const options = this.getInputBoxOptions(element, !!(selectedExpression === null || selectedExpression === void 0 ? void 0 : selectedExpression.settingWatch));
                if (options) {
                    data.elementDisposable.push(this.renderInputBox(data.name, data.value, data.inputBoxContainer, options));
                }
            }
        }
        renderInputBox(nameElement, valueElement, inputBoxContainer, options) {
            nameElement.style.display = 'none';
            valueElement.style.display = 'none';
            inputBoxContainer.style.display = 'initial';
            const inputBox = new inputBox_1.InputBox(inputBoxContainer, this.contextViewService, options);
            const styler = (0, styler_1.attachInputBoxStyler)(inputBox, this.themeService);
            inputBox.value = options.initialValue;
            inputBox.focus();
            inputBox.select();
            const done = (0, functional_1.once)((success, finishEditing) => {
                nameElement.style.display = '';
                valueElement.style.display = '';
                inputBoxContainer.style.display = 'none';
                const value = inputBox.value;
                (0, lifecycle_1.dispose)(toDispose);
                if (finishEditing) {
                    this.debugService.getViewModel().setSelectedExpression(undefined, false);
                    options.onFinish(value, success);
                }
            });
            const toDispose = [
                inputBox,
                dom.addStandardDisposableListener(inputBox.inputElement, dom.EventType.KEY_DOWN, (e) => {
                    const isEscape = e.equals(9 /* KeyCode.Escape */);
                    const isEnter = e.equals(3 /* KeyCode.Enter */);
                    if (isEscape || isEnter) {
                        e.preventDefault();
                        e.stopPropagation();
                        done(isEnter, true);
                    }
                }),
                dom.addDisposableListener(inputBox.inputElement, dom.EventType.BLUR, () => {
                    done(true, true);
                }),
                dom.addDisposableListener(inputBox.inputElement, dom.EventType.CLICK, e => {
                    // Do not expand / collapse selected elements
                    e.preventDefault();
                    e.stopPropagation();
                }),
                styler
            ];
            return (0, lifecycle_1.toDisposable)(() => {
                done(false, false);
            });
        }
        disposeElement(node, index, templateData) {
            (0, lifecycle_1.dispose)(templateData.elementDisposable);
            templateData.elementDisposable = [];
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.elementDisposable);
            templateData.templateDisposable.dispose();
        }
    };
    AbstractExpressionsRenderer = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, contextView_1.IContextViewService),
        __param(2, themeService_1.IThemeService)
    ], AbstractExpressionsRenderer);
    exports.AbstractExpressionsRenderer = AbstractExpressionsRenderer;
});
//# sourceMappingURL=baseDebugView.js.map