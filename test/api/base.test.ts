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
 * @fileoverview This file contains tests for BaseApi.
 */

import { BaseApi } from '../../src/api/base';
import { UriUtil } from '../../src/util/uri';

global.ScriptApp = {
  getOAuthToken: () => 'OAuthToken',
} as typeof ScriptApp;

global.UrlFetchApp = {
  fetch: () => ({
    getResponseCode: () => 200,
    getContentText: () => '1',
  }),
} as unknown as typeof UrlFetchApp;

describe('BaseApi', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('instantiates correctly', () => {
    const baseApi = new BaseApi('123', '456');

    expect(baseApi.getApiScope()).toEqual('123');
    expect(baseApi.getApiVersion()).toEqual('456');
  });

  describe('method', () => {
    const baseApi = new BaseApi('scope', 'v1');

    describe('executeApiPagedRequest', () => {
      const callback = () => 'hello';

      it('executes once if no pages', () => {
        jest.spyOn(baseApi, 'buildApiParams').mockReturnValue({});
        jest.spyOn(baseApi, 'buildApiUrl').mockReturnValue('url');
        jest.spyOn(baseApi, 'executeApiRequest').mockReturnValue({});
        jest.spyOn(baseApi, 'handleResponse');
        //jest.spyOn(console, 'log');

        baseApi.executePagedApiRequest('url', {}, callback);

        //expect(console.log).toHaveBeenCalledTimes(1);
        expect(baseApi.handleResponse).toHaveBeenCalledWith({}, callback);
      });

      it('executes once per page', () => {
        jest.spyOn(baseApi, 'buildApiParams').mockReturnValue({});
        jest.spyOn(baseApi, 'buildApiUrl');
        jest.spyOn(baseApi, 'executeApiRequest').mockReset().mockReturnValue({
          nextPageToken: 't',
        });
        jest.spyOn(baseApi, 'handleResponse');
        jest.spyOn(UriUtil, 'modifyUrlQueryString');

        baseApi.executePagedApiRequest('url?a=1', {}, callback, 2);

        expect(baseApi.buildApiUrl).toHaveBeenCalledWith('url?a=1');
        expect(baseApi.handleResponse).toHaveBeenCalledTimes(2);
        expect(UriUtil.modifyUrlQueryString).toHaveBeenCalledTimes(2);
        expect(baseApi.executeApiRequest).toHaveBeenCalledWith(
          'https://www.googleapis.com/scope/v1/url?a=1',
          {},
          true
        );
        expect(baseApi.executeApiRequest).toHaveBeenCalledWith(
          'https://www.googleapis.com/scope/v1/url?a=1&pageToken=t',
          {},
          true
        );
      });
    });

    describe('executeApiRequest', () => {
      it('throws Error for failure response when not retriable', () => {
        jest.spyOn(baseApi, 'buildApiUrl').mockReturnValue('url');
        jest.spyOn(baseApi, 'buildApiParams').mockReturnValue({});
        jest.spyOn(console, 'error');

        jest.spyOn(UrlFetchApp, 'fetch').mockImplementation(() => {
          throw new Error('test 404 error');
        });

        expect(() => void baseApi.executeApiRequest('url', {}, false)).toThrow(
          new Error(`test 404 error`)
        );
        expect(console.error).toHaveBeenCalledTimes(1);
      });

      it('retries 3 times for failure response when retriable', () => {
        jest.spyOn(baseApi, 'buildApiUrl').mockReturnValue('url');
        jest.spyOn(baseApi, 'buildApiParams').mockReturnValue({});
        jest.spyOn(baseApi, 'refreshAuthToken');
        jest.spyOn(baseApi, 'executeApiRequest');
        jest.spyOn(console, 'log');
        jest.spyOn(console, 'error');
        jest.spyOn(console, 'info');
        jest.spyOn(console, 'warn');

        jest.spyOn(UrlFetchApp, 'fetch').mockImplementation(() => {
          throw new Error('test 404 error');
        });

        expect(() => void baseApi.executeApiRequest('url', {}, true)).toThrow(
          new Error('test 404 error')
        );
        expect(console.error).toHaveBeenCalledTimes(4);
        expect(UrlFetchApp.fetch).toHaveBeenCalledTimes(4);
        expect(console.info).toHaveBeenCalledTimes(3);
        expect(baseApi.refreshAuthToken).toHaveBeenCalledTimes(3);
        expect(baseApi.executeApiRequest).toHaveBeenCalledWith('url', {}, true);
        expect(baseApi.executeApiRequest).toHaveBeenCalledWith(
          'url',
          { headers: { Authorization: 'Bearer OAuthToken' } },
          true,
          1
        );
        expect(baseApi.executeApiRequest).toHaveBeenCalledWith(
          'url',
          { headers: { Authorization: 'Bearer OAuthToken' } },
          true,
          2
        );
        expect(console.warn).toHaveBeenCalledTimes(1);
      });

      it('returns valid response for success status', () => {
        jest.spyOn(baseApi, 'buildApiUrl').mockReturnValue('url');
        jest.spyOn(baseApi, 'buildApiParams').mockReturnValue({});

        const returnValue = { hello: 'world' };

        const successResponse = {
          getResponseCode: () => 200,
          getContentText: () => JSON.stringify(returnValue),
        } as unknown as GoogleAppsScript.URL_Fetch.HTTPResponse;

        jest.spyOn(UrlFetchApp, 'fetch').mockReturnValue(successResponse);
        jest.spyOn(JSON, 'parse').mockReturnValue(returnValue);

        const result = baseApi.executeApiRequest('url', {}, false);

        expect(result).toEqual(returnValue);
      });
    });

    describe('buildApiUrl', () => {
      it('builds API correctly', () => {
        const url = baseApi.buildApiUrl('hello');

        expect(url).toEqual('https://www.googleapis.com/scope/v1/hello');
      });

      it('does not rebuild API', () => {
        let url = baseApi.buildApiUrl('test');
        url = baseApi.buildApiUrl(url);

        expect(url).toEqual('https://www.googleapis.com/scope/v1/test');
      });
    });

    describe('buildApiParams', () => {
      it('builds API params correctly', () => {
        jest.spyOn(ScriptApp, 'getOAuthToken').mockReturnValue('token');
        const expectation = {
          contentType: 'application/json',
          headers: {
            Authorization: `Bearer token`,
            Accept: 'application/json',
          },
        };
        const result = baseApi.buildApiParams({});

        expect(result).toEqual(expectation);
      });
    });

    describe('objectToUrlQuery', () => {
      it('builds the correct query string', () => {
        const params = {
          one: 1,
          two: 2,
          three: [4, 5],
        };
        const expectation = '?one=1&two=2&three=4&three=5';
        const queryString = baseApi.objectToUrlQuery('', params);

        expect(queryString).toEqual(expectation);
      });

      it('builds the correct query string for URL with existing parameters', () => {
        const params = {
          one: 1,
          two: 2,
          three: [4, 5],
        };
        const expectation = '&one=1&two=2&three=4&three=5';
        const queryString = baseApi.objectToUrlQuery(
          'https://example.com?zero=0',
          params
        );

        expect(queryString).toEqual(expectation);
      });
    });

    describe('refreshAuthToken', () => {
      it('modifies token in provided object', () => {
        jest.spyOn(ScriptApp, 'getOAuthToken').mockReturnValue('token2');
        const params = {
          contentType: 'application/json',
          headers: {
            Authorization: `Bearer token`,
            Accept: 'application/json',
          },
        };
        const expectation = {
          contentType: 'application/json',
          headers: {
            Authorization: `Bearer token2`,
            Accept: 'application/json',
          },
        };
        baseApi.refreshAuthToken(params);

        expect(params).toEqual(expectation);
      });
    });
  });
});
