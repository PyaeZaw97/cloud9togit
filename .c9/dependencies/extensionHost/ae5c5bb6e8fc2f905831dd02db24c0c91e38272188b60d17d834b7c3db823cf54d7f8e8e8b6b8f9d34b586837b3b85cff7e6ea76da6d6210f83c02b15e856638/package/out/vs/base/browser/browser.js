/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isStandalone = exports.isAndroid = exports.isElectron = exports.isWebkitWebView = exports.isSafari = exports.isChrome = exports.isWebKit = exports.isFirefox = exports.onDidChangeFullscreen = exports.isFullscreen = exports.setFullscreen = exports.setZoomFactor = exports.getZoomFactor = exports.getZoomLevel = exports.setZoomLevel = exports.PixelRatio = exports.addMatchMediaChangeListener = void 0;
    class WindowManager {
        constructor() {
            // --- Zoom Level
            this._zoomLevel = 0;
            // --- Zoom Factor
            this._zoomFactor = 1;
            // --- Fullscreen
            this._fullscreen = false;
            this._onDidChangeFullscreen = new event_1.Emitter();
            this.onDidChangeFullscreen = this._onDidChangeFullscreen.event;
        }
        getZoomLevel() {
            return this._zoomLevel;
        }
        setZoomLevel(zoomLevel, isTrusted) {
            if (this._zoomLevel === zoomLevel) {
                return;
            }
            this._zoomLevel = zoomLevel;
        }
        getZoomFactor() {
            return this._zoomFactor;
        }
        setZoomFactor(zoomFactor) {
            this._zoomFactor = zoomFactor;
        }
        setFullscreen(fullscreen) {
            if (this._fullscreen === fullscreen) {
                return;
            }
            this._fullscreen = fullscreen;
            this._onDidChangeFullscreen.fire();
        }
        isFullscreen() {
            return this._fullscreen;
        }
    }
    WindowManager.INSTANCE = new WindowManager();
    /**
     * See https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio#monitoring_screen_resolution_or_zoom_level_changes
     */
    class DevicePixelRatioMonitor extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._listener = () => this._handleChange(true);
            this._mediaQueryList = null;
            this._handleChange(false);
        }
        _handleChange(fireEvent) {
            if (this._mediaQueryList) {
                this._mediaQueryList.removeEventListener('change', this._listener);
            }
            this._mediaQueryList = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
            this._mediaQueryList.addEventListener('change', this._listener);
            if (fireEvent) {
                this._onDidChange.fire();
            }
        }
    }
    class PixelRatioImpl extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._value = this._getPixelRatio();
            const dprMonitor = this._register(new DevicePixelRatioMonitor());
            this._register(dprMonitor.onDidChange(() => {
                this._value = this._getPixelRatio();
                this._onDidChange.fire(this._value);
            }));
        }
        get value() {
            return this._value;
        }
        _getPixelRatio() {
            const ctx = document.createElement('canvas').getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const bsr = ctx.webkitBackingStorePixelRatio ||
                ctx.mozBackingStorePixelRatio ||
                ctx.msBackingStorePixelRatio ||
                ctx.oBackingStorePixelRatio ||
                ctx.backingStorePixelRatio || 1;
            return dpr / bsr;
        }
    }
    class PixelRatioFacade {
        constructor() {
            this._pixelRatioMonitor = null;
        }
        _getOrCreatePixelRatioMonitor() {
            if (!this._pixelRatioMonitor) {
                this._pixelRatioMonitor = (0, lifecycle_1.markAsSingleton)(new PixelRatioImpl());
            }
            return this._pixelRatioMonitor;
        }
        /**
         * Get the current value.
         */
        get value() {
            return this._getOrCreatePixelRatioMonitor().value;
        }
        /**
         * Listen for changes.
         */
        get onDidChange() {
            return this._getOrCreatePixelRatioMonitor().onDidChange;
        }
    }
    function addMatchMediaChangeListener(query, callback) {
        if (typeof query === 'string') {
            query = window.matchMedia(query);
        }
        query.addEventListener('change', callback);
    }
    exports.addMatchMediaChangeListener = addMatchMediaChangeListener;
    /**
     * Returns the pixel ratio.
     *
     * This is useful for rendering <canvas> elements at native screen resolution or for being used as
     * a cache key when storing font measurements. Fonts might render differently depending on resolution
     * and any measurements need to be discarded for example when a window is moved from a monitor to another.
     */
    exports.PixelRatio = new PixelRatioFacade();
    /** A zoom index, e.g. 1, 2, 3 */
    function setZoomLevel(zoomLevel, isTrusted) {
        WindowManager.INSTANCE.setZoomLevel(zoomLevel, isTrusted);
    }
    exports.setZoomLevel = setZoomLevel;
    function getZoomLevel() {
        return WindowManager.INSTANCE.getZoomLevel();
    }
    exports.getZoomLevel = getZoomLevel;
    /** The zoom scale for an index, e.g. 1, 1.2, 1.4 */
    function getZoomFactor() {
        return WindowManager.INSTANCE.getZoomFactor();
    }
    exports.getZoomFactor = getZoomFactor;
    function setZoomFactor(zoomFactor) {
        WindowManager.INSTANCE.setZoomFactor(zoomFactor);
    }
    exports.setZoomFactor = setZoomFactor;
    function setFullscreen(fullscreen) {
        WindowManager.INSTANCE.setFullscreen(fullscreen);
    }
    exports.setFullscreen = setFullscreen;
    function isFullscreen() {
        return WindowManager.INSTANCE.isFullscreen();
    }
    exports.isFullscreen = isFullscreen;
    exports.onDidChangeFullscreen = WindowManager.INSTANCE.onDidChangeFullscreen;
    const userAgent = navigator.userAgent;
    exports.isFirefox = (userAgent.indexOf('Firefox') >= 0);
    exports.isWebKit = (userAgent.indexOf('AppleWebKit') >= 0);
    exports.isChrome = (userAgent.indexOf('Chrome') >= 0);
    exports.isSafari = (!exports.isChrome && (userAgent.indexOf('Safari') >= 0));
    exports.isWebkitWebView = (!exports.isChrome && !exports.isSafari && exports.isWebKit);
    exports.isElectron = (userAgent.indexOf('Electron/') >= 0);
    exports.isAndroid = (userAgent.indexOf('Android') >= 0);
    let standalone = false;
    if (window.matchMedia) {
        const matchMedia = window.matchMedia('(display-mode: standalone)');
        standalone = matchMedia.matches;
        addMatchMediaChangeListener(matchMedia, ({ matches }) => {
            standalone = matches;
        });
    }
    function isStandalone() {
        return standalone;
    }
    exports.isStandalone = isStandalone;
});
//# sourceMappingURL=browser.js.map