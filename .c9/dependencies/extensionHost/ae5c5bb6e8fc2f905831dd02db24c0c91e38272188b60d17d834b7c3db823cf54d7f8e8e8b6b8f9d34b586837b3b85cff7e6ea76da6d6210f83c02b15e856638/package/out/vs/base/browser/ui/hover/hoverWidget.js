/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/lifecycle", "vs/css!./hover"], function (require, exports, dom, keyboardEvent_1, scrollableElement_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoverAction = exports.HoverWidget = exports.HoverPosition = void 0;
    const $ = dom.$;
    var HoverPosition;
    (function (HoverPosition) {
        HoverPosition[HoverPosition["LEFT"] = 0] = "LEFT";
        HoverPosition[HoverPosition["RIGHT"] = 1] = "RIGHT";
        HoverPosition[HoverPosition["BELOW"] = 2] = "BELOW";
        HoverPosition[HoverPosition["ABOVE"] = 3] = "ABOVE";
    })(HoverPosition = exports.HoverPosition || (exports.HoverPosition = {}));
    class HoverWidget extends lifecycle_1.Disposable {
        constructor() {
            super();
            this.containerDomNode = document.createElement('div');
            this.containerDomNode.className = 'monaco-hover';
            this.containerDomNode.tabIndex = 0;
            this.containerDomNode.setAttribute('role', 'tooltip');
            this.contentsDomNode = document.createElement('div');
            this.contentsDomNode.className = 'monaco-hover-content';
            this.scrollbar = this._register(new scrollableElement_1.DomScrollableElement(this.contentsDomNode, {
                consumeMouseWheelIfScrollbarIsNeeded: true
            }));
            this.containerDomNode.appendChild(this.scrollbar.getDomNode());
        }
        onContentsChanged() {
            this.scrollbar.scanDomNode();
        }
    }
    exports.HoverWidget = HoverWidget;
    class HoverAction extends lifecycle_1.Disposable {
        constructor(parent, actionOptions, keybindingLabel) {
            super();
            this.actionContainer = dom.append(parent, $('div.action-container'));
            this.actionContainer.setAttribute('tabindex', '0');
            this.action = dom.append(this.actionContainer, $('a.action'));
            this.action.setAttribute('role', 'button');
            if (actionOptions.iconClass) {
                dom.append(this.action, $(`span.icon.${actionOptions.iconClass}`));
            }
            const label = dom.append(this.action, $('span'));
            label.textContent = keybindingLabel ? `${actionOptions.label} (${keybindingLabel})` : actionOptions.label;
            this._register(dom.addDisposableListener(this.actionContainer, dom.EventType.CLICK, e => {
                e.stopPropagation();
                e.preventDefault();
                actionOptions.run(this.actionContainer);
            }));
            this._register(dom.addDisposableListener(this.actionContainer, dom.EventType.KEY_UP, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* KeyCode.Enter */)) {
                    e.stopPropagation();
                    e.preventDefault();
                    actionOptions.run(this.actionContainer);
                }
            }));
            this.setEnabled(true);
        }
        static render(parent, actionOptions, keybindingLabel) {
            return new HoverAction(parent, actionOptions, keybindingLabel);
        }
        setEnabled(enabled) {
            if (enabled) {
                this.actionContainer.classList.remove('disabled');
                this.actionContainer.removeAttribute('aria-disabled');
            }
            else {
                this.actionContainer.classList.add('disabled');
                this.actionContainer.setAttribute('aria-disabled', 'true');
            }
        }
    }
    exports.HoverAction = HoverAction;
});
//# sourceMappingURL=hoverWidget.js.map