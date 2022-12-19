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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/network", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/audioCues/browser/observable", "vs/base/common/event", "vs/nls"], function (require, exports, async_1, lifecycle_1, network_1, accessibility_1, configuration_1, instantiation_1, observable_1, event_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AudioCue = exports.Sound = exports.AudioCueService = exports.IAudioCueService = void 0;
    exports.IAudioCueService = (0, instantiation_1.createDecorator)('audioCue');
    let AudioCueService = class AudioCueService extends lifecycle_1.Disposable {
        constructor(configurationService, accessibilityService) {
            super();
            this.configurationService = configurationService;
            this.accessibilityService = accessibilityService;
            this.screenReaderAttached = (0, observable_1.observableFromEvent)(this.accessibilityService.onDidChangeScreenReaderOptimized, () => this.accessibilityService.isScreenReaderOptimized());
            this.obsoleteAudioCuesEnabled = (0, observable_1.observableFromEvent)(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, (e) => e.affectsConfiguration('audioCues.enabled')), () => this.configurationService.getValue('audioCues.enabled'));
            this.isEnabledCache = new Cache((cue) => {
                const settingObservable = (0, observable_1.observableFromEvent)(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, (e) => e.affectsConfiguration(cue.settingsKey)), () => this.configurationService.getValue(cue.settingsKey));
                return new observable_1.LazyDerived(reader => {
                    const setting = settingObservable.read(reader);
                    if (setting === 'on' ||
                        (setting === 'auto' && this.screenReaderAttached.read(reader))) {
                        return true;
                    }
                    const obsoleteSetting = this.obsoleteAudioCuesEnabled.read(reader);
                    if (obsoleteSetting === 'on' ||
                        (obsoleteSetting === 'auto' && this.screenReaderAttached.read(reader))) {
                        return true;
                    }
                    return false;
                }, 'audio cue enabled');
            });
        }
        async playAudioCue(cue) {
            if (this.isEnabled(cue).get()) {
                await this.playSound(cue.sound);
            }
        }
        async playAudioCues(cues) {
            // Some audio cues might reuse sounds. Don't play the same sound twice.
            const sounds = new Set(cues.filter(cue => this.isEnabled(cue).get()).map(cue => cue.sound));
            await Promise.all(Array.from(sounds).map(sound => this.playSound(sound)));
        }
        getVolumeInPercent() {
            let volume = this.configurationService.getValue('audioCues.volume');
            if (typeof volume !== 'number') {
                return 50;
            }
            return Math.max(Math.min(volume, 100), 0);
        }
        async playSound(sound) {
            const url = network_1.FileAccess.asBrowserUri(`vs/workbench/contrib/audioCues/browser/media/${sound.fileName}`, require).toString();
            const audio = new Audio(url);
            audio.volume = this.getVolumeInPercent() / 100;
            try {
                try {
                    // Don't play when loading takes more than 1s, due to loading, decoding or playing issues.
                    // Delayed sounds are very confusing.
                    await (0, async_1.raceTimeout)(audio.play(), 1000);
                }
                catch (e) {
                    console.error('Error while playing sound', e);
                }
            }
            finally {
                audio.remove();
            }
        }
        isEnabled(cue) {
            return this.isEnabledCache.get(cue);
        }
    };
    AudioCueService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, accessibility_1.IAccessibilityService)
    ], AudioCueService);
    exports.AudioCueService = AudioCueService;
    class Cache {
        constructor(getValue) {
            this.getValue = getValue;
            this.map = new Map();
        }
        get(arg) {
            if (this.map.has(arg)) {
                return this.map.get(arg);
            }
            const value = this.getValue(arg);
            this.map.set(arg, value);
            return value;
        }
    }
    /**
     * Corresponds to the audio files in ./media.
    */
    class Sound {
        constructor(fileName) {
            this.fileName = fileName;
        }
        static register(options) {
            const sound = new Sound(options.fileName);
            return sound;
        }
    }
    exports.Sound = Sound;
    Sound.error = Sound.register({ fileName: 'error.opus' });
    Sound.warning = Sound.register({ fileName: 'warning.opus' });
    Sound.foldedArea = Sound.register({ fileName: 'foldedAreas.opus' });
    Sound.break = Sound.register({ fileName: 'break.opus' });
    Sound.quickFixes = Sound.register({ fileName: 'quickFixes.opus' });
    class AudioCue {
        constructor(sound, name, settingsKey) {
            this.sound = sound;
            this.name = name;
            this.settingsKey = settingsKey;
        }
        static register(options) {
            const audioCue = new AudioCue(options.sound, options.name, options.settingsKey);
            AudioCue._audioCues.add(audioCue);
            return audioCue;
        }
        static get allAudioCues() {
            return [...this._audioCues];
        }
    }
    exports.AudioCue = AudioCue;
    AudioCue._audioCues = new Set();
    AudioCue.error = AudioCue.register({
        name: (0, nls_1.localize)('audioCues.lineHasError.name', 'Error on Line'),
        sound: Sound.error,
        settingsKey: 'audioCues.lineHasError',
    });
    AudioCue.warning = AudioCue.register({
        name: (0, nls_1.localize)('audioCues.lineHasWarning.name', 'Warning on Line'),
        sound: Sound.warning,
        settingsKey: 'audioCues.lineHasWarning',
    });
    AudioCue.foldedArea = AudioCue.register({
        name: (0, nls_1.localize)('audioCues.lineHasFoldedArea.name', 'Folded Area on Line'),
        sound: Sound.foldedArea,
        settingsKey: 'audioCues.lineHasFoldedArea',
    });
    AudioCue.break = AudioCue.register({
        name: (0, nls_1.localize)('audioCues.lineHasBreakpoint.name', 'Breakpoint on Line'),
        sound: Sound.break,
        settingsKey: 'audioCues.lineHasBreakpoint',
    });
    AudioCue.inlineSuggestion = AudioCue.register({
        name: (0, nls_1.localize)('audioCues.lineHasInlineSuggestion.name', 'Inline Suggestion on Line'),
        sound: Sound.quickFixes,
        settingsKey: 'audioCues.lineHasInlineSuggestion',
    });
    AudioCue.onDebugBreak = AudioCue.register({
        name: (0, nls_1.localize)('audioCues.onDebugBreak.name', 'Debugger Stopped on Breakpoint'),
        sound: Sound.break,
        settingsKey: 'audioCues.onDebugBreak',
    });
    AudioCue.noInlayHints = AudioCue.register({
        name: (0, nls_1.localize)('audioCues.noInlayHints', 'No Inlay Hints on Line'),
        sound: Sound.error,
        settingsKey: 'audioCues.noInlayHints'
    });
});
//# sourceMappingURL=audioCueService.js.map