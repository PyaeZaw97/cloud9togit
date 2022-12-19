/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform"], function (require, exports, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AssignmentFilterProvider = exports.Filters = exports.TargetPopulation = exports.ASSIGNMENT_REFETCH_INTERVAL = exports.ASSIGNMENT_STORAGE_KEY = void 0;
    exports.ASSIGNMENT_STORAGE_KEY = 'VSCode.ABExp.FeatureData';
    exports.ASSIGNMENT_REFETCH_INTERVAL = 0; // no polling
    var TargetPopulation;
    (function (TargetPopulation) {
        TargetPopulation["Team"] = "team";
        TargetPopulation["Internal"] = "internal";
        TargetPopulation["Insiders"] = "insider";
        TargetPopulation["Public"] = "public";
    })(TargetPopulation = exports.TargetPopulation || (exports.TargetPopulation = {}));
    /*
    Based upon the official VSCode currently existing filters in the
    ExP backend for the VSCode cluster.
    https://experimentation.visualstudio.com/Analysis%20and%20Experimentation/_git/AnE.ExP.TAS.TachyonHost.Configuration?path=%2FConfigurations%2Fvscode%2Fvscode.json&version=GBmaster
    "X-MSEdge-Market": "detection.market",
    "X-FD-Corpnet": "detection.corpnet",
    "X-VSCode-AppVersion": "appversion",
    "X-VSCode-Build": "build",
    "X-MSEdge-ClientId": "clientid",
    "X-VSCode-ExtensionName": "extensionname",
    "X-VSCode-TargetPopulation": "targetpopulation",
    "X-VSCode-Language": "language"
    */
    var Filters;
    (function (Filters) {
        /**
         * The market in which the extension is distributed.
         */
        Filters["Market"] = "X-MSEdge-Market";
        /**
         * The corporation network.
         */
        Filters["CorpNet"] = "X-FD-Corpnet";
        /**
         * Version of the application which uses experimentation service.
         */
        Filters["ApplicationVersion"] = "X-VSCode-AppVersion";
        /**
         * Insiders vs Stable.
         */
        Filters["Build"] = "X-VSCode-Build";
        /**
         * Client Id which is used as primary unit for the experimentation.
         */
        Filters["ClientId"] = "X-MSEdge-ClientId";
        /**
         * Extension header.
         */
        Filters["ExtensionName"] = "X-VSCode-ExtensionName";
        /**
         * The language in use by VS Code
         */
        Filters["Language"] = "X-VSCode-Language";
        /**
         * The target population.
         * This is used to separate internal, early preview, GA, etc.
         */
        Filters["TargetPopulation"] = "X-VSCode-TargetPopulation";
    })(Filters = exports.Filters || (exports.Filters = {}));
    class AssignmentFilterProvider {
        constructor(version, appName, machineId, targetPopulation) {
            this.version = version;
            this.appName = appName;
            this.machineId = machineId;
            this.targetPopulation = targetPopulation;
        }
        getFilterValue(filter) {
            switch (filter) {
                case Filters.ApplicationVersion:
                    return this.version; // productService.version
                case Filters.Build:
                    return this.appName; // productService.nameLong
                case Filters.ClientId:
                    return this.machineId;
                case Filters.Language:
                    return platform.language;
                case Filters.ExtensionName:
                    return 'vscode-core'; // always return vscode-core for exp service
                case Filters.TargetPopulation:
                    return this.targetPopulation;
                default:
                    return '';
            }
        }
        getFilters() {
            let filters = new Map();
            let filterValues = Object.values(Filters);
            for (let value of filterValues) {
                filters.set(value, this.getFilterValue(value));
            }
            return filters;
        }
    }
    exports.AssignmentFilterProvider = AssignmentFilterProvider;
});
//# sourceMappingURL=assignment.js.map