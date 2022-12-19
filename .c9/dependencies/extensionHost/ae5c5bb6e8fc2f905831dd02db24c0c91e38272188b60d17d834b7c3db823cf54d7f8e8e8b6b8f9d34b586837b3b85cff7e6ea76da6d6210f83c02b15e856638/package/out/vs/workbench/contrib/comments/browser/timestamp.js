/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/date", "vs/base/common/lifecycle", "vs/workbench/contrib/comments/common/commentsConfiguration"], function (require, exports, dom, date_1, lifecycle_1, commentsConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimestampWidget = void 0;
    class TimestampWidget extends lifecycle_1.Disposable {
        constructor(configurationService, container, timeStamp) {
            super();
            this.configurationService = configurationService;
            this._date = dom.append(container, dom.$('span.timestamp'));
            this._date.style.display = 'none';
            this._useRelativeTime = this.useRelativeTimeSetting;
            this.setTimestamp(timeStamp);
        }
        get useRelativeTimeSetting() {
            return this.configurationService.getValue(commentsConfiguration_1.COMMENTS_SECTION).useRelativeTime;
        }
        async setTimestamp(timestamp) {
            if ((timestamp !== this._timestamp) || (this.useRelativeTimeSetting !== this._useRelativeTime)) {
                this.updateDate(timestamp);
            }
            this._timestamp = timestamp;
            this._useRelativeTime = this.useRelativeTimeSetting;
        }
        updateDate(timestamp) {
            if (!timestamp) {
                this._date.textContent = '';
                this._date.style.display = 'none';
            }
            else if ((timestamp !== this._timestamp)
                || (this.useRelativeTimeSetting !== this._useRelativeTime)) {
                this._date.style.display = '';
                let textContent;
                let tooltip;
                if (this.useRelativeTimeSetting) {
                    textContent = this.getRelative(timestamp);
                    tooltip = this.getDateString(timestamp);
                }
                else {
                    textContent = this.getDateString(timestamp);
                }
                this._date.textContent = textContent;
                if (tooltip) {
                    this._date.title = tooltip;
                }
            }
        }
        getRelative(date) {
            return (0, date_1.fromNow)(date, true, true);
        }
        getDateString(date) {
            return date.toLocaleString();
        }
    }
    exports.TimestampWidget = TimestampWidget;
});
//# sourceMappingURL=timestamp.js.map