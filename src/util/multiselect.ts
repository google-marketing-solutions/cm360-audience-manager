/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CONFIG } from '../config';
import { SheetsService } from '../service/sheets';

/**
 * This is required to avoid treeshaking this file.
 * As long as anything from a file is being used, the entire file
 * is being kept.
 * The workaround is necessary to achieve a modular codebase
 * because rollup does not realize functions
 * being called via 'GLOBALCTX![functionName]' or 'google.script.run'.
 */
export const keepMultiselect = null;

/**
 * @fileoverview Utility file to enable multi-select for drop-down cells
 * in Google Sheets.
 *
 * Adapted from
 * https://gist.github.com/coinsandsteeldev/4c67dfa5411e8add913273fc5a30f5e7
 */

/**
 * Retrieves content from the underlying {@link SheetsService} to fill the
 * sidebar with.
 * @see multiselect.html
 *
 * @param {{
 *     separator: string
 * }=} params
 * @returns {string[]} the sidebar content data
 */
export function getSidebarContent({
  separator = CONFIG.multiSelect.separator,
} = {}) {
  return SheetsService.getInstance().getSortedDataValidationValues(separator);
}

/**
 * Fills the selected cell with a compound string representing all selected
 * values from the multi-select sidebar and updates the modification status
 * cell afterwards.
 * @see multiselect.html#set
 *
 * @param {string[]} selectedSidebarValues The selected values
 */
export function fillSelectedCell(selectedSidebarValues: string[]) {
  setValues_(selectedSidebarValues);
}

/**
 * Set selected advertisers for all audiences.
 *
 * @param {?Object} selectedSidebarValues
 * @param {{
 *     sheetName: string,
 *     row: number,
 *     idCol: number,
 *     sharesCol: number
 * }=} params
 */
export function setAllAdvertisers(
  selectedSidebarValues: string[],
  {
    sheetName = CONFIG.audiences.sheetName,
    row = CONFIG.audiences.row,
    idCol = CONFIG.audiences.cols.id,
    sharesCol = CONFIG.audiences.cols.shares,
  } = {}
) {
  const valuesString = valuesToString(selectedSidebarValues);

  // Count audiences
  const count = SheetsService.getInstance()
    .getRangeData(sheetName, row, idCol + 1, 0, 1)
    .filter((id: string[]) => id[0]).length;

  const ids = Array(count).fill([valuesString]);

  SheetsService.getInstance().setValuesInDefinedRange(
    sheetName,
    row,
    sharesCol + 1,
    ids
  );
}

/**
 * Join selected values using the multi-select separator.
 *
 * @param {?Object} selectedSidebarValues
 * @param {{
 *     separator: string
 * }=} params
 * @returns {string}
 */
function valuesToString(
  selectedSidebarValues: string[],
  { separator = CONFIG.multiSelect.separator } = {}
) {
  const values = [];
  let value = '';

  for (const i of selectedSidebarValues) {
    values.push(i);
  }

  if (values.length !== 0) {
    values.sort();
    value = values.join(separator);
  }

  return value;
}

/**
 * Creates a compound string representing all selected values from the
 * multi-select sidebar and updates the current cell with it.
 * @private
 *
 * @param {string[]} selectedSidebarValues The selected values
 */
function setValues_(selectedSidebarValues: string[]) {
  const value = valuesToString(selectedSidebarValues);

  const range = SheetsService.getInstance().getSelectedRange();

  range.setValue(value);
}
