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
define(["require", "exports", "vs/base/browser/dom", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/comments/browser/commentThreadWidget", "vs/base/common/lifecycle", "vs/platform/theme/common/themeService", "vs/workbench/contrib/comments/browser/commentService", "vs/base/common/arrays", "vs/editor/contrib/peekView/browser/peekView", "vs/platform/configuration/common/configuration", "vs/editor/common/config/editorOptions"], function (require, exports, dom, contextkey_1, instantiation_1, cellPart_1, notebookCommon_1, commentThreadWidget_1, lifecycle_1, themeService_1, commentService_1, arrays_1, peekView_1, configuration_1, editorOptions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellComments = void 0;
    let CellComments = class CellComments extends cellPart_1.CellPart {
        constructor(notebookEditor, container, contextKeyService, themeService, commentService, configurationService, instantiationService) {
            super();
            this.notebookEditor = notebookEditor;
            this.container = container;
            this.contextKeyService = contextKeyService;
            this.themeService = themeService;
            this.commentService = commentService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this._initialized = false;
            this._commentThreadWidget = null;
            this.commentTheadDisposables = this._register(new lifecycle_1.DisposableStore());
            this.container.classList.add('review-widget');
            this._register(this.themeService.onDidColorThemeChange(this._applyTheme, this));
            // TODO @rebornix onDidChangeLayout (font change)
            // this._register(this.notebookEditor.onDidchangeLa)
            this._applyTheme();
        }
        async initialize(element) {
            if (this._initialized) {
                return;
            }
            this._initialized = true;
            const info = await this._getCommentThreadForCell(element);
            if (info) {
                this._createCommentTheadWidget(info.owner, info.thread);
            }
        }
        _createCommentTheadWidget(owner, commentThread) {
            var _a;
            (_a = this._commentThreadWidget) === null || _a === void 0 ? void 0 : _a.dispose();
            this.commentTheadDisposables.clear();
            this._commentThreadWidget = this.instantiationService.createInstance(commentThreadWidget_1.CommentThreadWidget, this.container, owner, this.notebookEditor.textModel.uri, this.contextKeyService, this.instantiationService, commentThread, null, {
                codeBlockFontFamily: this.configurationService.getValue('editor').fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily
            }, undefined, {
                actionRunner: () => {
                },
                collapse: () => { }
            });
            const layoutInfo = this.notebookEditor.getLayoutInfo();
            this._commentThreadWidget.display(layoutInfo.fontInfo.lineHeight);
            this._applyTheme();
            this.commentTheadDisposables.add(this._commentThreadWidget.onDidResize(() => {
                var _a;
                if (((_a = this.currentElement) === null || _a === void 0 ? void 0 : _a.cellKind) === notebookCommon_1.CellKind.Code && this._commentThreadWidget) {
                    this.currentElement.commentHeight = dom.getClientArea(this._commentThreadWidget.container).height;
                }
            }));
        }
        _bindListeners() {
            this.cellDisposables.add(this.commentService.onDidUpdateCommentThreads(async () => {
                if (this.currentElement) {
                    const info = await this._getCommentThreadForCell(this.currentElement);
                    if (!this._commentThreadWidget && info) {
                        this._createCommentTheadWidget(info.owner, info.thread);
                        const layoutInfo = this.currentElement.layoutInfo;
                        this.container.style.top = `${layoutInfo.outputContainerOffset + layoutInfo.outputTotalHeight}px`;
                        this.currentElement.commentHeight = dom.getClientArea(this._commentThreadWidget.container).height;
                        return;
                    }
                    if (this._commentThreadWidget) {
                        if (info) {
                            this._commentThreadWidget.updateCommentThread(info.thread);
                            this.currentElement.commentHeight = dom.getClientArea(this._commentThreadWidget.container).height;
                        }
                        else {
                            this._commentThreadWidget.dispose();
                            this.currentElement.commentHeight = 0;
                        }
                    }
                }
            }));
        }
        async _getCommentThreadForCell(element) {
            if (this.notebookEditor.hasModel()) {
                const commentInfos = (0, arrays_1.coalesce)(await this.commentService.getNotebookComments(element.uri));
                if (commentInfos.length && commentInfos[0].threads.length) {
                    return { owner: commentInfos[0].owner, thread: commentInfos[0].threads[0] };
                }
            }
            return null;
        }
        _applyTheme() {
            var _a;
            const theme = this.themeService.getColorTheme();
            const fontInfo = this.notebookEditor.getLayoutInfo().fontInfo;
            (_a = this._commentThreadWidget) === null || _a === void 0 ? void 0 : _a.applyTheme(theme, fontInfo);
        }
        didRenderCell(element) {
            if (element.cellKind === notebookCommon_1.CellKind.Code) {
                this.currentElement = element;
                this.initialize(element);
                this._bindListeners();
            }
        }
        prepareLayout() {
            var _a;
            if (((_a = this.currentElement) === null || _a === void 0 ? void 0 : _a.cellKind) === notebookCommon_1.CellKind.Code && this._commentThreadWidget) {
                this.currentElement.commentHeight = dom.getClientArea(this._commentThreadWidget.container).height;
            }
        }
        updateInternalLayoutNow(element) {
            var _a;
            if (((_a = this.currentElement) === null || _a === void 0 ? void 0 : _a.cellKind) === notebookCommon_1.CellKind.Code && this._commentThreadWidget) {
                const layoutInfo = element.layoutInfo;
                this.container.style.top = `${layoutInfo.outputContainerOffset + layoutInfo.outputTotalHeight}px`;
            }
        }
    };
    CellComments = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, themeService_1.IThemeService),
        __param(4, commentService_1.ICommentService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, instantiation_1.IInstantiationService)
    ], CellComments);
    exports.CellComments = CellComments;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const borderColor = theme.getColor(peekView_1.peekViewBorder);
        if (borderColor) {
            collector.addRule(`.cell-comment-container.review-widget { border-left: 1px solid ${borderColor}; border-right: 1px solid ${borderColor}; }`);
            collector.addRule(`.cell-comment-container.review-widget > .head { border-top: 1px solid ${borderColor}; }`);
            collector.addRule(`.cell-comment-container.review-widget > .body { border-bottom: 1px solid ${borderColor}; }`);
        }
        const peekViewBackground = theme.getColor(peekView_1.peekViewResultsBackground);
        if (peekViewBackground) {
            collector.addRule(`.cell-comment-container.review-widget {` +
                `	background-color: ${peekViewBackground};` +
                `}`);
        }
    });
});
//# sourceMappingURL=cellComments.js.map