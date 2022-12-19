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
define(["require", "exports", "vs/base/common/semver/semver", "vs/base/common/lifecycle", "vs/workbench/contrib/extensions/common/extensions", "vs/base/browser/dom", "vs/base/common/platform", "vs/nls", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/platform/label/common/label", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/base/browser/ui/countBadge/countBadge", "vs/platform/configuration/common/configuration", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/hover/browser/hover", "vs/base/common/htmlContent", "vs/base/common/uri", "vs/workbench/services/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/severity", "vs/base/browser/ui/iconLabel/iconLabelHover", "vs/base/common/color", "vs/css!./media/extensionsWidgets"], function (require, exports, semver, lifecycle_1, extensions_1, dom_1, platform, nls_1, extensionManagement_1, extensionRecommendations_1, label_1, extensionsActions_1, themeService_1, theme_1, event_1, instantiation_1, countBadge_1, configuration_1, userDataSync_1, extensionsIcons_1, colorRegistry_1, hover_1, htmlContent_1, uri_1, extensions_2, extensionManagementUtil_1, severity_1, iconLabelHover_1, color_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extensionPreReleaseIconColor = exports.extensionVerifiedPublisherIconColor = exports.extensionRatingIconColor = exports.ExtensionHoverWidget = exports.ExtensionActivationStatusWidget = exports.SyncIgnoredWidget = exports.ExtensionPackCountWidget = exports.RemoteBadgeWidget = exports.PreReleaseBookmarkWidget = exports.RecommendationWidget = exports.RunningPreReleaseVersionIndicatorWidget = exports.RatingsWidget = exports.InstallCountWidget = exports.ExtensionWidget = void 0;
    class ExtensionWidget extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._extension = null;
        }
        get extension() { return this._extension; }
        set extension(extension) { this._extension = extension; this.update(); }
        update() { this.render(); }
    }
    exports.ExtensionWidget = ExtensionWidget;
    class InstallCountWidget extends ExtensionWidget {
        constructor(container, small) {
            super();
            this.container = container;
            this.small = small;
            container.classList.add('extension-install-count');
            this.render();
        }
        render() {
            this.container.innerText = '';
            if (!this.extension) {
                return;
            }
            if (this.small && this.extension.state === 1 /* ExtensionState.Installed */) {
                return;
            }
            const installLabel = InstallCountWidget.getInstallLabel(this.extension, this.small);
            if (!installLabel) {
                return;
            }
            (0, dom_1.append)(this.container, (0, dom_1.$)('span' + themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.installCountIcon)));
            const count = (0, dom_1.append)(this.container, (0, dom_1.$)('span.count'));
            count.textContent = installLabel;
        }
        static getInstallLabel(extension, small) {
            const installCount = extension.installCount;
            if (installCount === undefined) {
                return undefined;
            }
            let installLabel;
            if (small) {
                if (installCount > 1000000) {
                    installLabel = `${Math.floor(installCount / 100000) / 10}M`;
                }
                else if (installCount > 1000) {
                    installLabel = `${Math.floor(installCount / 1000)}K`;
                }
                else {
                    installLabel = String(installCount);
                }
            }
            else {
                installLabel = installCount.toLocaleString(platform.locale);
            }
            return installLabel;
        }
    }
    exports.InstallCountWidget = InstallCountWidget;
    class RatingsWidget extends ExtensionWidget {
        constructor(container, small) {
            super();
            this.container = container;
            this.small = small;
            container.classList.add('extension-ratings');
            if (this.small) {
                container.classList.add('small');
            }
            this.render();
        }
        render() {
            this.container.innerText = '';
            if (!this.extension) {
                return;
            }
            if (this.small && this.extension.state === 1 /* ExtensionState.Installed */) {
                return;
            }
            if (this.extension.rating === undefined) {
                return;
            }
            if (this.small && !this.extension.ratingCount) {
                return;
            }
            const rating = Math.round(this.extension.rating * 2) / 2;
            if (this.small) {
                (0, dom_1.append)(this.container, (0, dom_1.$)('span' + themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.starFullIcon)));
                const count = (0, dom_1.append)(this.container, (0, dom_1.$)('span.count'));
                count.textContent = String(rating);
            }
            else {
                for (let i = 1; i <= 5; i++) {
                    if (rating >= i) {
                        (0, dom_1.append)(this.container, (0, dom_1.$)('span' + themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.starFullIcon)));
                    }
                    else if (rating >= i - 0.5) {
                        (0, dom_1.append)(this.container, (0, dom_1.$)('span' + themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.starHalfIcon)));
                    }
                    else {
                        (0, dom_1.append)(this.container, (0, dom_1.$)('span' + themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.starEmptyIcon)));
                    }
                }
                if (this.extension.ratingCount) {
                    const ratingCountElemet = (0, dom_1.append)(this.container, (0, dom_1.$)('span', undefined, ` (${this.extension.ratingCount})`));
                    ratingCountElemet.style.paddingLeft = '1px';
                }
            }
        }
    }
    exports.RatingsWidget = RatingsWidget;
    class RunningPreReleaseVersionIndicatorWidget extends ExtensionWidget {
        constructor(container) {
            super();
            this.container = container;
            container.classList.add('extension-pre-release');
            this.render();
        }
        render() {
            var _a;
            this.container.innerText = '';
            if (!this.extension
                || this.extension.state !== 1 /* ExtensionState.Installed */
                || !((_a = this.extension.local) === null || _a === void 0 ? void 0 : _a.isPreReleaseVersion)) {
                return;
            }
            (0, dom_1.append)(this.container, (0, dom_1.$)('span' + themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.preReleaseIcon)));
        }
    }
    exports.RunningPreReleaseVersionIndicatorWidget = RunningPreReleaseVersionIndicatorWidget;
    let RecommendationWidget = class RecommendationWidget extends ExtensionWidget {
        constructor(parent, extensionRecommendationsService) {
            super();
            this.parent = parent;
            this.extensionRecommendationsService = extensionRecommendationsService;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            this.render();
            this._register((0, lifecycle_1.toDisposable)(() => this.clear()));
            this._register(this.extensionRecommendationsService.onDidChangeRecommendations(() => this.render()));
        }
        clear() {
            if (this.element) {
                this.parent.removeChild(this.element);
            }
            this.element = undefined;
            this.disposables.clear();
        }
        render() {
            this.clear();
            if (!this.extension || this.extension.state === 1 /* ExtensionState.Installed */) {
                return;
            }
            const extRecommendations = this.extensionRecommendationsService.getAllRecommendationsWithReason();
            if (extRecommendations[this.extension.identifier.id.toLowerCase()]) {
                this.element = (0, dom_1.append)(this.parent, (0, dom_1.$)('div.extension-bookmark'));
                const recommendation = (0, dom_1.append)(this.element, (0, dom_1.$)('.recommendation'));
                (0, dom_1.append)(recommendation, (0, dom_1.$)('span' + themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.ratingIcon)));
            }
        }
    };
    RecommendationWidget = __decorate([
        __param(1, extensionRecommendations_1.IExtensionRecommendationsService)
    ], RecommendationWidget);
    exports.RecommendationWidget = RecommendationWidget;
    class PreReleaseBookmarkWidget extends ExtensionWidget {
        constructor(parent) {
            super();
            this.parent = parent;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            this.render();
            this._register((0, lifecycle_1.toDisposable)(() => this.clear()));
        }
        clear() {
            if (this.element) {
                this.parent.removeChild(this.element);
            }
            this.element = undefined;
            this.disposables.clear();
        }
        render() {
            var _a;
            this.clear();
            if (!this.extension) {
                return;
            }
            if (this.extension.isBuiltin) {
                return;
            }
            if (!this.extension.hasPreReleaseVersion) {
                return;
            }
            if (this.extension.state === 1 /* ExtensionState.Installed */ && ((_a = this.extension.local) === null || _a === void 0 ? void 0 : _a.isPreReleaseVersion)) {
                return;
            }
            this.element = (0, dom_1.append)(this.parent, (0, dom_1.$)('div.extension-bookmark'));
            const preRelease = (0, dom_1.append)(this.element, (0, dom_1.$)('.pre-release'));
            (0, dom_1.append)(preRelease, (0, dom_1.$)('span' + themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.preReleaseIcon)));
        }
    }
    exports.PreReleaseBookmarkWidget = PreReleaseBookmarkWidget;
    let RemoteBadgeWidget = class RemoteBadgeWidget extends ExtensionWidget {
        constructor(parent, tooltip, extensionManagementServerService, instantiationService) {
            super();
            this.tooltip = tooltip;
            this.extensionManagementServerService = extensionManagementServerService;
            this.instantiationService = instantiationService;
            this.remoteBadge = this._register(new lifecycle_1.MutableDisposable());
            this.element = (0, dom_1.append)(parent, (0, dom_1.$)('.extension-remote-badge-container'));
            this.render();
            this._register((0, lifecycle_1.toDisposable)(() => this.clear()));
        }
        clear() {
            if (this.remoteBadge.value) {
                this.element.removeChild(this.remoteBadge.value.element);
            }
            this.remoteBadge.clear();
        }
        render() {
            this.clear();
            if (!this.extension || !this.extension.local || !this.extension.server || !(this.extensionManagementServerService.localExtensionManagementServer && this.extensionManagementServerService.remoteExtensionManagementServer) || this.extension.server !== this.extensionManagementServerService.remoteExtensionManagementServer) {
                return;
            }
            this.remoteBadge.value = this.instantiationService.createInstance(RemoteBadge, this.tooltip);
            (0, dom_1.append)(this.element, this.remoteBadge.value.element);
        }
    };
    RemoteBadgeWidget = __decorate([
        __param(2, extensionManagement_1.IExtensionManagementServerService),
        __param(3, instantiation_1.IInstantiationService)
    ], RemoteBadgeWidget);
    exports.RemoteBadgeWidget = RemoteBadgeWidget;
    let RemoteBadge = class RemoteBadge extends lifecycle_1.Disposable {
        constructor(tooltip, labelService, themeService, extensionManagementServerService) {
            super();
            this.tooltip = tooltip;
            this.labelService = labelService;
            this.themeService = themeService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.element = (0, dom_1.$)('div.extension-badge.extension-remote-badge');
            this.render();
        }
        render() {
            (0, dom_1.append)(this.element, (0, dom_1.$)('span' + themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.remoteIcon)));
            const applyBadgeStyle = () => {
                if (!this.element) {
                    return;
                }
                const bgColor = this.themeService.getColorTheme().getColor(theme_1.EXTENSION_BADGE_REMOTE_BACKGROUND);
                const fgColor = this.themeService.getColorTheme().getColor(theme_1.EXTENSION_BADGE_REMOTE_FOREGROUND);
                this.element.style.backgroundColor = bgColor ? bgColor.toString() : '';
                this.element.style.color = fgColor ? fgColor.toString() : '';
            };
            applyBadgeStyle();
            this._register(this.themeService.onDidColorThemeChange(() => applyBadgeStyle()));
            if (this.tooltip) {
                const updateTitle = () => {
                    if (this.element && this.extensionManagementServerService.remoteExtensionManagementServer) {
                        this.element.title = (0, nls_1.localize)('remote extension title', "Extension in {0}", this.extensionManagementServerService.remoteExtensionManagementServer.label);
                    }
                };
                this._register(this.labelService.onDidChangeFormatters(() => updateTitle()));
                updateTitle();
            }
        }
    };
    RemoteBadge = __decorate([
        __param(1, label_1.ILabelService),
        __param(2, themeService_1.IThemeService),
        __param(3, extensionManagement_1.IExtensionManagementServerService)
    ], RemoteBadge);
    class ExtensionPackCountWidget extends ExtensionWidget {
        constructor(parent) {
            super();
            this.parent = parent;
            this.render();
            this._register((0, lifecycle_1.toDisposable)(() => this.clear()));
        }
        clear() {
            if (this.element) {
                this.element.remove();
            }
        }
        render() {
            var _a;
            this.clear();
            if (!this.extension || !((_a = this.extension.categories) === null || _a === void 0 ? void 0 : _a.some(category => category.toLowerCase() === 'extension packs')) || !this.extension.extensionPack.length) {
                return;
            }
            this.element = (0, dom_1.append)(this.parent, (0, dom_1.$)('.extension-badge.extension-pack-badge'));
            const countBadge = new countBadge_1.CountBadge(this.element);
            countBadge.setCount(this.extension.extensionPack.length);
        }
    }
    exports.ExtensionPackCountWidget = ExtensionPackCountWidget;
    let SyncIgnoredWidget = class SyncIgnoredWidget extends ExtensionWidget {
        constructor(container, configurationService, extensionsWorkbenchService, userDataSyncEnablementService) {
            super();
            this.container = container;
            this.configurationService = configurationService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this._register(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectedKeys.includes('settingsSync.ignoredExtensions'))(() => this.render()));
            this._register(userDataSyncEnablementService.onDidChangeEnablement(() => this.update()));
            this.render();
        }
        render() {
            this.container.innerText = '';
            if (this.extension && this.extension.state === 1 /* ExtensionState.Installed */ && this.userDataSyncEnablementService.isEnabled() && this.extensionsWorkbenchService.isExtensionIgnoredToSync(this.extension)) {
                const element = (0, dom_1.append)(this.container, (0, dom_1.$)('span.extension-sync-ignored' + themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.syncIgnoredIcon)));
                element.title = (0, nls_1.localize)('syncingore.label', "This extension is ignored during sync.");
                element.classList.add(...themeService_1.ThemeIcon.asClassNameArray(extensionsIcons_1.syncIgnoredIcon));
            }
        }
    };
    SyncIgnoredWidget = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, userDataSync_1.IUserDataSyncEnablementService)
    ], SyncIgnoredWidget);
    exports.SyncIgnoredWidget = SyncIgnoredWidget;
    let ExtensionActivationStatusWidget = class ExtensionActivationStatusWidget extends ExtensionWidget {
        constructor(container, small, extensionService, extensionsWorkbenchService) {
            super();
            this.container = container;
            this.small = small;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this._register(extensionService.onDidChangeExtensionsStatus(extensions => {
                if (this.extension && extensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.value }, this.extension.identifier))) {
                    this.update();
                }
            }));
        }
        render() {
            this.container.innerText = '';
            if (!this.extension) {
                return;
            }
            const extensionStatus = this.extensionsWorkbenchService.getExtensionStatus(this.extension);
            if (!extensionStatus || !extensionStatus.activationTimes) {
                return;
            }
            const activationTime = extensionStatus.activationTimes.codeLoadingTime + extensionStatus.activationTimes.activateCallTime;
            if (this.small) {
                (0, dom_1.append)(this.container, (0, dom_1.$)('span' + themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.activationTimeIcon)));
                const activationTimeElement = (0, dom_1.append)(this.container, (0, dom_1.$)('span.activationTime'));
                activationTimeElement.textContent = `${activationTime}ms`;
            }
            else {
                const activationTimeElement = (0, dom_1.append)(this.container, (0, dom_1.$)('span.activationTime'));
                activationTimeElement.textContent = `${(0, nls_1.localize)('activation', "Activation time")}${extensionStatus.activationTimes.activationReason.startup ? ` (${(0, nls_1.localize)('startup', "Startup")})` : ''} : ${activationTime}ms`;
            }
        }
    };
    ExtensionActivationStatusWidget = __decorate([
        __param(2, extensions_2.IExtensionService),
        __param(3, extensions_1.IExtensionsWorkbenchService)
    ], ExtensionActivationStatusWidget);
    exports.ExtensionActivationStatusWidget = ExtensionActivationStatusWidget;
    let ExtensionHoverWidget = class ExtensionHoverWidget extends ExtensionWidget {
        constructor(options, extensionStatusAction, reloadAction, extensionsWorkbenchService, hoverService, configurationService, extensionRecommendationsService, themeService) {
            super();
            this.options = options;
            this.extensionStatusAction = extensionStatusAction;
            this.reloadAction = reloadAction;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.hoverService = hoverService;
            this.configurationService = configurationService;
            this.extensionRecommendationsService = extensionRecommendationsService;
            this.themeService = themeService;
            this.hover = this._register(new lifecycle_1.MutableDisposable());
        }
        render() {
            this.hover.value = undefined;
            if (this.extension) {
                this.hover.value = (0, iconLabelHover_1.setupCustomHover)({
                    delay: this.configurationService.getValue('workbench.hover.delay'),
                    showHover: (options) => {
                        return this.hoverService.showHover(Object.assign(Object.assign({}, options), { hoverPosition: this.options.position(), forcePosition: true, additionalClasses: ['extension-hover'] }));
                    },
                    placement: 'element'
                }, this.options.target, { markdown: () => Promise.resolve(this.getHoverMarkdown()), markdownNotSupportedFallback: undefined });
            }
        }
        getHoverMarkdown() {
            var _a, _b, _c;
            if (!this.extension) {
                return undefined;
            }
            const markdown = new htmlContent_1.MarkdownString('', { isTrusted: true, supportThemeIcons: true });
            markdown.appendMarkdown(`**${this.extension.displayName}**`);
            if (semver.valid(this.extension.version)) {
                markdown.appendMarkdown(`&nbsp;<span style="background-color:#8080802B;">**&nbsp;_v${this.extension.version}_**&nbsp;</span>`);
            }
            if (this.extension.state === 1 /* ExtensionState.Installed */ ? (_a = this.extension.local) === null || _a === void 0 ? void 0 : _a.isPreReleaseVersion : (_b = this.extension.gallery) === null || _b === void 0 ? void 0 : _b.properties.isPreReleaseVersion) {
                const extensionPreReleaseIcon = this.themeService.getColorTheme().getColor(exports.extensionPreReleaseIconColor);
                markdown.appendMarkdown(`**&nbsp;**&nbsp;<span style="color:#ffffff;background-color:${extensionPreReleaseIcon ? color_1.Color.Format.CSS.formatHex(extensionPreReleaseIcon) : '#ffffff'};">&nbsp;$(${extensionsIcons_1.preReleaseIcon.id})&nbsp;${(0, nls_1.localize)('pre-release-label', "Pre-Release")}&nbsp;</span>`);
            }
            markdown.appendText(`\n`);
            if (this.extension.description) {
                markdown.appendMarkdown(`${this.extension.description}`);
                markdown.appendText(`\n`);
            }
            if ((_c = this.extension.publisherDomain) === null || _c === void 0 ? void 0 : _c.verified) {
                const bgColor = this.themeService.getColorTheme().getColor(exports.extensionVerifiedPublisherIconColor);
                const publisherVerifiedTooltip = (0, nls_1.localize)('publisher verified tooltip', "This publisher has verified ownership of {0}", `[${uri_1.URI.parse(this.extension.publisherDomain.link).authority}](${this.extension.publisherDomain.link})`);
                markdown.appendMarkdown(`<span style="color:${bgColor ? color_1.Color.Format.CSS.formatHex(bgColor) : '#ffffff'};">$(${extensionsIcons_1.verifiedPublisherIcon.id})</span>&nbsp;${publisherVerifiedTooltip}`);
                markdown.appendText(`\n`);
            }
            const preReleaseMessage = ExtensionHoverWidget.getPreReleaseMessage(this.extension);
            const extensionRuntimeStatus = this.extensionsWorkbenchService.getExtensionStatus(this.extension);
            const extensionStatus = this.extensionStatusAction.status;
            const reloadRequiredMessage = this.reloadAction.enabled ? this.reloadAction.tooltip : '';
            const recommendationMessage = this.getRecommendationMessage(this.extension);
            if (extensionRuntimeStatus || extensionStatus || reloadRequiredMessage || recommendationMessage || preReleaseMessage) {
                markdown.appendMarkdown(`---`);
                markdown.appendText(`\n`);
                if (extensionRuntimeStatus) {
                    if (extensionRuntimeStatus.activationTimes) {
                        const activationTime = extensionRuntimeStatus.activationTimes.codeLoadingTime + extensionRuntimeStatus.activationTimes.activateCallTime;
                        markdown.appendMarkdown(`${(0, nls_1.localize)('activation', "Activation time")}${extensionRuntimeStatus.activationTimes.activationReason.startup ? ` (${(0, nls_1.localize)('startup', "Startup")})` : ''}: \`${activationTime}ms\``);
                        markdown.appendText(`\n`);
                    }
                    if (extensionRuntimeStatus.runtimeErrors.length || extensionRuntimeStatus.messages.length) {
                        const hasErrors = extensionRuntimeStatus.runtimeErrors.length || extensionRuntimeStatus.messages.some(message => message.type === severity_1.default.Error);
                        const hasWarnings = extensionRuntimeStatus.messages.some(message => message.type === severity_1.default.Warning);
                        const errorsLink = extensionRuntimeStatus.runtimeErrors.length ? `[${extensionRuntimeStatus.runtimeErrors.length === 1 ? (0, nls_1.localize)('uncaught error', '1 uncaught error') : (0, nls_1.localize)('uncaught errors', '{0} uncaught errors', extensionRuntimeStatus.runtimeErrors.length)}](${uri_1.URI.parse(`command:extension.open?${encodeURIComponent(JSON.stringify([this.extension.identifier.id, "runtimeStatus" /* ExtensionEditorTab.RuntimeStatus */]))}`)})` : undefined;
                        const messageLink = extensionRuntimeStatus.messages.length ? `[${extensionRuntimeStatus.messages.length === 1 ? (0, nls_1.localize)('message', '1 message') : (0, nls_1.localize)('messages', '{0} messages', extensionRuntimeStatus.messages.length)}](${uri_1.URI.parse(`command:extension.open?${encodeURIComponent(JSON.stringify([this.extension.identifier.id, "runtimeStatus" /* ExtensionEditorTab.RuntimeStatus */]))}`)})` : undefined;
                        markdown.appendMarkdown(`$(${hasErrors ? extensionsIcons_1.errorIcon.id : hasWarnings ? extensionsIcons_1.warningIcon.id : extensionsIcons_1.infoIcon.id}) This extension has reported `);
                        if (errorsLink && messageLink) {
                            markdown.appendMarkdown(`${errorsLink} and ${messageLink}`);
                        }
                        else {
                            markdown.appendMarkdown(`${errorsLink || messageLink}`);
                        }
                        markdown.appendText(`\n`);
                    }
                }
                if (extensionStatus) {
                    if (extensionStatus.icon) {
                        markdown.appendMarkdown(`$(${extensionStatus.icon.id})&nbsp;`);
                    }
                    markdown.appendMarkdown(extensionStatus.message.value);
                    if (this.extension.enablementState === 5 /* EnablementState.DisabledByExtensionDependency */ && this.extension.local) {
                        markdown.appendMarkdown(`&nbsp;[${(0, nls_1.localize)('dependencies', "Show Dependencies")}](${uri_1.URI.parse(`command:extension.open?${encodeURIComponent(JSON.stringify([this.extension.identifier.id, "dependencies" /* ExtensionEditorTab.Dependencies */]))}`)})`);
                    }
                    markdown.appendText(`\n`);
                }
                if (reloadRequiredMessage) {
                    markdown.appendMarkdown(`$(${extensionsIcons_1.infoIcon.id})&nbsp;`);
                    markdown.appendMarkdown(`${reloadRequiredMessage}`);
                    markdown.appendText(`\n`);
                }
                if (preReleaseMessage) {
                    const extensionPreReleaseIcon = this.themeService.getColorTheme().getColor(exports.extensionPreReleaseIconColor);
                    markdown.appendMarkdown(`<span style="color:${extensionPreReleaseIcon ? color_1.Color.Format.CSS.formatHex(extensionPreReleaseIcon) : '#ffffff'};">$(${extensionsIcons_1.preReleaseIcon.id})</span>&nbsp;${preReleaseMessage}`);
                    markdown.appendText(`\n`);
                }
                if (recommendationMessage) {
                    markdown.appendMarkdown(recommendationMessage);
                    markdown.appendText(`\n`);
                }
            }
            return markdown;
        }
        getRecommendationMessage(extension) {
            if (extension.state === 1 /* ExtensionState.Installed */) {
                return undefined;
            }
            const recommendation = this.extensionRecommendationsService.getAllRecommendationsWithReason()[extension.identifier.id.toLowerCase()];
            if (!(recommendation === null || recommendation === void 0 ? void 0 : recommendation.reasonText)) {
                return undefined;
            }
            const bgColor = this.themeService.getColorTheme().getColor(extensionsActions_1.extensionButtonProminentBackground);
            return `<span style="color:${bgColor ? color_1.Color.Format.CSS.formatHex(bgColor) : '#ffffff'};">$(${extensionsIcons_1.starEmptyIcon.id})</span>&nbsp;${recommendation.reasonText}`;
        }
        static getPreReleaseMessage(extension) {
            var _a, _b;
            if (!extension.hasPreReleaseVersion) {
                return undefined;
            }
            if (extension.isBuiltin) {
                return undefined;
            }
            if (((_a = extension.local) === null || _a === void 0 ? void 0 : _a.isPreReleaseVersion) || ((_b = extension.gallery) === null || _b === void 0 ? void 0 : _b.properties.isPreReleaseVersion)) {
                return undefined;
            }
            const preReleaseVersionLink = `[${(0, nls_1.localize)('Show prerelease version', "Pre-Release version")}](${uri_1.URI.parse(`command:workbench.extensions.action.showPreReleaseVersion?${encodeURIComponent(JSON.stringify([extension.identifier.id]))}`)})`;
            return (0, nls_1.localize)('has prerelease', "This extension has a {0} available", preReleaseVersionLink);
        }
    };
    ExtensionHoverWidget = __decorate([
        __param(3, extensions_1.IExtensionsWorkbenchService),
        __param(4, hover_1.IHoverService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, extensionRecommendations_1.IExtensionRecommendationsService),
        __param(7, themeService_1.IThemeService)
    ], ExtensionHoverWidget);
    exports.ExtensionHoverWidget = ExtensionHoverWidget;
    // Rating icon
    exports.extensionRatingIconColor = (0, colorRegistry_1.registerColor)('extensionIcon.starForeground', { light: '#DF6100', dark: '#FF8E00', hcDark: '#FF8E00', hcLight: colorRegistry_1.textLinkForeground }, (0, nls_1.localize)('extensionIconStarForeground', "The icon color for extension ratings."), true);
    exports.extensionVerifiedPublisherIconColor = (0, colorRegistry_1.registerColor)('extensionIcon.verifiedForeground', { dark: colorRegistry_1.textLinkForeground, light: colorRegistry_1.textLinkForeground, hcDark: colorRegistry_1.textLinkForeground, hcLight: colorRegistry_1.textLinkForeground }, (0, nls_1.localize)('extensionIconVerifiedForeground', "The icon color for extension verified publisher."), true);
    exports.extensionPreReleaseIconColor = (0, colorRegistry_1.registerColor)('extensionIcon.preReleaseForeground', { dark: '#1d9271', light: '#1d9271', hcDark: '#1d9271', hcLight: colorRegistry_1.textLinkForeground }, (0, nls_1.localize)('extensionPreReleaseForeground', "The icon color for pre-release extension."), true);
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const extensionRatingIcon = theme.getColor(exports.extensionRatingIconColor);
        if (extensionRatingIcon) {
            collector.addRule(`.extension-ratings .codicon-extensions-star-full, .extension-ratings .codicon-extensions-star-half { color: ${extensionRatingIcon}; }`);
        }
        const fgColor = theme.getColor(extensionsActions_1.extensionButtonProminentForeground);
        if (fgColor) {
            collector.addRule(`.extension-bookmark .recommendation { color: ${fgColor}; }`);
        }
        const bgColor = theme.getColor(extensionsActions_1.extensionButtonProminentBackground);
        if (bgColor) {
            collector.addRule(`.extension-bookmark .recommendation { border-top-color: ${bgColor}; }`);
            collector.addRule(`.monaco-workbench .extension-editor > .header > .details > .recommendation .codicon { color: ${bgColor}; }`);
        }
        const extensionVerifiedPublisherIcon = theme.getColor(exports.extensionVerifiedPublisherIconColor);
        if (extensionVerifiedPublisherIcon) {
            collector.addRule(`${themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.verifiedPublisherIcon)} { color: ${extensionVerifiedPublisherIcon}; }`);
        }
    });
});
//# sourceMappingURL=extensionsWidgets.js.map