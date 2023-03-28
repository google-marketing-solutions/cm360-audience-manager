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
 * @fileoverview This file contains tests for Logger.
 */

import { Job } from '../../src/model/job';
import { SheetsService } from '../../src/service/sheets';
import { CustomLogger } from '../../src/util/logger';

describe('Logger', () => {
  let mockSheetsService: SheetsService;
  let logger: CustomLogger;

  beforeEach(() => {
    /*mockSheetsService = createSpyObj('SheetsService', {
      clearRange: undefined,
      setValuesInDefinedRange: undefined,
    });*/
    mockSheetsService = {
      clearRange: jest.fn(),
      setValuesInDefinedRange: jest.fn(),
    } as unknown as SheetsService;

    /*const mockSheetsService2 = jest.fn().mockImplementation(() => {
      return {
        clearRange: () => undefined,
        setValuesInDefinedRange: () => undefined,
      };
    });*/
    logger = new CustomLogger(mockSheetsService);
  });

  it('instantiates correctly', () => {
    expect(logger.getSheetsService()).toEqual(mockSheetsService);
  });

  describe('method', () => {
    describe('clearLogs', () => {
      it('calls through to the underlying implementation', () => {
        const job = new Job();
        const result = logger.clearLogs(job, {
          sheetName: 'test',
          range: 'A1:B',
        });

        expect(mockSheetsService.clearRange).toHaveBeenNthCalledWith(
          1,
          'test',
          'A1:B'
        );
        expect(result).toEqual(job);
      });
    });

    describe('writeLogs', () => {
      const date = new Date();
      const log = { date: date, message: 'message' };
      const sheetLog = [date, 'message'];

      it('does nothing if no logs', () => {
        const job = new Job();
        const result = logger.writeLogs(job, {
          sheetName: 'test',
          row: 1,
          col: 1,
        });

        expect(result).toEqual(job);
      });

      it('writes main job logs, no offset', () => {
        const job = new Job(0, 0, true, [log]);
        const expectedJob = new Job(0, 0, true, [], [], 1);
        const result = logger.writeLogs(job, {
          sheetName: 'test',
          row: 1,
          col: 1,
        });

        expect(
          mockSheetsService.setValuesInDefinedRange
        ).toHaveBeenNthCalledWith(1, 'test', 1, 1, [sheetLog]);
        expect(result).toEqual(expectedJob);
      });

      it('writes main job logs, with offset', () => {
        const job = new Job(0, 0, true, [log, log], [], 1);
        const expectedJob = new Job(0, 0, true, [], [], 3);
        const result = logger.writeLogs(job, {
          sheetName: 'test',
          row: 1,
          col: 1,
        });

        expect(
          mockSheetsService.setValuesInDefinedRange
        ).toHaveBeenNthCalledWith(1, 'test', 2, 1, [sheetLog, sheetLog]);
        expect(result).toEqual(expectedJob);
      });

      it('writes single inner job logs, no offset', () => {
        const innerJob = new Job(0, 0, true, [log]);
        const job = new Job();
        job.getJobs().push(innerJob);
        const expectedJob = new Job(0, 0, true, [], [innerJob], 1);
        const result = logger.writeLogs(job, {
          sheetName: 'test',
          row: 1,
          col: 1,
        });

        expect(
          mockSheetsService.setValuesInDefinedRange
        ).toHaveBeenNthCalledWith(1, 'test', 1, 1, [sheetLog]);
        expect(result).toEqual(expectedJob);
        expect(result.getJobs()).toEqual([new Job()]);
        expect(result.getJobs()[0].getLogs()).toEqual([]);
      });

      it('writes main job logs with offset and all inner jobs logs', () => {
        const innerJob1 = new Job(1, 0, true, [log, log]);
        const innerJob2 = new Job(2, 0, true, [log]);
        const job = new Job(0, 0, true, [log], [innerJob1, innerJob2], 1);
        const expectedJob = new Job(
          0,
          0,
          true,
          [],
          [new Job(1), new Job(2)],
          5
        );
        const result = logger.writeLogs(job, {
          sheetName: 'test',
          row: 1,
          col: 1,
        });

        expect(
          mockSheetsService.setValuesInDefinedRange
        ).toHaveBeenNthCalledWith(1, 'test', 2, 1, [
          sheetLog,
          sheetLog,
          sheetLog,
          sheetLog,
        ]);
        expect(result).toEqual(expectedJob);
        expect(result.getJobs()).toEqual([new Job(1), new Job(2)]);
        expect(result.getJobs()[0].getLogs()).toEqual([]);
        expect(result.getJobs()[1].getLogs()).toEqual([]);
      });
    });
  });
});
