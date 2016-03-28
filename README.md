# woocommercePlugin

## 1. Architecture/Technology stacks:

The entire app would be built on Angularjs and BuildFire. Here in angularjs we will follow MVVM design pattern. BuildFire provide us multiple method by which we can fetch and update information on server. Methods included are 
* buildfire.messaging
* buildfire.datastore
* buildfire.imageLib
* buildfire.components
* buildfire.services
* buildfire.spinner

In addition of these we would explore some of the angularJs and jquery based. There are some animation need to perform on app. [Angular-Animate](https://docs.angularjs.org/api/ngAnimate) is the angularjs module that will help us on those animation. [Angular-Route](https://docs.angularjs.org/api/ngRoute/service/$route) is used to navigate to different view in app. [WooCommerce REST API](http://woothemes.github.io/woocommerce-rest-api-docs) allows WooCommerce data to be created, read, updated, and deleted using JSON format.

## 2. Standardization: 

**Lazy Loading:** We will use [ngInfiniteScroll](https://github.com/sroze/ngInfiniteScroll) for lazy loading. We will fetch 10 items on every single hit. 

**Caching:** Caching will be done by buildfire API mainly. It includes Image caching API buildfire.imageLib.

**Refreshing:** Refresh will be enabled for this plugin. 

**Styling:** UI Design will be done using [BuildFire-Style-Helper-Documentation](https://github.com/BuildFire/sdk/wiki/BuildFire-Style-Helper-Documentation). It has pre build style classes that we can use to improve UX of the plugin.

### 3. DataBase Model: 
Database model is not directly exposed to the user. BuildFire provides buildfire.datastore to fetch and update data on server. It is black box for user. Think of it like for every user there will be separate database. The database should be unique as appId,pluginId, instanceId, tag and obj. Here the composite key of appId and pluginId should be every single app.

Here for wooCommerce plugin there will be only one tag.
* wooCommerce
**{tagname: wooCommerceInfo}:**

```
{
   content: {
        "carouselImages": [],
        "description": '<p>&nbsp;<br></p>',
        "storeURL": "",
        "consumerKey": "",
        "consumerSecret": ""
   },
   design: {
       "sectionListLayout": "",
       "itemListLayout": "",
       "itemDetailsBgImage": ""
   },
   settings: {
        "currency": ""
   }
}

```