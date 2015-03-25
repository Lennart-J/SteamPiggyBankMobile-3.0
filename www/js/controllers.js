'use strict';
angular.module('SteamPiggyBank.controllers', ['ngAnimate', 'ngCordova'])

.controller('IntroCtrl', function($scope, $rootScope, requestService, filterService, $state, $http, $q, $ionicPopover, $ionicScrollDelegate, $ionicSideMenuDelegate, $ionicBackdrop, $ionicSlideBoxDelegate, $ionicGesture, $ionicNavBarDelegate, $ionicLoading, $cordovaSocialSharing, $timeout) {

  var mainSlider = angular.element(document.querySelector('.slider-slides')),
    swipeGesture = null;

  $scope.featuredDeals = [];
  $scope.appItems = [];
  $scope.filters = filterService.getFilters();

  var promiseDailyDeal = requestService.getFrontPageDeals();
  promiseDailyDeal.then(function(data) {
    $scope.dailyDeal = data;
    console.log("DailyDeal: ", data);
    updateLoadingIndicator();
  });

  var promiseFeaturedDeals = requestService.getFeaturedDeals();
  promiseFeaturedDeals.then(function(data) {
    $scope.featuredDeals = data;
    $ionicSlideBoxDelegate.$getByHandle('gallery-slider').update();
    console.log("FeaturedDeals: ", data);
    updateLoadingIndicator();
  });
  var promiseAllApps = requestService.getAllApps();
  promiseAllApps.then(function(data) {
    //console.log(data);
  }, function(reason) {
    //console.log(reason);
  }, function(update) {
    //console.log(update);
    $scope.appItems = update;
    $rootScope.appItems = update;
    updateLoadingIndicator();
  }).finally(function() {
    console.warn("HELLO");
  });

  $scope.loadingIndicator = $ionicLoading.show({
    content: 'Loading Data',
    animation: 'fade-in',
    showBackdrop: false,
    maxWidth: 200,
    showDelay: 500
  });

  var updateLoadingIndicator = function() {
    if ($scope.dailyDeal && $scope.featuredDeals.length > 0 && $scope.appItems.length > 10) {
      $scope.loadingIndicator.hide();
    } else {
      $scope.loadingIndicator = $ionicLoading.show({
        animation: 'fade-in',
        noBackdrop: false
      });
    }
  };

  $scope.doRefresh = function() {
    var promise = requestService.getAllApps();
    //TODO not really working
    $timeout(function() {
      $scope.$broadcast('scroll.refreshComplete');
    }, 1500);
    promise.then(function(data) {
      console.log(data);
      $scope.appItems = data;
      $rootScope.appItems = data;
      //updateLoadingIndicator();
      $scope.$broadcast('scroll.refreshComplete');
    });
  };


  // Called to navigate to the main app
  $scope.next = function() {
    $ionicSlideBoxDelegate.next();
  };
  $scope.previous = function() {
    $ionicSlideBoxDelegate.previous();
  };
  $scope.slide = function(index) {
    $ionicSlideBoxDelegate.slide(index);
  };

  // Called each time the slide changes
  $scope.slideChanged = function(index) {
    $scope.slideIndex = index;
    if (index === 0) {
      setNavTitle('Special Deals');
    } else if (index === 1) {
      setNavTitle('All Current Deals');
    }
  };

  var setNavTitle = function(title) {
    $ionicNavBarDelegate.title(title);
  };

  $scope.toggleLeft = function() {
    $ionicSideMenuDelegate.toggleLeft();
  };

  $scope.toggleSearchInput = function() {
    /*var toHide = $('.visible'),
      toShow = $('.invisible');

    toHide.removeClass('visible').addClass('invisible');
    toShow.removeClass('invisible').addClass('visible');*/
  };


  $scope.$watch($ionicSideMenuDelegate.isOpenLeft, function(bool) {
    console.log("watch isOpenLeft: ", bool);
    if (bool) {
      $ionicSlideBoxDelegate.$getByHandle('main-slider').enableSlide(false);
      $ionicSlideBoxDelegate.$getByHandle('gallery-slider').enableSlide(false);
    } else {
      $ionicSlideBoxDelegate.$getByHandle('main-slider').enableSlide(true);
      $ionicSlideBoxDelegate.$getByHandle('gallery-slider').enableSlide(true);
    }
  });

  // ????
  //    $scope.$watch($ionicSlideBoxDelegate.currentIndex, function(index) {
  //      console.log("watch slideIndex: ", index);
  //      if (index === 0) {
  //        swipeGesture = $ionicGesture.on('swiperight', showSideMenuOnSwipe, mainSlider);
  //      } else if (swipeGesture !== null) {
  //        $ionicGesture.off(swipeGesture, 'swiperight', showSideMenuOnSwipe);
  //     }
  //    });

  $scope.sliding = function() {
    var scrollPos = $ionicScrollDelegate.getScrollPosition().top;
    $ionicScrollDelegate.scrollTo(15, scrollPos, false);
    $ionicSlideBoxDelegate.$getByHandle('main-slider').enableSlide(true);

  };
  $scope.scrolling = function() {
    $ionicSlideBoxDelegate.$getByHandle('main-slider').enableSlide(false);
  };
  $scope.showAppDetails = function() {
    $state.go('appDetails');
  };

  $scope.applyFilters = function(app) {
    var max = filterService.getFilterValue('Price', 'Maximum'),
      min = filterService.getFilterValue('Price', 'Minimum'),
      discount = filterService.getFilterValue('Discount', 'Minimum');

    //console.log("Filters: ", min, max, discount);

    var appPrice = Number(app.finalprice.replace(/[^0-9\.]+/g,""))/100;
    var appDiscount = Number(app.discount.replace(/[^0-9\.]+/g,""));
    //console.log(app.finalprice, Number(app.finalprice.replace(/[^0-9\.]+/g,""))/100);
    return appPrice >= min && appPrice <= max && appDiscount >= discount;
  };

  //___________________________//
  //----------Popover----------//

  $scope.toggleMore = function(item, event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    $scope.app = item;
    if ($scope.popover) {
      $scope.popover.remove();
    }
    $ionicPopover.fromTemplateUrl('templates/contextPopover.html', {
      scope: $scope
    }).then(function(popover) {
      $scope.popover = popover;
      $scope.$on('$destroy', function() {
        $scope.popover.remove().then(
          function() {
            delete $scope.popover;
          });
      });
      $scope.popover.show(event);
    });
  }

  $scope.share = function(app) {
    var item = app || $scope.app;
    console.log(app, item, $scope.app);
    $scope.popover.remove();
    $cordovaSocialSharing
      .share(item.name + " is currently " + item.discount.replace(/\-/g, '') + " off! Instead of " + item.originalprice + " you can get it for " + item.finalprice + "!", "Hi Friend! Check out this sale on Steam", null, "http://store.steampowered.com/app/" + item.appid) // Share via native share sheet
      .then(function(result) {
        console.log(result);
        // Success!
      }, function(err) {
        console.log(err);
        // An error occured. Show a message to the user
      });
    //console.log(app);
  };

  $scope.goToAppDetails = function(app) {
    var app = app || $scope.app;
    $scope.popover.remove();
    $state.go('appDetails', {appId : app.appid, packageId : app.packageid});
  };

  $scope.showSearch = function() {
    $state.go("search");
  };

})



