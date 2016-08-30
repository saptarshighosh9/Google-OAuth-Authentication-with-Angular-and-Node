angular.module('authapp',['ui.router','angular-storage','angular-jwt'
]).config(['$stateProvider','$urlRouterProvider','$httpProvider','jwtInterceptorProvider',function($stateProvider,$urlRouterProvider,$httpProvider,jwtInterceptorProvider){
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common["X-Requested-With"];
    $httpProvider.defaults.headers.common["Accept"] = "application/json";
    $httpProvider.defaults.headers.common["Content-Type"] = "application/json";
    jwtInterceptorProvider.tokenGetter = function(store){
        return store.get('jwt');
    }
    $httpProvider.interceptors.push('jwtInterceptor');
    $urlRouterProvider.otherwise("/login");
	$stateProvider
    .state('login',{
        url: '/login',
        templateUrl: 'modules/login/view/login.html',
        controller : 'loginregCtrl'
    })    
    .state('home',{
        url: '/home',
        templateUrl: 'modules/home/view/home.html'
    })
    .state('myprofile',{
        url: '/myprofile',
        templateUrl: 'modules/profile/view/myprofile.html'
    });       
}]).run(['$rootScope','$http',function($rootScope,$http){
    gapi.load('auth2', function(){
        auth2 = gapi.auth2.init({client_id: '217471960652-nsgnjifoofjc7m3hietv0jtmrgbhehj0.apps.googleusercontent.com',scope : 'profile email'});
    });
}]).controller('headerCtrl',['store','$scope','$rootScope','$state',function(store,$scope,$rootScope,$state){
    $rootScope.allownav=true;
    $scope.logout = function(){
        store.remove('jwt');
        $rootScope.isauth=false;
        $state.go('login');
    };
}]).controller('homeCtrl',['store','$rootScope','$scope','$http','$state','$stateParams',function(store,$rootScope,$scope,$http,$state,FileUploader,$stateParams){
    $rootScope.allownav=true;
    window.scrollTo(0, 0);
    function getprofile() {
        $http({
            method : 'GET',
            url :  "http://localhost:8080/profile"
        }).success(function(data,status){
            if(data.message == "success"){
                $scope.profiledata = data.info;
                $rootScope.isauth=true;
            }else{
                $rootScope.isauth=false;
            }
        }).error(function(data,status){
            $rootScope.isauth=false;
        });
    };
    $scope.logout = function(){
        store.remove('jwt');
        $rootScope.isauth=false;
        $state.go('login');
    };
    $scope.passwordset=false;
    $scope.setnativepassword = function() {
        console.log(this.nativepassword);
        $http({
            method : 'POST',
            url :  "http://localhost:8080/setnativepassword",
            data : {
                email : this.nativeemail,
                password: this.nativepassword
            }
        }).success(function(data,status){
            if(data.message == "success"){
                $scope.passwordset=true;
            }else{
            }
        }).error(function(data,status){

        });
    };
    $scope.addgoogleaccbtn = true;
    $scope.addgoogleacc = function(){
        auth2.signIn().then(function(response) {
            console.log(response);
            $http({
                method : 'POST',
                url :  'http://localhost:8080/addgoogleacc',
                data : {
                    jwt :  response.hg.id_token
                }
            }).success(function(data){
                if(data.message=="success"){
                    $scope.addgoogleaccbtn = false;
                }else{
                    $scope.addgoogleaccbtn = true;
                }
            }).error(function(data){
                $scope.addgoogleaccbtn = true;
            });
        });
    };
    getprofile(); 
}]).controller('loginregCtrl', ['$rootScope','$scope','$http','$state','$stateParams','store','jwtHelper',function($rootScope,$scope,$http,$state,$stateParams,store,jwtHelper){
    $rootScope.allownav=false;
    var t;
    window.scrollTo(0, 0);
    $scope.logint=true;
    $scope.reg=false;
    $scope.accountsetup = false;
    $scope.login = function(){
        angular.element( document.querySelector( '#loginbtn' ) ).addClass('disabled'); 
        $scope.loginerr=false;
        $http({
            method : 'POST',
            url :  ROOT+LOOGIN,
            data : {
                username :  this.loginemail,
                password :  this.loginpassword
            }
        }).success(function(data,status){
            if(data.message == "success"){
                store.set('jwt',data.id_token);
                $rootScope.isauth=true;
                $rootScope.userpname=data.username;
                if($state.current.name=='login'){
                    $state.go('home',{},{reload:true});   
                };
            }else{
                $rootScope.isauth=false;
                $scope.loginerr=true;   
                angular.element( document.querySelector( '#loginbtn' ) ).removeClass('disabled'); 
            }
        }).error(function(data,status){
            console.log(data);
            console.log("***");
          $rootScope.isauth=false;
          $scope.loginerr=true;
            angular.element( document.querySelector( '#loginbtn' ) ).removeClass('disabled'); 
        });
    };
    $scope.googleauth = function(){
        auth2.signIn().then(function(response){
            $http({
                method : 'POST',
                url :  ROOT+CHCKJWT,
                data : {
                    jwt :  response.hg.id_token
                }
            }).success(function(data){
                if(data.message=="success"){
                    if(data.nuser){
                        $scope.logint=false;
                        $scope.reg = false;
                        $scope.accountsetup = true;
                        $scope.google_accsetup=true;
                        store.set('jwt',response.hg.id_token);
                    }else{
                        store.set('jwt',response.hg.id_token);
                        $rootScope.isauth=true;
                        if($state.current.name=='login'){
                            $state.go('home',{},{reload:true});   
                        };
                    }
                }else{
                    $rootScope.isauth=false;
                }
            }).error(function(data){
            });            
        });  
    };
    $scope.addgoogleaccbtn = true;
    $scope.addgoogleacc = function(){
        auth2.signIn().then(function(response) {
            console.log(response);
            $http({
                method : 'POST',
                url :  'http://localhost:8080/addgoogleacc',
                data : {
                    jwt :  response.hg.id_token
                }
            }).success(function(data){
                if(data.message=="success"){
                    $scope.addgoogleaccbtn = false;
                }else{
                    $scope.addgoogleaccbtn = true;
                }
            }).error(function(data){
                $scope.addgoogleaccbtn = true;
            });
        });
    };

    $scope.oerr=false;
    $scope.regsucc=false;
    $scope.user = {};
    $scope.register=function(){  
        $scope.oerr=false;
        $scope.regsucc=false;
        angular.element( document.querySelector( '#usersignup' ) ).addClass('disabled'); 
        $http({
            method : 'POST',
            url    : ROOT+REGISTEER,
            data   : {
                "user" : $scope.user
            }
        }).success(function(data, status, headers, config){
            if(data.message=="success"){
                $scope.logint=false;
                $scope.reg = false;
                $scope.accountsetup = true;
                $scope.native_accsetup=true;
                store.set('jwt',data.id_token);
                console.log(data.id_token);
            }else{
                $scope.oerr=true;
                angular.element( document.querySelector( '#usersignup' ) ).removeClass('disabled'); 
            };
        }).error(function(data,status){
            $scope.oerr=true;
            angular.element( document.querySelector( '#usersignup' ) ).removeClass('disabled'); 
        });
    };

    $scope.registershow = function(){
        $scope.logint=false;
        $scope.reg = true;
        $scope.accountsetup = false;

    };
    $scope.registerhide = function(){
        $scope.logint=true;
        $scope.reg = false;
        $scope.accountsetup = false;
    };


    $scope.pwerror=false;
    $scope.oerr=false;
    $scope.regvsucc=false;
    $scope.overr=false;

    $scope.passwordset= false;

    $scope.origin_google_setnativepassword = function() {
        console.log(this.nativepassword);
        $http({
            method : 'POST',
            url :  "http://localhost:8080/setnativepassword",
            data : {
                email : this.nativeemail,
                password: this.nativepassword
            }
        }).success(function(data,status){
            if(data.message == "success"){
                $scope.passwordset=true;
            }else{
            }
        }).error(function(data,status){

        });
    };

    $scope.continue = function () {
        $http({
            method : 'POST',
            url :  "http://localhost:8080/reginfo"    
        }).success(function(data,status){
            if(data.message=="success"){
                $rootScope.isauth=true;
                if($state.current.name=='login'){
                    $state.go('home',{},{reload:true});   
                };
            }
        }).error(function(data,status){
        });
    };

    $scope.checkinglogedin = true;
    /* Main Login checker */
    function getloginstat() {
        console.log("Checking for valid JWT");
        if(store.get('jwt') && !jwtHelper.isTokenExpired(store.get('jwt'))){
            console.log("JWT found and is valid");
            $http({
                method : 'POST',
                url :  "http://localhost:8080/loginstat"
            }).success(function(data,status){
                if(data.message == "success"){
                    $rootScope.isauth=true;
                    $rootScope.userpname=data.username;
                    if($state.current.name=='login'){
                        $state.go('home',{},{reload:true});   
                    };
                }else{
                    $scope.checkinglogedin = false;
                    console.log("JWT found.But not authentic");
                }
            }).error(function(data,status){
                $scope.checkinglogedin = false;
            });
        }else{
            /*
            if(auth2 && auth2.isSignedIn.get()){
                console.log("logged in with google");
            }else{
                console.log("Not logged in with google");
            };
            */
            $scope.checkinglogedin = false;
            console.log("No JWT found.Check with google auth followed by facebook auth");
            angular.element( document.querySelector( '#loginbtn' ) ).addClass('enabled'); 
        }
    };
    getloginstat();  

    /*
    $scope.facebookauth = function(){
        console.log("Trying to reach FB");
        FB.login(function(response){
            console.log(response.authResponse);
            $http({
                method : 'POST',
                url :  ROOT+CHCKFBJWT,
                data : {
                    accesstoken :  response.authResponse.accessToken
                }
            }).success(function(data){
                console.log(data);
                if(data.message=="success"){
                    if(data.nuser){
                        $scope.logint=false;
                        $scope.reg = false;
                        $scope.accountsetup = true;
                        $scope.fb_accsetup=true;
                        store.set('jwt',data.id_token);
                    }else{
                        store.set('jwt',data.id_token);
                        $rootScope.isauth=true;
                        if($state.current.name=='login'){
                            $state.go('home',{},{reload:true});   
                        }; 
                    };
                }else{
                    $rootScope.isauth=false;
                }
            }).error(function(data){
            });
        }, {scope: 'email,public_profile,user_location,user_photos'});
    };    
    */
}]);


