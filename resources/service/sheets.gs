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
 * @fileoverview This Google Apps Script file wraps all interactions with the
 * Sheets API through the use of the built-in 'Advanced Google Service'
 * {@link SpreadsheetApp}.
 *
 * @see appsscript.json for a list of enabled advanced services.
 */


/**
 * @class SheetsService representing a wrapper for the the Google Sheets API.
 */
class SheetsService {
  /**
   * @constructs an instance of SheetsService using an optionally provided
   * Google Sheets spreadsheet ID. If not provided, assumes this is already
   * embedded on a spreadsheet.
   *
   * @param {string=} spreadsheetId The optional associated spreadsheet ID
   * @throws {!Error} If a spreadsheet could not be initialized
   */
  constructor(spreadsheetId = undefined) {
    let spreadsheet;

    if (spreadsheetId) {
      try {
        spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      } catch (e) {
        console.error(e);
        throw new Error(
          `Unable to identify spreadsheet with provided ID: ${spreadsheetId}!`);
      }
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }
    /** @private @const {?SpreadsheetApp.Spreadsheet} */
    this.spreadsheet_ = spreadsheet;
  }

  /**
   * Retrieves a cell's value by the given parameters.
   *
   * @param {string} sheetName The name of the sheet
   * @param {number} row The row identifier
   * @param {number} col The column identifier
   * @return {?Object} The value of the cell
   */
  getCellValue(sheetName, row, col) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);
    const cell = sheet.getRange(row, col);

    return cell.getValue();
  }

  /**
   * Sets a cell's value by the given parameters.
   *
   * @param {number} row The row identifier
   * @param {number} col The column identifier
   * @param {string} val The value to set
   * @param {?string=} sheetName The name of the sheet to use. Uses the
   *     sheet the user currently has open (active sheet) if not given
   */
  setCellValue(row, col, val, sheetName = null) {
    const sheet = sheetName ?
        this.getSpreadsheet().getSheetByName(sheetName) :
        this.getSpreadsheet().getActiveSheet();

    sheet.getRange(row, col).setValue(val);
  }

  /**
   * Opens a sidebar on Google Sheets and fills it using the content of 'html'.
   *
   * @param {?HtmlService.HtmlOutput} html The html content
   */
  showSidebar(html) {
    this.getSpreadsheetApp().getUi().showSidebar(html);
  }

  /**
   * Shows a 'toast' card on Google Sheets with the given parameters.
   *
   * @param {string} message The message to print on the toast card
   * @param {string} title The title to print above the message
   * @param {number=} timeoutSeconds Optional timeout in seconds
   */
  showToast(message, title, timeoutSeconds = 3) {
    this.getSpreadsheet().toast(message, title, timeoutSeconds);
  }

  /**
   * Retrieves the current selected range from the associated Google Sheets
   * spreadsheet.
   *
   * @return {?SpreadsheetApp.Range} The active range in the active sheet
   *     or null if there is no active range
   */
  getSelectedRange() {
    return this.getSpreadsheetApp().getActiveRange();
  }

  /**
   * Retrieves validation data from the associated Google Sheets spreadsheet for
   * the selected range, sorting already selected elements to the beginning of
   * the resulting array.
   *
   * @param {string} separator The separator
   * @return {!Array<string>} The validation data with all selected values
   *     sorted first
   */
  getSortedDataValidationValues(separator) {
    const activeRange = this.getSelectedRange();

    const /** ?SpreadsheetApp.DataValidation */ dataValidation = this
        .getSelectedRange().getDataValidation();

    const /** !Array<(!Date|number|boolean|string)> */ data = dataValidation ?
        dataValidation.getCriteriaValues()[0].getValues() :
        [];
    const selectedValues = activeRange.getValue().toString().split(separator);

    if (data.length === 0) {
      return [];
    }
    if (selectedValues.length === 0) {
      return data;
    }
    const result = [];

    selectedValues
        .sort()
        .filter((val) => val !== '')
        .forEach((val) => void result.push({val: val, checked: true}));

    data.forEach((val) => {
      const strVal = val.toString();

      if (!selectedValues.includes(strVal)) {
        result.push(strVal);
      }
    });
    return result;
  }

  /**
   * Clears the given range in the given sheet.
   *
   * @param {string} sheetName The name of the sheet
   * @param {string} range The range to clear, provided in A1 notation
   */
  clearRange(sheetName, range) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);
    sheet.getRange(range).clear();
  }

  /**
   * Clears the given range in the given sheet.
   *
   * @param {string} sheetName The name of the sheet
   * @param {number} row The range's start row
   * @param {number} col The range's start col
   */
  clearDefinedRange(sheetName, row, col) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);
    sheet.getRange(row, col, sheet.getLastRow(), sheet.getLastColumn()).clear();
  }

  /**
   * Writes the given values in the specified sheet and range.
   *
   * @param {string} sheetName The name of the sheet
   * @param {string} range The range to use, provided in A1 notation
   * @param {?Array<?Array<?Object>>} values The values to write
   */
  setValuesInRange(sheetName, range, values) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);
    sheet.getRange(range).setValues(values);
  }

  /**
   * Writes the given values in the specified sheet and range.
   *
   * @param {string} sheetName The name of the sheet
   * @param {number} row The range's start row
   * @param {number} col The range's start col
   * @param {?Array<?Array<?Object>>} values The values to write
   */
  setValuesInDefinedRange(sheetName, row, col, values) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);
    sheet.getRange(row, col, values.length, values[0].length)
        .setValues(values);
  }

  /**
   * Appends the given values after any existing data in the specified sheet.
   *
   * @param {string} sheetName The name of the sheet
   * @param {number} row The range's start row - used only when the associated
   *     sheet is empty (i.e. sheet.getLastRow returns 0)
   * @param {number} col The range's start col
   * @param {?Array<?Array<?Object>>} values The values to append
   */
  appendToDefinedRange(sheetName, row, col, values) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);
    const startRow = sheet.getLastRow() ? sheet.getLastRow() + 1 : row;
    sheet.getRange(startRow, col, values.length, values[0].length)
        .setValues(values);
  }

  /**
   * Retrieves data from the underlying spreadsheet using the provided range
   * parameters and sheet name.
   *
   * @param {string} sheetName The name of the sheet
   * @param {number} row The range's start row
   * @param {number} col The range's start column
   * @param {number=} numRows Optional number of rows to retrieve. Defaults to
   *     all available rows
   * @param {number=} numCols Optional number of columns to retrieve. Defaults
   *     to all available columns
   * @return {?Array<?Array<?Object>>} The data found at the specified range
   */
  getRangeData(sheetName, row, col, numRows = 0, numCols = 0) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);
    return sheet.getRange(
        row,
        col,
        numRows || sheet.getLastRow(),
        numCols || sheet.getLastColumn()).getValues();
  }

  /**
   * Returns the initialized {@link SpreadsheetApp.Spreadsheet} reference.
   *
   * @return {?SpreadsheetApp.Spreadsheet} The spreadsheet
   */
  getSpreadsheet() {
    return this.spreadsheet_;
  }

  /**
   * Returns the {@link SpreadsheetApp} reference.
   *
   * @return {!Object} The SpreadsheetApp reference
   */
  getSpreadsheetApp() {
    return SpreadsheetApp;
  }

}

