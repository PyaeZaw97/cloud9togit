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
define(["require", "exports", "vs/platform/issue/electron-sandbox/issue", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/base/browser/browser", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/base/common/process", "vs/platform/product/common/productService", "vs/workbench/services/assignment/common/assignmentService", "vs/workbench/services/authentication/common/authentication", "vs/platform/ipc/electron-sandbox/services", "vs/platform/workspace/common/workspaceTrust"], function (require, exports, issue_1, themeService_1, colorRegistry_1, theme_1, extensionManagement_1, extensionManagement_2, browser_1, environmentService_1, process_1, productService_1, assignmentService_1, authentication_1, services_1, workspaceTrust_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getIssueReporterStyles = exports.WorkbenchIssueService = void 0;
    let WorkbenchIssueService = class WorkbenchIssueService {
        constructor(issueService, themeService, extensionManagementService, extensionEnablementService, environmentService, workspaceTrustManagementService, productService, experimentService, authenticationService) {
            this.issueService = issueService;
            this.themeService = themeService;
            this.extensionManagementService = extensionManagementService;
            this.extensionEnablementService = extensionEnablementService;
            this.environmentService = environmentService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.productService = productService;
            this.experimentService = experimentService;
            this.authenticationService = authenticationService;
        }
        async openReporter(dataOverrides = {}) {
            var _a;
            const extensionData = [];
            try {
                const extensions = await this.extensionManagementService.getInstalled();
                const enabledExtensions = extensions.filter(extension => this.extensionEnablementService.isEnabled(extension) || (dataOverrides.extensionId && extension.identifier.id === dataOverrides.extensionId));
                extensionData.push(...enabledExtensions.map((extension) => {
                    const { manifest } = extension;
                    const manifestKeys = manifest.contributes ? Object.keys(manifest.contributes) : [];
                    const isTheme = !manifest.activationEvents && manifestKeys.length === 1 && manifestKeys[0] === 'themes';
                    const isBuiltin = extension.type === 0 /* ExtensionType.System */;
                    return {
                        name: manifest.name,
                        publisher: manifest.publisher,
                        version: manifest.version,
                        repositoryUrl: manifest.repository && manifest.repository.url,
                        bugsUrl: manifest.bugs && manifest.bugs.url,
                        displayName: manifest.displayName,
                        id: extension.identifier.id,
                        isTheme,
                        isBuiltin,
                    };
                }));
            }
            catch (e) {
                extensionData.push({
                    name: 'Workbench Issue Service',
                    publisher: 'Unknown',
                    version: '0.0.0',
                    repositoryUrl: undefined,
                    bugsUrl: undefined,
                    displayName: `Extensions not loaded: ${e}`,
                    id: 'workbench.issue',
                    isTheme: false,
                    isBuiltin: true
                });
            }
            const experiments = await this.experimentService.getCurrentExperiments();
            let githubAccessToken = '';
            try {
                const githubSessions = await this.authenticationService.getSessions('github');
                const potentialSessions = githubSessions.filter(session => session.scopes.includes('repo'));
                githubAccessToken = (_a = potentialSessions[0]) === null || _a === void 0 ? void 0 : _a.accessToken;
            }
            catch (e) {
                // Ignore
            }
            const theme = this.themeService.getColorTheme();
            const issueReporterData = Object.assign({
                styles: getIssueReporterStyles(theme),
                zoomLevel: (0, browser_1.getZoomLevel)(),
                enabledExtensions: extensionData,
                experiments: experiments === null || experiments === void 0 ? void 0 : experiments.join('\n'),
                restrictedMode: !this.workspaceTrustManagementService.isWorkspaceTrusted(),
                githubAccessToken,
            }, dataOverrides);
            return this.issueService.openReporter(issueReporterData);
        }
        openProcessExplorer() {
            const theme = this.themeService.getColorTheme();
            const data = {
                pid: this.environmentService.mainPid,
                zoomLevel: (0, browser_1.getZoomLevel)(),
                styles: {
                    backgroundColor: getColor(theme, colorRegistry_1.editorBackground),
                    color: getColor(theme, colorRegistry_1.editorForeground),
                    listHoverBackground: getColor(theme, colorRegistry_1.listHoverBackground),
                    listHoverForeground: getColor(theme, colorRegistry_1.listHoverForeground),
                    listFocusBackground: getColor(theme, colorRegistry_1.listFocusBackground),
                    listFocusForeground: getColor(theme, colorRegistry_1.listFocusForeground),
                    listFocusOutline: getColor(theme, colorRegistry_1.listFocusOutline),
                    listActiveSelectionBackground: getColor(theme, colorRegistry_1.listActiveSelectionBackground),
                    listActiveSelectionForeground: getColor(theme, colorRegistry_1.listActiveSelectionForeground),
                    listHoverOutline: getColor(theme, colorRegistry_1.activeContrastBorder),
                },
                platform: process_1.platform,
                applicationName: this.productService.applicationName
            };
            return this.issueService.openProcessExplorer(data);
        }
    };
    WorkbenchIssueService = __decorate([
        __param(0, issue_1.IIssueService),
        __param(1, themeService_1.IThemeService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(4, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(5, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(6, productService_1.IProductService),
        __param(7, assignmentService_1.IWorkbenchAssignmentService),
        __param(8, authentication_1.IAuthenticationService)
    ], WorkbenchIssueService);
    exports.WorkbenchIssueService = WorkbenchIssueService;
    function getIssueReporterStyles(theme) {
        return {
            backgroundColor: getColor(theme, theme_1.SIDE_BAR_BACKGROUND),
            color: getColor(theme, colorRegistry_1.foreground),
            textLinkColor: getColor(theme, colorRegistry_1.textLinkForeground),
            textLinkActiveForeground: getColor(theme, colorRegistry_1.textLinkActiveForeground),
            inputBackground: getColor(theme, colorRegistry_1.inputBackground),
            inputForeground: getColor(theme, colorRegistry_1.inputForeground),
            inputBorder: getColor(theme, colorRegistry_1.inputBorder),
            inputActiveBorder: getColor(theme, colorRegistry_1.inputActiveOptionBorder),
            inputErrorBorder: getColor(theme, colorRegistry_1.inputValidationErrorBorder),
            inputErrorBackground: getColor(theme, colorRegistry_1.inputValidationErrorBackground),
            inputErrorForeground: getColor(theme, colorRegistry_1.inputValidationErrorForeground),
            buttonBackground: getColor(theme, colorRegistry_1.buttonBackground),
            buttonForeground: getColor(theme, colorRegistry_1.buttonForeground),
            buttonHoverBackground: getColor(theme, colorRegistry_1.buttonHoverBackground),
            sliderActiveColor: getColor(theme, colorRegistry_1.scrollbarSliderActiveBackground),
            sliderBackgroundColor: getColor(theme, colorRegistry_1.scrollbarSliderBackground),
            sliderHoverColor: getColor(theme, colorRegistry_1.scrollbarSliderHoverBackground),
        };
    }
    exports.getIssueReporterStyles = getIssueReporterStyles;
    function getColor(theme, key) {
        const color = theme.getColor(key);
        return color ? color.toString() : undefined;
    }
    (0, services_1.registerMainProcessRemoteService)(issue_1.IIssueService, 'issue', { supportsDelayedInstantiation: true });
});
//# sourceMappingURL=issueService.js.map