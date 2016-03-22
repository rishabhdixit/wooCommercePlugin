'use strict';

(function (angular) {
    angular
        .module('wooCommercePluginContent')
        .controller('ContentHomeCtrl', ['$scope', 'Buildfire', 'DataStore', 'WooCommerceSDK', 'TAG_NAMES', 'STATUS_CODE', '$timeout', 'LAYOUTS',
            function ($scope, Buildfire, DataStore, WooCommerceSDK, TAG_NAMES, STATUS_CODE, $timeout, LAYOUTS) {
                var _data = {
                    "content": {
                        "carouselImages": [],
                        "description": '<p>&nbsp;<br></p>',
                        "storeURL": "",
                        "consumerKey": "",
                        "consumerSecret": ""
                    },
                    "design": {
                        "sectionListLayout": LAYOUTS.sectionListLayout[0].name,
                        "itemListLayout": LAYOUTS.itemListLayout[0].name,
                        "itemDetailsBgImage": ""
                    }
                };
                var ContentHome = this;
                ContentHome.masterData = null;
                ContentHome.bodyWYSIWYGOptions = {
                    plugins: 'advlist autolink link image lists charmap print preview',
                    skin: 'lightgray',
                    trusted: true,
                    theme: 'modern'
                };
                ContentHome.storeVerifySuccess = false;
                ContentHome.storeVerifyFailure = false;

                // create a new instance of the buildfire carousel editor
                var editor = new Buildfire.components.carousel.editor("#carousel");
                // this method will be called when a new item added to the list
                editor.onAddItems = function (items) {
                    if (!ContentHome.data.content)
                        ContentHome.data.content = {};
                    if (!ContentHome.data.content.carouselImages)
                        ContentHome.data.content.carouselImages = [];
                    ContentHome.data.content.carouselImages.push.apply(ContentHome.data.content.carouselImages, items);
                    $scope.$digest();
                };
                // this method will be called when an item deleted from the list
                editor.onDeleteItem = function (item, index) {
                    ContentHome.data.content.carouselImages.splice(index, 1);
                    $scope.$digest();
                };
                // this method will be called when you edit item details
                editor.onItemChange = function (item, index) {
                    ContentHome.data.content.carouselImages.splice(index, 1, item);
                    $scope.$digest();
                };
                // this method will be called when you change the order of items
                editor.onOrderChange = function (item, oldIndex, newIndex) {
                    var temp = ContentHome.data.content.carouselImages[oldIndex];
                    ContentHome.data.content.carouselImages[oldIndex] = ContentHome.data.content.carouselImages[newIndex];
                    ContentHome.data.content.carouselImages[newIndex] = temp;
                    $scope.$digest();
                };

                /*
                 * Method to check if given store name is a valid shopify store name
                 * */
                ContentHome.verifyStore = function () {
                    var success = function (result) {
                            if (result && result.status != 500) {
                                ContentHome.storeVerifySuccess = true;
                                $timeout(function () {
                                    ContentHome.storeVerifySuccess = false;
                                }, 3000);
                                ContentHome.storeVerifyFailure = false;
                                ContentHome.data.content.storeURL = ContentHome.storeURL || ContentHome.data.content.storeURL;
                                ContentHome.data.content.consumerKey = ContentHome.consumerKey || ContentHome.data.content.consumerKey;
                                ContentHome.data.content.consumerSecret = ContentHome.consumerSecret || ContentHome.data.content.consumerSecret;
                            }
                            else {
                                ContentHome.storeVerifyFailure = true;
                                $timeout(function () {
                                    ContentHome.storeVerifyFailure = false;
                                }, 3000);
                                ContentHome.storeVerifySuccess = false;
                            }
                        }
                        , error = function (err) {
                            ContentHome.storeVerifyFailure = true;
                            $timeout(function () {
                                ContentHome.storeVerifyFailure = false;
                            }, 3000);
                            ContentHome.storeVerifySuccess = false;
                            console.error('Error In Fetching store details', err);
                        };
                    WooCommerceSDK.validateStore(ContentHome.storeURL, ContentHome.consumerKey, ContentHome.consumerSecret).then(success, error);

                };

                ContentHome.gotToWooCommerce = function () {
                    window.open('https://docs.woothemes.com/document/woocommerce-rest-api/#section-3', '_blank');
                };

                /*
                 * Method to remove store name in case user clears the field
                 * */

                ContentHome.clearData = function () {
                    if (!ContentHome.storeURL) {
                        ContentHome.data.content.storeURL = null;
                    }
                    if (!ContentHome.consumerKey) {
                        ContentHome.data.content.consumerKey = null;
                    }
                    if (!ContentHome.consumerSecret) {
                        ContentHome.data.content.consumerSecret = null;
                    }
                };

                updateMasterItem(_data);

                function updateMasterItem(data) {
                    ContentHome.masterData = angular.copy(data);
                }

                function isUnchanged(data) {
                    return angular.equals(data, ContentHome.masterData);
                }

                /*
                 * Go pull any previously saved data
                 * */
                var init = function () {
                    var success = function (result) {
                            console.info('init success result:', result);
                            if (result && result.data) {
                                ContentHome.data = result.data;
                                if (!ContentHome.data.content)
                                    ContentHome.data.content = {};
                                if (!ContentHome.data.content.carouselImages)
                                    editor.loadItems([]);
                                else
                                    editor.loadItems(ContentHome.data.content.carouselImages);
                                if (ContentHome.data.content.storeURL)
                                    ContentHome.storeURL = ContentHome.data.content.storeURL;
                                if (ContentHome.data.content.consumerKey)
                                    ContentHome.consumerKey = ContentHome.data.content.consumerKey;
                                if (ContentHome.data.content.consumerSecret) {
                                    ContentHome.consumerSecret = ContentHome.data.content.consumerSecret;
                                }
                                updateMasterItem(ContentHome.data);
                                if (tmrDelay)clearTimeout(tmrDelay);
                            } else {
                                ContentHome.data = angular.copy(_data);
                            }
                        }
                        , error = function (err) {
                            if (err && err.code !== STATUS_CODE.NOT_FOUND) {
                                console.error('Error while getting data', err);
                                if (tmrDelay)clearTimeout(tmrDelay);
                            }
                        };
                    DataStore.get(TAG_NAMES.WOOCOMMERCE_INFO).then(success, error);
                };


                /*
                 * Call the datastore to save the data object
                 */
                var saveData = function (newObj, tag) {
                    if (typeof newObj === 'undefined') {
                        return;
                    }
                    var success = function (result) {
                            console.info('Saved data result: ', result);
                            updateMasterItem(newObj);
                        }
                        , error = function (err) {
                            console.error('Error while saving data : ', err);
                        };
                    DataStore.save(newObj, tag).then(success, error);
                };


                /*
                 * create an artificial delay so api isnt called on every character entered
                 * */
                var tmrDelay = null;

                var saveDataWithDelay = function (newObj) {
                    if (newObj) {
                        if (isUnchanged(newObj)) {
                            return;
                        }
                        if (tmrDelay) {
                            clearTimeout(tmrDelay);
                        }
                        tmrDelay = setTimeout(function () {
                            saveData(JSON.parse(angular.toJson(newObj)), TAG_NAMES.WOOCOMMERCE_INFO);
                        }, 500);
                    }
                };

                /*
                 * watch for changes in data and trigger the saveDataWithDelay function on change
                 * */
                $scope.$watch(function () {
                    return ContentHome.data;
                }, saveDataWithDelay, true);

                init();

            }]);
})(window.angular);
