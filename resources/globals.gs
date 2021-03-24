/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview This file contains global configuration variables used
 * throughout the application.
 */

/**
 * Capture global context (this) into a const to be able to use it from within
 * classes where 'this' would be replaced with the class' context.
 * @see Runner#runJobs
 */
const GLOBALCTX = this;

/**
 * Global configuration for the associated Google Sheets spreadsheet.
 */
const CONFIG = {
  apiFirst: false,
  accountData: {
    sheetName: 'Client Setup',
    networkId: {
      row: 2,
      col: 3,
    },
    advertiserId: {
      row: 3,
      col: 3,
    },
  },
  multiSelect: {
    separator: '##',
    separatorRegex: '\\((\\d+)\\)#?#?',
    modificationStatus: {
      column: 9,
      values: {
        read: 'READ',
        update: 'UPDATE',
      },
    },
  },
  logging: {
    sheetName: 'Log',
    range: 'A1:B',
    row: 1,
    col: 1,
  },
  customVariables: {
    sheetName: 'aux',
    row: 2,
    col: 1,
    separator: ':',
  },
  floodlights: {
    sheetName: 'floodlights',
    idAndNameRegex: '\\((\\d+)\\)',
    row: 2,
    col: 1,
  },
  advertisers: {
    sheetName: 'advertisers',
    row: 2,
    col: 1,
    maxResultsPerPage: 100,
    defaultName: 'MISSING',
  },
  audiences: {
    create: {
      sheetName: 'Create Audiences',
      defaultState: true,
      listSource: 'REMARKETING_LIST_SOURCE_DFA',
      row: 3,
      col: 1,
      cols: {
        name: 0,
        lifeSpan: 1,
        description: 2,
        floodlightId: 3,
        rules: {
          termType: 'CUSTOM_VARIABLE_TERM',
          separator: ',',
          rangeStart: 4,
          rangeEnd: 15,
          rangeLength: 4,
          rangeIndex: {
            name: 0,
            operator: 1,
            value: 2,
            negation: 3,
          },
          relationship: 16,
        },
        status: 17,
      },
    },
    update: {
      sheetName: 'Update Audiences',
      row: 3,
      col: 1,
      cols: {
        id: 0,
        name: 1,
        newName: 2,
        audienceListShares: 7,
        status: 8,
      },
    },
  },
};
