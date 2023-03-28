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
 * @fileoverview This file contains tests for CampaignManagerFacade.
 */

import { CampaignManagerApi } from '../../src/api/cm360';
import { CampaignManagerFacade } from '../../src/facade/cm360';
import { CampaignManagerService } from '../../src/service/cm360';

global.CampaignManager = {} as unknown as typeof CampaignManager;

describe('CampaignManagerFacade', () => {
  const accountData = {
    networkId: '1234',
    advertiserId: '1234',
  };

  const rl: GoogleAppsScript.CampaignManager.RemarketingList = {
    name: 'name',
    description: '',
    lifeSpan: 10,
    active: true,
    listSource: '',
  };

  it('instantiates the API if apiFirst', () => {
    const apiFirst = true;
    const campaignManagerFacade = new CampaignManagerFacade(
      accountData,
      apiFirst
    );

    expect(campaignManagerFacade.getAccountData()).toEqual(accountData);
    expect(campaignManagerFacade.isApiFirst()).toEqual(apiFirst);
    expect(
      campaignManagerFacade.getCampaignManager() instanceof CampaignManagerApi
    ).toBe(true);
  });

  it('instantiates the service otherwise', () => {
    const apiFirst = false;
    /*const campaignManager = createSpyObj('CampaignManager', ['test']);
    const campaignManagerFacade = new CampaignManagerFacade(
      accountData,
      apiFirst,
      [],
      campaignManager
    );*/

    const campaignManagerFacade = new CampaignManagerFacade(
      accountData,
      apiFirst,
      undefined
    );

    expect(campaignManagerFacade.getAccountData()).toEqual(accountData);
    expect(campaignManagerFacade.isApiFirst()).toEqual(apiFirst);
    expect(
      campaignManagerFacade.getCampaignManager() instanceof
        CampaignManagerService
    ).toBe(true);
  });

  describe('method', () => {
    const campaignManagerFacade = new CampaignManagerFacade(
      accountData,
      false,
      []
    );

    describe('getUserProfileId', () => {
      it('throws Error if no User Profiles fetched', () => {
        const userProfilesList: GoogleAppsScript.CampaignManager.UserProfile[] =
          [];

        const mockService = {
          getUserProfiles: jest.fn().mockReturnValue(userProfilesList),
        } as unknown as CampaignManagerService;

        jest
          .spyOn(mockService, 'getUserProfiles')
          .mockReturnValue(userProfilesList);

        jest
          .spyOn(campaignManagerFacade, 'getCampaignManager')
          .mockReturnValue(mockService);

        expect(() => void campaignManagerFacade.getUserProfileId()).toThrow(
          new Error(
            `Could not find a User Profile assciated with the given CM360` +
              ` Network: 1234! Please create a User Profile using the` +
              ` CM360 UI before retrying this operation.`
          )
        );
      });

      it('throws Error if no matching user Profiles fetched', () => {
        const userProfilesList: GoogleAppsScript.CampaignManager.UserProfile[] =
          [
            {
              accountId: '123',
              profileId: '123',
            },
            {
              accountId: '456',
              profileId: '123',
            },
          ];

        const mockService = {
          getUserProfiles: jest.fn().mockReturnValue(userProfilesList),
        } as unknown as CampaignManagerService;

        jest
          .spyOn(mockService, 'getUserProfiles')
          .mockReturnValue(userProfilesList);

        jest
          .spyOn(campaignManagerFacade, 'getCampaignManager')
          .mockReturnValue(mockService);

        expect(() => void campaignManagerFacade.getUserProfileId()).toThrow(
          new Error(
            `Could not find a User Profile assciated with the given CM360` +
              ` Network: 1234! Please create a User Profile using the` +
              ` CM360 UI before retrying this operation.`
          )
        );
      });

      it('retrieves valid User Profile ID', () => {
        const userProfilesList: GoogleAppsScript.CampaignManager.UserProfile[] =
          [
            {
              accountId: '1234',
              profileId: '123',
            },
            {
              accountId: '1234',
              profileId: '456',
            },
            {
              accountId: '123',
              profileId: '456',
            },
          ];

        const mockService = {
          getUserProfiles: jest.fn().mockReturnValue(userProfilesList),
        } as unknown as CampaignManagerService;

        jest
          .spyOn(mockService, 'getUserProfiles')
          .mockReturnValue(userProfilesList);

        jest
          .spyOn(campaignManagerFacade, 'getCampaignManager')
          .mockReturnValue(mockService);

        const result = campaignManagerFacade.getUserProfileId();
        expect(result).toBe('123');
      });
    });

    describe('getUserDefinedVariableConfigurations', () => {
      it('calls through to the underlying implementation', () => {
        const mockService = {
          getUserDefinedVariableConfigurations: jest.fn().mockReturnValue([]),
        } as unknown as CampaignManagerService;

        jest
          .spyOn(campaignManagerFacade, 'getCampaignManager')
          .mockReturnValue(mockService);
        jest
          .spyOn(campaignManagerFacade, 'getUserProfileId')
          .mockReturnValue('123');

        const result =
          campaignManagerFacade.getUserDefinedVariableConfigurations();

        expect(
          mockService.getUserDefinedVariableConfigurations
        ).toHaveBeenCalledWith('123');
        expect(result).toEqual([]);
      });
    });

    describe('getFloodlightActivities', () => {
      it('calls through to the underlying implementation', () => {
        const mockService = {
          getFloodlightActivities: jest.fn().mockReturnValue([]),
        } as unknown as CampaignManagerService;

        jest.spyOn(mockService, 'getFloodlightActivities').mockReturnValue([]);

        jest
          .spyOn(campaignManagerFacade, 'getCampaignManager')
          .mockReturnValue(mockService);
        jest
          .spyOn(campaignManagerFacade, 'getUserProfileId')
          .mockReturnValue('123');

        const result = campaignManagerFacade.getFloodlightActivities();

        expect(mockService.getFloodlightActivities).toHaveBeenCalledWith('123');
        expect(result).toEqual([]);
      });
    });

    describe('getAdvertisers', () => {
      it('calls through to the underlying implementation', () => {
        const mockService = {
          getAdvertisers: jest.fn().mockReturnValue(undefined),
        } as unknown as CampaignManagerService;

        jest.spyOn(mockService, 'getAdvertisers').mockReturnValue(undefined);

        jest
          .spyOn(campaignManagerFacade, 'getCampaignManager')
          .mockReturnValue(mockService);
        jest
          .spyOn(campaignManagerFacade, 'getUserProfileId')
          .mockReturnValue('123');
        const callback = () => {};

        campaignManagerFacade.getAdvertisers(10, callback);

        expect(mockService.getAdvertisers).toHaveBeenCalledWith(
          '123',
          [],
          10,
          callback
        );
      });
    });

    describe('getRemarketingLists', () => {
      it('calls through to the underlying implementation', () => {
        /*const mockService = createSpyObj('MockService', {
          getRemarketingLists: [],
        });*/

        const mockService = {
          getRemarketingLists: jest.fn().mockReturnValue([]),
        } as unknown as CampaignManagerService;

        jest
          .spyOn(campaignManagerFacade, 'getCampaignManager')
          .mockReturnValue(mockService);
        jest
          .spyOn(campaignManagerFacade, 'getUserProfileId')
          .mockReturnValue('123');

        const result = campaignManagerFacade.getRemarketingLists();

        expect(mockService.getRemarketingLists).toHaveBeenCalledWith('123');
        expect(result).toEqual([]);
      });
    });

    describe('updateRemarketingList', () => {
      it('calls through to the underlying implementation', () => {
        /*const mockService = createSpyObj('MockService', {
          updateRemarketingList: undefined,
        });*/

        const mockService = {
          updateRemarketingList: jest.fn().mockReturnValue(undefined),
        } as unknown as CampaignManagerService;

        jest
          .spyOn(campaignManagerFacade, 'getCampaignManager')
          .mockReturnValue(mockService);
        jest
          .spyOn(campaignManagerFacade, 'getUserProfileId')
          .mockReturnValue('123');

        campaignManagerFacade.updateRemarketingList(rl);

        expect(mockService.updateRemarketingList).toHaveBeenCalledWith(
          '123',
          rl
        );
      });
    });

    describe('createRemarketingList', () => {
      it('calls through to the underlying implementation', () => {
        /*const mockService = createSpyObj('MockService', {
          createRemarketingList: {},
        });*/

        const mockService = {
          createRemarketingList: jest.fn().mockReturnValue({}),
        } as unknown as CampaignManagerService;

        const rlWithAdvertiserId: GoogleAppsScript.CampaignManager.RemarketingList =
          Object.assign(rl, {
            advertiserId: accountData.advertiserId,
          });

        jest
          .spyOn(campaignManagerFacade, 'getCampaignManager')
          .mockReturnValue(mockService);
        jest
          .spyOn(campaignManagerFacade, 'getUserProfileId')
          .mockReturnValue('123');

        const result = campaignManagerFacade.createRemarketingList(rl);

        expect(mockService.createRemarketingList).toHaveBeenCalledWith(
          '123',
          rlWithAdvertiserId
        );
        expect(result).toEqual({});
      });
    });

    describe('getRemarketingListSharesResource', () => {
      it('calls through to the underlying implementation', () => {
        /*const mockService = createSpyObj('MockService', {
          getRemarketingListSharesResource: {},
        });*/

        const mockService = {
          getRemarketingListSharesResource: jest.fn().mockReturnValue({}),
        } as unknown as CampaignManagerService;

        jest
          .spyOn(campaignManagerFacade, 'getCampaignManager')
          .mockReturnValue(mockService);
        jest
          .spyOn(campaignManagerFacade, 'getUserProfileId')
          .mockReturnValue('123');

        const result =
          campaignManagerFacade.getRemarketingListSharesResource('456');

        expect(
          mockService.getRemarketingListSharesResource
        ).toHaveBeenCalledWith('123', '456');
        expect(result).toEqual({});
      });
    });

    describe('getRemarketingListShares', () => {
      it('calls through to the underlying implementation', () => {
        /*const mockService = createSpyObj('MockService', {
          getRemarketingListShares: [],
        });*/

        const mockService = {
          getRemarketingListShares: jest.fn().mockReturnValue([]),
        } as unknown as CampaignManagerService;

        jest
          .spyOn(campaignManagerFacade, 'getCampaignManager')
          .mockReturnValue(mockService);
        jest
          .spyOn(campaignManagerFacade, 'getUserProfileId')
          .mockReturnValue('123');

        const result = campaignManagerFacade.getRemarketingListShares('456');

        expect(mockService.getRemarketingListShares).toHaveBeenCalledWith(
          '123',
          '456'
        );
        expect(result).toEqual([]);
      });
    });

    describe('updateRemarketingListShares', () => {
      it('calls through to the underlying implementation', () => {
        /*const mockService = createSpyObj('MockService', {
          updateRemarketingListShares: undefined,
        });*/

        const mockService = {
          updateRemarketingListShares: jest.fn().mockReturnValue(undefined),
        } as unknown as CampaignManagerService;

        const rls: GoogleAppsScript.CampaignManager.RemarketingListShare = {
          remarketingListId: '1',
          sharedAdvertiserIds: [],
        };

        jest
          .spyOn(campaignManagerFacade, 'getCampaignManager')
          .mockReturnValue(mockService);

        jest
          .spyOn(campaignManagerFacade, 'getUserProfileId')
          .mockReturnValue('123');

        campaignManagerFacade.updateRemarketingListShares('456', rls);

        expect(mockService.updateRemarketingListShares).toHaveBeenCalledWith(
          '123',
          '456',
          rls
        );
      });
    });
  });
});
