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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/color", "vs/base/common/event", "vs/base/common/objects", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/embeddedCodeEditorWidget", "vs/editor/contrib/zoneWidget/browser/zoneWidget", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/colorRegistry", "vs/css!./media/peekViewWidget"], function (require, exports, dom, actionbar_1, actions_1, codicons_1, color_1, event_1, objects, editorExtensions_1, codeEditorService_1, embeddedCodeEditorWidget_1, zoneWidget_1, nls, menuEntryActionViewItem_1, contextkey_1, extensions_1, instantiation_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.peekViewEditorMatchHighlightBorder = exports.peekViewEditorMatchHighlight = exports.peekViewResultsMatchHighlight = exports.peekViewEditorGutterBackground = exports.peekViewEditorBackground = exports.peekViewResultsSelectionForeground = exports.peekViewResultsSelectionBackground = exports.peekViewResultsFileForeground = exports.peekViewResultsMatchForeground = exports.peekViewResultsBackground = exports.peekViewBorder = exports.peekViewTitleInfoForeground = exports.peekViewTitleForeground = exports.peekViewTitleBackground = exports.PeekViewWidget = exports.getOuterEditor = exports.PeekContext = exports.IPeekViewService = void 0;
    exports.IPeekViewService = (0, instantiation_1.createDecorator)('IPeekViewService');
    (0, extensions_1.registerSingleton)(exports.IPeekViewService, class {
        constructor() {
            this._widgets = new Map();
        }
        addExclusiveWidget(editor, widget) {
            const existing = this._widgets.get(editor);
            if (existing) {
                existing.listener.dispose();
                existing.widget.dispose();
            }
            const remove = () => {
                const data = this._widgets.get(editor);
                if (data && data.widget === widget) {
                    data.listener.dispose();
                    this._widgets.delete(editor);
                }
            };
            this._widgets.set(editor, { widget, listener: widget.onDidClose(remove) });
        }
    });
    var PeekContext;
    (function (PeekContext) {
        PeekContext.inPeekEditor = new contextkey_1.RawContextKey('inReferenceSearchEditor', true, nls.localize('inReferenceSearchEditor', "Whether the current code editor is embedded inside peek"));
        PeekContext.notInPeekEditor = PeekContext.inPeekEditor.toNegated();
    })(PeekContext = exports.PeekContext || (exports.PeekContext = {}));
    let PeekContextController = class PeekContextController {
        constructor(editor, contextKeyService) {
            if (editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) {
                PeekContext.inPeekEditor.bindTo(contextKeyService);
            }
        }
        dispose() { }
    };
    PeekContextController.ID = 'editor.contrib.referenceController';
    PeekContextController = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], PeekContextController);
    (0, editorExtensions_1.registerEditorContribution)(PeekContextController.ID, PeekContextController);
    function getOuterEditor(accessor) {
        let editor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
        if (editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) {
            return editor.getParentEditor();
        }
        return editor;
    }
    exports.getOuterEditor = getOuterEditor;
    const defaultOptions = {
        headerBackgroundColor: color_1.Color.white,
        primaryHeadingColor: color_1.Color.fromHex('#333333'),
        secondaryHeadingColor: color_1.Color.fromHex('#6c6c6cb3')
    };
    let PeekViewWidget = class PeekViewWidget extends zoneWidget_1.ZoneWidget {
        constructor(editor, options, instantiationService) {
            super(editor, options);
            this.instantiationService = instantiationService;
            this._onDidClose = new event_1.Emitter();
            this.onDidClose = this._onDidClose.event;
            objects.mixin(this.options, defaultOptions, false);
        }
        dispose() {
            if (!this.disposed) {
                this.disposed = true; // prevent consumers who dispose on onDidClose from looping
                super.dispose();
                this._onDidClose.fire(this);
            }
        }
        style(styles) {
            let options = this.options;
            if (styles.headerBackgroundColor) {
                options.headerBackgroundColor = styles.headerBackgroundColor;
            }
            if (styles.primaryHeadingColor) {
                options.primaryHeadingColor = styles.primaryHeadingColor;
            }
            if (styles.secondaryHeadingColor) {
                options.secondaryHeadingColor = styles.secondaryHeadingColor;
            }
            super.style(styles);
        }
        _applyStyles() {
            super._applyStyles();
            let options = this.options;
            if (this._headElement && options.headerBackgroundColor) {
                this._headElement.style.backgroundColor = options.headerBackgroundColor.toString();
            }
            if (this._primaryHeading && options.primaryHeadingColor) {
                this._primaryHeading.style.color = options.primaryHeadingColor.toString();
            }
            if (this._secondaryHeading && options.secondaryHeadingColor) {
                this._secondaryHeading.style.color = options.secondaryHeadingColor.toString();
            }
            if (this._bodyElement && options.frameColor) {
                this._bodyElement.style.borderColor = options.frameColor.toString();
            }
        }
        _fillContainer(container) {
            this.setCssClass('peekview-widget');
            this._headElement = dom.$('.head');
            this._bodyElement = dom.$('.body');
            this._fillHead(this._headElement);
            this._fillBody(this._bodyElement);
            container.appendChild(this._headElement);
            container.appendChild(this._bodyElement);
        }
        _fillHead(container, noCloseAction) {
            const titleElement = dom.$('.peekview-title');
            if (this.options.supportOnTitleClick) {
                titleElement.classList.add('clickable');
                dom.addStandardDisposableListener(titleElement, 'click', event => this._onTitleClick(event));
            }
            dom.append(this._headElement, titleElement);
            this._fillTitleIcon(titleElement);
            this._primaryHeading = dom.$('span.filename');
            this._secondaryHeading = dom.$('span.dirname');
            this._metaHeading = dom.$('span.meta');
            dom.append(titleElement, this._primaryHeading, this._secondaryHeading, this._metaHeading);
            const actionsContainer = dom.$('.peekview-actions');
            dom.append(this._headElement, actionsContainer);
            const actionBarOptions = this._getActionBarOptions();
            this._actionbarWidget = new actionbar_1.ActionBar(actionsContainer, actionBarOptions);
            this._disposables.add(this._actionbarWidget);
            if (!noCloseAction) {
                this._actionbarWidget.push(new actions_1.Action('peekview.close', nls.localize('label.close', "Close"), codicons_1.Codicon.close.classNames, true, () => {
                    this.dispose();
                    return Promise.resolve();
                }), { label: false, icon: true });
            }
        }
        _fillTitleIcon(container) {
        }
        _getActionBarOptions() {
            return {
                actionViewItemProvider: menuEntryActionViewItem_1.createActionViewItem.bind(undefined, this.instantiationService),
                orientation: 0 /* ActionsOrientation.HORIZONTAL */
            };
        }
        _onTitleClick(event) {
            // implement me if supportOnTitleClick option is set
        }
        setTitle(primaryHeading, secondaryHeading) {
            if (this._primaryHeading && this._secondaryHeading) {
                this._primaryHeading.innerText = primaryHeading;
                this._primaryHeading.setAttribute('title', primaryHeading);
                if (secondaryHeading) {
                    this._secondaryHeading.innerText = secondaryHeading;
                }
                else {
                    dom.clearNode(this._secondaryHeading);
                }
            }
        }
        setMetaTitle(value) {
            if (this._metaHeading) {
                if (value) {
                    this._metaHeading.innerText = value;
                    dom.show(this._metaHeading);
                }
                else {
                    dom.hide(this._metaHeading);
                }
            }
        }
        _doLayout(heightInPixel, widthInPixel) {
            if (!this._isShowing && heightInPixel < 0) {
                // Looks like the view zone got folded away!
                this.dispose();
                return;
            }
            const headHeight = Math.ceil(this.editor.getOption(59 /* EditorOption.lineHeight */) * 1.2);
            const bodyHeight = Math.round(heightInPixel - (headHeight + 2 /* the border-top/bottom width*/));
            this._doLayoutHead(headHeight, widthInPixel);
            this._doLayoutBody(bodyHeight, widthInPixel);
        }
        _doLayoutHead(heightInPixel, widthInPixel) {
            if (this._headElement) {
                this._headElement.style.height = `${heightInPixel}px`;
                this._headElement.style.lineHeight = this._headElement.style.height;
            }
        }
        _doLayoutBody(heightInPixel, widthInPixel) {
            if (this._bodyElement) {
                this._bodyElement.style.height = `${heightInPixel}px`;
            }
        }
    };
    PeekViewWidget = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], PeekViewWidget);
    exports.PeekViewWidget = PeekViewWidget;
    exports.peekViewTitleBackground = (0, colorRegistry_1.registerColor)('peekViewTitle.background', { dark: (0, colorRegistry_1.transparent)(colorRegistry_1.editorInfoForeground, .1), light: (0, colorRegistry_1.transparent)(colorRegistry_1.editorInfoForeground, .1), hcDark: null, hcLight: null }, nls.localize('peekViewTitleBackground', 'Background color of the peek view title area.'));
    exports.peekViewTitleForeground = (0, colorRegistry_1.registerColor)('peekViewTitleLabel.foreground', { dark: color_1.Color.white, light: color_1.Color.black, hcDark: color_1.Color.white, hcLight: colorRegistry_1.editorForeground }, nls.localize('peekViewTitleForeground', 'Color of the peek view title.'));
    exports.peekViewTitleInfoForeground = (0, colorRegistry_1.registerColor)('peekViewTitleDescription.foreground', { dark: '#ccccccb3', light: '#616161', hcDark: '#FFFFFF99', hcLight: '#292929' }, nls.localize('peekViewTitleInfoForeground', 'Color of the peek view title info.'));
    exports.peekViewBorder = (0, colorRegistry_1.registerColor)('peekView.border', { dark: colorRegistry_1.editorInfoForeground, light: colorRegistry_1.editorInfoForeground, hcDark: colorRegistry_1.contrastBorder, hcLight: colorRegistry_1.contrastBorder }, nls.localize('peekViewBorder', 'Color of the peek view borders and arrow.'));
    exports.peekViewResultsBackground = (0, colorRegistry_1.registerColor)('peekViewResult.background', { dark: '#252526', light: '#F3F3F3', hcDark: color_1.Color.black, hcLight: color_1.Color.white }, nls.localize('peekViewResultsBackground', 'Background color of the peek view result list.'));
    exports.peekViewResultsMatchForeground = (0, colorRegistry_1.registerColor)('peekViewResult.lineForeground', { dark: '#bbbbbb', light: '#646465', hcDark: color_1.Color.white, hcLight: colorRegistry_1.editorForeground }, nls.localize('peekViewResultsMatchForeground', 'Foreground color for line nodes in the peek view result list.'));
    exports.peekViewResultsFileForeground = (0, colorRegistry_1.registerColor)('peekViewResult.fileForeground', { dark: color_1.Color.white, light: '#1E1E1E', hcDark: color_1.Color.white, hcLight: colorRegistry_1.editorForeground }, nls.localize('peekViewResultsFileForeground', 'Foreground color for file nodes in the peek view result list.'));
    exports.peekViewResultsSelectionBackground = (0, colorRegistry_1.registerColor)('peekViewResult.selectionBackground', { dark: '#3399ff33', light: '#3399ff33', hcDark: null, hcLight: null }, nls.localize('peekViewResultsSelectionBackground', 'Background color of the selected entry in the peek view result list.'));
    exports.peekViewResultsSelectionForeground = (0, colorRegistry_1.registerColor)('peekViewResult.selectionForeground', { dark: color_1.Color.white, light: '#6C6C6C', hcDark: color_1.Color.white, hcLight: colorRegistry_1.editorForeground }, nls.localize('peekViewResultsSelectionForeground', 'Foreground color of the selected entry in the peek view result list.'));
    exports.peekViewEditorBackground = (0, colorRegistry_1.registerColor)('peekViewEditor.background', { dark: '#001F33', light: '#F2F8FC', hcDark: color_1.Color.black, hcLight: color_1.Color.white }, nls.localize('peekViewEditorBackground', 'Background color of the peek view editor.'));
    exports.peekViewEditorGutterBackground = (0, colorRegistry_1.registerColor)('peekViewEditorGutter.background', { dark: exports.peekViewEditorBackground, light: exports.peekViewEditorBackground, hcDark: exports.peekViewEditorBackground, hcLight: exports.peekViewEditorBackground }, nls.localize('peekViewEditorGutterBackground', 'Background color of the gutter in the peek view editor.'));
    exports.peekViewResultsMatchHighlight = (0, colorRegistry_1.registerColor)('peekViewResult.matchHighlightBackground', { dark: '#ea5c004d', light: '#ea5c004d', hcDark: null, hcLight: null }, nls.localize('peekViewResultsMatchHighlight', 'Match highlight color in the peek view result list.'));
    exports.peekViewEditorMatchHighlight = (0, colorRegistry_1.registerColor)('peekViewEditor.matchHighlightBackground', { dark: '#ff8f0099', light: '#f5d802de', hcDark: null, hcLight: null }, nls.localize('peekViewEditorMatchHighlight', 'Match highlight color in the peek view editor.'));
    exports.peekViewEditorMatchHighlightBorder = (0, colorRegistry_1.registerColor)('peekViewEditor.matchHighlightBorder', { dark: null, light: null, hcDark: colorRegistry_1.activeContrastBorder, hcLight: colorRegistry_1.activeContrastBorder }, nls.localize('peekViewEditorMatchHighlightBorder', 'Match highlight border in the peek view editor.'));
});
//# sourceMappingURL=peekView.js.map