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
define(["require", "exports", "vs/nls", "vs/base/common/arrays", "vs/base/common/platform", "vs/base/common/event", "vs/base/common/cache", "vs/base/common/actions", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/workbench/browser/parts/editor/editorPane", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/browser/extensionsWidgets", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/platform/keybinding/common/keybinding", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/platform/opener/common/opener", "vs/platform/theme/common/themeService", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/editor/common/editorService", "vs/base/common/color", "vs/platform/notification/common/notification", "vs/base/common/cancellation", "vs/workbench/contrib/extensions/browser/extensionsViewer", "vs/workbench/contrib/update/common/update", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/types", "vs/workbench/contrib/webview/browser/webview", "vs/base/browser/keyboardEvent", "vs/base/common/uuid", "vs/base/common/process", "vs/base/common/uri", "vs/base/common/network", "vs/workbench/contrib/markdown/browser/markdownDocumentRenderer", "vs/editor/common/languages/language", "vs/editor/common/languages", "vs/editor/common/languages/supports/tokenization", "vs/platform/theme/common/colorRegistry", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/editor/common/editorContextKeys", "vs/workbench/contrib/extensions/browser/extensionsList", "vs/base/browser/markdownRenderer", "vs/platform/theme/common/styler", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/base/common/htmlContent", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/platform/extensionManagement/common/extensionManagement", "vs/base/common/semver/semver", "vs/css!./media/extensionEditor"], function (require, exports, nls_1, arrays, platform_1, event_1, cache_1, actions_1, errors_1, lifecycle_1, dom_1, editorPane_1, telemetry_1, instantiation_1, extensionRecommendations_1, extensions_1, extensionsWidgets_1, actionbar_1, extensionsActions_1, keybinding_1, scrollableElement_1, opener_1, themeService_1, keybindingLabel_1, contextkey_1, editorService_1, color_1, notification_1, cancellation_1, extensionsViewer_1, update_1, storage_1, extensions_2, configurationRegistry_1, types_1, webview_1, keyboardEvent_1, uuid_1, process_1, uri_1, network_1, markdownDocumentRenderer_1, language_1, languages_1, tokenization_1, colorRegistry_1, actions_2, contextView_1, editorContextKeys_1, extensionsList_1, markdownRenderer_1, styler_1, extensionManagementUtil_1, extensionsIcons_1, htmlContent_1, panecomposite_1, extensionManagement_1, semver) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionEditor = void 0;
    class NavBar extends lifecycle_1.Disposable {
        constructor(container) {
            super();
            this._onChange = this._register(new event_1.Emitter());
            this._currentId = null;
            const element = (0, dom_1.append)(container, (0, dom_1.$)('.navbar'));
            this.actions = [];
            this.actionbar = this._register(new actionbar_1.ActionBar(element, { animated: false }));
        }
        get onChange() { return this._onChange.event; }
        get currentId() { return this._currentId; }
        push(id, label, tooltip) {
            const action = new actions_1.Action(id, label, undefined, true, () => this.update(id, true));
            action.tooltip = tooltip;
            this.actions.push(action);
            this.actionbar.push(action);
            if (this.actions.length === 1) {
                this.update(id);
            }
        }
        clear() {
            this.actions = (0, lifecycle_1.dispose)(this.actions);
            this.actionbar.clear();
        }
        switch(id) {
            const action = this.actions.find(action => action.id === id);
            if (action) {
                action.run();
                return true;
            }
            return false;
        }
        update(id, focus) {
            this._currentId = id;
            this._onChange.fire({ id, focus: !!focus });
            this.actions.forEach(a => a.checked = a.id === id);
        }
    }
    var WebviewIndex;
    (function (WebviewIndex) {
        WebviewIndex[WebviewIndex["Readme"] = 0] = "Readme";
        WebviewIndex[WebviewIndex["Changelog"] = 1] = "Changelog";
    })(WebviewIndex || (WebviewIndex = {}));
    const CONTEXT_SHOW_PRE_RELEASE_VERSION = new contextkey_1.RawContextKey('showPreReleaseVersion', false);
    class ExtensionWithDifferentGalleryVersionWidget extends extensionsWidgets_1.ExtensionWidget {
        constructor() {
            super(...arguments);
            this._gallery = null;
        }
        get gallery() { return this._gallery; }
        set gallery(gallery) {
            if (this.extension && gallery && !(0, extensionManagementUtil_1.areSameExtensions)(this.extension.identifier, gallery.identifier)) {
                return;
            }
            this._gallery = gallery;
            this.update();
        }
    }
    class VersionWidget extends ExtensionWithDifferentGalleryVersionWidget {
        constructor(container) {
            super();
            this.element = (0, dom_1.append)(container, (0, dom_1.$)('code.version', { title: (0, nls_1.localize)('extension version', "Extension Version") }));
            this.render();
        }
        render() {
            var _a, _b;
            if (!this.extension || !semver.valid(this.extension.version)) {
                return;
            }
            this.element.textContent = `v${(_b = (_a = this.gallery) === null || _a === void 0 ? void 0 : _a.version) !== null && _b !== void 0 ? _b : this.extension.version}`;
        }
    }
    class PreReleaseTextWidget extends ExtensionWithDifferentGalleryVersionWidget {
        constructor(container) {
            super();
            this.element = (0, dom_1.append)(container, (0, dom_1.$)('span.pre-release'));
            (0, dom_1.append)(this.element, (0, dom_1.$)('span' + themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.preReleaseIcon)));
            const textElement = (0, dom_1.append)(this.element, (0, dom_1.$)('span.pre-release-text'));
            textElement.textContent = (0, nls_1.localize)('preRelease', "Pre-Release");
            this.render();
        }
        render() {
            this.element.style.display = this.isPreReleaseVersion() ? 'inherit' : 'none';
        }
        isPreReleaseVersion() {
            var _a, _b;
            if (!this.extension) {
                return false;
            }
            if (this.gallery) {
                return this.gallery.properties.isPreReleaseVersion;
            }
            return !!(this.extension.state === 1 /* ExtensionState.Installed */ ? (_a = this.extension.local) === null || _a === void 0 ? void 0 : _a.isPreReleaseVersion : (_b = this.extension.gallery) === null || _b === void 0 ? void 0 : _b.properties.isPreReleaseVersion);
        }
    }
    let ExtensionEditor = class ExtensionEditor extends editorPane_1.EditorPane {
        constructor(telemetryService, instantiationService, paneCompositeService, extensionsWorkbenchService, extensionGalleryService, themeService, keybindingService, notificationService, openerService, extensionRecommendationsService, extensionIgnoredRecommendationsService, storageService, extensionService, webviewService, languageService, contextMenuService, contextKeyService) {
            super(ExtensionEditor.ID, telemetryService, themeService, storageService);
            this.instantiationService = instantiationService;
            this.paneCompositeService = paneCompositeService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionGalleryService = extensionGalleryService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.openerService = openerService;
            this.extensionRecommendationsService = extensionRecommendationsService;
            this.extensionIgnoredRecommendationsService = extensionIgnoredRecommendationsService;
            this.extensionService = extensionService;
            this.webviewService = webviewService;
            this.languageService = languageService;
            this.contextMenuService = contextMenuService;
            this.contextKeyService = contextKeyService;
            this._scopedContextKeyService = this._register(new lifecycle_1.MutableDisposable());
            // Some action bar items use a webview whose vertical scroll position we track in this map
            this.initialScrollProgress = new Map();
            // Spot when an ExtensionEditor instance gets reused for a different extension, in which case the vertical scroll positions must be zeroed
            this.currentIdentifier = '';
            this.layoutParticipants = [];
            this.contentDisposables = this._register(new lifecycle_1.DisposableStore());
            this.transientDisposables = this._register(new lifecycle_1.DisposableStore());
            this.activeElement = null;
            this.extensionReadme = null;
            this.extensionChangelog = null;
            this.extensionManifest = null;
        }
        get scopedContextKeyService() {
            return this._scopedContextKeyService.value;
        }
        createEditor(parent) {
            const root = (0, dom_1.append)(parent, (0, dom_1.$)('.extension-editor'));
            this._scopedContextKeyService.value = this.contextKeyService.createScoped(root);
            this._scopedContextKeyService.value.createKey('inExtensionEditor', true);
            this.showPreReleaseVersionContextKey = CONTEXT_SHOW_PRE_RELEASE_VERSION.bindTo(this._scopedContextKeyService.value);
            root.tabIndex = 0; // this is required for the focus tracker on the editor
            root.style.outline = 'none';
            root.setAttribute('role', 'document');
            const header = (0, dom_1.append)(root, (0, dom_1.$)('.header'));
            const iconContainer = (0, dom_1.append)(header, (0, dom_1.$)('.icon-container'));
            const icon = (0, dom_1.append)(iconContainer, (0, dom_1.$)('img.icon', { draggable: false }));
            const remoteBadge = this.instantiationService.createInstance(extensionsWidgets_1.RemoteBadgeWidget, iconContainer, true);
            const details = (0, dom_1.append)(header, (0, dom_1.$)('.details'));
            const title = (0, dom_1.append)(details, (0, dom_1.$)('.title'));
            const name = (0, dom_1.append)(title, (0, dom_1.$)('span.name.clickable', { title: (0, nls_1.localize)('name', "Extension name"), role: 'heading', tabIndex: 0 }));
            const versionWidget = new VersionWidget(title);
            const preReleaseWidget = new PreReleaseTextWidget(title);
            const preview = (0, dom_1.append)(title, (0, dom_1.$)('span.preview', { title: (0, nls_1.localize)('preview', "Preview") }));
            preview.textContent = (0, nls_1.localize)('preview', "Preview");
            const builtin = (0, dom_1.append)(title, (0, dom_1.$)('span.builtin'));
            builtin.textContent = (0, nls_1.localize)('builtin', "Built-in");
            const subtitle = (0, dom_1.append)(details, (0, dom_1.$)('.subtitle'));
            const publisher = (0, dom_1.append)((0, dom_1.append)(subtitle, (0, dom_1.$)('.subtitle-entry')), (0, dom_1.$)('.publisher.clickable', { title: (0, nls_1.localize)('publisher', "Publisher"), tabIndex: 0 }));
            publisher.setAttribute('role', 'button');
            const verifiedPublisherIcon = (0, dom_1.append)(publisher, (0, dom_1.$)(`.publisher-verified${themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.verifiedPublisherIcon)}`));
            const publisherDisplayName = (0, dom_1.append)(publisher, (0, dom_1.$)('.publisher-name'));
            const installCount = (0, dom_1.append)((0, dom_1.append)(subtitle, (0, dom_1.$)('.subtitle-entry')), (0, dom_1.$)('span.install', { title: (0, nls_1.localize)('install count', "Install count"), tabIndex: 0 }));
            const installCountWidget = this.instantiationService.createInstance(extensionsWidgets_1.InstallCountWidget, installCount, false);
            const rating = (0, dom_1.append)((0, dom_1.append)(subtitle, (0, dom_1.$)('.subtitle-entry')), (0, dom_1.$)('span.rating.clickable', { title: (0, nls_1.localize)('rating', "Rating"), tabIndex: 0 }));
            rating.setAttribute('role', 'link'); // #132645
            const ratingsWidget = this.instantiationService.createInstance(extensionsWidgets_1.RatingsWidget, rating, false);
            const widgets = [
                remoteBadge,
                versionWidget,
                preReleaseWidget,
                installCountWidget,
                ratingsWidget,
            ];
            const description = (0, dom_1.append)(details, (0, dom_1.$)('.description'));
            const installAction = this.instantiationService.createInstance(extensionsActions_1.InstallDropdownAction);
            const actions = [
                this.instantiationService.createInstance(extensionsActions_1.ReloadAction),
                this.instantiationService.createInstance(extensionsActions_1.ExtensionStatusLabelAction),
                this.instantiationService.createInstance(extensionsActions_1.UpdateAction),
                this.instantiationService.createInstance(extensionsActions_1.SetColorThemeAction),
                this.instantiationService.createInstance(extensionsActions_1.SetFileIconThemeAction),
                this.instantiationService.createInstance(extensionsActions_1.SetProductIconThemeAction),
                this.instantiationService.createInstance(extensionsActions_1.EnableDropDownAction),
                this.instantiationService.createInstance(extensionsActions_1.DisableDropDownAction),
                this.instantiationService.createInstance(extensionsActions_1.RemoteInstallAction, false),
                this.instantiationService.createInstance(extensionsActions_1.LocalInstallAction),
                this.instantiationService.createInstance(extensionsActions_1.WebInstallAction),
                installAction,
                this.instantiationService.createInstance(extensionsActions_1.InstallingLabelAction),
                this.instantiationService.createInstance(extensionsActions_1.ActionWithDropDownAction, 'extensions.uninstall', extensionsActions_1.UninstallAction.UninstallLabel, [
                    [
                        this.instantiationService.createInstance(extensionsActions_1.UninstallAction),
                        this.instantiationService.createInstance(extensionsActions_1.InstallAnotherVersionAction),
                    ]
                ]),
                this.instantiationService.createInstance(extensionsActions_1.SwitchToPreReleaseVersionAction),
                this.instantiationService.createInstance(extensionsActions_1.SwitchToReleasedVersionAction),
                this.instantiationService.createInstance(extensionsActions_1.ToggleSyncExtensionAction),
                new extensionsActions_1.ExtensionEditorManageExtensionAction(this.scopedContextKeyService || this.contextKeyService, this.instantiationService),
            ];
            const actionsAndStatusContainer = (0, dom_1.append)(details, (0, dom_1.$)('.actions-status-container'));
            const extensionActionBar = this._register(new actionbar_1.ActionBar(actionsAndStatusContainer, {
                animated: false,
                actionViewItemProvider: (action) => {
                    if (action instanceof extensionsActions_1.ExtensionDropDownAction) {
                        return action.createActionViewItem();
                    }
                    if (action instanceof extensionsActions_1.ActionWithDropDownAction) {
                        return new extensionsActions_1.ExtensionActionWithDropdownActionViewItem(action, { icon: true, label: true, menuActionsOrProvider: { getActions: () => action.menuActions }, menuActionClassNames: (action.class || '').split(' ') }, this.contextMenuService);
                    }
                    return undefined;
                },
                focusOnlyEnabledItems: true
            }));
            extensionActionBar.push(actions, { icon: true, label: true });
            extensionActionBar.setFocusable(true);
            // update focusable elements when the enablement of an action changes
            this._register(event_1.Event.any(...actions.map(a => event_1.Event.filter(a.onDidChange, e => e.enabled !== undefined)))(() => {
                extensionActionBar.setFocusable(false);
                extensionActionBar.setFocusable(true);
            }));
            const extensionContainers = this.instantiationService.createInstance(extensions_1.ExtensionContainers, [...actions, ...widgets]);
            for (const disposable of [...actions, ...widgets, extensionContainers]) {
                this._register(disposable);
            }
            const status = (0, dom_1.append)(actionsAndStatusContainer, (0, dom_1.$)('.status'));
            const recommendation = (0, dom_1.append)(details, (0, dom_1.$)('.recommendation'));
            this._register(event_1.Event.chain(extensionActionBar.onDidRun)
                .map(({ error }) => error)
                .filter(error => !!error)
                .on(this.onError, this));
            const body = (0, dom_1.append)(root, (0, dom_1.$)('.body'));
            const navbar = new NavBar(body);
            const content = (0, dom_1.append)(body, (0, dom_1.$)('.content'));
            content.id = (0, uuid_1.generateUuid)(); // An id is needed for the webview parent flow to
            this.template = {
                builtin,
                content,
                description,
                header,
                icon,
                iconContainer,
                installCount,
                name,
                navbar,
                preview,
                publisher,
                publisherDisplayName,
                verifiedPublisherIcon,
                rating,
                actionsAndStatusContainer,
                extensionActionBar,
                status,
                recommendation,
                set extension(extension) {
                    extensionContainers.extension = extension;
                },
                set gallery(gallery) {
                    versionWidget.gallery = gallery;
                    preReleaseWidget.gallery = gallery;
                },
                set manifest(manifest) {
                    installAction.manifest = manifest;
                }
            };
        }
        onClick(element, callback) {
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add((0, dom_1.addDisposableListener)(element, dom_1.EventType.CLICK, (0, dom_1.finalHandler)(callback)));
            disposables.add((0, dom_1.addDisposableListener)(element, dom_1.EventType.KEY_UP, e => {
                const keyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (keyboardEvent.equals(10 /* KeyCode.Space */) || keyboardEvent.equals(3 /* KeyCode.Enter */)) {
                    e.preventDefault();
                    e.stopPropagation();
                    callback();
                }
            }));
            return disposables;
        }
        async setInput(input, options, context, token) {
            await super.setInput(input, options, context, token);
            this.updatePreReleaseVersionContext();
            if (this.template) {
                this.render(input.extension, this.template, !!(options === null || options === void 0 ? void 0 : options.preserveFocus));
            }
        }
        setOptions(options) {
            const currentOptions = this.options;
            super.setOptions(options);
            this.updatePreReleaseVersionContext();
            if (this.input && this.template && (currentOptions === null || currentOptions === void 0 ? void 0 : currentOptions.showPreReleaseVersion) !== (options === null || options === void 0 ? void 0 : options.showPreReleaseVersion)) {
                this.render(this.input.extension, this.template, !!(options === null || options === void 0 ? void 0 : options.preserveFocus));
            }
        }
        updatePreReleaseVersionContext() {
            var _a, _b, _c;
            let showPreReleaseVersion = (_a = this.options) === null || _a === void 0 ? void 0 : _a.showPreReleaseVersion;
            if ((0, types_1.isUndefined)(showPreReleaseVersion)) {
                showPreReleaseVersion = !!((_b = this.input.extension.gallery) === null || _b === void 0 ? void 0 : _b.properties.isPreReleaseVersion);
            }
            (_c = this.showPreReleaseVersionContextKey) === null || _c === void 0 ? void 0 : _c.set(showPreReleaseVersion);
        }
        async openTab(tab) {
            if (!this.input || !this.template) {
                return;
            }
            if (this.template.navbar.switch(tab)) {
                return;
            }
            // Fallback to Readme tab if ExtensionPack tab does not exist
            if (tab === "extensionPack" /* ExtensionEditorTab.ExtensionPack */) {
                this.template.navbar.switch("readme" /* ExtensionEditorTab.Readme */);
            }
        }
        async getGalleryVersionToShow(extension, preRelease) {
            var _a;
            if ((0, types_1.isUndefined)(preRelease)) {
                return null;
            }
            if (preRelease === ((_a = extension.gallery) === null || _a === void 0 ? void 0 : _a.properties.isPreReleaseVersion)) {
                return null;
            }
            if (preRelease && !extension.hasPreReleaseVersion) {
                return null;
            }
            if (!preRelease && !extension.hasReleaseVersion) {
                return null;
            }
            return (await this.extensionGalleryService.getExtensions([Object.assign(Object.assign({}, extension.identifier), { preRelease, hasPreRelease: extension.hasPreReleaseVersion })], cancellation_1.CancellationToken.None))[0] || null;
        }
        async render(extension, template, preserveFocus) {
            var _a, _b, _c, _d, _e;
            this.activeElement = null;
            this.transientDisposables.clear();
            const token = this.transientDisposables.add(new cancellation_1.CancellationTokenSource()).token;
            const gallery = await this.getGalleryVersionToShow(extension, (_a = this.options) === null || _a === void 0 ? void 0 : _a.showPreReleaseVersion);
            if (token.isCancellationRequested) {
                return;
            }
            this.extensionReadme = new cache_1.Cache(() => gallery ? this.extensionGalleryService.getReadme(gallery, token) : extension.getReadme(token));
            this.extensionChangelog = new cache_1.Cache(() => gallery ? this.extensionGalleryService.getChangelog(gallery, token) : extension.getChangelog(token));
            this.extensionManifest = new cache_1.Cache(() => gallery ? this.extensionGalleryService.getManifest(gallery, token) : extension.getManifest(token));
            template.extension = extension;
            template.gallery = gallery;
            template.manifest = null;
            this.transientDisposables.add((0, dom_1.addDisposableListener)(template.icon, 'error', () => template.icon.src = extension.iconUrlFallback, { once: true }));
            template.icon.src = extension.iconUrl;
            template.name.textContent = extension.displayName;
            template.name.classList.toggle('clickable', !!extension.url);
            template.preview.style.display = extension.preview ? 'inherit' : 'none';
            template.builtin.style.display = extension.isBuiltin ? 'inherit' : 'none';
            template.description.textContent = extension.description;
            // subtitle
            template.publisher.classList.toggle('clickable', !!extension.url);
            template.publisherDisplayName.textContent = extension.publisherDisplayName;
            template.verifiedPublisherIcon.style.display = ((_b = extension.publisherDomain) === null || _b === void 0 ? void 0 : _b.verified) ? 'inherit' : 'none';
            template.publisher.title = ((_c = extension.publisherDomain) === null || _c === void 0 ? void 0 : _c.verified) && extension.publisherDomain.link ? (0, nls_1.localize)('publisher verified tooltip', "This publisher has verified ownership of {0}", uri_1.URI.parse(extension.publisherDomain.link).authority) : '';
            (_d = template.installCount.parentElement) === null || _d === void 0 ? void 0 : _d.classList.toggle('hide', !extension.url);
            (_e = template.rating.parentElement) === null || _e === void 0 ? void 0 : _e.classList.toggle('hide', !extension.url);
            template.rating.classList.toggle('clickable', !!extension.url);
            if (extension.url) {
                this.transientDisposables.add(this.onClick(template.name, () => this.openerService.open(uri_1.URI.parse(extension.url))));
                this.transientDisposables.add(this.onClick(template.rating, () => this.openerService.open(uri_1.URI.parse(`${extension.url}&ssr=false#review-details`))));
                this.transientDisposables.add(this.onClick(template.publisher, () => {
                    this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true)
                        .then(viewlet => viewlet === null || viewlet === void 0 ? void 0 : viewlet.getViewPaneContainer())
                        .then(viewlet => viewlet.search(`publisher:"${extension.publisherDisplayName}"`));
                }));
            }
            this.setStatus(extension, template);
            this.setRecommendationText(extension, template);
            const manifest = await this.extensionManifest.get().promise;
            if (token.isCancellationRequested) {
                return;
            }
            if (manifest) {
                template.manifest = manifest;
            }
            this.renderNavbar(extension, manifest, template, preserveFocus);
            // report telemetry
            const extRecommendations = this.extensionRecommendationsService.getAllRecommendationsWithReason();
            let recommendationsData = {};
            if (extRecommendations[extension.identifier.id.toLowerCase()]) {
                recommendationsData = { recommendationReason: extRecommendations[extension.identifier.id.toLowerCase()].reasonId };
            }
            /* __GDPR__
            "extensionGallery:openExtension" : {
                "recommendationReason": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "${include}": [
                    "${GalleryExtensionTelemetryData}"
                ]
            }
            */
            this.telemetryService.publicLog('extensionGallery:openExtension', Object.assign(Object.assign({}, extension.telemetryData), recommendationsData));
        }
        renderNavbar(extension, manifest, template, preserveFocus) {
            var _a;
            template.content.innerText = '';
            template.navbar.clear();
            if (this.currentIdentifier !== extension.identifier.id) {
                this.initialScrollProgress.clear();
                this.currentIdentifier = extension.identifier.id;
            }
            if (extension.hasReadme()) {
                template.navbar.push("readme" /* ExtensionEditorTab.Readme */, (0, nls_1.localize)('details', "Details"), (0, nls_1.localize)('detailstooltip', "Extension details, rendered from the extension's 'README.md' file"));
            }
            if (manifest && manifest.contributes) {
                template.navbar.push("contributions" /* ExtensionEditorTab.Contributions */, (0, nls_1.localize)('contributions', "Feature Contributions"), (0, nls_1.localize)('contributionstooltip', "Lists contributions to VS Code by this extension"));
            }
            if (extension.hasChangelog()) {
                template.navbar.push("changelog" /* ExtensionEditorTab.Changelog */, (0, nls_1.localize)('changelog', "Changelog"), (0, nls_1.localize)('changelogtooltip', "Extension update history, rendered from the extension's 'CHANGELOG.md' file"));
            }
            if (extension.dependencies.length) {
                template.navbar.push("dependencies" /* ExtensionEditorTab.Dependencies */, (0, nls_1.localize)('dependencies', "Dependencies"), (0, nls_1.localize)('dependenciestooltip', "Lists extensions this extension depends on"));
            }
            if (manifest && ((_a = manifest.extensionPack) === null || _a === void 0 ? void 0 : _a.length) && !this.shallRenderAsExensionPack(manifest)) {
                template.navbar.push("extensionPack" /* ExtensionEditorTab.ExtensionPack */, (0, nls_1.localize)('extensionpack', "Extension Pack"), (0, nls_1.localize)('extensionpacktooltip', "Lists extensions those will be installed together with this extension"));
            }
            const addRuntimeStatusSection = () => template.navbar.push("runtimeStatus" /* ExtensionEditorTab.RuntimeStatus */, (0, nls_1.localize)('runtimeStatus', "Runtime Status"), (0, nls_1.localize)('runtimeStatus description', "Extension runtime status"));
            if (this.extensionsWorkbenchService.getExtensionStatus(extension)) {
                addRuntimeStatusSection();
            }
            else {
                const disposable = this.extensionService.onDidChangeExtensionsStatus(e => {
                    if (e.some(extensionIdentifier => (0, extensionManagementUtil_1.areSameExtensions)({ id: extensionIdentifier.value }, extension.identifier))) {
                        addRuntimeStatusSection();
                        disposable.dispose();
                    }
                }, this, this.transientDisposables);
            }
            if (template.navbar.currentId) {
                this.onNavbarChange(extension, { id: template.navbar.currentId, focus: !preserveFocus }, template);
            }
            template.navbar.onChange(e => this.onNavbarChange(extension, e, template), this, this.transientDisposables);
        }
        setStatus(extension, template) {
            const disposables = this.transientDisposables.add(new lifecycle_1.DisposableStore());
            const extensionStatus = disposables.add(this.instantiationService.createInstance(extensionsActions_1.ExtensionStatusAction));
            extensionStatus.extension = extension;
            const updateStatus = (layout) => {
                disposables.clear();
                (0, dom_1.reset)(template.status);
                const status = extensionStatus.status;
                if (status) {
                    if (status.icon) {
                        const statusIconActionBar = disposables.add(new actionbar_1.ActionBar(template.status, { animated: false }));
                        statusIconActionBar.push(extensionStatus, { icon: true, label: false });
                    }
                    disposables.add(this.renderMarkdownText(status.message.value, (0, dom_1.append)(template.status, (0, dom_1.$)('.status-text'))));
                }
                if (layout && this.dimension) {
                    this.layout(this.dimension);
                }
            };
            updateStatus(false);
            this.transientDisposables.add(extensionStatus.onDidChangeStatus(() => updateStatus(true)));
            const updateActionLayout = () => template.actionsAndStatusContainer.classList.toggle('list-layout', extension.state === 1 /* ExtensionState.Installed */);
            updateActionLayout();
            this.transientDisposables.add(this.extensionsWorkbenchService.onChange(() => updateActionLayout()));
        }
        setRecommendationText(extension, template) {
            const updateRecommendationText = (layout) => {
                const extRecommendations = this.extensionRecommendationsService.getAllRecommendationsWithReason();
                if (extRecommendations[extension.identifier.id.toLowerCase()]) {
                    const reasonText = extRecommendations[extension.identifier.id.toLowerCase()].reasonText;
                    if (reasonText) {
                        (0, dom_1.append)(template.recommendation, (0, dom_1.$)(`div${themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.starEmptyIcon)}`));
                        (0, dom_1.append)(template.recommendation, (0, dom_1.$)(`div.recommendation-text`, undefined, reasonText));
                    }
                }
                else if (this.extensionIgnoredRecommendationsService.globalIgnoredRecommendations.indexOf(extension.identifier.id.toLowerCase()) !== -1) {
                    (0, dom_1.append)(template.recommendation, (0, dom_1.$)(`div.recommendation-text`, undefined, (0, nls_1.localize)('recommendationHasBeenIgnored', "You have chosen not to receive recommendations for this extension.")));
                }
                if (layout && this.dimension) {
                    this.layout(this.dimension);
                }
            };
            (0, dom_1.reset)(template.recommendation);
            if (extension.state === 1 /* ExtensionState.Installed */) {
                return;
            }
            updateRecommendationText(false);
            this.transientDisposables.add(this.extensionRecommendationsService.onDidChangeRecommendations(() => updateRecommendationText(true)));
        }
        renderMarkdownText(markdownText, parent) {
            const disposables = new lifecycle_1.DisposableStore();
            const rendered = disposables.add((0, markdownRenderer_1.renderMarkdown)(new htmlContent_1.MarkdownString(markdownText, { isTrusted: true, supportThemeIcons: true }), {
                actionHandler: {
                    callback: (content) => {
                        this.openerService.open(content, { allowCommands: true }).catch(errors_1.onUnexpectedError);
                    },
                    disposables: disposables
                }
            }));
            (0, dom_1.append)(parent, rendered.element);
            return disposables;
        }
        clearInput() {
            this.contentDisposables.clear();
            this.transientDisposables.clear();
            super.clearInput();
        }
        focus() {
            var _a;
            (_a = this.activeElement) === null || _a === void 0 ? void 0 : _a.focus();
        }
        showFind() {
            var _a;
            (_a = this.activeWebview) === null || _a === void 0 ? void 0 : _a.showFind();
        }
        runFindAction(previous) {
            var _a;
            (_a = this.activeWebview) === null || _a === void 0 ? void 0 : _a.runFindAction(previous);
        }
        get activeWebview() {
            if (!this.activeElement || !this.activeElement.runFindAction) {
                return undefined;
            }
            return this.activeElement;
        }
        onNavbarChange(extension, { id, focus }, template) {
            this.contentDisposables.clear();
            template.content.innerText = '';
            this.activeElement = null;
            if (id) {
                const cts = new cancellation_1.CancellationTokenSource();
                this.contentDisposables.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
                this.open(id, extension, template, cts.token)
                    .then(activeElement => {
                    if (cts.token.isCancellationRequested) {
                        return;
                    }
                    this.activeElement = activeElement;
                    if (focus) {
                        this.focus();
                    }
                });
            }
        }
        open(id, extension, template, token) {
            switch (id) {
                case "readme" /* ExtensionEditorTab.Readme */: return this.openDetails(extension, template, token);
                case "contributions" /* ExtensionEditorTab.Contributions */: return this.openContributions(template, token);
                case "changelog" /* ExtensionEditorTab.Changelog */: return this.openChangelog(template, token);
                case "dependencies" /* ExtensionEditorTab.Dependencies */: return this.openExtensionDependencies(extension, template, token);
                case "extensionPack" /* ExtensionEditorTab.ExtensionPack */: return this.openExtensionPack(extension, template, token);
                case "runtimeStatus" /* ExtensionEditorTab.RuntimeStatus */: return this.openRuntimeStatus(extension, template, token);
            }
            return Promise.resolve(null);
        }
        async openMarkdown(cacheResult, noContentCopy, container, webviewIndex, token) {
            try {
                const body = await this.renderMarkdown(cacheResult, container);
                if (token.isCancellationRequested) {
                    return Promise.resolve(null);
                }
                const webview = this.contentDisposables.add(this.webviewService.createWebviewOverlay((0, uuid_1.generateUuid)(), {
                    enableFindWidget: true,
                    tryRestoreScrollPosition: true,
                }, {}, undefined));
                webview.initialScrollProgress = this.initialScrollProgress.get(webviewIndex) || 0;
                webview.claim(this, this.scopedContextKeyService);
                (0, dom_1.setParentFlowTo)(webview.container, container);
                webview.layoutWebviewOverElement(container);
                webview.html = body;
                webview.claim(this, undefined);
                this.contentDisposables.add(webview.onDidFocus(() => this.fireOnDidFocus()));
                this.contentDisposables.add(webview.onDidScroll(() => this.initialScrollProgress.set(webviewIndex, webview.initialScrollProgress)));
                const removeLayoutParticipant = arrays.insert(this.layoutParticipants, {
                    layout: () => {
                        webview.layoutWebviewOverElement(container);
                    }
                });
                this.contentDisposables.add((0, lifecycle_1.toDisposable)(removeLayoutParticipant));
                let isDisposed = false;
                this.contentDisposables.add((0, lifecycle_1.toDisposable)(() => { isDisposed = true; }));
                this.contentDisposables.add(this.themeService.onDidColorThemeChange(async () => {
                    // Render again since syntax highlighting of code blocks may have changed
                    const body = await this.renderMarkdown(cacheResult, container);
                    if (!isDisposed) { // Make sure we weren't disposed of in the meantime
                        webview.html = body;
                    }
                }));
                this.contentDisposables.add(webview.onDidClickLink(link => {
                    if (!link) {
                        return;
                    }
                    // Only allow links with specific schemes
                    if ((0, opener_1.matchesScheme)(link, network_1.Schemas.http) || (0, opener_1.matchesScheme)(link, network_1.Schemas.https) || (0, opener_1.matchesScheme)(link, network_1.Schemas.mailto)) {
                        this.openerService.open(link);
                    }
                    if ((0, opener_1.matchesScheme)(link, network_1.Schemas.command) && uri_1.URI.parse(link).path === update_1.ShowCurrentReleaseNotesActionId) {
                        this.openerService.open(link, { allowCommands: true }); // TODO@sandy081 use commands service
                    }
                }));
                return webview;
            }
            catch (e) {
                const p = (0, dom_1.append)(container, (0, dom_1.$)('p.nocontent'));
                p.textContent = noContentCopy;
                return p;
            }
        }
        async renderMarkdown(cacheResult, container) {
            const contents = await this.loadContents(() => cacheResult, container);
            const content = await (0, markdownDocumentRenderer_1.renderMarkdownDocument)(contents, this.extensionService, this.languageService);
            return this.renderBody(content);
        }
        async renderBody(body) {
            const nonce = (0, uuid_1.generateUuid)();
            const colorMap = languages_1.TokenizationRegistry.getColorMap();
            const css = colorMap ? (0, tokenization_1.generateTokensCSSForColorMap)(colorMap) : '';
            return `<!DOCTYPE html>
		<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; media-src https:; script-src 'none'; style-src 'nonce-${nonce}';">
				<style nonce="${nonce}">
					${markdownDocumentRenderer_1.DEFAULT_MARKDOWN_STYLES}

					#scroll-to-top {
						position: fixed;
						width: 40px;
						height: 40px;
						right: 25px;
						bottom: 25px;
						background-color: var(--vscode-button-background);
						border-color: var(--vscode-button-border);
						border-radius: 50%;
						cursor: pointer;
						box-shadow: 1px 1px 1px rgba(0,0,0,.25);
						outline: none;
						display: flex;
						justify-content: center;
						align-items: center;
					}

					#scroll-to-top:hover {
						background-color: var(--vscode-button-hoverBackground);
						box-shadow: 2px 2px 2px rgba(0,0,0,.25);
					}

					body.vscode-high-contrast #scroll-to-top {
						border-width: 2px;
						border-style: solid;
						box-shadow: none;
					}

					#scroll-to-top span.icon::before {
						content: "";
						display: block;
						background: var(--vscode-button-foreground);
						/* Chevron up icon */
						webkit-mask-image: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAxNiAxNiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTYgMTY7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KCS5zdDB7ZmlsbDojRkZGRkZGO30KCS5zdDF7ZmlsbDpub25lO30KPC9zdHlsZT4KPHRpdGxlPnVwY2hldnJvbjwvdGl0bGU+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik04LDUuMWwtNy4zLDcuM0wwLDExLjZsOC04bDgsOGwtMC43LDAuN0w4LDUuMXoiLz4KPHJlY3QgY2xhc3M9InN0MSIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ii8+Cjwvc3ZnPgo=');
						-webkit-mask-image: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAxNiAxNiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTYgMTY7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KCS5zdDB7ZmlsbDojRkZGRkZGO30KCS5zdDF7ZmlsbDpub25lO30KPC9zdHlsZT4KPHRpdGxlPnVwY2hldnJvbjwvdGl0bGU+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik04LDUuMWwtNy4zLDcuM0wwLDExLjZsOC04bDgsOGwtMC43LDAuN0w4LDUuMXoiLz4KPHJlY3QgY2xhc3M9InN0MSIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ii8+Cjwvc3ZnPgo=');
						width: 16px;
						height: 16px;
					}
					${css}
				</style>
			</head>
			<body>
				<a id="scroll-to-top" role="button" aria-label="scroll to top" href="#"><span class="icon"></span></a>
				${body}
			</body>
		</html>`;
        }
        async openDetails(extension, template, token) {
            var _a;
            const details = (0, dom_1.append)(template.content, (0, dom_1.$)('.details'));
            const readmeContainer = (0, dom_1.append)(details, (0, dom_1.$)('.readme-container'));
            const additionalDetailsContainer = (0, dom_1.append)(details, (0, dom_1.$)('.additional-details-container'));
            const layout = () => details.classList.toggle('narrow', this.dimension && this.dimension.width < 500);
            layout();
            this.contentDisposables.add((0, lifecycle_1.toDisposable)(arrays.insert(this.layoutParticipants, { layout })));
            let activeElement = null;
            const manifest = await this.extensionManifest.get().promise;
            if (manifest && ((_a = manifest.extensionPack) === null || _a === void 0 ? void 0 : _a.length) && this.shallRenderAsExensionPack(manifest)) {
                activeElement = await this.openExtensionPackReadme(manifest, readmeContainer, token);
            }
            else {
                activeElement = await this.openMarkdown(this.extensionReadme.get(), (0, nls_1.localize)('noReadme', "No README available."), readmeContainer, 0 /* WebviewIndex.Readme */, token);
            }
            this.renderAdditionalDetails(additionalDetailsContainer, extension);
            return activeElement;
        }
        shallRenderAsExensionPack(manifest) {
            var _a;
            return !!((_a = manifest.categories) === null || _a === void 0 ? void 0 : _a.some(category => category.toLowerCase() === 'extension packs'));
        }
        async openExtensionPackReadme(manifest, container, token) {
            if (token.isCancellationRequested) {
                return Promise.resolve(null);
            }
            const extensionPackReadme = (0, dom_1.append)(container, (0, dom_1.$)('div', { class: 'extension-pack-readme' }));
            extensionPackReadme.style.margin = '0 auto';
            extensionPackReadme.style.maxWidth = '882px';
            const extensionPack = (0, dom_1.append)(extensionPackReadme, (0, dom_1.$)('div', { class: 'extension-pack' }));
            if (manifest.extensionPack.length <= 3) {
                extensionPackReadme.classList.add('one-row');
            }
            else if (manifest.extensionPack.length <= 6) {
                extensionPackReadme.classList.add('two-rows');
            }
            else if (manifest.extensionPack.length <= 9) {
                extensionPackReadme.classList.add('three-rows');
            }
            else {
                extensionPackReadme.classList.add('more-rows');
            }
            const extensionPackHeader = (0, dom_1.append)(extensionPack, (0, dom_1.$)('div.header'));
            extensionPackHeader.textContent = (0, nls_1.localize)('extension pack', "Extension Pack ({0})", manifest.extensionPack.length);
            const extensionPackContent = (0, dom_1.append)(extensionPack, (0, dom_1.$)('div', { class: 'extension-pack-content' }));
            extensionPackContent.setAttribute('tabindex', '0');
            (0, dom_1.append)(extensionPack, (0, dom_1.$)('div.footer'));
            const readmeContent = (0, dom_1.append)(extensionPackReadme, (0, dom_1.$)('div.readme-content'));
            await Promise.all([
                this.renderExtensionPack(manifest, extensionPackContent, token),
                this.openMarkdown(this.extensionReadme.get(), (0, nls_1.localize)('noReadme', "No README available."), readmeContent, 0 /* WebviewIndex.Readme */, token),
            ]);
            return { focus: () => extensionPackContent.focus() };
        }
        renderAdditionalDetails(container, extension) {
            const content = (0, dom_1.$)('div', { class: 'additional-details-content', tabindex: '0' });
            const scrollableContent = new scrollableElement_1.DomScrollableElement(content, {});
            const layout = () => scrollableContent.scanDomNode();
            const removeLayoutParticipant = arrays.insert(this.layoutParticipants, { layout });
            this.contentDisposables.add((0, lifecycle_1.toDisposable)(removeLayoutParticipant));
            this.contentDisposables.add(scrollableContent);
            this.renderCategories(content, extension);
            this.renderResources(content, extension);
            this.renderMoreInfo(content, extension);
            (0, dom_1.append)(container, scrollableContent.getDomNode());
            scrollableContent.scanDomNode();
        }
        renderCategories(container, extension) {
            if (extension.categories.length) {
                const categoriesContainer = (0, dom_1.append)(container, (0, dom_1.$)('.categories-container'));
                (0, dom_1.append)(categoriesContainer, (0, dom_1.$)('.additional-details-title', undefined, (0, nls_1.localize)('categories', "Categories")));
                const categoriesElement = (0, dom_1.append)(categoriesContainer, (0, dom_1.$)('.categories'));
                for (const category of extension.categories) {
                    this.transientDisposables.add(this.onClick((0, dom_1.append)(categoriesElement, (0, dom_1.$)('span.category', undefined, category)), () => {
                        this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true)
                            .then(viewlet => viewlet === null || viewlet === void 0 ? void 0 : viewlet.getViewPaneContainer())
                            .then(viewlet => viewlet.search(`@category:"${category}"`));
                    }));
                }
            }
        }
        renderResources(container, extension) {
            var _a;
            const resources = [];
            if (extension.url) {
                resources.push([(0, nls_1.localize)('Marketplace', "Marketplace"), uri_1.URI.parse(extension.url)]);
            }
            if (extension.repository) {
                resources.push([(0, nls_1.localize)('repository', "Repository"), uri_1.URI.parse(extension.repository)]);
            }
            if (extension.url && extension.licenseUrl) {
                resources.push([(0, nls_1.localize)('license', "License"), uri_1.URI.parse(extension.licenseUrl)]);
            }
            if ((_a = extension.publisherDomain) === null || _a === void 0 ? void 0 : _a.verified) {
                const publisherDomainUri = uri_1.URI.parse(extension.publisherDomain.link);
                resources.push([publisherDomainUri.authority, publisherDomainUri]);
            }
            if (resources.length) {
                const resourcesContainer = (0, dom_1.append)(container, (0, dom_1.$)('.resources-container'));
                (0, dom_1.append)(resourcesContainer, (0, dom_1.$)('.additional-details-title', undefined, (0, nls_1.localize)('resources', "Resources")));
                const resourcesElement = (0, dom_1.append)(resourcesContainer, (0, dom_1.$)('.resources'));
                for (const [label, uri] of resources) {
                    this.transientDisposables.add(this.onClick((0, dom_1.append)(resourcesElement, (0, dom_1.$)('a.resource', { title: uri.toString() }, label)), () => this.openerService.open(uri)));
                }
            }
        }
        renderMoreInfo(container, extension) {
            const gallery = extension.gallery;
            const moreInfoContainer = (0, dom_1.append)(container, (0, dom_1.$)('.more-info-container'));
            (0, dom_1.append)(moreInfoContainer, (0, dom_1.$)('.additional-details-title', undefined, (0, nls_1.localize)('Marketplace Info', "Marketplace Info")));
            const moreInfo = (0, dom_1.append)(moreInfoContainer, (0, dom_1.$)('.more-info'));
            if (gallery) {
                (0, dom_1.append)(moreInfo, (0, dom_1.$)('.more-info-entry', undefined, (0, dom_1.$)('div', undefined, (0, nls_1.localize)('release date', "Released on")), (0, dom_1.$)('div', undefined, new Date(gallery.releaseDate).toLocaleString(undefined, { hourCycle: 'h23' }))), (0, dom_1.$)('.more-info-entry', undefined, (0, dom_1.$)('div', undefined, (0, nls_1.localize)('last updated', "Last updated")), (0, dom_1.$)('div', undefined, new Date(gallery.lastUpdated).toLocaleString(undefined, { hourCycle: 'h23' }))));
            }
            (0, dom_1.append)(moreInfo, (0, dom_1.$)('.more-info-entry', undefined, (0, dom_1.$)('div', undefined, (0, nls_1.localize)('id', "Identifier")), (0, dom_1.$)('code', undefined, extension.identifier.id)));
        }
        openChangelog(template, token) {
            return this.openMarkdown(this.extensionChangelog.get(), (0, nls_1.localize)('noChangelog', "No Changelog available."), template.content, 1 /* WebviewIndex.Changelog */, token);
        }
        openContributions(template, token) {
            const content = (0, dom_1.$)('div.subcontent.feature-contributions', { tabindex: '0' });
            return this.loadContents(() => this.extensionManifest.get(), template.content)
                .then(manifest => {
                if (token.isCancellationRequested) {
                    return null;
                }
                if (!manifest) {
                    return content;
                }
                const scrollableContent = new scrollableElement_1.DomScrollableElement(content, {});
                const layout = () => scrollableContent.scanDomNode();
                const removeLayoutParticipant = arrays.insert(this.layoutParticipants, { layout });
                this.contentDisposables.add((0, lifecycle_1.toDisposable)(removeLayoutParticipant));
                const renders = [
                    this.renderSettings(content, manifest, layout),
                    this.renderCommands(content, manifest, layout),
                    this.renderCodeActions(content, manifest, layout),
                    this.renderLanguages(content, manifest, layout),
                    this.renderColorThemes(content, manifest, layout),
                    this.renderIconThemes(content, manifest, layout),
                    this.renderProductIconThemes(content, manifest, layout),
                    this.renderColors(content, manifest, layout),
                    this.renderJSONValidation(content, manifest, layout),
                    this.renderDebuggers(content, manifest, layout),
                    this.renderViewContainers(content, manifest, layout),
                    this.renderViews(content, manifest, layout),
                    this.renderLocalizations(content, manifest, layout),
                    this.renderCustomEditors(content, manifest, layout),
                    this.renderNotebooks(content, manifest, layout),
                    this.renderNotebookRenderers(content, manifest, layout),
                    this.renderAuthentication(content, manifest, layout),
                    this.renderActivationEvents(content, manifest, layout),
                ];
                scrollableContent.scanDomNode();
                const isEmpty = !renders.some(x => x);
                if (isEmpty) {
                    (0, dom_1.append)(content, (0, dom_1.$)('p.nocontent')).textContent = (0, nls_1.localize)('noContributions', "No Contributions");
                    (0, dom_1.append)(template.content, content);
                }
                else {
                    (0, dom_1.append)(template.content, scrollableContent.getDomNode());
                    this.contentDisposables.add(scrollableContent);
                }
                return content;
            }, () => {
                if (token.isCancellationRequested) {
                    return null;
                }
                (0, dom_1.append)(content, (0, dom_1.$)('p.nocontent')).textContent = (0, nls_1.localize)('noContributions', "No Contributions");
                (0, dom_1.append)(template.content, content);
                return content;
            });
        }
        openExtensionDependencies(extension, template, token) {
            if (token.isCancellationRequested) {
                return Promise.resolve(null);
            }
            if (arrays.isFalsyOrEmpty(extension.dependencies)) {
                (0, dom_1.append)(template.content, (0, dom_1.$)('p.nocontent')).textContent = (0, nls_1.localize)('noDependencies', "No Dependencies");
                return Promise.resolve(template.content);
            }
            const content = (0, dom_1.$)('div', { class: 'subcontent' });
            const scrollableContent = new scrollableElement_1.DomScrollableElement(content, {});
            (0, dom_1.append)(template.content, scrollableContent.getDomNode());
            this.contentDisposables.add(scrollableContent);
            const dependenciesTree = this.instantiationService.createInstance(extensionsViewer_1.ExtensionsTree, new extensionsViewer_1.ExtensionData(extension, null, extension => extension.dependencies || [], this.extensionsWorkbenchService), content, {
                listBackground: colorRegistry_1.editorBackground
            });
            const layout = () => {
                scrollableContent.scanDomNode();
                const scrollDimensions = scrollableContent.getScrollDimensions();
                dependenciesTree.layout(scrollDimensions.height);
            };
            const removeLayoutParticipant = arrays.insert(this.layoutParticipants, { layout });
            this.contentDisposables.add((0, lifecycle_1.toDisposable)(removeLayoutParticipant));
            this.contentDisposables.add(dependenciesTree);
            scrollableContent.scanDomNode();
            return Promise.resolve({ focus() { dependenciesTree.domFocus(); } });
        }
        async openExtensionPack(extension, template, token) {
            if (token.isCancellationRequested) {
                return Promise.resolve(null);
            }
            const manifest = await this.loadContents(() => this.extensionManifest.get(), template.content);
            if (token.isCancellationRequested) {
                return null;
            }
            if (!manifest) {
                return null;
            }
            return this.renderExtensionPack(manifest, template.content, token);
        }
        async openRuntimeStatus(extension, template, token) {
            const content = (0, dom_1.$)('div', { class: 'subcontent', tabindex: '0' });
            const scrollableContent = new scrollableElement_1.DomScrollableElement(content, {});
            const layout = () => scrollableContent.scanDomNode();
            const removeLayoutParticipant = arrays.insert(this.layoutParticipants, { layout });
            this.contentDisposables.add((0, lifecycle_1.toDisposable)(removeLayoutParticipant));
            const updateContent = () => {
                scrollableContent.scanDomNode();
                (0, dom_1.reset)(content, this.renderRuntimeStatus(extension, layout));
            };
            updateContent();
            this.extensionService.onDidChangeExtensionsStatus(e => {
                if (e.some(extensionIdentifier => (0, extensionManagementUtil_1.areSameExtensions)({ id: extensionIdentifier.value }, extension.identifier))) {
                    updateContent();
                }
            }, this, this.contentDisposables);
            this.contentDisposables.add(scrollableContent);
            (0, dom_1.append)(template.content, scrollableContent.getDomNode());
            return content;
        }
        renderRuntimeStatus(extension, onDetailsToggle) {
            const extensionStatus = this.extensionsWorkbenchService.getExtensionStatus(extension);
            const element = (0, dom_1.$)('.runtime-status');
            if (extensionStatus === null || extensionStatus === void 0 ? void 0 : extensionStatus.activationTimes) {
                const activationTime = extensionStatus.activationTimes.codeLoadingTime + extensionStatus.activationTimes.activateCallTime;
                (0, dom_1.append)(element, (0, dom_1.$)('div.activation-message', undefined, `${(0, nls_1.localize)('activation', "Activation time")}${extensionStatus.activationTimes.activationReason.startup ? ` (${(0, nls_1.localize)('startup', "Startup")})` : ''} : ${activationTime}ms`));
            }
            else if (extension.local && (extension.local.manifest.main || extension.local.manifest.browser)) {
                (0, dom_1.append)(element, (0, dom_1.$)('div.activation-message', undefined, (0, nls_1.localize)('not yet activated', "Not yet activated.")));
            }
            if (extensionStatus === null || extensionStatus === void 0 ? void 0 : extensionStatus.runtimeErrors.length) {
                (0, dom_1.append)(element, (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('uncaught errors', "Uncaught Errors ({0})", extensionStatus.runtimeErrors.length)), (0, dom_1.$)('div', undefined, ...extensionStatus.runtimeErrors.map(error => (0, dom_1.$)('div.message-entry', undefined, (0, dom_1.$)(`span${themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.errorIcon)}`, undefined), (0, dom_1.$)('span', undefined, (0, errors_1.getErrorMessage)(error)))))));
            }
            if (extensionStatus === null || extensionStatus === void 0 ? void 0 : extensionStatus.messages.length) {
                (0, dom_1.append)(element, (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('messages', "Messages ({0})", extensionStatus === null || extensionStatus === void 0 ? void 0 : extensionStatus.messages.length)), (0, dom_1.$)('div', undefined, ...extensionStatus.messages.sort((a, b) => b.type - a.type)
                    .map(message => (0, dom_1.$)('div.message-entry', undefined, (0, dom_1.$)(`span${themeService_1.ThemeIcon.asCSSSelector(message.type === notification_1.Severity.Error ? extensionsIcons_1.errorIcon : message.type === notification_1.Severity.Warning ? extensionsIcons_1.warningIcon : extensionsIcons_1.infoIcon)}`, undefined), (0, dom_1.$)('span', undefined, message.message))))));
            }
            if (element.children.length === 0) {
                (0, dom_1.append)(element, (0, dom_1.$)('div.no-status-message')).textContent = (0, nls_1.localize)('noStatus', "No status available.");
            }
            return element;
        }
        async renderExtensionPack(manifest, parent, token) {
            if (token.isCancellationRequested) {
                return null;
            }
            const content = (0, dom_1.$)('div', { class: 'subcontent' });
            const scrollableContent = new scrollableElement_1.DomScrollableElement(content, { useShadows: false });
            (0, dom_1.append)(parent, scrollableContent.getDomNode());
            const extensionsGridView = this.instantiationService.createInstance(extensionsViewer_1.ExtensionsGridView, content, new extensionsList_1.Delegate());
            const extensions = await (0, extensionsViewer_1.getExtensions)(manifest.extensionPack, this.extensionsWorkbenchService);
            extensionsGridView.setExtensions(extensions);
            scrollableContent.scanDomNode();
            this.contentDisposables.add(scrollableContent);
            this.contentDisposables.add(extensionsGridView);
            this.contentDisposables.add((0, lifecycle_1.toDisposable)(arrays.insert(this.layoutParticipants, { layout: () => scrollableContent.scanDomNode() })));
            return content;
        }
        renderSettings(container, manifest, onDetailsToggle) {
            var _a;
            const configuration = (_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.configuration;
            let properties = {};
            if (Array.isArray(configuration)) {
                configuration.forEach(config => {
                    properties = Object.assign(Object.assign({}, properties), config.properties);
                });
            }
            else if (configuration) {
                properties = configuration.properties;
            }
            const contrib = properties ? Object.keys(properties) : [];
            if (!contrib.length) {
                return false;
            }
            const details = (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('settings', "Settings ({0})", contrib.length)), (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('th', undefined, (0, nls_1.localize)('setting name', "Name")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('description', "Description")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('default', "Default"))), ...contrib.map(key => {
                let description = properties[key].description;
                if (properties[key].markdownDescription) {
                    const { element, dispose } = (0, markdownRenderer_1.renderMarkdown)({ value: properties[key].markdownDescription }, { actionHandler: { callback: (content) => this.openerService.open(content).catch(errors_1.onUnexpectedError), disposables: this.contentDisposables } });
                    description = element;
                    this.contentDisposables.add((0, lifecycle_1.toDisposable)(dispose));
                }
                return (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, (0, dom_1.$)('code', undefined, key)), (0, dom_1.$)('td', undefined, description), (0, dom_1.$)('td', undefined, (0, dom_1.$)('code', undefined, `${(0, types_1.isUndefined)(properties[key].default) ? (0, configurationRegistry_1.getDefaultValue)(properties[key].type) : properties[key].default}`)));
            })));
            (0, dom_1.append)(container, details);
            return true;
        }
        renderDebuggers(container, manifest, onDetailsToggle) {
            var _a;
            const contrib = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.debuggers) || [];
            if (!contrib.length) {
                return false;
            }
            const details = (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('debuggers', "Debuggers ({0})", contrib.length)), (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('th', undefined, (0, nls_1.localize)('debugger name', "Name")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('debugger type', "Type"))), ...contrib.map(d => (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, d.label), (0, dom_1.$)('td', undefined, d.type)))));
            (0, dom_1.append)(container, details);
            return true;
        }
        renderViewContainers(container, manifest, onDetailsToggle) {
            var _a;
            const contrib = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.viewsContainers) || {};
            const viewContainers = Object.keys(contrib).reduce((result, location) => {
                let viewContainersForLocation = contrib[location];
                result.push(...viewContainersForLocation.map(viewContainer => (Object.assign(Object.assign({}, viewContainer), { location }))));
                return result;
            }, []);
            if (!viewContainers.length) {
                return false;
            }
            const details = (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('viewContainers', "View Containers ({0})", viewContainers.length)), (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('th', undefined, (0, nls_1.localize)('view container id', "ID")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('view container title', "Title")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('view container location', "Where"))), ...viewContainers.map(viewContainer => (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, viewContainer.id), (0, dom_1.$)('td', undefined, viewContainer.title), (0, dom_1.$)('td', undefined, viewContainer.location)))));
            (0, dom_1.append)(container, details);
            return true;
        }
        renderViews(container, manifest, onDetailsToggle) {
            var _a;
            const contrib = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.views) || {};
            const views = Object.keys(contrib).reduce((result, location) => {
                let viewsForLocation = contrib[location];
                result.push(...viewsForLocation.map(view => (Object.assign(Object.assign({}, view), { location }))));
                return result;
            }, []);
            if (!views.length) {
                return false;
            }
            const details = (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('views', "Views ({0})", views.length)), (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('th', undefined, (0, nls_1.localize)('view id', "ID")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('view name', "Name")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('view location', "Where"))), ...views.map(view => (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, view.id), (0, dom_1.$)('td', undefined, view.name), (0, dom_1.$)('td', undefined, view.location)))));
            (0, dom_1.append)(container, details);
            return true;
        }
        renderLocalizations(container, manifest, onDetailsToggle) {
            var _a;
            const localizations = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.localizations) || [];
            if (!localizations.length) {
                return false;
            }
            const details = (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('localizations', "Localizations ({0})", localizations.length)), (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('th', undefined, (0, nls_1.localize)('localizations language id', "Language ID")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('localizations language name', "Language Name")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('localizations localized language name', "Language Name (Localized)"))), ...localizations.map(localization => (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, localization.languageId), (0, dom_1.$)('td', undefined, localization.languageName || ''), (0, dom_1.$)('td', undefined, localization.localizedLanguageName || '')))));
            (0, dom_1.append)(container, details);
            return true;
        }
        renderCustomEditors(container, manifest, onDetailsToggle) {
            var _a;
            const webviewEditors = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.customEditors) || [];
            if (!webviewEditors.length) {
                return false;
            }
            const details = (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('customEditors', "Custom Editors ({0})", webviewEditors.length)), (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('th', undefined, (0, nls_1.localize)('customEditors view type', "View Type")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('customEditors priority', "Priority")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('customEditors filenamePattern', "Filename Pattern"))), ...webviewEditors.map(webviewEditor => (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, webviewEditor.viewType), (0, dom_1.$)('td', undefined, webviewEditor.priority), (0, dom_1.$)('td', undefined, arrays.coalesce(webviewEditor.selector.map(x => x.filenamePattern)).join(', '))))));
            (0, dom_1.append)(container, details);
            return true;
        }
        renderCodeActions(container, manifest, onDetailsToggle) {
            var _a;
            const codeActions = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.codeActions) || [];
            if (!codeActions.length) {
                return false;
            }
            const flatActions = arrays.flatten(codeActions.map(contribution => contribution.actions.map(action => (Object.assign(Object.assign({}, action), { languages: contribution.languages })))));
            const details = (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('codeActions', "Code Actions ({0})", flatActions.length)), (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('th', undefined, (0, nls_1.localize)('codeActions.title', "Title")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('codeActions.kind', "Kind")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('codeActions.description', "Description")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('codeActions.languages', "Languages"))), ...flatActions.map(action => {
                var _a;
                return (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, action.title), (0, dom_1.$)('td', undefined, (0, dom_1.$)('code', undefined, action.kind)), (0, dom_1.$)('td', undefined, (_a = action.description) !== null && _a !== void 0 ? _a : ''), (0, dom_1.$)('td', undefined, ...action.languages.map(language => (0, dom_1.$)('code', undefined, language))));
            })));
            (0, dom_1.append)(container, details);
            return true;
        }
        renderAuthentication(container, manifest, onDetailsToggle) {
            var _a;
            const authentication = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.authentication) || [];
            if (!authentication.length) {
                return false;
            }
            const details = (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('authentication', "Authentication ({0})", authentication.length)), (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('th', undefined, (0, nls_1.localize)('authentication.label', "Label")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('authentication.id', "Id"))), ...authentication.map(action => (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, action.label), (0, dom_1.$)('td', undefined, action.id)))));
            (0, dom_1.append)(container, details);
            return true;
        }
        renderColorThemes(container, manifest, onDetailsToggle) {
            var _a;
            const contrib = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.themes) || [];
            if (!contrib.length) {
                return false;
            }
            const details = (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('colorThemes', "Color Themes ({0})", contrib.length)), (0, dom_1.$)('ul', undefined, ...contrib.map(theme => (0, dom_1.$)('li', undefined, theme.label))));
            (0, dom_1.append)(container, details);
            return true;
        }
        renderIconThemes(container, manifest, onDetailsToggle) {
            var _a;
            const contrib = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.iconThemes) || [];
            if (!contrib.length) {
                return false;
            }
            const details = (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('iconThemes', "File Icon Themes ({0})", contrib.length)), (0, dom_1.$)('ul', undefined, ...contrib.map(theme => (0, dom_1.$)('li', undefined, theme.label))));
            (0, dom_1.append)(container, details);
            return true;
        }
        renderProductIconThemes(container, manifest, onDetailsToggle) {
            var _a;
            const contrib = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.productIconThemes) || [];
            if (!contrib.length) {
                return false;
            }
            const details = (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('productThemes', "Product Icon Themes ({0})", contrib.length)), (0, dom_1.$)('ul', undefined, ...contrib.map(theme => (0, dom_1.$)('li', undefined, theme.label))));
            (0, dom_1.append)(container, details);
            return true;
        }
        renderColors(container, manifest, onDetailsToggle) {
            var _a;
            const colors = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.colors) || [];
            if (!colors.length) {
                return false;
            }
            function colorPreview(colorReference) {
                let result = [];
                if (colorReference && colorReference[0] === '#') {
                    let color = color_1.Color.fromHex(colorReference);
                    if (color) {
                        result.push((0, dom_1.$)('span', { class: 'colorBox', style: 'background-color: ' + color_1.Color.Format.CSS.format(color) }, ''));
                    }
                }
                result.push((0, dom_1.$)('code', undefined, colorReference));
                return result;
            }
            const details = (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('colors', "Colors ({0})", colors.length)), (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('th', undefined, (0, nls_1.localize)('colorId', "Id")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('description', "Description")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('defaultDark', "Dark Default")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('defaultLight', "Light Default")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('defaultHC', "High Contrast Default"))), ...colors.map(color => (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, (0, dom_1.$)('code', undefined, color.id)), (0, dom_1.$)('td', undefined, color.description), (0, dom_1.$)('td', undefined, ...colorPreview(color.defaults.dark)), (0, dom_1.$)('td', undefined, ...colorPreview(color.defaults.light)), (0, dom_1.$)('td', undefined, ...colorPreview(color.defaults.highContrast))))));
            (0, dom_1.append)(container, details);
            return true;
        }
        renderJSONValidation(container, manifest, onDetailsToggle) {
            var _a;
            const contrib = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.jsonValidation) || [];
            if (!contrib.length) {
                return false;
            }
            const details = (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('JSON Validation', "JSON Validation ({0})", contrib.length)), (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('th', undefined, (0, nls_1.localize)('fileMatch', "File Match")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('schema', "Schema"))), ...contrib.map(v => (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, (0, dom_1.$)('code', undefined, Array.isArray(v.fileMatch) ? v.fileMatch.join(', ') : v.fileMatch)), (0, dom_1.$)('td', undefined, v.url)))));
            (0, dom_1.append)(container, details);
            return true;
        }
        renderCommands(container, manifest, onDetailsToggle) {
            var _a, _b, _c;
            const rawCommands = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.commands) || [];
            const commands = rawCommands.map(c => ({
                id: c.command,
                title: c.title,
                keybindings: [],
                menus: []
            }));
            const byId = arrays.index(commands, c => c.id);
            const menus = ((_b = manifest.contributes) === null || _b === void 0 ? void 0 : _b.menus) || {};
            Object.keys(menus).forEach(context => {
                menus[context].forEach(menu => {
                    let command = byId[menu.command];
                    if (command) {
                        command.menus.push(context);
                    }
                    else {
                        command = { id: menu.command, title: '', keybindings: [], menus: [context] };
                        byId[command.id] = command;
                        commands.push(command);
                    }
                });
            });
            const rawKeybindings = ((_c = manifest.contributes) === null || _c === void 0 ? void 0 : _c.keybindings) ? (Array.isArray(manifest.contributes.keybindings) ? manifest.contributes.keybindings : [manifest.contributes.keybindings]) : [];
            rawKeybindings.forEach(rawKeybinding => {
                const keybinding = this.resolveKeybinding(rawKeybinding);
                if (!keybinding) {
                    return;
                }
                let command = byId[rawKeybinding.command];
                if (command) {
                    command.keybindings.push(keybinding);
                }
                else {
                    command = { id: rawKeybinding.command, title: '', keybindings: [keybinding], menus: [] };
                    byId[command.id] = command;
                    commands.push(command);
                }
            });
            if (!commands.length) {
                return false;
            }
            const renderKeybinding = (keybinding) => {
                const element = (0, dom_1.$)('');
                const kbl = new keybindingLabel_1.KeybindingLabel(element, platform_1.OS);
                kbl.set(keybinding);
                this.contentDisposables.add((0, styler_1.attachKeybindingLabelStyler)(kbl, this.themeService));
                return element;
            };
            const details = (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('commands', "Commands ({0})", commands.length)), (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('th', undefined, (0, nls_1.localize)('command name', "Name")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('description', "Description")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('keyboard shortcuts', "Keyboard Shortcuts")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('menuContexts', "Menu Contexts"))), ...commands.map(c => (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, (0, dom_1.$)('code', undefined, c.id)), (0, dom_1.$)('td', undefined, c.title), (0, dom_1.$)('td', undefined, ...c.keybindings.map(keybinding => renderKeybinding(keybinding))), (0, dom_1.$)('td', undefined, ...c.menus.map(context => (0, dom_1.$)('code', undefined, context)))))));
            (0, dom_1.append)(container, details);
            return true;
        }
        renderLanguages(container, manifest, onDetailsToggle) {
            const contributes = manifest.contributes;
            const rawLanguages = (contributes === null || contributes === void 0 ? void 0 : contributes.languages) || [];
            const languages = rawLanguages.map(l => ({
                id: l.id,
                name: (l.aliases || [])[0] || l.id,
                extensions: l.extensions || [],
                hasGrammar: false,
                hasSnippets: false
            }));
            const byId = arrays.index(languages, l => l.id);
            const grammars = (contributes === null || contributes === void 0 ? void 0 : contributes.grammars) || [];
            grammars.forEach(grammar => {
                let language = byId[grammar.language];
                if (language) {
                    language.hasGrammar = true;
                }
                else {
                    language = { id: grammar.language, name: grammar.language, extensions: [], hasGrammar: true, hasSnippets: false };
                    byId[language.id] = language;
                    languages.push(language);
                }
            });
            const snippets = (contributes === null || contributes === void 0 ? void 0 : contributes.snippets) || [];
            snippets.forEach(snippet => {
                let language = byId[snippet.language];
                if (language) {
                    language.hasSnippets = true;
                }
                else {
                    language = { id: snippet.language, name: snippet.language, extensions: [], hasGrammar: false, hasSnippets: true };
                    byId[language.id] = language;
                    languages.push(language);
                }
            });
            if (!languages.length) {
                return false;
            }
            const details = (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('languages', "Languages ({0})", languages.length)), (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('th', undefined, (0, nls_1.localize)('language id', "ID")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('language name', "Name")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('file extensions', "File Extensions")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('grammar', "Grammar")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('snippets', "Snippets"))), ...languages.map(l => (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, l.id), (0, dom_1.$)('td', undefined, l.name), (0, dom_1.$)('td', undefined, ...(0, dom_1.join)(l.extensions.map(ext => (0, dom_1.$)('code', undefined, ext)), ' ')), (0, dom_1.$)('td', undefined, document.createTextNode(l.hasGrammar ? '✔︎' : '\u2014')), (0, dom_1.$)('td', undefined, document.createTextNode(l.hasSnippets ? '✔︎' : '\u2014'))))));
            (0, dom_1.append)(container, details);
            return true;
        }
        renderActivationEvents(container, manifest, onDetailsToggle) {
            const activationEvents = manifest.activationEvents || [];
            if (!activationEvents.length) {
                return false;
            }
            const details = (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('activation events', "Activation Events ({0})", activationEvents.length)), (0, dom_1.$)('ul', undefined, ...activationEvents.map(activationEvent => (0, dom_1.$)('li', undefined, (0, dom_1.$)('code', undefined, activationEvent)))));
            (0, dom_1.append)(container, details);
            return true;
        }
        renderNotebooks(container, manifest, onDetailsToggle) {
            var _a;
            const contrib = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.notebooks) || [];
            if (!contrib.length) {
                return false;
            }
            const details = (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('Notebooks', "Notebooks ({0})", contrib.length)), (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('th', undefined, (0, nls_1.localize)('Notebook id', "Id")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('Notebook name', "Name"))), ...contrib.map(d => (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, d.type), (0, dom_1.$)('td', undefined, d.displayName)))));
            (0, dom_1.append)(container, details);
            return true;
        }
        renderNotebookRenderers(container, manifest, onDetailsToggle) {
            var _a;
            const contrib = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.notebookRenderer) || [];
            if (!contrib.length) {
                return false;
            }
            const details = (0, dom_1.$)('details', { open: true, ontoggle: onDetailsToggle }, (0, dom_1.$)('summary', { tabindex: '0' }, (0, nls_1.localize)('NotebookRenderers', "Notebook Renderers ({0})", contrib.length)), (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('th', undefined, (0, nls_1.localize)('Notebook renderer name', "Name")), (0, dom_1.$)('th', undefined, (0, nls_1.localize)('Notebook mimetypes', "Mimetypes"))), ...contrib.map(d => (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, d.displayName), (0, dom_1.$)('td', undefined, d.mimeTypes.join(','))))));
            (0, dom_1.append)(container, details);
            return true;
        }
        resolveKeybinding(rawKeyBinding) {
            let key;
            switch (process_1.platform) {
                case 'win32':
                    key = rawKeyBinding.win;
                    break;
                case 'linux':
                    key = rawKeyBinding.linux;
                    break;
                case 'darwin':
                    key = rawKeyBinding.mac;
                    break;
            }
            return this.keybindingService.resolveUserBinding(key || rawKeyBinding.key)[0];
        }
        loadContents(loadingTask, container) {
            container.classList.add('loading');
            const result = this.contentDisposables.add(loadingTask());
            const onDone = () => container.classList.remove('loading');
            result.promise.then(onDone, onDone);
            return result.promise;
        }
        layout(dimension) {
            this.dimension = dimension;
            this.layoutParticipants.forEach(p => p.layout());
        }
        onError(err) {
            if ((0, errors_1.isCancellationError)(err)) {
                return;
            }
            this.notificationService.error(err);
        }
    };
    ExtensionEditor.ID = 'workbench.editor.extension';
    ExtensionEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, panecomposite_1.IPaneCompositePartService),
        __param(3, extensions_1.IExtensionsWorkbenchService),
        __param(4, extensionManagement_1.IExtensionGalleryService),
        __param(5, themeService_1.IThemeService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, notification_1.INotificationService),
        __param(8, opener_1.IOpenerService),
        __param(9, extensionRecommendations_1.IExtensionRecommendationsService),
        __param(10, extensionRecommendations_1.IExtensionIgnoredRecommendationsService),
        __param(11, storage_1.IStorageService),
        __param(12, extensions_2.IExtensionService),
        __param(13, webview_1.IWebviewService),
        __param(14, language_1.ILanguageService),
        __param(15, contextView_1.IContextMenuService),
        __param(16, contextkey_1.IContextKeyService)
    ], ExtensionEditor);
    exports.ExtensionEditor = ExtensionEditor;
    const contextKeyExpr = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', ExtensionEditor.ID), editorContextKeys_1.EditorContextKeys.focus.toNegated());
    (0, actions_2.registerAction2)(class ShowExtensionEditorFindAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'editor.action.extensioneditor.showfind',
                title: (0, nls_1.localize)('find', "Find"),
                keybinding: {
                    when: contextKeyExpr,
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */,
                }
            });
        }
        run(accessor) {
            const extensionEditor = getExtensionEditor(accessor);
            if (extensionEditor) {
                extensionEditor.showFind();
            }
        }
    });
    (0, actions_2.registerAction2)(class StartExtensionEditorFindNextAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'editor.action.extensioneditor.findNext',
                title: (0, nls_1.localize)('find next', "Find Next"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(contextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED),
                    primary: 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor) {
            const extensionEditor = getExtensionEditor(accessor);
            if (extensionEditor) {
                extensionEditor.runFindAction(false);
            }
        }
    });
    (0, actions_2.registerAction2)(class StartExtensionEditorFindPreviousAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'editor.action.extensioneditor.findPrevious',
                title: (0, nls_1.localize)('find previous', "Find Previous"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(contextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED),
                    primary: 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor) {
            const extensionEditor = getExtensionEditor(accessor);
            if (extensionEditor) {
                extensionEditor.runFindAction(true);
            }
        }
    });
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.monaco-workbench .extension-editor .content .details .additional-details-container .resources-container a { color: ${link}; }`);
            collector.addRule(`.monaco-workbench .extension-editor .content .feature-contributions a { color: ${link}; }`);
        }
        const activeLink = theme.getColor(colorRegistry_1.textLinkActiveForeground);
        if (activeLink) {
            collector.addRule(`.monaco-workbench .extension-editor .content .details .additional-details-container .resources-container a:hover,
			.monaco-workbench .extension-editor .content .details .additional-details-container .resources-container a:active { color: ${activeLink}; }`);
            collector.addRule(`.monaco-workbench .extension-editor .content .feature-contributions a:hover,
			.monaco-workbench .extension-editor .content .feature-contributions a:active { color: ${activeLink}; }`);
        }
        const buttonHoverBackgroundColor = theme.getColor(colorRegistry_1.buttonHoverBackground);
        if (buttonHoverBackgroundColor) {
            collector.addRule(`.monaco-workbench .extension-editor .content > .details > .additional-details-container .categories-container > .categories > .category:hover { background-color: ${buttonHoverBackgroundColor}; border-color: ${buttonHoverBackgroundColor}; }`);
            collector.addRule(`.monaco-workbench .extension-editor .content > .details > .additional-details-container .tags-container > .tags > .tag:hover { background-color: ${buttonHoverBackgroundColor}; border-color: ${buttonHoverBackgroundColor}; }`);
        }
        const buttonForegroundColor = theme.getColor(colorRegistry_1.buttonForeground);
        if (buttonForegroundColor) {
            collector.addRule(`.monaco-workbench .extension-editor .content > .details > .additional-details-container .categories-container > .categories > .category:hover { color: ${buttonForegroundColor}; }`);
            collector.addRule(`.monaco-workbench .extension-editor .content > .details > .additional-details-container .tags-container > .tags > .tag:hover { color: ${buttonForegroundColor}; }`);
        }
    });
    function getExtensionEditor(accessor) {
        const activeEditorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
        if (activeEditorPane instanceof ExtensionEditor) {
            return activeEditorPane;
        }
        return null;
    }
});
//# sourceMappingURL=extensionEditor.js.map