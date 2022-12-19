/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/fastDomNode", "vs/editor/common/config/editorOptions"], function (require, exports, browser, fastDomNode_1, editorOptions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.applyFontInfo = void 0;
    function applyFontInfo(domNode, fontInfo) {
        if (domNode instanceof fastDomNode_1.FastDomNode) {
            domNode.setFontFamily(fontInfo.getMassagedFontFamily(browser.isSafari ? editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily : null));
            domNode.setFontWeight(fontInfo.fontWeight);
            domNode.setFontSize(fontInfo.fontSize);
            domNode.setFontFeatureSettings(fontInfo.fontFeatureSettings);
            domNode.setLineHeight(fontInfo.lineHeight);
            domNode.setLetterSpacing(fontInfo.letterSpacing);
        }
        else {
            domNode.style.fontFamily = fontInfo.getMassagedFontFamily(browser.isSafari ? editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily : null);
            domNode.style.fontWeight = fontInfo.fontWeight;
            domNode.style.fontSize = fontInfo.fontSize + 'px';
            domNode.style.fontFeatureSettings = fontInfo.fontFeatureSettings;
            domNode.style.lineHeight = fontInfo.lineHeight + 'px';
            domNode.style.letterSpacing = fontInfo.letterSpacing + 'px';
        }
    }
    exports.applyFontInfo = applyFontInfo;
});
//# sourceMappingURL=domFontInfo.js.map