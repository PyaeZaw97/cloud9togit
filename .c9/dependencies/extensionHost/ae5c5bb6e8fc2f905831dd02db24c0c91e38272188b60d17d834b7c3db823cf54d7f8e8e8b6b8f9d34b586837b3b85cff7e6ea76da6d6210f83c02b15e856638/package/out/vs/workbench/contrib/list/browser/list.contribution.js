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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/platform/list/browser/listService", "vs/platform/registry/common/platform", "vs/workbench/common/contributions"], function (require, exports, contextkey_1, listService_1, platform_1, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListContext = exports.WorkbenchListAutomaticKeyboardNavigation = exports.WorkbenchListSupportsKeyboardNavigation = void 0;
    exports.WorkbenchListSupportsKeyboardNavigation = new contextkey_1.RawContextKey('listSupportsKeyboardNavigation', true);
    exports.WorkbenchListAutomaticKeyboardNavigation = new contextkey_1.RawContextKey(listService_1.WorkbenchListAutomaticKeyboardNavigationKey, true);
    let ListContext = class ListContext {
        constructor(contextKeyService) {
            exports.WorkbenchListSupportsKeyboardNavigation.bindTo(contextKeyService);
            exports.WorkbenchListAutomaticKeyboardNavigation.bindTo(contextKeyService);
        }
    };
    ListContext = __decorate([
        __param(0, contextkey_1.IContextKeyService)
    ], ListContext);
    exports.ListContext = ListContext;
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(ListContext, 1 /* LifecyclePhase.Starting */);
});
//# sourceMappingURL=list.contribution.js.map