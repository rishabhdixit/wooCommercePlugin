'use strict';

(function (angular) {
  angular
    .module('wooCommercePluginWidget')
    .controller('WidgetCartCtrl', ['$scope', 'DataStore', 'TAG_NAMES', 'WooCommerceSDK', '$sce', 'LAYOUTS', '$rootScope', 'Buildfire', 'ViewStack',
      function ($scope, DataStore, TAG_NAMES, WooCommerceSDK, $sce, LAYOUTS, $rootScope, Buildfire, ViewStack) {

        var WidgetCart = this;
        var breadCrumbFlag = true;
        WidgetCart.listeners = {};
        var currentView = ViewStack.getCurrentView();
        var currentStoreURL = "";
        $rootScope.cartItemToUpdate = {};

          buildfire.history.get('pluginBreadcrumbsOnly', function (err, result) {
              if(result && result.length) {
                  result.forEach(function(breadCrumb) {
                      if(breadCrumb.label == 'Cart') {
                          breadCrumbFlag = false;
                      }
                  });
              }
              if(breadCrumbFlag) {
                  buildfire.history.push('Cart', { elementToShow: 'Cart' });
              }
          });

        WidgetCart.safeHtml = function (html) {
          if (html)
            return $sce.trustAsHtml(html);
        };

        WidgetCart.removeItemFromCart = function (item) {
          $rootScope.cart.items.forEach(function (cartItem, index) {
              if(cartItem.id == item.id) {
                  $rootScope.cart.items.splice(index, 1);
              }
          })
        };

        var getCart = function (storeURL) {
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