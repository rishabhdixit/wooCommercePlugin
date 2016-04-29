'use strict';

(function (angular, buildfire) {
  angular
    .module('wooCommercePluginWidget')
    .controller('WidgetSingleCtrl', ['$scope', 'DataStore', 'TAG_NAMES', 'WooCommerceSDK', '$sce', 'LAYOUTS', '$rootScope', 'Buildfire', 'ViewStack',
      function ($scope, DataStore, TAG_NAMES, WooCommerceSDK, $sce, LAYOUTS, $rootScope, Buildfire, ViewStack) {
        var WidgetSingle = this;
        var breadCrumbFlag = true;
        WidgetSingle.listeners = {};
        WidgetSingle.data = null;
        WidgetSingle.item = null;
        //create new instance of buildfire carousel viewer
        WidgetSingle.view = null;

          buildfire.history.get('pluginBreadcrumbsOnly', function (err, result) {
              if(result && result.length) {
                  result.forEach(function(breadCrumb) {
                      if(breadCrumb.label == 'Item') {
                          breadCrumbFlag = false;
                      }
                  });
              }
              if(breadCrumbFlag) {
                  buildfire.history.push('Item', { elementToShow: 'Item' });
              }
          });

        WidgetSingle.safeHtml = function (html) {
            return $sce.trustAsHtml(html) || "";
        };

        WidgetSingle.test = function (target) {
          if(target) {
            buildfire.navigation.openWindow(target);
          }
        };

        var currentView = ViewStack.getCurrentView();

        var currentStoreURL = "";

        var currentCurrency = "";

        var getProduct = function (storeURL, consumerKey, consumerSecret, id) {
          Buildfire.spinner.show();
          var success = function (result) {
              Buildfire.spinner.hide();
              console.log("===============================", result.data);
              WidgetSingle.item = result.data.product;
            }
            , error = function (err) {
              Buildfire.spinner.hide();
              console.error('Error In Fetching Single product Details', err);
            };
          WooCommerceSDK.getProduct(storeURL, consumerKey, consumerSecret, id).then(success, error);
        };

        /*
         * Fetch user's data from datastore
         */

        WidgetSingle.addToCart = function (id) {
          ViewStack.push({
            template: 'Add_To_Cart_1',
            params: {
              id: id
            }
          });
        };

        WidgetSingle.goToCart = function () {
            /*ViewStack.push({
                template: 'Checkout',
                params: {
                    url: WidgetSingle.data.content.storeURL + '/cart'
                }
            });*/
            if (WidgetSingle.data && WidgetSingle.data.content && WidgetSingle.data.content.storeURL)
                buildfire.navigation.openWindow(WidgetSingle.data.content.storeURL + '/cart', "_system");
        };

        var init = function () {
          var success = function (result) {
              WidgetSingle.data = result.data;
              if (!WidgetSingle.data.design)
                WidgetSingle.data.design = {};
              if (!WidgetSingle.data.content)
                WidgetSingle.data.content = {};
              if (!WidgetSingle.data.settings)
                WidgetSingle.data.settings = {};
              if (WidgetSingle.data.content.storeURL) {
                currentStoreURL = WidgetSingle.data.content.storeURL;
              }
              if (!WidgetSingle.data.design.itemListLayout) {
                WidgetSingle.data.design.itemListLayout = LAYOUTS.itemListLayout[0].name;
              }
              if (WidgetSingle.data.settings.currency)
                currentCurrency = WidgetSingle.data.settings.currency;
              if (WidgetSingle.data.content.storeURL && currentView.params.id)
                getProduct(WidgetSingle.data.content.storeURL, WidgetSingle.data.content.consumerKey, WidgetSingle.data.content.consumerSecret, currentView.params.id);
            }
            , error = function (err) {
              console.error('Error while getting data', err);
            };
          DataStore.get(TAG_NAMES.WOOCOMMERCE_INFO).then(success, error);
        };

        var onUpdateCallback = function (event) {
          setTimeout(function () {
            if (event && event.tag) {
              switch (event.tag) {
                case TAG_NAMES.WOOCOMMERCE_INFO:
                  WidgetSingle.data = event.data;
                  if (!WidgetSingle.data.design)
                    WidgetSingle.data.design = {};
                  if (!WidgetSingle.data.design.itemListLayout) {
                    WidgetSingle.data.design.itemListLayout = LAYOUTS.itemListLayout[0].name;
                  }
                  if (!WidgetSingle.data.content.storeURL) {
                    WidgetSingle.item = null;
                    currentStoreURL = "";
                  }
                  if (WidgetSingle.data.content.storeURL && currentStoreURL != WidgetSingle.data.content.storeURL) {
                    WidgetSingle.item = null;
                    getProduct(WidgetSingle.data.content.storeURL, WidgetSingle.data.content.consumerKey, WidgetSingle.data.content.consumerSecret, currentView.params.id);
                  }
                  if (!WidgetSingle.data.content.storeURL)
                    ViewStack.popAllViews();
                  break;
              }
              $scope.$digest();
            }
          }, 0);
        };

        /**
         * DataStore.onUpdate() is bound to listen any changes in datastore
         */
        DataStore.onUpdate().then(null, null, onUpdateCallback);

        $scope.$on("$destroy", function () {
          for (var i in WidgetSingle.listeners) {
            if (WidgetSingle.listeners.hasOwnProperty(i)) {
              WidgetSingle.listeners[i]();
            }
          }
          DataStore.clearListener();
        });

        WidgetSingle.listeners['CAROUSEL_LOADED'] = $rootScope.$on("Carousel2:LOADED", function () {
          WidgetSingle.view = null;
          if (!WidgetSingle.view) {
            WidgetSingle.view = new buildfire.components.carousel.view("#carousel2", [], "WideScreen");
          }
          if (WidgetSingle.item && WidgetSingle.item.images) {
            var imageArray = WidgetSingle.item.images.map(function (item) {
              return {iconUrl: item.src, title: ""};
            });
            WidgetSingle.view.loadItems(imageArray, null, "WideScreen");
          } else {
            WidgetSingle.view.loadItems([]);
          }
        });

        WidgetSingle.listeners['POP'] = $rootScope.$on('BEFORE_POP', function (e, view) {
          if (view.template === 'Item_Details') {
            $scope.$destroy();
          }
        });

        WidgetSingle.listeners['CHANGED'] = $rootScope.$on('VIEW_CHANGED', function (e, type, view) {
          if (type === 'POP') {
            DataStore.onUpdate().then(null, null, onUpdateCallback);
          }
        });

        init();
      }]);
})(window.angular, window.buildfire);