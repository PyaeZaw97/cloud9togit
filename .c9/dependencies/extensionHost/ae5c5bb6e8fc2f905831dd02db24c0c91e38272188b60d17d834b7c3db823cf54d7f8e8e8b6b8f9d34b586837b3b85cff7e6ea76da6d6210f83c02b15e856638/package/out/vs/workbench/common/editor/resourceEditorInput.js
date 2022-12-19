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
define(["require", "exports", "vs/workbench/common/editor/editorInput", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/base/common/resources"], function (require, exports, editorInput_1, files_1, label_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractResourceEditorInput = void 0;
    /**
     * The base class for all editor inputs that open resources.
     */
    let AbstractResourceEditorInput = class AbstractResourceEditorInput extends editorInput_1.EditorInput {
        constructor(resource, preferredResource, labelService, fileService) {
            super();
            this.resource = resource;
            this.labelService = labelService;
            this.fileService = fileService;
            this._name = undefined;
            this._shortDescription = undefined;
            this._mediumDescription = undefined;
            this._longDescription = undefined;
            this._shortTitle = undefined;
            this._mediumTitle = undefined;
            this._longTitle = undefined;
            this._preferredResource = preferredResource || resource;
            this.registerListeners();
        }
        get capabilities() {
            let capabilities = 32 /* EditorInputCapabilities.CanSplitInGroup */;
            if (this.fileService.hasProvider(this.resource)) {
                if (this.fileService.hasCapability(this.resource, 2048 /* FileSystemProviderCapabilities.Readonly */)) {
                    capabilities |= 2 /* EditorInputCapabilities.Readonly */;
                }
            }
            else {
                capabilities |= 4 /* EditorInputCapabilities.Untitled */;
            }
            if (!(capabilities & 2 /* EditorInputCapabilities.Readonly */)) {
                capabilities |= 128 /* EditorInputCapabilities.CanDropIntoEditor */;
            }
            return capabilities;
        }
        get preferredResource() { return this._preferredResource; }
        registerListeners() {
            // Clear our labels on certain label related events
            this._register(this.labelService.onDidChangeFormatters(e => this.onLabelEvent(e.scheme)));
            this._register(this.fileService.onDidChangeFileSystemProviderRegistrations(e => this.onLabelEvent(e.scheme)));
            this._register(this.fileService.onDidChangeFileSystemProviderCapabilities(e => this.onLabelEvent(e.scheme)));
        }
        onLabelEvent(scheme) {
            if (scheme === this._preferredResource.scheme) {
                this.updateLabel();
            }
        }
        updateLabel() {
            // Clear any cached labels from before
            this._name = undefined;
            this._shortDescription = undefined;
            this._mediumDescription = undefined;
            this._longDescription = undefined;
            this._shortTitle = undefined;
            this._mediumTitle = undefined;
            this._longTitle = undefined;
            // Trigger recompute of label
            this._onDidChangeLabel.fire();
        }
        setPreferredResource(preferredResource) {
            if (!(0, resources_1.isEqual)(preferredResource, this._preferredResource)) {
                this._preferredResource = preferredResource;
                this.updateLabel();
            }
        }
        getName() {
            if (typeof this._name !== 'string') {
                this._name = this.labelService.getUriBasenameLabel(this._preferredResource);
            }
            return this._name;
        }
        getDescription(verbosity = 1 /* Verbosity.MEDIUM */) {
            switch (verbosity) {
                case 0 /* Verbosity.SHORT */:
                    return this.shortDescription;
                case 2 /* Verbosity.LONG */:
                    return this.longDescription;
                case 1 /* Verbosity.MEDIUM */:
                default:
                    return this.mediumDescription;
            }
        }
        get shortDescription() {
            if (typeof this._shortDescription !== 'string') {
                this._shortDescription = this.labelService.getUriBasenameLabel((0, resources_1.dirname)(this._preferredResource));
            }
            return this._shortDescription;
        }
        get mediumDescription() {
            if (typeof this._mediumDescription !== 'string') {
                this._mediumDescription = this.labelService.getUriLabel((0, resources_1.dirname)(this._preferredResource), { relative: true });
            }
            return this._mediumDescription;
        }
        get longDescription() {
            if (typeof this._longDescription !== 'string') {
                this._longDescription = this.labelService.getUriLabel((0, resources_1.dirname)(this._preferredResource));
            }
            return this._longDescription;
        }
        get shortTitle() {
            if (typeof this._shortTitle !== 'string') {
                this._shortTitle = this.getName();
            }
            return this._shortTitle;
        }
        get mediumTitle() {
            if (typeof this._mediumTitle !== 'string') {
                this._mediumTitle = this.labelService.getUriLabel(this._preferredResource, { relative: true });
            }
            return this._mediumTitle;
        }
        get longTitle() {
            if (typeof this._longTitle !== 'string') {
                this._longTitle = this.labelService.getUriLabel(this._preferredResource);
            }
            return this._longTitle;
        }
        getTitle(verbosity) {
            switch (verbosity) {
                case 0 /* Verbosity.SHORT */:
                    return this.shortTitle;
                case 2 /* Verbosity.LONG */:
                    return this.longTitle;
                default:
                case 1 /* Verbosity.MEDIUM */:
                    return this.mediumTitle;
            }
        }
    };
    AbstractResourceEditorInput = __decorate([
        __param(2, label_1.ILabelService),
        __param(3, files_1.IFileService)
    ], AbstractResourceEditorInput);
    exports.AbstractResourceEditorInput = AbstractResourceEditorInput;
});
//# sourceMappingURL=resourceEditorInput.js.map