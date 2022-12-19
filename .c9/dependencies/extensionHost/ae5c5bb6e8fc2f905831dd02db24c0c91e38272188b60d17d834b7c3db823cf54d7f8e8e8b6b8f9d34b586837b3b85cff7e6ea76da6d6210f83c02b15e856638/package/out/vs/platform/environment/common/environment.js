/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.INativeEnvironmentService = exports.IEnvironmentService = void 0;
    exports.IEnvironmentService = (0, instantiation_1.createDecorator)('environmentService');
    exports.INativeEnvironmentService = (0, instantiation_1.refineServiceDecorator)(exports.IEnvironmentService);
});
//# sourceMappingURL=environment.js.map