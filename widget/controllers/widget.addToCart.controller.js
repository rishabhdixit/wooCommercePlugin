'use strict';

(function (angular) {
  angular
    .module('wooCommercePluginWidget')
    .controller('WidgetAddToCartCtrl', ['$scope', 'DataStore', 'TAG_NAMES', 'WooCommerceSDK', '$sce', 'LAYOUTS', '$rootScope', 'PAGINATION', 'Buildfire', 'ViewStack',
      function ($scope, DataStore, TAG_NAMES, WooCommerceSDK, $sce, LAYOUTS, $rootScope, PAGINATION, Buildfire, ViewStack) {

        var WidgetAddToCart = this;
        WidgetAddToCart.listeners = {};
        WidgetAddToCart.quantity = 1;
        WidgetAddToCart.currentAddedItemInCart = {
          Variant: null
        };

        $rootScope.addedToCart = null;
        var currentView = ViewStack.getCurrentView();
        console.log("currentView", currentView);
        var currentStoreURL = "";


        WidgetAddToCart.safeHtml = function (html) {
          if (html)
            return $sce.trustAsHtml(html);
        };

        var getProduct = function (storeURL, consumerKey, consumerSecret, id) {
          Buildfire.spinner.show();
          var success = function (result) {
              Buildfire.spinner.hide();
              console.log("===============================OOOOO", result.data);
              WidgetAddToCart.item = result.data.product;
              if (WidgetAddToCart.item.variations.length) {
                WidgetAddToCart.currentAddedItemInCart = {
                  Variant: {
                    name: WidgetAddToCart.item && WidgetAddToCart.item.variations && WidgetAddToCart.item.variations.length > 0 && WidgetAddToCart.item.variations[0].attributes && WidgetAddToCart.item.variations[0].attributes.length > 0 && WidgetAddToCart.item.variations[0].attributes[0].name,
                    option: WidgetAddToCart.item && WidgetAddToCart.item.variations && WidgetAddToCart.item.variations.length > 0 && WidgetAddToCart.item.variations[0].attributes && WidgetAddToCart.item.variations[0].attributes.length > 0 && WidgetAddToCart.item.variations[0].attributes[0].option,
                    price: WidgetAddToCart.item && WidgetAddToCart.item.variations && WidgetAddToCart.item.variations.length > 0 && WidgetAddToCart.item.variations[0].price,
                    id: WidgetAddToCart.item && WidgetAddToCart.item.variations && WidgetAddToCart.item.variations.length > 0 && WidgetAddToCart.item.variations[0].id
                  }
                };
              }
              console.log("WidgetAddToCart", WidgetAddToCart)
            }
            , error = function (err) {
              Buildfire.spinner.hide();
              console.error('Error In Fetching Single product Details', err);
            };
          WooCommerceSDK.getProduct(storeURL, consumerKey, consumerSecret, id).then(success, error);
        };

        var init = function () {
          var success = function (result) {
              WidgetAddToCart.data = result.data;
              if (!WidgetAddToCart.data.design)
                WidgetAddToCart.data.design = {};
              if (!WidgetAddToCart.data.content)
                WidgetAddToCart.data.content = {};
              if (!WidgetAddToCart.data.settings)
                WidgetAddToCart.data.settings = {};
              if (WidgetAddToCart.data.content.storeURL) {
                currentStoreURL = WidgetAddToCart.data.content.storeURL;
              }
              if (!WidgetAddToCart.data.design.itemListLayout) {
                WidgetAddToCart.data.design.itemListLayout = LAYOUTS.itemListLayout[0].name;
              }
              if (WidgetAddToCart.data.content.storeURL && currentView.params.id)
                getProduct(WidgetAddToCart.data.content.storeURL, WidgetAddToCart.data.content.consumerKey, WidgetAddToCart.data.content.consumerSecret, currentView.params.id);
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
                  WidgetAddToCart.data = event.data;
                  if (!WidgetAddToCart.data.design)
                    WidgetAddToCart.data.design = {};
                  if (!WidgetAddToCart.data.design.itemListLayout) {
                    WidgetAddToCart.data.design.itemListLayout = LAYOUTS.itemListLayout[0].name;
                  }
                  if (!WidgetAddToCart.data.content.storeURL) {
                    WidgetAddToCart.item = null;
                    currentStoreURL = "";
                  }
                  if (!WidgetAddToCart.data.content.storeURL)
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

        WidgetAddToCart.selectVariant = function (variant) {
          WidgetAddToCart.currentAddedItemInCart.Variant = variant;
          WidgetAddToCart.currentAddedItemInCart.Variant.name = variant && variant.attributes && variant.attributes.length > 0 && variant.attributes[0].name;
          WidgetAddToCart.currentAddedItemInCart.Variant.option = variant && variant.attributes && variant.attributes.length > 0 && variant.attributes[0].option;
          WidgetAddToCart.currentAddedItemInCart.Variant.price = variant && variant.price;

        };

        WidgetAddToCart.proceedToCart = function (id) {
          var success = function (result) {
            console.log("****************************Success************", result);
            ViewStack.push({
              template: 'Shopping_Cart'
            });
          };

          var error = function (error) {
            console.log("****************************Error************", error);
          };
          /*ECommerceSDK.addItemInCart(WidgetAddToCart.data.content.storeURL,
            WidgetAddToCart.currentAddedItemInCart.Variant.id,
            WidgetAddToCart.quantity)
            .then(success, error);*/
        };

        WidgetAddToCart.cancelClick = function () {
          ViewStack.pop();
        };

        WidgetAddToCart.goToCart = function () {
          ViewStack.push({
            template: 'Shopping_Cart'
          });
        };

        $scope.$on("$destroy", function () {
          for (var i in WidgetAddToCart.listeners) {
            if (WidgetAddToCart.listeners.hasOwnProperty(i)) {
              WidgetAddToCart.listeners[i]();
            }
          }
          DataStore.clearListener();
        });

        WidgetAddToCart.listeners['CAROUSEL_LOADED'] = $rootScope.$on("Carousel3:LOADED", function () {
          WidgetAddToCart.view = null;
          if (!WidgetAddToCart.view) {
            WidgetAddToCart.view = new buildfire.components.carousel.view("#carousel3", [], "WideScreen");
          }
          if (WidgetAddToCart.item && WidgetAddToCart.item.images) {
            var imageArray = WidgetAddToCart.item.images.map(function (item) {
              return {iconUrl: item.src, title: ""};
            });
            WidgetAddToCart.view.loadItems(imageArray, null, "WideScreen");
          } else {
            WidgetAddToCart.view.loadItems([]);
          }
        });

        WidgetAddToCart.listeners['POP'] = $rootScope.$on('BEFORE_POP', function (e, view) {
          if (view.template === 'Add_To_Cart_1') {
            $scope.$destroy();
          }
        });

        WidgetAddToCart.listeners['CHANGED'] = $rootScope.$on('VIEW_CHANGED', function (e, type, view) {
          if (type === 'POP') {
            DataStore.onUpdate().then(null, null, onUpdateCallback);
          }
        });

        init();
      }
    ])
})(window.angular);