/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/base/common/errors"], function (require, exports, types_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Memento = void 0;
    class Memento {
        constructor(id, storageService) {
            this.storageService = storageService;
            this.id = Memento.COMMON_PREFIX + id;
        }
        getMemento(scope, target) {
            // Scope by Workspace
            if (scope === 1 /* StorageScope.WORKSPACE */) {
                let workspaceMemento = Memento.workspaceMementos.get(this.id);
                if (!workspaceMemento) {
                    workspaceMemento = new ScopedMemento(this.id, scope, target, this.storageService);
                    Memento.workspaceMementos.set(this.id, workspaceMemento);
                }
                return workspaceMemento.getMemento();
            }
            // Scope Global
            let globalMemento = Memento.globalMementos.get(this.id);
            if (!globalMemento) {
                globalMemento = new ScopedMemento(this.id, scope, target, this.storageService);
                Memento.globalMementos.set(this.id, globalMemento);
            }
            return globalMemento.getMemento();
        }
        saveMemento() {
            // Workspace
            const workspaceMemento = Memento.workspaceMementos.get(this.id);
            if (workspaceMemento) {
                workspaceMemento.save();
            }
            // Global
            const globalMemento = Memento.globalMementos.get(this.id);
            if (globalMemento) {
                globalMemento.save();
            }
        }
        static clear(scope) {
            // Workspace
            if (scope === 1 /* StorageScope.WORKSPACE */) {
                Memento.workspaceMementos.clear();
            }
            // Global
            if (scope === 0 /* StorageScope.GLOBAL */) {
                Memento.globalMementos.clear();
            }
        }
    }
    exports.Memento = Memento;
    Memento.globalMementos = new Map();
    Memento.workspaceMementos = new Map();
    Memento.COMMON_PREFIX = 'memento/';
    class ScopedMemento {
        constructor(id, scope, target, storageService) {
            this.id = id;
            this.scope = scope;
            this.target = target;
            this.storageService = storageService;
            this.mementoObj = this.load();
        }
        getMemento() {
            return this.mementoObj;
        }
        load() {
            const memento = this.storageService.get(this.id, this.scope);
            if (memento) {
                try {
                    return JSON.parse(memento);
                }
                catch (error) {
                    // Seeing reports from users unable to open editors
                    // from memento parsing exceptions. Log the contents
                    // to diagnose further
                    // https://github.com/microsoft/vscode/issues/102251
                    (0, errors_1.onUnexpectedError)(`[memento]: failed to parse contents: ${error} (id: ${this.id}, scope: ${this.scope}, contents: ${memento})`);
                }
            }
            return {};
        }
        save() {
            if (!(0, types_1.isEmptyObject)(this.mementoObj)) {
                this.storageService.store(this.id, JSON.stringify(this.mementoObj), this.scope, this.target);
            }
            else {
                this.storageService.remove(this.id, this.scope);
            }
        }
    }
});
//# sourceMappingURL=memento.js.map