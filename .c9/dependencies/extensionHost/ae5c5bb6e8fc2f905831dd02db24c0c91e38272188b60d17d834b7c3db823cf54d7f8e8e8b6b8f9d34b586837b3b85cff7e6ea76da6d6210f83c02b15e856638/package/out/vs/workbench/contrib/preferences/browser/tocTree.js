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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/list/listWidget", "vs/base/common/iterator", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/list/browser/listService", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/workbench/contrib/preferences/browser/settingsTree", "vs/workbench/contrib/preferences/browser/settingsTreeModels", "vs/workbench/contrib/preferences/common/settingsEditorColorRegistry", "vs/workbench/services/environment/common/environmentService"], function (require, exports, DOM, listWidget_1, iterator_1, nls_1, accessibility_1, configuration_1, contextkey_1, instantiation_1, keybinding_1, listService_1, colorRegistry_1, styler_1, themeService_1, settingsTree_1, settingsTreeModels_1, settingsEditorColorRegistry_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TOCTree = exports.createTOCIterator = exports.TOCRenderer = exports.TOCTreeModel = void 0;
    const $ = DOM.$;
    let TOCTreeModel = class TOCTreeModel {
        constructor(_viewState, environmentService) {
            this._viewState = _viewState;
            this.environmentService = environmentService;
            this._currentSearchModel = null;
        }
        get settingsTreeRoot() {
            return this._settingsTreeRoot;
        }
        set settingsTreeRoot(value) {
            this._settingsTreeRoot = value;
            this.update();
        }
        get currentSearchModel() {
            return this._currentSearchModel;
        }
        set currentSearchModel(model) {
            this._currentSearchModel = model;
            this.update();
        }
        get children() {
            return this._settingsTreeRoot.children;
        }
        update() {
            if (this._settingsTreeRoot) {
                this.updateGroupCount(this._settingsTreeRoot);
            }
        }
        updateGroupCount(group) {
            group.children.forEach(child => {
                if (child instanceof settingsTreeModels_1.SettingsTreeGroupElement) {
                    this.updateGroupCount(child);
                }
            });
            const childCount = group.children
                .filter(child => child instanceof settingsTreeModels_1.SettingsTreeGroupElement)
                .reduce((acc, cur) => acc + cur.count, 0);
            group.count = childCount + this.getGroupCount(group);
        }
        getGroupCount(group) {
            return group.children.filter(child => {
                if (!(child instanceof settingsTreeModels_1.SettingsTreeSettingElement)) {
                    return false;
                }
                if (this._currentSearchModel && !this._currentSearchModel.root.containsSetting(child.setting.key)) {
                    return false;
                }
                // Check everything that the SettingsFilter checks except whether it's filtered by a category
                const isRemote = !!this.environmentService.remoteAuthority;
                return child.matchesScope(this._viewState.settingsTarget, isRemote) &&
                    child.matchesAllTags(this._viewState.tagFilters) &&
                    child.matchesAnyFeature(this._viewState.featureFilters) &&
                    child.matchesAnyExtension(this._viewState.extensionFilters) &&
                    child.matchesAnyId(this._viewState.idFilters);
            }).length;
        }
    };
    TOCTreeModel = __decorate([
        __param(1, environmentService_1.IWorkbenchEnvironmentService)
    ], TOCTreeModel);
    exports.TOCTreeModel = TOCTreeModel;
    const TOC_ENTRY_TEMPLATE_ID = 'settings.toc.entry';
    class TOCRenderer {
        constructor() {
            this.templateId = TOC_ENTRY_TEMPLATE_ID;
        }
        renderTemplate(container) {
            return {
                labelElement: DOM.append(container, $('.settings-toc-entry')),
                countElement: DOM.append(container, $('.settings-toc-count'))
            };
        }
        renderElement(node, index, template) {
            const element = node.element;
            const count = element.count;
            const label = element.label;
            template.labelElement.textContent = label;
            template.labelElement.title = label;
            if (count) {
                template.countElement.textContent = ` (${count})`;
            }
            else {
                template.countElement.textContent = '';
            }
        }
        disposeTemplate(templateData) {
        }
    }
    exports.TOCRenderer = TOCRenderer;
    class TOCTreeDelegate {
        getTemplateId(element) {
            return TOC_ENTRY_TEMPLATE_ID;
        }
        getHeight(element) {
            return 22;
        }
    }
    function createTOCIterator(model, tree) {
        const groupChildren = model.children.filter(c => c instanceof settingsTreeModels_1.SettingsTreeGroupElement);
        return iterator_1.Iterable.map(groupChildren, g => {
            const hasGroupChildren = g.children.some(c => c instanceof settingsTreeModels_1.SettingsTreeGroupElement);
            return {
                element: g,
                collapsed: undefined,
                collapsible: hasGroupChildren,
                children: g instanceof settingsTreeModels_1.SettingsTreeGroupElement ?
                    createTOCIterator(g, tree) :
                    undefined
            };
        });
    }
    exports.createTOCIterator = createTOCIterator;
    class SettingsAccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)({
                key: 'settingsTOC',
                comment: ['A label for the table of contents for the full settings list']
            }, "Settings Table of Contents");
        }
        getAriaLabel(element) {
            if (!element) {
                return '';
            }
            if (element instanceof settingsTreeModels_1.SettingsTreeGroupElement) {
                return (0, nls_1.localize)('groupRowAriaLabel', "{0}, group", element.label);
            }
            return '';
        }
        getAriaLevel(element) {
            let i = 1;
            while (element instanceof settingsTreeModels_1.SettingsTreeGroupElement && element.parent) {
                i++;
                element = element.parent;
            }
            return i;
        }
    }
    let TOCTree = class TOCTree extends listService_1.WorkbenchObjectTree {
        constructor(container, viewState, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService, instantiationService) {
            // test open mode
            const filter = instantiationService.createInstance(settingsTree_1.SettingsTreeFilter, viewState);
            const options = {
                filter,
                multipleSelectionSupport: false,
                identityProvider: {
                    getId(e) {
                        return e.id;
                    }
                },
                styleController: id => new listWidget_1.DefaultStyleController(DOM.createStyleSheet(container), id),
                accessibilityProvider: instantiationService.createInstance(SettingsAccessibilityProvider),
                collapseByDefault: true,
                horizontalScrolling: false,
                hideTwistiesOfChildlessElements: true
            };
            super('SettingsTOC', container, new TOCTreeDelegate(), [new TOCRenderer()], options, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService);
            this.disposables.add((0, styler_1.attachStyler)(themeService, {
                listBackground: colorRegistry_1.editorBackground,
                listFocusOutline: colorRegistry_1.focusBorder,
                listActiveSelectionBackground: colorRegistry_1.editorBackground,
                listActiveSelectionForeground: settingsEditorColorRegistry_1.settingsHeaderForeground,
                listFocusAndSelectionBackground: colorRegistry_1.editorBackground,
                listFocusAndSelectionForeground: settingsEditorColorRegistry_1.settingsHeaderForeground,
                listFocusBackground: colorRegistry_1.editorBackground,
                listFocusForeground: (0, colorRegistry_1.transparent)(colorRegistry_1.foreground, 0.9),
                listHoverForeground: (0, colorRegistry_1.transparent)(colorRegistry_1.foreground, 0.9),
                listHoverBackground: colorRegistry_1.editorBackground,
                listInactiveSelectionBackground: colorRegistry_1.editorBackground,
                listInactiveSelectionForeground: settingsEditorColorRegistry_1.settingsHeaderForeground,
                listInactiveFocusBackground: colorRegistry_1.editorBackground,
                listInactiveFocusOutline: colorRegistry_1.editorBackground
            }, colors => {
                this.style(colors);
            }));
        }
    };
    TOCTree = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, listService_1.IListService),
        __param(4, themeService_1.IThemeService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, accessibility_1.IAccessibilityService),
        __param(8, instantiation_1.IInstantiationService)
    ], TOCTree);
    exports.TOCTree = TOCTree;
});
//# sourceMappingURL=tocTree.js.map