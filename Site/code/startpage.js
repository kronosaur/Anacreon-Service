//	startpage.js
//
//	Implements UI for Anacreon 3
//	Copyright (c) 2012 Kronosaur Productions, LLC. All Rights Reserved.

$(document).ready(function () {

	var pageBody = $("#pageBody .singleColumn");
	var entryCount = 0;

	//	Nothing to do if not signed in

	if ($UserInfo == null)
		return;

	//	LATER: Add wait animation

	//	Ask for a list of games to join

	$.getJSON("/api/openGameList", { authToken: $UserInfo.authToken }, function (data) {

		//	If this is an error then we report it

		if ($Hexarc.isError(data))
			{
			pageBody.append("<p class='error'>" + $Hexarc.errorGetText(data) + "</p>");
			return;
			}

		//	Otherwise, fill in the table.

		if (data != null)
			{
			$.each(data, function (index, gameRecord) {
				var gameRow = $(
					"<div class='gameRow'>" +
						"<div class='gameIcon'>" +
							"<img src='res/ScenarioIconBlank.png'/>" +
						"</div>" +
						"<div class='gameText'>" +
							"<span class='gameName'>" + $UI.htmlEncode(gameRecord.name) + "</span><br/>" +
							"<span class='gameDesc'>" + $UI.htmlEncode(gameRecord.joinInstructions) + "</span>" +
							"<div class='playButton mediumButton136Y'>Join</div>" +
						"</div>" +
						"<div class='gameInfo'><table>" +
							"<tr><th>scenario</th><td>" + $UI.htmlEncode(gameRecord.scenarioName) + "</td></tr>" +
							"<tr><th>players</th><td>" + $UI.htmlEncode(gameRecord.playerCount) + "</td></tr>" +
							"<tr><th>ID</th><td>" + $UI.htmlEncode(gameRecord.scenarioID + " release " + gameRecord.scenarioRelease) + "</td></tr>" +
						"</table></div>" +
					"</div>"
					);

				gameRow.appendTo(pageBody);
				
				//	Add an event to play
				
				var button = gameRow.find(".playButton").click(function () {
					
					//	Navigate
					
					window.location.href = "joinGame.hexm?gameID=" + encodeURIComponent(gameRecord.gameID);
					});

				entryCount++;
				});
			}
		
		//	Ask for a list of scenarios to create.
		
		$.getJSON("/api/scenarioList", { authToken: $UserInfo.authToken }, function (data) {
			
			//	LATER: Remove wait animation
			
			//	If this is an error then we report it
			
			if ($Hexarc.isError(data))
				{
				pageBody.append("<p class='error'>" + $Hexarc.errorGetText(data) + "</p>");
				return;
				}
				
			//	Otherwise, fill in the scenario table. We iterate over each
			//	scenario returned by the service and add a div row to the page.
			
			if (data != null)
				{
				$.each(data, function (index, scena) {
					var scenarioRow = $(
						"<div class='scenarioRow'>" +
							"<div class='scenarioIcon'>" +
								"<img src='res/ScenarioIconBlank.png'/>" +
							"</div>" +
							"<div class='scenarioText'>" +
								"<span class='scenarioName'>" + scena.name + "</span><br/>" +
								"<span class='scenarioDesc'>" + scena.description + "</span>" +
								"<div class='createButton mediumButton136Y'>Create</div>" +
							"</div>" +
							"<div class='scenarioInfo'><table>" +
								"<tr><th>players</th><td>" + $UI.htmlEncode(scena.players[0] + "-" + scena.players[1]) + "</td></td>" +
								"<tr><th>difficulty</th><td>" + $UI.htmlEncode(scena.difficulty) + "</td></td>" +
								"<tr><th>worlds</th><td>" + $UI.htmlEncode(scena.worlds) + "</td></td>" +
								"<tr><th>map size</th><td>" + $UI.htmlEncode(scena.mapSize[0]) + "&times;" + $UI.htmlEncode(scena.mapSize[1]) + " light-years</td></td>" +
							"</table></div>" +
						"</div>"
						);

					scenarioRow.appendTo(pageBody);
				
					//	Add an event to create the scenario
				
					var button = scenarioRow.find(".createButton").click(function () {
					
						//	Store the scenario in session storage (so that the next page
						//	can get it).
					
						sessionStorage.startNewParams = JSON.stringify(scena);
					
						//	Navigate
					
						window.location.href = "createGame.hexm?scenarioID=" + encodeURIComponent(scena.scenarioID) + "&release=" + encodeURIComponent(scena.scenarioRelease);
						});

					entryCount++;
					});
				}

			//	If no entries were created then add error text

			if (entryCount == 0)
				{
				var noGames = $(
					"<div class='gameRow'>" +
						"<div class='gameIcon'>" +
							"<img src='res/ScenarioIconBlank.png'/>" +
						"</div>" +
						"<div class='gameText'>" +
							"<span class='gameName'>No Games Available</span><br/>" +
							"<span class='gameDesc'>We're sorry, the Alpha Release has a limited number of player slots and all are currently filled. Please check the <a href='http://www.facebook.com/groups/64705270989/'>Anacreon Facebook group</a> for information on when more slots might become available.</span>" +
						"</div>" +
					"</div>" +
					"<p style='height:400px'></p>"
					);

				noGames.appendTo(pageBody);
				}

			//	If there are not enough entries then add some blank space

			else if (entryCount < 3)
				{
				pageBody.append("<p style='height:" + (3 - entryCount) * 200 + "px;'></p>");
				}
			});
		});
	});
