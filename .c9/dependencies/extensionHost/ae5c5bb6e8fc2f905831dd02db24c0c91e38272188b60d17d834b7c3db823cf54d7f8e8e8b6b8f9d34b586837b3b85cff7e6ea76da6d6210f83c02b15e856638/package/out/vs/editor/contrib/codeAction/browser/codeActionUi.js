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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/editor/contrib/message/browser/messageController", "vs/platform/instantiation/common/instantiation", "./codeActionMenu", "./lightBulbWidget"], function (require, exports, errors_1, lazy_1, lifecycle_1, messageController_1, instantiation_1, codeActionMenu_1, lightBulbWidget_1) {
    "use strict";
    var _CodeActionUi_disposed;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeActionUi = void 0;
    let CodeActionUi = class CodeActionUi extends lifecycle_1.Disposable {
        constructor(_editor, quickFixActionId, preferredFixActionId, delegate, instantiationService) {
            super();
            this._editor = _editor;
            this.delegate = delegate;
            this._activeCodeActions = this._register(new lifecycle_1.MutableDisposable());
            _CodeActionUi_disposed.set(this, false);
            this._codeActionWidget = new lazy_1.Lazy(() => {
                return this._register(instantiationService.createInstance(codeActionMenu_1.CodeActionMenu, this._editor, {
                    onSelectCodeAction: async (action) => {
                        this.delegate.applyCodeAction(action, /* retrigger */ true);
                    }
                }));
            });
            this._lightBulbWidget = new lazy_1.Lazy(() => {
                const widget = this._register(instantiationService.createInstance(lightBulbWidget_1.LightBulbWidget, this._editor, quickFixActionId, preferredFixActionId));
                this._register(widget.onClick(e => this.showCodeActionList(e.trigger, e.actions, e, { includeDisabledActions: false })));
                return widget;
            });
        }
        dispose() {
            __classPrivateFieldSet(this, _CodeActionUi_disposed, true, "f");
            super.dispose();
        }
        async update(newState) {
            var _a, _b, _c, _d, _e;
            if (newState.type !== 1 /* CodeActionsState.Type.Triggered */) {
                (_a = this._lightBulbWidget.rawValue) === null || _a === void 0 ? void 0 : _a.hide();
                return;
            }
            let actions;
            try {
                actions = await newState.actions;
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
                return;
            }
            if (__classPrivateFieldGet(this, _CodeActionUi_disposed, "f")) {
                return;
            }
            this._lightBulbWidget.getValue().update(actions, newState.trigger, newState.position);
            if (newState.trigger.type === 1 /* CodeActionTriggerType.Invoke */) {
                if ((_b = newState.trigger.filter) === null || _b === void 0 ? void 0 : _b.include) { // Triggered for specific scope
                    // Check to see if we want to auto apply.
                    const validActionToApply = this.tryGetValidActionToApply(newState.trigger, actions);
                    if (validActionToApply) {
                        try {
                            this._lightBulbWidget.getValue().hide();
                            await this.delegate.applyCodeAction(validActionToApply, false);
                        }
                        finally {
                            actions.dispose();
                        }
                        return;
                    }
                    // Check to see if there is an action that we would have applied were it not invalid
                    if (newState.trigger.context) {
                        const invalidAction = this.getInvalidActionThatWouldHaveBeenApplied(newState.trigger, actions);
                        if (invalidAction && invalidAction.action.disabled) {
                            (_c = messageController_1.MessageController.get(this._editor)) === null || _c === void 0 ? void 0 : _c.showMessage(invalidAction.action.disabled, newState.trigger.context.position);
                            actions.dispose();
                            return;
                        }
                    }
                }
                const includeDisabledActions = !!((_d = newState.trigger.filter) === null || _d === void 0 ? void 0 : _d.include);
                if (newState.trigger.context) {
                    if (!actions.allActions.length || !includeDisabledActions && !actions.validActions.length) {
                        (_e = messageController_1.MessageController.get(this._editor)) === null || _e === void 0 ? void 0 : _e.showMessage(newState.trigger.context.notAvailableMessage, newState.trigger.context.position);
                        this._activeCodeActions.value = actions;
                        actions.dispose();
                        return;
                    }
                }
                this._activeCodeActions.value = actions;
                this._codeActionWidget.getValue().show(newState.trigger, actions, newState.position, { includeDisabledActions });
            }
            else {
                // auto magically triggered
                if (this._codeActionWidget.getValue().isVisible) {
                    // TODO: Figure out if we should update the showing menu?
                    actions.dispose();
                }
                else {
                    this._activeCodeActions.value = actions;
                }
            }
        }
        getInvalidActionThatWouldHaveBeenApplied(trigger, actions) {
            if (!actions.allActions.length) {
                return undefined;
            }
            if ((trigger.autoApply === "first" /* CodeActionAutoApply.First */ && actions.validActions.length === 0)
                || (trigger.autoApply === "ifSingle" /* CodeActionAutoApply.IfSingle */ && actions.allActions.length === 1)) {
                return actions.allActions.find(({ action }) => action.disabled);
            }
            return undefined;
        }
        tryGetValidActionToApply(trigger, actions) {
            if (!actions.validActions.length) {
                return undefined;
            }
            if ((trigger.autoApply === "first" /* CodeActionAutoApply.First */ && actions.validActions.length > 0)
                || (trigger.autoApply === "ifSingle" /* CodeActionAutoApply.IfSingle */ && actions.validActions.length === 1)) {
                return actions.validActions[0];
            }
            return undefined;
        }
        async showCodeActionList(trigger, actions, at, options) {
            this._codeActionWidget.getValue().show(trigger, actions, at, options);
        }
    };
    _CodeActionUi_disposed = new WeakMap();
    CodeActionUi = __decorate([
        __param(4, instantiation_1.IInstantiationService)
    ], CodeActionUi);
    exports.CodeActionUi = CodeActionUi;
});
//# sourceMappingURL=codeActionUi.js.map