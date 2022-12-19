/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoverParticipantRegistry = exports.HoverForeignElementAnchor = exports.HoverRangeAnchor = exports.HoverAnchorType = void 0;
    var HoverAnchorType;
    (function (HoverAnchorType) {
        HoverAnchorType[HoverAnchorType["Range"] = 1] = "Range";
        HoverAnchorType[HoverAnchorType["ForeignElement"] = 2] = "ForeignElement";
    })(HoverAnchorType = exports.HoverAnchorType || (exports.HoverAnchorType = {}));
    class HoverRangeAnchor {
        constructor(priority, range) {
            this.priority = priority;
            this.range = range;
            this.type = 1 /* HoverAnchorType.Range */;
        }
        equals(other) {
            return (other.type === 1 /* HoverAnchorType.Range */ && this.range.equalsRange(other.range));
        }
        canAdoptVisibleHover(lastAnchor, showAtPosition) {
            return (lastAnchor.type === 1 /* HoverAnchorType.Range */ && showAtPosition.lineNumber === this.range.startLineNumber);
        }
    }
    exports.HoverRangeAnchor = HoverRangeAnchor;
    class HoverForeignElementAnchor {
        constructor(priority, owner, range) {
            this.priority = priority;
            this.owner = owner;
            this.range = range;
            this.type = 2 /* HoverAnchorType.ForeignElement */;
        }
        equals(other) {
            return (other.type === 2 /* HoverAnchorType.ForeignElement */ && this.owner === other.owner);
        }
        canAdoptVisibleHover(lastAnchor, showAtPosition) {
            return (lastAnchor.type === 2 /* HoverAnchorType.ForeignElement */ && this.owner === lastAnchor.owner);
        }
    }
    exports.HoverForeignElementAnchor = HoverForeignElementAnchor;
    exports.HoverParticipantRegistry = (new class HoverParticipantRegistry {
        constructor() {
            this._participants = [];
        }
        register(ctor) {
            this._participants.push(ctor);
        }
        getAll() {
            return this._participants;
        }
    }());
});
//# sourceMappingURL=hoverTypes.js.map