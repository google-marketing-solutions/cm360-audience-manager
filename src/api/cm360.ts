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

import { BaseApi } from './base';

/**
 * @fileoverview This Google Apps Script file directly accesses the
 * Campaign Manager API through the use of the built-in {@link UrlFetchApp}.
 *
 * @see appsscript.json for a list of enabled advanced services and API scopes.
 */

const API_SCOPE = 'dfareporting';
const API_VERSION = 'v4';

/**
 * CampaignManagerApi representing a REST wrapper for the the CM360 API.
 */
export class CampaignManagerApi extends BaseApi {
  advertiserId_: string;

  /**
   * @constructs an instance of CampaignManagerApi.
   *
   * @param {string} advertiserId The CM360 Advertiser ID
   */
  constructor(advertiserId: string) {
    super(API_SCOPE, API_VERSION);

    /** @private @const {string} */
    this.advertiserId_ = advertiserId;
  }

  /**
   * Retrieves all available CM360 User Profiles for the logged in user and
   * CM360 Network.
   *
   * @returns {?UserProfile[]} The CM360 User Profiles array
   */
  getUserProfiles(): GoogleAppsScript.CampaignManager.UserProfile[] | null {
    return this.executeApiRequest('userprofiles', { method: 'get' }, true)
      ?.items;
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
    const path =
      `userprofiles/${profileId}/floodlightConfigurations/` +
      this.getAdvertiserId();

    return this.executeApiRequest(path, { method: 'get' }, true)
      ?.userDefinedVariableConfigurations;
  }

  /**
   * Retrieves configured floodlight activities from the logged in user's
   * CM360 Network and Advertiser.
   *
   * @param {string} profileId The user profile ID
   * @returns {FloodlightActivity[]} The floodlight activities array
   */
  getFloodlightActivities(
    profileId: string
  ): GoogleAppsScript.CampaignManager.FloodlightActivity[] {
    const path =
      `userprofiles/${profileId}/floodlightActivities` +
      `?advertiserId=${this.getAdvertiserId()}`;

    return this.executeApiRequest(path, { method: 'get' }, true)
      ?.floodlightActivities as GoogleAppsScript.CampaignManager.FloodlightActivity[];
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
   */
  getAdvertisers(
    profileId: string,
    advertisersFilter: string[],
    maxResultsPerPage: number,
    callback: (result: GoogleAppsScript.CampaignManager.Advertiser[]) => void
  ) {
    const params = {
      sortField: 'Name',
      maxResults: maxResultsPerPage,
      ids: advertisersFilter,
    };

    if (advertisersFilter.length > 0) {
      params.ids = advertisersFilter;
    }

    const queryString = this.objectToUrlQuery('', params);
    const path = `userprofiles/${profileId}/advertisers${queryString}`;

    this.executePagedApiRequest(path, { method: 'get' }, callback);
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
    const path =
      `userprofiles/${profileId}/remarketingLists` +
      `?advertiserId=${this.getAdvertiserId()}`;

    return this.executeApiRequest(path, { method: 'get' }, true)
      ?.remarketingLists;
  }

  /**
   * Updates a remarketing list using the given resource parameter and user
   * profile ID.
   *
   * @param {string} profileId The user profile ID
   * @param {!Record<string, unknown>} remarketingListResource The remarketing list resource
   * @returns {RemarketingList}
   */
  updateRemarketingList(
    profileId: string,
    remarketingListResource: GoogleAppsScript.CampaignManager.RemarketingList
  ): GoogleAppsScript.CampaignManager.RemarketingList {
    const path = `userprofiles/${profileId}/remarketingLists`;

    return this.executeApiRequest(
      path,
      {
        method: 'put',
        payload: JSON.stringify(remarketingListResource),
      },
      true
    ) as GoogleAppsScript.CampaignManager.RemarketingList;
  }

  /**
   * Creates a remarketing list using the given parameters.
   *
   * @param {string} profileId The user profile ID
   * @param {!Record<string, unknown>} remarketingList The remarketing list object to use for the
   *     create operation
   * @returns {RemarketingList} The created remarketingListResource object
   */
  createRemarketingList(
    profileId: string,
    remarketingList: GoogleAppsScript.CampaignManager.RemarketingList
  ): GoogleAppsScript.CampaignManager.RemarketingList {
    const path = `userprofiles/${profileId}/remarketingLists`;

    return this.executeApiRequest(
      path,
      {
        method: 'post',
        payload: JSON.stringify(remarketingList),
      },
      false
    ) as GoogleAppsScript.CampaignManager.RemarketingList;
  }

  /**
   * Retrieves configured remarketing list shares for the given remarketing list
   * ID from the logged in user's CM360 Network and Advertiser.
   *
   * @param {string} profileId The user profile ID
   * @param {string} remarketingListId The ID of the remarketing list. Used for
   *     retrieving advertiser IDs that the remarketing list is shared with
   * @returns {!Object} The remarketing list shares resource
   */
  getRemarketingListSharesResource(
    profileId: string,
    remarketingListId: string
  ): GoogleAppsScript.CampaignManager.RemarketingListShare {
    const path =
      `userprofiles/${profileId}/remarketingListShares/` + remarketingListId;

    return this.executeApiRequest(
      path,
      { method: 'get' },
      true
    ) as GoogleAppsScript.CampaignManager.RemarketingListShare;
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
  getRemarketingListShares(
    profileId: string,
    remarketingListId: string
  ): string[] {
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
    const path =
      `userprofiles/${profileId}/remarketingListShares?` +
      `id=${remarketingListId}`;

    this.executeApiRequest(
      path,
      {
        method: 'patch',
        payload: JSON.stringify(remarketingListSharesResource),
      },
      true
    );
  }

  /**
   * Returns the CM360 Advertiser ID.
   *
   * @returns {string} The CM360 Advertiser ID
   */
  getAdvertiserId(): string {
    return this.advertiserId_;
  }
}
