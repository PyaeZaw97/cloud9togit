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
define(["require", "exports", "vs/nls", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/scm/common/scm", "vs/platform/instantiation/common/instantiation", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/themeService", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/workbench/common/views", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/css!./media/scm"], function (require, exports, nls_1, telemetry_1, scm_1, instantiation_1, contextView_1, themeService_1, storage_1, configuration_1, layoutService_1, extensions_1, workspace_1, views_1, viewPaneContainer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCMViewPaneContainer = void 0;
    let SCMViewPaneContainer = class SCMViewPaneContainer extends viewPaneContainer_1.ViewPaneContainer {
        constructor(layoutService, telemetryService, instantiationService, contextMenuService, themeService, storageService, configurationService, extensionService, contextService, viewDescriptorService) {
            super(scm_1.VIEWLET_ID, { mergeViewWithContainerWhenSingleView: true }, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService);
        }
        create(parent) {
            super.create(parent);
            parent.classList.add('scm-viewlet');
        }
        getOptimalWidth() {
            return 400;
        }
        getTitle() {
            return (0, nls_1.localize)('source control', "Source Control");
        }
    };
    SCMViewPaneContainer = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, themeService_1.IThemeService),
        __param(5, storage_1.IStorageService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, extensions_1.IExtensionService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, views_1.IViewDescriptorService)
    ], SCMViewPaneContainer);
    exports.SCMViewPaneContainer = SCMViewPaneContainer;
});
//# sourceMappingURL=scmViewPaneContainer.js.map