			
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

						App.load('articleView',item,'scale-in');

					});


				});
			}

			var refreshPage = $(page).find('#titleMainPage');
			refreshPage.clickable();
			refreshPage.on('click',function(){

				App.load('articleList','fade');

			});

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
					var descriptionWithTag = $('<p />');
					descriptionWithTag.text(description);
					var title = $('<h4 />');
					var author = $('<footer />');
					
					var kikButton = $(page).find('#kikMe');

					$(page).find('.articleview').append(sectionTitle);
					sectionTitle.append(title);
					$(page).find('.articleview').append(secttionImage);
					secttionImage.append(image);
					$(page).find('.articleview').append(secttionArticle);
					secttionArticle.append(descriptionWithTag);
					secttionArticle.append(author);

					title.text(articleTitle);
					author.text(articleAuthor);

					kikButton.on('click',function(){
						var x = JSON.stringify(item);
						var url = image.attr('src');
						cards.kik.send({
    				title    : title.text()        ,
    				text     : 'Check This Out!!'         ,
    				pic      : url ,       // optional
    				big      : false                   ,       // optional
    				linkData : x // optional
						});

					});

					sectionTitle.clickable();
					sectionTitle.on('click',function(){

						cards.browser.open(item['link']);

					});

					var homeButton = $(page).find('#home');
					homeButton.on('click',function(){

						App.load('articleList','scale-out')

					});

	});


			if (cards.browser && cards.browser.linkData) {
      // Card was launched by a conversation
      App.load('articleView', cards.browser.linkData);
      //cards.kik.returnToConversation(); // return to conversation
    }else {
      App.load('articleList');
    }