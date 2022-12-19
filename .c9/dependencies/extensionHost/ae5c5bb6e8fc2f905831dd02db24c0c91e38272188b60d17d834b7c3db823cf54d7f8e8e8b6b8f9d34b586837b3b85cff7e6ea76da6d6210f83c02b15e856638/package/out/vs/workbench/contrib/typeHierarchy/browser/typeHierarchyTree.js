/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/typeHierarchy/common/typeHierarchy", "vs/base/common/cancellation", "vs/base/common/filters", "vs/base/browser/ui/iconLabel/iconLabel", "vs/editor/common/languages", "vs/base/common/strings", "vs/editor/common/core/range", "vs/nls", "vs/base/common/codicons"], function (require, exports, typeHierarchy_1, cancellation_1, filters_1, iconLabel_1, languages_1, strings_1, range_1, nls_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilityProvider = exports.VirtualDelegate = exports.TypeRenderer = exports.IdentityProvider = exports.Sorter = exports.DataSource = exports.Type = void 0;
    class Type {
        constructor(item, model, parent) {
            this.item = item;
            this.model = model;
            this.parent = parent;
        }
        static compare(a, b) {
            let res = (0, strings_1.compare)(a.item.uri.toString(), b.item.uri.toString());
            if (res === 0) {
                res = range_1.Range.compareRangesUsingStarts(a.item.range, b.item.range);
            }
            return res;
        }
    }
    exports.Type = Type;
    class DataSource {
        constructor(getDirection) {
            this.getDirection = getDirection;
        }
        hasChildren() {
            return true;
        }
        async getChildren(element) {
            if (element instanceof typeHierarchy_1.TypeHierarchyModel) {
                return element.roots.map(root => new Type(root, element, undefined));
            }
            const { model, item } = element;
            if (this.getDirection() === "supertypes" /* TypeHierarchyDirection.Supertypes */) {
                return (await model.provideSupertypes(item, cancellation_1.CancellationToken.None)).map(item => {
                    return new Type(item, model, element);
                });
            }
            else {
                return (await model.provideSubtypes(item, cancellation_1.CancellationToken.None)).map(item => {
                    return new Type(item, model, element);
                });
            }
        }
    }
    exports.DataSource = DataSource;
    class Sorter {
        compare(element, otherElement) {
            return Type.compare(element, otherElement);
        }
    }
    exports.Sorter = Sorter;
    class IdentityProvider {
        constructor(getDirection) {
            this.getDirection = getDirection;
        }
        getId(element) {
            let res = this.getDirection() + JSON.stringify(element.item.uri) + JSON.stringify(element.item.range);
            if (element.parent) {
                res += this.getId(element.parent);
            }
            return res;
        }
    }
    exports.IdentityProvider = IdentityProvider;
    class TypeRenderingTemplate {
        constructor(icon, label) {
            this.icon = icon;
            this.label = label;
        }
    }
    class TypeRenderer {
        constructor() {
            this.templateId = TypeRenderer.id;
        }
        renderTemplate(container) {
            container.classList.add('typehierarchy-element');
            let icon = document.createElement('div');
            container.appendChild(icon);
            const label = new iconLabel_1.IconLabel(container, { supportHighlights: true });
            return new TypeRenderingTemplate(icon, label);
        }
        renderElement(node, _index, template) {
            var _a;
            const { element, filterData } = node;
            const deprecated = (_a = element.item.tags) === null || _a === void 0 ? void 0 : _a.includes(1 /* SymbolTag.Deprecated */);
            template.icon.classList.add('inline', ...codicons_1.CSSIcon.asClassNameArray(languages_1.SymbolKinds.toIcon(element.item.kind)));
            template.label.setLabel(element.item.name, element.item.detail, { labelEscapeNewLines: true, matches: (0, filters_1.createMatches)(filterData), strikethrough: deprecated });
        }
        disposeTemplate(template) {
            template.label.dispose();
        }
    }
    exports.TypeRenderer = TypeRenderer;
    TypeRenderer.id = 'TypeRenderer';
    class VirtualDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(_element) {
            return TypeRenderer.id;
        }
    }
    exports.VirtualDelegate = VirtualDelegate;
    class AccessibilityProvider {
        constructor(getDirection) {
            this.getDirection = getDirection;
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('tree.aria', "Type Hierarchy");
        }
        getAriaLabel(element) {
            if (this.getDirection() === "supertypes" /* TypeHierarchyDirection.Supertypes */) {
                return (0, nls_1.localize)('supertypes', "supertypes of {0}", element.item.name);
            }
            else {
                return (0, nls_1.localize)('subtypes', "subtypes of {0}", element.item.name);
            }
        }
    }
    exports.AccessibilityProvider = AccessibilityProvider;
});
//# sourceMappingURL=typeHierarchyTree.js.map