/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProgressBadge = exports.IconBadge = exports.TextBadge = exports.NumberBadge = exports.IActivityService = void 0;
    exports.IActivityService = (0, instantiation_1.createDecorator)('activityService');
    class BaseBadge {
        constructor(descriptorFn) {
            this.descriptorFn = descriptorFn;
            this.descriptorFn = descriptorFn;
        }
        getDescription() {
            return this.descriptorFn(null);
        }
    }
    class NumberBadge extends BaseBadge {
        constructor(number, descriptorFn) {
            super(descriptorFn);
            this.number = number;
            this.number = number;
        }
        getDescription() {
            return this.descriptorFn(this.number);
        }
    }
    exports.NumberBadge = NumberBadge;
    class TextBadge extends BaseBadge {
        constructor(text, descriptorFn) {
            super(descriptorFn);
            this.text = text;
        }
    }
    exports.TextBadge = TextBadge;
    class IconBadge extends BaseBadge {
        constructor(icon, descriptorFn) {
            super(descriptorFn);
            this.icon = icon;
        }
    }
    exports.IconBadge = IconBadge;
    class ProgressBadge extends BaseBadge {
    }
    exports.ProgressBadge = ProgressBadge;
});
//# sourceMappingURL=activity.js.map