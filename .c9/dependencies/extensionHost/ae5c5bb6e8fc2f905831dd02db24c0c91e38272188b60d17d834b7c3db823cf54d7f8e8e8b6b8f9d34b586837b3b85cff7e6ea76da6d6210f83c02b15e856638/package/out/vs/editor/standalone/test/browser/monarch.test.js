/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/services/languageService", "vs/editor/standalone/common/monarch/monarchLexer", "vs/editor/standalone/common/monarch/monarchCompile", "vs/editor/common/languages", "vs/base/common/lifecycle"], function (require, exports, assert, languageService_1, monarchLexer_1, monarchCompile_1, languages_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Monarch', () => {
        function createMonarchTokenizer(languageService, languageId, language) {
            return new monarchLexer_1.MonarchTokenizer(languageService, null, languageId, (0, monarchCompile_1.compile)(languageId, language));
        }
        function getTokens(tokenizer, lines) {
            const actualTokens = [];
            let state = tokenizer.getInitialState();
            for (const line of lines) {
                const result = tokenizer.tokenize(line, true, state);
                actualTokens.push(result.tokens);
                state = result.endState;
            }
            return actualTokens;
        }
        test('Ensure @rematch and nextEmbedded can be used together in Monarch grammar', () => {
            const disposables = new lifecycle_1.DisposableStore();
            const languageService = disposables.add(new languageService_1.LanguageService());
            disposables.add(languageService.registerLanguage({ id: 'sql' }));
            disposables.add(languages_1.TokenizationRegistry.register('sql', createMonarchTokenizer(languageService, 'sql', {
                tokenizer: {
                    root: [
                        [/./, 'token']
                    ]
                }
            })));
            const SQL_QUERY_START = '(SELECT|INSERT|UPDATE|DELETE|CREATE|REPLACE|ALTER|WITH)';
            const tokenizer = createMonarchTokenizer(languageService, 'test1', {
                tokenizer: {
                    root: [
                        [`(\"\"\")${SQL_QUERY_START}`, [{ 'token': 'string.quote', }, { token: '@rematch', next: '@endStringWithSQL', nextEmbedded: 'sql', },]],
                        [/(""")$/, [{ token: 'string.quote', next: '@maybeStringIsSQL', },]],
                    ],
                    maybeStringIsSQL: [
                        [/(.*)/, {
                                cases: {
                                    [`${SQL_QUERY_START}\\b.*`]: { token: '@rematch', next: '@endStringWithSQL', nextEmbedded: 'sql', },
                                    '@default': { token: '@rematch', switchTo: '@endDblDocString', },
                                }
                            }],
                    ],
                    endDblDocString: [
                        ['[^\']+', 'string'],
                        ['\\\\\'', 'string'],
                        ['\'\'\'', 'string', '@popall'],
                        ['\'', 'string']
                    ],
                    endStringWithSQL: [[/"""/, { token: 'string.quote', next: '@popall', nextEmbedded: '@pop', },]],
                }
            });
            const lines = [
                `mysql_query("""SELECT * FROM table_name WHERE ds = '<DATEID>'""")`,
                `mysql_query("""`,
                `SELECT *`,
                `FROM table_name`,
                `WHERE ds = '<DATEID>'`,
                `""")`,
            ];
            const actualTokens = getTokens(tokenizer, lines);
            assert.deepStrictEqual(actualTokens, [
                [
                    new languages_1.Token(0, 'source.test1', 'test1'),
                    new languages_1.Token(12, 'string.quote.test1', 'test1'),
                    new languages_1.Token(15, 'token.sql', 'sql'),
                    new languages_1.Token(61, 'string.quote.test1', 'test1'),
                    new languages_1.Token(64, 'source.test1', 'test1')
                ],
                [
                    new languages_1.Token(0, 'source.test1', 'test1'),
                    new languages_1.Token(12, 'string.quote.test1', 'test1')
                ],
                [
                    new languages_1.Token(0, 'token.sql', 'sql')
                ],
                [
                    new languages_1.Token(0, 'token.sql', 'sql')
                ],
                [
                    new languages_1.Token(0, 'token.sql', 'sql')
                ],
                [
                    new languages_1.Token(0, 'string.quote.test1', 'test1'),
                    new languages_1.Token(3, 'source.test1', 'test1')
                ]
            ]);
            disposables.dispose();
        });
        test('microsoft/monaco-editor#1235: Empty Line Handling', () => {
            const languageService = new languageService_1.LanguageService();
            const tokenizer = createMonarchTokenizer(languageService, 'test', {
                tokenizer: {
                    root: [
                        { include: '@comments' },
                    ],
                    comments: [
                        [/\/\/$/, 'comment'],
                        [/\/\//, 'comment', '@comment_cpp'],
                    ],
                    comment_cpp: [
                        [/(?:[^\\]|(?:\\.))+$/, 'comment', '@pop'],
                        [/.+$/, 'comment'],
                        [/$/, 'comment', '@pop']
                        // No possible rule to detect an empty line and @pop?
                    ],
                },
            });
            const lines = [
                `// This comment \\`,
                `   continues on the following line`,
                ``,
                `// This comment does NOT continue \\\\`,
                `   because the escape char was itself escaped`,
                ``,
                `// This comment DOES continue because \\\\\\`,
                `   the 1st '\\' escapes the 2nd; the 3rd escapes EOL`,
                ``,
                `// This comment continues to the following line \\`,
                ``,
                `But the line was empty. This line should not be commented.`,
            ];
            const actualTokens = getTokens(tokenizer, lines);
            assert.deepStrictEqual(actualTokens, [
                [new languages_1.Token(0, 'comment.test', 'test')],
                [new languages_1.Token(0, 'comment.test', 'test')],
                [],
                [new languages_1.Token(0, 'comment.test', 'test')],
                [new languages_1.Token(0, 'source.test', 'test')],
                [],
                [new languages_1.Token(0, 'comment.test', 'test')],
                [new languages_1.Token(0, 'comment.test', 'test')],
                [],
                [new languages_1.Token(0, 'comment.test', 'test')],
                [],
                [new languages_1.Token(0, 'source.test', 'test')]
            ]);
            languageService.dispose();
        });
        test('microsoft/monaco-editor#2265: Exit a state at end of line', () => {
            const languageService = new languageService_1.LanguageService();
            const tokenizer = createMonarchTokenizer(languageService, 'test', {
                includeLF: true,
                tokenizer: {
                    root: [
                        [/^\*/, '', '@inner'],
                        [/\:\*/, '', '@inner'],
                        [/[^*:]+/, 'string'],
                        [/[*:]/, 'string']
                    ],
                    inner: [
                        [/\n/, '', '@pop'],
                        [/\d+/, 'number'],
                        [/[^\d]+/, '']
                    ]
                }
            });
            const lines = [
                `PRINT 10 * 20`,
                `*FX200, 3`,
                `PRINT 2*3:*FX200, 3`
            ];
            const actualTokens = getTokens(tokenizer, lines);
            assert.deepStrictEqual(actualTokens, [
                [
                    new languages_1.Token(0, 'string.test', 'test'),
                ],
                [
                    new languages_1.Token(0, '', 'test'),
                    new languages_1.Token(3, 'number.test', 'test'),
                    new languages_1.Token(6, '', 'test'),
                    new languages_1.Token(8, 'number.test', 'test'),
                ],
                [
                    new languages_1.Token(0, 'string.test', 'test'),
                    new languages_1.Token(9, '', 'test'),
                    new languages_1.Token(13, 'number.test', 'test'),
                    new languages_1.Token(16, '', 'test'),
                    new languages_1.Token(18, 'number.test', 'test'),
                ]
            ]);
            languageService.dispose();
        });
        test('issue #115662: monarchCompile function need an extra option which can control replacement', () => {
            const languageService = new languageService_1.LanguageService();
            const tokenizer1 = createMonarchTokenizer(languageService, 'test', {
                ignoreCase: false,
                uselessReplaceKey1: '@uselessReplaceKey2',
                uselessReplaceKey2: '@uselessReplaceKey3',
                uselessReplaceKey3: '@uselessReplaceKey4',
                uselessReplaceKey4: '@uselessReplaceKey5',
                uselessReplaceKey5: '@ham' || '',
                tokenizer: {
                    root: [
                        {
                            regex: /@\w+/.test('@ham')
                                ? new RegExp(`^${'@uselessReplaceKey1'}$`)
                                : new RegExp(`^${'@ham'}$`),
                            action: { token: 'ham' }
                        },
                    ],
                },
            });
            const tokenizer2 = createMonarchTokenizer(languageService, 'test', {
                ignoreCase: false,
                tokenizer: {
                    root: [
                        {
                            regex: /@@ham/,
                            action: { token: 'ham' }
                        },
                    ],
                },
            });
            const lines = [
                `@ham`
            ];
            const actualTokens1 = getTokens(tokenizer1, lines);
            assert.deepStrictEqual(actualTokens1, [
                [
                    new languages_1.Token(0, 'ham.test', 'test'),
                ]
            ]);
            const actualTokens2 = getTokens(tokenizer2, lines);
            assert.deepStrictEqual(actualTokens2, [
                [
                    new languages_1.Token(0, 'ham.test', 'test'),
                ]
            ]);
            languageService.dispose();
        });
        test('microsoft/monaco-editor#2424: Allow to target @@', () => {
            const languageService = new languageService_1.LanguageService();
            const tokenizer = createMonarchTokenizer(languageService, 'test', {
                ignoreCase: false,
                tokenizer: {
                    root: [
                        {
                            regex: /@@@@/,
                            action: { token: 'ham' }
                        },
                    ],
                },
            });
            const lines = [
                `@@`
            ];
            const actualTokens = getTokens(tokenizer, lines);
            assert.deepStrictEqual(actualTokens, [
                [
                    new languages_1.Token(0, 'ham.test', 'test'),
                ]
            ]);
            languageService.dispose();
        });
    });
});
//# sourceMappingURL=monarch.test.js.map