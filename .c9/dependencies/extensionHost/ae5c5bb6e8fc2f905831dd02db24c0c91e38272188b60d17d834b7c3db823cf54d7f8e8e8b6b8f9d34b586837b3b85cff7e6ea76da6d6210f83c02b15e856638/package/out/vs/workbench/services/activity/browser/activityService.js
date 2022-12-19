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
define(["require", "exports", "vs/workbench/services/activity/common/activity", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/workbench/common/views", "vs/workbench/common/activity", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, activity_1, lifecycle_1, extensions_1, views_1, activity_2, event_1, instantiation_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActivityService = void 0;
    let ViewContainerActivityByView = class ViewContainerActivityByView extends lifecycle_1.Disposable {
        constructor(viewId, viewDescriptorService, activityService) {
            super();
            this.viewId = viewId;
            this.viewDescriptorService = viewDescriptorService;
            this.activityService = activityService;
            this.activity = undefined;
            this.activityDisposable = lifecycle_1.Disposable.None;
            this._register(event_1.Event.filter(this.viewDescriptorService.onDidChangeContainer, e => e.views.some(view => view.id === viewId))(() => this.update()));
            this._register(event_1.Event.filter(this.viewDescriptorService.onDidChangeLocation, e => e.views.some(view => view.id === viewId))(() => this.update()));
        }
        setActivity(activity) {
            this.activity = activity;
            this.update();
        }
        clearActivity() {
            this.activity = undefined;
            this.update();
        }
        update() {
            this.activityDisposable.dispose();
            const container = this.viewDescriptorService.getViewContainerByViewId(this.viewId);
            if (container && this.activity) {
                this.activityDisposable = this.activityService.showViewContainerActivity(container.id, this.activity);
            }
        }
        dispose() {
            this.activityDisposable.dispose();
        }
    };
    ViewContainerActivityByView = __decorate([
        __param(1, views_1.IViewDescriptorService),
        __param(2, activity_1.IActivityService)
    ], ViewContainerActivityByView);
    let ActivityService = class ActivityService {
        constructor(paneCompositeService, viewDescriptorService, instantiationService) {
            this.paneCompositeService = paneCompositeService;
            this.viewDescriptorService = viewDescriptorService;
            this.instantiationService = instantiationService;
            this.viewActivities = new Map();
        }
        showViewContainerActivity(viewContainerId, { badge, clazz, priority }) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(viewContainerId);
            if (viewContainer) {
                const location = this.viewDescriptorService.getViewContainerLocation(viewContainer);
                if (location !== null) {
                    return this.paneCompositeService.showActivity(viewContainer.id, location, badge, clazz, priority);
                }
            }
            return lifecycle_1.Disposable.None;
        }
        showViewActivity(viewId, activity) {
            let maybeItem = this.viewActivities.get(viewId);
            if (maybeItem) {
                maybeItem.id++;
            }
            else {
                maybeItem = {
                    id: 1,
                    activity: this.instantiationService.createInstance(ViewContainerActivityByView, viewId)
                };
                this.viewActivities.set(viewId, maybeItem);
            }
            const id = maybeItem.id;
            maybeItem.activity.setActivity(activity);
            const item = maybeItem;
            return (0, lifecycle_1.toDisposable)(() => {
                if (item.id === id) {
                    item.activity.dispose();
                    this.viewActivities.delete(viewId);
                }
            });
        }
        showAccountsActivity({ badge, clazz, priority }) {
            return this.paneCompositeService.showActivity(activity_2.ACCOUNTS_ACTIVITY_ID, 0 /* ViewContainerLocation.Sidebar */, badge, clazz, priority);
        }
        showGlobalActivity({ badge, clazz, priority }) {
            return this.paneCompositeService.showActivity(activity_2.GLOBAL_ACTIVITY_ID, 0 /* ViewContainerLocation.Sidebar */, badge, clazz, priority);
        }
    };
    ActivityService = __decorate([
        __param(0, panecomposite_1.IPaneCompositePartService),
        __param(1, views_1.IViewDescriptorService),
        __param(2, instantiation_1.IInstantiationService)
    ], ActivityService);
    exports.ActivityService = ActivityService;
    (0, extensions_1.registerSingleton)(activity_1.IActivityService, ActivityService, true);
});
//# sourceMappingURL=activityService.js.map