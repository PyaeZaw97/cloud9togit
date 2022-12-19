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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/contrib/extensions/browser/extensionsWidgets", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/notification/common/notification", "vs/platform/extensions/common/extensions", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/platform/contextview/browser/contextView", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/css!./media/extension"], function (require, exports, dom_1, lifecycle_1, actionbar_1, instantiation_1, extensions_1, extensionsActions_1, extensionManagementUtil_1, extensionsWidgets_1, extensions_2, extensionManagement_1, notification_1, extensions_3, themeService_1, colorRegistry_1, theme_1, contextView_1, extensionsIcons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Renderer = exports.Delegate = exports.EXTENSION_LIST_ELEMENT_HEIGHT = void 0;
    exports.EXTENSION_LIST_ELEMENT_HEIGHT = 62;
    class Delegate {
        getHeight() { return exports.EXTENSION_LIST_ELEMENT_HEIGHT; }
        getTemplateId() { return 'extension'; }
    }
    exports.Delegate = Delegate;
    let Renderer = class Renderer {
        constructor(extensionViewState, options, instantiationService, notificationService, extensionService, extensionManagementServerService, extensionsWorkbenchService, contextMenuService) {
            this.extensionViewState = extensionViewState;
            this.options = options;
            this.instantiationService = instantiationService;
            this.notificationService = notificationService;
            this.extensionService = extensionService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.contextMenuService = contextMenuService;
        }
        get templateId() { return 'extension'; }
        renderTemplate(root) {
            const recommendationWidget = this.instantiationService.createInstance(extensionsWidgets_1.RecommendationWidget, (0, dom_1.append)(root, (0, dom_1.$)('.extension-bookmark-container')));
            const preReleaseWidget = this.instantiationService.createInstance(extensionsWidgets_1.PreReleaseBookmarkWidget, (0, dom_1.append)(root, (0, dom_1.$)('.extension-bookmark-container')));
            const element = (0, dom_1.append)(root, (0, dom_1.$)('.extension-list-item'));
            const iconContainer = (0, dom_1.append)(element, (0, dom_1.$)('.icon-container'));
            const icon = (0, dom_1.append)(iconContainer, (0, dom_1.$)('img.icon'));
            const iconRemoteBadgeWidget = this.instantiationService.createInstance(extensionsWidgets_1.RemoteBadgeWidget, iconContainer, false);
            const extensionPackBadgeWidget = this.instantiationService.createInstance(extensionsWidgets_1.ExtensionPackCountWidget, iconContainer);
            const details = (0, dom_1.append)(element, (0, dom_1.$)('.details'));
            const headerContainer = (0, dom_1.append)(details, (0, dom_1.$)('.header-container'));
            const header = (0, dom_1.append)(headerContainer, (0, dom_1.$)('.header'));
            const name = (0, dom_1.append)(header, (0, dom_1.$)('span.name'));
            const installCount = (0, dom_1.append)(header, (0, dom_1.$)('span.install-count'));
            const ratings = (0, dom_1.append)(header, (0, dom_1.$)('span.ratings'));
            const syncIgnore = (0, dom_1.append)(header, (0, dom_1.$)('span.sync-ignored'));
            const activationStatus = (0, dom_1.append)(header, (0, dom_1.$)('span.activation-status'));
            const preRelease = (0, dom_1.append)(header, (0, dom_1.$)('span.pre-release'));
            const headerRemoteBadgeWidget = this.instantiationService.createInstance(extensionsWidgets_1.RemoteBadgeWidget, header, false);
            const description = (0, dom_1.append)(details, (0, dom_1.$)('.description.ellipsis'));
            const footer = (0, dom_1.append)(details, (0, dom_1.$)('.footer'));
            const publisher = (0, dom_1.append)(footer, (0, dom_1.$)('.author.ellipsis'));
            const verifiedPublisherIcon = (0, dom_1.append)(publisher, (0, dom_1.$)(`.publisher-verified${themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.verifiedPublisherIcon)}`));
            const publisherDisplayName = (0, dom_1.append)(publisher, (0, dom_1.$)('.publisher-name.ellipsis'));
            const actionbar = new actionbar_1.ActionBar(footer, {
                animated: false,
                actionViewItemProvider: (action) => {
                    if (action instanceof extensionsActions_1.ActionWithDropDownAction) {
                        return new extensionsActions_1.ExtensionActionWithDropdownActionViewItem(action, { icon: true, label: true, menuActionsOrProvider: { getActions: () => action.menuActions }, menuActionClassNames: (action.class || '').split(' ') }, this.contextMenuService);
                    }
                    if (action instanceof extensionsActions_1.ExtensionDropDownAction) {
                        return action.createActionViewItem();
                    }
                    return undefined;
                },
                focusOnlyEnabledItems: true
            });
            actionbar.setFocusable(false);
            actionbar.onDidRun(({ error }) => error && this.notificationService.error(error));
            const extensionStatusIconAction = this.instantiationService.createInstance(extensionsActions_1.ExtensionStatusAction);
            const reloadAction = this.instantiationService.createInstance(extensionsActions_1.ReloadAction);
            const actions = [
                this.instantiationService.createInstance(extensionsActions_1.ExtensionStatusLabelAction),
                this.instantiationService.createInstance(extensionsActions_1.UpdateAction),
                reloadAction,
                this.instantiationService.createInstance(extensionsActions_1.InstallDropdownAction),
                this.instantiationService.createInstance(extensionsActions_1.InstallingLabelAction),
                this.instantiationService.createInstance(extensionsActions_1.RemoteInstallAction, false),
                this.instantiationService.createInstance(extensionsActions_1.LocalInstallAction),
                this.instantiationService.createInstance(extensionsActions_1.WebInstallAction),
                extensionStatusIconAction,
                this.instantiationService.createInstance(extensionsActions_1.ManageExtensionAction)
            ];
            const extensionHoverWidget = this.instantiationService.createInstance(extensionsWidgets_1.ExtensionHoverWidget, { target: root, position: this.options.hoverOptions.position }, extensionStatusIconAction, reloadAction);
            const widgets = [
                recommendationWidget,
                preReleaseWidget,
                iconRemoteBadgeWidget,
                extensionPackBadgeWidget,
                headerRemoteBadgeWidget,
                extensionHoverWidget,
                this.instantiationService.createInstance(extensionsWidgets_1.RunningPreReleaseVersionIndicatorWidget, preRelease),
                this.instantiationService.createInstance(extensionsWidgets_1.SyncIgnoredWidget, syncIgnore),
                this.instantiationService.createInstance(extensionsWidgets_1.ExtensionActivationStatusWidget, activationStatus, true),
                this.instantiationService.createInstance(extensionsWidgets_1.InstallCountWidget, installCount, true),
                this.instantiationService.createInstance(extensionsWidgets_1.RatingsWidget, ratings, true),
            ];
            const extensionContainers = this.instantiationService.createInstance(extensions_1.ExtensionContainers, [...actions, ...widgets]);
            actionbar.push(actions, { icon: true, label: true });
            const disposable = (0, lifecycle_1.combinedDisposable)(...actions, ...widgets, actionbar, extensionContainers);
            return {
                root, element, icon, name, installCount, ratings, description, publisherDisplayName, verifiedPublisherIcon, disposables: [disposable], actionbar,
                extensionDisposables: [],
                set extension(extension) {
                    extensionContainers.extension = extension;
                }
            };
        }
        renderPlaceholder(index, data) {
            data.element.classList.add('loading');
            data.root.removeAttribute('aria-label');
            data.root.removeAttribute('data-extension-id');
            data.extensionDisposables = (0, lifecycle_1.dispose)(data.extensionDisposables);
            data.icon.src = '';
            data.name.textContent = '';
            data.description.textContent = '';
            data.publisherDisplayName.textContent = '';
            data.verifiedPublisherIcon.style.display = 'none';
            data.installCount.style.display = 'none';
            data.ratings.style.display = 'none';
            data.extension = null;
        }
        renderElement(extension, index, data) {
            var _a;
            data.element.classList.remove('loading');
            data.root.setAttribute('data-extension-id', extension.identifier.id);
            if (extension.state !== 3 /* ExtensionState.Uninstalled */ && !extension.server) {
                // Get the extension if it is installed and has no server information
                extension = this.extensionsWorkbenchService.local.filter(e => e.server === extension.server && (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier))[0] || extension;
            }
            data.extensionDisposables = (0, lifecycle_1.dispose)(data.extensionDisposables);
            const updateEnablement = async () => {
                let isDisabled = false;
                if (extension.state === 3 /* ExtensionState.Uninstalled */) {
                    isDisabled = !(await this.extensionsWorkbenchService.canInstall(extension));
                }
                else if (extension.local && !(0, extensions_3.isLanguagePackExtension)(extension.local.manifest)) {
                    const runningExtensions = await this.extensionService.getExtensions();
                    const runningExtension = runningExtensions.filter(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, extension.identifier))[0];
                    isDisabled = !(runningExtension && extension.server === this.extensionManagementServerService.getExtensionManagementServer((0, extensions_2.toExtension)(runningExtension)));
                }
                data.root.classList.toggle('disabled', isDisabled);
            };
            updateEnablement();
            this.extensionService.onDidChangeExtensions(() => updateEnablement(), this, data.extensionDisposables);
            data.extensionDisposables.push((0, dom_1.addDisposableListener)(data.icon, 'error', () => data.icon.src = extension.iconUrlFallback, { once: true }));
            data.icon.src = extension.iconUrl;
            if (!data.icon.complete) {
                data.icon.style.visibility = 'hidden';
                data.icon.onload = () => data.icon.style.visibility = 'inherit';
            }
            else {
                data.icon.style.visibility = 'inherit';
            }
            data.name.textContent = extension.displayName;
            data.description.textContent = extension.description;
            data.publisherDisplayName.textContent = extension.publisherDisplayName;
            data.verifiedPublisherIcon.style.display = ((_a = extension.publisherDomain) === null || _a === void 0 ? void 0 : _a.verified) ? 'inherit' : 'none';
            data.installCount.style.display = '';
            data.ratings.style.display = '';
            data.extension = extension;
            if (extension.gallery && extension.gallery.properties && extension.gallery.properties.localizedLanguages && extension.gallery.properties.localizedLanguages.length) {
                data.description.textContent = extension.gallery.properties.localizedLanguages.map(name => name[0].toLocaleUpperCase() + name.slice(1)).join(', ');
            }
            this.extensionViewState.onFocus(e => {
                if ((0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, e.identifier)) {
                    data.actionbar.setFocusable(true);
                }
            }, this, data.extensionDisposables);
            this.extensionViewState.onBlur(e => {
                if ((0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, e.identifier)) {
                    data.actionbar.setFocusable(false);
                }
            }, this, data.extensionDisposables);
        }
        disposeElement(extension, index, data) {
            data.extensionDisposables = (0, lifecycle_1.dispose)(data.extensionDisposables);
        }
        disposeTemplate(data) {
            data.extensionDisposables = (0, lifecycle_1.dispose)(data.extensionDisposables);
            data.disposables = (0, lifecycle_1.dispose)(data.disposables);
        }
    };
    Renderer = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, notification_1.INotificationService),
        __param(4, extensions_2.IExtensionService),
        __param(5, extensionManagement_1.IExtensionManagementServerService),
        __param(6, extensions_1.IExtensionsWorkbenchService),
        __param(7, contextView_1.IContextMenuService)
    ], Renderer);
    exports.Renderer = Renderer;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const foregroundColor = theme.getColor(colorRegistry_1.foreground);
        if (foregroundColor) {
            const authorForeground = foregroundColor.transparent(.9).makeOpaque((0, theme_1.WORKBENCH_BACKGROUND)(theme));
            collector.addRule(`.extensions-list .monaco-list .monaco-list-row:not(.disabled) .author { color: ${authorForeground}; }`);
            const disabledExtensionForeground = foregroundColor.transparent(.5).makeOpaque((0, theme_1.WORKBENCH_BACKGROUND)(theme));
            collector.addRule(`.extensions-list .monaco-list .monaco-list-row.disabled { color: ${disabledExtensionForeground}; }`);
        }
        const listActiveSelectionForegroundColor = theme.getColor(colorRegistry_1.listActiveSelectionForeground);
        if (listActiveSelectionForegroundColor) {
            const backgroundColor = theme.getColor(colorRegistry_1.listActiveSelectionBackground) || (0, theme_1.WORKBENCH_BACKGROUND)(theme);
            const authorForeground = listActiveSelectionForegroundColor.transparent(.9).makeOpaque(backgroundColor);
            collector.addRule(`.extensions-list .monaco-list:focus .monaco-list-row:not(.disabled).focused.selected .author { color: ${authorForeground}; }`);
            collector.addRule(`.extensions-list .monaco-list:focus .monaco-list-row:not(.disabled).selected .author { color: ${authorForeground}; }`);
            const disabledExtensionForeground = listActiveSelectionForegroundColor.transparent(.5).makeOpaque(backgroundColor);
            collector.addRule(`.extensions-list .monaco-list:focus .monaco-list-row.disabled.focused.selected { color: ${disabledExtensionForeground}; }`);
            collector.addRule(`.extensions-list .monaco-list:focus .monaco-list-row.disabled.selected { color: ${disabledExtensionForeground}; }`);
        }
        const listInactiveSelectionForegroundColor = theme.getColor(colorRegistry_1.listInactiveSelectionForeground);
        if (listInactiveSelectionForegroundColor) {
            const backgroundColor = theme.getColor(colorRegistry_1.listInactiveSelectionBackground) || (0, theme_1.WORKBENCH_BACKGROUND)(theme);
            const authorForeground = listInactiveSelectionForegroundColor.transparent(.9).makeOpaque(backgroundColor);
            collector.addRule(`.extensions-list .monaco-list .monaco-list-row:not(.disabled).selected .author { color: ${authorForeground}; }`);
            const disabledExtensionForeground = listInactiveSelectionForegroundColor.transparent(.5).makeOpaque(backgroundColor);
            collector.addRule(`.extensions-list .monaco-list .monaco-list-row.disabled.selected { color: ${disabledExtensionForeground}; }`);
        }
        const listFocusForegroundColor = theme.getColor(colorRegistry_1.listFocusForeground);
        if (listFocusForegroundColor) {
            const backgroundColor = theme.getColor(colorRegistry_1.listFocusBackground) || (0, theme_1.WORKBENCH_BACKGROUND)(theme);
            const authorForeground = listFocusForegroundColor.transparent(.9).makeOpaque(backgroundColor);
            collector.addRule(`.extensions-list .monaco-list:focus .monaco-list-row:not(.disabled).focused .author { color: ${authorForeground}; }`);
            const disabledExtensionForeground = listFocusForegroundColor.transparent(.5).makeOpaque(backgroundColor);
            collector.addRule(`.extensions-list .monaco-list:focus .monaco-list-row.disabled.focused { color: ${disabledExtensionForeground}; }`);
        }
        const listHoverForegroundColor = theme.getColor(colorRegistry_1.listHoverForeground);
        if (listHoverForegroundColor) {
            const backgroundColor = theme.getColor(colorRegistry_1.listHoverBackground) || (0, theme_1.WORKBENCH_BACKGROUND)(theme);
            const authorForeground = listHoverForegroundColor.transparent(.9).makeOpaque(backgroundColor);
            collector.addRule(`.extensions-list .monaco-list .monaco-list-row:hover:not(.disabled):not(.selected):.not(.focused) .author { color: ${authorForeground}; }`);
            const disabledExtensionForeground = listHoverForegroundColor.transparent(.5).makeOpaque(backgroundColor);
            collector.addRule(`.extensions-list .monaco-list .monaco-list-row.disabled:hover:not(.selected):.not(.focused) { color: ${disabledExtensionForeground}; }`);
        }
        const verifiedPublisherIconColor = theme.getColor(extensionsWidgets_1.extensionVerifiedPublisherIconColor);
        if (verifiedPublisherIconColor) {
            const disabledVerifiedPublisherIconColor = verifiedPublisherIconColor.transparent(.5).makeOpaque((0, theme_1.WORKBENCH_BACKGROUND)(theme));
            collector.addRule(`.extensions-list .monaco-list .monaco-list-row.disabled .author .publisher-verified${themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.verifiedPublisherIcon)} { color: ${disabledVerifiedPublisherIconColor}; }`);
        }
    });
});
//# sourceMappingURL=extensionsList.js.map