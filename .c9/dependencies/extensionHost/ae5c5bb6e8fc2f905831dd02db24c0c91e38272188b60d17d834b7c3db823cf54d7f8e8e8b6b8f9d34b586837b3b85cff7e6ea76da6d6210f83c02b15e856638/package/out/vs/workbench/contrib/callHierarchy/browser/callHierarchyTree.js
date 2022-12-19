/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/callHierarchy/common/callHierarchy", "vs/base/common/cancellation", "vs/base/common/filters", "vs/base/browser/ui/iconLabel/iconLabel", "vs/editor/common/languages", "vs/base/common/strings", "vs/editor/common/core/range", "vs/nls", "vs/base/common/codicons"], function (require, exports, callHierarchy_1, cancellation_1, filters_1, iconLabel_1, languages_1, strings_1, range_1, nls_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilityProvider = exports.VirtualDelegate = exports.CallRenderer = exports.IdentityProvider = exports.Sorter = exports.DataSource = exports.Call = void 0;
    class Call {
        constructor(item, locations, model, parent) {
            this.item = item;
            this.locations = locations;
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
    exports.Call = Call;
    class DataSource {
        constructor(getDirection) {
            this.getDirection = getDirection;
        }
        hasChildren() {
            return true;
        }
        async getChildren(element) {
            if (element instanceof callHierarchy_1.CallHierarchyModel) {
                return element.roots.map(root => new Call(root, undefined, element, undefined));
            }
            const { model, item } = element;
            if (this.getDirection() === "outgoingCalls" /* CallHierarchyDirection.CallsFrom */) {
                return (await model.resolveOutgoingCalls(item, cancellation_1.CancellationToken.None)).map(call => {
                    return new Call(call.to, call.fromRanges.map(range => ({ range, uri: item.uri })), model, element);
                });
            }
            else {
                return (await model.resolveIncomingCalls(item, cancellation_1.CancellationToken.None)).map(call => {
                    return new Call(call.from, call.fromRanges.map(range => ({ range, uri: call.from.uri })), model, element);
                });
            }
        }
    }
    exports.DataSource = DataSource;
    class Sorter {
        compare(element, otherElement) {
            return Call.compare(element, otherElement);
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
    class CallRenderingTemplate {
        constructor(icon, label) {
            this.icon = icon;
            this.label = label;
        }
    }
    class CallRenderer {
        constructor() {
            this.templateId = CallRenderer.id;
        }
        renderTemplate(container) {
            container.classList.add('callhierarchy-element');
            let icon = document.createElement('div');
            container.appendChild(icon);
            const label = new iconLabel_1.IconLabel(container, { supportHighlights: true });
            return new CallRenderingTemplate(icon, label);
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
    exports.CallRenderer = CallRenderer;
    CallRenderer.id = 'CallRenderer';
    class VirtualDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(_element) {
            return CallRenderer.id;
        }
    }
    exports.VirtualDelegate = VirtualDelegate;
    class AccessibilityProvider {
        constructor(getDirection) {
            this.getDirection = getDirection;
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('tree.aria', "Call Hierarchy");
        }
        getAriaLabel(element) {
            if (this.getDirection() === "outgoingCalls" /* CallHierarchyDirection.CallsFrom */) {
                return (0, nls_1.localize)('from', "calls from {0}", element.item.name);
            }
            else {
                return (0, nls_1.localize)('to', "callers of {0}", element.item.name);
            }
        }
    }
    exports.AccessibilityProvider = AccessibilityProvider;
});
//# sourceMappingURL=callHierarchyTree.js.map