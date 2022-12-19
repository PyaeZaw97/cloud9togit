/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorModel = void 0;
    /**
     * The editor model is the heavyweight counterpart of editor input. Depending on the editor input, it
     * resolves from a file system retrieve content and may allow for saving it back or reverting it.
     * Editor models are typically cached for some while because they are expensive to construct.
     */
    class EditorModel extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this.disposed = false;
            this.resolved = false;
        }
        /**
         * Causes this model to resolve returning a promise when loading is completed.
         */
        async resolve() {
            this.resolved = true;
        }
        /**
         * Returns whether this model was loaded or not.
         */
        isResolved() {
            return this.resolved;
        }
        /**
         * Find out if this model has been disposed.
         */
        isDisposed() {
            return this.disposed;
        }
        /**
         * Subclasses should implement to free resources that have been claimed through loading.
         */
        dispose() {
            this.disposed = true;
            this._onWillDispose.fire();
            super.dispose();
        }
    }
    exports.EditorModel = EditorModel;
});
//# sourceMappingURL=editorModel.js.map