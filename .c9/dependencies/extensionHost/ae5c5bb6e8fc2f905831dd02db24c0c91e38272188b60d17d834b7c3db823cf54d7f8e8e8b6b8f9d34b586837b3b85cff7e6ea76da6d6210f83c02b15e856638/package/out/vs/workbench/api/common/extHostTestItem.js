define(["require", "exports", "vs/editor/common/core/range", "vs/workbench/api/common/extHostTestingPrivateApi", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testItemCollection", "vs/workbench/contrib/testing/common/testTypes", "vs/workbench/api/common/extHostTypeConverters", "vs/base/common/uri"], function (require, exports, editorRange, extHostTestingPrivateApi_1, testId_1, testItemCollection_1, testTypes_1, Convert, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTestItemCollection = exports.TestItemRootImpl = exports.TestItemImpl = exports.toItemFromContext = void 0;
    const testItemPropAccessor = (api, defaultValue, equals, toUpdate) => {
        let value = defaultValue;
        return {
            enumerable: true,
            configurable: false,
            get() {
                return value;
            },
            set(newValue) {
                var _a;
                if (!equals(value, newValue)) {
                    const oldValue = value;
                    value = newValue;
                    (_a = api.listener) === null || _a === void 0 ? void 0 : _a.call(api, toUpdate(newValue, oldValue));
                }
            },
        };
    };
    const strictEqualComparator = (a, b) => a === b;
    const propComparators = {
        range: (a, b) => {
            if (a === b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return a.isEqual(b);
        },
        label: strictEqualComparator,
        description: strictEqualComparator,
        sortText: strictEqualComparator,
        busy: strictEqualComparator,
        error: strictEqualComparator,
        canResolveChildren: strictEqualComparator,
        tags: (a, b) => {
            if (a.length !== b.length) {
                return false;
            }
            if (a.some(t1 => !b.find(t2 => t1.id === t2.id))) {
                return false;
            }
            return true;
        },
    };
    const evSetProps = (fn) => v => ({ op: 4 /* TestItemEventOp.SetProp */, update: fn(v) });
    const makePropDescriptors = (api, label) => ({
        range: testItemPropAccessor(api, undefined, propComparators.range, evSetProps(r => ({ range: editorRange.Range.lift(Convert.Range.from(r)) }))),
        label: testItemPropAccessor(api, label, propComparators.label, evSetProps(label => ({ label }))),
        description: testItemPropAccessor(api, undefined, propComparators.description, evSetProps(description => ({ description }))),
        sortText: testItemPropAccessor(api, undefined, propComparators.sortText, evSetProps(sortText => ({ sortText }))),
        canResolveChildren: testItemPropAccessor(api, false, propComparators.canResolveChildren, state => ({
            op: 2 /* TestItemEventOp.UpdateCanResolveChildren */,
            state,
        })),
        busy: testItemPropAccessor(api, false, propComparators.busy, evSetProps(busy => ({ busy }))),
        error: testItemPropAccessor(api, undefined, propComparators.error, evSetProps(error => ({ error: Convert.MarkdownString.fromStrict(error) || null }))),
        tags: testItemPropAccessor(api, [], propComparators.tags, (current, previous) => ({
            op: 1 /* TestItemEventOp.SetTags */,
            new: current.map(Convert.TestTag.from),
            old: previous.map(Convert.TestTag.from),
        })),
    });
    const toItemFromPlain = (item) => {
        const testId = testId_1.TestId.fromString(item.extId);
        const testItem = new TestItemImpl(testId.controllerId, testId.localId, item.label, uri_1.URI.revive(item.uri) || undefined);
        testItem.range = Convert.Range.to(item.range || undefined);
        testItem.description = item.description || undefined;
        testItem.sortText = item.sortText || undefined;
        testItem.tags = item.tags.map(t => Convert.TestTag.to({ id: (0, testTypes_1.denamespaceTestTag)(t).tagId }));
        return testItem;
    };
    const toItemFromContext = (context) => {
        let node;
        for (const test of context.tests) {
            const next = toItemFromPlain(test.item);
            (0, extHostTestingPrivateApi_1.getPrivateApiFor)(next).parent = node;
            node = next;
        }
        return node;
    };
    exports.toItemFromContext = toItemFromContext;
    class TestItemImpl {
        /**
         * Note that data is deprecated and here for back-compat only
         */
        constructor(controllerId, id, label, uri) {
            if (id.includes("\0" /* TestIdPathParts.Delimiter */)) {
                throw new Error(`Test IDs may not include the ${JSON.stringify(id)} symbol`);
            }
            const api = (0, extHostTestingPrivateApi_1.createPrivateApiFor)(this, controllerId);
            Object.defineProperties(this, Object.assign({ id: {
                    value: id,
                    enumerable: true,
                    writable: false,
                }, uri: {
                    value: uri,
                    enumerable: true,
                    writable: false,
                }, parent: {
                    enumerable: false,
                    get() {
                        return api.parent instanceof TestItemRootImpl ? undefined : api.parent;
                    },
                }, children: {
                    value: (0, testItemCollection_1.createTestItemChildren)(api, extHostTestingPrivateApi_1.getPrivateApiFor, TestItemImpl),
                    enumerable: true,
                    writable: false,
                } }, makePropDescriptors(api, label)));
        }
    }
    exports.TestItemImpl = TestItemImpl;
    class TestItemRootImpl extends TestItemImpl {
        constructor(controllerId, label) {
            super(controllerId, controllerId, label, undefined);
        }
    }
    exports.TestItemRootImpl = TestItemRootImpl;
    class ExtHostTestItemCollection extends testItemCollection_1.TestItemCollection {
        constructor(controllerId, controllerLabel) {
            super({
                controllerId,
                getApiFor: extHostTestingPrivateApi_1.getPrivateApiFor,
                getChildren: (item) => item.children,
                root: new TestItemRootImpl(controllerId, controllerLabel),
                toITestItem: Convert.TestItem.from,
            });
        }
    }
    exports.ExtHostTestItemCollection = ExtHostTestItemCollection;
});
//# sourceMappingURL=extHostTestItem.js.map