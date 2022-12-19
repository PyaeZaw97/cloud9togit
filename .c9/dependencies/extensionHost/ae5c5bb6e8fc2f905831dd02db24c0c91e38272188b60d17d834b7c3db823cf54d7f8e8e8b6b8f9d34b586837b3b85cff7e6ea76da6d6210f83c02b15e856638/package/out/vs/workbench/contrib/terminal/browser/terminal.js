/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalDataTransfers = exports.LinuxDistro = exports.terminalEditorId = exports.TerminalLinkQuickPickEvent = exports.TerminalConnectionState = exports.Direction = exports.ITerminalInstanceService = exports.ITerminalGroupService = exports.ITerminalEditorService = exports.ITerminalService = void 0;
    exports.ITerminalService = (0, instantiation_1.createDecorator)('terminalService');
    exports.ITerminalEditorService = (0, instantiation_1.createDecorator)('terminalEditorService');
    exports.ITerminalGroupService = (0, instantiation_1.createDecorator)('terminalGroupService');
    exports.ITerminalInstanceService = (0, instantiation_1.createDecorator)('terminalInstanceService');
    var Direction;
    (function (Direction) {
        Direction[Direction["Left"] = 0] = "Left";
        Direction[Direction["Right"] = 1] = "Right";
        Direction[Direction["Up"] = 2] = "Up";
        Direction[Direction["Down"] = 3] = "Down";
    })(Direction = exports.Direction || (exports.Direction = {}));
    var TerminalConnectionState;
    (function (TerminalConnectionState) {
        TerminalConnectionState[TerminalConnectionState["Connecting"] = 0] = "Connecting";
        TerminalConnectionState[TerminalConnectionState["Connected"] = 1] = "Connected";
    })(TerminalConnectionState = exports.TerminalConnectionState || (exports.TerminalConnectionState = {}));
    class TerminalLinkQuickPickEvent extends MouseEvent {
    }
    exports.TerminalLinkQuickPickEvent = TerminalLinkQuickPickEvent;
    exports.terminalEditorId = 'terminalEditor';
    var LinuxDistro;
    (function (LinuxDistro) {
        LinuxDistro[LinuxDistro["Unknown"] = 1] = "Unknown";
        LinuxDistro[LinuxDistro["Fedora"] = 2] = "Fedora";
        LinuxDistro[LinuxDistro["Ubuntu"] = 3] = "Ubuntu";
    })(LinuxDistro = exports.LinuxDistro || (exports.LinuxDistro = {}));
    var TerminalDataTransfers;
    (function (TerminalDataTransfers) {
        TerminalDataTransfers["Terminals"] = "Terminals";
    })(TerminalDataTransfers = exports.TerminalDataTransfers || (exports.TerminalDataTransfers = {}));
});
//# sourceMappingURL=terminal.js.map