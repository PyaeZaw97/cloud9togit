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
define(["require", "exports", "vs/workbench/contrib/testing/browser/explorerProjections/display", "vs/workbench/contrib/testing/browser/explorerProjections/hierarchalByLocation", "vs/workbench/contrib/testing/browser/explorerProjections/hierarchalNodes", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testService"], function (require, exports, display_1, hierarchalByLocation_1, hierarchalNodes_1, testResultService_1, testService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HierarchicalByNameProjection = exports.ByNameTestItemElement = exports.ListElementType = void 0;
    /**
     * Type of test element in the list.
     */
    var ListElementType;
    (function (ListElementType) {
        /** The element is a leaf test that should be shown in the list */
        ListElementType[ListElementType["Leaf"] = 0] = "Leaf";
        /** The element is not runnable, but doesn't have any nested leaf tests */
        ListElementType[ListElementType["Branch"] = 1] = "Branch";
    })(ListElementType = exports.ListElementType || (exports.ListElementType = {}));
    /**
     * Version of the HierarchicalElement that is displayed as a list.
     */
    class ByNameTestItemElement extends hierarchalNodes_1.ByLocationTestItemElement {
        /**
         * @param actualParent Parent of the item in the test heirarchy
         */
        constructor(internal, parentItem, addedOrRemoved, actualParent) {
            super(internal, parentItem, addedOrRemoved);
            this.actualParent = actualParent;
            this.elementType = 0 /* ListElementType.Leaf */;
            this.isTestRoot = !this.actualParent;
            this.actualChildren = new Set();
            actualParent === null || actualParent === void 0 ? void 0 : actualParent.addChild(this);
        }
        get description() {
            let description = null;
            for (let parent = this.actualParent; parent && !parent.isTestRoot; parent = parent.actualParent) {
                description = description ? parent.label + display_1.flatTestItemDelimiter + description : parent.label;
            }
            return description;
        }
        /**
         * Should be called when the list element is removed.
         */
        remove() {
            var _a;
            (_a = this.actualParent) === null || _a === void 0 ? void 0 : _a.removeChild(this);
        }
        removeChild(element) {
            this.actualChildren.delete(element);
        }
        addChild(element) {
            this.actualChildren.add(element);
        }
    }
    exports.ByNameTestItemElement = ByNameTestItemElement;
    /**
     * Projection that shows tests in a flat list (grouped by provider). The only
     * change is that, while creating the item, the item parent is set to the
     * test root rather than the heirarchal parent.
     */
    let HierarchicalByNameProjection = class HierarchicalByNameProjection extends hierarchalByLocation_1.HierarchicalByLocationProjection {
        constructor(lastState, testService, results) {
            super(lastState, testService, results);
            const originalRenderNode = this.renderNode.bind(this);
            this.renderNode = (node, recurse) => {
                if (node instanceof ByNameTestItemElement && node.elementType !== 0 /* ListElementType.Leaf */ && !node.isTestRoot) {
                    return 1 /* NodeRenderDirective.Concat */;
                }
                const rendered = originalRenderNode(node, recurse);
                if (typeof rendered !== 'number') {
                    rendered.collapsible = false;
                }
                return rendered;
            };
        }
        /**
         * @override
         */
        createItem(item) {
            const actualParent = item.parent ? this.items.get(item.parent) : undefined;
            if (!actualParent) {
                return new ByNameTestItemElement(item, null, r => this.changes.addedOrRemoved(r));
            }
            if (actualParent.elementType === 0 /* ListElementType.Leaf */) {
                actualParent.elementType = 1 /* ListElementType.Branch */;
                this.changes.addedOrRemoved(actualParent);
            }
            return new ByNameTestItemElement(item, actualParent.parent || actualParent, r => this.changes.addedOrRemoved(r), actualParent);
        }
        /**
         * @override
         */
        unstoreItem(items, item) {
            const treeChildren = super.unstoreItem(items, item);
            if (item instanceof ByNameTestItemElement) {
                if (item.actualParent && item.actualParent.actualChildren.size === 1) {
                    item.actualParent.elementType = 0 /* ListElementType.Leaf */;
                    this.changes.addedOrRemoved(item.actualParent);
                }
                item.remove();
                return item.actualChildren;
            }
            return treeChildren;
        }
        /**
         * @override
         */
        getRevealDepth(element) {
            return element.depth === 0 ? Infinity : undefined;
        }
    };
    HierarchicalByNameProjection = __decorate([
        __param(1, testService_1.ITestService),
        __param(2, testResultService_1.ITestResultService)
    ], HierarchicalByNameProjection);
    exports.HierarchicalByNameProjection = HierarchicalByNameProjection;
});
//# sourceMappingURL=hierarchalByName.js.map