/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionRecommendationNotificationServiceChannel = exports.ExtensionRecommendationNotificationServiceChannelClient = void 0;
    class ExtensionRecommendationNotificationServiceChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        get ignoredRecommendations() { throw new Error('not supported'); }
        promptImportantExtensionsInstallNotification(extensionIds, message, searchValue, priority) {
            return this.channel.call('promptImportantExtensionsInstallNotification', [extensionIds, message, searchValue, priority]);
        }
        promptWorkspaceRecommendations(recommendations) {
            throw new Error('not supported');
        }
        hasToIgnoreRecommendationNotifications() {
            throw new Error('not supported');
        }
    }
    exports.ExtensionRecommendationNotificationServiceChannelClient = ExtensionRecommendationNotificationServiceChannelClient;
    class ExtensionRecommendationNotificationServiceChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, args) {
            switch (command) {
                case 'promptImportantExtensionsInstallNotification': return this.service.promptImportantExtensionsInstallNotification(args[0], args[1], args[2], args[3]);
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.ExtensionRecommendationNotificationServiceChannel = ExtensionRecommendationNotificationServiceChannel;
});
//# sourceMappingURL=extensionRecommendationsIpc.js.map