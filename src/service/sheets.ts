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

/**
 * @fileoverview This Google Apps Script file wraps all interactions with the
 * Sheets API through the use of the built-in 'Advanced Google Service'
 * {@link SpreadsheetApp}.
 *
 * @see appsscript.json for a list of enabled advanced services.
 */

/**
 * SheetsService representing a wrapper for the the Google Sheets API.
 */
export class SheetsService {
  private static instance: SheetsService;
  private readonly spreadsheet_: GoogleAppsScript.Spreadsheet.Spreadsheet;

  /**
   * @constructs an instance of SheetsService using an optionally provided
   * Google Sheets spreadsheet ID. If not provided, assumes this is already
   * embedded on a spreadsheet.
   *
   * @param {string} spreadsheetId The optional associated spreadsheet ID
   * @throws {!Error} If a spreadsheet could not be initialized
   */
  constructor(spreadsheetId?: string) {
    let spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;

    if (spreadsheetId) {
      try {
        spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      } catch (e: unknown) {
        console.error(e as Error);
        throw new Error(
          `Unable to identify spreadsheet with provided ID: ${spreadsheetId}!`
        );
      }
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }

    this.spreadsheet_ = spreadsheet;
  }

  /**
   * Retrieves a cell's value by the given parameters.
   *
   * @param {string} sheetName The name of the sheet
   * @param {number} row The row identifier
   * @param {number} col The column identifier
   * @returns {?Object|null} The value of the cell
   */
  getCellValue(sheetName: string, row: number, col: number) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);

    if (!sheet) return null;

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
  setCellValue(row: number, col: number, val: string, sheetName?: string) {
    const sheet = sheetName
      ? this.getSpreadsheet().getSheetByName(sheetName)
      : this.getSpreadsheet().getActiveSheet();

    if (!sheet) return;

    sheet.getRange(row, col).setValue(val);
  }

  /**
   * Opens a sidebar on Google Sheets and fills it using the content of 'html'.
   *
   * @param {?GoogleAppsScript.HTML.HtmlOutput} html The html content
   */
  showSidebar(html: GoogleAppsScript.HTML.HtmlOutput) {
    this.getSpreadsheetApp().getUi().showSidebar(html);
  }

  /**
   * Shows a 'toast' card on Google Sheets with the given parameters.
   *
   * @param {string} message The message to print on the toast card
   * @param {string} title The title to print above the message
   * @param {number=} timeoutSeconds Optional timeout in seconds
   */
  showToast(message: string, title: string, timeoutSeconds = 3) {
    this.getSpreadsheet().toast(message, title, timeoutSeconds);
  }

  /**
   * Retrieves the current selected range from the associated Google Sheets
   * spreadsheet.
   *
   * @returns {?SpreadsheetApp.Range} The active range in the active sheet
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
   * @returns {!Array<{ val: string; checked: boolean }>} The validation data with all selected values
   *     sorted first
   */
  getSortedDataValidationValues(
    separator: string
  ): Array<{ val: string; checked: boolean }> {
    const activeRange = this.getSelectedRange();

    const dataValidation = this.getSelectedRange().getDataValidation();

    const data: string[] =
      dataValidation !== null
        ? dataValidation.getCriteriaValues()[0].getValues()
        : [];

    if (data.length === 0) {
      return [];
    }

    const selectedValues = activeRange.getValue().toString().split(separator);

    if (selectedValues.length === 0) {
      return [];
    }

    const result: Array<{ val: string; checked: boolean }> = [];

    selectedValues
      .sort()
      .filter((val: string) => val !== '')
      .forEach((val: string) => void result.push({ val, checked: true }));

    data.forEach(val => {
      const strVal = val.toString();

      if (!selectedValues.includes(strVal)) {
        result.push({ val: strVal, checked: false });
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
  clearRange(sheetName: string, range: string) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);

    if (!sheet) return;

    sheet.getRange(range).clear();
  }

  /**
   * Clears the given range in the given sheet.
   *
   * @param {string} sheetName The name of the sheet
   * @param {number} row The range's start row
   * @param {number} col The range's start col
   * @param {number=} numRows Optional number of rows to clear. Defaults to
   *     all available rows
   * @param {number=} numCols Optional number of columns to clear. Defaults
   *     to all available columns
   */
  clearDefinedRange(
    sheetName: string,
    row: number,
    col: number,
    numRows = 0,
    numCols = 0
  ) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);

    if (!sheet) return;

    sheet
      .getRange(
        row,
        col,
        numRows || sheet.getLastRow(),
        numCols || sheet.getLastColumn()
      )
      .clear();
  }

  /**
   * Writes the given values in the specified sheet and range.
   *
   * @param {string} sheetName The name of the sheet
   * @param {string} range The range to use, provided in A1 notation
   * @param {?Array<?Array<string | number | boolean>>} values The values to write
   */
  setValuesInRange(
    sheetName: string,
    range: string,
    values: Array<Array<string | number | boolean>>
  ) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);

    if (!sheet) return;

    sheet.getRange(range).setValues(values);
  }

  /**
   * Writes the given values in the specified sheet and range.
   *
   * @param {string} sheetName The name of the sheet
   * @param {number} row The range's start row
   * @param {number} col The range's start col
   * @param {Array<?Array<string | number | undefined>>} values The values to write
   */
  setValuesInDefinedRange(
    sheetName: string,
    row: number,
    col: number,
    values: Array<Array<string | number | Date | undefined>>
  ) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);

    if (!sheet) return;

    if (values[0]) {
      sheet
        .getRange(row, col, values.length, values[0].length)
        .setValues(values);
    }
  }

  /**
   * Appends the given values after any existing data in the specified sheet.
   *
   * @param {string} sheetName The name of the sheet
   * @param {number} row The range's start row - used only when the associated
   *     sheet is empty (i.e. sheet.getLastRow returns 0)
   * @param {number} col The range's start col
   * @param {?Array<?Array<string | number | boolean>>} values The values to append
   */
  appendToDefinedRange(
    sheetName: string,
    row: number,
    col: number,
    values: Array<Array<string | number | boolean>>
  ) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);

    if (!sheet) return;

    const startRow = sheet.getLastRow() ? sheet.getLastRow() + 1 : row;

    if (values[0]) {
      sheet
        .getRange(startRow, col, values.length, values[0].length)
        .setValues(values);
    }
  }

  /**
   * Retrieves data from the underlying spreadsheet using the provided range
   * parameters and sheet name.
   *
   * @param {string} sheetName The name of the sheet
   * @param {number} startRow The range's start row
   * @param {number} startCol The range's start column
   * @param {number=} numRows Optional number of rows to retrieve. Defaults to
   *     all available rows
   * @param {number=} numCols Optional number of columns to retrieve. Defaults
   *     to all available columns
   * @returns {?Array<?Array<?Object>>} The data found at the specified range
   */
  getRangeData(
    sheetName: string,
    startRow: number,
    startCol: number,
    numRows = 0,
    numCols = 0
  ) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);

    // Return empty result if no rows
    if (!sheet || numRows + sheet.getLastRow() - startRow + 1 === 0) {
      return [[]];
    }

    return sheet
      .getRange(
        startRow,
        startCol,
        numRows || sheet.getLastRow() - startRow + 1,
        numCols || sheet.getLastColumn() - startCol + 1
      )
      .getValues();
  }

  /**
   * Find and replace a value in a sheet.
   *
   * @param {string} sheetName The name of the sheet
   * @param {string} find The value to find
   * @param {string} replace The value to replace with
   */
  findAndReplace(sheetName: string, find: string, replace: string) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);

    if (!sheet) return;

    sheet
      .createTextFinder(find)
      .matchEntireCell(true)
      .matchCase(true)
      .matchFormulaText(false)
      .ignoreDiacritics(false)
      .replaceAllWith(replace);
  }

  /**
   * Returns the initialized {@link SpreadsheetApp.Spreadsheet} reference.
   *
   * @returns {?SpreadsheetApp.Spreadsheet} The spreadsheet
   */
  getSpreadsheet() {
    return this.spreadsheet_;
  }

  /**
   * Returns the {@link SpreadsheetApp} reference.
   *
   * @returns {!Object} The SpreadsheetApp reference
   */
  getSpreadsheetApp() {
    return SpreadsheetApp;
  }

  /**
   * Returns the SheetsService instance, initializing it if it does not exist yet.
   *
   * @param {string} spreadsheetId
   * @returns {!SheetsService} The initialized SheetsService instance
   */
  static getInstance(spreadsheetId?: string) {
    if (typeof this.instance === 'undefined') {
      this.instance = new SheetsService(spreadsheetId);
    }
    return this.instance;
  }
}
