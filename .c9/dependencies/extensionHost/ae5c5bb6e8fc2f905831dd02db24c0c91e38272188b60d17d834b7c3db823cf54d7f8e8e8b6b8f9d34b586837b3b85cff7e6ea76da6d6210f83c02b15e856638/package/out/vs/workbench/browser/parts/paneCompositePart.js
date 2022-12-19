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
define(["require", "exports", "vs/base/common/event", "vs/base/common/types", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/activitybar/activitybarPart", "vs/workbench/browser/parts/auxiliarybar/auxiliaryBarPart", "vs/workbench/browser/parts/panel/panelPart", "vs/workbench/browser/parts/sidebar/sidebarPart", "vs/workbench/common/views", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/common/lifecycle"], function (require, exports, event_1, types_1, extensions_1, instantiation_1, activitybarPart_1, auxiliaryBarPart_1, panelPart_1, sidebarPart_1, views_1, panecomposite_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PaneCompositeParts = void 0;
    let PaneCompositeParts = class PaneCompositeParts extends lifecycle_1.Disposable {
        constructor(instantiationService) {
            super();
            this.paneCompositeParts = new Map();
            this.paneCompositeSelectorParts = new Map();
            const panelPart = instantiationService.createInstance(panelPart_1.PanelPart);
            const sideBarPart = instantiationService.createInstance(sidebarPart_1.SidebarPart);
            const auxiliaryBarPart = instantiationService.createInstance(auxiliaryBarPart_1.AuxiliaryBarPart);
            const activityBarPart = instantiationService.createInstance(activitybarPart_1.ActivitybarPart, sideBarPart);
            this.paneCompositeParts.set(1 /* ViewContainerLocation.Panel */, panelPart);
            this.paneCompositeParts.set(0 /* ViewContainerLocation.Sidebar */, sideBarPart);
            this.paneCompositeParts.set(2 /* ViewContainerLocation.AuxiliaryBar */, auxiliaryBarPart);
            this.paneCompositeSelectorParts.set(1 /* ViewContainerLocation.Panel */, panelPart);
            this.paneCompositeSelectorParts.set(0 /* ViewContainerLocation.Sidebar */, activityBarPart);
            this.paneCompositeSelectorParts.set(2 /* ViewContainerLocation.AuxiliaryBar */, auxiliaryBarPart);
            const eventDisposables = this._register(new lifecycle_1.DisposableStore());
            this.onDidPaneCompositeOpen = event_1.Event.any(...views_1.ViewContainerLocations.map(loc => event_1.Event.map(this.paneCompositeParts.get(loc).onDidPaneCompositeOpen, composite => { return { composite, viewContainerLocation: loc }; }, eventDisposables)));
            this.onDidPaneCompositeClose = event_1.Event.any(...views_1.ViewContainerLocations.map(loc => event_1.Event.map(this.paneCompositeParts.get(loc).onDidPaneCompositeClose, composite => { return { composite, viewContainerLocation: loc }; }, eventDisposables)));
        }
        openPaneComposite(id, viewContainerLocation, focus) {
            return this.getPartByLocation(viewContainerLocation).openPaneComposite(id, focus);
        }
        getActivePaneComposite(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getActivePaneComposite();
        }
        getPaneComposite(id, viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getPaneComposite(id);
        }
        getPaneComposites(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getPaneComposites();
        }
        getPinnedPaneCompositeIds(viewContainerLocation) {
            return this.getSelectorPartByLocation(viewContainerLocation).getPinnedPaneCompositeIds();
        }
        getVisiblePaneCompositeIds(viewContainerLocation) {
            return this.getSelectorPartByLocation(viewContainerLocation).getVisiblePaneCompositeIds();
        }
        getProgressIndicator(id, viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getProgressIndicator(id);
        }
        hideActivePaneComposite(viewContainerLocation) {
            this.getPartByLocation(viewContainerLocation).hideActivePaneComposite();
        }
        getLastActivePaneCompositeId(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getLastActivePaneCompositeId();
        }
        showActivity(id, viewContainerLocation, badge, clazz, priority) {
            return this.getSelectorPartByLocation(viewContainerLocation).showActivity(id, badge, clazz, priority);
        }
        getPartByLocation(viewContainerLocation) {
            return (0, types_1.assertIsDefined)(this.paneCompositeParts.get(viewContainerLocation));
        }
        getSelectorPartByLocation(viewContainerLocation) {
            return (0, types_1.assertIsDefined)(this.paneCompositeSelectorParts.get(viewContainerLocation));
        }
    };
    PaneCompositeParts = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], PaneCompositeParts);
    exports.PaneCompositeParts = PaneCompositeParts;
    (0, extensions_1.registerSingleton)(panecomposite_1.IPaneCompositePartService, PaneCompositeParts);
});
//# sourceMappingURL=paneCompositePart.js.map