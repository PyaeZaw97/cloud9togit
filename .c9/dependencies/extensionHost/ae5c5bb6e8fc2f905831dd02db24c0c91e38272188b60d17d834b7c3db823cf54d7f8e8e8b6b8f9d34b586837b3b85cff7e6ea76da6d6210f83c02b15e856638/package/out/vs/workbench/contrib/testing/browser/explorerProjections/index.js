/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/iterator", "vs/workbench/contrib/testing/common/testTypes"], function (require, exports, iterator_1, testTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestTreeErrorMessage = exports.TestItemTreeElement = void 0;
    let idCounter = 0;
    const getId = () => String(idCounter++);
    class TestItemTreeElement {
        constructor(test, parent = null) {
            this.test = test;
            this.parent = parent;
            /**
             * @inheritdoc
             */
            this.children = new Set();
            /**
             * @inheritdoc
             */
            this.treeId = getId();
            /**
             * @inheritdoc
             */
            this.depth = this.parent ? this.parent.depth + 1 : 0;
            /**
             * @inheritdoc
             */
            this.state = 0 /* TestResultState.Unset */;
            /**
             * Own, non-computed state.
             */
            this.ownState = 0 /* TestResultState.Unset */;
        }
        get tests() {
            return iterator_1.Iterable.single(this.test);
        }
        get description() {
            return this.test.item.description;
        }
        get sortText() {
            return this.test.item.sortText;
        }
        /**
         * @inheritdoc
         */
        get label() {
            return this.test.item.label;
        }
        toJSON() {
            if (this.depth === 0) {
                return { controllerId: this.test.controllerId };
            }
            const context = {
                $mid: 13 /* MarshalledId.TestItemContext */,
                tests: [testTypes_1.InternalTestItem.serialize(this.test)],
            };
            for (let p = this.parent; p && p.depth > 0; p = p.parent) {
                context.tests.unshift(testTypes_1.InternalTestItem.serialize(p.test));
            }
            return context;
        }
    }
    exports.TestItemTreeElement = TestItemTreeElement;
    class TestTreeErrorMessage {
        constructor(message, parent) {
            this.message = message;
            this.parent = parent;
            this.treeId = getId();
            this.children = new Set();
        }
        get description() {
            return typeof this.message === 'string' ? this.message : this.message.value;
        }
    }
    exports.TestTreeErrorMessage = TestTreeErrorMessage;
});
//# sourceMappingURL=index.js.map