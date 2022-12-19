/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/workbench/contrib/testing/common/mainThreadTestCollection", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testItemCollection"], function (require, exports, uri_1, mainThreadTestCollection_1, testId_1, testItemCollection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testStubs = exports.getInitializedMainTestCollection = exports.TestTestCollection = exports.TestTestItem = void 0;
    class TestTestItem {
        constructor(controllerId, id, label, uri) {
            this.controllerId = controllerId;
            this.id = id;
            this._canResolveChildren = false;
            this.api = { controllerId: this.controllerId };
            this.children = (0, testItemCollection_1.createTestItemChildren)(this.api, i => i.api, TestTestItem);
            this.props = {
                extId: '',
                busy: false,
                description: null,
                error: null,
                label,
                range: null,
                sortText: null,
                tags: [],
                uri,
            };
        }
        get tags() {
            return this.props.tags.map(id => ({ id }));
        }
        set tags(value) {
            var _a, _b;
            (_b = (_a = this.api).listener) === null || _b === void 0 ? void 0 : _b.call(_a, { op: 1 /* TestItemEventOp.SetTags */, new: value, old: this.props.tags.map(t => ({ id: t })) });
            this.props.tags = value.map(tag => tag.id);
        }
        get canResolveChildren() {
            return this._canResolveChildren;
        }
        set canResolveChildren(value) {
            var _a, _b;
            this._canResolveChildren = value;
            (_b = (_a = this.api).listener) === null || _b === void 0 ? void 0 : _b.call(_a, { op: 2 /* TestItemEventOp.UpdateCanResolveChildren */, state: value });
        }
        get parent() {
            return this.api.parent;
        }
        get(key) {
            return this.props[key];
        }
        set(key, value) {
            var _a, _b;
            this.props[key] = value;
            (_b = (_a = this.api).listener) === null || _b === void 0 ? void 0 : _b.call(_a, { op: 4 /* TestItemEventOp.SetProp */, update: { [key]: value } });
        }
        toTestItem() {
            const props = Object.assign({}, this.props);
            props.extId = testId_1.TestId.fromExtHostTestItem(this, this.controllerId).toString();
            return props;
        }
    }
    exports.TestTestItem = TestTestItem;
    class TestTestCollection extends testItemCollection_1.TestItemCollection {
        constructor(controllerId = 'ctrlId') {
            super({
                controllerId,
                getApiFor: t => t.api,
                toITestItem: t => t.toTestItem(),
                getChildren: t => t.children,
                root: new TestTestItem(controllerId, controllerId, 'root'),
            });
        }
        get currentDiff() {
            return this.diff;
        }
        setDiff(diff) {
            this.diff = diff;
        }
    }
    exports.TestTestCollection = TestTestCollection;
    /**
     * Gets a main thread test collection initialized with the given set of
     * roots/stubs.
     */
    const getInitializedMainTestCollection = async (singleUse = exports.testStubs.nested()) => {
        const c = new mainThreadTestCollection_1.MainThreadTestCollection(async (t, l) => singleUse.expand(t, l));
        await singleUse.expand(singleUse.root.id, Infinity);
        c.apply(singleUse.collectDiff());
        return c;
    };
    exports.getInitializedMainTestCollection = getInitializedMainTestCollection;
    exports.testStubs = {
        nested: (idPrefix = 'id-') => {
            const collection = new TestTestCollection();
            collection.resolveHandler = item => {
                if (item === undefined) {
                    const a = new TestTestItem('ctrlId', idPrefix + 'a', 'a', uri_1.URI.file('/'));
                    a.canResolveChildren = true;
                    const b = new TestTestItem('ctrlId', idPrefix + 'b', 'b', uri_1.URI.file('/'));
                    collection.root.children.add(a);
                    collection.root.children.add(b);
                }
                else if (item.id === idPrefix + 'a') {
                    item.children.add(new TestTestItem('ctrlId', idPrefix + 'aa', 'aa', uri_1.URI.file('/')));
                    item.children.add(new TestTestItem('ctrlId', idPrefix + 'ab', 'ab', uri_1.URI.file('/')));
                }
            };
            return collection;
        },
    };
});
//# sourceMappingURL=testStubs.js.map