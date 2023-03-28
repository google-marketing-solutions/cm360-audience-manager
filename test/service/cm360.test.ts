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
 * @fileoverview This file contains tests for CampaignManagerService.
 */

import { CampaignManagerService } from '../../src/service/cm360';

global.CampaignManager = {} as unknown as typeof CampaignManager;

describe('CampaignManagerService', () => {
  const advertiserId = '1234';

  it('instantiates correctly', () => {
    //const campaignManager = createSpyObj('CampaignManager', ['test']);
    const campaignManagerService = new CampaignManagerService(
      advertiserId,
      global.CampaignManager
    );

    expect(campaignManagerService.getAdvertiserId()).toEqual(advertiserId);
    expect(campaignManagerService.getService()).toEqual(global.CampaignManager);
  });

  describe('method', () => {
    describe('getUserProfiles', () => {
      it('calls through to the underlying service', () => {
        /*const userProfiles = createSpyObj('UserProfiles', {
          list: { items: [] },
        });
        const campaignManager = createSpyObj(
          'CampaignManager',
          {},
          {
            UserProfiles: userProfiles,
          }
        );*/

        const campaignManager: typeof CampaignManager = {
          UserProfiles: {
            list: jest.fn().mockReturnValue({ items: [] }),
          },
        } as unknown as typeof CampaignManager;

        const campaignManagerService = new CampaignManagerService(
          advertiserId,
          campaignManager
        );

        const result = campaignManagerService.getUserProfiles();

        expect(campaignManager.UserProfiles.list).toHaveBeenCalledTimes(1);
        expect(result).toEqual([]);
      });
    });

    describe('getUserDefinedVariableConfigurations', () => {
      it('calls through to the underlying service', () => {
        /*const floodlightConfig = createSpyObj('FloodlightConfigurations', {
          get: { userDefinedVariableConfigurations: [] },
        });
        const campaignManager = createSpyObj(
          'CampaignManager',
          {},
          {
            FloodlightConfigurations: floodlightConfig,
          }
        );*/

        const campaignManager: typeof CampaignManager = {
          FloodlightConfigurations: {
            get: jest
              .fn()
              .mockReturnValue({ userDefinedVariableConfigurations: [] }),
          },
        } as unknown as typeof CampaignManager;

        const campaignManagerService = new CampaignManagerService(
          advertiserId,
          campaignManager
        );

        const result =
          campaignManagerService.getUserDefinedVariableConfigurations('123');

        expect(
          campaignManager.FloodlightConfigurations.get
        ).toHaveBeenCalledWith('123', '1234');
        expect(result).toEqual([]);
      });
    });

    describe('getFloodlightActivities', () => {
      it('calls through to the underlying service', () => {
        /*const floodlightConfig = createSpyObj('FloodlightActivities', {
          list: { floodlightActivities: [] },
        });
        const campaignManager = createSpyObj(
          'CampaignManager',
          {},
          {
            FloodlightActivities: floodlightConfig,
          }
        );*/

        const campaignManager: typeof CampaignManager = {
          FloodlightActivities: {
            list: jest.fn().mockReturnValue({ floodlightActivities: [] }),
          },
        } as unknown as typeof CampaignManager;

        const campaignManagerService = new CampaignManagerService(
          advertiserId,
          campaignManager
        );

        const result = campaignManagerService.getFloodlightActivities('123');

        expect(campaignManager.FloodlightActivities.list).toHaveBeenCalledWith(
          '123',
          {
            advertiserId: '1234',
          }
        );
        expect(result).toEqual([]);
      });
    });

    describe('getAdvertisers', () => {
      it('calls underlying implementation once for one page only', () => {
        const list = {};
        /*const advertisers = createSpyObj('Advertisers', {
          list: list,
        });
        const campaignManager = createSpyObj(
          'CampaignManager',
          {},
          {
            Advertisers: advertisers,
          }
        );*/

        const campaignManager: typeof CampaignManager = {
          Advertisers: {
            list: jest.fn().mockReturnValue(list),
          },
        } as unknown as typeof CampaignManager;

        const campaignManagerService = new CampaignManagerService(
          advertiserId,
          campaignManager
        );

        const callback = (
          advertisers: GoogleAppsScript.CampaignManager.Advertiser[]
        ) => {
          expect(advertisers).toEqual([]);
        };
        campaignManagerService.getAdvertisers('123', [], 10, callback);

        expect(campaignManager.Advertisers.list).toHaveBeenNthCalledWith(
          1,
          '123',
          {
            maxResults: 10,
            pageToken: undefined,
            sortField: 'NAME',
          }
        );
      });

      it('calls underlying implementation once per page', () => {
        const list = { nextPageToken: 'token', advertisers: ['1'] };
        const campaignManager: typeof CampaignManager = {
          Advertisers: {
            list: jest.fn().mockReturnValue(list),
          },
        } as unknown as typeof CampaignManager;

        const campaignManagerService = new CampaignManagerService(
          advertiserId,
          campaignManager
        );

        const callback = (
          advertisers: GoogleAppsScript.CampaignManager.Advertiser[]
        ) => {
          expect(advertisers).toEqual(list.advertisers);
        };
        campaignManagerService.getAdvertisers('123', [], 10, callback, 2);

        expect(campaignManager.Advertisers.list).toHaveBeenCalledWith('123', {
          maxResults: 10,
          pageToken: undefined,
          sortField: 'NAME',
        });
        expect(campaignManager.Advertisers.list).toHaveBeenCalledWith('123', {
          maxResults: 10,
          pageToken: 'token',
          sortField: 'NAME',
        });
      });

      it('sets correct ids filter', () => {
        const list = { nextPageToken: 'token', advertisers: ['1'] };
        const campaignManager: typeof CampaignManager = {
          Advertisers: {
            list: jest.fn().mockReturnValue(list),
          },
        } as unknown as typeof CampaignManager;

        const campaignManagerService = new CampaignManagerService(
          advertiserId,
          campaignManager
        );

        const callback = (
          advertisers: GoogleAppsScript.CampaignManager.Advertiser[]
        ) => {
          expect(advertisers).toEqual(list.advertisers);
        };
        campaignManagerService.getAdvertisers(
          '123',
          ['1', '345'],
          10,
          callback,
          1
        );

        expect(campaignManager.Advertisers.list).toHaveBeenCalledWith('123', {
          maxResults: 10,
          pageToken: undefined,
          sortField: 'NAME',
          ids: ['1', '345'],
        });
      });
    });

    describe('getRemarketingLists', () => {
      it('calls through to the underlying service', () => {
        /*const remarketingLists = createSpyObj('RemarketingLists', {
          list: { remarketingLists: [] },
        });
        const campaignManager = createSpyObj(
          'CampaignManager',
          {},
          {
            RemarketingLists: remarketingLists,
          }
        );*/

        const campaignManager: typeof CampaignManager = {
          RemarketingLists: {
            list: jest.fn().mockReturnValue({ remarketingLists: [] }),
          },
        } as unknown as typeof CampaignManager;

        const campaignManagerService = new CampaignManagerService(
          advertiserId,
          campaignManager
        );

        const result = campaignManagerService.getRemarketingLists('123');

        expect(campaignManager.RemarketingLists.list).toHaveBeenCalledWith(
          '123',
          '1234'
        );
        expect(result).toEqual([]);
      });
    });

    describe('updateRemarketingList', () => {
      it('calls through to the underlying service', () => {
        /*const remarketingLists = createSpyObj('RemarketingLists', {
          update: undefined,
        });
        const campaignManager = createSpyObj(
          'CampaignManager',
          {},
          {
            RemarketingLists: remarketingLists,
          }
        );*/

        const campaignManager: typeof CampaignManager = {
          RemarketingLists: {
            update: jest.fn().mockReturnValue({ update: undefined }),
          },
        } as unknown as typeof CampaignManager;

        const campaignManagerService = new CampaignManagerService(
          advertiserId,
          campaignManager
        );

        campaignManagerService.updateRemarketingList(
          '123',
          {} as GoogleAppsScript.CampaignManager.RemarketingList
        );

        expect(campaignManager.RemarketingLists.update).toHaveBeenCalledWith(
          {},
          '123'
        );
      });
    });

    describe('createRemarketingList', () => {
      it('calls through to the underlying service', () => {
        /*const remarketingLists = createSpyObj('RemarketingLists', {
          insert: { id: 'new' },
        });
        const campaignManager = createSpyObj(
          'CampaignManager',
          {
            newRemarketingList: { default: '1' },
          },
          {
            RemarketingLists: remarketingLists,
          }
        );*/

        const campaignManager: typeof CampaignManager = {
          newRemarketingList: jest.fn().mockReturnValue({ default: '1' }),
          RemarketingLists: {
            insert: jest.fn().mockReturnValue({ id: 'new' }),
          },
        } as unknown as typeof CampaignManager;

        const campaignManagerService = new CampaignManagerService(
          advertiserId,
          campaignManager
        );

        const result = campaignManagerService.createRemarketingList('123', {
          name: 'name',
          advertiserId: '1234',
        } as GoogleAppsScript.CampaignManager.RemarketingList);

        expect(campaignManager.newRemarketingList).toHaveBeenCalledTimes(1);
        expect(campaignManager.RemarketingLists.insert).toHaveBeenCalledWith(
          { default: '1', name: 'name', advertiserId: '1234' },
          '123'
        );
        expect(result).toEqual({ id: 'new' });
      });
    });

    describe('getRemarketingListSharesResource', () => {
      it('calls through to the underlying service', () => {
        /*const remarketingListShares = createSpyObj('RemarketingListShares', {
          get: { sharedAdvertiserIds: [] },
        });
        const campaignManager = createSpyObj(
          'CampaignManager',
          {},
          {
            RemarketingListShares: remarketingListShares,
          }
        );*/

        const campaignManager: typeof CampaignManager = {
          RemarketingListShares: {
            get: jest.fn().mockReturnValue({ sharedAdvertiserIds: [] }),
          },
        } as unknown as typeof CampaignManager;

        const campaignManagerService = new CampaignManagerService(
          advertiserId,
          campaignManager
        );

        campaignManagerService.getRemarketingListSharesResource('123', '456');

        expect(campaignManager.RemarketingListShares.get).toHaveBeenCalledWith(
          '123',
          '456'
        );
      });
    });

    describe('getRemarketingListShares', () => {
      it('calls through to the underlying service', () => {
        //const campaignManager = createSpyObj('CampaignManager', ['test']);

        const campaignManager: typeof CampaignManager =
          {} as unknown as typeof CampaignManager;

        const campaignManagerService = new CampaignManagerService(
          advertiserId,
          campaignManager
        );
        jest
          .spyOn(campaignManagerService, 'getRemarketingListSharesResource')
          .mockReturnValue({
            remarketingListId: '1',
            sharedAdvertiserIds: ['2'],
          });

        const result = campaignManagerService.getRemarketingListShares(
          '123',
          '456'
        );

        expect(
          campaignManagerService.getRemarketingListSharesResource
        ).toHaveBeenCalledWith('123', '456');
        expect(result).toEqual(['2']);
      });
    });

    describe('updateRemarketingListShares', () => {
      it('calls through to the underlying service', () => {
        /*const remarketingListShares = createSpyObj('RemarketingListShares', {
          patch: undefined,
        });
        const campaignManager = createSpyObj(
          'CampaignManager',
          {},
          {
            RemarketingListShares: remarketingListShares,
          }
        );*/

        const campaignManager: typeof CampaignManager = {
          RemarketingListShares: {
            patch: jest.fn().mockReturnValue(undefined),
          },
        } as unknown as typeof CampaignManager;

        const campaignManagerService = new CampaignManagerService(
          advertiserId,
          campaignManager
        );

        campaignManagerService.updateRemarketingListShares(
          '123',
          '456',
          {} as GoogleAppsScript.CampaignManager.RemarketingListShare
        );

        expect(
          campaignManager.RemarketingListShares.patch
        ).toHaveBeenCalledWith({}, '123', '456');
      });
    });
  });
});
