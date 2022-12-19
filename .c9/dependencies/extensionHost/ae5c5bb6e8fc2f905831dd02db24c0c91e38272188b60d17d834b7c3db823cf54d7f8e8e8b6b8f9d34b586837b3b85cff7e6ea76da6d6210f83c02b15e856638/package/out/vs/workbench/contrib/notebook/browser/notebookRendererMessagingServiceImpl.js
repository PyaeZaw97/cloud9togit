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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/services/extensions/common/extensions"], function (require, exports, event_1, lifecycle_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookRendererMessagingService = void 0;
    let NotebookRendererMessagingService = class NotebookRendererMessagingService extends lifecycle_1.Disposable {
        constructor(extensionService) {
            super();
            this.extensionService = extensionService;
            /**
             * Activation promises. Maps renderer IDs to a queue of messages that should
             * be sent once activation finishes, or undefined if activation is complete.
             */
            this.activations = new Map();
            this.scopedMessaging = new Map();
            this.postMessageEmitter = this._register(new event_1.Emitter());
            this.onShouldPostMessage = this.postMessageEmitter.event;
        }
        /** @inheritdoc */
        receiveMessage(editorId, rendererId, message) {
            var _a, _b, _c;
            if (editorId === undefined) {
                const sends = [...this.scopedMessaging.values()].map(e => { var _a; return (_a = e.receiveMessageHandler) === null || _a === void 0 ? void 0 : _a.call(e, rendererId, message); });
                return Promise.all(sends).then(s => s.some(s => !!s));
            }
            return (_c = (_b = (_a = this.scopedMessaging.get(editorId)) === null || _a === void 0 ? void 0 : _a.receiveMessageHandler) === null || _b === void 0 ? void 0 : _b.call(_a, rendererId, message)) !== null && _c !== void 0 ? _c : Promise.resolve(false);
        }
        /** @inheritdoc */
        prepare(rendererId) {
            if (this.activations.has(rendererId)) {
                return;
            }
            const queue = [];
            this.activations.set(rendererId, queue);
            this.extensionService.activateByEvent(`onRenderer:${rendererId}`).then(() => {
                for (const message of queue) {
                    this.postMessageEmitter.fire(message);
                }
                this.activations.set(rendererId, undefined);
            });
        }
        /** @inheritdoc */
        getScoped(editorId) {
            const existing = this.scopedMessaging.get(editorId);
            if (existing) {
                return existing;
            }
            const messaging = {
                postMessage: (rendererId, message) => this.postMessage(editorId, rendererId, message),
                dispose: () => this.scopedMessaging.delete(editorId),
            };
            this.scopedMessaging.set(editorId, messaging);
            return messaging;
        }
        postMessage(editorId, rendererId, message) {
            if (!this.activations.has(rendererId)) {
                this.prepare(rendererId);
            }
            const activation = this.activations.get(rendererId);
            const toSend = { rendererId, editorId, message };
            if (activation === undefined) {
                this.postMessageEmitter.fire(toSend);
            }
            else {
                activation.push(toSend);
            }
        }
    };
    NotebookRendererMessagingService = __decorate([
        __param(0, extensions_1.IExtensionService)
    ], NotebookRendererMessagingService);
    exports.NotebookRendererMessagingService = NotebookRendererMessagingService;
});
//# sourceMappingURL=notebookRendererMessagingServiceImpl.js.map