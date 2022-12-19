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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/platform/terminal/common/capabilities/commandDetectionCapability", "vs/platform/terminal/common/capabilities/cwdDetectionCapability", "vs/platform/terminal/common/capabilities/partialCommandDetectionCapability", "vs/platform/log/common/log"], function (require, exports, lifecycle_1, terminalCapabilityStore_1, commandDetectionCapability_1, cwdDetectionCapability_1, partialCommandDetectionCapability_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShellIntegrationAddon = void 0;
    /**
     * Shell integration is a feature that enhances the terminal's understanding of what's happening
     * in the shell by injecting special sequences into the shell's prompt using the "Set Text
     * Parameters" sequence (`OSC Ps ; Pt ST`).
     *
     * Definitions:
     * - OSC: `\x1b]`
     * - Ps:  A single (usually optional) numeric parameter, composed of one or more digits.
     * - Pt:  A text parameter composed of printable characters.
     * - ST: `\x7`
     *
     * This is inspired by a feature of the same name in the FinalTerm, iTerm2 and kitty terminals.
     */
    /**
     * The identifier for the first numeric parameter (`Ps`) for OSC commands used by shell integration.
     */
    var ShellIntegrationOscPs;
    (function (ShellIntegrationOscPs) {
        /**
         * Sequences pioneered by FinalTerm.
         */
        ShellIntegrationOscPs[ShellIntegrationOscPs["FinalTerm"] = 133] = "FinalTerm";
        /**
         * Sequences pioneered by VS Code. The number is derived from the least significant digit of
         * "VSC" when encoded in hex ("VSC" = 0x56, 0x53, 0x43).
         */
        ShellIntegrationOscPs[ShellIntegrationOscPs["VSCode"] = 633] = "VSCode";
        /**
         * Sequences pioneered by iTerm.
         */
        ShellIntegrationOscPs[ShellIntegrationOscPs["ITerm"] = 1337] = "ITerm";
    })(ShellIntegrationOscPs || (ShellIntegrationOscPs = {}));
    /**
     * VS Code-specific shell integration sequences. Some of these are based on common alternatives like
     * those pioneered in FinalTerm. The decision to move to entirely custom sequences was to try to
     * improve reliability and prevent the possibility of applications confusing the terminal.
     */
    var VSCodeOscPt;
    (function (VSCodeOscPt) {
        /**
         * The start of the prompt, this is expected to always appear at the start of a line.
         * Based on FinalTerm's `OSC 133 ; A ST`.
         */
        VSCodeOscPt["PromptStart"] = "A";
        /**
         * The start of a command, ie. where the user inputs their command.
         * Based on FinalTerm's `OSC 133 ; B ST`.
         */
        VSCodeOscPt["CommandStart"] = "B";
        /**
         * Sent just before the command output begins.
         * Based on FinalTerm's `OSC 133 ; C ST`.
         */
        VSCodeOscPt["CommandExecuted"] = "C";
        /**
         * Sent just after a command has finished. The exit code is optional, when not specified it
         * means no command was run (ie. enter on empty prompt or ctrl+c).
         * Based on FinalTerm's `OSC 133 ; D [; <ExitCode>] ST`.
         */
        VSCodeOscPt["CommandFinished"] = "D";
        /**
         * Explicitly set the command line. This helps workaround problems with conpty not having a
         * passthrough mode by providing an option on Windows to send the command that was run. With
         * this sequence there's no need for the guessing based on the unreliable cursor positions that
         * would otherwise be required.
         */
        VSCodeOscPt["CommandLine"] = "E";
        /**
         * Similar to prompt start but for line continuations.
         */
        VSCodeOscPt["ContinuationStart"] = "F";
        /**
         * Similar to command start but for line continuations.
         */
        VSCodeOscPt["ContinuationEnd"] = "G";
        /**
         * The start of the right prompt.
         */
        VSCodeOscPt["RightPromptStart"] = "H";
        /**
         * The end of the right prompt.
         */
        VSCodeOscPt["RightPromptEnd"] = "I";
        /**
         * Set an arbitrary property: `OSC 633 ; P ; <Property>=<Value> ST`, only known properties will
         * be handled.
         */
        VSCodeOscPt["Property"] = "P";
    })(VSCodeOscPt || (VSCodeOscPt = {}));
    /**
     * The shell integration addon extends xterm by reading shell integration sequences and creating
     * capabilities and passing along relevant sequences to the capabilities. This is meant to
     * encapsulate all handling/parsing of sequences so the capabilities don't need to.
     */
    let ShellIntegrationAddon = class ShellIntegrationAddon extends lifecycle_1.Disposable {
        constructor(_logService) {
            super();
            this._logService = _logService;
            this.capabilities = new terminalCapabilityStore_1.TerminalCapabilityStore();
        }
        activate(xterm) {
            this._terminal = xterm;
            this.capabilities.add(3 /* TerminalCapability.PartialCommandDetection */, new partialCommandDetectionCapability_1.PartialCommandDetectionCapability(this._terminal));
            this._register(xterm.parser.registerOscHandler(633 /* ShellIntegrationOscPs.VSCode */, data => this._handleVSCodeSequence(data)));
        }
        _handleVSCodeSequence(data) {
            if (!this._terminal) {
                return false;
            }
            // Pass the sequence along to the capability
            const [command, ...args] = data.split(';');
            switch (command) {
                case "A" /* VSCodeOscPt.PromptStart */:
                    this._createOrGetCommandDetection(this._terminal).handlePromptStart();
                    return true;
                case "B" /* VSCodeOscPt.CommandStart */:
                    this._createOrGetCommandDetection(this._terminal).handleCommandStart();
                    return true;
                case "C" /* VSCodeOscPt.CommandExecuted */:
                    this._createOrGetCommandDetection(this._terminal).handleCommandExecuted();
                    return true;
                case "D" /* VSCodeOscPt.CommandFinished */: {
                    const exitCode = args.length === 1 ? parseInt(args[0]) : undefined;
                    this._createOrGetCommandDetection(this._terminal).handleCommandFinished(exitCode);
                    return true;
                }
                case "E" /* VSCodeOscPt.CommandLine */: {
                    let commandLine;
                    if (args.length === 1) {
                        commandLine = this._deserializeMessage(args[0]);
                    }
                    else {
                        commandLine = '';
                    }
                    this._createOrGetCommandDetection(this._terminal).setCommandLine(commandLine);
                    return true;
                }
                case "F" /* VSCodeOscPt.ContinuationStart */: {
                    this._createOrGetCommandDetection(this._terminal).handleContinuationStart();
                    return true;
                }
                case "G" /* VSCodeOscPt.ContinuationEnd */: {
                    this._createOrGetCommandDetection(this._terminal).handleContinuationEnd();
                    return true;
                }
                case "H" /* VSCodeOscPt.RightPromptStart */: {
                    this._createOrGetCommandDetection(this._terminal).handleRightPromptStart();
                    return true;
                }
                case "I" /* VSCodeOscPt.RightPromptEnd */: {
                    this._createOrGetCommandDetection(this._terminal).handleRightPromptEnd();
                    return true;
                }
                case "P" /* VSCodeOscPt.Property */: {
                    const [key, rawValue] = args[0].split('=');
                    if (rawValue === undefined) {
                        return true;
                    }
                    const value = this._deserializeMessage(rawValue);
                    switch (key) {
                        case 'Cwd': {
                            this._createOrGetCwdDetection().updateCwd(value);
                            const commandDetection = this.capabilities.get(2 /* TerminalCapability.CommandDetection */);
                            if (commandDetection) {
                                commandDetection.setCwd(value);
                            }
                            return true;
                        }
                        case 'IsWindows': {
                            this._createOrGetCommandDetection(this._terminal).setIsWindowsPty(value === 'True' ? true : false);
                            return true;
                        }
                    }
                }
            }
            // Unrecognized sequence
            return false;
        }
        serialize() {
            if (!this._terminal || !this.capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
                return {
                    isWindowsPty: false,
                    commands: []
                };
            }
            const result = this._createOrGetCommandDetection(this._terminal).serialize();
            return result;
        }
        deserialize(serialized) {
            if (!this._terminal) {
                throw new Error('Cannot restore commands before addon is activated');
            }
            this._createOrGetCommandDetection(this._terminal).deserialize(serialized);
        }
        _createOrGetCwdDetection() {
            let cwdDetection = this.capabilities.get(0 /* TerminalCapability.CwdDetection */);
            if (!cwdDetection) {
                cwdDetection = new cwdDetectionCapability_1.CwdDetectionCapability();
                this.capabilities.add(0 /* TerminalCapability.CwdDetection */, cwdDetection);
            }
            return cwdDetection;
        }
        _createOrGetCommandDetection(terminal) {
            let commandDetection = this.capabilities.get(2 /* TerminalCapability.CommandDetection */);
            if (!commandDetection) {
                commandDetection = new commandDetectionCapability_1.CommandDetectionCapability(terminal, this._logService);
                this.capabilities.add(2 /* TerminalCapability.CommandDetection */, commandDetection);
            }
            return commandDetection;
        }
        _deserializeMessage(message) {
            return message
                .replace(/<LF>/g, '\n')
                .replace(/<CL>/g, ';')
                .replace(/<ST>/g, '\x07');
        }
    };
    ShellIntegrationAddon = __decorate([
        __param(0, log_1.ILogService)
    ], ShellIntegrationAddon);
    exports.ShellIntegrationAddon = ShellIntegrationAddon;
});
//# sourceMappingURL=shellIntegrationAddon.js.map