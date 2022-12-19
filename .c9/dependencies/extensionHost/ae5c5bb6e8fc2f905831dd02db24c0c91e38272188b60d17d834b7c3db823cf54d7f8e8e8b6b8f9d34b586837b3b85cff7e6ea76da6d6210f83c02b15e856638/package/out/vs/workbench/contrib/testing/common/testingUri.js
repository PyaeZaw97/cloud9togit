/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri"], function (require, exports, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildTestUri = exports.parseTestUri = exports.TestUriType = exports.TEST_DATA_SCHEME = void 0;
    exports.TEST_DATA_SCHEME = 'vscode-test-data';
    var TestUriType;
    (function (TestUriType) {
        TestUriType[TestUriType["ResultMessage"] = 0] = "ResultMessage";
        TestUriType[TestUriType["ResultActualOutput"] = 1] = "ResultActualOutput";
        TestUriType[TestUriType["ResultExpectedOutput"] = 2] = "ResultExpectedOutput";
    })(TestUriType = exports.TestUriType || (exports.TestUriType = {}));
    var TestUriParts;
    (function (TestUriParts) {
        TestUriParts["Results"] = "results";
        TestUriParts["Messages"] = "message";
        TestUriParts["Text"] = "TestFailureMessage";
        TestUriParts["ActualOutput"] = "ActualOutput";
        TestUriParts["ExpectedOutput"] = "ExpectedOutput";
    })(TestUriParts || (TestUriParts = {}));
    const parseTestUri = (uri) => {
        const type = uri.authority;
        const [locationId, ...request] = uri.path.slice(1).split('/');
        if (request[0] === "message" /* TestUriParts.Messages */) {
            const taskIndex = Number(request[1]);
            const index = Number(request[2]);
            const part = request[3];
            const testExtId = uri.query;
            if (type === "results" /* TestUriParts.Results */) {
                switch (part) {
                    case "TestFailureMessage" /* TestUriParts.Text */:
                        return { resultId: locationId, taskIndex, testExtId, messageIndex: index, type: 0 /* TestUriType.ResultMessage */ };
                    case "ActualOutput" /* TestUriParts.ActualOutput */:
                        return { resultId: locationId, taskIndex, testExtId, messageIndex: index, type: 1 /* TestUriType.ResultActualOutput */ };
                    case "ExpectedOutput" /* TestUriParts.ExpectedOutput */:
                        return { resultId: locationId, taskIndex, testExtId, messageIndex: index, type: 2 /* TestUriType.ResultExpectedOutput */ };
                }
            }
        }
        return undefined;
    };
    exports.parseTestUri = parseTestUri;
    const buildTestUri = (parsed) => {
        const uriParts = {
            scheme: exports.TEST_DATA_SCHEME,
            authority: "results" /* TestUriParts.Results */
        };
        const msgRef = (locationId, ...remaining) => uri_1.URI.from(Object.assign(Object.assign({}, uriParts), { query: parsed.testExtId, path: ['', locationId, "message" /* TestUriParts.Messages */, ...remaining].join('/') }));
        switch (parsed.type) {
            case 1 /* TestUriType.ResultActualOutput */:
                return msgRef(parsed.resultId, parsed.taskIndex, parsed.messageIndex, "ActualOutput" /* TestUriParts.ActualOutput */);
            case 2 /* TestUriType.ResultExpectedOutput */:
                return msgRef(parsed.resultId, parsed.taskIndex, parsed.messageIndex, "ExpectedOutput" /* TestUriParts.ExpectedOutput */);
            case 0 /* TestUriType.ResultMessage */:
                return msgRef(parsed.resultId, parsed.taskIndex, parsed.messageIndex, "TestFailureMessage" /* TestUriParts.Text */);
            default:
                throw new Error('Invalid test uri');
        }
    };
    exports.buildTestUri = buildTestUri;
});
//# sourceMappingURL=testingUri.js.map