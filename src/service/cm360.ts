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

import { UriUtil } from '../util/uri';

/**
 * @fileoverview This Google Apps Script file wraps all interactions with the
 * Campaign Manager API through the use of the built-in
 * 'Advanced Google Service' {@link CampaignManager}.
 *
 * @see appsscript.json for a list of enabled advanced services.
 * {@link CampaignManager}.
 */

declare const CampaignManager: GoogleAppsScript.CampaignManager.CampaignManager;

/**
 * CampaignManagerService representing a wrapper for the the CM360 API.
 */
export class CampaignManagerService {
  private readonly advertiserId_: string;
  private readonly campaignManagerService_: GoogleAppsScript.CampaignManager.CampaignManager;

  /**
   * @constructs an instance of CampaignManagerService.
   *
   * @param {string} advertiserId The CM360 Advertiser ID
   * @param {?Object=} campaignManagerServiceWrapper A wrapper for the built-in
   *     'CampaignManager' service to facilitate testing by passing a mock
   */
  constructor(
    advertiserId: string,
    campaignManagerServiceWrapper?: GoogleAppsScript.CampaignManager.CampaignManager
  ) {
    this.advertiserId_ = advertiserId;
    this.campaignManagerService_ =
      typeof campaignManagerServiceWrapper !== 'undefined'
        ? campaignManagerServiceWrapper
        : CampaignManager;
  }

  /**
   * Retrieves all available CM360 User Profiles for the logged in user and
   * CM360 Network.
   *
   * @returns {UserProfile[]} The CM360 User Profiles array
   */
  getUserProfiles(): GoogleAppsScript.CampaignManager.UserProfile[] {
    return this.getService().UserProfiles.list().items;
  }

  /**
   * Retrieves user defined variable configurations for the logged in user and
   * CM360 Network.
   *
   * @param {string} profileId The user profile ID
   * @returns {UserDefinedVariableConfiguration[]} The user defined variable configuration array
   */
  getUserDefinedVariableConfigurations(
    profileId: string
  ): GoogleAppsScript.CampaignManager.UserDefinedVariableConfiguration[] {
    const res = this.getService().FloodlightConfigurations.get(
      profileId,
      this.getAdvertiserId()
    );

    return 'userDefinedVariableConfigurations' in res
      ? res.userDefinedVariableConfigurations
      : [];
  }

  /**
   * Retrieves configured floodlight activities from the logged in user's
   * CM360 Network and Advertiser.
   *
   * @param {string} profileId The user profile ID
   * @returns {!Array<!Object>} The floodlight activities array
   */
  getFloodlightActivities(
    profileId: string
  ): GoogleAppsScript.CampaignManager.FloodlightActivity[] {
    const res = this.getService().FloodlightActivities.list(profileId, {
      advertiserId: this.getAdvertiserId(),
    });

    return res?.floodlightActivities ?? [];
  }

  /**
   * Retrieves Advertisers belonging to the given CM360 Network using the given
   * thresholding parameters, triggering 'callback' for every fetched 'page' of
   * data.
   *
   * @param {string} profileId The user profile ID
   * @param {string[]} advertisersFilter Which advertisers to include
   * @param {number} maxResultsPerPage The maximum number of results to fetch
   *     per page
   * @param {function(!Object): undefined} callback The callback to trigger
   *     after fetching every 'page' of results
   * @param {number=} maxPages Optional number to limit number of 'pages' to
   *     fetch. Used primarily for testing and defaults to -1 (fetch all)
   */
  getAdvertisers(
    profileId: string,
    advertisersFilter: string[],
    maxResultsPerPage: number,
    callback: (result: GoogleAppsScript.CampaignManager.Advertiser[]) => void,
    maxPages = -1
  ) {
    let pageCount = 1;
    let pageToken;

    do {
      const params: Record<string, unknown> = {
        maxResults: maxResultsPerPage,
        pageToken,
        sortField: 'NAME',
      };

      if (advertisersFilter.length > 0) {
        params.ids = advertisersFilter;
      }

      console.log('calling list with', profileId, params);

      const result = this.getService().Advertisers.list(profileId, params);
      console.log('result', result);
      const t = result?.advertisers ?? [];
      console.log('will return', t);
      callback(result?.advertisers ?? []);
      pageToken = result.nextPageToken;
      pageCount++;
    } while (pageToken && (maxPages < 0 || pageCount <= maxPages));
  }

