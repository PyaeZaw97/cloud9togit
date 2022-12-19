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
define(["require", "exports", "vs/base/common/uri", "vs/editor/common/languages/language", "vs/editor/common/services/model", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/editor/common/core/range", "vs/editor/common/services/resolverService", "vs/workbench/services/languageStatus/common/languageStatusService", "vs/base/common/lifecycle"], function (require, exports, uri_1, language_1, model_1, extHost_protocol_1, extHostCustomers_1, range_1, resolverService_1, languageStatusService_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadLanguages = void 0;
    let MainThreadLanguages = class MainThreadLanguages {
        constructor(_extHostContext, _languageService, _modelService, _resolverService, _languageStatusService) {
            this._languageService = _languageService;
            this._modelService = _modelService;
            this._resolverService = _resolverService;
            this._languageStatusService = _languageStatusService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._status = new Map();
            this._proxy = _extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostLanguages);
            this._proxy.$acceptLanguageIds(_languageService.getRegisteredLanguageIds());
            this._disposables.add(_languageService.onDidChange(_ => {
                this._proxy.$acceptLanguageIds(_languageService.getRegisteredLanguageIds());
            }));
        }
        dispose() {
            this._disposables.dispose();
            for (const status of this._status.values()) {
                status.dispose();
            }
            this._status.clear();
        }
        async $changeLanguage(resource, languageId) {
            if (!this._languageService.isRegisteredLanguageId(languageId)) {
                return Promise.reject(new Error(`Unknown language id: ${languageId}`));
            }
            const uri = uri_1.URI.revive(resource);
            const ref = await this._resolverService.createModelReference(uri);
            try {
                this._modelService.setMode(ref.object.textEditorModel, this._languageService.createById(languageId));
            }
            finally {
                ref.dispose();
            }
        }
        async $tokensAtPosition(resource, position) {
            const uri = uri_1.URI.revive(resource);
            const model = this._modelService.getModel(uri);
            if (!model) {
                return undefined;
            }
            model.tokenization.tokenizeIfCheap(position.lineNumber);
            const tokens = model.tokenization.getLineTokens(position.lineNumber);
            const idx = tokens.findTokenIndexAtOffset(position.column - 1);
            return {
                type: tokens.getStandardTokenType(idx),
                range: new range_1.Range(position.lineNumber, 1 + tokens.getStartOffset(idx), position.lineNumber, 1 + tokens.getEndOffset(idx))
            };
        }
        // --- language status
        $setLanguageStatus(handle, status) {
            var _a;
            (_a = this._status.get(handle)) === null || _a === void 0 ? void 0 : _a.dispose();
            this._status.set(handle, this._languageStatusService.addStatus(status));
        }
        $removeLanguageStatus(handle) {
            var _a;
            (_a = this._status.get(handle)) === null || _a === void 0 ? void 0 : _a.dispose();
        }
    };
    MainThreadLanguages = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadLanguages),
        __param(1, language_1.ILanguageService),
        __param(2, model_1.IModelService),
        __param(3, resolverService_1.ITextModelService),
        __param(4, languageStatusService_1.ILanguageStatusService)
    ], MainThreadLanguages);
    exports.MainThreadLanguages = MainThreadLanguages;
});
//# sourceMappingURL=mainThreadLanguages.js.map