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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/contrib/audioCues/browser/audioCueService", "vs/workbench/contrib/audioCues/browser/observable", "vs/workbench/contrib/debug/common/debug"], function (require, exports, lifecycle_1, audioCueService_1, observable_1, debug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AudioCueLineDebuggerContribution = void 0;
    let AudioCueLineDebuggerContribution = class AudioCueLineDebuggerContribution extends lifecycle_1.Disposable {
        constructor(debugService, audioCueService) {
            super();
            this.audioCueService = audioCueService;
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                if (!audioCueService.isEnabled(audioCueService_1.AudioCue.onDebugBreak).read(reader)) {
                    return;
                }
                const sessionDisposables = new Map();
                store.add((0, lifecycle_1.toDisposable)(() => {
                    sessionDisposables.forEach(d => d.dispose());
                    sessionDisposables.clear();
                }));
                store.add(debugService.onDidNewSession((session) => sessionDisposables.set(session, this.handleSession(session))));
                store.add(debugService.onDidEndSession(session => {
                    var _a;
                    (_a = sessionDisposables.get(session)) === null || _a === void 0 ? void 0 : _a.dispose();
                    sessionDisposables.delete(session);
                }));
                debugService
                    .getModel()
                    .getSessions()
                    .forEach((session) => sessionDisposables.set(session, this.handleSession(session)));
            }, 'subscribe to debug sessions'));
        }
        handleSession(session) {
            return session.onDidChangeState(e => {
                const stoppedDetails = session.getStoppedDetails();
                const BREAKPOINT_STOP_REASON = 'breakpoint';
                if (stoppedDetails && stoppedDetails.reason === BREAKPOINT_STOP_REASON) {
                    this.audioCueService.playAudioCue(audioCueService_1.AudioCue.onDebugBreak);
                }
            });
        }
    };
    AudioCueLineDebuggerContribution = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, audioCueService_1.IAudioCueService)
    ], AudioCueLineDebuggerContribution);
    exports.AudioCueLineDebuggerContribution = AudioCueLineDebuggerContribution;
});
//# sourceMappingURL=audioCueDebuggerContribution.js.map