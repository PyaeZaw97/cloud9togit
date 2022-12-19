/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/platform/registry/common/platform", "vs/base/common/mime", "vs/platform/configuration/common/configurationRegistry"], function (require, exports, nls, event_1, platform_1, mime_1, configurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PLAINTEXT_EXTENSION = exports.PLAINTEXT_LANGUAGE_ID = exports.ModesRegistry = exports.EditorModesRegistry = exports.Extensions = void 0;
    // Define extension point ids
    exports.Extensions = {
        ModesRegistry: 'editor.modesRegistry'
    };
    class EditorModesRegistry {
        constructor() {
            this._onDidChangeLanguages = new event_1.Emitter();
            this.onDidChangeLanguages = this._onDidChangeLanguages.event;
            this._languages = [];
        }
        registerLanguage(def) {
            this._languages.push(def);
            this._onDidChangeLanguages.fire(undefined);
            return {
                dispose: () => {
                    for (let i = 0, len = this._languages.length; i < len; i++) {
                        if (this._languages[i] === def) {
                            this._languages.splice(i, 1);
                            return;
                        }
                    }
                }
            };
        }
        getLanguages() {
            return this._languages;
        }
    }
    exports.EditorModesRegistry = EditorModesRegistry;
    exports.ModesRegistry = new EditorModesRegistry();
    platform_1.Registry.add(exports.Extensions.ModesRegistry, exports.ModesRegistry);
    exports.PLAINTEXT_LANGUAGE_ID = 'plaintext';
    exports.PLAINTEXT_EXTENSION = '.txt';
    exports.ModesRegistry.registerLanguage({
        id: exports.PLAINTEXT_LANGUAGE_ID,
        extensions: [exports.PLAINTEXT_EXTENSION],
        aliases: [nls.localize('plainText.alias', "Plain Text"), 'text'],
        mimetypes: [mime_1.Mimes.text]
    });
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerDefaultConfigurations([{
            overrides: {
                '[plaintext]': {
                    'editor.unicodeHighlight.ambiguousCharacters': false,
                    'editor.unicodeHighlight.invisibleCharacters': false
                }
            }
        }]);
});
//# sourceMappingURL=modesRegistry.js.map