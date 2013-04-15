			
			App.populator('articleList',function(page,feed){


				var feedNum;

				//Determining weather to load articles from verge or engadget

				if(feed['list'] === 'verge'){
					feedNum = 0;
				}else if(feed['list'] === 'engadget'){

					feedNum = 1;

				}else {
					feedNum = 0;
				}

				changeMainTitle(feedNum); //Changing the navigation bar title

				//Initializing a wrapper variable for slide viewer

				var wrapper = page.querySelector('.wrapper');
				wrapper.innerHTML = '';
				
				//Initializing a slideviewer variable
				var slideviewer = new SlideViewer(wrapper, source, {
					startAt: feedNum,
					length: 2,
				});

				/* If the device is an android then the slideviwer will disable 3d and enable it when the slide viewer moves*/ 
				
				if(App.platform == 'android'){
					slideviewer.disable3d();
					slideviewer.on('move',function(){
						slideviewer.enable3d();
					});

				}

				page.addEventListener('appLayout', function () {
					slideviewer.refreshSize();
				});

				//Depending on the source (Verge or Engadget) the code calls feedparser methods defined 
				//in MYAPI.js to fetch the articles from the correct RSS feeds and then calls a method
				//to pouplate the list page

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
				console.log(data); //logging data to ensure, correct rss feed is used
				//Runs for each article in the rss feeds
				data.forEach(function (item){

					//grab certain tags from rss fieds and assign them to local variables
					var articleTitle = item['title'];
					var articleDescription = item['description'];
					var articleAuthor = item['author'];

					//Appending individual parts to app page to populate list

					
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

					if(App.platform == 'android' && slideviewer){
						slideviewer.disable3d();
					}


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

					//Grabing certain tags from the rss feed

					var item = data['item'];
					var list = data['list'];
					//console.log(list);
					var continueButton = $(page).find('#continue');

					var articleTitle = item['title'];
					var articleDescription = item['description'];
					var articleLink = item['link'];
					var articleAuthor = item['author'];

					//Adding sections and appending them to the app page

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

					//Kik button to share the article over a Kik

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

					//If the card is open from a Kik, it replaces the back button with home button

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

			//If card is opened from a kik it will open in article page otherwise, it will open the 
			//list page
			if (cards.browser && cards.browser.linkData) {
      // Card was launched by a conversation
      App.load('articleView', cards.browser.linkData);
      //cards.kik.returnToConversation(); // return to conversation
    }else {
      App.load('articleList','verge');
    }