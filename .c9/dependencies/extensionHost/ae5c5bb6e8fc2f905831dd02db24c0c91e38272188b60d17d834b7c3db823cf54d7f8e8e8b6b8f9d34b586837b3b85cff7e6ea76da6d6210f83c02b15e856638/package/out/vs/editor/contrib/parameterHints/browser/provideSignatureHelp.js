/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/types", "vs/base/common/uri", "vs/editor/common/core/position", "vs/editor/common/languages", "vs/editor/common/services/resolverService", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/editor/common/services/languageFeatures"], function (require, exports, cancellation_1, errors_1, types_1, uri_1, position_1, languages, resolverService_1, commands_1, contextkey_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.provideSignatureHelp = exports.Context = void 0;
    exports.Context = {
        Visible: new contextkey_1.RawContextKey('parameterHintsVisible', false),
        MultipleSignatures: new contextkey_1.RawContextKey('parameterHintsMultipleSignatures', false),
    };
    async function provideSignatureHelp(registry, model, position, context, token) {
        const supports = registry.ordered(model);
        for (const support of supports) {
            try {
                const result = await support.provideSignatureHelp(model, position, token, context);
                if (result) {
                    return result;
                }
            }
            catch (err) {
                (0, errors_1.onUnexpectedExternalError)(err);
            }
        }
        return undefined;
    }
    exports.provideSignatureHelp = provideSignatureHelp;
    commands_1.CommandsRegistry.registerCommand('_executeSignatureHelpProvider', async (accessor, ...args) => {
        const [uri, position, triggerCharacter] = args;
        (0, types_1.assertType)(uri_1.URI.isUri(uri));
        (0, types_1.assertType)(position_1.Position.isIPosition(position));
        (0, types_1.assertType)(typeof triggerCharacter === 'string' || !triggerCharacter);
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const ref = await accessor.get(resolverService_1.ITextModelService).createModelReference(uri);
        try {
            const result = await provideSignatureHelp(languageFeaturesService.signatureHelpProvider, ref.object.textEditorModel, position_1.Position.lift(position), {
                triggerKind: languages.SignatureHelpTriggerKind.Invoke,
                isRetrigger: false,
                triggerCharacter,
            }, cancellation_1.CancellationToken.None);
            if (!result) {
                return undefined;
            }
            setTimeout(() => result.dispose(), 0);
            return result.value;
        }
        finally {
            ref.dispose();
        }
    });
});
//# sourceMappingURL=provideSignatureHelp.js.map