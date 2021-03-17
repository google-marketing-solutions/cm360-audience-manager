/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview This Google Apps Script file wraps all interactions with the
 * Campaign Manager API through the use of the built-in
 * 'Advanced Google Service' {@link CampaignManager}.
 *
 * @see appsscript.json for a list of enabled advanced services.
 */


/**
 * @class CampaignManagerService representing a wrapper for the the CM360 API.
 */
class CampaignManagerService {
  /**
   * @constructs an instance of CampaignManagerService.
   *
   * @param {{cmNetwork: string, advertiserId: string}} accountData The CM360
   *     account data
   * @param {?Object=} campaignManagerServiceWrapper A wrapper for the
   *     CampaignManager service to facilitate testing
   */
  constructor(accountData, campaignManagerServiceWrapper = undefined) {
    /** @private @const {{cmNetwork: string, advertiserId: string}} */
    this.accountData_ = accountData;

    /** @private @const {!Object} */
    this.campaignManagerService_ = campaignManagerServiceWrapper ?
        campaignManagerServiceWrapper :
        CampaignManager;
  }

  /**
   * Retrieves all available CM360 User Profiles for the logged in user and
   * CM360 Network.
   *
   * @return {?Array<!Object>} The CM360 User Profiles array
   */
  getUserProfiles() {
    return this.getService().UserProfiles.list().items;
  }

  /**
   * Retrieves user defined variable configurations for the logged in user and
   * CM360 Network.
   *
   * @param {string} profileId The user profile ID
   * @return {!Array<!Object>} The user defined variable configuration array
   */
  getUserDefinedVariableConfigurations(profileId) {
    return this.getService()
        .FloodlightConfigurations
        .get(
            profileId,
            this.getAccountData().advertiserId,
            {accountId: this.getAccountData().cmNetwork})
        .userDefinedVariableConfigurations;
  }

  /**
   * Retrieves configured floodlight activities from the logged in user's
   * CM360 Network and Advertiser.
   *
   * @param {string} profileId The user profile ID
   * @return {!Array<!Object>} The floodlight activities array
   */
  getFloodlightActivities(profileId) {
    return this.getService()
        .FloodlightConfigurations
        .list(
            profileId,
            {advertiserId: this.getAccountData().advertiserId})
        .floodlightActivities;
  }

  /**
   * Retrieves Advertisers belonging to the given CM360 Network using the given
   * thresholding parameters, triggering 'callback' for every fetched 'page' of
   * data.
   *
   * @param {string} profileId The user profile ID
   * @param {number} maxResultsPerPage The maximum number of results to fetch
   *     per page
   * @param {function(!Object): undefined} callback The callback to trigger
   *     after fetching every 'page' of results
   * @param {number=} maxPages Optional number to limit number of 'pages' to
   *     fetch. Used primarily for testing and defaults to -1 (fetch all)
   */
  getAdvertisers(profileId, maxResultsPerPage, callback, maxPages = -1) {
    let pageCount = 1;
    let pageToken;

    do {
      const result = this.getService().Advertisers.list(profileId, {
        maxResults: maxResultsPerPage,
        pageToken: pageToken,
        sortField: 'NAME',
      });
      callback(result);
      pageToken = result.nextPageToken;
      pageCount++;
    } while (pageToken && (maxPages < 0 || pageCount <= maxPages));
  }

  /**
   * Retrieves configured remarketing lists from the logged in user's CM360
   * Network and Advertiser.
   *
   * @param {string} profileId The user profile ID
   * @return {!Array<!Object>} The remarketing lists array
   */
  getRemarketingLists(profileId) {
    return this.getService()
        .RemarketingLists
        .list(
            profileId,
            this.getAccountData().advertiserId,
            {accountId: this.getAccountData().cmNetwork})
        .remarketingLists;
  }

  /**
   * Retrieves configured remarketing list shares for the given remarketing list
   * ID from the logged in user's CM360 Network and Advertiser.
   *
   * @param {string} profileId The user profile ID
   * @param {string} remarketingListId The ID of the remarketing list. Used for
   *     retrieving advertiser IDs that the remarketing list is shared with
   * @return {!Array<string>} The remarketing list shares array
   */
  getRemarketingListShares(profileId, remarketingListId) {
    return this.getService()
        .RemarketingListShares
        .get(profileId, remarketingListId)
        .sharedAdvertiserIds;
  }

  /**
   * Returns the CampaignManager service reference.
   *
   * @return {!Object} The service reference
   */
  getService() {
    return this.campaignManagerService_;
  }

  /**
   * Returns the CM360 account data.
   *
   * @return {{cmNetwork: string, advertiserId: string}} The CM360 account data
   */
  getAccountData() {
    return this.accountData_;
  }

}

