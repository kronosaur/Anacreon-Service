//	creategamepage.js
//
//	Implements UI for Anacreon 3
//	Copyright (c) 2012 Kronosaur Productions, LLC. All Rights Reserved.

$(document).ready(function () {

	//	Nothing to do if not signed in

	if ($UserInfo == null)
		return;

	//	If we error loading scenario, then report it

	if ($ScenaInfo.error)
		{
		$("#scenarioName").html($ScenaInfo.scenarioID);
		$("#scenarioInstructions").html($ScenaInfo.error);
		return;
		}

	//	Create the form based on the scenario

	$("#scenarioName").html($ScenaInfo.name);
	$("#scenarioInstructions").html($ScenaInfo.createInstructions);
	$(".ctrlGameName").val($ScenaInfo.name);
	$(".ctrlJoinInstructions").val($ScenaInfo.createInstructions);

	//	Add script to the create button
		
	$("#createButton").click(function () {
		
		//	Create game structure
			
		var gameCreate = {
			authToken: $UserInfo.authToken,
			scenarioID: $ScenaInfo.scenarioID,
			scenarioRelease: $ScenaInfo.scenarioRelease,
			//	LATER: For now we can only create MMO games
			playerInvite: "open",
			gameName: $(".ctrlGameName").val(),
			joinInstructions: $(".ctrlJoinInstructions").val(),
			};
		
		//	Make a call to create the game.
			
		var request = $.ajax({
			url: "/api/createGame",
			type: "POST",
			data: JSON.stringify(gameCreate),
			contentType: "application/json",
			dataType: "json",
			});

		request.done(function (data) {
			
			//	If this is an error then we report it
				
			if ($Hexarc.isError(data))
				{
				$("#scenarioInstructions").empty();
				$("#scenarioInstructions").text($Hexarc.errorGetText(data));
				return;
				}
			
			//	navigate to the join page, in case we want to join the game.
				
			window.location.href = "createGameStatus.hexm?gameID=" + encodeURIComponent(data);
			});
		});
	});
