// This is a JavaScript file
var timerID;
var json_str = "";
var array_points = [];

function current_point(divisoin, recdate, lat, lng, option){
    this.division = divisoin;
    this.recdate = recdate;
    this.lat = lat;
    this.lng = lng;
    this.option = option;
}

function set_map(){
    var directionsService=new google.maps.DirectionsService();
    var directionsDisplay;
    var map;
    var mapCenter;
    var elevationText;
    var distance;
    var distanceText;
    var durationText;

    var currentPos;
    var targetPos;
    var destMarker;
    
    // google.maps.event.addDomListener(window, 'load', function(){
        $("#map_canvas").empty();
        
        //マップ関係
        var mapDiv = $("#map_canvas").get(0);
        
        set_modal();
        
        // 位置情報取得オブジェクトチェック
        if (!navigator.geolocation){
            mapDiv.innerHTML = "Geolocation 使用不可";
            return;
        }
     
        // 位置情報取得オブジェクトオプション
        var option = {
            timeout: 7000,            // タイムアウト
            enableHighAccuracy:true,   // GPS利用
            maximumAge: 0,
        }
        
        // 位置情報を取得
        navigator.geolocation.getCurrentPosition(resultHandler, errorHandler, option);
        // navigator.geolocation.watchPosition(resultHandler, errorHandler, option);
        if(timerID){
            console.log("タイマーを停止しました。");
            clearInterval(timerID);
        }
        
        timerID = setInterval(
            function(){
                navigator.geolocation.getCurrentPosition(resultHandler, errorHandler, option);
            }, 5*1000);
            
        function errorHandler(){
            
            $("#div_spin").css("display","none");
            $("#gps_text").html("現在地を特定できませんでした。");
            
            setTimeout('modal.hide()', 1500);
            
            if(timerID){
                console.log("タイマーを停止しました。");
                clearInterval(timerID);
            }
        }
        // 位置情報取得成功時
        function resultHandler(position){
            // console.log("resultHandler.");
            
            // 現在地特定中のモーダル表示を消す。
            remove_modal();
            
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            // console.log(latitude);
            // console.log(longitude);
            
            var data = new Array();
            
            data.push({lat:latitude, lng:longitude, description:"現在地", level:"現在地"});
            
            // GoogleMapにデータを渡す
            mapCenter = new google.maps.LatLng(latitude, longitude);
            var options = {
                zoom:14,                // 表示倍率
                center:mapCenter,       // 中央位置
                mapTypeId:google.maps.MapTypeId.ROADMAP,
                scaleControl:true       // 倍率変更
            };
            
            // 地図を表示
            map = new google.maps.Map(mapDiv, options);
            map.setCenter(mapCenter);
            var latLngBounds = new google.maps.LatLngBounds();
            
            markerObjs = new Array();
            //マーカの作成
            jQuery.each(data, function()
            {
                var latlng = new google.maps.LatLng(this.lat, this.lng);
                var t_description = this.description;
                var t_level = this.level;
                var t_ward = this.ward;
                
                latLngBounds.extend(latlng);
                
                if(t_level == '現在地'){
                    var blue_dot_image = new google.maps.MarkerImage(
                        './images/bluedot.png',
        				null, // size
						null, // origin
						new google.maps.Point( 8, 8 ), // anchor (move to center of marker)
						new google.maps.Size( 17, 17 ) // scaled size (required for Retina display icon)
					);
						
	                var t_park = new google.maps.Marker({
    	                position: latlng,
        	            map: map,
            	        title: t_description,
            	        icon: blue_dot_image,
            	        flat: true,
            	        optimized: false,
            	        visible: true
                	});
                	
                	mapCurrent = latlng;
                    // 現在地の緯度経度を右上に表示。
                    $("#result").html(latitude + "<br/>"+ longitude);
                    $("#result").css('display','block');
                    
                    array_points = [];
                    var m = moment();
                    var temp_point = new current_point(
                        "現在地",
                        m.format("YYYY-MM-DD HH:mm:ss"),
                        latitude,
                        longitude,
                        "現在地");
        
                    array_points.push(temp_point);
        
                    json_str = JSON.stringify({"points": array_points});
                    console.log(json_str);
                    
                    $.ajax({
                        type:"post",
                        url:"http://road2win.plala.jp/e-velo/report/gpslogger/regi_point.php",
                        data:{
                            'appkey': '5818bb31013eb0a269a071c6',
                            'act': 'insert',
                            'json': json_str
                        },
                        async : false,
                        cache : true,
                        beforeSend : function(xhr) {
                            xhr.setRequestHeader("If-Modified-Since",
                            "Thu, 01 Jun 1970 00:00:00 GMT");
                        },
                        dataType:"json",
                        success:function(data){
                            console.log("successed");
                            var res_str = JSON.stringify(data);
                            console.log(res_str);
                            
                        },error : function(XMLHttpRequest, textStatus, errorThrown) {
                            console.log("XMLHttpRequest : " + XMLHttpRequest.status);
                            console.log("textStatus : " + textStatus);
                            console.log("errorThrown : " + errorThrown.message);
                        }
                    });           	
                }
                
                function setHPCenter(map, latlng){
                	map.setCenter(latlng); 
    				map.setZoom(17); //拡大する
                }
                //追加したオブジェクトにイベントリスナを追加。
                google.maps.event.addListener(t_park, 'click', function() {
           //          var infoWindow = new google.maps.InfoWindow();
           //          
        			// infoWindow.setContent(t_park.title); 
           //      	infoWindow.open(map, t_park);
                    
                	// requestRoute(mapCurrent , latlng);
  				});
                
                //配列に追加する。
                markerObjs.push(t_park);
            });
		    addMarker();
            // 全てのマーカーが表示される様に表示領域を設定する
            // map.fitBounds(latLngBounds);
        }
    // });
    // 地図にマーカーを追加
    function addMarker()
    {
        jQuery.each(markerObjs, function()
        {
            this.setMap(map);
        });
    }
    
    function set_modal(){
        $("#div_spin").css("display","block");
        $("#gps_text").text("GPSで位置情報を取得中です...");
        modal.show();
    }
    
    function remove_modal(){
        modal.hide();
    }
}