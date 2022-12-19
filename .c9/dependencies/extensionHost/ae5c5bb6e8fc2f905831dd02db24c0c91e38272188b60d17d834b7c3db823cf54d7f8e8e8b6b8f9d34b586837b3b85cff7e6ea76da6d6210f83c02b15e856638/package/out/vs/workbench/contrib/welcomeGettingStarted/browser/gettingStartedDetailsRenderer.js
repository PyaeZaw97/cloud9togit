/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/uuid", "vs/editor/common/languages/supports/tokenization", "vs/editor/common/languages", "vs/workbench/contrib/markdown/browser/markdownDocumentRenderer", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/types", "vs/workbench/common/webview", "vs/base/common/map", "vs/platform/files/common/files", "vs/platform/notification/common/notification", "vs/editor/common/languages/language", "vs/workbench/services/extensions/common/extensions"], function (require, exports, uuid_1, tokenization_1, languages_1, markdownDocumentRenderer_1, platform_1, resources_1, types_1, webview_1, map_1, files_1, notification_1, language_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GettingStartedDetailsRenderer = void 0;
    let GettingStartedDetailsRenderer = class GettingStartedDetailsRenderer {
        constructor(fileService, notificationService, extensionService, languageService) {
            this.fileService = fileService;
            this.notificationService = notificationService;
            this.extensionService = extensionService;
            this.languageService = languageService;
            this.mdCache = new map_1.ResourceMap();
            this.svgCache = new map_1.ResourceMap();
        }
        async renderMarkdown(path, base) {
            const content = await this.readAndCacheStepMarkdown(path, base);
            const nonce = (0, uuid_1.generateUuid)();
            const colorMap = languages_1.TokenizationRegistry.getColorMap();
            const css = colorMap ? (0, tokenization_1.generateTokensCSSForColorMap)(colorMap) : '';
            const inDev = document.location.protocol === 'http:';
            const imgSrcCsp = inDev ? 'img-src https: data: http:' : 'img-src https: data:';
            return `<!DOCTYPE html>
		<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; ${imgSrcCsp}; media-src https:; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}';">
				<style nonce="${nonce}">
					${markdownDocumentRenderer_1.DEFAULT_MARKDOWN_STYLES}
					${css}
					body > img {
						align-self: flex-start;
					}
					body > img[centered] {
						align-self: center;
					}
					body {
						display: flex;
						flex-direction: column;
						padding: 0;
						height: inherit;
					}
					checklist {
						display: flex;
						flex-wrap: wrap;
						justify-content: space-around;
					}
					checkbox {
						display: flex;
						flex-direction: column;
						align-items: center;
						margin: 5px;
						cursor: pointer;
					}
					checkbox.checked > img {
						box-sizing: border-box;
						margin-bottom: 4px;
					}
					checkbox.checked > img {
						outline: 2px solid var(--vscode-focusBorder);
						outline-offset: 2px;
					}
					blockquote > p:first-child {
						margin-top: 0;
					}
					body > * {
						margin-block-end: 0.25em;
						margin-block-start: 0.25em;
					}
					vertically-centered {
						padding-top: 5px;
						padding-bottom: 5px;
					}
					html {
						height: 100%;
						padding-right: 32px;
					}
					h1 {
						font-size: 19.5px;
					}
					h2 {
						font-size: 18.5px;
					}
				</style>
			</head>
			<body>
				<vertically-centered>
					${content}
				</vertically-centered>
			</body>
			<script nonce="${nonce}">
				const vscode = acquireVsCodeApi();
				document.querySelectorAll('[when-checked]').forEach(el => {
					el.addEventListener('click', () => {
						vscode.postMessage(el.getAttribute('when-checked'));
					});
				});

				let ongoingLayout = undefined;
				const doLayout = () => {
					document.querySelectorAll('vertically-centered').forEach(element => {
						element.style.marginTop = Math.max((document.body.clientHeight - element.scrollHeight) * 3/10, 0) + 'px';
					});
					ongoingLayout = undefined;
				};

				const layout = () => {
					if (ongoingLayout) {
						clearTimeout(ongoingLayout);
					}
					ongoingLayout = setTimeout(doLayout, 0);
				};

				layout();

				document.querySelectorAll('img').forEach(element => {
					element.onload = layout;
				})

				window.addEventListener('message', event => {
					if (event.data.layoutMeNow) {
						layout();
					}
					if (event.data.enabledContextKeys) {
						document.querySelectorAll('.checked').forEach(element => element.classList.remove('checked'))
						for (const key of event.data.enabledContextKeys) {
							document.querySelectorAll('[checked-on="' + key + '"]').forEach(element => element.classList.add('checked'))
						}
					}
				});
		</script>
		</html>`;
        }
        async renderSVG(path) {
            const content = await this.readAndCacheSVGFile(path);
            const nonce = (0, uuid_1.generateUuid)();
            const colorMap = languages_1.TokenizationRegistry.getColorMap();
            const css = colorMap ? (0, tokenization_1.generateTokensCSSForColorMap)(colorMap) : '';
            return `<!DOCTYPE html>
		<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'nonce-${nonce}';">
				<style nonce="${nonce}">
					${markdownDocumentRenderer_1.DEFAULT_MARKDOWN_STYLES}
					${css}
					svg {
						position: fixed;
						height: 100%;
						width: 80%;
						left: 50%;
						top: 50%;
						max-width: 530px;
						min-width: 350px;
						transform: translate(-50%,-50%);
					}
				</style>
			</head>
			<body>
				${content}
			</body>
		</html>`;
        }
        readAndCacheSVGFile(path) {
            if (!this.svgCache.has(path)) {
                this.svgCache.set(path, this.readContentsOfPath(path, false));
            }
            return (0, types_1.assertIsDefined)(this.svgCache.get(path));
        }
        readAndCacheStepMarkdown(path, base) {
            if (!this.mdCache.has(path)) {
                this.mdCache.set(path, this.readContentsOfPath(path).then(rawContents => (0, markdownDocumentRenderer_1.renderMarkdownDocument)(transformUris(rawContents, base), this.extensionService, this.languageService, true, true)));
            }
            return (0, types_1.assertIsDefined)(this.mdCache.get(path));
        }
        async readContentsOfPath(path, useModuleId = true) {
            try {
                const moduleId = JSON.parse(path.query).moduleId;
                if (useModuleId && moduleId) {
                    const contents = await new Promise(c => {
                        require([moduleId], content => {
                            c(content.default());
                        });
                    });
                    return contents;
                }
            }
            catch (_a) { }
            try {
                const localizedPath = path.with({ path: path.path.replace(/\.md$/, `.nls.${platform_1.locale}.md`) });
                const generalizedLocale = platform_1.locale === null || platform_1.locale === void 0 ? void 0 : platform_1.locale.replace(/-.*$/, '');
                const generalizedLocalizedPath = path.with({ path: path.path.replace(/\.md$/, `.nls.${generalizedLocale}.md`) });
                const fileExists = (file) => this.fileService
                    .stat(file)
                    .then((stat) => !!stat.size) // Double check the file actually has content for fileSystemProviders that fake `stat`. #131809
                    .catch(() => false);
                const [localizedFileExists, generalizedLocalizedFileExists] = await Promise.all([
                    fileExists(localizedPath),
                    fileExists(generalizedLocalizedPath),
                ]);
                const bytes = await this.fileService.readFile(localizedFileExists
                    ? localizedPath
                    : generalizedLocalizedFileExists
                        ? generalizedLocalizedPath
                        : path);
                return bytes.value.toString();
            }
            catch (e) {
                this.notificationService.error('Error reading markdown document at `' + path + '`: ' + e);
                return '';
            }
        }
    };
    GettingStartedDetailsRenderer = __decorate([
        __param(0, files_1.IFileService),
        __param(1, notification_1.INotificationService),
        __param(2, extensions_1.IExtensionService),
        __param(3, language_1.ILanguageService)
    ], GettingStartedDetailsRenderer);
    exports.GettingStartedDetailsRenderer = GettingStartedDetailsRenderer;
    const transformUri = (src, base) => {
        const path = (0, resources_1.joinPath)(base, src);
        return (0, webview_1.asWebviewUri)(path).toString();
    };
    const transformUris = (content, base) => content
        .replace(/src="([^"]*)"/g, (_, src) => {
        if (src.startsWith('https://')) {
            return `src="${src}"`;
        }
        return `src="${transformUri(src, base)}"`;
    })
        .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, (_, title, src) => {
        if (src.startsWith('https://')) {
            return `![${title}](${src})`;
        }
        return `![${title}](${transformUri(src, base)})`;
    });
});
//# sourceMappingURL=gettingStartedDetailsRenderer.js.map