.controller('GalleryCtrl', function($scope, $ionicSlideBoxDelegate, $state, $ionicScrollDelegate) {
  $scope.showNext = function() {
    $ionicSlideBoxDelegate.next();
  };
  $scope.showPrev = function() {
    $ionicSlideBoxDelegate.previous();
  };
  $scope.slide = function(index) {
    $ionicSlideBoxDelegate.slide(index);
  };
  $scope.slideChanged = function(index) {
    $scope.slideIndex = index;
  };
  $scope.onTouch = function() {
    $ionicSlideBoxDelegate.$getByHandle('main-slider').enableSlide(false);
    $ionicScrollDelegate.getScrollView().options.scrollingY = false;

  };
  $scope.onRelease = function() {
    $ionicSlideBoxDelegate.$getByHandle('main-slider').enableSlide(true);
    $ionicScrollDelegate.getScrollView().options.scrollingY = true;
  };

  $scope.getDealName = function() {
    return "Featured Deals";
  };

  /*$scope.goToAppDetails = function(app) {
    var app = app || $scope.app;
    $scope.popover.remove();
    $state.go('appDetails', {appId : app.appid, packageId : app.packageid});
  };*/

  $scope.showAppDetails = function() {
    $state.go('appDetails');
  };
})



.controller('appDetailsCtrl', function($scope, $ionicSlideBoxDelegate, $state, $stateParams, requestService) {
  $scope.openHorizontalTabs = [];
  console.log('packageID in URL: ', $stateParams.packageId);
  $scope.appItem = requestService.getCurrentApp($stateParams.appId, $stateParams.packageId);
  var promiseAppDetails = requestService.getAppItemDetails($stateParams.appId, $stateParams.packageId);
  promiseAppDetails.then(function(data) {
    $scope.categories = data.categories;
    $scope.userTags = data.userTags;
    $scope.userScore = data.userScore;
    $scope.description = data.description;
    console.log('categories: ', $scope.categories );
  });

  var promiseMetaScore = requestService.getMetaScore($stateParams.appId, $stateParams.packageId);
  promiseMetaScore.then(function(data){
    $scope.metaScore = data.metaScore;
    $scope.windows = data.windows;
    $scope.linux = data.linux;
    $scope.mac = data.mac;
  }, function(reason){
    $scope.metaScore = 0;
    $scope.windows = true;
    $scope.linux = false;
    $scope.mac = false;
  });


  $scope.showNext = function() {
    $ionicSlideBoxDelegate.next();
  };
  $scope.showPrev = function() {
    $ionicSlideBoxDelegate.previous();
  };
  $scope.slide = function(index) {
    $ionicSlideBoxDelegate.slide(index);
  };
  $scope.slideChanged = function(index) {
    $scope.slideIndex = index;
  };
  $scope.getAppDetails = function() {
    return "Featured Deals";
  };

  $scope.toggle = function(tabName) {
    var index = $scope.openHorizontalTabs.indexOf(tabName);
    if (index > -1) {
      $scope.openHorizontalTabs.splice(index, 1);
    } else {
      $scope.openHorizontalTabs.push(tabName);
    }
  };

  $scope.isOpen = function(tabName) {
    return $scope.openHorizontalTabs.indexOf(tabName) > -1;
  };

})



.controller('SearchCtrl', function($scope, $rootScope, $filter, $timeout, requestService) {
  Object.defineProperty($scope, "queryFilter", {
      get: function() {
          var out = {};
          out[$scope.queryBy || "$"] = $scope.query;
          return out;
      }
  });
  $scope.query = {};
  $scope.queryBy = '$';
  $scope.orderProp = "name";
  var orderBy = $filter('orderBy');

  $timeout(function() {
    $('#search').focus();
  }, 500);

  $scope.clearSearch = function() {
    $timeout(function() {
      $('#search').val('');
    });
  };
})



.controller('SideMenuCtrl', function($scope, filterService) {

  $scope.filters = filterService.getFilters();
  $scope.openFilters = [];

  //$scope.rangeValue = ;
  /*$.each($scope.filters, function(index, element) {
    $scope.rangeValue.push(element.value.value);
  });*/

  $scope.isOpen = function(filterName) {
    return $scope.openFilters.indexOf(filterName) > -1;
  };

  $scope.toggleDropDown = function(filter) {
    var index = $scope.openFilters.indexOf(filter.name);
    if (index > -1) {
      $scope.openFilters.splice(index, 1);
    } else {
      $scope.openFilters.push(filter.name);
    }
  };
});