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
define(["require", "exports", "vs/workbench/services/statusbar/browser/statusbar", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/lifecycle", "vs/base/common/codicons"], function (require, exports, statusbar_1, extHost_protocol_1, extHostCustomers_1, lifecycle_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadStatusBar = void 0;
    let MainThreadStatusBar = class MainThreadStatusBar {
        constructor(_extHostContext, statusbarService) {
            this.statusbarService = statusbarService;
            this.entries = new Map();
        }
        dispose() {
            this.entries.forEach(entry => entry.accessor.dispose());
            this.entries.clear();
        }
        $setEntry(entryId, id, name, text, tooltip, command, color, backgroundColor, alignLeft, priority, accessibilityInformation) {
            // if there are icons in the text use the tooltip for the aria label
            let ariaLabel;
            let role = undefined;
            if (accessibilityInformation) {
                ariaLabel = accessibilityInformation.label;
                role = accessibilityInformation.role;
            }
            else {
                ariaLabel = (0, codicons_1.getCodiconAriaLabel)(text);
                if (tooltip) {
                    const tooltipString = typeof tooltip === 'string' ? tooltip : tooltip.value;
                    ariaLabel += `, ${tooltipString}`;
                }
            }
            const entry = { name, text, tooltip, command, color, backgroundColor, ariaLabel, role };
            if (typeof priority === 'undefined') {
                priority = 0;
            }
            const alignment = alignLeft ? 0 /* StatusbarAlignment.LEFT */ : 1 /* StatusbarAlignment.RIGHT */;
            // Reset existing entry if alignment or priority changed
            let existingEntry = this.entries.get(entryId);
            if (existingEntry && (existingEntry.alignment !== alignment || existingEntry.priority !== priority)) {
                (0, lifecycle_1.dispose)(existingEntry.accessor);
                this.entries.delete(entryId);
                existingEntry = undefined;
            }
            // Create new entry if not existing
            if (!existingEntry) {
                this.entries.set(entryId, { accessor: this.statusbarService.addEntry(entry, id, alignment, priority), alignment, priority });
            }
            // Otherwise update
            else {
                existingEntry.accessor.update(entry);
            }
        }
        $dispose(id) {
            const entry = this.entries.get(id);
            if (entry) {
                (0, lifecycle_1.dispose)(entry.accessor);
                this.entries.delete(id);
            }
        }
    };
    MainThreadStatusBar = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadStatusBar),
        __param(1, statusbar_1.IStatusbarService)
    ], MainThreadStatusBar);
    exports.MainThreadStatusBar = MainThreadStatusBar;
});
//# sourceMappingURL=mainThreadStatusBar.js.map