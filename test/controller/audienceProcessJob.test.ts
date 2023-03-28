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
 * @fileoverview This file contains tests for AudienceProcessJobController.
 */

import { AudienceProcessJobController } from '../../src/controller/audienceProcessJob';
import { CampaignManagerFacade } from '../../src/facade/cm360';
import { Audience, AudienceRule } from '../../src/model/audience';
import { AudienceProcessJob } from '../../src/model/audienceProcessJob';
import { Job } from '../../src/model/job';
import { SheetsService } from '../../src/service/sheets';
import { JobUtil } from '../../src/util/job';

jest.mock('../../src/util/hash', () => {
  return {
    generateMD5Hash: jest.fn().mockImplementation(() => {
      return 'md5Hash';
    }),
  };
});

describe('AudienceProcessJobController', () => {
  let mockSheetsService: SheetsService;
  let mockCampaignManagerService: CampaignManagerFacade;

  beforeEach(() => {
    mockSheetsService = {
      showToast: jest.fn().mockReturnValue(undefined),
      getRangeData: jest.fn().mockReturnValue([[]]),
      setCellValue: jest.fn().mockReturnValue(undefined),
      findAndReplace: jest.fn().mockReturnValue(undefined),
    } as unknown as SheetsService;

    mockCampaignManagerService = {
      createRemarketingList: jest.fn().mockReturnValue({}),
    } as unknown as CampaignManagerFacade;
  });

  it('instantiates correctly', () => {
    const audienceProcessJobController = new AudienceProcessJobController(
      mockSheetsService,
      mockCampaignManagerService
    );

    expect(audienceProcessJobController.getSheetsService()).toEqual(
      mockSheetsService
    );
    expect(audienceProcessJobController.getCampaignManagerService()).toEqual(
      mockCampaignManagerService
    );
  });

  describe('method', () => {
    const audiencesTestData = {
      empty: ['', '', '', '', '', '', '', '', ''],
      invalid: ['', ''],
      new: ['', 'name', '', '10', 'floodlight (1)', '', '', '', 'md5Hash'],
      no_changes: [
        'id',
        'name',
        '',
        '10',
        'floodlight (1)',
        '',
        '',
        'md5Hash',
        'md5Hash',
      ],
      modified: ['id', 'name', '', '10', '', '', '', 'md5Hash2', 'md5Hash'],
      modifiedShares: [
        'id',
        'name',
        '',
        '10',
        '',
        '',
        '',
        'md5Hash',
        'md5Hash2',
      ],
      modifiedBoth: [
        'id',
        'name',
        '',
        '10',
        '',
        '',
        '',
        'md5Hash2',
        'md5Hash2',
      ],
    };

    const rulesTestData = {
      single: [['1', null, 'U1:var-name', 'STRING_EQUALS', 'val', false]],
      multiple_audiences: [
        ['1', 0, 'U1:var-name', 'STRING_EQUALS', 'val1', false],
        ['2', 0, 'U2:var-name', 'STRING_EQUALS', 'val2', false],
      ],
      mixed: [
        ['1', 0, 'U1:var-name', 'STRING_EQUALS', 'val1', false],
        ['1', 0, 'U1:var-name', 'STRING_EQUALS', 'val2,val3', false],
        ['2', 1, 'U2:var-name', 'STRING_EQUALS', 'val4', false],
        ['1', 1, 'U3:var-name', 'STRING_EQUALS', 'val5', false],
      ],
    };
    let audienceProcessJobController: AudienceProcessJobController;

    beforeEach(() => {
      audienceProcessJobController = new AudienceProcessJobController(
        mockSheetsService,
        mockCampaignManagerService
      );
    });

    describe('processAudiences', () => {
      const defaultParams = {
        sheetName: 'test',
        row: 1,
        col: 1,
        nameCol: 1,
      };

      it('creates no AudienceProcess jobs if no audiences', () => {
        const result = audienceProcessJobController.processAudiences(
          new Job(),
          defaultParams
        );

        expect(mockSheetsService.showToast).toHaveBeenNthCalledWith(
          1,
          'Processing audiences...',
          'Process'
        );
        expect(mockSheetsService.getRangeData).toHaveBeenCalledWith(
          'test',
          1,
          1
        );
        expect(result.getJobs().length).toBe(0);
      });

      it('creates no AudienceProcess jobs if audience is empty', () => {
        mockSheetsService = {
          showToast: jest.fn().mockReturnValue(undefined),
          getRangeData: jest.fn().mockReturnValue([audiencesTestData['empty']]),
        } as unknown as SheetsService;

        audienceProcessJobController = new AudienceProcessJobController(
          mockSheetsService,
          mockCampaignManagerService
        );

        const result = audienceProcessJobController.processAudiences(
          new Job(),
          defaultParams
        );

        expect(mockSheetsService.showToast).toHaveBeenNthCalledWith(
          1,
          'Processing audiences...',
          'Process'
        );
        expect(mockSheetsService.getRangeData).toHaveBeenNthCalledWith(
          1,
          'test',
          1,
          1
        );
        expect(result.getJobs().length).toBe(0);
      });

      it('creates no AudienceProcess jobs if audience is invalid', () => {
        mockSheetsService = {
          showToast: jest.fn().mockReturnValue(undefined),
          getRangeData: jest
            .fn()
            .mockReturnValue([audiencesTestData['invalid']]),
        } as unknown as SheetsService;

        audienceProcessJobController = new AudienceProcessJobController(
          mockSheetsService,
          mockCampaignManagerService
        );

        const result = audienceProcessJobController.processAudiences(
          new Job(),
          defaultParams
        );

        expect(mockSheetsService.showToast).toHaveBeenNthCalledWith(
          1,
          'Processing audiences...',
          'Process'
        );
        expect(mockSheetsService.getRangeData).toHaveBeenNthCalledWith(
          1,
          'test',
          1,
          1
        );
        expect(result.getJobs().length).toBe(0);
      });

      it('creates AudienceProcess jobs for every valid audience', () => {
        mockSheetsService = {
          showToast: jest.fn().mockReturnValue(undefined),
          getRangeData: jest
            .fn()
            .mockReturnValue([
              audiencesTestData['new'],
              audiencesTestData['no_changes'],
              audiencesTestData['modified'],
              audiencesTestData['modifiedShares'],
              audiencesTestData['modifiedBoth'],
              [],
            ]),
        } as unknown as SheetsService;

        audienceProcessJobController = new AudienceProcessJobController(
          mockSheetsService,
          mockCampaignManagerService
        );

        const audience = {} as unknown as Audience;

        jest
          .spyOn(audienceProcessJobController, 'createAudienceProcessJob')
          .mockImplementationOnce(
            () =>
              new AudienceProcessJob({
                idx: 0,
                audience: audience,
                actions: [],
              })
          )
          .mockImplementationOnce(() => undefined)
          .mockImplementationOnce(
            () =>
              new AudienceProcessJob({
                idx: 2,
                audience: audience,
                actions: [],
              })
          )
          .mockImplementationOnce(
            () =>
              new AudienceProcessJob({
                idx: 3,
                audience: audience,
                actions: [],
              })
          )
          .mockImplementationOnce(
            () =>
              new AudienceProcessJob({
                idx: 4,
                audience: audience,
                actions: [],
              })
          );

        const result = audienceProcessJobController.processAudiences(
          new Job(),
          defaultParams
        );

        expect(mockSheetsService.showToast).toHaveBeenNthCalledWith(
          1,
          'Processing audiences...',
          'Process'
        );
        expect(mockSheetsService.getRangeData).toHaveBeenNthCalledWith(
          1,
          'test',
          1,
          1
        );
        expect(
          audienceProcessJobController.createAudienceProcessJob
        ).toHaveBeenCalledTimes(5);
        expect(result.getJobs()).toEqual([
          new AudienceProcessJob({
            idx: 0,
            audience: audience,
            actions: [],
          }),
          new AudienceProcessJob({
            idx: 2,
            audience: audience,
            actions: [],
          }),
          new AudienceProcessJob({
            idx: 3,
            audience: audience,
            actions: [],
          }),
          new AudienceProcessJob({
            idx: 4,
            audience: audience,
            actions: [],
          }),
        ]);
      });
    });

    describe('createAudienceProcessJob', () => {
      const defaultParams = {
        nameCol: 1,
        lifeSpanCol: 3,
        descriptionCol: 2,
        floodlightIdCol: 4,
      };
      let extractFloodlightIdSpy: jest.SpyInstance;
      let getAudienceRulesSpy: jest.SpyInstance;
      let extractSharedAdvertiserIdsSpy: jest.SpyInstance;

      beforeEach(() => {
        jest.spyOn(console, 'log');
        extractFloodlightIdSpy = jest.spyOn(
          audienceProcessJobController,
          'extractFloodlightId'
        );
        getAudienceRulesSpy = jest.spyOn(
          audienceProcessJobController,
          'getAudienceRules'
        );
        extractSharedAdvertiserIdsSpy = jest.spyOn(
          audienceProcessJobController,
          'extractSharedAdvertiserIds'
        );
      });

      it('creates AudienceProcess job with create action for new audiences', () => {
        extractSharedAdvertiserIdsSpy.mockReturnValue(['1', '2', '3']);
        extractFloodlightIdSpy.mockReturnValue('1');
        getAudienceRulesSpy.mockReturnValue([{ group: 0 }, { group: 1 }]);

        const audience = new Audience({
          id: '',
          name: 'name',
          description: '',
          lifeSpan: 10,
          floodlightId: '1',
          rules: [{ group: 0 }, { group: 1 }] as unknown as AudienceRule[],
          shares: ['1', '2', '3'],
        });

        const expectation = new AudienceProcessJob({
          idx: 1,
          audience: audience,
          actions: ['CREATE_AUDIENCE'],
        });

        const result = audienceProcessJobController.createAudienceProcessJob(
          audiencesTestData['new'].concat('1'),
          defaultParams
        );

        expect(
          audienceProcessJobController.extractFloodlightId
        ).toHaveBeenNthCalledWith(1, 'floodlight (1)');
        expect(
          audienceProcessJobController.getAudienceRules
        ).toHaveBeenNthCalledWith(1, '');
        expect(
          audienceProcessJobController.extractSharedAdvertiserIds
        ).toHaveBeenNthCalledWith(1, '');
        expect(result).toEqual(expectation);
      });

      it('creates no AudienceProcess job if no changes', () => {
        extractSharedAdvertiserIdsSpy.mockReturnValue([]);
        extractFloodlightIdSpy.mockReturnValue('1');
        getAudienceRulesSpy.mockReturnValue([]);

        const result = audienceProcessJobController.createAudienceProcessJob(
          audiencesTestData['no_changes'].concat('0'),
          defaultParams
        );

        expect(
          audienceProcessJobController.extractFloodlightId
        ).toHaveBeenNthCalledWith(1, 'floodlight (1)');
        expect(
          audienceProcessJobController.getAudienceRules
        ).toHaveBeenNthCalledWith(1, 'id');
        expect(
          audienceProcessJobController.extractSharedAdvertiserIds
        ).toHaveBeenNthCalledWith(1, '');

        expect(result).toEqual(undefined);
      });

      it('creates AudienceProcess job with update action for modified audiences', () => {
        extractSharedAdvertiserIdsSpy.mockReturnValue([]);
        extractFloodlightIdSpy.mockReturnValue(undefined);
        getAudienceRulesSpy.mockReturnValue([]);

        const audience = new Audience({
          id: 'id',
          name: 'name',
          description: '',
          lifeSpan: 10,
          rules: [],
          shares: [],
        });

        const expectation = new AudienceProcessJob({
          idx: 1,
          audience: audience,
          actions: ['UPDATE_AUDIENCE'],
        });

        const result = audienceProcessJobController.createAudienceProcessJob(
          audiencesTestData['modified'].concat('1'),
          defaultParams
        );

        expect(
          audienceProcessJobController.extractFloodlightId
        ).toHaveBeenNthCalledWith(1, '');
        expect(
          audienceProcessJobController.getAudienceRules
        ).toHaveBeenNthCalledWith(1, 'id');
        expect(
          audienceProcessJobController.extractSharedAdvertiserIds
        ).toHaveBeenNthCalledWith(1, '');

        expect(result).toEqual(expectation);
      });

      it('creates AudienceProcess job with share update action for modified shares', () => {
        extractSharedAdvertiserIdsSpy.mockReturnValue([]);
        extractFloodlightIdSpy.mockReturnValue(undefined);
        getAudienceRulesSpy.mockReturnValue([]);

        const audience = new Audience({
          id: 'id',
          name: 'name',
          description: '',
          lifeSpan: 10,
          rules: [],
          shares: [],
        });

        const expectation = new AudienceProcessJob({
          idx: 1,
          audience: audience,
          actions: ['UPDATE_SHARES'],
        });

        const result = audienceProcessJobController.createAudienceProcessJob(
          audiencesTestData['modifiedShares'].concat('1'),
          defaultParams
        );

        expect(
          audienceProcessJobController.extractFloodlightId
        ).toHaveBeenNthCalledWith(1, '');
        expect(
          audienceProcessJobController.getAudienceRules
        ).toHaveBeenNthCalledWith(1, 'id');
        expect(
          audienceProcessJobController.extractSharedAdvertiserIds
        ).toHaveBeenNthCalledWith(1, '');
        expect(result).toEqual(expectation);
      });

      it('creates AudienceProcess job with share update and update action for modified audience with modified shares', () => {
        extractSharedAdvertiserIdsSpy.mockReturnValue([]);
        extractFloodlightIdSpy.mockReturnValue(undefined);
        getAudienceRulesSpy.mockReturnValue([]);

        const audience = new Audience({
          id: 'id',
          name: 'name',
          description: '',
          lifeSpan: 10,
          rules: [],
          shares: [],
        });

        const expectation = new AudienceProcessJob({
          idx: 1,
          audience: audience,
          actions: ['UPDATE_AUDIENCE', 'UPDATE_SHARES'],
        });

        const result = audienceProcessJobController.createAudienceProcessJob(
          audiencesTestData['modifiedBoth'].concat('1'),
          defaultParams
        );

        expect(
          audienceProcessJobController.extractFloodlightId
        ).toHaveBeenNthCalledWith(1, '');
        expect(
          audienceProcessJobController.getAudienceRules
        ).toHaveBeenNthCalledWith(1, 'id');
        expect(
          audienceProcessJobController.extractSharedAdvertiserIds
        ).toHaveBeenNthCalledWith(1, '');
        expect(result).toEqual(expectation);
      });
    });

    describe('extractSharedAdvertiserIds', () => {
      const regex = '\\((\\d+)\\)\\|?';

      it('returns empty array if empty string', () => {
        const testStr = '';
        const result = audienceProcessJobController.extractSharedAdvertiserIds(
          testStr,
          regex
        );

        expect(result).toEqual([]);
      });

      it('returns empty array for invalid input', () => {
        const testStr = 'test 1,test 2';
        const result = audienceProcessJobController.extractSharedAdvertiserIds(
          testStr,
          regex
        );

        expect(result).toEqual([]);
      });

      it('returns matches for valid input', () => {
        const testStr = 'test (2),test (1)';
        const result = audienceProcessJobController.extractSharedAdvertiserIds(
          testStr,
          regex
        );

        expect(result).toEqual(['2', '1']);
      });
    });

    describe('extractFloodlightId', () => {
      it('returns undefined for given empty string', () => {
        const result = audienceProcessJobController.extractFloodlightId('');

        expect(result).toBeUndefined();
      });

      it('returns undefined for given non-matching string', () => {
        const result =
          audienceProcessJobController.extractFloodlightId('hello');

        expect(result).toBeUndefined();
      });

      it('return floodlightId for valid string', () => {
        const result =
          audienceProcessJobController.extractFloodlightId('test (1)');

        expect(result).toBe('1');
      });
    });

    describe('getAllRules', () => {
      it('returns no rules if no data', () => {
        mockSheetsService = {
          getRangeData: jest.fn().mockReturnValue([[]]),
        } as unknown as SheetsService;

        audienceProcessJobController = new AudienceProcessJobController(
          mockSheetsService,
          mockCampaignManagerService
        );

        const result = audienceProcessJobController.getAllRules();

        expect(mockSheetsService.getRangeData).toHaveBeenCalledWith(
          'Rules',
          2,
          1
        );

        expect(result.length).toBe(0);
      });

      it('uses cache for second call', () => {
        mockSheetsService = {
          getRangeData: jest.fn().mockReturnValue(rulesTestData['single']),
        } as unknown as SheetsService;

        audienceProcessJobController = new AudienceProcessJobController(
          mockSheetsService,
          mockCampaignManagerService
        );

        const result = audienceProcessJobController.getAllRules();
        const cachedResult = audienceProcessJobController.getAllRules();

        expect(mockSheetsService.getRangeData).toHaveBeenNthCalledWith(
          1,
          'Rules',
          2,
          1
        );
        expect(result.length).toBe(1);
        expect(cachedResult.length).toBe(1);
      });
    });

    describe('getAudienceRules', () => {
      let getAllRulesSpy: jest.SpyInstance;

      beforeEach(() => {
        jest.spyOn(console, 'log');
        getAllRulesSpy = jest.spyOn(
          audienceProcessJobController,
          'getAllRules'
        );
      });

      it('creates no rules if no data', () => {
        getAllRulesSpy.mockReturnValue([[]]);

        const result = audienceProcessJobController.getAudienceRules('1');

        expect(audienceProcessJobController.getAllRules).toHaveBeenCalled();
        expect(result).toEqual([]);
      });

      it('creates no rules if audience ID not found', () => {
        mockSheetsService = {
          getRangeData: jest.fn().mockReturnValue(rulesTestData['single']),
        } as unknown as SheetsService;

        audienceProcessJobController = new AudienceProcessJobController(
          mockSheetsService,
          mockCampaignManagerService
        );

        const result = audienceProcessJobController.getAudienceRules('4');

        expect(mockSheetsService.getRangeData).toHaveBeenCalledWith(
          'Rules',
          2,
          1
        );

        expect(result.length).toBe(0);
      });

      it('returns rules for audience with single rule', () => {
        const expected = [
          {
            group: 0,
            variableName: 'U1',
            variableFriendlyName: 'var-name',
            operator: 'STRING_EQUALS',
            value: 'val',
            negation: false,
          },
        ];

        mockSheetsService = {
          getRangeData: jest.fn().mockReturnValue(rulesTestData['single']),
        } as unknown as SheetsService;

        audienceProcessJobController = new AudienceProcessJobController(
          mockSheetsService,
          mockCampaignManagerService
        );

        const result = audienceProcessJobController.getAudienceRules('1');

        expect(mockSheetsService.getRangeData).toHaveBeenCalledWith(
          'Rules',
          2,
          1
        );
        expect(result.length).toBe(1);
        expect(result).toEqual(expected);
      });

      it('reeturns single rule from multiple rules with multiple audiences', () => {
        const expected = [
          {
            group: 0,
            variableName: 'U1',
            variableFriendlyName: 'var-name',
            operator: 'STRING_EQUALS',
            value: 'val1',
            negation: false,
          },
        ];

        audienceProcessJobController = new AudienceProcessJobController(
          mockSheetsService,
          mockCampaignManagerService
        );
        jest
          .spyOn(audienceProcessJobController, 'getAllRules')
          .mockReturnValue(rulesTestData['multiple_audiences']);

        const result = audienceProcessJobController.getAudienceRules('1');

        expect(audienceProcessJobController.getAllRules).toHaveBeenCalled();
        expect(result.length).toBe(1);
        expect(result).toEqual(expected);
      });

      it('creates rules from mixed rules', () => {
        const expected = [
          {
            group: 0,
            variableName: 'U1',
            variableFriendlyName: 'var-name',
            operator: 'STRING_EQUALS',
            value: 'val1',
            negation: false,
          },
          {
            group: 0,
            variableName: 'U1',
            variableFriendlyName: 'var-name',
            operator: 'STRING_EQUALS',
            value: 'val2,val3',
            negation: false,
          },
          {
            group: 1,
            variableName: 'U3',
            variableFriendlyName: 'var-name',
            operator: 'STRING_EQUALS',
            value: 'val5',
            negation: false,
          },
        ];

        audienceProcessJobController = new AudienceProcessJobController(
          mockSheetsService,
          mockCampaignManagerService
        );
        jest
          .spyOn(audienceProcessJobController, 'getAllRules')
          .mockReturnValue(rulesTestData['mixed']);

        const result = audienceProcessJobController.getAudienceRules('1');

        expect(audienceProcessJobController.getAllRules).toHaveBeenCalled();
        expect(result.length).toBe(3);
        expect(result).toEqual(expected);
      });
    });

    describe('processAudience', () => {
      const defaultParams = {
        sheetName: 'audiences',
        row: 1,
        idCol: 1,
        statusCol: 6,
        checksumCol: 7,
        sharesChecksumCol: 8,
        defaultState: true,
        listSource: 'source',
        createAudienceAction: 'CREATE_AUDIENCE',
        updateAudienceAction: 'UPDATE_AUDIENCE',
        updateSharesAction: 'UPDATE_SHARES',
        rulesSheetName: 'Rules',
      };

      let audience: Audience;
      let remarketingList: GoogleAppsScript.CampaignManager.RemarketingList;

      beforeEach(() => {
        jest.spyOn(console, 'log');
        jest
          .spyOn(JobUtil, 'getCurrentDateString')
          .mockReturnValue('2023-01-01');

        audience = new Audience({
          id: 'id',
          name: 'test',
          description: 'test',
          lifeSpan: 0,
          floodlightId: '1',
          rules: [
            {
              group: 0,
              variableName: 'name',
              variableFriendlyName: 'name',
              operator: 'STRING_CONTAINS',
              value: 'value',
              negation: false,
            },
          ],
          shares: ['1', '2'],
        });
      });

      it('creates audience with given job, no errors', () => {
        const job = new AudienceProcessJob({
          idx: 0,
          audience: audience,
          actions: ['CREATE_AUDIENCE'],
        });

        remarketingList = {
          name: audience.getName(),
          description: audience.getDescription(),
          lifeSpan: audience.getLifeSpan(),
          listPopulationRule: {},
          active: true,
          listSource: 'source',
        };

        mockCampaignManagerService = {
          createRemarketingList: jest.fn().mockReturnValue({ id: 'new' }),
          updateRemarketingList: jest.fn().mockReturnValue({}),
        } as unknown as CampaignManagerFacade;

        audienceProcessJobController = new AudienceProcessJobController(
          mockSheetsService,
          mockCampaignManagerService
        );
        jest
          .spyOn(audienceProcessJobController, 'createListPopulationRule')
          .mockReturnValue({});

        const result = audienceProcessJobController.processAudience(
          job,
          defaultParams
        );

        expect(console.log).toHaveBeenCalledWith(
          "Processing audience 'test'...",
          'id'
        );
        expect(
          audienceProcessJobController.createListPopulationRule
        ).toHaveBeenNthCalledWith(
          1,
          audience.getFloodlightId(),
          audience.getRules()
        );
        expect(
          mockCampaignManagerService.createRemarketingList
        ).toHaveBeenNthCalledWith(1, remarketingList);
        expect(console.log).toHaveBeenCalledWith("Creating 'test'...");
        const message = "Processed audience 'test' successfully!";
        expect(console.log).toHaveBeenCalledWith(message);
        expect(result.getLogs()[0].message).toEqual(message);
        result.clearLogs();
        expect(result).toEqual(job);
        expect(mockSheetsService.findAndReplace).toHaveBeenNthCalledWith(
          1,
          'Rules',
          'id',
          'new'
        );
        expect(mockSheetsService.setCellValue).toHaveBeenCalledWith(
          1,
          2,
          'new',
          'audiences'
        );
        expect(mockSheetsService.setCellValue).toHaveBeenCalledWith(
          1,
          8,
          'md5Hash',
          'audiences'
        );
        expect(mockSheetsService.setCellValue).toHaveBeenCalledWith(
          1,
          7,
          'Success (2023-01-01)',
          'audiences'
        );
      });

      it('creates audience with given job, error thrown', () => {
        const job = new AudienceProcessJob({
          idx: 0,
          audience: audience,
          actions: ['CREATE_AUDIENCE'],
        });

        jest
          .spyOn(mockCampaignManagerService, 'createRemarketingList')
          .mockImplementationOnce(() => {
            throw new Error('Sorry an error occurred!');
          });

        /*mockCampaignManagerService.createRemarketingList =
          createSpy().and.throwError(new Error('Sorry an error occurred!'));*/
        jest
          .spyOn(audienceProcessJobController, 'createListPopulationRule')
          .mockReturnValue({});

        const result = audienceProcessJobController.processAudience(
          job,
          defaultParams
        );

        expect(console.log).toHaveBeenCalledWith(
          "Processing audience 'test'...",
          'id'
        );
        expect(
          audienceProcessJobController.createListPopulationRule
        ).toHaveBeenNthCalledWith(1, '1', audience.getRules());
        expect(
          mockCampaignManagerService.createRemarketingList
        ).toHaveBeenNthCalledWith(1, remarketingList);
        const message = "Error while processing audience 'test'!";
        expect(console.log).toHaveBeenCalledWith(message);
        expect(result.getLogs()[0].message).toEqual(message);
        result.clearLogs();
        expect(result).toEqual(job);
        expect(mockSheetsService.setCellValue).toHaveBeenNthCalledWith(
          1,
          1,
          7,
          'Error! Sorry an error occurred! (2023-01-01)',
          'audiences'
        );
      });

      it('updates audience with given job, no errors', () => {
        const job = new AudienceProcessJob({
          idx: 0,
          audience: audience,
          actions: ['UPDATE_AUDIENCE'],
        });

        remarketingList = {
          id: 'id',
          name: audience.getName(),
          description: audience.getDescription(),
          lifeSpan: audience.getLifeSpan(),
          listPopulationRule: {},
          active: true,
          listSource: 'source',
        };

        mockCampaignManagerService = {
          updateRemarketingList: jest.fn().mockReturnValue({}),
        } as unknown as CampaignManagerFacade;

        audienceProcessJobController = new AudienceProcessJobController(
          mockSheetsService,
          mockCampaignManagerService
        );
        jest
          .spyOn(audienceProcessJobController, 'createListPopulationRule')
          .mockReturnValue({});

        const result = audienceProcessJobController.processAudience(
          job,
          defaultParams
        );

        expect(console.log).toHaveBeenCalledWith(
          "Processing audience 'test'...",
          'id'
        );
        expect(
          audienceProcessJobController.createListPopulationRule
        ).toHaveBeenNthCalledWith(1, '1', audience.getRules());
        expect(
          mockCampaignManagerService.updateRemarketingList
        ).toHaveBeenNthCalledWith(1, remarketingList);
        expect(console.log).toHaveBeenCalledWith("Updating 'test'...");
        const message = "Processed audience 'test' successfully!";
        expect(console.log).toHaveBeenCalledWith(message);
        expect(result.getLogs()[0].message).toEqual(message);
        result.clearLogs();
        expect(result).toEqual(job);
        expect(mockSheetsService.setCellValue).toHaveBeenCalledWith(
          1,
          8,
          'md5Hash',
          'audiences'
        );
        expect(mockSheetsService.setCellValue).toHaveBeenCalledWith(
          1,
          7,
          'Success (2023-01-01)',
          'audiences'
        );
      });

      it('updates shares with given job, no errors', () => {
        const job = new AudienceProcessJob({
          idx: 0,
          audience: audience,
          actions: ['UPDATE_SHARES'],
        });

        mockCampaignManagerService = {
          getRemarketingListSharesResource: jest.fn().mockReturnValue({}),
          updateRemarketingListShares: jest.fn().mockReturnValue({}),
        } as unknown as CampaignManagerFacade;

        audienceProcessJobController = new AudienceProcessJobController(
          mockSheetsService,
          mockCampaignManagerService
        );
        jest
          .spyOn(audienceProcessJobController, 'createListPopulationRule')
          .mockReturnValue({});

        const result = audienceProcessJobController.processAudience(
          job,
          defaultParams
        );

        expect(console.log).toHaveBeenCalledWith(
          "Processing audience 'test'...",
          'id'
        );
        expect(
          audienceProcessJobController.createListPopulationRule
        ).toHaveBeenNthCalledWith(1, '1', audience.getRules());
        expect(
          mockCampaignManagerService.getRemarketingListSharesResource
        ).toHaveBeenNthCalledWith(1, 'id');
        expect(
          mockCampaignManagerService.updateRemarketingListShares
        ).toHaveBeenNthCalledWith(1, 'id', { sharedAdvertiserIds: ['1', '2'] });
        expect(console.log).toHaveBeenCalledWith(
          "Updating Shares for 'test'..."
        );
        const message = "Processed audience 'test' successfully!";
        expect(console.log).toHaveBeenCalledWith(message);
        expect(result.getLogs()[0].message).toEqual(message);
        result.clearLogs();
        expect(result).toEqual(job);
        expect(mockSheetsService.setCellValue).toHaveBeenCalledWith(
          1,
          9,
          'md5Hash',
          'audiences'
        );
        expect(mockSheetsService.setCellValue).toHaveBeenCalledWith(
          1,
          7,
          'Success (2023-01-01)',
          'audiences'
        );
      });
    });

    describe('createListPopulationRule', () => {
      it('creates no listPopulationRule if no data', () => {
        const expected = { floodlightActivityId: '1' };
        audienceProcessJobController = new AudienceProcessJobController(
          mockSheetsService,
          mockCampaignManagerService
        );

        const result = audienceProcessJobController.createListPopulationRule(
          '1',
          []
        );

        expect(result).toEqual(expected);
      });

      it('creates listPopulationRule from mixed rules', () => {
        const mixedRules: AudienceRule[] = [
          {
            group: 0,
            variableName: 'U1',
            variableFriendlyName: 'friendly-u1',
            operator: 'STRING_EQUALS',
            value: 'val1',
            negation: false,
          },
          {
            group: 0,
            variableName: 'U1',
            variableFriendlyName: 'friendly-u1',
            operator: 'STRING_EQUALS',
            value: 'val2,val3',
            negation: true,
          },
          {
            group: 1,
            variableName: 'U3',
            variableFriendlyName: 'friendly-u3',
            operator: 'STRING_EQUALS',
            value: 'val5',
            negation: false,
          },
        ];

        const expected: GoogleAppsScript.CampaignManager.ListPopulationRule = {
          floodlightActivityId: '1',
          listPopulationClauses: [
            {
              terms: [
                {
                  variableName: 'U1',
                  type: 'CUSTOM_VARIABLE_TERM',
                  operator: 'STRING_EQUALS',
                  value: 'val1',
                  negation: false,
                },
                {
                  variableName: 'U1',
                  type: 'CUSTOM_VARIABLE_TERM',
                  operator: 'STRING_EQUALS',
                  value: 'val2',
                  negation: true,
                },
                {
                  variableName: 'U1',
                  type: 'CUSTOM_VARIABLE_TERM',
                  operator: 'STRING_EQUALS',
                  value: 'val3',
                  negation: true,
                },
              ],
            },
            {
              terms: [
                {
                  variableName: 'U3',
                  type: 'CUSTOM_VARIABLE_TERM',
                  operator: 'STRING_EQUALS',
                  value: 'val5',
                  negation: false,
                },
              ],
            },
          ],
        };

        audienceProcessJobController = new AudienceProcessJobController(
          mockSheetsService,
          mockCampaignManagerService
        );

        const result = audienceProcessJobController.createListPopulationRule(
          '1',
          mixedRules
        );

        expect(result).toEqual(expected);
      });
    });
  });
});
