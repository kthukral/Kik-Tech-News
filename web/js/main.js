			
			App.populator('articleList',function(page){

				MyAPI.getArticles(function(meta,articles){

					populateArticleList(articles);

				});

			

			function populateArticleList(data){
				console.log(data);
				data.forEach(function (item){

					var articleTitle = item['title'];
					var articleDescription = item['description'];
					var articleDate = item['pubDate'];
					var articleLink = item['link'];
					var articleAuthor = item['author'];
					
					var section = $('<div />').addClass('app-section');
					var temp = $('<div />').html(articleDescription);
					var description = temp.find('p').text();
					var title = $('<h4 />');
					var author = $('<footer />');
					
					$(page).find('.list').append(section);
					section.append(title);
					section.append(author);

					title.text(articleTitle);
					author.text(articleAuthor);

					section.clickable();
					section.on('click',function(){

						App.load('articleView',item);

					});


				});
			}

	});


			App.populator('articleView',function(page, item){

					var articleTitle = item['title'];
					var articleDescription = item['description'];
					var articleLink = item['link'];
					var articleAuthor = item['author'];

					var sectionTitle = $('<div />').addClass('app-section');
					var secttionArticle = $('<div />').addClass('app-section');
					var secttionImage = $('<div />').addClass('app-section');
					var temp = $('<div />').html(articleDescription);
					var image = temp.find('img');
					var description = temp.find('p').text();
					var title = $('<h4 />');
					var author = $('<footer />');

					$(page).find('.articleview').append(sectionTitle);
					sectionTitle.append(title);
					$(page).find('.articleview').append(secttionImage);
					secttionImage.append(image);
					$(page).find('.articleview').append(secttionArticle);
					secttionArticle.append(description);
					secttionArticle.append(author);

					title.text(articleTitle);
					author.text(articleAuthor);




			});

			try{
				App.restore();
			}
			catch (err) {
				App.load('articleList');
			}