/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/color", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/types", "vs/css!./progressbar"], function (require, exports, dom_1, async_1, color_1, lifecycle_1, objects_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProgressBar = void 0;
    const CSS_DONE = 'done';
    const CSS_ACTIVE = 'active';
    const CSS_INFINITE = 'infinite';
    const CSS_INFINITE_LONG_RUNNING = 'infinite-long-running';
    const CSS_DISCRETE = 'discrete';
    const defaultOpts = {
        progressBarBackground: color_1.Color.fromHex('#0E70C0')
    };
    /**
     * A progress bar with support for infinite or discrete progress.
     */
    class ProgressBar extends lifecycle_1.Disposable {
        constructor(container, options) {
            super();
            this.options = options || Object.create(null);
            (0, objects_1.mixin)(this.options, defaultOpts, false);
            this.workedVal = 0;
            this.progressBarBackground = this.options.progressBarBackground;
            this.showDelayedScheduler = this._register(new async_1.RunOnceScheduler(() => (0, dom_1.show)(this.element), 0));
            this.longRunningScheduler = this._register(new async_1.RunOnceScheduler(() => this.infiniteLongRunning(), ProgressBar.LONG_RUNNING_INFINITE_THRESHOLD));
            this.create(container);
        }
        create(container) {
            this.element = document.createElement('div');
            this.element.classList.add('monaco-progress-container');
            this.element.setAttribute('role', 'progressbar');
            this.element.setAttribute('aria-valuemin', '0');
            container.appendChild(this.element);
            this.bit = document.createElement('div');
            this.bit.classList.add('progress-bit');
            this.element.appendChild(this.bit);
            this.applyStyles();
        }
        off() {
            this.bit.style.width = 'inherit';
            this.bit.style.opacity = '1';
            this.element.classList.remove(CSS_ACTIVE, CSS_INFINITE, CSS_INFINITE_LONG_RUNNING, CSS_DISCRETE);
            this.workedVal = 0;
            this.totalWork = undefined;
            this.longRunningScheduler.cancel();
        }
        /**
         * Indicates to the progress bar that all work is done.
         */
        done() {
            return this.doDone(true);
        }
        /**
         * Stops the progressbar from showing any progress instantly without fading out.
         */
        stop() {
            return this.doDone(false);
        }
        doDone(delayed) {
            this.element.classList.add(CSS_DONE);
            // discrete: let it grow to 100% width and hide afterwards
            if (!this.element.classList.contains(CSS_INFINITE)) {
                this.bit.style.width = 'inherit';
                if (delayed) {
                    setTimeout(() => this.off(), 200);
                }
                else {
                    this.off();
                }
            }
            // infinite: let it fade out and hide afterwards
            else {
                this.bit.style.opacity = '0';
                if (delayed) {
                    setTimeout(() => this.off(), 200);
                }
                else {
                    this.off();
                }
            }
            return this;
        }
        /**
         * Use this mode to indicate progress that has no total number of work units.
         */
        infinite() {
            this.bit.style.width = '2%';
            this.bit.style.opacity = '1';
            this.element.classList.remove(CSS_DISCRETE, CSS_DONE, CSS_INFINITE_LONG_RUNNING);
            this.element.classList.add(CSS_ACTIVE, CSS_INFINITE);
            this.longRunningScheduler.schedule();
            return this;
        }
        infiniteLongRunning() {
            this.element.classList.add(CSS_INFINITE_LONG_RUNNING);
        }
        /**
         * Tells the progress bar the total number of work. Use in combination with workedVal() to let
         * the progress bar show the actual progress based on the work that is done.
         */
        total(value) {
            this.workedVal = 0;
            this.totalWork = value;
            this.element.setAttribute('aria-valuemax', value.toString());
            return this;
        }
        /**
         * Finds out if this progress bar is configured with total work
         */
        hasTotal() {
            return (0, types_1.isNumber)(this.totalWork);
        }
        /**
         * Tells the progress bar that an increment of work has been completed.
         */
        worked(value) {
            value = Math.max(1, Number(value));
            return this.doSetWorked(this.workedVal + value);
        }
        /**
         * Tells the progress bar the total amount of work that has been completed.
         */
        setWorked(value) {
            value = Math.max(1, Number(value));
            return this.doSetWorked(value);
        }
        doSetWorked(value) {
            const totalWork = this.totalWork || 100;
            this.workedVal = value;
            this.workedVal = Math.min(totalWork, this.workedVal);
            this.element.classList.remove(CSS_INFINITE, CSS_INFINITE_LONG_RUNNING, CSS_DONE);
            this.element.classList.add(CSS_ACTIVE, CSS_DISCRETE);
            this.element.setAttribute('aria-valuenow', value.toString());
            this.bit.style.width = 100 * (this.workedVal / (totalWork)) + '%';
            return this;
        }
        getContainer() {
            return this.element;
        }
        show(delay) {
            this.showDelayedScheduler.cancel();
            if (typeof delay === 'number') {
                this.showDelayedScheduler.schedule(delay);
            }
            else {
                (0, dom_1.show)(this.element);
            }
        }
        hide() {
            (0, dom_1.hide)(this.element);
            this.showDelayedScheduler.cancel();
        }
        style(styles) {
            this.progressBarBackground = styles.progressBarBackground;
            this.applyStyles();
        }
        applyStyles() {
            if (this.bit) {
                const background = this.progressBarBackground ? this.progressBarBackground.toString() : '';
                this.bit.style.backgroundColor = background;
            }
        }
    }
    exports.ProgressBar = ProgressBar;
    /**
     * After a certain time of showing the progress bar, switch
     * to long-running mode and throttle animations to reduce
     * the pressure on the GPU process.
     *
     * https://github.com/microsoft/vscode/issues/97900
     * https://github.com/microsoft/vscode/issues/138396
     */
    ProgressBar.LONG_RUNNING_INFINITE_THRESHOLD = 10000;
});
//# sourceMappingURL=progressbar.js.map