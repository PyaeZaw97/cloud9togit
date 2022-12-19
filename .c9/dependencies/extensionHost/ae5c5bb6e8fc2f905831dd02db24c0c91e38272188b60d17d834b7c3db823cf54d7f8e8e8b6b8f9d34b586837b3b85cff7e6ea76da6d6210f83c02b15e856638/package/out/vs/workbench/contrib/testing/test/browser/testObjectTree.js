/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/tree/objectTree", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/testing/browser/explorerProjections/index", "vs/workbench/contrib/testing/common/mainThreadTestCollection", "vs/workbench/contrib/testing/test/common/testStubs"], function (require, exports, objectTree_1, event_1, lifecycle_1, index_1, mainThreadTestCollection_1, testStubs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestTreeTestHarness = exports.TestObjectTree = void 0;
    const element = document.createElement('div');
    element.style.height = '1000px';
    element.style.width = '200px';
    class TestObjectTree extends objectTree_1.ObjectTree {
        constructor(serializer) {
            super('test', element, {
                getHeight: () => 20,
                getTemplateId: () => 'default'
            }, [
                {
                    disposeTemplate: () => undefined,
                    renderElement: (node, _index, container) => {
                        Object.assign(container.dataset, node.element);
                        container.textContent = `${node.depth}:${serializer(node.element)}`;
                    },
                    renderTemplate: c => c,
                    templateId: 'default'
                }
            ], {
                sorter: {
                    compare: (a, b) => serializer(a).localeCompare(serializer(b))
                }
            });
            this.layout(1000, 200);
        }
        getModel() {
            return this.model;
        }
        getRendered(getProperty) {
            var _a, _b;
            const elements = element.querySelectorAll('.monaco-tl-contents');
            const sorted = [...elements].sort((a, b) => pos(a) - pos(b));
            let chain = [{ e: '', children: [] }];
            for (const element of sorted) {
                const [depthStr, label] = element.textContent.split(':');
                const depth = Number(depthStr);
                const parent = chain[depth - 1];
                const child = { e: label };
                if (getProperty) {
                    child.data = element.dataset[getProperty];
                }
                parent.children = (_b = (_a = parent.children) === null || _a === void 0 ? void 0 : _a.concat(child)) !== null && _b !== void 0 ? _b : [child];
                chain[depth] = child;
            }
            return chain[0].children;
        }
    }
    exports.TestObjectTree = TestObjectTree;
    const pos = (element) => Number(element.parentElement.parentElement.getAttribute('aria-posinset'));
    // names are hard
    class TestTreeTestHarness extends lifecycle_1.Disposable {
        constructor(makeTree, c = testStubs_1.testStubs.nested()) {
            super();
            this.c = c;
            this.onDiff = this._register(new event_1.Emitter());
            this.onFolderChange = this._register(new event_1.Emitter());
            this.isProcessingDiff = false;
            this._register(c);
            this.c.onDidGenerateDiff(d => this.c.setDiff(d /* don't clear during testing */));
            const collection = new mainThreadTestCollection_1.MainThreadTestCollection((testId, levels) => {
                this.c.expand(testId, levels);
                if (!this.isProcessingDiff) {
                    this.onDiff.fire(this.c.collectDiff());
                }
                return Promise.resolve();
            });
            this._register(this.onDiff.event(diff => collection.apply(diff)));
            this.projection = this._register(makeTree({
                collection,
                onDidProcessDiff: this.onDiff.event,
            }));
            this.tree = this._register(new TestObjectTree(t => 'label' in t ? t.label : t.message.toString()));
            this._register(this.tree.onDidChangeCollapseState(evt => {
                if (evt.node.element instanceof index_1.TestItemTreeElement) {
                    this.projection.expandElement(evt.node.element, evt.deep ? Infinity : 0);
                }
            }));
        }
        pushDiff(...diff) {
            this.onDiff.fire(diff);
        }
        flush() {
            this.isProcessingDiff = true;
            while (this.c.currentDiff.length) {
                this.onDiff.fire(this.c.collectDiff());
            }
            this.isProcessingDiff = false;
            this.projection.applyTo(this.tree);
            return this.tree.getRendered();
        }
    }
    exports.TestTreeTestHarness = TestTreeTestHarness;
});
//# sourceMappingURL=testObjectTree.js.map