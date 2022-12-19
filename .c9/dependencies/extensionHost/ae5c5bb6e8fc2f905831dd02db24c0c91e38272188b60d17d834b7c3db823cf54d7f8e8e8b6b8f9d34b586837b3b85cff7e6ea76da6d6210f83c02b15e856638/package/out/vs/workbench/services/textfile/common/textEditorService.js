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
define(["require", "exports", "vs/base/common/event", "vs/platform/registry/common/platform", "vs/base/common/map", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor", "vs/workbench/services/untitled/common/untitledTextEditorService", "vs/base/common/network", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/files/common/files", "vs/workbench/services/editor/common/editorResolverService", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions"], function (require, exports, event_1, platform_1, map_1, instantiation_1, editor_1, untitledTextEditorService_1, network_1, diffEditorInput_1, sideBySideEditorInput_1, textResourceEditorInput_1, untitledTextEditorInput_1, resources_1, uri_1, uriIdentity_1, files_1, editorResolverService_1, lifecycle_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextEditorService = exports.ITextEditorService = void 0;
    exports.ITextEditorService = (0, instantiation_1.createDecorator)('textEditorService');
    let TextEditorService = class TextEditorService extends lifecycle_1.Disposable {
        constructor(untitledTextEditorService, instantiationService, uriIdentityService, fileService, editorResolverService) {
            super();
            this.untitledTextEditorService = untitledTextEditorService;
            this.instantiationService = instantiationService;
            this.uriIdentityService = uriIdentityService;
            this.fileService = fileService;
            this.editorResolverService = editorResolverService;
            this.editorInputCache = new map_1.ResourceMap();
            this.fileEditorFactory = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).getFileEditorFactory();
            // Register the default editor to the editor resolver
            // service so that it shows up in the editors picker
            this.registerDefaultEditor();
        }
        registerDefaultEditor() {
            this._register(this.editorResolverService.registerEditor('*', {
                id: editor_1.DEFAULT_EDITOR_ASSOCIATION.id,
                label: editor_1.DEFAULT_EDITOR_ASSOCIATION.displayName,
                detail: editor_1.DEFAULT_EDITOR_ASSOCIATION.providerDisplayName,
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }, {}, editor => ({ editor: this.createTextEditor(editor) }), untitledEditor => ({ editor: this.createTextEditor(untitledEditor) }), diffEditor => ({ editor: this.createTextEditor(diffEditor) })));
        }
        createTextEditor(input) {
            var _a;
            // Diff Editor Support
            if ((0, editor_1.isResourceDiffEditorInput)(input)) {
                const original = this.createTextEditor(Object.assign({}, input.original));
                const modified = this.createTextEditor(Object.assign({}, input.modified));
                return this.instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, input.label, input.description, original, modified, undefined);
            }
            // Side by Side Editor Support
            if ((0, editor_1.isResourceSideBySideEditorInput)(input)) {
                const primary = this.createTextEditor(Object.assign({}, input.primary));
                const secondary = this.createTextEditor(Object.assign({}, input.secondary));
                return this.instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, input.label, input.description, secondary, primary);
            }
            // Untitled text file support
            const untitledInput = input;
            if (untitledInput.forceUntitled || !untitledInput.resource || (untitledInput.resource.scheme === network_1.Schemas.untitled)) {
                const untitledOptions = {
                    languageId: untitledInput.languageId,
                    initialValue: untitledInput.contents,
                    encoding: untitledInput.encoding
                };
                // Untitled resource: use as hint for an existing untitled editor
                let untitledModel;
                if (((_a = untitledInput.resource) === null || _a === void 0 ? void 0 : _a.scheme) === network_1.Schemas.untitled) {
                    untitledModel = this.untitledTextEditorService.create(Object.assign({ untitledResource: untitledInput.resource }, untitledOptions));
                }
                // Other resource: use as hint for associated filepath
                else {
                    untitledModel = this.untitledTextEditorService.create(Object.assign({ associatedResource: untitledInput.resource }, untitledOptions));
                }
                return this.createOrGetCached(untitledModel.resource, () => {
                    // Factory function for new untitled editor
                    const input = this.instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, untitledModel);
                    // We dispose the untitled model once the editor
                    // is being disposed. Even though we may have not
                    // created the model initially, the lifecycle for
                    // untitled is tightly coupled with the editor
                    // lifecycle for now.
                    event_1.Event.once(input.onWillDispose)(() => untitledModel.dispose());
                    return input;
                });
            }
            // Text File/Resource Editor Support
            const textResourceEditorInput = input;
            if (textResourceEditorInput.resource instanceof uri_1.URI) {
                // Derive the label from the path if not provided explicitly
                const label = textResourceEditorInput.label || (0, resources_1.basename)(textResourceEditorInput.resource);
                // We keep track of the preferred resource this input is to be created
                // with but it may be different from the canonical resource (see below)
                const preferredResource = textResourceEditorInput.resource;
                // From this moment on, only operate on the canonical resource
                // to ensure we reduce the chance of opening the same resource
                // with different resource forms (e.g. path casing on Windows)
                const canonicalResource = this.uriIdentityService.asCanonicalUri(preferredResource);
                return this.createOrGetCached(canonicalResource, () => {
                    // File
                    if (textResourceEditorInput.forceFile || this.fileService.hasProvider(canonicalResource)) {
                        return this.fileEditorFactory.createFileEditor(canonicalResource, preferredResource, textResourceEditorInput.label, textResourceEditorInput.description, textResourceEditorInput.encoding, textResourceEditorInput.languageId, textResourceEditorInput.contents, this.instantiationService);
                    }
                    // Resource
                    return this.instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, canonicalResource, textResourceEditorInput.label, textResourceEditorInput.description, textResourceEditorInput.languageId, textResourceEditorInput.contents);
                }, cachedInput => {
                    // Untitled
                    if (cachedInput instanceof untitledTextEditorInput_1.UntitledTextEditorInput) {
                        return;
                    }
                    // Files
                    else if (!(cachedInput instanceof textResourceEditorInput_1.TextResourceEditorInput)) {
                        cachedInput.setPreferredResource(preferredResource);
                        if (textResourceEditorInput.label) {
                            cachedInput.setPreferredName(textResourceEditorInput.label);
                        }
                        if (textResourceEditorInput.description) {
                            cachedInput.setPreferredDescription(textResourceEditorInput.description);
                        }
                        if (textResourceEditorInput.encoding) {
                            cachedInput.setPreferredEncoding(textResourceEditorInput.encoding);
                        }
                        if (textResourceEditorInput.languageId) {
                            cachedInput.setPreferredLanguageId(textResourceEditorInput.languageId);
                        }
                        if (typeof textResourceEditorInput.contents === 'string') {
                            cachedInput.setPreferredContents(textResourceEditorInput.contents);
                        }
                    }
                    // Resources
                    else {
                        if (label) {
                            cachedInput.setName(label);
                        }
                        if (textResourceEditorInput.description) {
                            cachedInput.setDescription(textResourceEditorInput.description);
                        }
                        if (textResourceEditorInput.languageId) {
                            cachedInput.setPreferredLanguageId(textResourceEditorInput.languageId);
                        }
                        if (typeof textResourceEditorInput.contents === 'string') {
                            cachedInput.setPreferredContents(textResourceEditorInput.contents);
                        }
                    }
                });
            }
            throw new Error(`ITextEditorService: Unable to create texteditor from ${JSON.stringify(input)}`);
        }
        createOrGetCached(resource, factoryFn, cachedFn) {
            // Return early if already cached
            let input = this.editorInputCache.get(resource);
            if (input) {
                if (cachedFn) {
                    cachedFn(input);
                }
                return input;
            }
            // Otherwise create and add to cache
            input = factoryFn();
            this.editorInputCache.set(resource, input);
            event_1.Event.once(input.onWillDispose)(() => this.editorInputCache.delete(resource));
            return input;
        }
    };
    TextEditorService = __decorate([
        __param(0, untitledTextEditorService_1.IUntitledTextEditorService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, files_1.IFileService),
        __param(4, editorResolverService_1.IEditorResolverService)
    ], TextEditorService);
    exports.TextEditorService = TextEditorService;
    (0, extensions_1.registerSingleton)(exports.ITextEditorService, TextEditorService, false /* do not change: https://github.com/microsoft/vscode/issues/137675 */);
});
//# sourceMappingURL=textEditorService.js.map