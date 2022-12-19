/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/uri", "vs/base/common/strings", "vs/editor/common/editorCommon", "vs/editor/browser/services/abstractCodeEditorService"], function (require, exports, DOM, uri_1, strings, editorCommon_1, abstractCodeEditorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookDecorationCSSRules = exports.NotebookRefCountedStyleSheet = void 0;
    class NotebookRefCountedStyleSheet {
        constructor(widget, key, styleSheet) {
            this.widget = widget;
            this._key = key;
            this._styleSheet = styleSheet;
            this._refCount = 0;
        }
        ref() {
            this._refCount++;
        }
        unref() {
            var _a;
            this._refCount--;
            if (this._refCount === 0) {
                (_a = this._styleSheet.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(this._styleSheet);
                this.widget.removeEditorStyleSheets(this._key);
            }
        }
        insertRule(rule, index) {
            const sheet = this._styleSheet.sheet;
            sheet.insertRule(rule, index);
        }
    }
    exports.NotebookRefCountedStyleSheet = NotebookRefCountedStyleSheet;
    class NotebookDecorationCSSRules {
        constructor(_themeService, _styleSheet, _providerArgs) {
            this._themeService = _themeService;
            this._styleSheet = _styleSheet;
            this._providerArgs = _providerArgs;
            this._styleSheet.ref();
            this._theme = this._themeService.getColorTheme();
            this._className = CSSNameHelper.getClassName(this._providerArgs.key, 0 /* CellDecorationCSSRuleType.ClassName */);
            this._topClassName = CSSNameHelper.getClassName(this._providerArgs.key, 0 /* CellDecorationCSSRuleType.TopClassName */);
            this._buildCSS();
        }
        get className() {
            return this._className;
        }
        get topClassName() {
            return this._topClassName;
        }
        _buildCSS() {
            if (this._providerArgs.options.backgroundColor) {
                const backgroundColor = this._resolveValue(this._providerArgs.options.backgroundColor);
                this._styleSheet.insertRule(`.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.code-cell-row.${this.className} .cell-focus-indicator,
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.markdown-cell-row.${this.className} {
				background-color: ${backgroundColor} !important;
			}`);
            }
            if (this._providerArgs.options.borderColor) {
                const borderColor = this._resolveValue(this._providerArgs.options.borderColor);
                this._styleSheet.insertRule(`.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.${this.className} .cell-focus-indicator-top:before,
					.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.${this.className} .cell-focus-indicator-bottom:before {
						border-color: ${borderColor} !important;
					}`);
                this._styleSheet.insertRule(`
					.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.${this.className} .cell-focus-indicator-bottom:before {
						content: "";
						position: absolute;
						width: 100%;
						height: 1px;
						border-bottom: 1px solid ${borderColor};
						bottom: 0px;
					`);
                this._styleSheet.insertRule(`
					.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.${this.className} .cell-focus-indicator-top:before {
						content: "";
						position: absolute;
						width: 100%;
						height: 1px;
						border-top: 1px solid ${borderColor};
					`);
                // more specific rule for `.focused` can override existing rules
                this._styleSheet.insertRule(`.monaco-workbench .notebookOverlay .monaco-list:focus-within .monaco-list-row.focused.${this.className} .cell-focus-indicator-top:before,
				.monaco-workbench .notebookOverlay .monaco-list:focus-within .monaco-list-row.focused.${this.className} .cell-focus-indicator-bottom:before {
					border-color: ${borderColor} !important;
				}`);
            }
            if (this._providerArgs.options.top) {
                const unthemedCSS = this._getCSSTextForModelDecorationContentClassName(this._providerArgs.options.top);
                this._styleSheet.insertRule(`.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.${this.className} .cell-decoration .${this.topClassName} {
				height: 1rem;
				display: block;
			}`);
                this._styleSheet.insertRule(`.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.${this.className} .cell-decoration .${this.topClassName}::before {
				display: block;
				${unthemedCSS}
			}`);
            }
        }
        /**
     * Build the CSS for decorations styled before or after content.
     */
        _getCSSTextForModelDecorationContentClassName(opts) {
            if (!opts) {
                return '';
            }
            const cssTextArr = [];
            if (typeof opts !== 'undefined') {
                this._collectBorderSettingsCSSText(opts, cssTextArr);
                if (typeof opts.contentIconPath !== 'undefined') {
                    cssTextArr.push(strings.format(abstractCodeEditorService_1._CSS_MAP.contentIconPath, DOM.asCSSUrl(uri_1.URI.revive(opts.contentIconPath))));
                }
                if (typeof opts.contentText === 'string') {
                    const truncated = opts.contentText.match(/^.*$/m)[0]; // only take first line
                    const escaped = truncated.replace(/['\\]/g, '\\$&');
                    cssTextArr.push(strings.format(abstractCodeEditorService_1._CSS_MAP.contentText, escaped));
                }
                this._collectCSSText(opts, ['fontStyle', 'fontWeight', 'textDecoration', 'color', 'opacity', 'backgroundColor', 'margin'], cssTextArr);
                if (this._collectCSSText(opts, ['width', 'height'], cssTextArr)) {
                    cssTextArr.push('display:inline-block;');
                }
            }
            return cssTextArr.join('');
        }
        _collectBorderSettingsCSSText(opts, cssTextArr) {
            if (this._collectCSSText(opts, ['border', 'borderColor', 'borderRadius', 'borderSpacing', 'borderStyle', 'borderWidth'], cssTextArr)) {
                cssTextArr.push(strings.format('box-sizing: border-box;'));
                return true;
            }
            return false;
        }
        _collectCSSText(opts, properties, cssTextArr) {
            const lenBefore = cssTextArr.length;
            for (const property of properties) {
                const value = this._resolveValue(opts[property]);
                if (typeof value === 'string') {
                    cssTextArr.push(strings.format(abstractCodeEditorService_1._CSS_MAP[property], value));
                }
            }
            return cssTextArr.length !== lenBefore;
        }
        _resolveValue(value) {
            if ((0, editorCommon_1.isThemeColor)(value)) {
                const color = this._theme.getColor(value.id);
                if (color) {
                    return color.toString();
                }
                return 'transparent';
            }
            return value;
        }
        dispose() {
            this._styleSheet.unref();
        }
    }
    exports.NotebookDecorationCSSRules = NotebookDecorationCSSRules;
    var CellDecorationCSSRuleType;
    (function (CellDecorationCSSRuleType) {
        CellDecorationCSSRuleType[CellDecorationCSSRuleType["ClassName"] = 0] = "ClassName";
        CellDecorationCSSRuleType[CellDecorationCSSRuleType["TopClassName"] = 0] = "TopClassName";
    })(CellDecorationCSSRuleType || (CellDecorationCSSRuleType = {}));
    class CSSNameHelper {
        static getClassName(key, type) {
            return 'nb-' + key + '-' + type;
        }
    }
});
//# sourceMappingURL=notebookEditorDecorations.js.map