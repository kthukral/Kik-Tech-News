(function (window, document, $, cards, App, MyAPI) {

	App.populator('page2', function (page) {
		$(page).find('.app-content .app-button')
			.click(function () {
				MyAPI.ping('ping from client', function (str) {
					alert(str);
				});
			});
	});

	App.load('home');

})(window, document, Zepto, cards, App, MyAPI);
