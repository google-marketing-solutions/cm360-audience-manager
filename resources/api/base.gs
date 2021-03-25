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
 * @fileoverview This file contains base functionality to access any Google API
 * using the built-in Google Apps Script service {@link UrlFetchApp}.
 *
 * @see appsscript.json for a list of enabled advanced services and API scopes.
 */


/**
 * @class BaseApi representing an abstraction over API access with
 * {@link UrlFetchApp}.
 */
class BaseApi {
  /**
   * @constructs an instance of BaseApi.
   *
   * @param {string} apiScope The API scope
   * @param {string} apiVersion The API version
   */
  constructor(apiScope, apiVersion) {
    /** @private @const {string} */
    this.apiScope_ = apiScope;

    /** @private @const {string} */
    this.apiVersion_ = apiVersion;
  }

  /**
   * Executes a paged API request (i.e. GET with pageToken). Keeps track of
   * paged responses and delegates to @link {executeApiRequest} for the concrete
   * request and response handling. Accepts an optional callback which can be
   * used to output intermediate results while fetching more pages.
   *
   * @param {string} requestUri The URI of the GET request
   * @param {?Object} requestParams The options to use for the GET request
   * @param {function(!Object): undefined} requestCallback The method to call
   *     after the request has executed successfully
   * @param {number=} maxPages The max number of pages to fetch. Defaults to -1
   *     indicating 'fetch all'
   */
  executePagedApiRequest(
      requestUri, requestParams, requestCallback, maxPages = -1) {
    let url = this.buildApiUrl(requestUri);
    let pageCount = 1;
    let pageToken;

    do {
      const result = this.executeApiRequest(url, requestParams, true);
      console.log(`Output results page: ${pageCount}`);
      this.handleResponse(result, requestCallback);

      pageToken = result.nextPageToken;

      if (pageToken) {
        url = UriUtil.modifyUrlQueryString(url, 'pageToken', pageToken);
      }
      pageCount++;
    } while (pageToken && (maxPages < 0 || pageCount <= maxPages));
  }

  /**
   * Executes a request to the API while handling errors and response
   * data parsing. Re-attempts failed executions up to the value of
   * 'maxRetries'.
   *
   * @param {string} requestUri The URI of the request
   * @param {?Object} requestParams The options to use for the request
   * @param {boolean} retryOnFailure Whether the operation should be retried
   *     in case of failure or not
   * @param {number=} operationCount The number of failed attempts made.
   * @return {!Object} The parsed JSON response data, or an empty object for
   *     empty responses
   */
  executeApiRequest(
      requestUri, requestParams, retryOnFailure, operationCount = 0) {
    const url = this.buildApiUrl(requestUri);
    const params = this.buildApiParams(requestParams);
    const maxRetries = 3;

    try {
      console.log(`Fetching url=${url} with params=${JSON.stringify(params)}`);
      const response = UrlFetchApp.fetch(url, params);
      const result = response.getContentText() ?
          JSON.parse(response.getContentText()) : {};
      return result;
    } catch (e) {
      console.error(`Operation failed with exception: ${e}`);

      if (retryOnFailure && operationCount < maxRetries) {
        console.info(`Retrying operation for a max of ${maxRetries} times...`);
        this.refreshAuthToken(params);
        operationCount++;
        this.executeApiRequest(url, params, retryOnFailure, operationCount);
      } else {
        console.warn(
            'Retry on failure not supported or all retries ' +
            'have been exhausted... Failing!');
        throw new Error(e.message);
      }
    }
  }

  /**
   * Constructs the fully-qualified API URL using the given requestUri if not
   * already done.
   *
   * @param {string} requestUri The URI of the request
   * @return {string} The fully-qualified API URL
   */
  buildApiUrl(requestUri) {
    const protocolAndDomain = 'https://www.googleapis.com/';

    if (requestUri.startsWith(protocolAndDomain)) {
      return requestUri;
    }
    return protocolAndDomain +
        `${this.apiScope_}/${this.apiVersion_}/${requestUri}`;
  }

  /**
   * Constructs the options to use for API requests, extending default options
   * provided by the given requestParams.
   *
   * @param {?Object} requestParams The options to use for the request
   * @return {!Object} The extended request options to use
   */
  buildApiParams(requestParams) {
    const token = ScriptApp.getOAuthToken();
    const baseParams = {
      'contentType': 'application/json',
      'headers':
          {'Authorization': `Bearer ${token}`, 'Accept': 'application/json'},
    };
    const params = UriUtil.extend(baseParams, requestParams || {});

    return params;
  }

  /**
   * Refreshes the OAuth2 client token used for authentication by fetching it
   * from the underlying @link {ScriptApp} and modifying the given params of the
   * request directly (i.e. there is no return value for this method).
   *
   * @param {!Object} params The options to use for the request
   */
  refreshAuthToken(params) {
    const token = ScriptApp.getOAuthToken();
    params['headers']['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Wrapper method for triggering the given callback method, passing in
   * callbackParams along with the parsed API response.
   *
   * @param {!Object} response The parsed API response data
   * @param {function(!Object): undefined} callback The method to trigger
   */
  handleResponse(response, callback) {
    callback(response);
  }

  /**
   * Returns the API scope.
   *
   * @return {string} The API scope
   */
  getApiScope() {
    return this.apiScope_;
  }

  /**
   * Returns the API version.
   *
   * @return {string} The API version
   */
  getApiVersion() {
    return this.apiVersion_;
  }

}

