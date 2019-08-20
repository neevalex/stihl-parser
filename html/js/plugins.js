
let API = function (cmd, data) {

	var request = $.ajax({
		url: '/api/',
		type: 'GET',
		data: { cmd: cmd, data: data} ,
		contentType: 'application/json; charset=utf-8'
	});
	
	request.done(function (response) {
		
		
		console.log(response.cmd);	
		
		if (response.cmd == 'getURLS') {
			var textarea = document.getElementById("urls");
			textarea.value = response.data.join("\n");
		}
		
		if (response.cmd == 'scanPRODUCTS') {
			API('getPRODUCTS', '');
		}
		
		if (response.cmd == 'status') {
			$('.status').text(response.data);
		}
		
		if (response.cmd == 'getPRODUCTS') {
			$('.products .loading').remove();
			response.data.forEach(product => {
				$('.products').append('<tr><th scope="row">'+product.id+'</th><td><a href="'+product.url+'" target="_blank">'+product.title+'</a></td><td><img data-featherlight="'+product.image+'" src="'+product.image+'" /></td><td>'+product.smallDesc+'</td><td>'+product.cat+'</td><td>'+product.price+'</td><td>'+product.sku+'</td><td>'+product.description+'</td><td>'+product.related+'</td></tr>');
				// console.log(product.title);
			});
		}
		
	});
	
	request.fail(function(jqXHR, textStatus) {
		  // your failure code here
	});
	
	return data;
};

function activateBTN(btn) {
	console.log('bttn');
	oldTitle = $(btn).text();
	$(btn).text('Loading...');
	$(btn).addClass('active');
	setTimeout(function () {
		$(btn).removeClass('active');
		$(btn).text(oldTitle);
    }, 1000);
}

jQuery(document).ready(
	function ($) {
		
		API('getURLS', '');
		API('getPRODUCTS', '');
   		
		
		$('.save.urls').click(function(e){
			e.preventDefault;	
			var arrayOfLines = $('textarea.urls').val().split('\n');
			API('setURLS', JSON.stringify(arrayOfLines));
			API('getURLS', '');	
			activateBTN(this);
		});
		
		$('.save.scan').click(function(e){
			e.preventDefault;		
			API('scanPRODUCTS', '');	
		});
		
		$('.save.moredata').click(function(e){
			e.preventDefault;	
			API('moreDATA', '');
			activateBTN(this);
		});
			
		window.setInterval(function(){
		// 	API('status', '');
		 }, 1000); 
	}
);
