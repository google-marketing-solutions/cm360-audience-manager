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
 * @fileoverview This Google Apps Script acts as a facade for the underlying
 * Campaign Manager 360 API implementation, either through the built-in
 * 'Advanced Google Service' wrapped by {@link CampaignManagerService} or
 * directly through {@link CampaignManagerApi}, depending on the value of the
 * boolean constructor parameter 'apiFirst'. This is helpful for those customers
 * who run into authentication issues when using the built-in
 * {@link CampaignManager} 'Advanced Google Service'.
 */


/**
 * @class CampaignManagerFacade representing a facade for the the underlying
 * CM360 API implementation.
 */
class CampaignManagerFacade {
  /**
   * @constructs an instance of CampaignManagerFacade.
   *
   * @param {{networkId: string, advertiserId: string}} accountData The CM360
   *     account data
   * @param {boolean} apiFirst Whether to access the API directly or not
   * @param {?Object=} campaignManagerServiceWrapper A wrapper for the built-in
   *     CampaignManager service to facilitate testing
   */
  constructor(
      accountData, apiFirst, campaignManagerServiceWrapper = undefined) {
    /** @private @const {{networkId: string, advertiserId: string}} */
    this.accountData_ = accountData;

    /** @private @const {boolean} */
    this.apiFirst_ = apiFirst;

    /** @private @const {!CampaignManagerApi|!CampaignManagerService} */
    this.campaignManager_ = apiFirst ?
        new CampaignManagerApi(accountData.advertiserId) :
        new CampaignManagerService(
            accountData.advertiserId, campaignManagerServiceWrapper);
  }

  /**
   * Retrieves the CM360 User Profile ID for the logged in user and CM360
   * Network.
   *
   * @return {string} The CM360 User Profile ID
   * @throws {!Error} If no User Profile ID was found for the logged in user and
   *     CM360 Network
   */
  getUserProfileId() {
    const networkId = this.getAccountData().networkId;
    const userProfiles = this.getCampaignManager().getUserProfiles();
    let userProfileId = '';

    if (userProfiles) {
      const filteredUserProfiles = userProfiles.filter(
          (userProfile) => userProfile.accountId === networkId.toString());

      if (filteredUserProfiles && filteredUserProfiles[0]) {
        userProfileId = filteredUserProfiles[0].profileId;
      }
    }
    if (!userProfileId) {
      throw new Error(
          `Could not find a User Profile assciated with the given CM360 ` +
          `Network: ${networkId}! Please create a User Profile using the ` +
          `CM360 UI before retrying this operation.`);
    }
    return userProfileId;
  }

  /**
   * Retrieves user defined variable configurations for the logged in user and
   * CM360 Network.
   *
   * @return {!Array<!Object>} The user defined variable configuration array
   */
  getUserDefinedVariableConfigurations() {
    const profileId = this.getUserProfileId();

    return this.getCampaignManager()
        .getUserDefinedVariableConfigurations(profileId);
  }

  /**
   * Retrieves configured floodlight activities from the logged in user's
   * CM360 Network and Advertiser.
   *
   * @return {!Array<!Object>} The floodlight activities array
   */
  getFloodlightActivities() {
    const profileId = this.getUserProfileId();

    return this.getCampaignManager()
        .getFloodlightActivities(profileId);
  }

  /**
   * Retrieves Advertisers belonging to the given CM360 Network using the given
   * thresholding parameters, triggering 'callback' for every fetched 'page' of
   * data.
   *
   * @param {number} maxResultsPerPage The maximum number of results to fetch
   *     per page
   * @param {function(!Object): undefined} callback The callback to trigger
   *     after fetching every 'page' of results
   */
  getAdvertisers(maxResultsPerPage, callback) {
    const profileId = this.getUserProfileId();

    this.getCampaignManager()
        .getAdvertisers(profileId, maxResultsPerPage, callback);
  }

  /**
   * Retrieves configured remarketing lists from the logged in user's
   * CM360 Network and Advertiser.
   *
   * @return {!Array<!Object>} The remarketing lists array
   */
  getRemarketingLists() {
    const profileId = this.getUserProfileId();

    return this.getCampaignManager()
        .getRemarketingLists(profileId);
  }

  /**
   * Updates a remarketing list using the given resource parameter.
   *
   * @param {!Object} remarketingListResource The remarketing list resource
   */
  updateRemarketingList(remarketingListResource) {
    const profileId = this.getUserProfileId();

    this.getCampaignManager()
        .updateRemarketingList(profileId, remarketingListResource);
  }

  /**
   * Creates a remarketing list using the given parameters.
   *
   * @param {!Object} remarketingList The remarketing list object to use for the
   *     create operation
   * @return {!Object} The created remarketingListResource object
   */
  createRemarketingList(remarketingList) {
    const profileId = this.getUserProfileId();
    const extendedRemarketingList = UriUtil.extend(remarketingList, {
      advertiserId: this.getAccountData().advertiserId,
    });

    return this.getCampaignManager()
        .createRemarketingList(profileId, extendedRemarketingList);
  }

  /**
   * Retrieves configured remarketing list shares for the given remarketing list
   * ID from the logged in user's CM360 Network and Advertiser.
   *
   * @param {string} remarketingListId The ID of the remarketing list. Used for
   *     retrieving advertiser IDs that the remarketing list is shared with
   * @return {!Object} The remarketing list shares resource
   */
  getRemarketingListSharesResource(remarketingListId) {
    const profileId = this.getUserProfileId();

    return this.getCampaignManager()
        .getRemarketingListSharesResource(profileId, remarketingListId);
  }

  /**
   * Retrieves configured remarketing list shared advertiser IDs for the given
   * remarketing list ID from the logged in user's CM360 Network and Advertiser.
   *
   * @param {string} remarketingListId The ID of the remarketing list. Used for
   *     retrieving advertiser IDs that the remarketing list is shared with
   * @return {!Array<string>} The remarketing list shared advertiser IDs array
   */
  getRemarketingListShares(remarketingListId) {
    const profileId = this.getUserProfileId();

    return this.getCampaignManager()
        .getRemarketingListShares(profileId, remarketingListId);
  }

  /**
   * Updates a remarketing list's 'shares' using the given resource parameter.
   *
   * @param {string} remarketingListId The ID of the remarketing list to update
   *     'shares' for
   * @param {!Object} remarketingListSharesResource The remarketing list shares
   *     resource
   */
  updateRemarketingListShares(
      remarketingListId, remarketingListSharesResource) {
    const profileId = this.getUserProfileId();

    this.getCampaignManager().updateRemarketingListShares(
        profileId, remarketingListId, remarketingListSharesResource);
  }

  /**
   * Returns the initialized Campaign Manager Service/API reference.
   *
   * @return {!CampaignManagerApi|!CampaignManagerService} The service/API
   */
  getCampaignManager() {
    return this.campaignManager_;
  }

  /**
   * Returns the CM360 account data.
   *
   * @return {{networkId: string, advertiserId: string}} The CM360 account data
   */
  getAccountData() {
    return this.accountData_;
  }

  /**
   * Returns the apiFirst boolean flag.
   *
   * @return {boolean} The apiFirst flag
   */
  isApiFirst() {
    return this.apiFirst_;
  }

}

