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
 * @fileoverview This file contains tests for UriUtil.
 */

import { UriUtil } from '../../src/util/uri';

describe('UriUtil', () => {
  describe('method', () => {
    describe('extend', () => {
      it('returns extension if original is null', () => {
        const extension = {};

        const result = UriUtil.extend(null, extension);

        expect(result).toEqual(extension);
      });

      it('returns original with extensions if empty and non-type', () => {
        const original = {};
        const extension = { hello: 'world' };

        const result = UriUtil.extend(original, extension);

        expect(result).toEqual(extension);
      });

      it('returns original with extensions if empty, preserving type', () => {
        class TestObj extends Object {
          constructor() {
            super();
          }
        }
        const original = new TestObj() as Record<string, unknown>;
        const extension = { hello: 'world' };
        const expectation = new TestObj() as Record<string, unknown>;
        expectation['hello'] = 'world';

        const result = UriUtil.extend(original, extension);

        expect(result).toEqual(expectation);
        expect(result instanceof TestObj).toBe(true);
      });

      it('extends original with extension, overwrites existing keys', () => {
        const original = { hello: 'world' };
        const extension = { how: 'dy', hello: 'space' };
        const expectation = { hello: 'space', how: 'dy' };

        const result = UriUtil.extend(original, extension);

        expect(result).toEqual(expectation);
      });

      it('extends original array', () => {
        const original = { hello: 'world', goodbye: ['a', 'b'] };
        const extension = { hello: 'space', goodbye: ['c'] };
        const expectation = { hello: 'space', goodbye: ['a', 'b', 'c'] };

        const result = UriUtil.extend(original, extension);

        expect(result).toEqual(expectation);
      });

      it('sets original array if not existing', () => {
        const original = { hello: 'world' };
        const extension = { hello: 'space', goodbye: ['c'] };
        const expectation = { hello: 'space', goodbye: ['c'] };

        const result = UriUtil.extend(original, extension);

        expect(result).toEqual(expectation);
      });
    });

    describe('modifyUrlQueryString', () => {
      it('replaces key if exists', () => {
        const result = UriUtil.modifyUrlQueryString('url?a=b&c=d', 'a', 'a');
        expect(result).toEqual('url?a=a&c=d');
      });

      it('appends key if not exists, no other params', () => {
        const result = UriUtil.modifyUrlQueryString('url', 'a', 'b');
        expect(result).toEqual('url?a=b');
      });

      it('appends key if not exists, with other params', () => {
        const result = UriUtil.modifyUrlQueryString('url?a=b', 'c', 'd');
        expect(result).toEqual('url?a=b&c=d');
      });
    });
  });
});
