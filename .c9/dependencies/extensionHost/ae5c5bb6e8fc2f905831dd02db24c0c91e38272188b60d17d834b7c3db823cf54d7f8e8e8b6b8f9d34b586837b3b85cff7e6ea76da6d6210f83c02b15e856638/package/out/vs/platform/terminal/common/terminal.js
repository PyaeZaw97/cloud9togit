/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProfileSource = exports.FlowControlConstants = exports.LocalReconnectConstants = exports.TerminalLocationString = exports.TerminalLocation = exports.HeartbeatConstants = exports.ProcessPropertyType = exports.IPtyService = exports.TerminalIpcChannels = exports.TitleEventSource = exports.WindowsShellType = exports.PosixShellType = exports.TerminalSettingId = exports.TerminalSettingPrefix = void 0;
    var TerminalSettingPrefix;
    (function (TerminalSettingPrefix) {
        TerminalSettingPrefix["Shell"] = "terminal.integrated.shell.";
        TerminalSettingPrefix["ShellArgs"] = "terminal.integrated.shellArgs.";
        TerminalSettingPrefix["DefaultProfile"] = "terminal.integrated.defaultProfile.";
        TerminalSettingPrefix["Profiles"] = "terminal.integrated.profiles.";
    })(TerminalSettingPrefix = exports.TerminalSettingPrefix || (exports.TerminalSettingPrefix = {}));
    var TerminalSettingId;
    (function (TerminalSettingId) {
        TerminalSettingId["ShellLinux"] = "terminal.integrated.shell.linux";
        TerminalSettingId["ShellMacOs"] = "terminal.integrated.shell.osx";
        TerminalSettingId["ShellWindows"] = "terminal.integrated.shell.windows";
        TerminalSettingId["SendKeybindingsToShell"] = "terminal.integrated.sendKeybindingsToShell";
        TerminalSettingId["AutomationShellLinux"] = "terminal.integrated.automationShell.linux";
        TerminalSettingId["AutomationShellMacOs"] = "terminal.integrated.automationShell.osx";
        TerminalSettingId["AutomationShellWindows"] = "terminal.integrated.automationShell.windows";
        TerminalSettingId["AutomationProfileLinux"] = "terminal.integrated.automationProfile.linux";
        TerminalSettingId["AutomationProfileMacOs"] = "terminal.integrated.automationProfile.osx";
        TerminalSettingId["AutomationProfileWindows"] = "terminal.integrated.automationProfile.windows";
        TerminalSettingId["ShellArgsLinux"] = "terminal.integrated.shellArgs.linux";
        TerminalSettingId["ShellArgsMacOs"] = "terminal.integrated.shellArgs.osx";
        TerminalSettingId["ShellArgsWindows"] = "terminal.integrated.shellArgs.windows";
        TerminalSettingId["ProfilesWindows"] = "terminal.integrated.profiles.windows";
        TerminalSettingId["ProfilesMacOs"] = "terminal.integrated.profiles.osx";
        TerminalSettingId["ProfilesLinux"] = "terminal.integrated.profiles.linux";
        TerminalSettingId["DefaultProfileLinux"] = "terminal.integrated.defaultProfile.linux";
        TerminalSettingId["DefaultProfileMacOs"] = "terminal.integrated.defaultProfile.osx";
        TerminalSettingId["DefaultProfileWindows"] = "terminal.integrated.defaultProfile.windows";
        TerminalSettingId["UseWslProfiles"] = "terminal.integrated.useWslProfiles";
        TerminalSettingId["TabsEnabled"] = "terminal.integrated.tabs.enabled";
        TerminalSettingId["TabsEnableAnimation"] = "terminal.integrated.tabs.enableAnimation";
        TerminalSettingId["TabsHideCondition"] = "terminal.integrated.tabs.hideCondition";
        TerminalSettingId["TabsShowActiveTerminal"] = "terminal.integrated.tabs.showActiveTerminal";
        TerminalSettingId["TabsShowActions"] = "terminal.integrated.tabs.showActions";
        TerminalSettingId["TabsLocation"] = "terminal.integrated.tabs.location";
        TerminalSettingId["TabsFocusMode"] = "terminal.integrated.tabs.focusMode";
        TerminalSettingId["MacOptionIsMeta"] = "terminal.integrated.macOptionIsMeta";
        TerminalSettingId["MacOptionClickForcesSelection"] = "terminal.integrated.macOptionClickForcesSelection";
        TerminalSettingId["AltClickMovesCursor"] = "terminal.integrated.altClickMovesCursor";
        TerminalSettingId["CopyOnSelection"] = "terminal.integrated.copyOnSelection";
        TerminalSettingId["EnableMultiLinePasteWarning"] = "terminal.integrated.enableMultiLinePasteWarning";
        TerminalSettingId["DrawBoldTextInBrightColors"] = "terminal.integrated.drawBoldTextInBrightColors";
        TerminalSettingId["FontFamily"] = "terminal.integrated.fontFamily";
        TerminalSettingId["FontSize"] = "terminal.integrated.fontSize";
        TerminalSettingId["LetterSpacing"] = "terminal.integrated.letterSpacing";
        TerminalSettingId["LineHeight"] = "terminal.integrated.lineHeight";
        TerminalSettingId["MinimumContrastRatio"] = "terminal.integrated.minimumContrastRatio";
        TerminalSettingId["FastScrollSensitivity"] = "terminal.integrated.fastScrollSensitivity";
        TerminalSettingId["MouseWheelScrollSensitivity"] = "terminal.integrated.mouseWheelScrollSensitivity";
        TerminalSettingId["BellDuration"] = "terminal.integrated.bellDuration";
        TerminalSettingId["FontWeight"] = "terminal.integrated.fontWeight";
        TerminalSettingId["FontWeightBold"] = "terminal.integrated.fontWeightBold";
        TerminalSettingId["CursorBlinking"] = "terminal.integrated.cursorBlinking";
        TerminalSettingId["CursorStyle"] = "terminal.integrated.cursorStyle";
        TerminalSettingId["CursorWidth"] = "terminal.integrated.cursorWidth";
        TerminalSettingId["Scrollback"] = "terminal.integrated.scrollback";
        TerminalSettingId["DetectLocale"] = "terminal.integrated.detectLocale";
        TerminalSettingId["DefaultLocation"] = "terminal.integrated.defaultLocation";
        TerminalSettingId["GpuAcceleration"] = "terminal.integrated.gpuAcceleration";
        TerminalSettingId["TerminalTitleSeparator"] = "terminal.integrated.tabs.separator";
        TerminalSettingId["TerminalTitle"] = "terminal.integrated.tabs.title";
        TerminalSettingId["TerminalDescription"] = "terminal.integrated.tabs.description";
        TerminalSettingId["RightClickBehavior"] = "terminal.integrated.rightClickBehavior";
        TerminalSettingId["Cwd"] = "terminal.integrated.cwd";
        TerminalSettingId["ConfirmOnExit"] = "terminal.integrated.confirmOnExit";
        TerminalSettingId["ConfirmOnKill"] = "terminal.integrated.confirmOnKill";
        TerminalSettingId["EnableBell"] = "terminal.integrated.enableBell";
        TerminalSettingId["CommandsToSkipShell"] = "terminal.integrated.commandsToSkipShell";
        TerminalSettingId["AllowChords"] = "terminal.integrated.allowChords";
        TerminalSettingId["AllowMnemonics"] = "terminal.integrated.allowMnemonics";
        TerminalSettingId["EnvMacOs"] = "terminal.integrated.env.osx";
        TerminalSettingId["EnvLinux"] = "terminal.integrated.env.linux";
        TerminalSettingId["EnvWindows"] = "terminal.integrated.env.windows";
        TerminalSettingId["EnvironmentChangesIndicator"] = "terminal.integrated.environmentChangesIndicator";
        TerminalSettingId["EnvironmentChangesRelaunch"] = "terminal.integrated.environmentChangesRelaunch";
        TerminalSettingId["ShowExitAlert"] = "terminal.integrated.showExitAlert";
        TerminalSettingId["SplitCwd"] = "terminal.integrated.splitCwd";
        TerminalSettingId["WindowsEnableConpty"] = "terminal.integrated.windowsEnableConpty";
        TerminalSettingId["WordSeparators"] = "terminal.integrated.wordSeparators";
        TerminalSettingId["EnableFileLinks"] = "terminal.integrated.enableFileLinks";
        TerminalSettingId["UnicodeVersion"] = "terminal.integrated.unicodeVersion";
        TerminalSettingId["LocalEchoLatencyThreshold"] = "terminal.integrated.localEchoLatencyThreshold";
        TerminalSettingId["LocalEchoEnabled"] = "terminal.integrated.localEchoEnabled";
        TerminalSettingId["LocalEchoExcludePrograms"] = "terminal.integrated.localEchoExcludePrograms";
        TerminalSettingId["LocalEchoStyle"] = "terminal.integrated.localEchoStyle";
        TerminalSettingId["EnablePersistentSessions"] = "terminal.integrated.enablePersistentSessions";
        TerminalSettingId["PersistentSessionReviveProcess"] = "terminal.integrated.persistentSessionReviveProcess";
        TerminalSettingId["CustomGlyphs"] = "terminal.integrated.customGlyphs";
        TerminalSettingId["PersistentSessionScrollback"] = "terminal.integrated.persistentSessionScrollback";
        TerminalSettingId["InheritEnv"] = "terminal.integrated.inheritEnv";
        TerminalSettingId["ShowLinkHover"] = "terminal.integrated.showLinkHover";
        TerminalSettingId["IgnoreProcessNames"] = "terminal.integrated.ignoreProcessNames";
        TerminalSettingId["AutoReplies"] = "terminal.integrated.autoReplies";
        TerminalSettingId["ShellIntegrationEnabled"] = "terminal.integrated.shellIntegration.enabled";
        TerminalSettingId["ShellIntegrationShowWelcome"] = "terminal.integrated.shellIntegration.showWelcome";
        TerminalSettingId["ShellIntegrationDecorationsEnabled"] = "terminal.integrated.shellIntegration.decorationsEnabled";
        TerminalSettingId["ShellIntegrationDecorationIcon"] = "terminal.integrated.shellIntegration.decorationIcon";
        TerminalSettingId["ShellIntegrationDecorationIconError"] = "terminal.integrated.shellIntegration.decorationIconError";
        TerminalSettingId["ShellIntegrationDecorationIconSuccess"] = "terminal.integrated.shellIntegration.decorationIconSuccess";
        TerminalSettingId["ShellIntegrationCommandHistory"] = "terminal.integrated.shellIntegration.history";
    })(TerminalSettingId = exports.TerminalSettingId || (exports.TerminalSettingId = {}));
    var PosixShellType;
    (function (PosixShellType) {
        PosixShellType["PowerShell"] = "pwsh";
        PosixShellType["Bash"] = "bash";
        PosixShellType["Fish"] = "fish";
        PosixShellType["Sh"] = "sh";
        PosixShellType["Csh"] = "csh";
        PosixShellType["Ksh"] = "ksh";
        PosixShellType["Zsh"] = "zsh";
    })(PosixShellType = exports.PosixShellType || (exports.PosixShellType = {}));
    var WindowsShellType;
    (function (WindowsShellType) {
        WindowsShellType["CommandPrompt"] = "cmd";
        WindowsShellType["PowerShell"] = "pwsh";
        WindowsShellType["Wsl"] = "wsl";
        WindowsShellType["GitBash"] = "gitbash";
    })(WindowsShellType = exports.WindowsShellType || (exports.WindowsShellType = {}));
    var TitleEventSource;
    (function (TitleEventSource) {
        /** From the API or the rename command that overrides any other type */
        TitleEventSource[TitleEventSource["Api"] = 0] = "Api";
        /** From the process name property*/
        TitleEventSource[TitleEventSource["Process"] = 1] = "Process";
        /** From the VT sequence */
        TitleEventSource[TitleEventSource["Sequence"] = 2] = "Sequence";
        /** Config changed */
        TitleEventSource[TitleEventSource["Config"] = 3] = "Config";
    })(TitleEventSource = exports.TitleEventSource || (exports.TitleEventSource = {}));
    var TerminalIpcChannels;
    (function (TerminalIpcChannels) {
        /**
         * Communicates between the renderer process and shared process.
         */
        TerminalIpcChannels["LocalPty"] = "localPty";
        /**
         * Communicates between the shared process and the pty host process.
         */
        TerminalIpcChannels["PtyHost"] = "ptyHost";
        /**
         * Deals with logging from the pty host process.
         */
        TerminalIpcChannels["Log"] = "log";
        /**
         * Enables the detection of unresponsive pty hosts.
         */
        TerminalIpcChannels["Heartbeat"] = "heartbeat";
    })(TerminalIpcChannels = exports.TerminalIpcChannels || (exports.TerminalIpcChannels = {}));
    exports.IPtyService = (0, instantiation_1.createDecorator)('ptyService');
    var ProcessPropertyType;
    (function (ProcessPropertyType) {
        ProcessPropertyType["Cwd"] = "cwd";
        ProcessPropertyType["InitialCwd"] = "initialCwd";
        ProcessPropertyType["FixedDimensions"] = "fixedDimensions";
        ProcessPropertyType["Title"] = "title";
        ProcessPropertyType["ShellType"] = "shellType";
        ProcessPropertyType["HasChildProcesses"] = "hasChildProcesses";
        ProcessPropertyType["ResolvedShellLaunchConfig"] = "resolvedShellLaunchConfig";
        ProcessPropertyType["OverrideDimensions"] = "overrideDimensions";
    })(ProcessPropertyType = exports.ProcessPropertyType || (exports.ProcessPropertyType = {}));
    var HeartbeatConstants;
    (function (HeartbeatConstants) {
        /**
         * The duration between heartbeats
         */
        HeartbeatConstants[HeartbeatConstants["BeatInterval"] = 5000] = "BeatInterval";
        /**
         * Defines a multiplier for BeatInterval for how long to wait before starting the second wait
         * timer.
         */
        HeartbeatConstants[HeartbeatConstants["FirstWaitMultiplier"] = 1.2] = "FirstWaitMultiplier";
        /**
         * Defines a multiplier for BeatInterval for how long to wait before telling the user about
         * non-responsiveness. The second timer is to avoid informing the user incorrectly when waking
         * the computer up from sleep
         */
        HeartbeatConstants[HeartbeatConstants["SecondWaitMultiplier"] = 1] = "SecondWaitMultiplier";
        /**
         * How long to wait before telling the user about non-responsiveness when they try to create a
         * process. This short circuits the standard wait timeouts to tell the user sooner and only
         * create process is handled to avoid additional perf overhead.
         */
        HeartbeatConstants[HeartbeatConstants["CreateProcessTimeout"] = 5000] = "CreateProcessTimeout";
    })(HeartbeatConstants = exports.HeartbeatConstants || (exports.HeartbeatConstants = {}));
    var TerminalLocation;
    (function (TerminalLocation) {
        TerminalLocation[TerminalLocation["Panel"] = 1] = "Panel";
        TerminalLocation[TerminalLocation["Editor"] = 2] = "Editor";
    })(TerminalLocation = exports.TerminalLocation || (exports.TerminalLocation = {}));
    var TerminalLocationString;
    (function (TerminalLocationString) {
        TerminalLocationString["TerminalView"] = "view";
        TerminalLocationString["Editor"] = "editor";
    })(TerminalLocationString = exports.TerminalLocationString || (exports.TerminalLocationString = {}));
    var LocalReconnectConstants;
    (function (LocalReconnectConstants) {
        /**
         * If there is no reconnection within this time-frame, consider the connection permanently closed...
        */
        LocalReconnectConstants[LocalReconnectConstants["GraceTime"] = 60000] = "GraceTime";
        /**
         * Maximal grace time between the first and the last reconnection...
        */
        LocalReconnectConstants[LocalReconnectConstants["ShortGraceTime"] = 6000] = "ShortGraceTime";
    })(LocalReconnectConstants = exports.LocalReconnectConstants || (exports.LocalReconnectConstants = {}));
    var FlowControlConstants;
    (function (FlowControlConstants) {
        /**
         * The number of _unacknowledged_ chars to have been sent before the pty is paused in order for
         * the client to catch up.
         */
        FlowControlConstants[FlowControlConstants["HighWatermarkChars"] = 100000] = "HighWatermarkChars";
        /**
         * After flow control pauses the pty for the client the catch up, this is the number of
         * _unacknowledged_ chars to have been caught up to on the client before resuming the pty again.
         * This is used to attempt to prevent pauses in the flowing data; ideally while the pty is
         * paused the number of unacknowledged chars would always be greater than 0 or the client will
         * appear to stutter. In reality this balance is hard to accomplish though so heavy commands
         * will likely pause as latency grows, not flooding the connection is the important thing as
         * it's shared with other core functionality.
         */
        FlowControlConstants[FlowControlConstants["LowWatermarkChars"] = 5000] = "LowWatermarkChars";
        /**
         * The number characters that are accumulated on the client side before sending an ack event.
         * This must be less than or equal to LowWatermarkChars or the terminal max never unpause.
         */
        FlowControlConstants[FlowControlConstants["CharCountAckSize"] = 5000] = "CharCountAckSize";
    })(FlowControlConstants = exports.FlowControlConstants || (exports.FlowControlConstants = {}));
    var ProfileSource;
    (function (ProfileSource) {
        ProfileSource["GitBash"] = "Git Bash";
        ProfileSource["Pwsh"] = "PowerShell";
    })(ProfileSource = exports.ProfileSource || (exports.ProfileSource = {}));
});
//# sourceMappingURL=terminal.js.map