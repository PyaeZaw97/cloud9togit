/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toLocalISOString = exports.fromNow = void 0;
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;
    function fromNow(date, appendAgoLabel, useFullTimeWords) {
        if (typeof date !== 'number') {
            date = date.getTime();
        }
        const seconds = Math.round((new Date().getTime() - date) / 1000);
        if (seconds < -30) {
            return (0, nls_1.localize)('date.fromNow.in', 'in {0}', fromNow(new Date().getTime() + seconds * 1000, false));
        }
        if (seconds < 30) {
            return (0, nls_1.localize)('date.fromNow.now', 'now');
        }
        let value;
        if (seconds < minute) {
            value = seconds;
            if (appendAgoLabel) {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.seconds.singular.ago.fullWord', '{0} second ago', value)
                        : (0, nls_1.localize)('date.fromNow.seconds.singular.ago', '{0} sec ago', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.seconds.plural.ago.fullWord', '{0} seconds ago', value)
                        : (0, nls_1.localize)('date.fromNow.seconds.plural.ago', '{0} secs ago', value);
                }
            }
            else {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.seconds.singular.fullWord', '{0} second', value)
                        : (0, nls_1.localize)('date.fromNow.seconds.singular', '{0} sec', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.seconds.plural.fullWord', '{0} seconds', value)
                        : (0, nls_1.localize)('date.fromNow.seconds.plural', '{0} secs', value);
                }
            }
        }
        if (seconds < hour) {
            value = Math.floor(seconds / minute);
            if (appendAgoLabel) {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.minutes.singular.ago.fullWord', '{0} minute ago', value)
                        : (0, nls_1.localize)('date.fromNow.minutes.singular.ago', '{0} min ago', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.minutes.plural.ago.fullWord', '{0} minutes ago', value)
                        : (0, nls_1.localize)('date.fromNow.minutes.plural.ago', '{0} mins ago', value);
                }
            }
            else {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.minutes.singular.fullWord', '{0} minute', value)
                        : (0, nls_1.localize)('date.fromNow.minutes.singular', '{0} min', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.minutes.plural.fullWord', '{0} minutes', value)
                        : (0, nls_1.localize)('date.fromNow.minutes.plural', '{0} mins', value);
                }
            }
        }
        if (seconds < day) {
            value = Math.floor(seconds / hour);
            if (appendAgoLabel) {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.hours.singular.ago.fullWord', '{0} hour ago', value)
                        : (0, nls_1.localize)('date.fromNow.hours.singular.ago', '{0} hr ago', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.hours.plural.ago.fullWord', '{0} hours ago', value)
                        : (0, nls_1.localize)('date.fromNow.hours.plural.ago', '{0} hrs ago', value);
                }
            }
            else {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.hours.singular.fullWord', '{0} hour', value)
                        : (0, nls_1.localize)('date.fromNow.hours.singular', '{0} hr', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.hours.plural.fullWord', '{0} hours', value)
                        : (0, nls_1.localize)('date.fromNow.hours.plural', '{0} hrs', value);
                }
            }
        }
        if (seconds < week) {
            value = Math.floor(seconds / day);
            if (appendAgoLabel) {
                return value === 1
                    ? (0, nls_1.localize)('date.fromNow.days.singular.ago', '{0} day ago', value)
                    : (0, nls_1.localize)('date.fromNow.days.plural.ago', '{0} days ago', value);
            }
            else {
                return value === 1
                    ? (0, nls_1.localize)('date.fromNow.days.singular', '{0} day', value)
                    : (0, nls_1.localize)('date.fromNow.days.plural', '{0} days', value);
            }
        }
        if (seconds < month) {
            value = Math.floor(seconds / week);
            if (appendAgoLabel) {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.weeks.singular.ago.fullWord', '{0} week ago', value)
                        : (0, nls_1.localize)('date.fromNow.weeks.singular.ago', '{0} wk ago', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.weeks.plural.ago.fullWord', '{0} weeks ago', value)
                        : (0, nls_1.localize)('date.fromNow.weeks.plural.ago', '{0} wks ago', value);
                }
            }
            else {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.weeks.singular.fullWord', '{0} week', value)
                        : (0, nls_1.localize)('date.fromNow.weeks.singular', '{0} wk', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.weeks.plural.fullWord', '{0} weeks', value)
                        : (0, nls_1.localize)('date.fromNow.weeks.plural', '{0} wks', value);
                }
            }
        }
        if (seconds < year) {
            value = Math.floor(seconds / month);
            if (appendAgoLabel) {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.months.singular.ago.fullWord', '{0} month ago', value)
                        : (0, nls_1.localize)('date.fromNow.months.singular.ago', '{0} mo ago', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.months.plural.ago.fullWord', '{0} months ago', value)
                        : (0, nls_1.localize)('date.fromNow.months.plural.ago', '{0} mos ago', value);
                }
            }
            else {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.months.singular.fullWord', '{0} month', value)
                        : (0, nls_1.localize)('date.fromNow.months.singular', '{0} mo', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.months.plural.fullWord', '{0} months', value)
                        : (0, nls_1.localize)('date.fromNow.months.plural', '{0} mos', value);
                }
            }
        }
        value = Math.floor(seconds / year);
        if (appendAgoLabel) {
            if (value === 1) {
                return useFullTimeWords
                    ? (0, nls_1.localize)('date.fromNow.years.singular.ago.fullWord', '{0} year ago', value)
                    : (0, nls_1.localize)('date.fromNow.years.singular.ago', '{0} yr ago', value);
            }
            else {
                return useFullTimeWords
                    ? (0, nls_1.localize)('date.fromNow.years.plural.ago.fullWord', '{0} years ago', value)
                    : (0, nls_1.localize)('date.fromNow.years.plural.ago', '{0} yrs ago', value);
            }
        }
        else {
            if (value === 1) {
                return useFullTimeWords
                    ? (0, nls_1.localize)('date.fromNow.years.singular.fullWord', '{0} year', value)
                    : (0, nls_1.localize)('date.fromNow.years.singular', '{0} yr', value);
            }
            else {
                return useFullTimeWords
                    ? (0, nls_1.localize)('date.fromNow.years.plural.fullWord', '{0} years', value)
                    : (0, nls_1.localize)('date.fromNow.years.plural', '{0} yrs', value);
            }
        }
    }
    exports.fromNow = fromNow;
    function toLocalISOString(date) {
        return date.getFullYear() +
            '-' + String(date.getMonth() + 1).padStart(2, '0') +
            '-' + String(date.getDate()).padStart(2, '0') +
            'T' + String(date.getHours()).padStart(2, '0') +
            ':' + String(date.getMinutes()).padStart(2, '0') +
            ':' + String(date.getSeconds()).padStart(2, '0') +
            '.' + (date.getMilliseconds() / 1000).toFixed(3).slice(2, 5) +
            'Z';
    }
    exports.toLocalISOString = toLocalISOString;
});
//# sourceMappingURL=date.js.map