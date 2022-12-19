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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/snippet/browser/snippetController2", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/workspace", "vs/workbench/browser/dnd"], function (require, exports, arrays_1, cancellation_1, lifecycle_1, mime_1, resources_1, uri_1, editorExtensions_1, range_1, languageFeatures_1, snippetController2_1, instantiation_1, workspace_1, dnd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DropIntoEditorController = void 0;
    let DropIntoEditorController = class DropIntoEditorController extends lifecycle_1.Disposable {
        constructor(editor, _instantiationService, _languageFeaturesService, _workspaceContextService) {
            super();
            this._instantiationService = _instantiationService;
            this._languageFeaturesService = _languageFeaturesService;
            this._workspaceContextService = _workspaceContextService;
            editor.onDropIntoEditor(e => this.onDropIntoEditor(editor, e.position, e.event));
        }
        async onDropIntoEditor(editor, position, dragEvent) {
            if (!dragEvent.dataTransfer || !editor.hasModel()) {
                return;
            }
            const model = editor.getModel();
            const modelVersionNow = model.getVersionId();
            const textEditorDataTransfer = new Map();
            for (const item of dragEvent.dataTransfer.items) {
                if (item.kind === 'string') {
                    const type = item.type;
                    const asStringValue = new Promise(resolve => item.getAsString(resolve));
                    textEditorDataTransfer.set(type, {
                        asString: () => asStringValue,
                        value: undefined
                    });
                }
            }
            if (!textEditorDataTransfer.has(mime_1.Mimes.uriList.toLowerCase())) {
                const editorData = (await this._instantiationService.invokeFunction(dnd_1.extractEditorsDropData, dragEvent))
                    .filter(input => input.resource)
                    .map(input => input.resource.toString());
                if (editorData.length) {
                    const str = (0, arrays_1.distinct)(editorData).join('\n');
                    textEditorDataTransfer.set(mime_1.Mimes.uriList.toLowerCase(), {
                        asString: () => Promise.resolve(str),
                        value: undefined
                    });
                }
            }
            if (textEditorDataTransfer.size === 0) {
                return;
            }
            if (editor.getModel().getVersionId() !== modelVersionNow) {
                return;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            editor.onDidDispose(() => cts.cancel());
            model.onDidChangeContent(() => cts.cancel());
            const ordered = this._languageFeaturesService.documentOnDropEditProvider.ordered(model);
            for (const provider of ordered) {
                const edit = await provider.provideDocumentOnDropEdits(model, position, textEditorDataTransfer, cts.token);
                if (cts.token.isCancellationRequested || editor.getModel().getVersionId() !== modelVersionNow) {
                    return;
                }
                if (edit) {
                    (0, snippetController2_1.performSnippetEdit)(editor, edit);
                    return;
                }
            }
            return this.doDefaultDrop(editor, position, textEditorDataTransfer, cts.token);
        }
        async doDefaultDrop(editor, position, textEditorDataTransfer, token) {
            var _a;
            const range = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column);
            const urlListEntry = textEditorDataTransfer.get('text/uri-list');
            if (urlListEntry) {
                const urlList = await urlListEntry.asString();
                return this.doUriListDrop(editor, range, urlList, token);
            }
            const textEntry = (_a = textEditorDataTransfer.get('text')) !== null && _a !== void 0 ? _a : textEditorDataTransfer.get(mime_1.Mimes.text);
            if (textEntry) {
                const text = await textEntry.asString();
                (0, snippetController2_1.performSnippetEdit)(editor, { range, snippet: text });
            }
        }
        async doUriListDrop(editor, range, urlList, token) {
            const uris = [];
            for (const resource of urlList.split('\n')) {
                try {
                    uris.push(uri_1.URI.parse(resource));
                }
                catch (_a) {
                    // noop
                }
            }
            if (!uris.length) {
                return;
            }
            const snippet = uris
                .map(uri => {
                const root = this._workspaceContextService.getWorkspaceFolder(uri);
                if (root) {
                    const rel = (0, resources_1.relativePath)(root.uri, uri);
                    if (rel) {
                        return rel;
                    }
                }
                return uri.fsPath;
            })
                .join(' ');
            (0, snippetController2_1.performSnippetEdit)(editor, { range, snippet });
        }
    };
    DropIntoEditorController.ID = 'editor.contrib.dropIntoEditorController';
    DropIntoEditorController = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, languageFeatures_1.ILanguageFeaturesService),
        __param(3, workspace_1.IWorkspaceContextService)
    ], DropIntoEditorController);
    exports.DropIntoEditorController = DropIntoEditorController;
    (0, editorExtensions_1.registerEditorContribution)(DropIntoEditorController.ID, DropIntoEditorController);
});
//# sourceMappingURL=dropIntoEditor.contibution.js.map