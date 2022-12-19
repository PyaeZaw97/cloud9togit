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
define(["require", "exports", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/workbench/contrib/testing/common/observableValue", "vs/workbench/contrib/testing/common/storedValue"], function (require, exports, iterator_1, lifecycle_1, storage_1, observableValue_1, storedValue_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestExclusions = void 0;
    let TestExclusions = class TestExclusions extends lifecycle_1.Disposable {
        constructor(storageService) {
            super();
            this.storageService = storageService;
            this.excluded = this._register(observableValue_1.MutableObservableValue.stored(new storedValue_1.StoredValue({
                key: 'excludedTestItems',
                scope: 1 /* StorageScope.WORKSPACE */,
                target: 0 /* StorageTarget.USER */,
                serialization: {
                    deserialize: v => new Set(JSON.parse(v)),
                    serialize: v => JSON.stringify([...v])
                },
            }, this.storageService), new Set()));
            /**
             * Event that fires when the excluded tests change.
             */
            this.onTestExclusionsChanged = this.excluded.onDidChange;
        }
        /**
         * Gets whether there's any excluded tests.
         */
        get hasAny() {
            return this.excluded.value.size > 0;
        }
        /**
         * Gets all excluded tests.
         */
        get all() {
            return this.excluded.value;
        }
        /**
         * Sets whether a test is excluded.
         */
        toggle(test, exclude) {
            if (exclude !== true && this.excluded.value.has(test.item.extId)) {
                this.excluded.value = new Set(iterator_1.Iterable.filter(this.excluded.value, e => e !== test.item.extId));
            }
            else if (exclude !== false && !this.excluded.value.has(test.item.extId)) {
                this.excluded.value = new Set([...this.excluded.value, test.item.extId]);
            }
        }
        /**
         * Gets whether a test is excluded.
         */
        contains(test) {
            return this.excluded.value.has(test.item.extId);
        }
        /**
         * Removes all test exclusions.
         */
        clear() {
            this.excluded.value = new Set();
        }
    };
    TestExclusions = __decorate([
        __param(0, storage_1.IStorageService)
    ], TestExclusions);
    exports.TestExclusions = TestExclusions;
});
//# sourceMappingURL=testExclusions.js.map