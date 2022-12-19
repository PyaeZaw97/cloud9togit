/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "vs/platform/request/node/requestService"], function (require, exports, electron_1, requestService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequestMainService = void 0;
    function getRawRequest(options) {
        return electron_1.net.request;
    }
    class RequestMainService extends requestService_1.RequestService {
        request(options, token) {
            return super.request(Object.assign(Object.assign({}, (options || {})), { getRawRequest }), token);
        }
    }
    exports.RequestMainService = RequestMainService;
});
//# sourceMappingURL=requestMainService.js.map