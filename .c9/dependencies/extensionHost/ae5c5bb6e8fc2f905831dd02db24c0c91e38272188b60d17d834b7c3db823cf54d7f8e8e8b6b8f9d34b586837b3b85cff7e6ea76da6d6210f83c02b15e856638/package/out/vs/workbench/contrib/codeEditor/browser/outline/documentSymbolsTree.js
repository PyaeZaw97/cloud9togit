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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/common/filters", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/nls", "vs/base/browser/ui/iconLabel/iconLabel", "vs/platform/configuration/common/configuration", "vs/platform/markers/common/markers", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/base/common/async", "vs/editor/common/services/textResourceConfiguration", "vs/base/common/codicons", "vs/css!./documentSymbolsTree", "vs/editor/contrib/symbolIcons/browser/symbolIcons"], function (require, exports, dom, highlightedLabel_1, filters_1, range_1, languages_1, outlineModel_1, nls_1, iconLabel_1, configuration_1, markers_1, themeService_1, colorRegistry_1, async_1, textResourceConfiguration_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DocumentSymbolComparator = exports.DocumentSymbolFilter = exports.DocumentSymbolRenderer = exports.DocumentSymbolGroupRenderer = exports.DocumentSymbolVirtualDelegate = exports.DocumentSymbolIdentityProvider = exports.DocumentSymbolAccessibilityProvider = exports.DocumentSymbolNavigationLabelProvider = void 0;
    class DocumentSymbolNavigationLabelProvider {
        getKeyboardNavigationLabel(element) {
            if (element instanceof outlineModel_1.OutlineGroup) {
                return element.label;
            }
            else {
                return element.symbol.name;
            }
        }
    }
    exports.DocumentSymbolNavigationLabelProvider = DocumentSymbolNavigationLabelProvider;
    class DocumentSymbolAccessibilityProvider {
        constructor(_ariaLabel) {
            this._ariaLabel = _ariaLabel;
        }
        getWidgetAriaLabel() {
            return this._ariaLabel;
        }
        getAriaLabel(element) {
            if (element instanceof outlineModel_1.OutlineGroup) {
                return element.label;
            }
            else {
                return element.symbol.name;
            }
        }
    }
    exports.DocumentSymbolAccessibilityProvider = DocumentSymbolAccessibilityProvider;
    class DocumentSymbolIdentityProvider {
        getId(element) {
            return element.id;
        }
    }
    exports.DocumentSymbolIdentityProvider = DocumentSymbolIdentityProvider;
    class DocumentSymbolGroupTemplate {
        constructor(labelContainer, label) {
            this.labelContainer = labelContainer;
            this.label = label;
        }
    }
    DocumentSymbolGroupTemplate.id = 'DocumentSymbolGroupTemplate';
    class DocumentSymbolTemplate {
        constructor(container, iconLabel, iconClass, decoration) {
            this.container = container;
            this.iconLabel = iconLabel;
            this.iconClass = iconClass;
            this.decoration = decoration;
        }
    }
    DocumentSymbolTemplate.id = 'DocumentSymbolTemplate';
    class DocumentSymbolVirtualDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(element) {
            return element instanceof outlineModel_1.OutlineGroup
                ? DocumentSymbolGroupTemplate.id
                : DocumentSymbolTemplate.id;
        }
    }
    exports.DocumentSymbolVirtualDelegate = DocumentSymbolVirtualDelegate;
    class DocumentSymbolGroupRenderer {
        constructor() {
            this.templateId = DocumentSymbolGroupTemplate.id;
        }
        renderTemplate(container) {
            const labelContainer = dom.$('.outline-element-label');
            container.classList.add('outline-element');
            dom.append(container, labelContainer);
            return new DocumentSymbolGroupTemplate(labelContainer, new highlightedLabel_1.HighlightedLabel(labelContainer));
        }
        renderElement(node, _index, template) {
            template.label.set(node.element.label, (0, filters_1.createMatches)(node.filterData));
        }
        disposeTemplate(_template) {
            // nothing
        }
    }
    exports.DocumentSymbolGroupRenderer = DocumentSymbolGroupRenderer;
    let DocumentSymbolRenderer = class DocumentSymbolRenderer {
        constructor(_renderMarker, _configurationService, _themeService) {
            this._renderMarker = _renderMarker;
            this._configurationService = _configurationService;
            this._themeService = _themeService;
            this.templateId = DocumentSymbolTemplate.id;
        }
        renderTemplate(container) {
            container.classList.add('outline-element');
            const iconLabel = new iconLabel_1.IconLabel(container, { supportHighlights: true });
            const iconClass = dom.$('.outline-element-icon');
            const decoration = dom.$('.outline-element-decoration');
            container.prepend(iconClass);
            container.appendChild(decoration);
            return new DocumentSymbolTemplate(container, iconLabel, iconClass, decoration);
        }
        renderElement(node, _index, template) {
            const { element } = node;
            const options = {
                matches: (0, filters_1.createMatches)(node.filterData),
                labelEscapeNewLines: true,
                extraClasses: ['nowrap'],
                title: (0, nls_1.localize)('title.template', "{0} ({1})", element.symbol.name, DocumentSymbolRenderer._symbolKindNames[element.symbol.kind])
            };
            if (this._configurationService.getValue("outline.icons" /* OutlineConfigKeys.icons */)) {
                // add styles for the icons
                template.iconClass.className = '';
                template.iconClass.classList.add('outline-element-icon', 'inline', ...codicons_1.CSSIcon.asClassNameArray(languages_1.SymbolKinds.toIcon(element.symbol.kind)));
            }
            if (element.symbol.tags.indexOf(1 /* SymbolTag.Deprecated */) >= 0) {
                options.extraClasses.push(`deprecated`);
                options.matches = [];
            }
            template.iconLabel.setLabel(element.symbol.name, element.symbol.detail, options);
            if (this._renderMarker) {
                this._renderMarkerInfo(element, template);
            }
        }
        _renderMarkerInfo(element, template) {
            if (!element.marker) {
                dom.hide(template.decoration);
                template.container.style.removeProperty('--outline-element-color');
                return;
            }
            const { count, topSev } = element.marker;
            const color = this._themeService.getColorTheme().getColor(topSev === markers_1.MarkerSeverity.Error ? colorRegistry_1.listErrorForeground : colorRegistry_1.listWarningForeground);
            const cssColor = color ? color.toString() : 'inherit';
            // color of the label
            if (this._configurationService.getValue("outline.problems.colors" /* OutlineConfigKeys.problemsColors */)) {
                template.container.style.setProperty('--outline-element-color', cssColor);
            }
            else {
                template.container.style.removeProperty('--outline-element-color');
            }
            // badge with color/rollup
            if (!this._configurationService.getValue("outline.problems.badges" /* OutlineConfigKeys.problemsBadges */)) {
                dom.hide(template.decoration);
            }
            else if (count > 0) {
                dom.show(template.decoration);
                template.decoration.classList.remove('bubble');
                template.decoration.innerText = count < 10 ? count.toString() : '+9';
                template.decoration.title = count === 1 ? (0, nls_1.localize)('1.problem', "1 problem in this element") : (0, nls_1.localize)('N.problem', "{0} problems in this element", count);
                template.decoration.style.setProperty('--outline-element-color', cssColor);
            }
            else {
                dom.show(template.decoration);
                template.decoration.classList.add('bubble');
                template.decoration.innerText = '\uea71';
                template.decoration.title = (0, nls_1.localize)('deep.problem', "Contains elements with problems");
                template.decoration.style.setProperty('--outline-element-color', cssColor);
            }
        }
        disposeTemplate(_template) {
            _template.iconLabel.dispose();
        }
    };
    DocumentSymbolRenderer._symbolKindNames = {
        [17 /* SymbolKind.Array */]: (0, nls_1.localize)('Array', "array"),
        [16 /* SymbolKind.Boolean */]: (0, nls_1.localize)('Boolean', "boolean"),
        [4 /* SymbolKind.Class */]: (0, nls_1.localize)('Class', "class"),
        [13 /* SymbolKind.Constant */]: (0, nls_1.localize)('Constant', "constant"),
        [8 /* SymbolKind.Constructor */]: (0, nls_1.localize)('Constructor', "constructor"),
        [9 /* SymbolKind.Enum */]: (0, nls_1.localize)('Enum', "enumeration"),
        [21 /* SymbolKind.EnumMember */]: (0, nls_1.localize)('EnumMember', "enumeration member"),
        [23 /* SymbolKind.Event */]: (0, nls_1.localize)('Event', "event"),
        [7 /* SymbolKind.Field */]: (0, nls_1.localize)('Field', "field"),
        [0 /* SymbolKind.File */]: (0, nls_1.localize)('File', "file"),
        [11 /* SymbolKind.Function */]: (0, nls_1.localize)('Function', "function"),
        [10 /* SymbolKind.Interface */]: (0, nls_1.localize)('Interface', "interface"),
        [19 /* SymbolKind.Key */]: (0, nls_1.localize)('Key', "key"),
        [5 /* SymbolKind.Method */]: (0, nls_1.localize)('Method', "method"),
        [1 /* SymbolKind.Module */]: (0, nls_1.localize)('Module', "module"),
        [2 /* SymbolKind.Namespace */]: (0, nls_1.localize)('Namespace', "namespace"),
        [20 /* SymbolKind.Null */]: (0, nls_1.localize)('Null', "null"),
        [15 /* SymbolKind.Number */]: (0, nls_1.localize)('Number', "number"),
        [18 /* SymbolKind.Object */]: (0, nls_1.localize)('Object', "object"),
        [24 /* SymbolKind.Operator */]: (0, nls_1.localize)('Operator', "operator"),
        [3 /* SymbolKind.Package */]: (0, nls_1.localize)('Package', "package"),
        [6 /* SymbolKind.Property */]: (0, nls_1.localize)('Property', "property"),
        [14 /* SymbolKind.String */]: (0, nls_1.localize)('String', "string"),
        [22 /* SymbolKind.Struct */]: (0, nls_1.localize)('Struct', "struct"),
        [25 /* SymbolKind.TypeParameter */]: (0, nls_1.localize)('TypeParameter', "type parameter"),
        [12 /* SymbolKind.Variable */]: (0, nls_1.localize)('Variable', "variable"),
    };
    DocumentSymbolRenderer = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, themeService_1.IThemeService)
    ], DocumentSymbolRenderer);
    exports.DocumentSymbolRenderer = DocumentSymbolRenderer;
    let DocumentSymbolFilter = class DocumentSymbolFilter {
        constructor(_prefix, _textResourceConfigService) {
            this._prefix = _prefix;
            this._textResourceConfigService = _textResourceConfigService;
        }
        filter(element) {
            const outline = outlineModel_1.OutlineModel.get(element);
            if (!(element instanceof outlineModel_1.OutlineElement)) {
                return true;
            }
            const configName = DocumentSymbolFilter.kindToConfigName[element.symbol.kind];
            const configKey = `${this._prefix}.${configName}`;
            return this._textResourceConfigService.getValue(outline === null || outline === void 0 ? void 0 : outline.uri, configKey);
        }
    };
    DocumentSymbolFilter.kindToConfigName = Object.freeze({
        [0 /* SymbolKind.File */]: 'showFiles',
        [1 /* SymbolKind.Module */]: 'showModules',
        [2 /* SymbolKind.Namespace */]: 'showNamespaces',
        [3 /* SymbolKind.Package */]: 'showPackages',
        [4 /* SymbolKind.Class */]: 'showClasses',
        [5 /* SymbolKind.Method */]: 'showMethods',
        [6 /* SymbolKind.Property */]: 'showProperties',
        [7 /* SymbolKind.Field */]: 'showFields',
        [8 /* SymbolKind.Constructor */]: 'showConstructors',
        [9 /* SymbolKind.Enum */]: 'showEnums',
        [10 /* SymbolKind.Interface */]: 'showInterfaces',
        [11 /* SymbolKind.Function */]: 'showFunctions',
        [12 /* SymbolKind.Variable */]: 'showVariables',
        [13 /* SymbolKind.Constant */]: 'showConstants',
        [14 /* SymbolKind.String */]: 'showStrings',
        [15 /* SymbolKind.Number */]: 'showNumbers',
        [16 /* SymbolKind.Boolean */]: 'showBooleans',
        [17 /* SymbolKind.Array */]: 'showArrays',
        [18 /* SymbolKind.Object */]: 'showObjects',
        [19 /* SymbolKind.Key */]: 'showKeys',
        [20 /* SymbolKind.Null */]: 'showNull',
        [21 /* SymbolKind.EnumMember */]: 'showEnumMembers',
        [22 /* SymbolKind.Struct */]: 'showStructs',
        [23 /* SymbolKind.Event */]: 'showEvents',
        [24 /* SymbolKind.Operator */]: 'showOperators',
        [25 /* SymbolKind.TypeParameter */]: 'showTypeParameters',
    });
    DocumentSymbolFilter = __decorate([
        __param(1, textResourceConfiguration_1.ITextResourceConfigurationService)
    ], DocumentSymbolFilter);
    exports.DocumentSymbolFilter = DocumentSymbolFilter;
    class DocumentSymbolComparator {
        constructor() {
            this._collator = new async_1.IdleValue(() => new Intl.Collator(undefined, { numeric: true }));
        }
        compareByPosition(a, b) {
            if (a instanceof outlineModel_1.OutlineGroup && b instanceof outlineModel_1.OutlineGroup) {
                return a.order - b.order;
            }
            else if (a instanceof outlineModel_1.OutlineElement && b instanceof outlineModel_1.OutlineElement) {
                return range_1.Range.compareRangesUsingStarts(a.symbol.range, b.symbol.range) || this._collator.value.compare(a.symbol.name, b.symbol.name);
            }
            return 0;
        }
        compareByType(a, b) {
            if (a instanceof outlineModel_1.OutlineGroup && b instanceof outlineModel_1.OutlineGroup) {
                return a.order - b.order;
            }
            else if (a instanceof outlineModel_1.OutlineElement && b instanceof outlineModel_1.OutlineElement) {
                return a.symbol.kind - b.symbol.kind || this._collator.value.compare(a.symbol.name, b.symbol.name);
            }
            return 0;
        }
        compareByName(a, b) {
            if (a instanceof outlineModel_1.OutlineGroup && b instanceof outlineModel_1.OutlineGroup) {
                return a.order - b.order;
            }
            else if (a instanceof outlineModel_1.OutlineElement && b instanceof outlineModel_1.OutlineElement) {
                return this._collator.value.compare(a.symbol.name, b.symbol.name) || range_1.Range.compareRangesUsingStarts(a.symbol.range, b.symbol.range);
            }
            return 0;
        }
    }
    exports.DocumentSymbolComparator = DocumentSymbolComparator;
});
//# sourceMappingURL=documentSymbolsTree.js.map