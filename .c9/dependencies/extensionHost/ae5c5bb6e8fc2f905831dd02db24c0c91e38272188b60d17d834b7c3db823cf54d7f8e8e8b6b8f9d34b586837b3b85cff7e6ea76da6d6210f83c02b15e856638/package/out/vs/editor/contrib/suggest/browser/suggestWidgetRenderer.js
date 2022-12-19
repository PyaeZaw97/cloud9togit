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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/config/editorOptions", "vs/editor/common/languages", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/nls", "vs/platform/files/common/files", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService", "./suggestWidgetDetails"], function (require, exports, browser_1, dom_1, iconLabel_1, codicons_1, event_1, filters_1, lifecycle_1, uri_1, editorOptions_1, languages_1, getIconClasses_1, model_1, language_1, nls, files_1, iconRegistry_1, themeService_1, suggestWidgetDetails_1) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ItemRenderer = exports.suggestMoreInfoIcon = exports.getAriaId = void 0;
    function getAriaId(index) {
        return `suggest-aria-id:${index}`;
    }
    exports.getAriaId = getAriaId;
    exports.suggestMoreInfoIcon = (0, iconRegistry_1.registerIcon)('suggest-more-info', codicons_1.Codicon.chevronRight, nls.localize('suggestMoreInfoIcon', 'Icon for more information in the suggest widget.'));
    const _completionItemColor = new (_a = class ColorExtractor {
            extract(item, out) {
                if (item.textLabel.match(ColorExtractor._regexStrict)) {
                    out[0] = item.textLabel;
                    return true;
                }
                if (item.completion.detail && item.completion.detail.match(ColorExtractor._regexStrict)) {
                    out[0] = item.completion.detail;
                    return true;
                }
                if (typeof item.completion.documentation === 'string') {
                    const match = ColorExtractor._regexRelaxed.exec(item.completion.documentation);
                    if (match && (match.index === 0 || match.index + match[0].length === item.completion.documentation.length)) {
                        out[0] = match[0];
                        return true;
                    }
                }
                return false;
            }
        },
        _a._regexRelaxed = /(#([\da-fA-F]{3}){1,2}|(rgb|hsl)a\(\s*(\d{1,3}%?\s*,\s*){3}(1|0?\.\d+)\)|(rgb|hsl)\(\s*\d{1,3}%?(\s*,\s*\d{1,3}%?){2}\s*\))/,
        _a._regexStrict = new RegExp(`^${_a._regexRelaxed.source}$`, 'i'),
        _a);
    let ItemRenderer = class ItemRenderer {
        constructor(_editor, _modelService, _languageService, _themeService) {
            this._editor = _editor;
            this._modelService = _modelService;
            this._languageService = _languageService;
            this._themeService = _themeService;
            this._onDidToggleDetails = new event_1.Emitter();
            this.onDidToggleDetails = this._onDidToggleDetails.event;
            this.templateId = 'suggestion';
        }
        dispose() {
            this._onDidToggleDetails.dispose();
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.disposables = new lifecycle_1.DisposableStore();
            data.root = container;
            data.root.classList.add('show-file-icons');
            data.icon = (0, dom_1.append)(container, (0, dom_1.$)('.icon'));
            data.colorspan = (0, dom_1.append)(data.icon, (0, dom_1.$)('span.colorspan'));
            const text = (0, dom_1.append)(container, (0, dom_1.$)('.contents'));
            const main = (0, dom_1.append)(text, (0, dom_1.$)('.main'));
            data.iconContainer = (0, dom_1.append)(main, (0, dom_1.$)('.icon-label.codicon'));
            data.left = (0, dom_1.append)(main, (0, dom_1.$)('span.left'));
            data.right = (0, dom_1.append)(main, (0, dom_1.$)('span.right'));
            data.iconLabel = new iconLabel_1.IconLabel(data.left, { supportHighlights: true, supportIcons: true });
            data.disposables.add(data.iconLabel);
            data.parametersLabel = (0, dom_1.append)(data.left, (0, dom_1.$)('span.signature-label'));
            data.qualifierLabel = (0, dom_1.append)(data.left, (0, dom_1.$)('span.qualifier-label'));
            data.detailsLabel = (0, dom_1.append)(data.right, (0, dom_1.$)('span.details-label'));
            data.readMore = (0, dom_1.append)(data.right, (0, dom_1.$)('span.readMore' + themeService_1.ThemeIcon.asCSSSelector(exports.suggestMoreInfoIcon)));
            data.readMore.title = nls.localize('readMore', "Read More");
            const configureFont = () => {
                const options = this._editor.getOptions();
                const fontInfo = options.get(44 /* EditorOption.fontInfo */);
                const fontFamily = fontInfo.getMassagedFontFamily(browser_1.isSafari ? editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily : null);
                const fontFeatureSettings = fontInfo.fontFeatureSettings;
                const fontSize = options.get(107 /* EditorOption.suggestFontSize */) || fontInfo.fontSize;
                const lineHeight = options.get(108 /* EditorOption.suggestLineHeight */) || fontInfo.lineHeight;
                const fontWeight = fontInfo.fontWeight;
                const fontSizePx = `${fontSize}px`;
                const lineHeightPx = `${lineHeight}px`;
                data.root.style.fontSize = fontSizePx;
                data.root.style.fontWeight = fontWeight;
                main.style.fontFamily = fontFamily;
                main.style.fontFeatureSettings = fontFeatureSettings;
                main.style.lineHeight = lineHeightPx;
                data.icon.style.height = lineHeightPx;
                data.icon.style.width = lineHeightPx;
                data.readMore.style.height = lineHeightPx;
                data.readMore.style.width = lineHeightPx;
            };
            configureFont();
            data.disposables.add(this._editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(44 /* EditorOption.fontInfo */) || e.hasChanged(107 /* EditorOption.suggestFontSize */) || e.hasChanged(108 /* EditorOption.suggestLineHeight */)) {
                    configureFont();
                }
            }));
            return data;
        }
        renderElement(element, index, data) {
            const { completion } = element;
            data.root.id = getAriaId(index);
            data.colorspan.style.backgroundColor = '';
            const labelOptions = {
                labelEscapeNewLines: true,
                matches: (0, filters_1.createMatches)(element.score)
            };
            let color = [];
            if (completion.kind === 19 /* CompletionItemKind.Color */ && _completionItemColor.extract(element, color)) {
                // special logic for 'color' completion items
                data.icon.className = 'icon customcolor';
                data.iconContainer.className = 'icon hide';
                data.colorspan.style.backgroundColor = color[0];
            }
            else if (completion.kind === 20 /* CompletionItemKind.File */ && this._themeService.getFileIconTheme().hasFileIcons) {
                // special logic for 'file' completion items
                data.icon.className = 'icon hide';
                data.iconContainer.className = 'icon hide';
                const labelClasses = (0, getIconClasses_1.getIconClasses)(this._modelService, this._languageService, uri_1.URI.from({ scheme: 'fake', path: element.textLabel }), files_1.FileKind.FILE);
                const detailClasses = (0, getIconClasses_1.getIconClasses)(this._modelService, this._languageService, uri_1.URI.from({ scheme: 'fake', path: completion.detail }), files_1.FileKind.FILE);
                labelOptions.extraClasses = labelClasses.length > detailClasses.length ? labelClasses : detailClasses;
            }
            else if (completion.kind === 23 /* CompletionItemKind.Folder */ && this._themeService.getFileIconTheme().hasFolderIcons) {
                // special logic for 'folder' completion items
                data.icon.className = 'icon hide';
                data.iconContainer.className = 'icon hide';
                labelOptions.extraClasses = [
                    (0, getIconClasses_1.getIconClasses)(this._modelService, this._languageService, uri_1.URI.from({ scheme: 'fake', path: element.textLabel }), files_1.FileKind.FOLDER),
                    (0, getIconClasses_1.getIconClasses)(this._modelService, this._languageService, uri_1.URI.from({ scheme: 'fake', path: completion.detail }), files_1.FileKind.FOLDER)
                ].flat();
            }
            else {
                // normal icon
                data.icon.className = 'icon hide';
                data.iconContainer.className = '';
                data.iconContainer.classList.add('suggest-icon', ...codicons_1.CSSIcon.asClassNameArray(languages_1.CompletionItemKinds.toIcon(completion.kind)));
            }
            if (completion.tags && completion.tags.indexOf(1 /* CompletionItemTag.Deprecated */) >= 0) {
                labelOptions.extraClasses = (labelOptions.extraClasses || []).concat(['deprecated']);
                labelOptions.matches = [];
            }
            data.iconLabel.setLabel(element.textLabel, undefined, labelOptions);
            if (typeof completion.label === 'string') {
                data.parametersLabel.textContent = '';
                data.detailsLabel.textContent = stripNewLines(completion.detail || '');
                data.root.classList.add('string-label');
            }
            else {
                data.parametersLabel.textContent = stripNewLines(completion.label.detail || '');
                data.detailsLabel.textContent = stripNewLines(completion.label.description || '');
                data.root.classList.remove('string-label');
            }
            if (this._editor.getOption(106 /* EditorOption.suggest */).showInlineDetails) {
                (0, dom_1.show)(data.detailsLabel);
            }
            else {
                (0, dom_1.hide)(data.detailsLabel);
            }
            if ((0, suggestWidgetDetails_1.canExpandCompletionItem)(element)) {
                data.right.classList.add('can-expand-details');
                (0, dom_1.show)(data.readMore);
                data.readMore.onmousedown = e => {
                    e.stopPropagation();
                    e.preventDefault();
                };
                data.readMore.onclick = e => {
                    e.stopPropagation();
                    e.preventDefault();
                    this._onDidToggleDetails.fire();
                };
            }
            else {
                data.right.classList.remove('can-expand-details');
                (0, dom_1.hide)(data.readMore);
                data.readMore.onmousedown = null;
                data.readMore.onclick = null;
            }
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
    };
    ItemRenderer = __decorate([
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService),
        __param(3, themeService_1.IThemeService)
    ], ItemRenderer);
    exports.ItemRenderer = ItemRenderer;
    function stripNewLines(str) {
        return str.replace(/\r\n|\r|\n/g, '');
    }
});
//# sourceMappingURL=suggestWidgetRenderer.js.map