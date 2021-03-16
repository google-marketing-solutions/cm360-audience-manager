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
 * @fileoverview This Google Apps Script file directly accesses the
 * Campaign Manager API through the use of the built-in {@link UrlFetchApp}.
 *
 * @see appsscript.json for a list of enabled advanced services and API scopes.
 */


const API_SCOPE = 'dfareporting';
const API_VERSION = 'v3.4';

/**
 * @class CampaignManagerApi representing a REST wrapper for the the CM360 API.
 */
class CampaignManagerApi extends BaseApi {
  /**
   * @constructs an instance of CampaignManagerApi.
   *
   * @param {{cmNetwork: string, advertiserId: string}} accountData The CM360
   *     account data
   */
  constructor(accountData) {
    super(API_SCOPE, API_VERSION);

    /** @private @const {{cmNetwork: string, advertiserId: string}} */
    this.accountData_ = accountData;
  }

  /**
   * Retrieves all available CM360 User Profiles for the logged in user and
   * CM360 Network.
   *
   * @return {?Array<!Object>} The CM360 User Profiles array
   */
  getUserProfiles() {
    return this.executeApiRequest(
        /* requestUri= */ 'userprofiles',
        /* requestParams= */ {method: 'get'},
        /* retryOnFailure= */ true)['items'];
  }

  /**
   * Retrieves user defined variable configurations for the logged in user and
   * CM360 Network.
   *
   * @param {string} profileId The user profile ID
   * @return {!Array<!Object>} The user defined variable configuration array
   */
  getUserDefinedVariableConfigurations(profileId) {
    const path = `userprofiles/${profileId}/floodlightConfigurations/` +
        this.getAccountData().advertiserId;

    return this.executeApiRequest(
        /* requestUri= */ path,
        /* requestParams= */ {method: 'get'},
        /* retryOnFailure= */ true)['userDefinedVariableConfigurations'];
  }

  /**
   * Retrieves configured floodlight activities from the logged in user's
   * CM360 Network and Advertiser.
   *
   * @param {string} profileId The user profile ID
   * @return {!Array<!Object>} The floodlight activities array
   */
  getFloodlightActivities(profileId) {
    const path = `userprofiles/${profileId}/floodlightActivities` +
        `?advertiserId=${this.getAccountData().advertiserId}`;

    return this.executeApiRequest(
        /* requestUri= */ path,
        /* requestParams= */ {method: 'get'},
        /* retryOnFailure= */ true)['floodlightActivities'];
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
   */
  getAdvertisers(profileId, maxResultsPerPage, callback) {
    const path = `userprofiles/${profileId}/advertisers?sortField=Name` +
        `&maxResults=${maxResultsPerPage}`;

    this.executePagedApiRequest(
        /* requestUri= */ path,
        /* requestParams= */ {method: 'get'},
        /* requestCallback= */ callback);
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

