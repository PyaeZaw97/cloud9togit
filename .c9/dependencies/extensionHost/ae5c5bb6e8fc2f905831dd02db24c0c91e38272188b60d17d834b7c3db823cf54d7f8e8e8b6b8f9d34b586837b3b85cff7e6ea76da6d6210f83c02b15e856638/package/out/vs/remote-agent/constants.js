define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.remoteHostStillDeadWarning = exports.failedReconnectToRemoteHostError = exports.remoteHostDiedUnexpectedlyError = exports.remoteHostNotFoundError = exports.socketMissingError = void 0;
    exports.socketMissingError = "Extension host socket is missing, it is not possible to reconnect to the host.";
    exports.remoteHostNotFoundError = "Extension host process is not found";
    exports.remoteHostDiedUnexpectedlyError = "Extension host process died unexpectedly";
    exports.failedReconnectToRemoteHostError = "Failed to reconnect to remote host";
    exports.remoteHostStillDeadWarning = "Extension host process is still missing";
});
//# sourceMappingURL=constants.js.map