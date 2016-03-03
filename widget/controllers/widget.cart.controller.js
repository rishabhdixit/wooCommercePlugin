'use strict';

(function (angular) {
  angular
    .module('wooCommercePluginWidget')
    .controller('WidgetCartCtrl', ['$scope', 'DataStore', 'TAG_NAMES', 'WooCommerceSDK', '$sce', 'LAYOUTS', '$rootScope', 'Buildfire', 'ViewStack',
      function ($scope, DataStore, TAG_NAMES, WooCommerceSDK, $sce, LAYOUTS, $rootScope, Buildfire, ViewStack) {

        var WidgetCart = this;
        WidgetCart.listeners = {};
        var currentView = ViewStack.getCurrentView();
        var currentStoreURL = "";
        $rootScope.cartItemToUpdate = {};
        WidgetCart.safeHtml = function (html) {
          if (html)
            return $sce.trustAsHtml(html);
        };

        WidgetCart.removeItemFromCart = function (item) {
          var success = function (result) {
            var index = $rootScope.cart.items.indexOf(item);
            if (index != -1) {
              $rootScope.cart.items.splice(index, 1);
            }
            if ($rootScope.cart.item_count) {
              $rootScope.cart.item_count = $rootScope.cart.item_count - item.quantity;
            }
            if ($rootScope.cart.total_price) {
              $rootScope.cart.total_price = $rootScope.cart.total_price - (item.quantity * item.price);
            }
          };

          var error = function (error) {
            console.log("Error removing item from cart:", error);
          };

          ECommerceSDK.updateCartItem(WidgetCart.data.content.storeURL, item.variant_id, 0).then(success, error);
        };

        var getCart = function (storeURL) {
          /*Buildfire.spinner.show();
          var success = function (result) {
              Buildfire.spinner.hide();
              console.log("^^^^^^^^^^^^^^^^^^^^^^^", result);
              $rootScope.cart = result;
            }
            , error = function (err) {
              Buildfire.spinner.hide();
              console.error('Error In Fetching cart details', err);
            };
          ECommerceSDK.getCart(storeURL).then(success, error);*/
            var total_price = 0;
            var total_products = 0;
            $rootScope.cart.items.forEach(function (item) {
                total_products = total_products + item.quantity;
                total_price = total_price + (item.quantity * item.price);
            });
            $rootScope.cart.total_price = total_price;
            $rootScope.cart.item_count = total_products;
        };

        var init = function () {
          var success = function (result) {
              WidgetCart.data = result.data;
              if (!WidgetCart.data.design)
                WidgetCart.data.design = {};
              if (!WidgetCart.data.content)
                WidgetCart.data.content = {};
              if (!WidgetCart.data.settings)
                WidgetCart.data.settings = {};
              if (WidgetCart.data.content.storeURL) {
                currentStoreURL = WidgetCart.data.content.storeURL;
              }
              if (!WidgetCart.data.design.itemListLayout) {
                WidgetCart.data.design.itemListLayout = LAYOUTS.itemListLayout[0].name;
              }
              if (WidgetCart.data.content.storeURL)
                getCart(WidgetCart.data.content.storeURL);
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
                  WidgetCart.data = event.data;
                  if (!WidgetCart.data.design)
                    WidgetCart.data.design = {};
                  if (!WidgetCart.data.design.itemListLayout) {
                    WidgetCart.data.design.itemListLayout = LAYOUTS.itemListLayout[0].name;
                  }
                  if (!WidgetCart.data.content.storeURL) {
                    WidgetCart.item = null;
                    currentStoreURL = "";
                  }
                  if (!WidgetCart.data.content.storeURL)
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

        WidgetCart.updateCart = function(item){
          $rootScope.cartItemToUpdate={
            variantId : item.id,
            variant: item.variant_title || item.title,
            quantity: item.quantity,
            all_parent_variations: item.all_parent_variations,
            data: item
          };
          ViewStack.push({
            template: 'Update_Cart_Item',
            params: {
              id: item.id
            }
          });
        };

        WidgetCart.checkoutCart = function () {
          Buildfire.spinner.show();
          var success = function (result) {
              Buildfire.spinner.hide();
              console.log("#########################################", result);
              ViewStack.push({
                template: 'Checkout',
                params: {
                  url: result
                }
              });
            }
            , error = function (err) {
              Buildfire.spinner.hide();
              console.error('Error while cart checkout', JSON.parse(JSON.stringify(err)));
            };
          ECommerceSDK.checkoutCart(WidgetCart.data.content.storeURL).then(success, error);
        };

        $scope.$on("$destroy", function () {
          for (var i in WidgetCart.listeners) {
            if (WidgetCart.listeners.hasOwnProperty(i)) {
              WidgetCart.listeners[i]();
            }
          }
          DataStore.clearListener();
        });

        WidgetCart.listeners['POP'] = $rootScope.$on('BEFORE_POP', function (e, view) {
          console.log("SINGLE:", view.template, 'Shopping_Cart');

          if (view.template === 'Shopping_Cart') {
            $scope.$destroy();
          }
        });
        init();
      }
    ])
})(window.angular);