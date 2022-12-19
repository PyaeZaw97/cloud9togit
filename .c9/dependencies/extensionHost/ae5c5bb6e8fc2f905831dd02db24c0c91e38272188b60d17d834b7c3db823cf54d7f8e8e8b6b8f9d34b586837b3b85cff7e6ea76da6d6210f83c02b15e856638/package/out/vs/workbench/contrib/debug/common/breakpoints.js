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
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Breakpoints = void 0;
    let Breakpoints = class Breakpoints {
        constructor(breakpointContribution, contextKeyService) {
            this.breakpointContribution = breakpointContribution;
            this.contextKeyService = contextKeyService;
            this.breakpointsWhen = typeof breakpointContribution.when === 'string' ? contextkey_1.ContextKeyExpr.deserialize(breakpointContribution.when) : undefined;
        }
        get language() {
            return this.breakpointContribution.language;
        }
        get enabled() {
            return !this.breakpointsWhen || this.contextKeyService.contextMatchesRules(this.breakpointsWhen);
        }
    };
    Breakpoints = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], Breakpoints);
    exports.Breakpoints = Breakpoints;
});
//# sourceMappingURL=breakpoints.js.map