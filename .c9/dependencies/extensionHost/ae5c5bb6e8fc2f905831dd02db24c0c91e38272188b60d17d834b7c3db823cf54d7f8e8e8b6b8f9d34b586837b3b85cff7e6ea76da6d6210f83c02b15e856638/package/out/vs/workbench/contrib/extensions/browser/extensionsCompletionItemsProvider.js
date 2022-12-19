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
define(["require", "exports", "vs/nls", "vs/base/common/json", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagement", "vs/editor/common/core/range", "vs/editor/common/services/languageFeatures"], function (require, exports, nls_1, json_1, lifecycle_1, extensionManagement_1, range_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsCompletionItemsProvider = void 0;
    let ExtensionsCompletionItemsProvider = class ExtensionsCompletionItemsProvider extends lifecycle_1.Disposable {
        constructor(extensionManagementService, languageFeaturesService) {
            super();
            this.extensionManagementService = extensionManagementService;
            this._register(languageFeaturesService.completionProvider.register({ language: 'jsonc', pattern: '**/settings.json' }, {
                provideCompletionItems: async (model, position, _context, token) => {
                    var _a;
                    const getWordRangeAtPosition = (model, position) => {
                        const wordAtPosition = model.getWordAtPosition(position);
                        return wordAtPosition ? new range_1.Range(position.lineNumber, wordAtPosition.startColumn, position.lineNumber, wordAtPosition.endColumn) : null;
                    };
                    const location = (0, json_1.getLocation)(model.getValue(), model.getOffsetAt(position));
                    const range = (_a = getWordRangeAtPosition(model, position)) !== null && _a !== void 0 ? _a : range_1.Range.fromPositions(position, position);
                    // extensions.supportUntrustedWorkspaces
                    if (location.path[0] === 'extensions.supportUntrustedWorkspaces' && location.path.length === 2 && location.isAtPropertyKey) {
                        let alreadyConfigured = [];
                        try {
                            alreadyConfigured = Object.keys((0, json_1.parse)(model.getValue())['extensions.supportUntrustedWorkspaces']);
                        }
                        catch (e) { /* ignore error */ }
                        return { suggestions: await this.provideSupportUntrustedWorkspacesExtensionProposals(alreadyConfigured, range) };
                    }
                    return { suggestions: [] };
                }
            }));
        }
        async provideSupportUntrustedWorkspacesExtensionProposals(alreadyConfigured, range) {
            const suggestions = [];
            const installedExtensions = (await this.extensionManagementService.getInstalled()).filter(e => e.manifest.main);
            const proposedExtensions = installedExtensions.filter(e => alreadyConfigured.indexOf(e.identifier.id) === -1);
            if (proposedExtensions.length) {
                suggestions.push(...proposedExtensions.map(e => {
                    const text = `"${e.identifier.id}": {\n\t"supported": true,\n\t"version": "${e.manifest.version}"\n},`;
                    return { label: e.identifier.id, kind: 13 /* CompletionItemKind.Value */, insertText: text, filterText: text, range };
                }));
            }
            else {
                const text = '"vscode.csharp": {\n\t"supported": true,\n\t"version": "0.0.0"\n},';
                suggestions.push({ label: (0, nls_1.localize)('exampleExtension', "Example"), kind: 13 /* CompletionItemKind.Value */, insertText: text, filterText: text, range });
            }
            return suggestions;
        }
    };
    ExtensionsCompletionItemsProvider = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, languageFeatures_1.ILanguageFeaturesService)
    ], ExtensionsCompletionItemsProvider);
    exports.ExtensionsCompletionItemsProvider = ExtensionsCompletionItemsProvider;
});
//# sourceMappingURL=extensionsCompletionItemsProvider.js.map