/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DataTransferConverter = void 0;
    var DataTransferConverter;
    (function (DataTransferConverter) {
        function toDataTransfer(value) {
            const newDataTransfer = new Map();
            value.types.forEach((type, index) => {
                newDataTransfer.set(type, {
                    asString: async () => value.items[index].asString,
                    value: undefined
                });
            });
            return newDataTransfer;
        }
        DataTransferConverter.toDataTransfer = toDataTransfer;
        async function toDataTransferDTO(value) {
            const newDTO = {
                types: [],
                items: []
            };
            const entries = Array.from(value.entries());
            for (const entry of entries) {
                newDTO.types.push(entry[0]);
                newDTO.items.push({
                    asString: await entry[1].asString()
                });
            }
            return newDTO;
        }
        DataTransferConverter.toDataTransferDTO = toDataTransferDTO;
    })(DataTransferConverter = exports.DataTransferConverter || (exports.DataTransferConverter = {}));
});
//# sourceMappingURL=dataTransfer.js.map