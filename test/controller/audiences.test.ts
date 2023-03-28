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
 * @fileoverview This file contains tests for AudiencesController.
 */

import { AudiencesController } from '../../src/controller/audiences';
import { CampaignManagerFacade } from '../../src/facade/cm360';
import { Audience } from '../../src/model/audience';
import { AudienceLoadJob } from '../../src/model/audienceLoadJob';
import { Job } from '../../src/model/job';
import { SheetsService } from '../../src/service/sheets';
import { JobUtil } from '../../src/util/job';

global.Utilities = {
  computeDigest: jest.fn().mockReturnValue([]),
  DigestAlgorithm: {
    MD5: '',
  },
} as unknown as typeof Utilities;

describe('AudiencesController', () => {
  let mockSheetsService: SheetsService;
  let mockCampaignManagerService: CampaignManagerFacade;

  beforeEach(() => {
    mockSheetsService = {
      showToast: jest.fn().mockReturnValue(undefined),
      clearDefinedRange: jest.fn().mockReturnValue(undefined),
      setValuesInDefinedRange: jest.fn().mockReturnValue(undefined),
      appendToDefinedRange: jest.fn().mockReturnValue(undefined),
      getRangeData: jest.fn().mockReturnValue([[]]),
      getCellValue: jest.fn().mockReturnValue(undefined),
    } as unknown as SheetsService;

    mockCampaignManagerService = {
      getUserDefinedVariableConfigurations: jest.fn().mockReturnValue([]),
      getFloodlightActivities: jest.fn().mockReturnValue([]),
      getAdvertisers: jest.fn().mockReturnValue(undefined),
      getRemarketingLists: jest.fn().mockReturnValue([]),
      getRemarketingListShares: jest.fn().mockReturnValue([]),
    } as unknown as CampaignManagerFacade;
  });

  it('instantiates correctly', () => {
    const audiencesController = new AudiencesController(
      mockSheetsService,
      mockCampaignManagerService
    );

    expect(audiencesController.getSheetsService()).toEqual(mockSheetsService);
    expect(audiencesController.getCampaignManagerService()).toEqual(
      mockCampaignManagerService
    );
  });

  describe('method', () => {
    let audiencesController: AudiencesController;

    beforeEach(() => {
      audiencesController = new AudiencesController(
        mockSheetsService,
        mockCampaignManagerService
      );
    });

    describe('fetchAndOutputCustomVariables', () => {
      it('clears range and outputs nothing if empty custom vars', () => {
        audiencesController.fetchAndOutputCustomVariables({
          sheetName: 'test',
          row: 1,
          col: 1,
          separator: ',',
        });

        expect(mockSheetsService.clearDefinedRange).toHaveBeenNthCalledWith(
          1,
          'test',
          1,
          1
        );
        expect(
          mockSheetsService.setValuesInDefinedRange
        ).toHaveBeenNthCalledWith(1, 'test', 1, 1, []);
      });

      it('clears range, maps custom vars and outputs them', () => {
        mockCampaignManagerService = {
          getUserDefinedVariableConfigurations: jest.fn().mockReturnValue([
            { variableType: 'type', extra: '1', reportName: 'report' },
            { variableType: 'var', extra: '1', reportName: 'rep' },
          ]),
        } as unknown as CampaignManagerFacade;

        audiencesController = new AudiencesController(
          mockSheetsService,
          mockCampaignManagerService
        );

        audiencesController.fetchAndOutputCustomVariables({
          sheetName: 'test',
          row: 1,
          col: 1,
          separator: ',',
        });

        expect(mockSheetsService.clearDefinedRange).toHaveBeenNthCalledWith(
          1,
          'test',
          1,
          1
        );
        expect(
          mockSheetsService.setValuesInDefinedRange
        ).toHaveBeenNthCalledWith(1, 'test', 1, 1, [
          ['type,report'],
          ['var,rep'],
        ]);
      });
    });

    describe('fetchAndOutputFloodlightActivities', () => {
      it('clears range and outputs nothing if empty custom vars', () => {
        audiencesController.fetchAndOutputFloodlightActivities({
          sheetName: 'test',
          row: 1,
          col: 1,
        });

        expect(mockSheetsService.clearDefinedRange).toHaveBeenNthCalledWith(
          1,
          'test',
          1,
          1
        );
        expect(
          mockSheetsService.setValuesInDefinedRange
        ).toHaveBeenNthCalledWith(1, 'test', 1, 1, []);
      });

      it('clears range, maps floodlight activities and outputs them', () => {
        mockCampaignManagerService = {
          getFloodlightActivities: jest.fn().mockReturnValue([
            { id: '1', extra: '1', name: 'test' },
            { id: '2', extra: '1', name: 'name' },
          ]),
        } as unknown as CampaignManagerFacade;

        audiencesController = new AudiencesController(
          mockSheetsService,
          mockCampaignManagerService
        );

        audiencesController.fetchAndOutputFloodlightActivities({
          sheetName: 'test',
          row: 1,
          col: 1,
        });

        expect(mockSheetsService.clearDefinedRange).toHaveBeenNthCalledWith(
          1,
          'test',
          1,
          1
        );
        expect(
          mockSheetsService.setValuesInDefinedRange
        ).toHaveBeenNthCalledWith(1, 'test', 1, 1, [
          ['1', 'test (1)'],
          ['2', 'name (2)'],
        ]);
      });
    });

    describe('fetchAndOutputAdvertisers', () => {
      it('clears range and calls service', () => {
        audiencesController.fetchAndOutputAdvertisers({
          sheetName: 'test',
          row: 1,
          col: 1,
          maxResultsPerPage: 10,
        });

        expect(mockSheetsService.clearDefinedRange).toHaveBeenNthCalledWith(
          1,
          'test',
          1,
          1
        );
        expect(mockCampaignManagerService.getAdvertisers).toHaveBeenCalledTimes(
          1
        );
      });
    });

    describe('outputAdvertisers', () => {
      it('appends empty array to sheet for empty result', () => {
        audiencesController.outputAdvertisers([], '1', {
          sheetName: 'test',
          row: 1,
          col: 1,
        });

        expect(mockSheetsService.appendToDefinedRange).toHaveBeenNthCalledWith(
          1,
          'test',
          1,
          1,
          []
        );
      });

      it('appends results to sheet for valid result', () => {
        const advertisers = [
          { id: '1', extra: 1, name: 'test' },
          { id: '2', extra: 1, name: 'name' },
        ] as unknown as GoogleAppsScript.CampaignManager.Advertiser[];

        audiencesController.outputAdvertisers(advertisers, '3', {
          sheetName: 'test',
          row: 1,
          col: 1,
        });

        expect(mockSheetsService.appendToDefinedRange).toHaveBeenNthCalledWith(
          1,
          'test',
          1,
          1,
          [
            ['1', 'test (1)'],
            ['2', 'name (2)'],
          ]
        );
      });

      it('appends results to sheet for valid result without own advertiser ID', () => {
        const advertisers = [
          { id: '1', extra: 1, name: 'test' },
          { id: '2', extra: 1, name: 'name' },
        ] as unknown as GoogleAppsScript.CampaignManager.Advertiser[];

        audiencesController.outputAdvertisers(advertisers, '1', {
          sheetName: 'test',
          row: 1,
          col: 1,
        });

        expect(mockSheetsService.appendToDefinedRange).toHaveBeenNthCalledWith(
          1,
          'test',
          1,
          1,
          [['2', 'name (2)']]
        );
      });
    });

    describe('loadAudiences', () => {
      const defaultParams = {
        sheetName: 'test',
        row: 1,
        col: 1,
      };

      it('creates no AudienceLoad jobs if no audiences', () => {
        const result = audiencesController.loadAudiences(
          new Job(),
          defaultParams
        );

        expect(mockSheetsService.showToast).toHaveBeenCalledWith(
          'Loading audiences...',
          'Load - BEGIN'
        );
        expect(mockSheetsService.clearDefinedRange).toHaveBeenCalledWith(
          'test',
          1,
          1
        );
        expect(result.getJobs().length).toBe(0);
      });

      it('creates AudienceLoad jobs', () => {
        const remarketingLists = [
          {
            id: '1',
            name: 'test-1',
            listPopulationRule: { floodlightActivityId: 123 },
          },
          { id: '2', name: 'test-2' },
        ];

        mockCampaignManagerService = {
          getRemarketingLists: jest.fn().mockReturnValue(remarketingLists),
          getUserDefinedVariableConfigurations: jest.fn().mockReturnValue([]),
          getFloodlightActivities: jest.fn().mockReturnValue([]),
        } as unknown as CampaignManagerFacade;

        audiencesController = new AudiencesController(
          mockSheetsService,
          mockCampaignManagerService
        );

        const result = audiencesController.loadAudiences(
          new Job(),
          defaultParams
        );

        expect(mockSheetsService.showToast).toHaveBeenCalledWith(
          'Loading audiences...',
          'Load - BEGIN'
        );
        expect(mockSheetsService.clearDefinedRange).toHaveBeenCalledWith(
          'test',
          1,
          1
        );
        expect(result.getJobs().length).toBe(2);
        expect(
          (result.getJobs()[0] as AudienceLoadJob).getAudience().getName()
        ).toEqual('test-1');
      });
    });

    describe('loadAudience', () => {
      // TODO: do me!

      const defaultParams = {
        sheetName: 'Audiences',
        row: 2,
        col: 1,
      };

      let audience: Audience;

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
          floodlightName: 'fl',
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

      it('extracts Audience from Job and writes it to sheet', () => {
        const job = new AudienceLoadJob({
          idx: 0,
          audience: audience,
        });

        mockCampaignManagerService = {
          getRemarketingListShares: jest.fn().mockReturnValue([]),
        } as unknown as CampaignManagerFacade;

        const audienceRow = [
          'id',
          'test',
          'test',
          0,
          'fl (1)',
          '',
          'Fetched (2023-01-01)',
          '',
          '',
          '{"id_":"id","name_":"test","description_":"test","lifeSpan_":0,"floodlightId_":"1","floodlightName_":"fl","rules_":[{"group":0,"name":"name","operator":"STRING_CONTAINS","value":"value","negation":false}],"shares_":[]}',
        ];

        audiencesController = new AudiencesController(
          mockSheetsService,
          mockCampaignManagerService
        );

        jest
          .spyOn(audiencesController, 'audienceToRow')
          .mockReturnValue(audienceRow);

        audiencesController.loadAudience(job, defaultParams);

        expect(
          mockCampaignManagerService.getRemarketingListShares
        ).toHaveBeenCalledWith(audience.getId());

        expect(audiencesController.audienceToRow).toHaveBeenNthCalledWith(
          1,
          audience
        );

        expect(
          mockSheetsService.setValuesInDefinedRange
        ).toHaveBeenNthCalledWith(1, 'Audiences', 2, 1, [audienceRow]);
      });
    });

    describe('audienceToRow', () => {
      beforeEach(() => {
        jest
          .spyOn(JobUtil, 'getCurrentDateString')
          .mockReturnValue('2023-01-01');
      });

      it('formats provided Audience, empty shares', () => {
        const audience = new Audience({
          id: '1',
          name: 'test',
          description: 'test desc',
          lifeSpan: 1,
          floodlightId: '123',
          floodlightName: 'First',
          rules: [],
          shares: [],
        });

        jest.spyOn(audiencesController, 'getMappedShares').mockReturnValue('');

        const result = audiencesController.audienceToRow(audience);

        expect(result).toEqual([
          '1',
          'test',
          'test desc',
          1,
          'First (123)',
          '',
          'Fetched (2023-01-01)',
          '',
          '',
          '{"id_":"1","name_":"test","description_":"test desc","lifeSpan_":1,"floodlightId_":"123","floodlightName_":"First","rules_":[],"shares_":[]}',
        ]);
      });

      it('formats provided Audience, including shares', () => {
        const audience = new Audience({
          id: '1',
          name: 'test',
          description: 'test desc',
          lifeSpan: 1,
          floodlightId: '123',
          floodlightName: 'First',
          rules: [],
          shares: ['1', '2'],
        });

        jest
          .spyOn(audiencesController, 'getMappedShares')
          .mockReturnValue('1,2');

        const result = audiencesController.audienceToRow(audience);

        expect(result).toEqual([
          '1',
          'test',
          'test desc',
          1,
          'First (123)',
          '1,2',
          'Fetched (2023-01-01)',
          '',
          '',
          '{"id_":"1","name_":"test","description_":"test desc","lifeSpan_":1,"floodlightId_":"123","floodlightName_":"First","rules_":[],"shares_":["1","2"]}',
        ]);
      });
    });

    describe('getRemarketingListShares', () => {
      it('returns empty string if empty remarketing list shares', () => {
        const result = audiencesController.getMappedShares([]);

        expect(result).toBe('');
      });

      it('maps remarketing list shares, sorts and returns them', () => {
        mockCampaignManagerService = {
          getRemarketingListShares: jest.fn().mockReturnValue(['3', '1', '2']),
        } as unknown as CampaignManagerFacade;

        audiencesController = new AudiencesController(
          mockSheetsService,
          mockCampaignManagerService
        );

        jest
          .spyOn(audiencesController, 'resolveAdvertiserById')
          .mockImplementationOnce(() => '3')
          .mockImplementationOnce(() => '1')
          .mockImplementationOnce(() => '2');

        const result = audiencesController.getMappedShares(
          ['3', '1', '2'],
          ','
        );

        expect(audiencesController.resolveAdvertiserById).toHaveBeenCalledWith(
          '3'
        );
        expect(audiencesController.resolveAdvertiserById).toHaveBeenCalledWith(
          '1'
        );
        expect(audiencesController.resolveAdvertiserById).toHaveBeenCalledWith(
          '2'
        );
        expect(result).toBe('1,2,3');
      });
    });

    describe('resolveAdvertiserById', () => {
      it('returns default if empty range data', () => {
        const result = audiencesController.resolveAdvertiserById('id', {
          sheetName: 'test',
          row: 1,
          col: 1,
          defaultName: 'default',
        });

        expect(mockSheetsService.getRangeData).toHaveBeenNthCalledWith(
          1,
          'test',
          1,
          1
        );
        expect(result).toBe('default');
      });

      it('returns default if not matched', () => {
        mockSheetsService = {
          getRangeData: jest.fn().mockReturnValue([
            ['1', 'test1'],
            ['2', 'test2'],
          ]),
        } as unknown as SheetsService;

        /*mockSheetsService = createSpyObj('SheetsService', {
          getRangeData: [
            ['1', 'test1'],
            ['2', 'test2'],
          ],
        });*/

        audiencesController = new AudiencesController(
          mockSheetsService,
          mockCampaignManagerService
        );

        const result = audiencesController.resolveAdvertiserById('id', {
          sheetName: 'test',
          row: 1,
          col: 1,
          defaultName: 'default',
          idCol: 0,
          nameCol: 1,
        });

        expect(mockSheetsService.getRangeData).toHaveBeenNthCalledWith(
          1,
          'test',
          1,
          1
        );
        expect(result).toBe('default');
      });

      it('returns name if matched', () => {
        mockSheetsService = {
          getRangeData: jest.fn().mockReturnValue([
            ['1', 'test1'],
            ['2', 'test2'],
          ]),
        } as unknown as SheetsService;

        audiencesController = new AudiencesController(
          mockSheetsService,
          mockCampaignManagerService
        );

        const result = audiencesController.resolveAdvertiserById('1', {
          sheetName: 'test',
          row: 1,
          col: 1,
          defaultName: 'default',
          idCol: 0,
          nameCol: 1,
        });

        expect(mockSheetsService.getRangeData).toHaveBeenNthCalledWith(
          1,
          'test',
          1,
          1
        );
        expect(result).toBe('test1');
      });
    });

    describe('extractAndOutputRules', () => {
      it('returns name if matched', () => {
        const audience1 = new Audience({
          id: '123',
          name: 'name',
          lifeSpan: 1,
          rules: [
            {
              group: 0,
              variableName: 'U1',
              variableFriendlyName: 'my-var',
              operator: 'STRING_EQUALS',
              value: 'test',
              negation: false,
            },
            {
              group: 1,
              variableName: 'U2',
              variableFriendlyName: 'my-var-2',
              operator: 'STRING_EQUALS',
              value: 'test-2',
              negation: false,
            },
          ],
          shares: [],
        });

        const audience2 = new Audience({
          id: '234',
          name: 'name',
          lifeSpan: 1,
          rules: [
            {
              group: 0,
              variableName: 'U1',
              variableFriendlyName: 'my-var',
              operator: 'STRING_EQUALS',
              value: 'test',
              negation: false,
            },
            {
              group: 1,
              variableName: 'U2',
              variableFriendlyName: 'my-var-2',
              operator: 'STRING_EQUALS',
              value: 'test-2',
              negation: false,
            },
          ],
          shares: [],
        });

        const audienceRows = [
          ['', '', '', 0, '', '', '', '', '', audience1.toJson()],
          ['', '', '', 0, '', '', '', '', '', audience2.toJson()],
        ];

        mockSheetsService = {
          getRangeData: jest.fn().mockReturnValue(audienceRows),
          clearDefinedRange: jest.fn().mockReturnValue(undefined),
        } as unknown as SheetsService;

        audiencesController = new AudiencesController(
          mockSheetsService,
          mockCampaignManagerService
        );

        jest
          .spyOn(audiencesController, 'outputAudienceRules')
          .mockReturnValue();

        audiencesController.extractAndOutputRules();

        expect(mockSheetsService.clearDefinedRange).toHaveBeenCalledWith(
          'Rules',
          2,
          1
        );

        expect(audiencesController.outputAudienceRules).toHaveBeenCalledWith(
          audience1.getId(),
          audience1.getRules()
        );
        expect(audiencesController.outputAudienceRules).toHaveBeenCalledWith(
          audience2.getId(),
          audience2.getRules()
        );
        expect(audiencesController.outputAudienceRules).toHaveBeenCalledTimes(
          2
        );
      });
    });

    describe('outputAudienceRules', () => {
      it('appends results to sheet for valid result', () => {
        const defaultParameters = {
          sheetName: 'Rules',
          row: 1,
          col: 1,
          audienceIdCol: 0,
          groupCol: 1,
          variableCol: 2,
          operatorCol: 3,
          valuesCol: 4,
          negationCol: 5,
          separator: ':',
        };

        const rules = [
          {
            group: 0,
            variableName: 'U1',
            variableFriendlyName: 'my-var',
            operator: 'STRING_EQUALS',
            value: 'test',
            negation: false,
          },
          {
            group: 1,
            variableName: 'U2',
            variableFriendlyName: 'my-var-2',
            operator: 'STRING_EQUALS',
            value: 'test-2',
            negation: false,
          },
        ];

        audiencesController.outputAudienceRules('1', rules, defaultParameters);

        const expectedRows = [
          ['1', 0, 'U1:my-var', 'STRING_EQUALS', 'test', false],
          ['1', 1, 'U2:my-var-2', 'STRING_EQUALS', 'test-2', false],
        ];

        expect(mockSheetsService.appendToDefinedRange).toHaveBeenNthCalledWith(
          1,
          'Rules',
          1,
          1,
          expectedRows
        );
      });
    });
  });
});
