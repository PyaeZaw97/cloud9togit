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
define(["require", "exports", "vs/nls", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/common/editor", "vs/workbench/common/editor/textEditorModel", "vs/workbench/common/editor/diffEditorModel", "vs/workbench/common/editor/textDiffEditorModel", "vs/base/common/types", "vs/workbench/services/editor/common/editorService", "vs/base/common/labels"], function (require, exports, nls_1, sideBySideEditorInput_1, editor_1, textEditorModel_1, diffEditorModel_1, textDiffEditorModel_1, types_1, editorService_1, labels_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorInputSerializer = exports.DiffEditorInput = void 0;
    /**
     * The base editor input for the diff editor. It is made up of two editor inputs, the original version
     * and the modified version.
     */
    let DiffEditorInput = class DiffEditorInput extends sideBySideEditorInput_1.SideBySideEditorInput {
        constructor(preferredName, preferredDescription, original, modified, forceOpenAsBinary, editorService) {
            super(preferredName, preferredDescription, original, modified, editorService);
            this.original = original;
            this.modified = modified;
            this.forceOpenAsBinary = forceOpenAsBinary;
            this.cachedModel = undefined;
            this.labels = this.computeLabels();
        }
        get typeId() {
            return DiffEditorInput.ID;
        }
        get editorId() {
            return this.modified.editorId === this.original.editorId ? this.modified.editorId : undefined;
        }
        get capabilities() {
            let capabilities = super.capabilities;
            // Force description capability depends on labels
            if (this.labels.forceDescription) {
                capabilities |= 64 /* EditorInputCapabilities.ForceDescription */;
            }
            return capabilities;
        }
        computeLabels() {
            var _a, _b, _c, _d, _e, _f;
            // Name
            let name;
            let forceDescription = false;
            if (this.preferredName) {
                name = this.preferredName;
            }
            else {
                const originalName = this.original.getName();
                const modifiedName = this.modified.getName();
                name = (0, nls_1.localize)('sideBySideLabels', "{0} ↔ {1}", originalName, modifiedName);
                // Enforce description when the names are identical
                forceDescription = originalName === modifiedName;
            }
            // Description
            let shortDescription;
            let mediumDescription;
            let longDescription;
            if (this.preferredDescription) {
                shortDescription = this.preferredDescription;
                mediumDescription = this.preferredDescription;
                longDescription = this.preferredDescription;
            }
            else {
                shortDescription = this.computeLabel(this.original.getDescription(0 /* Verbosity.SHORT */), this.modified.getDescription(0 /* Verbosity.SHORT */));
                longDescription = this.computeLabel(this.original.getDescription(2 /* Verbosity.LONG */), this.modified.getDescription(2 /* Verbosity.LONG */));
                // Medium Description: try to be verbose by computing
                // a label that resembles the difference between the two
                const originalMediumDescription = this.original.getDescription(1 /* Verbosity.MEDIUM */);
                const modifiedMediumDescription = this.modified.getDescription(1 /* Verbosity.MEDIUM */);
                if ((typeof originalMediumDescription === 'string' && typeof modifiedMediumDescription === 'string') && // we can only `shorten` when both sides are strings...
                    (originalMediumDescription || modifiedMediumDescription) // ...however never when both sides are empty strings
                ) {
                    const [shortenedOriginalMediumDescription, shortenedModifiedMediumDescription] = (0, labels_1.shorten)([originalMediumDescription, modifiedMediumDescription]);
                    mediumDescription = this.computeLabel(shortenedOriginalMediumDescription, shortenedModifiedMediumDescription);
                }
            }
            // Title
            const shortTitle = this.computeLabel((_a = this.original.getTitle(0 /* Verbosity.SHORT */)) !== null && _a !== void 0 ? _a : this.original.getName(), (_b = this.modified.getTitle(0 /* Verbosity.SHORT */)) !== null && _b !== void 0 ? _b : this.modified.getName(), ' ↔ ');
            const mediumTitle = this.computeLabel((_c = this.original.getTitle(1 /* Verbosity.MEDIUM */)) !== null && _c !== void 0 ? _c : this.original.getName(), (_d = this.modified.getTitle(1 /* Verbosity.MEDIUM */)) !== null && _d !== void 0 ? _d : this.modified.getName(), ' ↔ ');
            const longTitle = this.computeLabel((_e = this.original.getTitle(2 /* Verbosity.LONG */)) !== null && _e !== void 0 ? _e : this.original.getName(), (_f = this.modified.getTitle(2 /* Verbosity.LONG */)) !== null && _f !== void 0 ? _f : this.modified.getName(), ' ↔ ');
            return { name, shortDescription, mediumDescription, longDescription, forceDescription, shortTitle, mediumTitle, longTitle };
        }
        computeLabel(originalLabel, modifiedLabel, separator = ' - ') {
            if (!originalLabel || !modifiedLabel) {
                return undefined;
            }
            if (originalLabel === modifiedLabel) {
                return modifiedLabel;
            }
            return `${originalLabel}${separator}${modifiedLabel}`;
        }
        getName() {
            return this.labels.name;
        }
        getDescription(verbosity = 1 /* Verbosity.MEDIUM */) {
            switch (verbosity) {
                case 0 /* Verbosity.SHORT */:
                    return this.labels.shortDescription;
                case 2 /* Verbosity.LONG */:
                    return this.labels.longDescription;
                case 1 /* Verbosity.MEDIUM */:
                default:
                    return this.labels.mediumDescription;
            }
        }
        getTitle(verbosity) {
            switch (verbosity) {
                case 0 /* Verbosity.SHORT */:
                    return this.labels.shortTitle;
                case 2 /* Verbosity.LONG */:
                    return this.labels.longTitle;
                default:
                case 1 /* Verbosity.MEDIUM */:
                    return this.labels.mediumTitle;
            }
        }
        async resolve() {
            // Create Model - we never reuse our cached model if refresh is true because we cannot
            // decide for the inputs within if the cached model can be reused or not. There may be
            // inputs that need to be loaded again and thus we always recreate the model and dispose
            // the previous one - if any.
            const resolvedModel = await this.createModel();
            if (this.cachedModel) {
                this.cachedModel.dispose();
            }
            this.cachedModel = resolvedModel;
            return this.cachedModel;
        }
        prefersEditorPane(editorPanes) {
            if (this.forceOpenAsBinary) {
                return editorPanes.find(editorPane => editorPane.typeId === editor_1.BINARY_DIFF_EDITOR_ID);
            }
            return editorPanes.find(editorPane => editorPane.typeId === editor_1.TEXT_DIFF_EDITOR_ID);
        }
        async createModel() {
            // Join resolve call over two inputs and build diff editor model
            const [originalEditorModel, modifiedEditorModel] = await Promise.all([
                this.original.resolve(),
                this.modified.resolve()
            ]);
            // If both are text models, return textdiffeditor model
            if (modifiedEditorModel instanceof textEditorModel_1.BaseTextEditorModel && originalEditorModel instanceof textEditorModel_1.BaseTextEditorModel) {
                return new textDiffEditorModel_1.TextDiffEditorModel(originalEditorModel, modifiedEditorModel);
            }
            // Otherwise return normal diff model
            return new diffEditorModel_1.DiffEditorModel((0, types_1.withNullAsUndefined)(originalEditorModel), (0, types_1.withNullAsUndefined)(modifiedEditorModel));
        }
        toUntyped(options) {
            const untyped = super.toUntyped(options);
            if (untyped) {
                return Object.assign(Object.assign({}, untyped), { modified: untyped.primary, original: untyped.secondary });
            }
            return undefined;
        }
        matches(otherInput) {
            if (this === otherInput) {
                return true;
            }
            if (otherInput instanceof DiffEditorInput) {
                return this.modified.matches(otherInput.modified) && this.original.matches(otherInput.original) && otherInput.forceOpenAsBinary === this.forceOpenAsBinary;
            }
            if ((0, editor_1.isResourceDiffEditorInput)(otherInput)) {
                return this.modified.matches(otherInput.modified) && this.original.matches(otherInput.original);
            }
            return false;
        }
        dispose() {
            // Free the diff editor model but do not propagate the dispose() call to the two inputs
            // We never created the two inputs (original and modified) so we can not dispose
            // them without sideeffects.
            if (this.cachedModel) {
                this.cachedModel.dispose();
                this.cachedModel = undefined;
            }
            super.dispose();
        }
    };
    DiffEditorInput.ID = 'workbench.editors.diffEditorInput';
    DiffEditorInput = __decorate([
        __param(5, editorService_1.IEditorService)
    ], DiffEditorInput);
    exports.DiffEditorInput = DiffEditorInput;
    class DiffEditorInputSerializer extends sideBySideEditorInput_1.AbstractSideBySideEditorInputSerializer {
        createEditorInput(instantiationService, name, description, secondaryInput, primaryInput) {
            return instantiationService.createInstance(DiffEditorInput, name, description, secondaryInput, primaryInput, undefined);
        }
    }
    exports.DiffEditorInputSerializer = DiffEditorInputSerializer;
});
//# sourceMappingURL=diffEditorInput.js.map