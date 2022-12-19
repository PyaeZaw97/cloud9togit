/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/contrib/hover/browser/hoverTypes", "vs/editor/contrib/inlayHints/browser/inlayHintsController", "vs/editor/contrib/inlayHints/browser/inlayHintsHover"], function (require, exports, editorExtensions_1, hoverTypes_1, inlayHintsController_1, inlayHintsHover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, editorExtensions_1.registerEditorContribution)(inlayHintsController_1.InlayHintsController.ID, inlayHintsController_1.InlayHintsController);
    hoverTypes_1.HoverParticipantRegistry.register(inlayHintsHover_1.InlayHintsHover);
});
//# sourceMappingURL=inlayHintsContribution.js.map