/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/stringBuilder", "vs/base/common/strings", "vs/editor/browser/config/domFontInfo", "vs/editor/common/textModelEvents", "vs/editor/common/modelLineProjectionData"], function (require, exports, stringBuilder_1, strings, domFontInfo_1, textModelEvents_1, modelLineProjectionData_1) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DOMLineBreaksComputerFactory = void 0;
    const ttPolicy = (_a = window.trustedTypes) === null || _a === void 0 ? void 0 : _a.createPolicy('domLineBreaksComputer', { createHTML: value => value });
    class DOMLineBreaksComputerFactory {
        static create() {
            return new DOMLineBreaksComputerFactory();
        }
        constructor() {
        }
        createLineBreaksComputer(fontInfo, tabSize, wrappingColumn, wrappingIndent) {
            const requests = [];
            const injectedTexts = [];
            return {
                addRequest: (lineText, injectedText, previousLineBreakData) => {
                    requests.push(lineText);
                    injectedTexts.push(injectedText);
                },
                finalize: () => {
                    return createLineBreaks(requests, fontInfo, tabSize, wrappingColumn, wrappingIndent, injectedTexts);
                }
            };
        }
    }
    exports.DOMLineBreaksComputerFactory = DOMLineBreaksComputerFactory;
    function createLineBreaks(requests, fontInfo, tabSize, firstLineBreakColumn, wrappingIndent, injectedTextsPerLine) {
        var _a;
        function createEmptyLineBreakWithPossiblyInjectedText(requestIdx) {
            const injectedTexts = injectedTextsPerLine[requestIdx];
            if (injectedTexts) {
                const lineText = textModelEvents_1.LineInjectedText.applyInjectedText(requests[requestIdx], injectedTexts);
                const injectionOptions = injectedTexts.map(t => t.options);
                const injectionOffsets = injectedTexts.map(text => text.column - 1);
                // creating a `LineBreakData` with an invalid `breakOffsetsVisibleColumn` is OK
                // because `breakOffsetsVisibleColumn` will never be used because it contains injected text
                return new modelLineProjectionData_1.ModelLineProjectionData(injectionOffsets, injectionOptions, [lineText.length], [], 0);
            }
            else {
                return null;
            }
        }
        if (firstLineBreakColumn === -1) {
            const result = [];
            for (let i = 0, len = requests.length; i < len; i++) {
                result[i] = createEmptyLineBreakWithPossiblyInjectedText(i);
            }
            return result;
        }
        const overallWidth = Math.round(firstLineBreakColumn * fontInfo.typicalHalfwidthCharacterWidth);
        const additionalIndent = (wrappingIndent === 3 /* WrappingIndent.DeepIndent */ ? 2 : wrappingIndent === 2 /* WrappingIndent.Indent */ ? 1 : 0);
        const additionalIndentSize = Math.round(tabSize * additionalIndent);
        const additionalIndentLength = Math.ceil(fontInfo.spaceWidth * additionalIndentSize);
        const containerDomNode = document.createElement('div');
        (0, domFontInfo_1.applyFontInfo)(containerDomNode, fontInfo);
        const sb = (0, stringBuilder_1.createStringBuilder)(10000);
        const firstNonWhitespaceIndices = [];
        const wrappedTextIndentLengths = [];
        const renderLineContents = [];
        const allCharOffsets = [];
        const allVisibleColumns = [];
        for (let i = 0; i < requests.length; i++) {
            const lineContent = textModelEvents_1.LineInjectedText.applyInjectedText(requests[i], injectedTextsPerLine[i]);
            let firstNonWhitespaceIndex = 0;
            let wrappedTextIndentLength = 0;
            let width = overallWidth;
            if (wrappingIndent !== 0 /* WrappingIndent.None */) {
                firstNonWhitespaceIndex = strings.firstNonWhitespaceIndex(lineContent);
                if (firstNonWhitespaceIndex === -1) {
                    // all whitespace line
                    firstNonWhitespaceIndex = 0;
                }
                else {
                    // Track existing indent
                    for (let i = 0; i < firstNonWhitespaceIndex; i++) {
                        const charWidth = (lineContent.charCodeAt(i) === 9 /* CharCode.Tab */
                            ? (tabSize - (wrappedTextIndentLength % tabSize))
                            : 1);
                        wrappedTextIndentLength += charWidth;
                    }
                    const indentWidth = Math.ceil(fontInfo.spaceWidth * wrappedTextIndentLength);
                    // Force sticking to beginning of line if no character would fit except for the indentation
                    if (indentWidth + fontInfo.typicalFullwidthCharacterWidth > overallWidth) {
                        firstNonWhitespaceIndex = 0;
                        wrappedTextIndentLength = 0;
                    }
                    else {
                        width = overallWidth - indentWidth;
                    }
                }
            }
            const renderLineContent = lineContent.substr(firstNonWhitespaceIndex);
            const tmp = renderLine(renderLineContent, wrappedTextIndentLength, tabSize, width, sb, additionalIndentLength);
            firstNonWhitespaceIndices[i] = firstNonWhitespaceIndex;
            wrappedTextIndentLengths[i] = wrappedTextIndentLength;
            renderLineContents[i] = renderLineContent;
            allCharOffsets[i] = tmp[0];
            allVisibleColumns[i] = tmp[1];
        }
        const html = sb.build();
        const trustedhtml = (_a = ttPolicy === null || ttPolicy === void 0 ? void 0 : ttPolicy.createHTML(html)) !== null && _a !== void 0 ? _a : html;
        containerDomNode.innerHTML = trustedhtml;
        containerDomNode.style.position = 'absolute';
        containerDomNode.style.top = '10000';
        containerDomNode.style.wordWrap = 'break-word';
        document.body.appendChild(containerDomNode);
        const range = document.createRange();
        const lineDomNodes = Array.prototype.slice.call(containerDomNode.children, 0);
        const result = [];
        for (let i = 0; i < requests.length; i++) {
            const lineDomNode = lineDomNodes[i];
            const breakOffsets = readLineBreaks(range, lineDomNode, renderLineContents[i], allCharOffsets[i]);
            if (breakOffsets === null) {
                result[i] = createEmptyLineBreakWithPossiblyInjectedText(i);
                continue;
            }
            const firstNonWhitespaceIndex = firstNonWhitespaceIndices[i];
            const wrappedTextIndentLength = wrappedTextIndentLengths[i] + additionalIndentSize;
            const visibleColumns = allVisibleColumns[i];
            const breakOffsetsVisibleColumn = [];
            for (let j = 0, len = breakOffsets.length; j < len; j++) {
                breakOffsetsVisibleColumn[j] = visibleColumns[breakOffsets[j]];
            }
            if (firstNonWhitespaceIndex !== 0) {
                // All break offsets are relative to the renderLineContent, make them absolute again
                for (let j = 0, len = breakOffsets.length; j < len; j++) {
                    breakOffsets[j] += firstNonWhitespaceIndex;
                }
            }
            let injectionOptions;
            let injectionOffsets;
            const curInjectedTexts = injectedTextsPerLine[i];
            if (curInjectedTexts) {
                injectionOptions = curInjectedTexts.map(t => t.options);
                injectionOffsets = curInjectedTexts.map(text => text.column - 1);
            }
            else {
                injectionOptions = null;
                injectionOffsets = null;
            }
            result[i] = new modelLineProjectionData_1.ModelLineProjectionData(injectionOffsets, injectionOptions, breakOffsets, breakOffsetsVisibleColumn, wrappedTextIndentLength);
        }
        document.body.removeChild(containerDomNode);
        return result;
    }
    var Constants;
    (function (Constants) {
        Constants[Constants["SPAN_MODULO_LIMIT"] = 16384] = "SPAN_MODULO_LIMIT";
    })(Constants || (Constants = {}));
    function renderLine(lineContent, initialVisibleColumn, tabSize, width, sb, wrappingIndentLength) {
        if (wrappingIndentLength !== 0) {
            const hangingOffset = String(wrappingIndentLength);
            sb.appendASCIIString('<div style="text-indent: -');
            sb.appendASCIIString(hangingOffset);
            sb.appendASCIIString('px; padding-left: ');
            sb.appendASCIIString(hangingOffset);
            sb.appendASCIIString('px; box-sizing: border-box; width:');
        }
        else {
            sb.appendASCIIString('<div style="width:');
        }
        sb.appendASCIIString(String(width));
        sb.appendASCIIString('px;">');
        // if (containsRTL) {
        // 	sb.appendASCIIString('" dir="ltr');
        // }
        const len = lineContent.length;
        let visibleColumn = initialVisibleColumn;
        let charOffset = 0;
        const charOffsets = [];
        const visibleColumns = [];
        let nextCharCode = (0 < len ? lineContent.charCodeAt(0) : 0 /* CharCode.Null */);
        sb.appendASCIIString('<span>');
        for (let charIndex = 0; charIndex < len; charIndex++) {
            if (charIndex !== 0 && charIndex % 16384 /* Constants.SPAN_MODULO_LIMIT */ === 0) {
                sb.appendASCIIString('</span><span>');
            }
            charOffsets[charIndex] = charOffset;
            visibleColumns[charIndex] = visibleColumn;
            const charCode = nextCharCode;
            nextCharCode = (charIndex + 1 < len ? lineContent.charCodeAt(charIndex + 1) : 0 /* CharCode.Null */);
            let producedCharacters = 1;
            let charWidth = 1;
            switch (charCode) {
                case 9 /* CharCode.Tab */:
                    producedCharacters = (tabSize - (visibleColumn % tabSize));
                    charWidth = producedCharacters;
                    for (let space = 1; space <= producedCharacters; space++) {
                        if (space < producedCharacters) {
                            sb.write1(0xA0); // &nbsp;
                        }
                        else {
                            sb.appendASCII(32 /* CharCode.Space */);
                        }
                    }
                    break;
                case 32 /* CharCode.Space */:
                    if (nextCharCode === 32 /* CharCode.Space */) {
                        sb.write1(0xA0); // &nbsp;
                    }
                    else {
                        sb.appendASCII(32 /* CharCode.Space */);
                    }
                    break;
                case 60 /* CharCode.LessThan */:
                    sb.appendASCIIString('&lt;');
                    break;
                case 62 /* CharCode.GreaterThan */:
                    sb.appendASCIIString('&gt;');
                    break;
                case 38 /* CharCode.Ampersand */:
                    sb.appendASCIIString('&amp;');
                    break;
                case 0 /* CharCode.Null */:
                    sb.appendASCIIString('&#00;');
                    break;
                case 65279 /* CharCode.UTF8_BOM */:
                case 8232 /* CharCode.LINE_SEPARATOR */:
                case 8233 /* CharCode.PARAGRAPH_SEPARATOR */:
                case 133 /* CharCode.NEXT_LINE */:
                    sb.write1(0xFFFD);
                    break;
                default:
                    if (strings.isFullWidthCharacter(charCode)) {
                        charWidth++;
                    }
                    if (charCode < 32) {
                        sb.write1(9216 + charCode);
                    }
                    else {
                        sb.write1(charCode);
                    }
            }
            charOffset += producedCharacters;
            visibleColumn += charWidth;
        }
        sb.appendASCIIString('</span>');
        charOffsets[lineContent.length] = charOffset;
        visibleColumns[lineContent.length] = visibleColumn;
        sb.appendASCIIString('</div>');
        return [charOffsets, visibleColumns];
    }
    function readLineBreaks(range, lineDomNode, lineContent, charOffsets) {
        if (lineContent.length <= 1) {
            return null;
        }
        const spans = Array.prototype.slice.call(lineDomNode.children, 0);
        const breakOffsets = [];
        try {
            discoverBreaks(range, spans, charOffsets, 0, null, lineContent.length - 1, null, breakOffsets);
        }
        catch (err) {
            console.log(err);
            return null;
        }
        if (breakOffsets.length === 0) {
            return null;
        }
        breakOffsets.push(lineContent.length);
        return breakOffsets;
    }
    function discoverBreaks(range, spans, charOffsets, low, lowRects, high, highRects, result) {
        if (low === high) {
            return;
        }
        lowRects = lowRects || readClientRect(range, spans, charOffsets[low], charOffsets[low + 1]);
        highRects = highRects || readClientRect(range, spans, charOffsets[high], charOffsets[high + 1]);
        if (Math.abs(lowRects[0].top - highRects[0].top) <= 0.1) {
            // same line
            return;
        }
        // there is at least one line break between these two offsets
        if (low + 1 === high) {
            // the two characters are adjacent, so the line break must be exactly between them
            result.push(high);
            return;
        }
        const mid = low + ((high - low) / 2) | 0;
        const midRects = readClientRect(range, spans, charOffsets[mid], charOffsets[mid + 1]);
        discoverBreaks(range, spans, charOffsets, low, lowRects, mid, midRects, result);
        discoverBreaks(range, spans, charOffsets, mid, midRects, high, highRects, result);
    }
    function readClientRect(range, spans, startOffset, endOffset) {
        range.setStart(spans[(startOffset / 16384 /* Constants.SPAN_MODULO_LIMIT */) | 0].firstChild, startOffset % 16384 /* Constants.SPAN_MODULO_LIMIT */);
        range.setEnd(spans[(endOffset / 16384 /* Constants.SPAN_MODULO_LIMIT */) | 0].firstChild, endOffset % 16384 /* Constants.SPAN_MODULO_LIMIT */);
        return range.getClientRects();
    }
});
//# sourceMappingURL=domLineBreaksComputer.js.map