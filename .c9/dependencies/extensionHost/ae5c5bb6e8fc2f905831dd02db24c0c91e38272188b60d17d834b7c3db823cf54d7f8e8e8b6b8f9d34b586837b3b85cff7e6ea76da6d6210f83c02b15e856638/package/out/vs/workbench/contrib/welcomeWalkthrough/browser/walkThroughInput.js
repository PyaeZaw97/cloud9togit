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
define(["require", "exports", "vs/workbench/common/editor/editorInput", "vs/workbench/common/editor/editorModel", "vs/editor/common/services/resolverService", "vs/base/common/marked/marked", "vs/base/common/network", "vs/base/common/resources", "vs/workbench/contrib/welcomeWalkthrough/common/walkThroughContentProvider", "vs/platform/instantiation/common/instantiation"], function (require, exports, editorInput_1, editorModel_1, resolverService_1, marked_1, network_1, resources_1, walkThroughContentProvider_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WalkThroughInput = exports.WalkThroughModel = void 0;
    class WalkThroughModel extends editorModel_1.EditorModel {
        constructor(mainRef, snippetRefs) {
            super();
            this.mainRef = mainRef;
            this.snippetRefs = snippetRefs;
        }
        get main() {
            return this.mainRef;
        }
        get snippets() {
            return this.snippetRefs.map(snippet => snippet.object);
        }
        dispose() {
            this.snippetRefs.forEach(ref => ref.dispose());
            super.dispose();
        }
    }
    exports.WalkThroughModel = WalkThroughModel;
    let WalkThroughInput = class WalkThroughInput extends editorInput_1.EditorInput {
        constructor(options, instantiationService, textModelResolverService) {
            super();
            this.options = options;
            this.instantiationService = instantiationService;
            this.textModelResolverService = textModelResolverService;
            this.promise = null;
            this.maxTopScroll = 0;
            this.maxBottomScroll = 0;
        }
        get capabilities() {
            return 8 /* EditorInputCapabilities.Singleton */ | super.capabilities;
        }
        get resource() { return this.options.resource; }
        get typeId() {
            return this.options.typeId;
        }
        getName() {
            return this.options.name;
        }
        getDescription() {
            return this.options.description || '';
        }
        getTelemetryFrom() {
            return this.options.telemetryFrom;
        }
        getTelemetryDescriptor() {
            const descriptor = super.getTelemetryDescriptor();
            descriptor['target'] = this.getTelemetryFrom();
            /* __GDPR__FRAGMENT__
                "EditorTelemetryDescriptor" : {
                    "target" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            return descriptor;
        }
        get onReady() {
            return this.options.onReady;
        }
        get layout() {
            return this.options.layout;
        }
        resolve() {
            if (!this.promise) {
                this.promise = (0, walkThroughContentProvider_1.requireToContent)(this.instantiationService, this.options.resource)
                    .then(content => {
                    if (this.resource.path.endsWith('.html')) {
                        return new WalkThroughModel(content, []);
                    }
                    const snippets = [];
                    let i = 0;
                    const renderer = new marked_1.marked.Renderer();
                    renderer.code = (code, lang) => {
                        i++;
                        const resource = this.options.resource.with({ scheme: network_1.Schemas.walkThroughSnippet, fragment: `${i}.${lang}` });
                        snippets.push(this.textModelResolverService.createModelReference(resource));
                        return `<div id="snippet-${resource.fragment}" class="walkThroughEditorContainer" ></div>`;
                    };
                    content = (0, marked_1.marked)(content, { renderer });
                    return Promise.all(snippets)
                        .then(refs => new WalkThroughModel(content, refs));
                });
            }
            return this.promise;
        }
        matches(otherInput) {
            if (super.matches(otherInput)) {
                return true;
            }
            if (otherInput instanceof WalkThroughInput) {
                return (0, resources_1.isEqual)(otherInput.options.resource, this.options.resource);
            }
            return false;
        }
        dispose() {
            if (this.promise) {
                this.promise.then(model => model.dispose());
                this.promise = null;
            }
            super.dispose();
        }
        relativeScrollPosition(topScroll, bottomScroll) {
            this.maxTopScroll = Math.max(this.maxTopScroll, topScroll);
            this.maxBottomScroll = Math.max(this.maxBottomScroll, bottomScroll);
        }
    };
    WalkThroughInput = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, resolverService_1.ITextModelService)
    ], WalkThroughInput);
    exports.WalkThroughInput = WalkThroughInput;
});
//# sourceMappingURL=walkThroughInput.js.map