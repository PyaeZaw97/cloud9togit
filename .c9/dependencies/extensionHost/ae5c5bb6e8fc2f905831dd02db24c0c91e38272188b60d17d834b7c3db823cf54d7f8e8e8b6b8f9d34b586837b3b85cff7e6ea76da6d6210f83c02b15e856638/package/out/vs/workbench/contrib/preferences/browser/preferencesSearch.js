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
define(["require", "exports", "vs/workbench/services/preferences/common/preferences", "vs/base/common/arrays", "vs/base/common/strings", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/filters", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/workbench/contrib/preferences/common/preferences", "vs/platform/request/common/request", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/log/common/log", "vs/base/common/cancellation", "vs/base/common/errors", "vs/workbench/services/preferences/common/preferencesModels", "vs/platform/configuration/common/configuration", "vs/platform/product/common/productService", "vs/platform/instantiation/common/extensions"], function (require, exports, preferences_1, arrays_1, strings, platform_1, configurationRegistry_1, filters_1, instantiation_1, lifecycle_1, preferences_2, request_1, extensionManagement_1, extensionManagement_2, log_1, cancellation_1, errors_1, preferencesModels_1, configuration_1, productService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingMatches = exports.LocalSearchProvider = exports.PreferencesSearchService = void 0;
    let PreferencesSearchService = class PreferencesSearchService extends lifecycle_1.Disposable {
        constructor(instantiationService, configurationService, productService, extensionManagementService, extensionEnablementService) {
            super();
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.productService = productService;
            this.extensionManagementService = extensionManagementService;
            this.extensionEnablementService = extensionEnablementService;
            // This request goes to the shared process but results won't change during a window's lifetime, so cache the results.
            this._installedExtensions = this.extensionManagementService.getInstalled(1 /* ExtensionType.User */).then(exts => {
                // Filter to enabled extensions that have settings
                return exts
                    .filter(ext => this.extensionEnablementService.isEnabled(ext))
                    .filter(ext => ext.manifest && ext.manifest.contributes && ext.manifest.contributes.configuration)
                    .filter(ext => !!ext.identifier.uuid);
            });
        }
        get remoteSearchAllowed() {
            const workbenchSettings = this.configurationService.getValue().workbench.settings;
            if (!workbenchSettings.enableNaturalLanguageSearch) {
                return false;
            }
            return !!this._endpoint.urlBase;
        }
        get _endpoint() {
            const workbenchSettings = this.configurationService.getValue().workbench.settings;
            if (workbenchSettings.naturalLanguageSearchEndpoint) {
                return {
                    urlBase: workbenchSettings.naturalLanguageSearchEndpoint,
                    key: workbenchSettings.naturalLanguageSearchKey
                };
            }
            else {
                return {
                    urlBase: this.productService.settingsSearchUrl
                };
            }
        }
        getRemoteSearchProvider(filter, newExtensionsOnly = false) {
            const opts = {
                filter,
                newExtensionsOnly,
                endpoint: this._endpoint
            };
            return this.remoteSearchAllowed ? this.instantiationService.createInstance(RemoteSearchProvider, opts, this._installedExtensions) : undefined;
        }
        getLocalSearchProvider(filter) {
            return this.instantiationService.createInstance(LocalSearchProvider, filter);
        }
    };
    PreferencesSearchService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, productService_1.IProductService),
        __param(3, extensionManagement_1.IExtensionManagementService),
        __param(4, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], PreferencesSearchService);
    exports.PreferencesSearchService = PreferencesSearchService;
    let LocalSearchProvider = class LocalSearchProvider {
        constructor(_filter, configurationService) {
            this._filter = _filter;
            this.configurationService = configurationService;
            // Remove " and : which are likely to be copypasted as part of a setting name.
            // Leave other special characters which the user might want to search for.
            this._filter = this._filter
                .replace(/[":]/g, ' ')
                .replace(/  /g, ' ')
                .trim();
        }
        searchModel(preferencesModel, token) {
            if (!this._filter) {
                return Promise.resolve(null);
            }
            let orderedScore = LocalSearchProvider.START_SCORE; // Sort is not stable
            const settingMatcher = (setting) => {
                const { matches, matchType } = new SettingMatches(this._filter, setting, true, true, (filter, setting) => preferencesModel.findValueMatches(filter, setting), this.configurationService);
                const score = this._filter === setting.key ?
                    LocalSearchProvider.EXACT_MATCH_SCORE :
                    orderedScore--;
                return matches && matches.length ?
                    {
                        matches,
                        matchType,
                        score
                    } :
                    null;
            };
            const filterMatches = preferencesModel.filterSettings(this._filter, this.getGroupFilter(this._filter), settingMatcher);
            if (filterMatches[0] && filterMatches[0].score === LocalSearchProvider.EXACT_MATCH_SCORE) {
                return Promise.resolve({
                    filterMatches: filterMatches.slice(0, 1),
                    exactMatch: true
                });
            }
            else {
                return Promise.resolve({
                    filterMatches
                });
            }
        }
        getGroupFilter(filter) {
            const regex = strings.createRegExp(filter, false, { global: true });
            return (group) => {
                return regex.test(group.title);
            };
        }
    };
    LocalSearchProvider.EXACT_MATCH_SCORE = 10000;
    LocalSearchProvider.START_SCORE = 1000;
    LocalSearchProvider = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], LocalSearchProvider);
    exports.LocalSearchProvider = LocalSearchProvider;
    let RemoteSearchProvider = class RemoteSearchProvider {
        constructor(options, installedExtensions, productService, requestService, logService, configurationService) {
            this.options = options;
            this.installedExtensions = installedExtensions;
            this.productService = productService;
            this.requestService = requestService;
            this.logService = logService;
            this.configurationService = configurationService;
            this._remoteSearchP = this.options.filter ?
                Promise.resolve(this.getSettingsForFilter(this.options.filter)) :
                Promise.resolve(null);
        }
        searchModel(preferencesModel, token) {
            return this._remoteSearchP.then((remoteResult) => {
                if (!remoteResult) {
                    return null;
                }
                if (token && token.isCancellationRequested) {
                    throw new errors_1.CancellationError();
                }
                const resultKeys = Object.keys(remoteResult.scoredResults);
                const highScoreKey = (0, arrays_1.top)(resultKeys, (a, b) => remoteResult.scoredResults[b].score - remoteResult.scoredResults[a].score, 1)[0];
                const highScore = highScoreKey ? remoteResult.scoredResults[highScoreKey].score : 0;
                const minScore = highScore / 5;
                if (this.options.newExtensionsOnly) {
                    return this.installedExtensions.then(installedExtensions => {
                        const newExtsMinScore = Math.max(RemoteSearchProvider.NEW_EXTENSIONS_MIN_SCORE, minScore);
                        const passingScoreKeys = resultKeys
                            .filter(k => {
                            const result = remoteResult.scoredResults[k];
                            const resultExtId = (result.extensionPublisher + '.' + result.extensionName).toLowerCase();
                            return !installedExtensions.some(ext => ext.identifier.id.toLowerCase() === resultExtId);
                        })
                            .filter(k => remoteResult.scoredResults[k].score >= newExtsMinScore);
                        const filterMatches = passingScoreKeys.map(k => {
                            const remoteSetting = remoteResult.scoredResults[k];
                            const setting = remoteSettingToISetting(remoteSetting);
                            return {
                                setting,
                                score: remoteSetting.score,
                                matches: [],
                                matchType: preferences_1.SettingMatchType.None
                            };
                        });
                        return {
                            filterMatches,
                            metadata: remoteResult
                        };
                    });
                }
                else {
                    const settingMatcher = this.getRemoteSettingMatcher(remoteResult.scoredResults, minScore, preferencesModel);
                    const filterMatches = preferencesModel.filterSettings(this.options.filter, group => null, settingMatcher);
                    return {
                        filterMatches,
                        metadata: remoteResult
                    };
                }
            });
        }
        async getSettingsForFilter(filter) {
            const allRequestDetails = [];
            // Only send MAX_REQUESTS requests in total just to keep it sane
            for (let i = 0; i < RemoteSearchProvider.MAX_REQUESTS; i++) {
                const details = await this.prepareRequest(filter, i);
                allRequestDetails.push(details);
                if (!details.hasMoreFilters) {
                    break;
                }
            }
            return Promise.all(allRequestDetails.map(details => this.getSettingsFromBing(details))).then(allResponses => {
                // Merge all IFilterMetadata
                const metadata = allResponses[0];
                metadata.requestCount = 1;
                for (const response of allResponses.slice(1)) {
                    metadata.requestCount++;
                    metadata.scoredResults = Object.assign(Object.assign({}, metadata.scoredResults), response.scoredResults);
                }
                return metadata;
            });
        }
        getSettingsFromBing(details) {
            this.logService.debug(`Searching settings via ${details.url}`);
            if (details.body) {
                this.logService.debug(`Body: ${details.body}`);
            }
            const requestType = details.body ? 'post' : 'get';
            const headers = {
                'User-Agent': 'request',
                'Content-Type': 'application/json; charset=utf-8',
            };
            if (this.options.endpoint.key) {
                headers['api-key'] = this.options.endpoint.key;
            }
            const start = Date.now();
            return this.requestService.request({
                type: requestType,
                url: details.url,
                data: details.body,
                headers,
                timeout: 5000
            }, cancellation_1.CancellationToken.None).then(context => {
                if (typeof context.res.statusCode === 'number' && context.res.statusCode >= 300) {
                    throw new Error(`${JSON.stringify(details)} returned status code: ${context.res.statusCode}`);
                }
                return (0, request_1.asJson)(context);
            }).then((result) => {
                const timestamp = Date.now();
                const duration = timestamp - start;
                const remoteSettings = (result.value || [])
                    .map((r) => {
                    const key = JSON.parse(r.setting || r.Setting);
                    const packageId = r['packageid'];
                    const id = getSettingKey(key, packageId);
                    const value = r['value'];
                    const defaultValue = value ? JSON.parse(value) : value;
                    const packageName = r['packagename'];
                    let extensionName;
                    let extensionPublisher;
                    if (packageName && packageName.indexOf('##') >= 0) {
                        [extensionPublisher, extensionName] = packageName.split('##');
                    }
                    return {
                        key,
                        id,
                        defaultValue,
                        score: r['@search.score'],
                        description: JSON.parse(r['details']),
                        packageId,
                        extensionName,
                        extensionPublisher
                    };
                });
                const scoredResults = Object.create(null);
                remoteSettings.forEach(s => {
                    scoredResults[s.id] = s;
                });
                return {
                    requestUrl: details.url,
                    requestBody: details.body,
                    duration,
                    timestamp,
                    scoredResults,
                    context: result['@odata.context']
                };
            });
        }
        getRemoteSettingMatcher(scoredResults, minScore, preferencesModel) {
            return (setting, group) => {
                const remoteSetting = scoredResults[getSettingKey(setting.key, group.id)] || // extension setting
                    scoredResults[getSettingKey(setting.key, 'core')] || // core setting
                    scoredResults[getSettingKey(setting.key)]; // core setting from original prod endpoint
                if (remoteSetting && remoteSetting.score >= minScore) {
                    const { matches, matchType } = new SettingMatches(this.options.filter, setting, false, true, (filter, setting) => preferencesModel.findValueMatches(filter, setting), this.configurationService);
                    return { matches, matchType, score: remoteSetting.score };
                }
                return null;
            };
        }
        async prepareRequest(query, filterPage = 0) {
            const verbatimQuery = query;
            query = escapeSpecialChars(query);
            const boost = 10;
            const boostedQuery = `(${query})^${boost}`;
            // Appending Fuzzy after each word.
            query = query.replace(/\ +/g, '~ ') + '~';
            const encodedQuery = encodeURIComponent(boostedQuery + ' || ' + query);
            let url = `${this.options.endpoint.urlBase}`;
            if (this.options.endpoint.key) {
                url += `${API_VERSION}&${QUERY_TYPE}`;
            }
            const extensions = await this.installedExtensions;
            const filters = this.options.newExtensionsOnly ?
                [`diminish eq 'latest'`] :
                this.getVersionFilters(extensions, this.productService.settingsSearchBuildId);
            const filterStr = filters
                .slice(filterPage * RemoteSearchProvider.MAX_REQUEST_FILTERS, (filterPage + 1) * RemoteSearchProvider.MAX_REQUEST_FILTERS)
                .join(' or ');
            const hasMoreFilters = filters.length > (filterPage + 1) * RemoteSearchProvider.MAX_REQUEST_FILTERS;
            const body = JSON.stringify({
                search: encodedQuery,
                filters: encodeURIComponent(filterStr),
                rawQuery: encodeURIComponent(verbatimQuery)
            });
            return {
                url,
                body,
                hasMoreFilters
            };
        }
        getVersionFilters(exts, buildNumber) {
            // Only search extensions that contribute settings
            const filters = exts
                .filter(ext => ext.manifest.contributes && ext.manifest.contributes.configuration)
                .map(ext => this.getExtensionFilter(ext));
            if (buildNumber) {
                filters.push(`(packageid eq 'core' and startbuildno le '${buildNumber}' and endbuildno ge '${buildNumber}')`);
            }
            return filters;
        }
        getExtensionFilter(ext) {
            const uuid = ext.identifier.uuid;
            const versionString = ext.manifest.version
                .split('.')
                .map(versionPart => String(versionPart).padStart(10), '0')
                .join('');
            return `(packageid eq '${uuid}' and startbuildno le '${versionString}' and endbuildno ge '${versionString}')`;
        }
    };
    // Must keep extension filter size under 8kb. 42 filters puts us there.
    RemoteSearchProvider.MAX_REQUEST_FILTERS = 42;
    RemoteSearchProvider.MAX_REQUESTS = 10;
    RemoteSearchProvider.NEW_EXTENSIONS_MIN_SCORE = 1;
    RemoteSearchProvider = __decorate([
        __param(2, productService_1.IProductService),
        __param(3, request_1.IRequestService),
        __param(4, log_1.ILogService),
        __param(5, configuration_1.IConfigurationService)
    ], RemoteSearchProvider);
    function getSettingKey(name, packageId) {
        return packageId ?
            packageId + '##' + name :
            name;
    }
    const API_VERSION = 'api-version=2016-09-01-Preview';
    const QUERY_TYPE = 'querytype=full';
    function escapeSpecialChars(query) {
        return query.replace(/\./g, ' ')
            .replace(/[\\/+\-&|!"~*?:(){}\[\]\^]/g, '\\$&')
            .replace(/  /g, ' ') // collapse spaces
            .trim();
    }
    function remoteSettingToISetting(remoteSetting) {
        return {
            description: remoteSetting.description.split('\n'),
            descriptionIsMarkdown: false,
            descriptionRanges: [],
            key: remoteSetting.key,
            keyRange: preferencesModels_1.nullRange,
            value: remoteSetting.defaultValue,
            range: preferencesModels_1.nullRange,
            valueRange: preferencesModels_1.nullRange,
            overrides: [],
            extensionName: remoteSetting.extensionName,
            extensionPublisher: remoteSetting.extensionPublisher
        };
    }
    let SettingMatches = class SettingMatches {
        constructor(searchString, setting, requireFullQueryMatch, searchDescription, valuesMatcher, configurationService) {
            this.requireFullQueryMatch = requireFullQueryMatch;
            this.searchDescription = searchDescription;
            this.valuesMatcher = valuesMatcher;
            this.configurationService = configurationService;
            this.descriptionMatchingWords = new Map();
            this.keyMatchingWords = new Map();
            this.valueMatchingWords = new Map();
            this.matchType = preferences_1.SettingMatchType.None;
            this.matches = (0, arrays_1.distinct)(this._findMatchesInSetting(searchString, setting), (match) => `${match.startLineNumber}_${match.startColumn}_${match.endLineNumber}_${match.endColumn}_`);
        }
        _findMatchesInSetting(searchString, setting) {
            const result = this._doFindMatchesInSetting(searchString, setting);
            if (setting.overrides && setting.overrides.length) {
                for (const subSetting of setting.overrides) {
                    const subSettingMatches = new SettingMatches(searchString, subSetting, this.requireFullQueryMatch, this.searchDescription, this.valuesMatcher, this.configurationService);
                    const words = searchString.split(' ');
                    const descriptionRanges = this.getRangesForWords(words, this.descriptionMatchingWords, [subSettingMatches.descriptionMatchingWords, subSettingMatches.keyMatchingWords, subSettingMatches.valueMatchingWords]);
                    const keyRanges = this.getRangesForWords(words, this.keyMatchingWords, [subSettingMatches.descriptionMatchingWords, subSettingMatches.keyMatchingWords, subSettingMatches.valueMatchingWords]);
                    const subSettingKeyRanges = this.getRangesForWords(words, subSettingMatches.keyMatchingWords, [this.descriptionMatchingWords, this.keyMatchingWords, subSettingMatches.valueMatchingWords]);
                    const subSettingValueRanges = this.getRangesForWords(words, subSettingMatches.valueMatchingWords, [this.descriptionMatchingWords, this.keyMatchingWords, subSettingMatches.keyMatchingWords]);
                    result.push(...descriptionRanges, ...keyRanges, ...subSettingKeyRanges, ...subSettingValueRanges);
                    result.push(...subSettingMatches.matches);
                    this.refreshMatchType(keyRanges.length + subSettingKeyRanges.length);
                    this.matchType |= subSettingMatches.matchType;
                }
            }
            return result;
        }
        _doFindMatchesInSetting(searchString, setting) {
            const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            const schema = registry[setting.key];
            const words = searchString.split(' ');
            const settingKeyAsWords = setting.key.split('.').join(' ');
            const settingValue = this.configurationService.getValue(setting.key);
            for (const word of words) {
                // Whole word match attempts also take place within this loop.
                if (this.searchDescription) {
                    for (let lineIndex = 0; lineIndex < setting.description.length; lineIndex++) {
                        const descriptionMatches = (0, filters_1.matchesWords)(word, setting.description[lineIndex], true);
                        if (descriptionMatches) {
                            this.descriptionMatchingWords.set(word, descriptionMatches.map(match => this.toDescriptionRange(setting, match, lineIndex)));
                        }
                        this.checkForWholeWordMatchType(word, setting.description[lineIndex]);
                    }
                }
                const keyMatches = (0, filters_1.or)(filters_1.matchesWords, filters_1.matchesCamelCase)(word, settingKeyAsWords);
                if (keyMatches) {
                    this.keyMatchingWords.set(word, keyMatches.map(match => this.toKeyRange(setting, match)));
                }
                this.checkForWholeWordMatchType(word, settingKeyAsWords);
                const valueMatches = typeof settingValue === 'string' ? (0, filters_1.matchesContiguousSubString)(word, settingValue) : null;
                if (valueMatches) {
                    this.valueMatchingWords.set(word, valueMatches.map(match => this.toValueRange(setting, match)));
                }
                else if (schema && schema.enum && schema.enum.some(enumValue => typeof enumValue === 'string' && !!(0, filters_1.matchesContiguousSubString)(word, enumValue))) {
                    this.valueMatchingWords.set(word, []);
                }
                if (typeof settingValue === 'string') {
                    this.checkForWholeWordMatchType(word, settingValue);
                }
            }
            const descriptionRanges = [];
            if (this.searchDescription) {
                for (let lineIndex = 0; lineIndex < setting.description.length; lineIndex++) {
                    const matches = (0, filters_1.or)(filters_1.matchesContiguousSubString)(searchString, setting.description[lineIndex] || '') || [];
                    descriptionRanges.push(...matches.map(match => this.toDescriptionRange(setting, match, lineIndex)));
                }
                if (descriptionRanges.length === 0) {
                    descriptionRanges.push(...this.getRangesForWords(words, this.descriptionMatchingWords, [this.keyMatchingWords, this.valueMatchingWords]));
                }
            }
            const keyMatches = (0, filters_1.or)(filters_1.matchesPrefix, filters_1.matchesContiguousSubString)(searchString, setting.key);
            const keyRanges = keyMatches ? keyMatches.map(match => this.toKeyRange(setting, match)) : this.getRangesForWords(words, this.keyMatchingWords, [this.descriptionMatchingWords, this.valueMatchingWords]);
            let valueRanges = [];
            if (typeof settingValue === 'string' && settingValue) {
                const valueMatches = (0, filters_1.or)(filters_1.matchesPrefix, filters_1.matchesContiguousSubString)(searchString, settingValue);
                valueRanges = valueMatches ? valueMatches.map(match => this.toValueRange(setting, match)) : this.getRangesForWords(words, this.valueMatchingWords, [this.keyMatchingWords, this.descriptionMatchingWords]);
            }
            else {
                valueRanges = this.valuesMatcher(searchString, setting);
            }
            this.refreshMatchType(keyRanges.length);
            return [...descriptionRanges, ...keyRanges, ...valueRanges];
        }
        checkForWholeWordMatchType(singleWordQuery, lineToSearch) {
            // Trim excess ending characters off the query.
            singleWordQuery = singleWordQuery.toLowerCase().replace(/[\s-\._]+$/, '');
            lineToSearch = lineToSearch.toLowerCase();
            const singleWordRegex = new RegExp(`\\b${singleWordQuery}\\b`);
            if (singleWordRegex.test(lineToSearch)) {
                this.matchType |= preferences_1.SettingMatchType.WholeWordMatch;
            }
        }
        refreshMatchType(keyRangesLength) {
            if (keyRangesLength) {
                this.matchType |= preferences_1.SettingMatchType.KeyMatch;
            }
        }
        getRangesForWords(words, from, others) {
            const result = [];
            for (const word of words) {
                const ranges = from.get(word);
                if (ranges) {
                    result.push(...ranges);
                }
                else if (this.requireFullQueryMatch && others.every(o => !o.has(word))) {
                    return [];
                }
            }
            return result;
        }
        toKeyRange(setting, match) {
            return {
                startLineNumber: setting.keyRange.startLineNumber,
                startColumn: setting.keyRange.startColumn + match.start,
                endLineNumber: setting.keyRange.startLineNumber,
                endColumn: setting.keyRange.startColumn + match.end
            };
        }
        toDescriptionRange(setting, match, lineIndex) {
            return {
                startLineNumber: setting.descriptionRanges[lineIndex].startLineNumber,
                startColumn: setting.descriptionRanges[lineIndex].startColumn + match.start,
                endLineNumber: setting.descriptionRanges[lineIndex].endLineNumber,
                endColumn: setting.descriptionRanges[lineIndex].startColumn + match.end
            };
        }
        toValueRange(setting, match) {
            return {
                startLineNumber: setting.valueRange.startLineNumber,
                startColumn: setting.valueRange.startColumn + match.start + 1,
                endLineNumber: setting.valueRange.startLineNumber,
                endColumn: setting.valueRange.startColumn + match.end + 1
            };
        }
    };
    SettingMatches = __decorate([
        __param(5, configuration_1.IConfigurationService)
    ], SettingMatches);
    exports.SettingMatches = SettingMatches;
    (0, extensions_1.registerSingleton)(preferences_2.IPreferencesSearchService, PreferencesSearchService, true);
});
//# sourceMappingURL=preferencesSearch.js.map