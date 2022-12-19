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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/countBadge/countBadge", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/browser/ui/list/list", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/severity", "vs/nls", "vs/platform/contextview/browser/contextView", "vs/platform/label/common/label", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/workbench/contrib/debug/browser/debugANSIHandling", "vs/workbench/contrib/debug/browser/debugIcons", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/replModel", "vs/workbench/services/editor/common/editorService"], function (require, exports, dom, countBadge_1, highlightedLabel_1, list_1, filters_1, lifecycle_1, severity_1, nls_1, contextView_1, label_1, styler_1, themeService_1, baseDebugView_1, debugANSIHandling_1, debugIcons_1, debug_1, debugModel_1, replModel_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplAccessibilityProvider = exports.ReplDataSource = exports.ReplDelegate = exports.ReplRawObjectsRenderer = exports.ReplVariablesRenderer = exports.ReplSimpleElementsRenderer = exports.ReplEvaluationResultsRenderer = exports.ReplGroupRenderer = exports.ReplEvaluationInputsRenderer = void 0;
    const $ = dom.$;
    class ReplEvaluationInputsRenderer {
        get templateId() {
            return ReplEvaluationInputsRenderer.ID;
        }
        renderTemplate(container) {
            dom.append(container, $('span.arrow' + themeService_1.ThemeIcon.asCSSSelector(debugIcons_1.debugConsoleEvaluationInput)));
            const input = dom.append(container, $('.expression'));
            const label = new highlightedLabel_1.HighlightedLabel(input);
            return { label };
        }
        renderElement(element, index, templateData) {
            const evaluation = element.element;
            templateData.label.set(evaluation.value, (0, filters_1.createMatches)(element.filterData));
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    exports.ReplEvaluationInputsRenderer = ReplEvaluationInputsRenderer;
    ReplEvaluationInputsRenderer.ID = 'replEvaluationInput';
    let ReplGroupRenderer = class ReplGroupRenderer {
        constructor(linkDetector, themeService) {
            this.linkDetector = linkDetector;
            this.themeService = themeService;
        }
        get templateId() {
            return ReplGroupRenderer.ID;
        }
        renderTemplate(container) {
            const label = dom.append(container, $('.expression'));
            return { label };
        }
        renderElement(element, _index, templateData) {
            const replGroup = element.element;
            dom.clearNode(templateData.label);
            const result = (0, debugANSIHandling_1.handleANSIOutput)(replGroup.name, this.linkDetector, this.themeService, undefined);
            templateData.label.appendChild(result);
        }
        disposeTemplate(_templateData) {
            // noop
        }
    };
    ReplGroupRenderer.ID = 'replGroup';
    ReplGroupRenderer = __decorate([
        __param(1, themeService_1.IThemeService)
    ], ReplGroupRenderer);
    exports.ReplGroupRenderer = ReplGroupRenderer;
    class ReplEvaluationResultsRenderer {
        constructor(linkDetector) {
            this.linkDetector = linkDetector;
        }
        get templateId() {
            return ReplEvaluationResultsRenderer.ID;
        }
        renderTemplate(container) {
            const output = dom.append(container, $('.evaluation-result.expression'));
            const value = dom.append(output, $('span.value'));
            return { value };
        }
        renderElement(element, index, templateData) {
            const expression = element.element;
            (0, baseDebugView_1.renderExpressionValue)(expression, templateData.value, {
                showHover: false,
                colorize: true,
                linkDetector: this.linkDetector
            });
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    exports.ReplEvaluationResultsRenderer = ReplEvaluationResultsRenderer;
    ReplEvaluationResultsRenderer.ID = 'replEvaluationResult';
    let ReplSimpleElementsRenderer = class ReplSimpleElementsRenderer {
        constructor(linkDetector, editorService, labelService, themeService) {
            this.linkDetector = linkDetector;
            this.editorService = editorService;
            this.labelService = labelService;
            this.themeService = themeService;
        }
        get templateId() {
            return ReplSimpleElementsRenderer.ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            container.classList.add('output');
            const expression = dom.append(container, $('.output.expression.value-and-source'));
            data.container = container;
            data.countContainer = dom.append(expression, $('.count-badge-wrapper'));
            data.count = new countBadge_1.CountBadge(data.countContainer);
            data.value = dom.append(expression, $('span.value'));
            data.source = dom.append(expression, $('.source'));
            data.toDispose = [];
            data.toDispose.push((0, styler_1.attachBadgeStyler)(data.count, this.themeService));
            data.toDispose.push(dom.addDisposableListener(data.source, 'click', e => {
                e.preventDefault();
                e.stopPropagation();
                const source = data.getReplElementSource();
                if (source) {
                    source.source.openInEditor(this.editorService, {
                        startLineNumber: source.lineNumber,
                        startColumn: source.column,
                        endLineNumber: source.lineNumber,
                        endColumn: source.column
                    });
                }
            }));
            return data;
        }
        renderElement({ element }, index, templateData) {
            this.setElementCount(element, templateData);
            templateData.elementListener = element.onDidChangeCount(() => this.setElementCount(element, templateData));
            // value
            dom.clearNode(templateData.value);
            // Reset classes to clear ansi decorations since templates are reused
            templateData.value.className = 'value';
            const result = (0, debugANSIHandling_1.handleANSIOutput)(element.value, this.linkDetector, this.themeService, element.session.root);
            templateData.value.appendChild(result);
            templateData.value.classList.add((element.severity === severity_1.default.Warning) ? 'warn' : (element.severity === severity_1.default.Error) ? 'error' : (element.severity === severity_1.default.Ignore) ? 'ignore' : 'info');
            templateData.source.textContent = element.sourceData ? `${element.sourceData.source.name}:${element.sourceData.lineNumber}` : '';
            templateData.source.title = element.sourceData ? `${this.labelService.getUriLabel(element.sourceData.source.uri)}:${element.sourceData.lineNumber}` : '';
            templateData.getReplElementSource = () => element.sourceData;
        }
        setElementCount(element, templateData) {
            if (element.count >= 2) {
                templateData.count.setCount(element.count);
                templateData.countContainer.hidden = false;
            }
            else {
                templateData.countContainer.hidden = true;
            }
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.toDispose);
        }
        disposeElement(_element, _index, templateData) {
            templateData.elementListener.dispose();
        }
    };
    ReplSimpleElementsRenderer.ID = 'simpleReplElement';
    ReplSimpleElementsRenderer = __decorate([
        __param(1, editorService_1.IEditorService),
        __param(2, label_1.ILabelService),
        __param(3, themeService_1.IThemeService)
    ], ReplSimpleElementsRenderer);
    exports.ReplSimpleElementsRenderer = ReplSimpleElementsRenderer;
    let ReplVariablesRenderer = class ReplVariablesRenderer extends baseDebugView_1.AbstractExpressionsRenderer {
        constructor(linkDetector, debugService, contextViewService, themeService) {
            super(debugService, contextViewService, themeService);
            this.linkDetector = linkDetector;
        }
        get templateId() {
            return ReplVariablesRenderer.ID;
        }
        renderExpression(expression, data, highlights) {
            (0, baseDebugView_1.renderVariable)(expression, data, true, highlights, this.linkDetector);
        }
        getInputBoxOptions(expression) {
            return undefined;
        }
    };
    ReplVariablesRenderer.ID = 'replVariable';
    ReplVariablesRenderer = __decorate([
        __param(1, debug_1.IDebugService),
        __param(2, contextView_1.IContextViewService),
        __param(3, themeService_1.IThemeService)
    ], ReplVariablesRenderer);
    exports.ReplVariablesRenderer = ReplVariablesRenderer;
    class ReplRawObjectsRenderer {
        constructor(linkDetector) {
            this.linkDetector = linkDetector;
        }
        get templateId() {
            return ReplRawObjectsRenderer.ID;
        }
        renderTemplate(container) {
            container.classList.add('output');
            const expression = dom.append(container, $('.output.expression'));
            const name = dom.append(expression, $('span.name'));
            const label = new highlightedLabel_1.HighlightedLabel(name);
            const value = dom.append(expression, $('span.value'));
            return { container, expression, name, label, value };
        }
        renderElement(node, index, templateData) {
            // key
            const element = node.element;
            templateData.label.set(element.name ? `${element.name}:` : '', (0, filters_1.createMatches)(node.filterData));
            if (element.name) {
                templateData.name.textContent = `${element.name}:`;
            }
            else {
                templateData.name.textContent = '';
            }
            // value
            (0, baseDebugView_1.renderExpressionValue)(element.value, templateData.value, {
                showHover: false,
                linkDetector: this.linkDetector
            });
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    exports.ReplRawObjectsRenderer = ReplRawObjectsRenderer;
    ReplRawObjectsRenderer.ID = 'rawObject';
    function isNestedVariable(element) {
        return element instanceof debugModel_1.Variable && (element.parent instanceof replModel_1.ReplEvaluationResult || element.parent instanceof debugModel_1.Variable);
    }
    class ReplDelegate extends list_1.CachedListVirtualDelegate {
        constructor(configurationService) {
            super();
            this.configurationService = configurationService;
        }
        getHeight(element) {
            const config = this.configurationService.getValue('debug');
            if (!config.console.wordWrap) {
                return this.estimateHeight(element, true);
            }
            return super.getHeight(element);
        }
        estimateHeight(element, ignoreValueLength = false) {
            const config = this.configurationService.getValue('debug');
            const rowHeight = Math.ceil(1.3 * config.console.fontSize);
            const countNumberOfLines = (str) => Math.max(1, (str && str.match(/\r\n|\n/g) || []).length);
            const hasValue = (e) => typeof e.value === 'string';
            // Calculate a rough overestimation for the height
            // For every 70 characters increase the number of lines needed beyond the first
            if (hasValue(element) && !isNestedVariable(element)) {
                const value = element.value;
                const valueRows = countNumberOfLines(value) + (ignoreValueLength ? 0 : Math.floor(value.length / 70));
                return valueRows * rowHeight;
            }
            return rowHeight;
        }
        getTemplateId(element) {
            if (element instanceof debugModel_1.Variable && element.name) {
                return ReplVariablesRenderer.ID;
            }
            if (element instanceof replModel_1.ReplEvaluationResult || (element instanceof debugModel_1.Variable && !element.name)) {
                // Variable with no name is a top level variable which should be rendered like a repl element #17404
                return ReplEvaluationResultsRenderer.ID;
            }
            if (element instanceof replModel_1.ReplEvaluationInput) {
                return ReplEvaluationInputsRenderer.ID;
            }
            if (element instanceof replModel_1.SimpleReplElement) {
                return ReplSimpleElementsRenderer.ID;
            }
            if (element instanceof replModel_1.ReplGroup) {
                return ReplGroupRenderer.ID;
            }
            return ReplRawObjectsRenderer.ID;
        }
        hasDynamicHeight(element) {
            if (isNestedVariable(element)) {
                // Nested variables should always be in one line #111843
                return false;
            }
            // Empty elements should not have dynamic height since they will be invisible
            return element.toString().length > 0;
        }
    }
    exports.ReplDelegate = ReplDelegate;
    function isDebugSession(obj) {
        return typeof obj.getReplElements === 'function';
    }
    class ReplDataSource {
        hasChildren(element) {
            if (isDebugSession(element)) {
                return true;
            }
            return !!element.hasChildren;
        }
        getChildren(element) {
            if (isDebugSession(element)) {
                return Promise.resolve(element.getReplElements());
            }
            if (element instanceof replModel_1.RawObjectReplElement) {
                return element.getChildren();
            }
            if (element instanceof replModel_1.ReplGroup) {
                return Promise.resolve(element.getChildren());
            }
            return element.getChildren();
        }
    }
    exports.ReplDataSource = ReplDataSource;
    class ReplAccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('debugConsole', "Debug Console");
        }
        getAriaLabel(element) {
            if (element instanceof debugModel_1.Variable) {
                return (0, nls_1.localize)('replVariableAriaLabel', "Variable {0}, value {1}", element.name, element.value);
            }
            if (element instanceof replModel_1.SimpleReplElement || element instanceof replModel_1.ReplEvaluationInput || element instanceof replModel_1.ReplEvaluationResult) {
                return element.value + (element instanceof replModel_1.SimpleReplElement && element.count > 1 ? (0, nls_1.localize)({ key: 'occurred', comment: ['Front will the value of the debug console element. Placeholder will be replaced by a number which represents occurrance count.'] }, ", occurred {0} times", element.count) : '');
            }
            if (element instanceof replModel_1.RawObjectReplElement) {
                return (0, nls_1.localize)('replRawObjectAriaLabel', "Debug console variable {0}, value {1}", element.name, element.value);
            }
            if (element instanceof replModel_1.ReplGroup) {
                return (0, nls_1.localize)('replGroup', "Debug console group {0}", element.name);
            }
            return '';
        }
    }
    exports.ReplAccessibilityProvider = ReplAccessibilityProvider;
});
//# sourceMappingURL=replViewer.js.map