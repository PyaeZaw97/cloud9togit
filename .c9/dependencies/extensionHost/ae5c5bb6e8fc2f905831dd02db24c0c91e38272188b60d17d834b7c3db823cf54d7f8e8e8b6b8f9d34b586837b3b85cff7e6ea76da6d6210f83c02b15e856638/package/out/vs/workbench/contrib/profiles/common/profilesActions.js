/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/platform/request/common/request", "vs/workbench/services/profiles/common/profile", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, cancellation_1, lifecycle_1, resources_1, nls_1, actions_1, dialogs_1, files_1, notification_1, quickInput_1, request_1, profile_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, actions_1.registerAction2)(class ExportProfileAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.profiles.actions.exportProfile',
                title: {
                    value: (0, nls_1.localize)('export profile', "Export Settings as a Profile..."),
                    original: 'Export Settings as a Profile...'
                },
                category: profile_1.PROFILES_CATEGORY,
                f1: true
            });
        }
        async run(accessor) {
            const textFileService = accessor.get(textfiles_1.ITextFileService);
            const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
            const profileService = accessor.get(profile_1.IWorkbenchProfileService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const profileLocation = await fileDialogService.showSaveDialog({
                title: (0, nls_1.localize)('export profile dialog', "Save Profile"),
                filters: profile_1.PROFILE_FILTER,
                defaultUri: (0, resources_1.joinPath)(await fileDialogService.defaultFilePath(undefined), `profile.${profile_1.PROFILE_EXTENSION}`),
            });
            if (!profileLocation) {
                return;
            }
            const profile = await profileService.createProfile({ skipComments: true });
            await textFileService.create([{ resource: profileLocation, value: JSON.stringify(profile), options: { overwrite: true } }]);
            notificationService.info((0, nls_1.localize)('export success', "{0}: Exported successfully.", profile_1.PROFILES_CATEGORY));
        }
    });
    (0, actions_1.registerAction2)(class ImportProfileAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.profiles.actions.importProfile',
                title: {
                    value: (0, nls_1.localize)('import profile', "Import Settings from a Profile..."),
                    original: 'Import Settings from a Profile...'
                },
                category: profile_1.PROFILES_CATEGORY,
                f1: true
            });
        }
        async run(accessor) {
            const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const fileService = accessor.get(files_1.IFileService);
            const requestService = accessor.get(request_1.IRequestService);
            const profileService = accessor.get(profile_1.IWorkbenchProfileService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            if (!(await dialogService.confirm({
                title: (0, nls_1.localize)('import profile title', "Import Settings from a Profile"),
                message: (0, nls_1.localize)('confiirmation message', "This will replace your current settings. Are you sure you want to continue?"),
            })).confirmed) {
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            const quickPick = disposables.add(quickInputService.createQuickPick());
            const updateQuickPickItems = (value) => {
                const selectFromFileItem = { label: (0, nls_1.localize)('select from file', "Import from profile file") };
                quickPick.items = value ? [{ label: (0, nls_1.localize)('select from url', "Import from URL"), description: quickPick.value }, selectFromFileItem] : [selectFromFileItem];
            };
            quickPick.title = (0, nls_1.localize)('import profile quick pick title', "Import Settings from a Profile");
            quickPick.placeholder = (0, nls_1.localize)('import profile placeholder', "Provide profile URL or select profile file to import");
            quickPick.ignoreFocusOut = true;
            disposables.add(quickPick.onDidChangeValue(updateQuickPickItems));
            updateQuickPickItems();
            quickPick.matchOnLabel = false;
            quickPick.matchOnDescription = false;
            disposables.add(quickPick.onDidAccept(async () => {
                quickPick.hide();
                const profile = quickPick.selectedItems[0].description ? await this.getProfileFromURL(quickPick.value, requestService) : await this.getProfileFromFileSystem(fileDialogService, fileService);
                if (profile) {
                    await profileService.setProfile(profile);
                }
            }));
            disposables.add(quickPick.onDidHide(() => disposables.dispose()));
            quickPick.show();
        }
        async getProfileFromFileSystem(fileDialogService, fileService) {
            const profileLocation = await fileDialogService.showOpenDialog({
                canSelectFolders: false,
                canSelectFiles: true,
                canSelectMany: false,
                filters: profile_1.PROFILE_FILTER,
                title: (0, nls_1.localize)('import profile dialog', "Import Profile"),
            });
            if (!profileLocation) {
                return null;
            }
            const content = (await fileService.readFile(profileLocation[0])).value.toString();
            const parsed = JSON.parse(content);
            return (0, profile_1.isProfile)(parsed) ? parsed : null;
        }
        async getProfileFromURL(url, requestService) {
            const options = { type: 'GET', url };
            const context = await requestService.request(options, cancellation_1.CancellationToken.None);
            if (context.res.statusCode === 200) {
                const result = await (0, request_1.asJson)(context);
                return (0, profile_1.isProfile)(result) ? result : null;
            }
            else {
                const message = await (0, request_1.asText)(context);
                throw new Error(`Expected 200, got back ${context.res.statusCode} instead.\n\n${message}`);
            }
        }
    });
});
//# sourceMappingURL=profilesActions.js.map