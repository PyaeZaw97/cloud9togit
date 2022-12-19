/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/htmlContent", "vs/base/common/iconLabels", "vs/base/common/lifecycle", "vs/base/common/types", "vs/nls"], function (require, exports, dom, async_1, cancellation_1, htmlContent_1, iconLabels_1, lifecycle_1, types_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.setupCustomHover = exports.setupNativeHover = void 0;
    function setupNativeHover(htmlElement, tooltip) {
        if ((0, types_1.isString)(tooltip)) {
            // Icons don't render in the native hover so we strip them out
            htmlElement.title = (0, iconLabels_1.stripIcons)(tooltip);
        }
        else if (tooltip === null || tooltip === void 0 ? void 0 : tooltip.markdownNotSupportedFallback) {
            htmlElement.title = tooltip.markdownNotSupportedFallback;
        }
        else {
            htmlElement.removeAttribute('title');
        }
    }
    exports.setupNativeHover = setupNativeHover;
    class UpdatableHoverWidget {
        constructor(hoverDelegate, target, fadeInAnimation) {
            this.hoverDelegate = hoverDelegate;
            this.target = target;
            this.fadeInAnimation = fadeInAnimation;
        }
        async update(content, focus) {
            var _a;
            if (this._cancellationTokenSource) {
                // there's an computation ongoing, cancel it
                this._cancellationTokenSource.dispose(true);
                this._cancellationTokenSource = undefined;
            }
            if (this.isDisposed) {
                return;
            }
            let resolvedContent;
            if (content === undefined || (0, types_1.isString)(content) || content instanceof HTMLElement) {
                resolvedContent = content;
            }
            else if (!(0, types_1.isFunction)(content.markdown)) {
                resolvedContent = (_a = content.markdown) !== null && _a !== void 0 ? _a : content.markdownNotSupportedFallback;
            }
            else {
                // compute the content, potentially long-running
                // show 'Loading' if no hover is up yet
                if (!this._hoverWidget) {
                    this.show((0, nls_1.localize)('iconLabel.loading', "Loading..."), focus);
                }
                // compute the content
                this._cancellationTokenSource = new cancellation_1.CancellationTokenSource();
                const token = this._cancellationTokenSource.token;
                resolvedContent = await content.markdown(token);
                if (resolvedContent === undefined) {
                    resolvedContent = content.markdownNotSupportedFallback;
                }
                if (this.isDisposed || token.isCancellationRequested) {
                    // either the widget has been closed in the meantime
                    // or there has been a new call to `update`
                    return;
                }
            }
            this.show(resolvedContent, focus);
        }
        show(content, focus) {
            const oldHoverWidget = this._hoverWidget;
            if (this.hasContent(content)) {
                const hoverOptions = {
                    content,
                    target: this.target,
                    showPointer: this.hoverDelegate.placement === 'element',
                    hoverPosition: 2 /* HoverPosition.BELOW */,
                    skipFadeInAnimation: !this.fadeInAnimation || !!oldHoverWidget // do not fade in if the hover is already showing
                };
                this._hoverWidget = this.hoverDelegate.showHover(hoverOptions, focus);
            }
            oldHoverWidget === null || oldHoverWidget === void 0 ? void 0 : oldHoverWidget.dispose();
        }
        hasContent(content) {
            if (!content) {
                return false;
            }
            if ((0, htmlContent_1.isMarkdownString)(content)) {
                return !!content.value;
            }
            return true;
        }
        get isDisposed() {
            var _a;
            return (_a = this._hoverWidget) === null || _a === void 0 ? void 0 : _a.isDisposed;
        }
        dispose() {
            var _a, _b;
            (_a = this._hoverWidget) === null || _a === void 0 ? void 0 : _a.dispose();
            (_b = this._cancellationTokenSource) === null || _b === void 0 ? void 0 : _b.dispose(true);
            this._cancellationTokenSource = undefined;
        }
    }
    function setupCustomHover(hoverDelegate, htmlElement, content) {
        let hoverPreparation;
        let hoverWidget;
        const hideHover = (disposeWidget, disposePreparation) => {
            var _a;
            if (disposeWidget) {
                hoverWidget === null || hoverWidget === void 0 ? void 0 : hoverWidget.dispose();
                hoverWidget = undefined;
            }
            if (disposePreparation) {
                hoverPreparation === null || hoverPreparation === void 0 ? void 0 : hoverPreparation.dispose();
                hoverPreparation = undefined;
            }
            (_a = hoverDelegate.onDidHideHover) === null || _a === void 0 ? void 0 : _a.call(hoverDelegate);
        };
        const triggerShowHover = (delay, focus, target) => {
            return new async_1.TimeoutTimer(async () => {
                if (!hoverWidget || hoverWidget.isDisposed) {
                    hoverWidget = new UpdatableHoverWidget(hoverDelegate, target || htmlElement, delay > 0);
                    await hoverWidget.update(content, focus);
                }
            }, delay);
        };
        const onMouseOver = () => {
            if (hoverPreparation) {
                return;
            }
            const toDispose = new lifecycle_1.DisposableStore();
            const onMouseLeave = (e) => hideHover(false, e.fromElement === htmlElement);
            toDispose.add(dom.addDisposableListener(htmlElement, dom.EventType.MOUSE_LEAVE, onMouseLeave, true));
            const onMouseDown = () => hideHover(true, true);
            toDispose.add(dom.addDisposableListener(htmlElement, dom.EventType.MOUSE_DOWN, onMouseDown, true));
            const target = {
                targetElements: [htmlElement],
                dispose: () => { }
            };
            if (hoverDelegate.placement === undefined || hoverDelegate.placement === 'mouse') {
                // track the mouse position
                const onMouseMove = (e) => {
                    target.x = e.x + 10;
                    if ((e.target instanceof HTMLElement) && e.target.classList.contains('action-label')) {
                        hideHover(true, true);
                    }
                };
                toDispose.add(dom.addDisposableListener(htmlElement, dom.EventType.MOUSE_MOVE, onMouseMove, true));
            }
            toDispose.add(triggerShowHover(hoverDelegate.delay, false, target));
            hoverPreparation = toDispose;
        };
        const mouseOverDomEmitter = dom.addDisposableListener(htmlElement, dom.EventType.MOUSE_OVER, onMouseOver, true);
        const hover = {
            show: focus => {
                hideHover(false, true); // terminate a ongoing mouse over preparation
                triggerShowHover(0, focus); // show hover immediately
            },
            hide: () => {
                hideHover(true, true);
            },
            update: async (newContent) => {
                content = newContent;
                await (hoverWidget === null || hoverWidget === void 0 ? void 0 : hoverWidget.update(content));
            },
            dispose: () => {
                mouseOverDomEmitter.dispose();
                hideHover(true, true);
            }
        };
        return hover;
    }
    exports.setupCustomHover = setupCustomHover;
});
//# sourceMappingURL=iconLabelHover.js.map