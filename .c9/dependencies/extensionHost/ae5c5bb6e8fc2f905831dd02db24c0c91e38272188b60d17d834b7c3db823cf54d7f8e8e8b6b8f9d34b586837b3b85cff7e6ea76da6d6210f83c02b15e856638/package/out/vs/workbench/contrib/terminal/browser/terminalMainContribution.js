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
define(["require", "exports", "vs/base/common/network", "vs/platform/label/common/label", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/workbench/services/editor/common/editorResolverService"], function (require, exports, network_1, label_1, terminal_1, terminalStrings_1, editorResolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalMainContribution = void 0;
    /**
     * The main contribution for the terminal contrib. This contains calls to other components necessary
     * to set up the terminal but don't need to be tracked in the long term (where TerminalService would
     * be more relevant).
     */
    let TerminalMainContribution = class TerminalMainContribution {
        constructor(editorResolverService, labelService, terminalService, terminalEditorService, terminalGroupService) {
            // Register terminal editors
            editorResolverService.registerEditor(`${network_1.Schemas.vscodeTerminal}:/**`, {
                id: terminal_1.terminalEditorId,
                label: terminalStrings_1.terminalStrings.terminal,
                priority: editorResolverService_1.RegisteredEditorPriority.exclusive
            }, {
                canHandleDiff: false,
                canSupportResource: uri => uri.scheme === network_1.Schemas.vscodeTerminal,
                singlePerResource: true
            }, ({ resource, options }) => {
                let instance = terminalService.getInstanceFromResource(resource);
                if (instance) {
                    const sourceGroup = terminalGroupService.getGroupForInstance(instance);
                    if (sourceGroup) {
                        sourceGroup.removeInstance(instance);
                    }
                }
                const resolvedResource = terminalEditorService.resolveResource(instance || resource);
                const editor = terminalEditorService.getInputFromResource(resolvedResource) || { editor: resolvedResource };
                return {
                    editor,
                    options: Object.assign(Object.assign({}, options), { pinned: true, forceReload: true, override: terminal_1.terminalEditorId })
                };
            });
            // Register a resource formatter for terminal URIs
            labelService.registerFormatter({
                scheme: network_1.Schemas.vscodeTerminal,
                formatting: {
                    label: '${path}',
                    separator: ''
                }
            });
        }
    };
    TerminalMainContribution = __decorate([
        __param(0, editorResolverService_1.IEditorResolverService),
        __param(1, label_1.ILabelService),
        __param(2, terminal_1.ITerminalService),
        __param(3, terminal_1.ITerminalEditorService),
        __param(4, terminal_1.ITerminalGroupService)
    ], TerminalMainContribution);
    exports.TerminalMainContribution = TerminalMainContribution;
});
//# sourceMappingURL=terminalMainContribution.js.map