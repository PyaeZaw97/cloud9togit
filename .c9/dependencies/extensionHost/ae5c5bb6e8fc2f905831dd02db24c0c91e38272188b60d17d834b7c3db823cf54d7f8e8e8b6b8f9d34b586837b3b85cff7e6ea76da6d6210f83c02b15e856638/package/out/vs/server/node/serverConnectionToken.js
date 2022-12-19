/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "cookie", "fs", "vs/base/common/path", "vs/base/common/uuid", "vs/base/common/network", "vs/base/node/pfs"], function (require, exports, cookie, fs, path, uuid_1, network_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.requestHasValidConnectionToken = exports.determineServerConnectionToken = exports.parseServerConnectionToken = exports.ServerConnectionTokenParseError = exports.MandatoryServerConnectionToken = exports.OptionalServerConnectionToken = exports.NoneServerConnectionToken = exports.ServerConnectionTokenType = void 0;
    const connectionTokenRegex = /^[0-9A-Za-z-]+$/;
    var ServerConnectionTokenType;
    (function (ServerConnectionTokenType) {
        ServerConnectionTokenType[ServerConnectionTokenType["None"] = 0] = "None";
        ServerConnectionTokenType[ServerConnectionTokenType["Optional"] = 1] = "Optional";
        ServerConnectionTokenType[ServerConnectionTokenType["Mandatory"] = 2] = "Mandatory";
    })(ServerConnectionTokenType = exports.ServerConnectionTokenType || (exports.ServerConnectionTokenType = {}));
    class NoneServerConnectionToken {
        constructor() {
            this.type = 0 /* ServerConnectionTokenType.None */;
        }
        validate(connectionToken) {
            return true;
        }
    }
    exports.NoneServerConnectionToken = NoneServerConnectionToken;
    class OptionalServerConnectionToken {
        constructor(value) {
            this.value = value;
            this.type = 1 /* ServerConnectionTokenType.Optional */;
        }
        validate(connectionToken) {
            return (connectionToken === this.value);
        }
    }
    exports.OptionalServerConnectionToken = OptionalServerConnectionToken;
    class MandatoryServerConnectionToken {
        constructor(value) {
            this.value = value;
            this.type = 2 /* ServerConnectionTokenType.Mandatory */;
        }
        validate(connectionToken) {
            return (connectionToken === this.value);
        }
    }
    exports.MandatoryServerConnectionToken = MandatoryServerConnectionToken;
    class ServerConnectionTokenParseError {
        constructor(message) {
            this.message = message;
        }
    }
    exports.ServerConnectionTokenParseError = ServerConnectionTokenParseError;
    async function parseServerConnectionToken(args, defaultValue) {
        const withoutConnectionToken = args['without-connection-token'];
        const connectionToken = args['connection-token'];
        const connectionTokenFile = args['connection-token-file'];
        const compatibility = (args['compatibility'] === '1.63');
        if (withoutConnectionToken) {
            if (typeof connectionToken !== 'undefined' || typeof connectionTokenFile !== 'undefined') {
                return new ServerConnectionTokenParseError(`Please do not use the argument '--connection-token' or '--connection-token-file' at the same time as '--without-connection-token'.`);
            }
            return new NoneServerConnectionToken();
        }
        if (typeof connectionTokenFile !== 'undefined') {
            if (typeof connectionToken !== 'undefined') {
                return new ServerConnectionTokenParseError(`Please do not use the argument '--connection-token' at the same time as '--connection-token-file'.`);
            }
            let rawConnectionToken;
            try {
                rawConnectionToken = fs.readFileSync(connectionTokenFile).toString().replace(/\r?\n$/, '');
            }
            catch (e) {
                return new ServerConnectionTokenParseError(`Unable to read the connection token file at '${connectionTokenFile}'.`);
            }
            if (!connectionTokenRegex.test(rawConnectionToken)) {
                return new ServerConnectionTokenParseError(`The connection token defined in '${connectionTokenFile} does not adhere to the characters 0-9, a-z, A-Z or -.`);
            }
            return new MandatoryServerConnectionToken(rawConnectionToken);
        }
        if (typeof connectionToken !== 'undefined') {
            if (!connectionTokenRegex.test(connectionToken)) {
                return new ServerConnectionTokenParseError(`The connection token '${connectionToken} does not adhere to the characters 0-9, a-z, A-Z or -.`);
            }
            if (compatibility) {
                // TODO: Remove this case soon
                return new OptionalServerConnectionToken(connectionToken);
            }
            return new MandatoryServerConnectionToken(connectionToken);
        }
        if (compatibility) {
            // TODO: Remove this case soon
            console.log(`Breaking change in the next release: Please use one of the following arguments: '--connection-token', '--connection-token-file' or '--without-connection-token'.`);
            return new OptionalServerConnectionToken(await defaultValue());
        }
        return new MandatoryServerConnectionToken(await defaultValue());
    }
    exports.parseServerConnectionToken = parseServerConnectionToken;
    async function determineServerConnectionToken(args) {
        const readOrGenerateConnectionToken = async () => {
            if (!args['user-data-dir']) {
                // No place to store it!
                return (0, uuid_1.generateUuid)();
            }
            const storageLocation = path.join(args['user-data-dir'], 'token');
            // First try to find a connection token
            try {
                const fileContents = await pfs_1.Promises.readFile(storageLocation);
                const connectionToken = fileContents.toString().replace(/\r?\n$/, '');
                if (connectionTokenRegex.test(connectionToken)) {
                    return connectionToken;
                }
            }
            catch (err) { }
            // No connection token found, generate one
            const connectionToken = (0, uuid_1.generateUuid)();
            try {
                // Try to store it
                await pfs_1.Promises.writeFile(storageLocation, connectionToken, { mode: 0o600 });
            }
            catch (err) { }
            return connectionToken;
        };
        return parseServerConnectionToken(args, readOrGenerateConnectionToken);
    }
    exports.determineServerConnectionToken = determineServerConnectionToken;
    function requestHasValidConnectionToken(connectionToken, req, parsedUrl) {
        // First check if there is a valid query parameter
        if (connectionToken.validate(parsedUrl.query[network_1.connectionTokenQueryName])) {
            return true;
        }
        // Otherwise, check if there is a valid cookie
        const cookies = cookie.parse(req.headers.cookie || '');
        return connectionToken.validate(cookies[network_1.connectionTokenCookieName]);
    }
    exports.requestHasValidConnectionToken = requestHasValidConnectionToken;
});
//# sourceMappingURL=serverConnectionToken.js.map