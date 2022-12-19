/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullLifecycleService = exports.LifecyclePhaseToString = exports.LifecyclePhase = exports.StartupKindToString = exports.StartupKind = exports.ShutdownReason = exports.ILifecycleService = void 0;
    exports.ILifecycleService = (0, instantiation_1.createDecorator)('lifecycleService');
    var ShutdownReason;
    (function (ShutdownReason) {
        /**
         * The window is closed.
         */
        ShutdownReason[ShutdownReason["CLOSE"] = 1] = "CLOSE";
        /**
         * The window closes because the application quits.
         */
        ShutdownReason[ShutdownReason["QUIT"] = 2] = "QUIT";
        /**
         * The window is reloaded.
         */
        ShutdownReason[ShutdownReason["RELOAD"] = 3] = "RELOAD";
        /**
         * The window is loaded into a different workspace context.
         */
        ShutdownReason[ShutdownReason["LOAD"] = 4] = "LOAD";
    })(ShutdownReason = exports.ShutdownReason || (exports.ShutdownReason = {}));
    var StartupKind;
    (function (StartupKind) {
        StartupKind[StartupKind["NewWindow"] = 1] = "NewWindow";
        StartupKind[StartupKind["ReloadedWindow"] = 3] = "ReloadedWindow";
        StartupKind[StartupKind["ReopenedWindow"] = 4] = "ReopenedWindow";
    })(StartupKind = exports.StartupKind || (exports.StartupKind = {}));
    function StartupKindToString(startupKind) {
        switch (startupKind) {
            case 1 /* StartupKind.NewWindow */: return 'NewWindow';
            case 3 /* StartupKind.ReloadedWindow */: return 'ReloadedWindow';
            case 4 /* StartupKind.ReopenedWindow */: return 'ReopenedWindow';
        }
    }
    exports.StartupKindToString = StartupKindToString;
    var LifecyclePhase;
    (function (LifecyclePhase) {
        /**
         * The first phase signals that we are about to startup getting ready.
         *
         * Note: doing work in this phase blocks an editor from showing to
         * the user, so please rather consider to use `Restored` phase.
         */
        LifecyclePhase[LifecyclePhase["Starting"] = 1] = "Starting";
        /**
         * Services are ready and the window is about to restore its UI state.
         *
         * Note: doing work in this phase blocks an editor from showing to
         * the user, so please rather consider to use `Restored` phase.
         */
        LifecyclePhase[LifecyclePhase["Ready"] = 2] = "Ready";
        /**
         * Views, panels and editors have restored. Editors are given a bit of
         * time to restore their contents.
         */
        LifecyclePhase[LifecyclePhase["Restored"] = 3] = "Restored";
        /**
         * The last phase after views, panels and editors have restored and
         * some time has passed (2-5 seconds).
         */
        LifecyclePhase[LifecyclePhase["Eventually"] = 4] = "Eventually";
    })(LifecyclePhase = exports.LifecyclePhase || (exports.LifecyclePhase = {}));
    function LifecyclePhaseToString(phase) {
        switch (phase) {
            case 1 /* LifecyclePhase.Starting */: return 'Starting';
            case 2 /* LifecyclePhase.Ready */: return 'Ready';
            case 3 /* LifecyclePhase.Restored */: return 'Restored';
            case 4 /* LifecyclePhase.Eventually */: return 'Eventually';
        }
    }
    exports.LifecyclePhaseToString = LifecyclePhaseToString;
    exports.NullLifecycleService = {
        _serviceBrand: undefined,
        onBeforeShutdown: event_1.Event.None,
        onBeforeShutdownError: event_1.Event.None,
        onShutdownVeto: event_1.Event.None,
        onWillShutdown: event_1.Event.None,
        onDidShutdown: event_1.Event.None,
        phase: 3 /* LifecyclePhase.Restored */,
        startupKind: 1 /* StartupKind.NewWindow */,
        async when() { },
        async shutdown() { }
    };
});
//# sourceMappingURL=lifecycle.js.map