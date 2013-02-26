			
			App.populator('articleList',function(page){

				MyAPI.getArticles(function(meta,articles){

					populateArticleList(articles);

				});

			

			function populateArticleList(data){
				console.log(data);
			}

	});
			try{
				App.restore();
			}
			catch (err) {
				App.load('articleList');
			}