'use strict';

(function (angular) {
  angular
    .module('wooCommercePluginWidget')
    .controller('WidgetCheckoutCtrl', ['$scope', 'DataStore', '$rootScope', 'Buildfire', 'ViewStack', '$sce',
      function ($scope, DataStore, $rootScope, Buildfire, ViewStack, $sce) {
        var WidgetCheckout = this;
        WidgetCheckout.listeners = {};
        WidgetCheckout.currentView = ViewStack.getCurrentView();
        if(WidgetCheckout.currentView.params) {
          Buildfire.spinner.hide();
          WidgetCheckout.url = WidgetCheckout.currentView.params.url;
        }

        WidgetCheckout.safeUrl = function (url) {
          if (url)
            return $sce.trustAsResourceUrl(url);
        };
      }
    ])
})(window.angular);