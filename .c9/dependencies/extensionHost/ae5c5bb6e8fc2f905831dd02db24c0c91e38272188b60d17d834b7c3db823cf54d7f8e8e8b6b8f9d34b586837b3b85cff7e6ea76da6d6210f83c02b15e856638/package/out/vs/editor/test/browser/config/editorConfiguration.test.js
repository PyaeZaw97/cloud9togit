/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/browser/config/migrateOptions", "vs/editor/common/config/editorZoom", "vs/editor/test/browser/config/testConfiguration"], function (require, exports, assert, migrateOptions_1, editorZoom_1, testConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Common Editor Config', () => {
        test('Zoom Level', () => {
            //Zoom levels are defined to go between -5, 20 inclusive
            const zoom = editorZoom_1.EditorZoom;
            zoom.setZoomLevel(0);
            assert.strictEqual(zoom.getZoomLevel(), 0);
            zoom.setZoomLevel(-0);
            assert.strictEqual(zoom.getZoomLevel(), 0);
            zoom.setZoomLevel(5);
            assert.strictEqual(zoom.getZoomLevel(), 5);
            zoom.setZoomLevel(-1);
            assert.strictEqual(zoom.getZoomLevel(), -1);
            zoom.setZoomLevel(9);
            assert.strictEqual(zoom.getZoomLevel(), 9);
            zoom.setZoomLevel(-9);
            assert.strictEqual(zoom.getZoomLevel(), -5);
            zoom.setZoomLevel(20);
            assert.strictEqual(zoom.getZoomLevel(), 20);
            zoom.setZoomLevel(-10);
            assert.strictEqual(zoom.getZoomLevel(), -5);
            zoom.setZoomLevel(9.1);
            assert.strictEqual(zoom.getZoomLevel(), 9.1);
            zoom.setZoomLevel(-9.1);
            assert.strictEqual(zoom.getZoomLevel(), -5);
            zoom.setZoomLevel(Infinity);
            assert.strictEqual(zoom.getZoomLevel(), 20);
            zoom.setZoomLevel(Number.NEGATIVE_INFINITY);
            assert.strictEqual(zoom.getZoomLevel(), -5);
        });
        class TestWrappingConfiguration extends testConfiguration_1.TestConfiguration {
            _readEnvConfiguration() {
                return {
                    extraEditorClassName: '',
                    outerWidth: 1000,
                    outerHeight: 100,
                    emptySelectionClipboard: true,
                    pixelRatio: 1,
                    accessibilitySupport: 0 /* AccessibilitySupport.Unknown */
                };
            }
        }
        function assertWrapping(config, isViewportWrapping, wrappingColumn) {
            const options = config.options;
            const wrappingInfo = options.get(132 /* EditorOption.wrappingInfo */);
            assert.strictEqual(wrappingInfo.isViewportWrapping, isViewportWrapping);
            assert.strictEqual(wrappingInfo.wrappingColumn, wrappingColumn);
        }
        test('wordWrap default', () => {
            let config = new TestWrappingConfiguration({});
            assertWrapping(config, false, -1);
        });
        test('wordWrap compat false', () => {
            let config = new TestWrappingConfiguration({
                wordWrap: false
            });
            assertWrapping(config, false, -1);
        });
        test('wordWrap compat true', () => {
            let config = new TestWrappingConfiguration({
                wordWrap: true
            });
            assertWrapping(config, true, 80);
        });
        test('wordWrap on', () => {
            let config = new TestWrappingConfiguration({
                wordWrap: 'on'
            });
            assertWrapping(config, true, 80);
        });
        test('wordWrap on without minimap', () => {
            let config = new TestWrappingConfiguration({
                wordWrap: 'on',
                minimap: {
                    enabled: false
                }
            });
            assertWrapping(config, true, 88);
        });
        test('wordWrap on does not use wordWrapColumn', () => {
            let config = new TestWrappingConfiguration({
                wordWrap: 'on',
                wordWrapColumn: 10
            });
            assertWrapping(config, true, 80);
        });
        test('wordWrap off', () => {
            let config = new TestWrappingConfiguration({
                wordWrap: 'off'
            });
            assertWrapping(config, false, -1);
        });
        test('wordWrap off does not use wordWrapColumn', () => {
            let config = new TestWrappingConfiguration({
                wordWrap: 'off',
                wordWrapColumn: 10
            });
            assertWrapping(config, false, -1);
        });
        test('wordWrap wordWrapColumn uses default wordWrapColumn', () => {
            let config = new TestWrappingConfiguration({
                wordWrap: 'wordWrapColumn'
            });
            assertWrapping(config, false, 80);
        });
        test('wordWrap wordWrapColumn uses wordWrapColumn', () => {
            let config = new TestWrappingConfiguration({
                wordWrap: 'wordWrapColumn',
                wordWrapColumn: 100
            });
            assertWrapping(config, false, 100);
        });
        test('wordWrap wordWrapColumn validates wordWrapColumn', () => {
            let config = new TestWrappingConfiguration({
                wordWrap: 'wordWrapColumn',
                wordWrapColumn: -1
            });
            assertWrapping(config, false, 1);
        });
        test('wordWrap bounded uses default wordWrapColumn', () => {
            let config = new TestWrappingConfiguration({
                wordWrap: 'bounded'
            });
            assertWrapping(config, true, 80);
        });
        test('wordWrap bounded uses wordWrapColumn', () => {
            let config = new TestWrappingConfiguration({
                wordWrap: 'bounded',
                wordWrapColumn: 40
            });
            assertWrapping(config, true, 40);
        });
        test('wordWrap bounded validates wordWrapColumn', () => {
            let config = new TestWrappingConfiguration({
                wordWrap: 'bounded',
                wordWrapColumn: -1
            });
            assertWrapping(config, true, 1);
        });
        test('issue #53152: Cannot assign to read only property \'enabled\' of object', () => {
            let hoverOptions = {};
            Object.defineProperty(hoverOptions, 'enabled', {
                writable: false,
                value: true
            });
            let config = new testConfiguration_1.TestConfiguration({ hover: hoverOptions });
            assert.strictEqual(config.options.get(53 /* EditorOption.hover */).enabled, true);
            config.updateOptions({ hover: { enabled: false } });
            assert.strictEqual(config.options.get(53 /* EditorOption.hover */).enabled, false);
        });
        test('does not emit event when nothing changes', () => {
            const config = new testConfiguration_1.TestConfiguration({ glyphMargin: true, roundedSelection: false });
            let event = null;
            config.onDidChange(e => event = e);
            assert.strictEqual(config.options.get(50 /* EditorOption.glyphMargin */), true);
            config.updateOptions({ glyphMargin: true });
            config.updateOptions({ roundedSelection: false });
            assert.strictEqual(event, null);
        });
        test('issue #94931: Unable to open source file', () => {
            const config = new testConfiguration_1.TestConfiguration({ quickSuggestions: null });
            const actual = config.options.get(79 /* EditorOption.quickSuggestions */);
            assert.deepStrictEqual(actual, {
                other: 'on',
                comments: 'off',
                strings: 'off'
            });
        });
        test('issue #102920: Can\'t snap or split view with JSON files', () => {
            const config = new testConfiguration_1.TestConfiguration({ quickSuggestions: null });
            config.updateOptions({ quickSuggestions: { strings: true } });
            const actual = config.options.get(79 /* EditorOption.quickSuggestions */);
            assert.deepStrictEqual(actual, {
                other: 'on',
                comments: 'off',
                strings: 'on'
            });
        });
    });
    suite('migrateOptions', () => {
        function migrate(options) {
            (0, migrateOptions_1.migrateOptions)(options);
            return options;
        }
        test('wordWrap', () => {
            assert.deepStrictEqual(migrate({ wordWrap: true }), { wordWrap: 'on' });
            assert.deepStrictEqual(migrate({ wordWrap: false }), { wordWrap: 'off' });
        });
        test('lineNumbers', () => {
            assert.deepStrictEqual(migrate({ lineNumbers: true }), { lineNumbers: 'on' });
            assert.deepStrictEqual(migrate({ lineNumbers: false }), { lineNumbers: 'off' });
        });
        test('autoClosingBrackets', () => {
            assert.deepStrictEqual(migrate({ autoClosingBrackets: false }), { autoClosingBrackets: 'never', autoClosingQuotes: 'never', autoSurround: 'never' });
        });
        test('cursorBlinking', () => {
            assert.deepStrictEqual(migrate({ cursorBlinking: 'visible' }), { cursorBlinking: 'solid' });
        });
        test('renderWhitespace', () => {
            assert.deepStrictEqual(migrate({ renderWhitespace: true }), { renderWhitespace: 'boundary' });
            assert.deepStrictEqual(migrate({ renderWhitespace: false }), { renderWhitespace: 'none' });
        });
        test('renderLineHighlight', () => {
            assert.deepStrictEqual(migrate({ renderLineHighlight: true }), { renderLineHighlight: 'line' });
            assert.deepStrictEqual(migrate({ renderLineHighlight: false }), { renderLineHighlight: 'none' });
        });
        test('acceptSuggestionOnEnter', () => {
            assert.deepStrictEqual(migrate({ acceptSuggestionOnEnter: true }), { acceptSuggestionOnEnter: 'on' });
            assert.deepStrictEqual(migrate({ acceptSuggestionOnEnter: false }), { acceptSuggestionOnEnter: 'off' });
        });
        test('tabCompletion', () => {
            assert.deepStrictEqual(migrate({ tabCompletion: true }), { tabCompletion: 'onlySnippets' });
            assert.deepStrictEqual(migrate({ tabCompletion: false }), { tabCompletion: 'off' });
        });
        test('suggest.filteredTypes', () => {
            assert.deepStrictEqual(migrate({
                suggest: {
                    filteredTypes: {
                        method: false,
                        function: false,
                        constructor: false,
                        deprecated: false,
                        field: false,
                        variable: false,
                        class: false,
                        struct: false,
                        interface: false,
                        module: false,
                        property: false,
                        event: false,
                        operator: false,
                        unit: false,
                        value: false,
                        constant: false,
                        enum: false,
                        enumMember: false,
                        keyword: false,
                        text: false,
                        color: false,
                        file: false,
                        reference: false,
                        folder: false,
                        typeParameter: false,
                        snippet: false,
                    }
                }
            }), {
                suggest: {
                    filteredTypes: undefined,
                    showMethods: false,
                    showFunctions: false,
                    showConstructors: false,
                    showDeprecated: false,
                    showFields: false,
                    showVariables: false,
                    showClasses: false,
                    showStructs: false,
                    showInterfaces: false,
                    showModules: false,
                    showProperties: false,
                    showEvents: false,
                    showOperators: false,
                    showUnits: false,
                    showValues: false,
                    showConstants: false,
                    showEnums: false,
                    showEnumMembers: false,
                    showKeywords: false,
                    showWords: false,
                    showColors: false,
                    showFiles: false,
                    showReferences: false,
                    showFolders: false,
                    showTypeParameters: false,
                    showSnippets: false,
                }
            });
        });
        test('hover', () => {
            assert.deepStrictEqual(migrate({ hover: true }), { hover: { enabled: true } });
            assert.deepStrictEqual(migrate({ hover: false }), { hover: { enabled: false } });
        });
        test('parameterHints', () => {
            assert.deepStrictEqual(migrate({ parameterHints: true }), { parameterHints: { enabled: true } });
            assert.deepStrictEqual(migrate({ parameterHints: false }), { parameterHints: { enabled: false } });
        });
        test('autoIndent', () => {
            assert.deepStrictEqual(migrate({ autoIndent: true }), { autoIndent: 'full' });
            assert.deepStrictEqual(migrate({ autoIndent: false }), { autoIndent: 'advanced' });
        });
        test('matchBrackets', () => {
            assert.deepStrictEqual(migrate({ matchBrackets: true }), { matchBrackets: 'always' });
            assert.deepStrictEqual(migrate({ matchBrackets: false }), { matchBrackets: 'never' });
        });
        test('renderIndentGuides, highlightActiveIndentGuide', () => {
            assert.deepStrictEqual(migrate({ renderIndentGuides: true }), { renderIndentGuides: undefined, guides: { indentation: true } });
            assert.deepStrictEqual(migrate({ renderIndentGuides: false }), { renderIndentGuides: undefined, guides: { indentation: false } });
            assert.deepStrictEqual(migrate({ highlightActiveIndentGuide: true }), { highlightActiveIndentGuide: undefined, guides: { highlightActiveIndentation: true } });
            assert.deepStrictEqual(migrate({ highlightActiveIndentGuide: false }), { highlightActiveIndentGuide: undefined, guides: { highlightActiveIndentation: false } });
        });
        test('migration does not overwrite new setting', () => {
            assert.deepStrictEqual(migrate({ renderIndentGuides: true, guides: { indentation: false } }), { renderIndentGuides: undefined, guides: { indentation: false } });
            assert.deepStrictEqual(migrate({ highlightActiveIndentGuide: true, guides: { highlightActiveIndentation: false } }), { highlightActiveIndentGuide: undefined, guides: { highlightActiveIndentation: false } });
        });
    });
});
//# sourceMappingURL=editorConfiguration.test.js.map