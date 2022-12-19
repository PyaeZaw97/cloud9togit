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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/fastDomNode", "vs/platform/theme/common/themeService"], function (require, exports, browser, fastDomNode_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookOverviewRuler = void 0;
    let NotebookOverviewRuler = class NotebookOverviewRuler extends themeService_1.Themable {
        constructor(notebookEditor, container, themeService) {
            super(themeService);
            this.notebookEditor = notebookEditor;
            this._lanes = 3;
            this._domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('canvas'));
            this._domNode.setPosition('relative');
            this._domNode.setLayerHinting(true);
            this._domNode.setContain('strict');
            container.appendChild(this._domNode.domNode);
            this._register(notebookEditor.onDidChangeDecorations(() => {
                this.layout();
            }));
            this._register(browser.PixelRatio.onDidChange(() => {
                this.layout();
            }));
        }
        layout() {
            const width = 10;
            const layoutInfo = this.notebookEditor.getLayoutInfo();
            const scrollHeight = layoutInfo.scrollHeight;
            const height = layoutInfo.height;
            const ratio = browser.PixelRatio.value;
            this._domNode.setWidth(width);
            this._domNode.setHeight(height);
            this._domNode.domNode.width = width * ratio;
            this._domNode.domNode.height = height * ratio;
            const ctx = this._domNode.domNode.getContext('2d');
            ctx.clearRect(0, 0, width * ratio, height * ratio);
            this._render(ctx, width * ratio, height * ratio, scrollHeight * ratio, ratio);
        }
        _render(ctx, width, height, scrollHeight, ratio) {
            const viewModel = this.notebookEditor._getViewModel();
            const fontInfo = this.notebookEditor.getLayoutInfo().fontInfo;
            const laneWidth = width / this._lanes;
            let currentFrom = 0;
            if (viewModel) {
                for (let i = 0; i < viewModel.viewCells.length; i++) {
                    const viewCell = viewModel.viewCells[i];
                    const textBuffer = viewCell.textBuffer;
                    const decorations = viewCell.getCellDecorations();
                    const cellHeight = (viewCell.layoutInfo.totalHeight / scrollHeight) * ratio * height;
                    decorations.filter(decoration => decoration.overviewRuler).forEach(decoration => {
                        var _a;
                        const overviewRuler = decoration.overviewRuler;
                        const fillStyle = ((_a = this.getColor(overviewRuler.color)) === null || _a === void 0 ? void 0 : _a.toString()) || '#000000';
                        const lineHeight = Math.min(fontInfo.lineHeight, (viewCell.layoutInfo.editorHeight / scrollHeight / textBuffer.getLineCount()) * ratio * height);
                        const lineNumbers = overviewRuler.modelRanges.map(range => range.startLineNumber).reduce((previous, current) => {
                            if (previous.length === 0) {
                                previous.push(current);
                            }
                            else {
                                const last = previous[previous.length - 1];
                                if (last !== current) {
                                    previous.push(current);
                                }
                            }
                            return previous;
                        }, []);
                        for (let i = 0; i < lineNumbers.length; i++) {
                            ctx.fillStyle = fillStyle;
                            const lineNumber = lineNumbers[i];
                            const offset = (lineNumber - 1) * lineHeight;
                            ctx.fillRect(laneWidth, currentFrom + offset, laneWidth, lineHeight);
                        }
                        if (overviewRuler.includeOutput) {
                            ctx.fillStyle = fillStyle;
                            const outputOffset = (viewCell.layoutInfo.editorHeight / scrollHeight) * ratio * height;
                            const decorationHeight = (fontInfo.lineHeight / scrollHeight) * ratio * height;
                            ctx.fillRect(laneWidth, currentFrom + outputOffset, laneWidth, decorationHeight);
                        }
                    });
                    currentFrom += cellHeight;
                }
            }
        }
    };
    NotebookOverviewRuler = __decorate([
        __param(2, themeService_1.IThemeService)
    ], NotebookOverviewRuler);
    exports.NotebookOverviewRuler = NotebookOverviewRuler;
});
//# sourceMappingURL=notebookOverviewRuler.js.map