var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/base/common/glob", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/workbench/contrib/testing/common/observableValue", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testTypes"], function (require, exports, event_1, glob_1, instantiation_1, storage_1, observableValue_1, storedValue_1, testTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.allTestFilterTerms = exports.TestFilterTerm = exports.TestExplorerFilterState = exports.ITestExplorerFilterState = void 0;
    exports.ITestExplorerFilterState = (0, instantiation_1.createDecorator)('testingFilterState');
    const tagRe = /!?@([^ ,:]+)/g;
    const trimExtraWhitespace = (str) => str.replace(/\s\s+/g, ' ').trim();
    let TestExplorerFilterState = class TestExplorerFilterState {
        constructor(storageService) {
            this.storageService = storageService;
            this.focusEmitter = new event_1.Emitter();
            /**
             * Mapping of terms to whether they're included in the text.
             */
            this.termFilterState = {};
            /** @inheritdoc */
            this.globList = [];
            /** @inheritdoc */
            this.includeTags = new Set();
            /** @inheritdoc */
            this.excludeTags = new Set();
            /** @inheritdoc */
            this.text = new observableValue_1.MutableObservableValue('');
            /** @inheritdoc */
            this.fuzzy = observableValue_1.MutableObservableValue.stored(new storedValue_1.StoredValue({
                key: 'testHistoryFuzzy',
                scope: 0 /* StorageScope.GLOBAL */,
                target: 0 /* StorageTarget.USER */,
            }, this.storageService), false);
            this.reveal = new observableValue_1.MutableObservableValue(undefined);
            this.onDidRequestInputFocus = this.focusEmitter.event;
        }
        /** @inheritdoc */
        focusInput() {
            this.focusEmitter.fire();
        }
        /** @inheritdoc */
        setText(text) {
            if (text === this.text.value) {
                return;
            }
            this.termFilterState = {};
            this.globList = [];
            this.includeTags.clear();
            this.excludeTags.clear();
            let globText = '';
            let lastIndex = 0;
            for (const match of text.matchAll(tagRe)) {
                let nextIndex = match.index + match[0].length;
                const tag = match[0];
                if (exports.allTestFilterTerms.includes(tag)) {
                    this.termFilterState[tag] = true;
                }
                // recognize and parse @ctrlId:tagId or quoted like @ctrlId:"tag \\"id"
                if (text[nextIndex] === ':') {
                    nextIndex++;
                    let delimiter = text[nextIndex];
                    if (delimiter !== `"` && delimiter !== `'`) {
                        delimiter = ' ';
                    }
                    else {
                        nextIndex++;
                    }
                    let tagId = '';
                    while (nextIndex < text.length && text[nextIndex] !== delimiter) {
                        if (text[nextIndex] === '\\') {
                            tagId += text[nextIndex + 1];
                            nextIndex += 2;
                        }
                        else {
                            tagId += text[nextIndex];
                            nextIndex++;
                        }
                    }
                    if (match[0].startsWith('!')) {
                        this.excludeTags.add((0, testTypes_1.namespaceTestTag)(match[1], tagId));
                    }
                    else {
                        this.includeTags.add((0, testTypes_1.namespaceTestTag)(match[1], tagId));
                    }
                    nextIndex++;
                }
                globText += text.slice(lastIndex, match.index);
                lastIndex = nextIndex;
            }
            globText += text.slice(lastIndex).trim();
            if (globText.length) {
                for (const filter of (0, glob_1.splitGlobAware)(globText, ',').map(s => s.trim()).filter(s => !!s.length)) {
                    if (filter.startsWith('!')) {
                        this.globList.push({ include: false, text: filter.slice(1).toLowerCase() });
                    }
                    else {
                        this.globList.push({ include: true, text: filter.toLowerCase() });
                    }
                }
            }
            this.text.value = text; // purposely afterwards so everything is updated when the change event happen
        }
        /** @inheritdoc */
        isFilteringFor(term) {
            return !!this.termFilterState[term];
        }
        /** @inheritdoc */
        toggleFilteringFor(term, shouldFilter) {
            const text = this.text.value.trim();
            if (shouldFilter !== false && !this.termFilterState[term]) {
                this.setText(text ? `${text} ${term}` : term);
            }
            else if (shouldFilter !== true && this.termFilterState[term]) {
                this.setText(trimExtraWhitespace(text.replace(term, '')));
            }
        }
    };
    TestExplorerFilterState = __decorate([
        __param(0, storage_1.IStorageService)
    ], TestExplorerFilterState);
    exports.TestExplorerFilterState = TestExplorerFilterState;
    var TestFilterTerm;
    (function (TestFilterTerm) {
        TestFilterTerm["Failed"] = "@failed";
        TestFilterTerm["Executed"] = "@executed";
        TestFilterTerm["CurrentDoc"] = "@doc";
        TestFilterTerm["Hidden"] = "@hidden";
    })(TestFilterTerm = exports.TestFilterTerm || (exports.TestFilterTerm = {}));
    exports.allTestFilterTerms = [
        "@failed" /* TestFilterTerm.Failed */,
        "@executed" /* TestFilterTerm.Executed */,
        "@doc" /* TestFilterTerm.CurrentDoc */,
        "@hidden" /* TestFilterTerm.Hidden */,
    ];
});
//# sourceMappingURL=testExplorerFilterState.js.map