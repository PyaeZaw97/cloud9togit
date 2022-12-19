/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/config/editorOptions", "vs/editor/common/core/textModelDefaults", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, editorOptions_1, textModelDefaults_1, nls, configurationRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isDiffEditorConfigurationKey = exports.isEditorConfigurationKey = exports.editorConfigurationBaseNode = void 0;
    exports.editorConfigurationBaseNode = Object.freeze({
        id: 'editor',
        order: 5,
        type: 'object',
        title: nls.localize('editorConfigurationTitle', "Editor"),
        scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
    });
    const editorConfiguration = Object.assign(Object.assign({}, exports.editorConfigurationBaseNode), { properties: {
            'editor.tabSize': {
                type: 'number',
                default: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.tabSize,
                minimum: 1,
                markdownDescription: nls.localize('tabSize', "The number of spaces a tab is equal to. This setting is overridden based on the file contents when `#editor.detectIndentation#` is on.")
            },
            // 'editor.indentSize': {
            // 	'anyOf': [
            // 		{
            // 			type: 'string',
            // 			enum: ['tabSize']
            // 		},
            // 		{
            // 			type: 'number',
            // 			minimum: 1
            // 		}
            // 	],
            // 	default: 'tabSize',
            // 	markdownDescription: nls.localize('indentSize', "The number of spaces used for indentation or 'tabSize' to use the value from `#editor.tabSize#`. This setting is overridden based on the file contents when `#editor.detectIndentation#` is on.")
            // },
            'editor.insertSpaces': {
                type: 'boolean',
                default: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.insertSpaces,
                markdownDescription: nls.localize('insertSpaces', "Insert spaces when pressing `Tab`. This setting is overridden based on the file contents when `#editor.detectIndentation#` is on.")
            },
            'editor.detectIndentation': {
                type: 'boolean',
                default: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.detectIndentation,
                markdownDescription: nls.localize('detectIndentation', "Controls whether `#editor.tabSize#` and `#editor.insertSpaces#` will be automatically detected when a file is opened based on the file contents.")
            },
            'editor.trimAutoWhitespace': {
                type: 'boolean',
                default: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.trimAutoWhitespace,
                description: nls.localize('trimAutoWhitespace', "Remove trailing auto inserted whitespace.")
            },
            'editor.largeFileOptimizations': {
                type: 'boolean',
                default: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.largeFileOptimizations,
                description: nls.localize('largeFileOptimizations', "Special handling for large files to disable certain memory intensive features.")
            },
            'editor.wordBasedSuggestions': {
                type: 'boolean',
                default: true,
                description: nls.localize('wordBasedSuggestions', "Controls whether completions should be computed based on words in the document.")
            },
            'editor.wordBasedSuggestionsMode': {
                enum: ['currentDocument', 'matchingDocuments', 'allDocuments'],
                default: 'matchingDocuments',
                enumDescriptions: [
                    nls.localize('wordBasedSuggestionsMode.currentDocument', 'Only suggest words from the active document.'),
                    nls.localize('wordBasedSuggestionsMode.matchingDocuments', 'Suggest words from all open documents of the same language.'),
                    nls.localize('wordBasedSuggestionsMode.allDocuments', 'Suggest words from all open documents.')
                ],
                description: nls.localize('wordBasedSuggestionsMode', "Controls from which documents word based completions are computed.")
            },
            'editor.semanticHighlighting.enabled': {
                enum: [true, false, 'configuredByTheme'],
                enumDescriptions: [
                    nls.localize('semanticHighlighting.true', 'Semantic highlighting enabled for all color themes.'),
                    nls.localize('semanticHighlighting.false', 'Semantic highlighting disabled for all color themes.'),
                    nls.localize('semanticHighlighting.configuredByTheme', 'Semantic highlighting is configured by the current color theme\'s `semanticHighlighting` setting.')
                ],
                default: 'configuredByTheme',
                description: nls.localize('semanticHighlighting.enabled', "Controls whether the semanticHighlighting is shown for the languages that support it.")
            },
            'editor.stablePeek': {
                type: 'boolean',
                default: false,
                markdownDescription: nls.localize('stablePeek', "Keep peek editors open even when double clicking their content or when hitting `Escape`.")
            },
            'editor.maxTokenizationLineLength': {
                type: 'integer',
                default: 20000,
                description: nls.localize('maxTokenizationLineLength', "Lines above this length will not be tokenized for performance reasons")
            },
            'editor.language.brackets': {
                type: ['array', 'null'],
                default: null,
                description: nls.localize('schema.brackets', 'Defines the bracket symbols that increase or decrease the indentation.'),
                items: {
                    type: 'array',
                    items: [
                        {
                            type: 'string',
                            description: nls.localize('schema.openBracket', 'The opening bracket character or string sequence.')
                        },
                        {
                            type: 'string',
                            description: nls.localize('schema.closeBracket', 'The closing bracket character or string sequence.')
                        }
                    ]
                }
            },
            'editor.language.colorizedBracketPairs': {
                type: ['array', 'null'],
                default: null,
                description: nls.localize('schema.colorizedBracketPairs', 'Defines the bracket pairs that are colorized by their nesting level if bracket pair colorization is enabled.'),
                items: {
                    type: 'array',
                    items: [
                        {
                            type: 'string',
                            description: nls.localize('schema.openBracket', 'The opening bracket character or string sequence.')
                        },
                        {
                            type: 'string',
                            description: nls.localize('schema.closeBracket', 'The closing bracket character or string sequence.')
                        }
                    ]
                }
            },
            'diffEditor.maxComputationTime': {
                type: 'number',
                default: 5000,
                description: nls.localize('maxComputationTime', "Timeout in milliseconds after which diff computation is cancelled. Use 0 for no timeout.")
            },
            'diffEditor.maxFileSize': {
                type: 'number',
                default: 50,
                description: nls.localize('maxFileSize', "Maximum file size in MB for which to compute diffs. Use 0 for no limit.")
            },
            'diffEditor.renderSideBySide': {
                type: 'boolean',
                default: true,
                description: nls.localize('sideBySide', "Controls whether the diff editor shows the diff side by side or inline.")
            },
            'diffEditor.ignoreTrimWhitespace': {
                type: 'boolean',
                default: true,
                description: nls.localize('ignoreTrimWhitespace', "When enabled, the diff editor ignores changes in leading or trailing whitespace.")
            },
            'diffEditor.renderIndicators': {
                type: 'boolean',
                default: true,
                description: nls.localize('renderIndicators', "Controls whether the diff editor shows +/- indicators for added/removed changes.")
            },
            'diffEditor.codeLens': {
                type: 'boolean',
                default: false,
                description: nls.localize('codeLens', "Controls whether the editor shows CodeLens.")
            },
            'diffEditor.wordWrap': {
                type: 'string',
                enum: ['off', 'on', 'inherit'],
                default: 'inherit',
                markdownEnumDescriptions: [
                    nls.localize('wordWrap.off', "Lines will never wrap."),
                    nls.localize('wordWrap.on', "Lines will wrap at the viewport width."),
                    nls.localize('wordWrap.inherit', "Lines will wrap according to the `#editor.wordWrap#` setting."),
                ]
            }
        } });
    function isConfigurationPropertySchema(x) {
        return (typeof x.type !== 'undefined' || typeof x.anyOf !== 'undefined');
    }
    // Add properties from the Editor Option Registry
    for (const editorOption of editorOptions_1.editorOptionsRegistry) {
        const schema = editorOption.schema;
        if (typeof schema !== 'undefined') {
            if (isConfigurationPropertySchema(schema)) {
                // This is a single schema contribution
                editorConfiguration.properties[`editor.${editorOption.name}`] = schema;
            }
            else {
                for (const key in schema) {
                    if (Object.hasOwnProperty.call(schema, key)) {
                        editorConfiguration.properties[key] = schema[key];
                    }
                }
            }
        }
    }
    let cachedEditorConfigurationKeys = null;
    function getEditorConfigurationKeys() {
        if (cachedEditorConfigurationKeys === null) {
            cachedEditorConfigurationKeys = Object.create(null);
            Object.keys(editorConfiguration.properties).forEach((prop) => {
                cachedEditorConfigurationKeys[prop] = true;
            });
        }
        return cachedEditorConfigurationKeys;
    }
    function isEditorConfigurationKey(key) {
        const editorConfigurationKeys = getEditorConfigurationKeys();
        return (editorConfigurationKeys[`editor.${key}`] || false);
    }
    exports.isEditorConfigurationKey = isEditorConfigurationKey;
    function isDiffEditorConfigurationKey(key) {
        const editorConfigurationKeys = getEditorConfigurationKeys();
        return (editorConfigurationKeys[`diffEditor.${key}`] || false);
    }
    exports.isDiffEditorConfigurationKey = isDiffEditorConfigurationKey;
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration(editorConfiguration);
});
//# sourceMappingURL=editorConfigurationSchema.js.map