/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/severity", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, codicons_1, severity_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SeverityIcon = void 0;
    var SeverityIcon;
    (function (SeverityIcon) {
        function className(severity) {
            switch (severity) {
                case severity_1.default.Ignore:
                    return 'severity-ignore ' + codicons_1.Codicon.info.classNames;
                case severity_1.default.Info:
                    return codicons_1.Codicon.info.classNames;
                case severity_1.default.Warning:
                    return codicons_1.Codicon.warning.classNames;
                case severity_1.default.Error:
                    return codicons_1.Codicon.error.classNames;
                default:
                    return '';
            }
        }
        SeverityIcon.className = className;
    })(SeverityIcon = exports.SeverityIcon || (exports.SeverityIcon = {}));
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const errorIconForeground = theme.getColor(colorRegistry_1.problemsErrorIconForeground);
        if (errorIconForeground) {
            const errorCodiconSelector = codicons_1.Codicon.error.cssSelector;
            collector.addRule(`
			.monaco-editor .zone-widget ${errorCodiconSelector},
			.markers-panel .marker-icon${errorCodiconSelector},
			.text-search-provider-messages .providerMessage ${errorCodiconSelector},
			.extensions-viewlet > .extensions ${errorCodiconSelector} {
				color: ${errorIconForeground};
			}
		`);
        }
        const warningIconForeground = theme.getColor(colorRegistry_1.problemsWarningIconForeground);
        if (warningIconForeground) {
            const warningCodiconSelector = codicons_1.Codicon.warning.cssSelector;
            collector.addRule(`
			.monaco-editor .zone-widget ${warningCodiconSelector},
			.markers-panel .marker-icon${warningCodiconSelector},
			.extensions-viewlet > .extensions ${warningCodiconSelector},
			.extension-editor ${warningCodiconSelector},
			.text-search-provider-messages .providerMessage ${warningCodiconSelector},
			.preferences-editor ${warningCodiconSelector} {
				color: ${warningIconForeground};
			}
		`);
        }
        const infoIconForeground = theme.getColor(colorRegistry_1.problemsInfoIconForeground);
        if (infoIconForeground) {
            const infoCodiconSelector = codicons_1.Codicon.info.cssSelector;
            collector.addRule(`
			.monaco-editor .zone-widget ${infoCodiconSelector},
			.markers-panel .marker-icon${infoCodiconSelector},
			.extensions-viewlet > .extensions ${infoCodiconSelector},
			.text-search-provider-messages .providerMessage ${infoCodiconSelector},
			.extension-editor ${infoCodiconSelector} {
				color: ${infoIconForeground};
			}
		`);
        }
    });
});
//# sourceMappingURL=severityIcon.js.map