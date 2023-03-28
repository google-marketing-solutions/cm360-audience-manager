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
 * @fileoverview This file contains tests for SheetsService.
 */

import { SheetsService } from '../../src/service/sheets';

global.SpreadsheetApp = {
  openById: jest.fn(),
  getActiveSpreadsheet: jest.fn(),
  getActiveRange: jest.fn().mockReturnValue(53),
  getUi: jest.fn(),
  getActiveSheet: jest.fn(),
} as unknown as typeof SpreadsheetApp;

describe('SheetsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('instantiates with the right spreadsheet when its id is given', () => {
    const fakeSpreadsheetId = 'fakeSpreadsheetId';
    const spreadsheet = {
      id: fakeSpreadsheetId,
    } as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet; //new appsScriptSimulator.Spreadsheet(fakeSpreadsheetId);
    jest.spyOn(SpreadsheetApp, 'openById').mockReturnValue(spreadsheet);

    const sheetsService = new SheetsService(fakeSpreadsheetId);

    expect(SpreadsheetApp.openById).toHaveBeenCalledWith(fakeSpreadsheetId);
    expect(sheetsService.getSpreadsheet()).toEqual(spreadsheet);
    expect(sheetsService.getSpreadsheetApp()).toEqual(SpreadsheetApp);
  });

  it('instantiates with current active spreadsheet when no id is given', () => {
    const activeSpreadsheet = {
      id: 'active',
    } as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet; // = new appsScriptSimulator.Spreadsheet('active');
    jest
      .spyOn(SpreadsheetApp, 'getActiveSpreadsheet')
      .mockReturnValue(activeSpreadsheet);

    const sheetsService = new SheetsService();

    expect(SpreadsheetApp.getActiveSpreadsheet).toHaveBeenCalled();
    expect(sheetsService.getSpreadsheet()).toEqual(activeSpreadsheet);
    expect(sheetsService.getSpreadsheetApp()).toEqual(SpreadsheetApp);
  });

  it('throws error for unidentified id', () => {
    jest.spyOn(SpreadsheetApp, 'openById').mockImplementation(() => {
      throw new Error();
    });
    jest.spyOn(console, 'error');

    expect(() => void new SheetsService('test')).toThrow(
      new Error(`Unable to identify spreadsheet with provided ID: test!`)
    );
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  describe('method', () => {
    let sheetsService: SheetsService;
    let spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;

    beforeEach(() => {
      spreadsheet = {
        id: 'active',
        getSheetByName: jest.fn(),
        getActiveSheet: jest.fn(),
        getActiveRange: jest.fn().mockReturnValue(42),
        toast: jest.fn(),
      } as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet;
      jest
        .spyOn(SpreadsheetApp, 'getActiveSpreadsheet')
        .mockReturnValue(spreadsheet);
      sheetsService = new SheetsService();
    });

    describe('getCellValue', () => {
      it('retrieves cell value for given sheet name, cell row and col', () => {
        const fakeSheet = {
          id: 'active',
          getRange: jest.fn(),
        } as unknown as GoogleAppsScript.Spreadsheet.Sheet;

        const fakeRange = {
          getValue: jest.fn().mockReturnValue('test'),
        } as unknown as GoogleAppsScript.Spreadsheet.Range;

        jest.spyOn(spreadsheet, 'getSheetByName').mockReturnValue(fakeSheet);

        jest.spyOn(fakeSheet, 'getRange').mockReturnValue(fakeRange);

        //jest.spyOn(fakeSheet, 'getRange').mockReturnValue(fakeRange);

        const result = sheetsService.getCellValue('sheetName', 1, 1);

        expect(result).toBe('test');
      });
    });

    describe('setCellValue', () => {
      const fakeSheet = {
        id: 'sheetName',
        getRange: jest.fn(),
      } as unknown as GoogleAppsScript.Spreadsheet.Sheet;
      //const fakeSheet = new appsScriptSimulator.Sheet(spreadsheet, 'sheetName');

      const fakeRange = {
        getValue: jest.fn().mockReturnValue('test'),
        setValue: jest.fn(),
      } as unknown as GoogleAppsScript.Spreadsheet.Range;
      //const fakeRange = new appsScriptSimulator.Range(fakeSheet, 1, 1);

      beforeEach(() => {
        jest.spyOn(fakeSheet, 'getRange').mockReturnValue(fakeRange);
        jest.spyOn(fakeRange, 'setValue');
      });

      it('sets cell value in provided sheet', () => {
        jest.spyOn(spreadsheet, 'getSheetByName').mockReturnValue(fakeSheet);

        sheetsService.setCellValue(1, 1, 'test', 'sheetName');

        expect(fakeRange.setValue).toHaveBeenNthCalledWith(1, 'test');
      });

      it('sets cell value in active sheet when not explicitly given', () => {
        jest.spyOn(spreadsheet, 'getActiveSheet').mockReturnValue(fakeSheet);

        sheetsService.setCellValue(1, 1, 'test');

        expect(fakeRange.setValue).toHaveBeenNthCalledWith(1, 'test');
      });
    });

    describe('showSidebar', () => {
      it('calls through to the underlying implementation', () => {
        const ui = {
          showSidebar: jest.fn(),
        } as unknown as GoogleAppsScript.Base.Ui;

        jest.spyOn(SpreadsheetApp, 'getUi').mockReturnValue(ui);
        jest.spyOn(ui, 'showSidebar');

        sheetsService.showSidebar(
          'test' as unknown as GoogleAppsScript.HTML.HtmlOutput
        );

        expect(ui.showSidebar).toHaveBeenCalledWith('test');
      });
    });

    describe('showToast', () => {
      it('calls through to the underlying implementation, no timeout', () => {
        jest.spyOn(spreadsheet, 'toast');

        sheetsService.showToast('hello world', 'title');

        expect(spreadsheet.toast).toHaveBeenCalledWith(
          'hello world',
          'title',
          3
        );
      });

      it('calls through to the underlying implementation, timeout set', () => {
        jest.spyOn(spreadsheet, 'toast');

        sheetsService.showToast('hello world', '', 5);

        expect(spreadsheet.toast).toHaveBeenCalledWith('hello world', '', 5);
      });
    });

    describe('getSelectedRange', () => {
      it('calls through to the underlying implementation', () => {
        const fakeRange = {} as unknown as GoogleAppsScript.Spreadsheet.Range;
        jest.spyOn(SpreadsheetApp, 'getActiveRange').mockReturnValue(fakeRange);

        const result = sheetsService.getSelectedRange();

        expect(result).toEqual(fakeRange);
      });
    });

    describe('getSortedDataValidationValues', () => {
      const fakeRange = {
        getValue: jest.fn().mockReturnValue('test'),
        setValue: jest.fn(),
        getDataValidation: jest.fn(),
      } as unknown as GoogleAppsScript.Spreadsheet.Range;

      it('returns nothing if called on empty cell, no data validation', () => {
        jest
          .spyOn(sheetsService, 'getSelectedRange')
          .mockReturnValue(fakeRange);
        jest.spyOn(fakeRange, 'getDataValidation').mockReturnValue(null);

        const result = sheetsService.getSortedDataValidationValues(',');
        expect(result).toEqual([]);
      });

      it('returns nothing if called on filled cell, no data validation', () => {
        jest
          .spyOn(sheetsService, 'getSelectedRange')
          .mockReturnValue(fakeRange);
        jest.spyOn(fakeRange, 'getValue').mockReturnValue('test');
        jest.spyOn(fakeRange, 'getDataValidation').mockReturnValue(null);
        const result = sheetsService.getSortedDataValidationValues(',');

        expect(result).toEqual([]);
      });

      it('returns data validation as-is if nothing selected', () => {
        jest
          .spyOn(sheetsService, 'getSelectedRange')
          .mockReturnValue(fakeRange);

        const dataValidationCriteria = {
          getValues: jest.fn().mockReturnValue(['test', 'test1', 'test2']),
        } as unknown as GoogleAppsScript.Spreadsheet.DataValidationCriteria;

        const dataValidation = {
          getCriteriaValues: jest
            .fn()
            .mockReturnValue([dataValidationCriteria]),
        } as unknown as GoogleAppsScript.Spreadsheet.DataValidation;

        jest.spyOn(fakeRange, 'getValue').mockReturnValue('');
        jest
          .spyOn(fakeRange, 'getDataValidation')
          .mockReturnValue(dataValidation);

        const result = sheetsService.getSortedDataValidationValues(',');

        expect(result).toEqual([
          {
            val: 'test',
            checked: false,
          },
          {
            val: 'test1',
            checked: false,
          },
          {
            val: 'test2',
            checked: false,
          },
        ]);
      });

      it('returns the selected value sorted first', () => {
        jest
          .spyOn(sheetsService, 'getSelectedRange')
          .mockReturnValue(fakeRange);

        const dataValidationCriteria = {
          getValues: jest.fn().mockReturnValue(['test', 'test1', 'test2']),
        } as unknown as GoogleAppsScript.Spreadsheet.DataValidationCriteria;

        const dataValidation = {
          getCriteriaValues: jest
            .fn()
            .mockReturnValue([dataValidationCriteria]),
        } as unknown as GoogleAppsScript.Spreadsheet.DataValidation;

        jest.spyOn(fakeRange, 'getValue').mockReturnValue('test1');
        jest
          .spyOn(fakeRange, 'getDataValidation')
          .mockReturnValue(dataValidation);
        const result = sheetsService.getSortedDataValidationValues(',');

        expect(result).toEqual([
          {
            val: 'test1',
            checked: true,
          },
          {
            val: 'test',
            checked: false,
          },
          {
            val: 'test2',
            checked: false,
          },
        ]);
      });
    });

    describe('clearRange', () => {
      it('clears the given range', () => {
        const fakeRange = {
          clear: jest.fn(),
        } as unknown as GoogleAppsScript.Spreadsheet.Range;

        const fakeSheet = {
          getRange: jest.fn().mockReturnValue(fakeRange),
        } as unknown as GoogleAppsScript.Spreadsheet.Sheet;

        jest.spyOn(spreadsheet, 'getSheetByName').mockReturnValue(fakeSheet);

        sheetsService.clearRange('sheetName', 'A1:A2');

        expect(fakeRange.clear).toHaveBeenCalledTimes(1);
      });
    });

    describe('clearDefinedRange', () => {
      it('clears the given range', () => {
        const fakeRange = {
          clear: jest.fn(),
        } as unknown as GoogleAppsScript.Spreadsheet.Range;

        const fakeSheet = {
          getRange: jest.fn().mockReturnValue(fakeRange),
          getLastRow: jest.fn().mockReturnValue(1),
          getLastColumn: jest.fn().mockReturnValue(1),
        } as unknown as GoogleAppsScript.Spreadsheet.Sheet;

        jest.spyOn(spreadsheet, 'getSheetByName').mockReturnValue(fakeSheet);

        sheetsService.clearDefinedRange('sheetName', 1, 1);

        expect(fakeRange.clear).toHaveBeenCalledTimes(1);
      });
    });

    describe('setValuesInRange', () => {
      it('sets values in the given range', () => {
        const fakeRange = {
          setValues: jest.fn(),
        } as unknown as GoogleAppsScript.Spreadsheet.Range;

        const fakeSheet = {
          getRange: jest.fn().mockReturnValue(fakeRange),
        } as unknown as GoogleAppsScript.Spreadsheet.Sheet;

        jest.spyOn(spreadsheet, 'getSheetByName').mockReturnValue(fakeSheet);
        const values = [['test1'], ['test2']];

        sheetsService.setValuesInRange('sheetName', 'A1:A2', values);

        expect(fakeSheet.getRange).toHaveBeenCalledWith('A1:A2');
        expect(fakeRange.setValues).toHaveBeenCalledWith(values);
      });
    });

    describe('setValuesInDefinedRange', () => {
      it('sets values in the given range', () => {
        const fakeRange = {
          setValues: jest.fn(),
        } as unknown as GoogleAppsScript.Spreadsheet.Range;

        const fakeSheet = {
          getRange: jest.fn().mockReturnValue(fakeRange),
        } as unknown as GoogleAppsScript.Spreadsheet.Sheet;

        jest.spyOn(spreadsheet, 'getSheetByName').mockReturnValue(fakeSheet);

        const values = [
          ['1', 'test1'],
          ['2', 'test2'],
          ['3', 'test3'],
        ];

        sheetsService.setValuesInDefinedRange('sheetName', 1, 1, values);

        expect(fakeSheet.getRange).toHaveBeenCalledWith(1, 1, 3, 2);
        expect(fakeRange.setValues).toHaveBeenCalledWith(values);
      });
    });

    describe('appendToDefinedRange', () => {
      const fakeRange = {
        setValues: jest.fn(),
      } as unknown as GoogleAppsScript.Spreadsheet.Range;

      const fakeSheet = {
        getRange: jest.fn().mockReturnValue(fakeRange),
        getLastRow: jest.fn().mockReturnValue(5),
      } as unknown as GoogleAppsScript.Spreadsheet.Sheet;

      //let fakeRangeSpy;

      beforeEach(() => {
        jest.spyOn(spreadsheet, 'getSheetByName').mockReturnValue(fakeSheet);
        jest.spyOn(fakeSheet, 'getRange').mockReturnValue(fakeRange);
      });

      it('appends to the start of the sheet if empty', () => {
        const values = [
          ['1', 'test1'],
          ['2', 'test2'],
          ['3', 'test3'],
        ];

        jest.spyOn(fakeSheet, 'getLastRow').mockReturnValue(0);

        sheetsService.appendToDefinedRange('sheetName', 1, 1, values);

        expect(fakeSheet.getRange).toHaveBeenCalledWith(1, 1, 3, 2);
        expect(fakeRange.setValues).toHaveBeenCalledWith(values);
      });

      it('appends to the end of the sheet if data exists', () => {
        const values = [
          ['1', 'test1'],
          ['2', 'test2'],
          ['3', 'test3'],
        ];

        jest.spyOn(fakeSheet, 'getLastRow').mockReturnValue(4);

        sheetsService.appendToDefinedRange('sheetName', 1, 1, values);

        expect(fakeSheet.getRange).toHaveBeenCalledWith(5, 1, 3, 2);
        expect(fakeRange.setValues).toHaveBeenCalledWith(values);
      });
    });

    describe('getRangeData', () => {
      const fakeRange = {
        setValues: jest.fn(),
        getValues: jest.fn(),
      } as unknown as GoogleAppsScript.Spreadsheet.Range;

      const fakeSheet = {
        getRange: jest.fn(),
        getLastRow: jest.fn().mockReturnValue(5),
        getLastColumn: jest.fn().mockReturnValue(7),
      } as unknown as GoogleAppsScript.Spreadsheet.Sheet;

      beforeEach(() => {
        jest.spyOn(spreadsheet, 'getSheetByName').mockReturnValue(fakeSheet);
      });

      it('retrievs the data at the given range, defaults to all', () => {
        jest.spyOn(fakeSheet, 'getRange').mockReturnValue(fakeRange);

        sheetsService.getRangeData('sheetName', 1, 1);

        expect(fakeRange.getValues).toHaveBeenCalledTimes(1);
      });

      it('retrieves the data at the given range, defaults to all for 0', () => {
        jest.spyOn(fakeSheet, 'getRange').mockReturnValue(fakeRange);

        sheetsService.getRangeData('sheetName', 1, 1, 0, 0);

        expect(fakeRange.getValues).toHaveBeenCalledTimes(1);
      });

      it('retrieves the data at the given range based on numRows and numCols', () => {
        jest.spyOn(fakeSheet, 'getRange').mockReturnValue(fakeRange);

        sheetsService.getRangeData('sheetName', 1, 1, 2, 2);

        expect(fakeRange.getValues).toHaveBeenCalledTimes(1);
      });
    });
  });
});
