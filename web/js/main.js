			
			App.populator('articleList',function(page,feed){


				var feedNum;

				if(feed['list'] === 'verge'){
					feedNum = 0;
				}else if(feed['list'] === 'engadget'){

					feedNum = 1;

				}else {
					feedNum = 0;
				}

				changeMainTitle(feedNum);

				var wrapper = page.querySelector('.wrapper');
				
				var slideviewer = new SlideViewer(wrapper, source, {
					//startAt: parseInt(data.index, 2),
					startAt: feedNum,
					length: 2,
				});

				page.addEventListener('appLayout', function () {
					slideviewer.refreshSize();
				});

				function source(i){

					var list = $('<div />');

					if(i === 0){

				MyAPI.getVergeArticles(function(meta,articles){

					populateVergeArticleList(articles,list);

				});
			} else if(i === 1){

				MyAPI.getEngadgetArticles(function(meta,articles){

					populateEngadgetArticleList(articles,list);

				});

			}

			return list[0];

			}

			

			function populateVergeArticleList(data,list){
				console.log(data);
				data.forEach(function (item){

					var articleTitle = item['title'];
					var articleDescription = item['description'];
					var articleDate = item['pubDate'];
					var articleLink = item['link'];
					var articleAuthor = item['author'];

					//var list = $('<div />');
					var section = $('<div />').addClass('app-section');
					var temp = $('<div />').html(articleDescription);
					var description = temp.find('p').text();
					var title = $('<h4 />');
					var author = $('<footer />');

					//$(page).find('#appListPage').append(list);
					list.append(section);
					section.append(title);
					section.append(author);

					title.text(articleTitle);
					author.text(articleAuthor);

					section.clickable();
					var passingData1 = {'item':item,'list':'verge'};
					section.on('click',function(){

						App.load('articleView',passingData1,'scale-in');

					});



				});

				list.css('height','100%');

				list.scrollable();

			}

			function populateEngadgetArticleList(data,list){
				console.log(data);
				data.forEach(function (item){

					var articleTitle = item['title'];
					var articleDescription = item['description'];
					var articleLink = item['link'];
					var articleAuthor = item['dc:creator']['#'];
					//var list = $('<div />');
					var section = $('<div />').addClass('app-section');
					var temp = $('<div />').html(articleDescription);
					var description = temp.find('p').text();
					var title = $('<h4 />');
					var author = $('<footer />');

					//$(page).find('#appListPage').append(list);
					list.append(section);
					section.append(title);
					section.append(author);

					title.text(articleTitle);
					author.text(articleAuthor);

					section.clickable();
					var passingData = {'item':item,'list':'engadget'};
					section.on('click',function(){

						App.load('articleView',passingData,'scale-in');

					});



				});

				list.css('height','100%');

				list.scrollable();

			}


			slideviewer.on('flip',changeMainTitle);

				function changeMainTitle(slideNum){


				if(slideNum == 0){

					$(page).find('#titleMainPage').text('The Verge');

				}else if(slideNum == 1){
					$(page).find('#titleMainPage').text('Engadget');
				}

			}

				var refreshPage = $(page).find('#titleMainPage');
				refreshPage.clickable();
				
				refreshPage.on('click',function(){

				if(refreshPage.text() == 'Engadget'){
					var passObject = {'list':'engadget'};
					App.load('articleList',passObject,'fade');

				}else if (refreshPage.text() == 'The Verge'){
					var passObj = {'list':'verge'};
					App.load('articleList',passObj,'fade');

				}

			});

		



	});


			App.populator('articleView',function(page, data){


					var item = data['item'];
					var list = data['list'];
					//console.log(list);
					var continueButton = $(page).find('#continue');

					var articleTitle = item['title'];
					var articleDescription = item['description'];
					var articleLink = item['link'];
					var articleAuthor = item['author'];

					var sectionTitle = $('<div />').addClass('app-section');
					var secttionArticle = $('<div />').addClass('app-section');
					var secttionImage = $('<div />').addClass('app-section');
					var temp = $('<div />').html(articleDescription);
					var image = temp.find('img');
					var description = temp.text().replace('Continue reading', '').replace('…', '');
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
						var x = JSON.stringify(data);
						var url = image.attr('src');
						cards.kik.send({
    				title    : title.text()        ,
    				text     : 'Check This Out!!'         ,
    				pic      : url ,       // optional
    				big      : false                   ,       // optional
    				linkData : x // optional
						});

					});

					//sectionTitle.clickable();
					//sectionTitle.on('click',function(){

						//cards.browser.open(item['link']);

					//});

					continueButton.on('click',function(){

						cards.browser.open(item['link']);

					});

					if (cards.browser && cards.browser.linkData){
    				// Card was launched by a conversation
    				$(page).find('#originalHome').replaceWith('<div class ="app-button left" id="home">Home</div>');
    				var homeButton = $(page).find('#home');
    				var listObj = {'list':list};
						homeButton.on('click',function(){

						App.load('articleList',listObj,'scale-out')
						cards.browser.linkData='';

					});
				}

	});


			if (cards.browser && cards.browser.linkData) {
      // Card was launched by a conversation
      App.load('articleView', cards.browser.linkData);
      //cards.kik.returnToConversation(); // return to conversation
    }else {
      App.load('articleList','verge');
    }