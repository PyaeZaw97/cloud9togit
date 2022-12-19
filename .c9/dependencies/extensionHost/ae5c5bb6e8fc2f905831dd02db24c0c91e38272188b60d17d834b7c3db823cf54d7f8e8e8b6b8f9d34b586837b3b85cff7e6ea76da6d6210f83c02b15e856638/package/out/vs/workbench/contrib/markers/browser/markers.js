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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/markers/common/markers", "vs/workbench/services/activity/common/activity", "vs/nls", "./constants"], function (require, exports, lifecycle_1, markers_1, activity_1, nls_1, constants_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActivityUpdater = void 0;
    let ActivityUpdater = class ActivityUpdater extends lifecycle_1.Disposable {
        constructor(activityService, markerService) {
            super();
            this.activityService = activityService;
            this.markerService = markerService;
            this.activity = this._register(new lifecycle_1.MutableDisposable());
            this._register(this.markerService.onMarkerChanged(() => this.updateBadge()));
            this.updateBadge();
        }
        updateBadge() {
            const { errors, warnings, infos } = this.markerService.getStatistics();
            const total = errors + warnings + infos;
            const message = (0, nls_1.localize)('totalProblems', 'Total {0} Problems', total);
            this.activity.value = this.activityService.showViewActivity(constants_1.default.MARKERS_VIEW_ID, { badge: new activity_1.NumberBadge(total, () => message) });
        }
    };
    ActivityUpdater = __decorate([
        __param(0, activity_1.IActivityService),
        __param(1, markers_1.IMarkerService)
    ], ActivityUpdater);
    exports.ActivityUpdater = ActivityUpdater;
});
//# sourceMappingURL=markers.js.map