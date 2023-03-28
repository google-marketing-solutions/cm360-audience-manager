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
 * @fileoverview This file contains tests for CampaignManagerApi.
 */

import { CampaignManagerApi } from '../../src/api/cm360';

describe('CampaignManagerApi', () => {
  const advertiserId = '1234';
  const rl: GoogleAppsScript.CampaignManager.RemarketingList = {
    id: '1',
    name: 'name',
    description: '',
    lifeSpan: 10,
    active: true,
    listSource: '',
  };

  it('instantiates correctly', () => {
    const campaignManagerApi = new CampaignManagerApi(advertiserId);

    expect(campaignManagerApi.getAdvertiserId()).toEqual(advertiserId);
  });

  describe('method', () => {
    const campaignManagerApi = new CampaignManagerApi(advertiserId);

    describe('getUserProfiles', () => {
      it('calls through to the underlying API', () => {
        jest.spyOn(campaignManagerApi, 'executeApiRequest').mockReturnValue({
          items: [],
        });

        const result = campaignManagerApi.getUserProfiles();

        expect(campaignManagerApi.executeApiRequest).toHaveBeenCalledWith(
          'userprofiles',
          { method: 'get' },
          true
        );
        expect(result).toEqual([]);
      });
    });

    describe('getUserDefinedVariableConfigurations', () => {
      it('calls through to the underlying API', () => {
        jest.spyOn(campaignManagerApi, 'executeApiRequest').mockReturnValue({
          userDefinedVariableConfigurations: [],
        });

        const result =
          campaignManagerApi.getUserDefinedVariableConfigurations('123');

        expect(campaignManagerApi.executeApiRequest).toHaveBeenCalledWith(
          'userprofiles/123/floodlightConfigurations/1234',
          { method: 'get' },
          true
        );
        expect(result).toEqual([]);
      });
    });

    describe('getFloodlightActivities', () => {
      it('calls through to the underlying API', () => {
        jest.spyOn(campaignManagerApi, 'executeApiRequest').mockReturnValue({
          floodlightActivities: [],
        });

        const result = campaignManagerApi.getFloodlightActivities('123');

        expect(campaignManagerApi.executeApiRequest).toHaveBeenCalledWith(
          'userprofiles/123/floodlightActivities?advertiserId=1234',
          { method: 'get' },
          true
        );
        expect(result).toEqual([]);
      });
    });

    describe('getAdvertisers', () => {
      it('calls through to the underlying API', () => {
        jest
          .spyOn(campaignManagerApi, 'executePagedApiRequest')
          .mockReturnValue(undefined);
        const callback = () => {};

        campaignManagerApi.getAdvertisers('123', [], 10, callback);

        expect(campaignManagerApi.executePagedApiRequest).toHaveBeenCalledWith(
          'userprofiles/123/advertisers?sortField=Name&maxResults=10',
          { method: 'get' },
          callback
        );
      });

      it('sets correct ids filter', () => {
        jest
          .spyOn(campaignManagerApi, 'executePagedApiRequest')
          .mockReturnValue(undefined);
        const callback = () => {};

        campaignManagerApi.getAdvertisers('123', ['1', '345'], 10, callback);

        expect(campaignManagerApi.executePagedApiRequest).toHaveBeenCalledWith(
          'userprofiles/123/advertisers?sortField=Name' +
            '&maxResults=10&ids=1&ids=345',
          { method: 'get' },
          callback
        );
      });
    });

    describe('getRemarketingLists', () => {
      it('calls through to the underlying API', () => {
        jest.spyOn(campaignManagerApi, 'executeApiRequest').mockReturnValue({
          remarketingLists: [],
        });

        const result = campaignManagerApi.getRemarketingLists('123');

        expect(campaignManagerApi.executeApiRequest).toHaveBeenCalledWith(
          'userprofiles/123/remarketingLists?advertiserId=1234',
          { method: 'get' },
          true
        );
        expect(result).toEqual([]);
      });
    });

    describe('updateRemarketingList', () => {
      it('calls through to the underlying API', () => {
        jest.spyOn(campaignManagerApi, 'executeApiRequest');

        campaignManagerApi.updateRemarketingList('123', rl);

        expect(campaignManagerApi.executeApiRequest).toHaveBeenCalledWith(
          'userprofiles/123/remarketingLists',
          {
            method: 'put',
            payload: JSON.stringify(rl),
          },
          true
        );
      });
    });

    describe('createRemarketingList', () => {
      it('calls through to the underlying API', () => {
        jest.spyOn(campaignManagerApi, 'executeApiRequest').mockReturnValue({});

        const result = campaignManagerApi.createRemarketingList('123', rl);

        expect(campaignManagerApi.executeApiRequest).toHaveBeenCalledWith(
          'userprofiles/123/remarketingLists',
          {
            method: 'post',
            payload: JSON.stringify(rl),
          },
          false
        );
        expect(result).toEqual({});
      });
    });

    describe('getRemarketingListSharesResource', () => {
      it('calls through to the underlying API', () => {
        jest.spyOn(campaignManagerApi, 'executeApiRequest');

        campaignManagerApi.getRemarketingListSharesResource('123', '456');

        expect(campaignManagerApi.executeApiRequest).toHaveBeenCalledWith(
          'userprofiles/123/remarketingListShares/456',
          { method: 'get' },
          true
        );
      });
    });

    describe('getRemarketingListShares', () => {
      it('calls through to the underlying API', () => {
        jest
          .spyOn(campaignManagerApi, 'getRemarketingListSharesResource')
          .mockReturnValue({ remarketingListId: '1', sharedAdvertiserIds: [] });

        const result = campaignManagerApi.getRemarketingListShares(
          '123',
          '456'
        );

        expect(
          campaignManagerApi.getRemarketingListSharesResource
        ).toHaveBeenCalledWith('123', '456');
        expect(result).toEqual([]);
      });
    });

    describe('updateRemarketingListShares', () => {
      const rls: GoogleAppsScript.CampaignManager.RemarketingListShare = {
        remarketingListId: '2',
        sharedAdvertiserIds: [],
      };

      it('calls through to the underlying API', () => {
        jest.spyOn(campaignManagerApi, 'executeApiRequest');

        campaignManagerApi.updateRemarketingListShares('123', '456', rls);

        expect(campaignManagerApi.executeApiRequest).toHaveBeenCalledWith(
          'userprofiles/123/remarketingListShares?id=456',
          {
            method: 'patch',
            payload: JSON.stringify(rls),
          },
          true
        );
      });
    });
  });
});
