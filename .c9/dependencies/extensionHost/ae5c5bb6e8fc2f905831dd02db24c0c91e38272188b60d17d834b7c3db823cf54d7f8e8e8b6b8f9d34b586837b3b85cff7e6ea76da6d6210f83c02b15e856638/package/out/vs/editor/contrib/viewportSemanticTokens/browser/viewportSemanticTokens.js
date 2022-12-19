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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/services/getSemanticTokens", "vs/editor/common/services/model", "vs/editor/common/services/modelService", "vs/editor/common/services/semanticTokensProviderStyling", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/themeService", "vs/editor/common/services/languageFeatureDebounce", "vs/base/common/stopwatch", "vs/editor/common/services/languageFeatures"], function (require, exports, async_1, lifecycle_1, editorExtensions_1, getSemanticTokens_1, model_1, modelService_1, semanticTokensProviderStyling_1, configuration_1, themeService_1, languageFeatureDebounce_1, stopwatch_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ViewportSemanticTokensContribution = class ViewportSemanticTokensContribution extends lifecycle_1.Disposable {
        constructor(editor, _modelService, _themeService, _configurationService, languageFeatureDebounceService, languageFeaturesService) {
            super();
            this._modelService = _modelService;
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._editor = editor;
            this._provider = languageFeaturesService.documentRangeSemanticTokensProvider;
            this._debounceInformation = languageFeatureDebounceService.for(this._provider, 'DocumentRangeSemanticTokens', { min: 100, max: 500 });
            this._tokenizeViewport = this._register(new async_1.RunOnceScheduler(() => this._tokenizeViewportNow(), 100));
            this._outstandingRequests = [];
            const scheduleTokenizeViewport = () => {
                if (this._editor.hasModel()) {
                    this._tokenizeViewport.schedule(this._debounceInformation.get(this._editor.getModel()));
                }
            };
            this._register(this._editor.onDidScrollChange(() => {
                scheduleTokenizeViewport();
            }));
            this._register(this._editor.onDidChangeModel(() => {
                this._cancelAll();
                scheduleTokenizeViewport();
            }));
            this._register(this._editor.onDidChangeModelContent((e) => {
                this._cancelAll();
                scheduleTokenizeViewport();
            }));
            this._register(this._provider.onDidChange(() => {
                this._cancelAll();
                scheduleTokenizeViewport();
            }));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(modelService_1.SEMANTIC_HIGHLIGHTING_SETTING_ID)) {
                    this._cancelAll();
                    scheduleTokenizeViewport();
                }
            }));
            this._register(this._themeService.onDidColorThemeChange(() => {
                this._cancelAll();
                scheduleTokenizeViewport();
            }));
        }
        static get(editor) {
            return editor.getContribution(ViewportSemanticTokensContribution.ID);
        }
        _cancelAll() {
            for (const request of this._outstandingRequests) {
                request.cancel();
            }
            this._outstandingRequests = [];
        }
        _removeOutstandingRequest(req) {
            for (let i = 0, len = this._outstandingRequests.length; i < len; i++) {
                if (this._outstandingRequests[i] === req) {
                    this._outstandingRequests.splice(i, 1);
                    return;
                }
            }
        }
        _tokenizeViewportNow() {
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            if (model.tokenization.hasCompleteSemanticTokens()) {
                return;
            }
            if (!(0, modelService_1.isSemanticColoringEnabled)(model, this._themeService, this._configurationService)) {
                if (model.tokenization.hasSomeSemanticTokens()) {
                    model.tokenization.setSemanticTokens(null, false);
                }
                return;
            }
            if (!(0, getSemanticTokens_1.hasDocumentRangeSemanticTokensProvider)(this._provider, model)) {
                if (model.tokenization.hasSomeSemanticTokens()) {
                    model.tokenization.setSemanticTokens(null, false);
                }
                return;
            }
            const visibleRanges = this._editor.getVisibleRangesPlusViewportAboveBelow();
            this._outstandingRequests = this._outstandingRequests.concat(visibleRanges.map(range => this._requestRange(model, range)));
        }
        _requestRange(model, range) {
            const requestVersionId = model.getVersionId();
            const request = (0, async_1.createCancelablePromise)(token => Promise.resolve((0, getSemanticTokens_1.getDocumentRangeSemanticTokens)(this._provider, model, range, token)));
            const sw = new stopwatch_1.StopWatch(false);
            request.then((r) => {
                this._debounceInformation.update(model, sw.elapsed());
                if (!r || !r.tokens || model.isDisposed() || model.getVersionId() !== requestVersionId) {
                    return;
                }
                const { provider, tokens: result } = r;
                const styling = this._modelService.getSemanticTokensProviderStyling(provider);
                model.tokenization.setPartialSemanticTokens(range, (0, semanticTokensProviderStyling_1.toMultilineTokens2)(result, styling, model.getLanguageId()));
            }).then(() => this._removeOutstandingRequest(request), () => this._removeOutstandingRequest(request));
            return request;
        }
    };
    ViewportSemanticTokensContribution.ID = 'editor.contrib.viewportSemanticTokens';
    ViewportSemanticTokensContribution = __decorate([
        __param(1, model_1.IModelService),
        __param(2, themeService_1.IThemeService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(5, languageFeatures_1.ILanguageFeaturesService)
    ], ViewportSemanticTokensContribution);
    (0, editorExtensions_1.registerEditorContribution)(ViewportSemanticTokensContribution.ID, ViewportSemanticTokensContribution);
});
//# sourceMappingURL=viewportSemanticTokens.js.map