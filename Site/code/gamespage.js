//	gamespage.js
//
//	Implements UI for Anacreon 3
//	Copyright (c) 2012 Kronosaur Productions, LLC. All Rights Reserved.

$(document).ready(function () {
	//	Nothing to do if we're not signed in

	if ($UserInfo == null)
		return;

	//	LATER: Add wait animation
		
	//	Ask for a list of games to load.
		
	$.getJSON("/api/gameList", { authToken: $UserInfo.authToken }, function (data) {
		var pageBody = $("#pageBody .singleColumn");
		var entryCount = 0;
			
		//	LATER: Remove wait animation
			
		//	If this is an error then we report it
			
		if ($Hexarc.isError(data))
			{
			pageBody.append("<p class='error'>" + $Hexarc.errorGetText(data) + "</p>");
			return;
			}
				
		//	Otherwise, fill in the game table. We iterate over each game
		//	returned by the service and add a div row to the page.
			
		if (data)
			{
			$.each(data, function (index, gameRecord) {
				var gameRow = $(
					"<div class='gameRow'>" +
						"<div class='gameIcon'>" +
							"<img src='res/ScenarioIconBlank.png'/>" +
						"</div>" +
						"<div class='gameText'>" +
							"<span class='gameName'>" + gameRecord.name + "</span><br/>" +
							"<span class='gameDesc'>" + gameRecord.description + "</span>" +
							"<div class='playButton mediumButton136Y'>Play</div>" +
						"</div>" +
						"<div class='gameInfo'><table>" +
							"<tr><th>scenario</th><td>" + $UI.htmlEncode(gameRecord.scenarioName) + "</td></tr>" +
							"<tr><th>players</th><td>" + $UI.htmlEncode(gameRecord.playerCount) + "</td></tr>" +
							"<tr><th>last visit</th><td>" + $UI.htmlEncode(gameRecord.lastAccessTime) + "</td></tr>" +
							"<tr><th>ID</th><td>" + $UI.htmlEncode(gameRecord.scenarioID + " release " + gameRecord.scenarioRelease) + "</td></tr>" +
						"</table></div>" +
					"</div>"
					);

				gameRow.appendTo(pageBody);
				
				//	Add an event to play
				
				var button = gameRow.find(".playButton").click(function () {
					
					//	Navigate
					
					window.location.href = "trantor.hexm?gameID=" + encodeURIComponent(gameRecord.gameID);
					});

				entryCount++;
				});
			}

		//	Add a row to create a new game

		var newGameRow = $(
			"<div class='gameRow'>" +
				"<div class='gameIcon'>" +
				"</div>" +
				"<div class='gameText'>" +
					"<span class='gameName'>" + "New Game" + "</span><br/>" +
					"<span class='gameDesc'>" + "Join a massively-multiplayer game in progress or start a private game with your friends." + "</span>" +
					"<div class='playButton mediumButton136Y'>New Game</div>" +
				"</div>" +
			"</div>"
			);

		newGameRow.appendTo(pageBody);

		//	Add an event to create
				
		var button = newGameRow.find(".playButton").click(function () {
					
			//	Navigate
					
			window.location.href = "start.hexm";
			});

		entryCount++;

		//	If there are not enough entries then add some blank space

		if (entryCount < 4)
			{
			pageBody.append("<p style='height:" + (4 - entryCount) * 200 + "px;'></p>");
			}
		});
	});
