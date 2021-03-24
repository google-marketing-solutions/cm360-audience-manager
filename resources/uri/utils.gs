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
 * @fileoverview This file contains URI utility methods.
 */


/**
 * @class UriUtil representing a utility class for URI functionality
 */
class UriUtil {

  /**
   * Extends an object identified by 'original' with the values in 'extension'.
   * Array values in 'extension' will be appended to existing arrays
   * in 'original', however all other objects in 'extension' will override
   * existing counterparts in 'original'. The type of 'original' will be
   * preserved (if it wasn't null or undefined).
   *
   * @param {?Object} original The original object to extend, which may be null
   * @param {!Object} extension The value to use for extending
   * @return {!Object} The extended object
   */
  static extend(original, extension) {
    if (original == null) {
      return extension;
    }
    for (const key in extension) {
      if (extension.hasOwnProperty(key)) {
        if (extension[key] instanceof Array && original[key] instanceof Array) {
          extension[key].forEach((element) => original[key].push(element));
        } else {
          original[key] = extension[key];
        }
      }
    }
    return original;
  }

  /**
   * Modifies a url by either appending the 'key' and 'value' to the end of the
   * url if the 'key' was not present or replacing the value of the 'key' if it
   * existed.
   *
   * @param {string} url The url to modify
   * @param {string} key The key to check if present
   * @param {string} value The value to append / modify
   * @return {string} The modified url
   */
  static modifyUrlQueryString(url, key, value) {
    let modifiedUrl;

    if (url.includes(`${key}=`)) {
      const regExp = new RegExp(`${key}=[^&]*`, 'g');
      modifiedUrl = url.replace(regExp, `${key}=` + value);
    } else {
      const separator = url.indexOf('?') !== -1 ? '&' : '?';
      modifiedUrl = url + `${separator}${key}=${value}`;
    }
    return modifiedUrl;
  }

}

