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
define(["require", "exports", "vs/editor/common/services/markerDecorations", "vs/editor/browser/editorExtensions"], function (require, exports, markerDecorations_1, editorExtensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkerDecorationsContribution = void 0;
    let MarkerDecorationsContribution = class MarkerDecorationsContribution {
        constructor(_editor, _markerDecorationsService) {
            // Doesn't do anything, just requires `IMarkerDecorationsService` to make sure it gets instantiated
        }
        dispose() {
        }
    };
    MarkerDecorationsContribution.ID = 'editor.contrib.markerDecorations';
    MarkerDecorationsContribution = __decorate([
        __param(1, markerDecorations_1.IMarkerDecorationsService)
    ], MarkerDecorationsContribution);
    exports.MarkerDecorationsContribution = MarkerDecorationsContribution;
    (0, editorExtensions_1.registerEditorContribution)(MarkerDecorationsContribution.ID, MarkerDecorationsContribution);
});
//# sourceMappingURL=markerDecorations.js.map