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
define(["require", "exports", "vs/editor/common/services/resolverService", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/base/common/marked/marked", "vs/base/common/network", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/base/common/types", "vs/platform/instantiation/common/instantiation"], function (require, exports, resolverService_1, model_1, language_1, marked_1, network_1, range_1, textModel_1, types_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WalkThroughSnippetContentProvider = exports.requireToContent = void 0;
    function requireToContent(instantiationService, resource) {
        if (!resource.query) {
            throw new Error('Welcome: invalid resource');
        }
        const query = JSON.parse(resource.query);
        if (!query.moduleId) {
            throw new Error('Welcome: invalid resource');
        }
        const content = new Promise((resolve, reject) => {
            require([query.moduleId], content => {
                try {
                    resolve(instantiationService.invokeFunction(content.default));
                }
                catch (err) {
                    reject(err);
                }
            });
        });
        return content;
    }
    exports.requireToContent = requireToContent;
    let WalkThroughSnippetContentProvider = class WalkThroughSnippetContentProvider {
        constructor(textModelResolverService, languageService, modelService, instantiationService) {
            this.textModelResolverService = textModelResolverService;
            this.languageService = languageService;
            this.modelService = modelService;
            this.instantiationService = instantiationService;
            this.loads = new Map();
            this.textModelResolverService.registerTextModelContentProvider(network_1.Schemas.walkThroughSnippet, this);
        }
        async textBufferFactoryFromResource(resource) {
            let ongoing = this.loads.get(resource.toString());
            if (!ongoing) {
                ongoing = requireToContent(this.instantiationService, resource)
                    .then(content => (0, textModel_1.createTextBufferFactory)(content))
                    .finally(() => this.loads.delete(resource.toString()));
                this.loads.set(resource.toString(), ongoing);
            }
            return ongoing;
        }
        async provideTextContent(resource) {
            const factory = await this.textBufferFactoryFromResource(resource.with({ fragment: '' }));
            let codeEditorModel = this.modelService.getModel(resource);
            if (!codeEditorModel) {
                const j = parseInt(resource.fragment);
                let i = 0;
                const renderer = new marked_1.marked.Renderer();
                renderer.code = (code, lang) => {
                    i++;
                    const languageId = typeof lang === 'string' ? this.languageService.getLanguageIdByLanguageName(lang) || '' : '';
                    const languageSelection = this.languageService.createById(languageId);
                    // Create all models for this resource in one go... we'll need them all and we don't want to re-parse markdown each time
                    const model = this.modelService.createModel(code, languageSelection, resource.with({ fragment: `${i}.${lang}` }));
                    if (i === j) {
                        codeEditorModel = model;
                    }
                    return '';
                };
                const textBuffer = factory.create(1 /* DefaultEndOfLine.LF */).textBuffer;
                const lineCount = textBuffer.getLineCount();
                const range = new range_1.Range(1, 1, lineCount, textBuffer.getLineLength(lineCount) + 1);
                const markdown = textBuffer.getValueInRange(range, 0 /* EndOfLinePreference.TextDefined */);
                (0, marked_1.marked)(markdown, { renderer });
            }
            return (0, types_1.assertIsDefined)(codeEditorModel);
        }
    };
    WalkThroughSnippetContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, language_1.ILanguageService),
        __param(2, model_1.IModelService),
        __param(3, instantiation_1.IInstantiationService)
    ], WalkThroughSnippetContentProvider);
    exports.WalkThroughSnippetContentProvider = WalkThroughSnippetContentProvider;
});
//# sourceMappingURL=walkThroughContentProvider.js.map