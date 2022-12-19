/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/color", "vs/base/common/platform", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/common/languages/textToHtmlTokenizer"], function (require, exports, DOM, color_1, platform, range_1, languages, textToHtmlTokenizer_1) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeCellDragImageRenderer = void 0;
    class EditorTextRenderer {
        getRichText(editor, modelRange) {
            const model = editor.getModel();
            if (!model) {
                return null;
            }
            const colorMap = this.getDefaultColorMap();
            const fontInfo = editor.getOptions().get(44 /* EditorOption.fontInfo */);
            const fontFamilyVar = '--notebook-editor-font-family';
            const fontSizeVar = '--notebook-editor-font-size';
            const fontWeightVar = '--notebook-editor-font-weight';
            const style = ``
                + `color: ${colorMap[1 /* languages.ColorId.DefaultForeground */]};`
                + `background-color: ${colorMap[2 /* languages.ColorId.DefaultBackground */]};`
                + `font-family: var(${fontFamilyVar});`
                + `font-weight: var(${fontWeightVar});`
                + `font-size: var(${fontSizeVar});`
                + `line-height: ${fontInfo.lineHeight}px;`
                + `white-space: pre;`;
            const element = DOM.$('div', { style });
            const fontSize = fontInfo.fontSize;
            const fontWeight = fontInfo.fontWeight;
            element.style.setProperty(fontFamilyVar, fontInfo.fontFamily);
            element.style.setProperty(fontSizeVar, `${fontSize}px`);
            element.style.setProperty(fontWeightVar, fontWeight);
            const linesHtml = this.getRichTextLinesAsHtml(model, modelRange, colorMap);
            element.innerHTML = linesHtml;
            return element;
        }
        getRichTextLinesAsHtml(model, modelRange, colorMap) {
            var _a, _b;
            const startLineNumber = modelRange.startLineNumber;
            const startColumn = modelRange.startColumn;
            const endLineNumber = modelRange.endLineNumber;
            const endColumn = modelRange.endColumn;
            const tabSize = model.getOptions().tabSize;
            let result = '';
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const lineTokens = model.tokenization.getLineTokens(lineNumber);
                const lineContent = lineTokens.getLineContent();
                const startOffset = (lineNumber === startLineNumber ? startColumn - 1 : 0);
                const endOffset = (lineNumber === endLineNumber ? endColumn - 1 : lineContent.length);
                if (lineContent === '') {
                    result += '<br>';
                }
                else {
                    result += (0, textToHtmlTokenizer_1.tokenizeLineToHTML)(lineContent, lineTokens.inflate(), colorMap, startOffset, endOffset, tabSize, platform.isWindows);
                }
            }
            return (_b = (_a = EditorTextRenderer._ttPolicy) === null || _a === void 0 ? void 0 : _a.createHTML(result)) !== null && _b !== void 0 ? _b : result;
        }
        getDefaultColorMap() {
            const colorMap = languages.TokenizationRegistry.getColorMap();
            const result = ['#000000'];
            if (colorMap) {
                for (let i = 1, len = colorMap.length; i < len; i++) {
                    result[i] = color_1.Color.Format.CSS.formatHex(colorMap[i]);
                }
            }
            return result;
        }
    }
    EditorTextRenderer._ttPolicy = (_a = window.trustedTypes) === null || _a === void 0 ? void 0 : _a.createPolicy('cellRendererEditorText', {
        createHTML(input) { return input; }
    });
    class CodeCellDragImageRenderer {
        getDragImage(templateData, editor, type) {
            let dragImage = this.getDragImageImpl(templateData, editor, type);
            if (!dragImage) {
                // TODO@roblourens I don't think this can happen
                dragImage = document.createElement('div');
                dragImage.textContent = '1 cell';
            }
            return dragImage;
        }
        getDragImageImpl(templateData, editor, type) {
            const dragImageContainer = templateData.container.cloneNode(true);
            dragImageContainer.classList.forEach(c => dragImageContainer.classList.remove(c));
            dragImageContainer.classList.add('cell-drag-image', 'monaco-list-row', 'focused', `${type}-cell-row`);
            const editorContainer = dragImageContainer.querySelector('.cell-editor-container');
            if (!editorContainer) {
                return null;
            }
            const richEditorText = new EditorTextRenderer().getRichText(editor, new range_1.Range(1, 1, 1, 1000));
            if (!richEditorText) {
                return null;
            }
            DOM.reset(editorContainer, richEditorText);
            return dragImageContainer;
        }
    }
    exports.CodeCellDragImageRenderer = CodeCellDragImageRenderer;
});
//# sourceMappingURL=cellDragRenderer.js.map