  /**
   * Retrieves configured remarketing lists from the logged in user's CM360
   * Network and Advertiser.
   *
   * @param {string} profileId The user profile ID
   * @returns {RemarketingList[]} The remarketing lists array
   */
  getRemarketingLists(
    profileId: string
  ): GoogleAppsScript.CampaignManager.RemarketingList[] {
    return this.getService().RemarketingLists.list(
      profileId,
      this.getAdvertiserId()
    ).remarketingLists;
  }

  /**
   * Updates a remarketing list using the given resource parameter and user
   * profile ID.
   *
   * @param {string} profileId The user profile ID
   * @param {!RemarketingList} remarketingListResource The remarketing list resource
   */
  updateRemarketingList(
    profileId: string,
    remarketingListResource: GoogleAppsScript.CampaignManager.RemarketingList
  ): GoogleAppsScript.CampaignManager.RemarketingList {
    return this.getService().RemarketingLists.update(
      remarketingListResource,
      profileId
    );
  }

  /**
   * Creates a remarketing list using the given parameters.
   *
   * @param {string} profileId The user profile ID
   * @param {!RemarketingList} remarketingList The remarketing list object to use for the
   *     create operation
   * @returns {!RemarketingList} The created remarketingListResource object
   */
  createRemarketingList(
    profileId: string,
    remarketingList: GoogleAppsScript.CampaignManager.RemarketingList
  ): GoogleAppsScript.CampaignManager.RemarketingList {
    const remarketingListResource = UriUtil.extend(
      this.getService().newRemarketingList(),
      remarketingList
    ) as GoogleAppsScript.CampaignManager.RemarketingList;

    return this.getService().RemarketingLists.insert(
      remarketingListResource,
      profileId
    );
  }

  /**
   * Retrieves configured remarketing list shares for the given remarketing list
   * ID from the logged in user's CM360 Network and Advertiser.
   *
   * @param {string} profileId The user profile ID
   * @param {string} remarketingListId The ID of the remarketing list. Used for
   *     retrieving advertiser IDs that the remarketing list is shared with
   * @returns {RemarketingListShare[]} The remarketing list shares resource
   */
  getRemarketingListSharesResource(
    profileId: string,
    remarketingListId: string
  ) {
    return this.getService().RemarketingListShares.get(
      profileId,
      remarketingListId
    );
  }

  /**
   * Retrieves configured remarketing list shared advertiser IDs for the given
   * remarketing list ID from the logged in user's CM360 Network and Advertiser.
   *
   * @param {string} profileId The user profile ID
   * @param {string} remarketingListId The ID of the remarketing list. Used for
   *     retrieving advertiser IDs that the remarketing list is shared with
   * @returns {string[]} The remarketing list shared advertiser IDs array
   */
  getRemarketingListShares(profileId: string, remarketingListId: string) {
    return this.getRemarketingListSharesResource(profileId, remarketingListId)
      .sharedAdvertiserIds;
  }

  /**
   * Updates a remarketing list's 'shares' using the given resource parameter,
   * remarketing list ID and user profile ID.
   *
   * @param {string} profileId The user profile ID
   * @param {string} remarketingListId The ID of the remarketing list to update
   *     'shares' for
   * @param {!RemarketingListShare} remarketingListSharesResource The remarketing list shares
   *     resource
   */
  updateRemarketingListShares(
    profileId: string,
    remarketingListId: string,
    remarketingListSharesResource: GoogleAppsScript.CampaignManager.RemarketingListShare
  ) {
    this.getService().RemarketingListShares.patch(
      remarketingListSharesResource,
      profileId,
      remarketingListId
    );
  }

  /**
   * Returns the CampaignManager service reference.
   *
   * @returns {!Object} The service reference
   */
  getService() {
    return this.campaignManagerService_;
  }

  /**
   * Returns the CM360 Advertiser ID.
   *
   * @returns {string} The CM360 Advertiser ID
   */
  getAdvertiserId() {
    return this.advertiserId_;
  }
}
