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
 * @fileoverview Utility file to enable multi-select for drop-down cells
 * in Google Sheets.
 *
 * Adapted from
 * https://gist.github.com/coinsandsteeldev/4c67dfa5411e8add913273fc5a30f5e7
 */


/**
 * Opens a sidebar on Google Sheets and fills it using the content of
 * {@link multiselect.html}.
 * @see main.js#onOpen
 */
function showMultiSelectSidebar() {
  const html = HtmlService
      .createHtmlOutputFromFile('ui/select/client/multiselect');
  getSheetsService().showSidebar(html);
}

/**
 * Retrieves content from the underlying {@link SheetsService} to fill the
 * sidebar with.
 * @see multiselect.html
 *
 * @return {!Array<string>} the sidebar content data
 */
function getSidebarContent() {
  return getSheetsService()
      .getSortedDataValidationValues(CONFIG.multiSelect.separator);
}

/**
 * Fills the selected cell with a compound string representing all selected
 * values from the multi-select sidebar and updates the modification status
 * cell afterwards.
 * @see multiselect.html#set
 *
 * @param {!Array<string>} selectedSidebarValues The selected values
 */
function fillSelectedCell(selectedSidebarValues) {
  setValues_(selectedSidebarValues);
  setModificationStatus_();
}

/**
 * Creates a compound string representing all selected values from the
 * multi-select sidebar and updates the current cell with it.
 * @private
 *
 * @param {!Array<string>} selectedSidebarValues The selected values
 */
function setValues_(selectedSidebarValues) {
  const selectedValues = [];

  for (const i in selectedSidebarValues) {
    selectedValues.push(i);
  }
  const range = getSheetsService().getSelectedRange();
  let value = '';

  if (selectedValues.length !== 0) {
    selectedValues.sort();
    value = selectedValues.join(CONFIG.multiSelect.separator);
  }
  range.setValue(value);
}

/**
 * Updates the modification status cell in the associated Google Sheets
 * spreadsheet according to the configuration.
 * @private
 */
function setModificationStatus_() {
    getSheetsService().setCellValue(
        getSheetsService().getSelectedRange().getRow(),
        CONFIG.multiSelect.modificationStatus.column,
        CONFIG.multiSelect.modificationStatus.values.update);
}
