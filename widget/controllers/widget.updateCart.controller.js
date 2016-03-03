'use strict';

(function (angular) {
  angular
    .module('wooCommercePluginWidget')
    .controller('WidgetUpdateCartCtrl', ['$scope', 'DataStore', 'TAG_NAMES', 'WooCommerceSDK', '$sce', 'LAYOUTS', '$rootScope', 'PAGINATION', 'Buildfire', 'ViewStack',
      function ($scope, DataStore, TAG_NAMES, WooCommerceSDK, $sce, LAYOUTS, $rootScope, PAGINATION, Buildfire, ViewStack) {

        var WidgetUpdateCart = this;
        WidgetUpdateCart.listeners = {};
        WidgetUpdateCart.currentAddedItemInCart = {
          Variant: $rootScope.cartItemToUpdate
        };
        var currentView = ViewStack.getCurrentView();
        var currentStoreURL = "";

        WidgetUpdateCart.safeHtml = function (html) {
          if (html)
            return $sce.trustAsHtml(html);
        };

        var getProduct = function (storeURL, consumerKey, consumerSecret, id) {
          Buildfire.spinner.show();
          var success = function (result) {
              Buildfire.spinner.hide();
              console.log("===============================", result.data);
              WidgetUpdateCart.item = result.data.product;
            }
            , error = function (err) {
              Buildfire.spinner.hide();
              console.error('Error In Fetching Single product Details', err);
            };
          WooCommerceSDK.getProduct(storeURL, consumerKey, consumerSecret, id).then(success, error);
        };

        var init = function () {
          var success = function (result) {
              WidgetUpdateCart.data = result.data;
              if (!WidgetUpdateCart.data.design)
                WidgetUpdateCart.data.design = {};
              if (!WidgetUpdateCart.data.content)
                WidgetUpdateCart.data.content = {};
              if (!WidgetUpdateCart.data.settings)
                WidgetUpdateCart.data.settings = {};
              if (WidgetUpdateCart.data.content.storeURL) {
                currentStoreURL = WidgetUpdateCart.data.content.storeURL;
              }
              if (!WidgetUpdateCart.data.design.itemListLayout) {
                WidgetUpdateCart.data.design.itemListLayout = LAYOUTS.itemListLayout[0].name;
              }
              if (WidgetUpdateCart.data.content.storeURL && currentView.params.id)
                getProduct(WidgetUpdateCart.data.content.storeURL, WidgetUpdateCart.data.content.consumerKey, WidgetUpdateCart.data.content.consumerSecret, currentView.params.id);
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
                  WidgetUpdateCart.data = event.data;
                  if (!WidgetUpdateCart.data.design)
                    WidgetUpdateCart.data.design = {};
                  if (!WidgetUpdateCart.data.design.itemListLayout) {
                    WidgetUpdateCart.data.design.itemListLayout = LAYOUTS.itemListLayout[0].name;
                  }
                  if (!WidgetUpdateCart.data.content.storeURL) {
                    WidgetUpdateCart.item = null;
                    currentStoreURL = "";
                  }
                  if (!WidgetUpdateCart.data.content.storeURL)
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

        WidgetUpdateCart.updateVariant = function (variant) {
          WidgetUpdateCart.currentAddedItemInCart.Variant = variant || {};
          WidgetUpdateCart.currentAddedItemInCart.Variant.variantId = variant.id;
          WidgetUpdateCart.currentAddedItemInCart.Variant.variantNewId = variant.id;
          WidgetUpdateCart.currentAddedItemInCart.Variant.title = (variant.attributes && variant.attributes.length && variant.attributes[0].option) || variant.title;
          WidgetUpdateCart.currentAddedItemInCart.Variant.quantity = $rootScope.cartItemToUpdate.quantity;
          console.log("WidgetUpdateCart.currentAddedItemInCart.Variant", WidgetUpdateCart.currentAddedItemInCart.Variant)
        };

        WidgetUpdateCart.cancelClick = function () {
          ViewStack.pop();
        };

        WidgetUpdateCart.goToCart = function () {
          ViewStack.push({
            template: 'Shopping_Cart'
          });
        };


        WidgetUpdateCart.updateProductToCart = function () {
            var total_price = 0;
            var total_products = 0;
            $rootScope.cart.items.forEach(function (item, index) {
                if(item.id == $rootScope.cartItemToUpdate.variantId) {
                    $rootScope.cart.items[index] = WidgetUpdateCart.currentAddedItemInCart.Variant;
                    $rootScope.cart.items[index].product_title = item.product_title;
                    $rootScope.cart.items[index].variant_title = WidgetUpdateCart.currentAddedItemInCart.Variant.attributes && WidgetUpdateCart.currentAddedItemInCart.Variant.attributes.length && WidgetUpdateCart.currentAddedItemInCart.Variant.attributes[0].option;
                    $rootScope.cart.items[index].all_parent_variations = $rootScope.cartItemToUpdate.all_parent_variations;
                    $rootScope.cart.items[index].quantity = $rootScope.cartItemToUpdate.quantity;
                }
                total_products = total_products + $rootScope.cart.items[index].quantity;
                total_price = total_price + ($rootScope.cart.items[index].quantity * $rootScope.cart.items[index].price);
            });
            $rootScope.cart.total_price = total_price;
            $rootScope.cart.item_count = total_products;
            ViewStack.push({
              template: 'Shopping_Cart'
            });
        };

        $scope.$on("$destroy", function () {
          for (var i in WidgetUpdateCart.listeners) {
            if (WidgetUpdateCart.listeners.hasOwnProperty(i)) {
              WidgetUpdateCart.listeners[i]();
            }
          }
          DataStore.clearListener();
        });


        WidgetUpdateCart.listeners['POP'] = $rootScope.$on('BEFORE_POP', function (e, view) {
          console.log("SINGLE:", view.template, 'update_cart');
          if (view.template === 'Update_Cart_Item') {
            $scope.$destroy();
          }
        });
        init();
      }
    ])
})(window.angular);