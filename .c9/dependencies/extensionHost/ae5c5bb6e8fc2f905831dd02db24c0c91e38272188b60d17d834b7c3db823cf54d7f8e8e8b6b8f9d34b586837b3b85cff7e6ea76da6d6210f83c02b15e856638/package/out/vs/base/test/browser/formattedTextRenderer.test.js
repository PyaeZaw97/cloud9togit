/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/formattedTextRenderer", "vs/base/common/lifecycle"], function (require, exports, assert, formattedTextRenderer_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('FormattedTextRenderer', () => {
        const store = new lifecycle_1.DisposableStore();
        setup(() => {
            store.clear();
        });
        teardown(() => {
            store.clear();
        });
        test('render simple element', () => {
            let result = (0, formattedTextRenderer_1.renderText)('testing');
            assert.strictEqual(result.nodeType, document.ELEMENT_NODE);
            assert.strictEqual(result.textContent, 'testing');
            assert.strictEqual(result.tagName, 'DIV');
        });
        test('render element with class', () => {
            let result = (0, formattedTextRenderer_1.renderText)('testing', {
                className: 'testClass'
            });
            assert.strictEqual(result.nodeType, document.ELEMENT_NODE);
            assert.strictEqual(result.className, 'testClass');
        });
        test('simple formatting', () => {
            let result = (0, formattedTextRenderer_1.renderFormattedText)('**bold**');
            assert.strictEqual(result.children.length, 1);
            assert.strictEqual(result.firstChild.textContent, 'bold');
            assert.strictEqual(result.firstChild.tagName, 'B');
            assert.strictEqual(result.innerHTML, '<b>bold</b>');
            result = (0, formattedTextRenderer_1.renderFormattedText)('__italics__');
            assert.strictEqual(result.innerHTML, '<i>italics</i>');
            result = (0, formattedTextRenderer_1.renderFormattedText)('``code``');
            assert.strictEqual(result.innerHTML, '``code``');
            result = (0, formattedTextRenderer_1.renderFormattedText)('``code``', { renderCodeSegments: true });
            assert.strictEqual(result.innerHTML, '<code>code</code>');
            result = (0, formattedTextRenderer_1.renderFormattedText)('this string has **bold**, __italics__, and ``code``!!', { renderCodeSegments: true });
            assert.strictEqual(result.innerHTML, 'this string has <b>bold</b>, <i>italics</i>, and <code>code</code>!!');
        });
        test('no formatting', () => {
            let result = (0, formattedTextRenderer_1.renderFormattedText)('this is just a string');
            assert.strictEqual(result.innerHTML, 'this is just a string');
        });
        test('preserve newlines', () => {
            let result = (0, formattedTextRenderer_1.renderFormattedText)('line one\nline two');
            assert.strictEqual(result.innerHTML, 'line one<br>line two');
        });
        test('action', () => {
            let callbackCalled = false;
            let result = (0, formattedTextRenderer_1.renderFormattedText)('[[action]]', {
                actionHandler: {
                    callback(content) {
                        assert.strictEqual(content, '0');
                        callbackCalled = true;
                    },
                    disposables: store
                }
            });
            assert.strictEqual(result.innerHTML, '<a>action</a>');
            let event = document.createEvent('MouseEvent');
            event.initEvent('click', true, true);
            result.firstChild.dispatchEvent(event);
            assert.strictEqual(callbackCalled, true);
        });
        test('fancy action', () => {
            let callbackCalled = false;
            let result = (0, formattedTextRenderer_1.renderFormattedText)('__**[[action]]**__', {
                actionHandler: {
                    callback(content) {
                        assert.strictEqual(content, '0');
                        callbackCalled = true;
                    },
                    disposables: store
                }
            });
            assert.strictEqual(result.innerHTML, '<i><b><a>action</a></b></i>');
            let event = document.createEvent('MouseEvent');
            event.initEvent('click', true, true);
            result.firstChild.firstChild.firstChild.dispatchEvent(event);
            assert.strictEqual(callbackCalled, true);
        });
        test('fancier action', () => {
            let callbackCalled = false;
            let result = (0, formattedTextRenderer_1.renderFormattedText)('``__**[[action]]**__``', {
                renderCodeSegments: true,
                actionHandler: {
                    callback(content) {
                        assert.strictEqual(content, '0');
                        callbackCalled = true;
                    },
                    disposables: store
                }
            });
            assert.strictEqual(result.innerHTML, '<code><i><b><a>action</a></b></i></code>');
            let event = document.createEvent('MouseEvent');
            event.initEvent('click', true, true);
            result.firstChild.firstChild.firstChild.firstChild.dispatchEvent(event);
            assert.strictEqual(callbackCalled, true);
        });
        test('escaped formatting', () => {
            let result = (0, formattedTextRenderer_1.renderFormattedText)('\\*\\*bold\\*\\*');
            assert.strictEqual(result.children.length, 0);
            assert.strictEqual(result.innerHTML, '**bold**');
        });
    });
});
//# sourceMappingURL=formattedTextRenderer.test.js.map