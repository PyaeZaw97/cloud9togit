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
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/common/views", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/layout/browser/layoutService"], function (require, exports, nls_1, configuration_1, contextView_1, instantiation_1, storage_1, telemetry_1, themeService_1, workspace_1, viewPaneContainer_1, views_1, extensions_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingViewPaneContainer = void 0;
    let TestingViewPaneContainer = class TestingViewPaneContainer extends viewPaneContainer_1.ViewPaneContainer {
        constructor(layoutService, telemetryService, instantiationService, contextMenuService, themeService, storageService, configurationService, extensionService, contextService, viewDescriptorService) {
            super("workbench.view.extension.test" /* Testing.ViewletId */, { mergeViewWithContainerWhenSingleView: true }, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService);
        }
        create(parent) {
            super.create(parent);
            parent.classList.add('testing-view-pane');
        }
        getOptimalWidth() {
            return 400;
        }
        getTitle() {
            return (0, nls_1.localize)('testing', "Testing");
        }
    };
    TestingViewPaneContainer = __decorate([
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
    ], TestingViewPaneContainer);
    exports.TestingViewPaneContainer = TestingViewPaneContainer;
});
//# sourceMappingURL=testingViewPaneContainer.js.map