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
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/panecomposite", "vs/workbench/browser/parts/panel/panelPart", "vs/workbench/common/contextkeys", "vs/workbench/common/theme", "vs/workbench/common/views", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/actions", "vs/workbench/browser/parts/auxiliarybar/auxiliaryBarActions", "vs/base/common/types", "vs/workbench/browser/actions/layoutActions", "vs/platform/commands/common/commands", "vs/css!./media/auxiliaryBarPart"], function (require, exports, nls_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, notification_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, panecomposite_1, panelPart_1, contextkeys_1, theme_1, views_1, extensions_1, layoutService_1, actions_1, auxiliaryBarActions_1, types_1, layoutActions_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuxiliaryBarPart = void 0;
    let AuxiliaryBarPart = class AuxiliaryBarPart extends panelPart_1.BasePanelPart {
        constructor(notificationService, storageService, telemetryService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService, commandService) {
            super(notificationService, storageService, telemetryService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService, "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */, AuxiliaryBarPart.activePanelSettingsKey, AuxiliaryBarPart.pinnedPanelsKey, AuxiliaryBarPart.placeholdeViewContainersKey, panecomposite_1.Extensions.Auxiliary, theme_1.SIDE_BAR_BACKGROUND, 2 /* ViewContainerLocation.AuxiliaryBar */, contextkeys_1.ActiveAuxiliaryContext.bindTo(contextKeyService), contextkeys_1.AuxiliaryBarFocusContext.bindTo(contextKeyService), {
                useIcons: true,
                hasTitle: true,
                borderWidth: () => (this.getColor(theme_1.SIDE_BAR_BORDER) || this.getColor(colorRegistry_1.contrastBorder)) ? 1 : 0,
            });
            this.commandService = commandService;
            // Use the side bar dimensions
            this.minimumWidth = 170;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            this.minimumHeight = 0;
            this.maximumHeight = Number.POSITIVE_INFINITY;
            this.priority = 1 /* LayoutPriority.Low */;
        }
        updateStyles() {
            super.updateStyles();
            const container = (0, types_1.assertIsDefined)(this.getContainer());
            const borderColor = this.getColor(theme_1.SIDE_BAR_BORDER) || this.getColor(colorRegistry_1.contrastBorder);
            const isPositionLeft = this.layoutService.getSideBarPosition() === 1 /* Position.RIGHT */;
            container.style.borderLeftColor = borderColor !== null && borderColor !== void 0 ? borderColor : '';
            container.style.borderRightColor = borderColor !== null && borderColor !== void 0 ? borderColor : '';
            container.style.borderLeftStyle = borderColor && !isPositionLeft ? 'solid' : 'none';
            container.style.borderRightStyle = borderColor && isPositionLeft ? 'solid' : 'none';
            container.style.borderLeftWidth = borderColor && !isPositionLeft ? '1px' : '0px';
            container.style.borderRightWidth = borderColor && isPositionLeft ? '1px' : '0px';
        }
        getActivityHoverOptions() {
            return {
                position: () => 2 /* HoverPosition.BELOW */
            };
        }
        fillExtraContextMenuActions(actions) {
            const currentPositionRight = this.layoutService.getSideBarPosition() === 0 /* Position.LEFT */;
            actions.push(...[
                new actions_1.Separator(),
                (0, actions_1.toAction)({
                    id: layoutActions_1.ToggleSidebarPositionAction.ID, label: currentPositionRight ? (0, nls_1.localize)('move second side bar left', "Move Secondary Side Bar Left") : (0, nls_1.localize)('move second side bar right', "Move Secondary Side Bar Right"), run: () => this.commandService.executeCommand(layoutActions_1.ToggleSidebarPositionAction.ID)
                }),
                this.instantiationService.createInstance(auxiliaryBarActions_1.ToggleAuxiliaryBarAction, auxiliaryBarActions_1.ToggleAuxiliaryBarAction.ID, (0, nls_1.localize)('hideAuxiliaryBar', "Hide Secondary Side Bar"))
            ]);
        }
        toJSON() {
            return {
                type: "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */
            };
        }
    };
    AuxiliaryBarPart.activePanelSettingsKey = 'workbench.auxiliarybar.activepanelid';
    AuxiliaryBarPart.pinnedPanelsKey = 'workbench.auxiliarybar.pinnedPanels';
    AuxiliaryBarPart.placeholdeViewContainersKey = 'workbench.auxiliarybar.placeholderPanels';
    AuxiliaryBarPart = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, storage_1.IStorageService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, themeService_1.IThemeService),
        __param(8, views_1.IViewDescriptorService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, extensions_1.IExtensionService),
        __param(11, commands_1.ICommandService)
    ], AuxiliaryBarPart);
    exports.AuxiliaryBarPart = AuxiliaryBarPart;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        // Auxiliary Bar Background: since panels can host editors, we apply a background rule if the panel background
        // color is different from the editor background color. This is a bit of a hack though. The better way
        // would be to have a way to push the background color onto each editor widget itself somehow.
        const auxiliaryBarBackground = theme.getColor(theme_1.SIDE_BAR_BACKGROUND);
        if (auxiliaryBarBackground && auxiliaryBarBackground !== theme.getColor(colorRegistry_1.editorBackground)) {
            collector.addRule(`
			.monaco-workbench .part.auxiliarybar > .content .monaco-editor,
			.monaco-workbench .part.auxiliarybar > .content .monaco-editor .margin,
			.monaco-workbench .part.auxiliarybar > .content .monaco-editor .monaco-editor-background {
				background-color: ${auxiliaryBarBackground};
			}
		`);
        }
        // Title Active
        const titleActive = theme.getColor(theme_1.SIDE_BAR_TITLE_FOREGROUND);
        if (titleActive) {
            collector.addRule(`
		.monaco-workbench .part.auxiliarybar > .title > .panel-switcher-container > .monaco-action-bar .action-item:hover .action-label {
			color: ${titleActive} !important;
		}
		`);
            collector.addRule(`
		.monaco-workbench .part.auxiliarybar > .title > .panel-switcher-container > .monaco-action-bar .action-item:focus .action-label {
			color: ${titleActive} !important;
		}
		`);
        }
        // Styling with Outline color (e.g. high contrast theme)
        const outline = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (outline) {
            collector.addRule(`
			.monaco-workbench .part.auxiliarybar > .title > .panel-switcher-container > .monaco-action-bar .action-item.checked .action-label,
			.monaco-workbench .part.auxiliarybar > .title > .panel-switcher-container > .monaco-action-bar .action-item:hover .action-label {
				outline-color: ${outline};
				outline-width: 1px;
				outline-style: solid;
				border-bottom: none;
				outline-offset: -2px;
			}

			.monaco-workbench .part.auxiliarybar > .title > .panel-switcher-container > .monaco-action-bar .action-item:not(.checked):hover .action-label {
				outline-style: dashed;
			}
		`);
        }
        // const inputBorder = theme.getColor(PANEL_INPUT_BORDER);
        // if (inputBorder) {
        // 	collector.addRule(`
        // 		.monaco-workbench .part.auxiliarybar .monaco-inputbox {
        // 			border-color: ${inputBorder}
        // 		}
        // 	`);
        // }
    });
});
//# sourceMappingURL=auxiliaryBarPart.js.map