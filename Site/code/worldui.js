//	worldui.js
//
//	Implements UI for managing worlds
//	Copyright (c) 2012 Kronosaur Productions, LLC. All Rights Reserved.

function abdicateDialog ()
	{
	if ($Anacreon.waitingForUpdate)
		return;

	//	Abdicate

	confirmDialog({
		dlgMessage: "This will dissolve your entire empire and you will not be able to recover it. Are you sure you wish to abdicate?",
		dlgOKLabel: "Abdicate",

		commandURL: "/api/abdicate",
		getCommandParams: (function () {
			return {
				authToken: $UserInfo.authToken, 
				gameID: $Anacreon.gameID,
				sovereignID: $Anacreon.userInfo.sovereignID,
				sequence: $Anacreon.seq
				};
			}),
		});
	}

function confirmDialog (desc)
	{
	function cleanUp ()
		{
		$("#dlgConfirm .ctrlCancel").off("click");
		$("#dlgConfirm .ctrlOK").off("click");
	
		$UI.exitDialog();
		}
		
	function doCancel ()
		{
		cleanUp();
		}

	function doOK ()
		{
		if (desc.commandURL)
			{
			if ($Anacreon.waitingForUpdate)
				return;

			$Anacreon.waitingForUpdate = true;
		
			var request = $.ajax({
				url: desc.commandURL,
				type: "POST",
				data: JSON.stringify(desc.getCommandParams()),
				contentType: "application/json",
				dataType: "json",
			
				success: (function (data) {
					$Anacreon.waitingForUpdate = false;

					if ($Hexarc.isError(data))
						{
						$UI.showDialogError($Hexarc.getErrorMessage(data));
						}
					else
						{
						cleanUp();

						$Anacreon.processUpdate(data);
						$Map.initMapView($Map.curMetrics);
						$Map.refreshSelectionView();

						if (desc.onSuccess)
							desc.onSuccess();
						}
					}),

				error: (function (jqXHR, textStatus, errorThrown) {
					$Anacreon.waitingForUpdate = false;
					$UI.showDialogError(errorThrown);
					})
				});
			}
		}
		
	function onKeydown (e)
		{
		//	Handle normal dialog keyboard codes
		
		switch (e.which)
			{
			case KEY_ESCAPE:
				{
				doCancel();
				break;
				}
				
			case KEY_ENTER:
				{
				doOK();
				break;
				}
			}
		}

	//	confirmDialog ----------------------------------------------------------

	//	Initialize

	$("#dlgConfirm .dlgLabel").text((desc.dlgMessage ? desc.dlgMessage : "Are you sure?"));
	$("#dlgConfirm .ctrlOK").text((desc.dlgOKLabel ? desc.dlgOKLabel : "OK"));

	//	Show the dialog box.
	
	$UI.enterDialog("#dlgConfirm");
	
	//	Buttons
	
	$("#dlgConfirm .ctrlCancel").on("click", doCancel);
	$("#dlgConfirm .ctrlOK").on("click", doOK);

	//	Keyboard UI

	$UI.keydown(onKeydown);
//	$UI.keypress(onKeypress);
	}

function infoDialog (desc)
	{
	function cleanUp ()
		{
		$("#dlgInfo .ctrlOKCentered").off("click");
	
		$UI.exitDialog();
		}
		
	function doOK ()
		{
		cleanUp();
		}
		
	function onKeydown (e)
		{
		//	Handle normal dialog keyboard codes
		
		switch (e.which)
			{
			case KEY_ESCAPE:
			case KEY_ENTER:
				{
				doOK();
				break;
				}
			}
		}

	//	confirmDialog ----------------------------------------------------------

	//	Initialize

	$("#dlgInfo .dlgLabel").text((desc.dlgMessage ? desc.dlgMessage : "I'm sorry, I can't do that."));
	$("#dlgInfo .ctrlOKCentered").text((desc.dlgOKLabel ? desc.dlgOKLabel : "OK"));

	//	Show the dialog box.
	
	$UI.enterDialog("#dlgInfo");
	
	//	Buttons
	
	$("#dlgInfo .ctrlOKCentered").on("click", doOK);

	//	Keyboard UI

	$UI.keydown(onKeydown);
	}

function objRename (obj, newName)
	{
	$Anacreon.waitingForUpdate = true;
				
	var params = {
		authToken: $UserInfo.authToken, 
		gameID: $Anacreon.gameID,
		sovereignID: $Anacreon.userInfo.sovereignID,
		objID: obj.id,
		name: newName,
		sequence: $Anacreon.seq
		};

	var request = $.ajax({
		url: "/api/renameObject",
		type: "POST",
		data: JSON.stringify(params),
		contentType: "application/json",
		dataType: "json",

		success: (function (data) {
			$Anacreon.waitingForUpdate = false;

			if ($Hexarc.isError(data))
				{
				$Map.addEffect(new TextMapEffect(obj.pos[0], obj.pos[1], $Hexarc.getErrorMessage(data)));
				}
			else
				$Anacreon.processUpdate(data);

			$Map.initMapView($Map.curMetrics);
			$Map.refreshSelectionView();
			}),

		error: (function (jqXHR, textStatus, errorThrown) {
			$Anacreon.waitingForUpdate = false;
			})
		});
	}

function restartGame ()
	{
	$Anacreon.waitingForUpdate = true;
				
	var params = {
		authToken: $UserInfo.authToken, 
		gameID: $Anacreon.gameID,
		sovereignID: ($Anacreon.userInfo ? $Anacreon.userInfo.sovereignID : null),
		};

	var request = $.ajax({
		url: "/api/leaveGame",
		type: "POST",
		data: JSON.stringify(params),
		contentType: "application/json",
		dataType: "json",

		success: (function (data) {
			$Anacreon.waitingForUpdate = false;

			if ($Hexarc.isError(data))
				{
				//	LATER: For now we don't need to display an error.
				}

			//	Restart

			window.location.href = "/";
			}),

		error: (function (jqXHR, textStatus, errorThrown) {
			$Anacreon.waitingForUpdate = false;
			})
		});
	}

function sendMessageDialog (sovereignID)
	{
	function cleanUp ()
		{
		$("#dlgSendMessage .ctrlCancel").off("click");
		$("#dlgSendMessage .ctrlOK").off("click");
		
		$UI.exitDialog();
		}
	
	function doCancel ()
		{
		cleanUp();
		}

	function doOK (e)
		{
		if ($Anacreon.waitingForUpdate)
			return;
		
		$Anacreon.waitingForUpdate = true;

		var messageText = $("#dlgSendMessage .dlgTextBlock").val();
		var params = {
            authToken: $UserInfo.authToken,
 			gameID: $Anacreon.gameID,
			sovereignID: $Anacreon.userInfo.sovereignID,
			recipientID: sovereignID,
			messageText: messageText,
			};
			
		var request = $.ajax({
			url: "/api/sendMessage",
			type: "POST",
			data: JSON.stringify(params),
			contentType: "application/json",
			dataType: "json",
			
			success: (function (data) {
				$Anacreon.waitingForUpdate = false;

				if ($Hexarc.isError(data))
					{
					$UI.showDialogError($Hexarc.getErrorMessage(data));
					}
				else
					{
					cleanUp();
					}
				}),

			error: (function (jqXHR, textStatus, errorThrown) {
				$Anacreon.waitingForUpdate = false;
				$UI.showDialogError(errorThrown);
				})
			});
		}

	//	sendMessageDialog ------------------------------------------------------

	var sovereign = $Anacreon.sovereignList[sovereignID];
	if (sovereign == null)
		return;

	//	Initialize controls

	$("#dlgSendMessage .ctrlLabel").text("Message to " + sovereign.name + ":");
	$("#dlgSendMessage .dlgTextBlock").val("");
	
	//	Show the dialog box.
	//	We start by graying out the page.
	
	$UI.enterDialog("#dlgSendMessage");

	//	Hook up the buttons
	
	$("#dlgSendMessage .ctrlCancel").on("click", doCancel);
	$("#dlgSendMessage .ctrlOK").on("click", doOK);

	//	Set the focus

	$("#dlgSendMessage .dlgTextBlock").focus();

	//	Keyboard UI

	$UI.keydown(onKeydown);
	}

function setDoctrineDialog (sovereign)
	{
	var canvas;
	var doctrineListCtrl;

	var yListControl = 30;
	var cxListControlTile = 96;
	var cyListControlTile = 96;
	var cySpacing = 13;
	var xInfo = 0;
	var yInfo = yListControl + cyListControlTile + cySpacing;
	var cxInfo = 800;
	var cyInfo = 300;
	
	function cleanUp ()
		{
		$("#dlgSetDoctrine .ctrlCancel").off("click");
		$("#dlgSetDoctrine .ctrlOK").off("click");
		
		doctrineListCtrl.destroy();
		doctrineListCtrl = null;
		
		$UI.exitDialog();
		}
	
	function doCancel ()
		{
		cleanUp();
		}

	function doOK (e)
		{
		var i;
		
		var newDoctrine = e.data.longList.getSelectionID();
		if (newDoctrine == sovereign.getDoctrineID())
			{
			cleanUp();
			return;
			}
		
		if ($Anacreon.waitingForUpdate)
			return;

		$Anacreon.waitingForUpdate = true;
		
		var params = {
			authToken: $UserInfo.authToken, 
            gameID: $Anacreon.gameID,
			sovereignID: $Anacreon.userInfo.sovereignID,
			newDoctrine: newDoctrine,
			sequence: $Anacreon.seq
			};
			
		var request = $.ajax({
			url: "/api/setDoctrine",
			type: "POST",
			data: JSON.stringify(params),
			contentType: "application/json",
			dataType: "json",
			
			success: (function (data) {
				$Anacreon.waitingForUpdate = false;

				if ($Hexarc.isError(data))
					{
					$UI.showDialogError($Hexarc.getErrorMessage(data));
					}
				else
					{
					cleanUp();

					$Anacreon.processUpdate(data);
					$Map.initMapView($Map.curMetrics);
					$Map.refreshSelectionView();
					}
				}),

			error: (function (jqXHR, textStatus, errorThrown) {
				$Anacreon.waitingForUpdate = false;
				$UI.showDialogError(errorThrown);
				})
			});
		}

	function drawInfo (canvas, designType, x, y, cxWidth, cyHeight)
		{
		var ctx = canvas[0].getContext("2d");

		//	Clear

		ctx.clearRect(x, y, cxWidth, cyHeight);

		//	Metrics

		var xText = x + (cxWidth / 2);
		var yText = y;

		//	Draw the name first

		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.font = $Style.tileFontExtraLarge;
		ctx.textBaseline = "top";
		ctx.textAlign = "center";
		ctx.fillText(designType.nameDesc, xText, yText);
		yText += $Style.tileFontExtraLargeHeight;
		yText += 20;

		//	Draw the image

		var cxImage = 128;
		var cyImage = 128;
		var xImage = xText - (cxImage / 2);
		var yImage = yText;
		designType.paintIconMedium(ctx, xImage, yImage, cxImage, cyImage);

		//	Draw description text

		var xDesc = xImage - 20;
		var yDesc = yText + 20;
		var cxDesc = xDesc - 20;

		ctx.font = $Style.tileFontMedium;
		ctx.textBaseline = "top";
		ctx.textAlign = "right";
		ctx.fillStyle = $Style.tileTextNormal;

		var description = designType.description;
		$UI.drawText(ctx, xDesc, yDesc, cxDesc, $Style.tileFontMediumHeight, description);

		//	Draw some stats

		var xStat = xImage + cxImage + 20;
		var yStat = yDesc;

		ctx.font = $Style.tileFontMedium;
		ctx.textAlign = "left";

		var capitalIndustry = $Anacreon.designTypes[designType.capitalIndustry];
		if (capitalIndustry)
			{
			InfoPaneHelper.paintSmallStat(ctx, xStat, yStat, "capital industry", capitalIndustry.nameDesc);
			yStat += $Style.tileFontMediumHeight;
			}
		}
		
	function onKeydown (e)
		{
		if ($Anacreon.waitingForUpdate)
			return;

		//	Handle normal dialog keyboard codes
		
		switch (e.which)
			{
			case KEY_ESCAPE:
				{
				doCancel();
				break;
				}
				
			case KEY_ENTER:
				{
				doOK(e);
				break;
				}

			case KEY_ARROW_RIGHT:
				{
				doctrineListCtrl.selectNext();
				break;
				}
				
			case KEY_ARROW_LEFT:
				{
				doctrineListCtrl.selectPrev();
				break;
				}
			}
		}
		
	function onSelectionChanged (newSelectionID)
		{
		drawInfo(canvas, $Anacreon.designTypes[newSelectionID], xInfo, yInfo, cxInfo, cyInfo);

		$UI.hideDialogError();
		}

	//	setDoctrineDialog ------------------------------------------------------
	
	var i, j;
	
	canvas = $("#dlgSetDoctrine .ctrlDoctrineList");

	//	Show the dialog box.
	//	We start by graying out the page.
	
	$UI.enterDialog("#dlgSetDoctrine");

	//	Create a list of all doctrines for the empire
	
	var listDesc = {
		content: [ ],
		sortList: true,

		yPos: yListControl,

		onSelectionChanged: onSelectionChanged,
		};

	var ourCapital = sovereign.getCapital();

	for (i = 0; i < $Anacreon.designTypes.length; i++)
		{
		var type = $Anacreon.designTypes[i];
		if (type != null 
				&& type.category == "doctrine"
				&& ourCapital != null 
				&& (type.capitalType == null || ourCapital.canBeDesignatedTo($Anacreon.designTypes[type.capitalType]))
				&& !type.npeOnly)
			{
			//	Add it

			listDesc.content.push({
				id: type.id,
				image: type.imageSmall,
				label: type.nameDesc
				});
			}
		}

	//	Create control
		
	doctrineListCtrl = new CanvasLongList(canvas, listDesc, null);
	if (sovereign.getDoctrineID())
		doctrineListCtrl.selectByID(sovereign.getDoctrineID());

	//	Draw

	drawInfo(canvas, $Anacreon.designTypes[doctrineListCtrl.getSelectionID()], xInfo, yInfo, cxInfo, cyInfo);
	
	//	Hook up the buttons
	
	$("#dlgSetDoctrine .ctrlCancel").on("click", doCancel);
	$("#dlgSetDoctrine .ctrlOK").on("click", { longList: doctrineListCtrl }, doOK);

	//	Keyboard UI

	$UI.keydown(onKeydown, { longList: doctrineListCtrl });
	}

function uiSettingsDialog (desc)
	{
	function cleanUp ()
		{
		$("#dlgUISettings .ctrlCancel").off("click");
		$("#dlgUISettings .ctrlOK").off("click");
	
		$UI.exitDialog();
		}
		
	function doCancel ()
		{
		cleanUp();
		}

	function doOK ()
		{
		if ($Anacreon.waitingForUpdate)
			return;

		//	Set options

		$Anacreon.userInfo.uiOptions.noManeuveringTrails = !$("#dlgUISettings .ctrlShowManeuveringTrails").attr("checked");

		//	Save options to the server

		$Anacreon.waitingForUpdate = true;
		
		var params = {
            authToken: $UserInfo.authToken,
 			gameID: $Anacreon.gameID,
			sovereignID: $Anacreon.userInfo.sovereignID,
			uiOptions: $Anacreon.userInfo.uiOptions,
			};
			
		var request = $.ajax({
			url: "/api/setUIOptions",
			type: "POST",
			data: JSON.stringify(params),
			contentType: "application/json",
			dataType: "json",
			
			success: (function (data) {
				$Anacreon.waitingForUpdate = false;

				if ($Hexarc.isError(data))
					{
					$UI.showDialogError($Hexarc.getErrorMessage(data));
					}
				else
					{
					cleanUp();

					$Map.initMapView($Map.curMetrics);
					$Map.refreshSelectionView();
					}
				}),

			error: (function (jqXHR, textStatus, errorThrown) {
				$Anacreon.waitingForUpdate = false;
				$UI.showDialogError(errorThrown);
				})
			});
		}
		
	function onKeydown (e)
		{
		//	Handle normal dialog keyboard codes
		
		switch (e.which)
			{
			case KEY_ESCAPE:
				{
				doCancel();
				break;
				}
				
			case KEY_ENTER:
				{
				doOK();
				break;
				}
			}
		}

	//	confirmDialog ----------------------------------------------------------

	//	Initialize based on current settings

	$("#dlgUISettings .ctrlShowManeuveringTrails").attr("checked", ($Anacreon.userInfo.uiOptions.noManeuveringTrails ? false : true));

	//	Show the dialog box.
	
	$UI.enterDialog("#dlgUISettings");
	
	//	Buttons
	
	$("#dlgUISettings .ctrlCancel").on("click", doCancel);
	$("#dlgUISettings .ctrlOK").on("click", doOK);

	//	Keyboard UI

	$UI.keydown(onKeydown);
//	$UI.keypress(onKeypress);
	}

function setHistoryRead (historyID)
	{
	$Anacreon.waitingForUpdate = true;
				
	var params = {
		authToken: $UserInfo.authToken, 
		gameID: $Anacreon.gameID,
		sovereignID: $Anacreon.userInfo.sovereignID,
		historyID: historyID,
		};

	var request = $.ajax({
		url: "/api/setHistoryRead",
		type: "POST",
		data: JSON.stringify(params),
		contentType: "application/json",
		dataType: "json",

		success: (function (data) {
			$Anacreon.waitingForUpdate = false;

			if ($Hexarc.isError(data))
				{
				//	LATER: For now we don't need to display an error.
				}
			}),

		error: (function (jqXHR, textStatus, errorThrown) {
			$Anacreon.waitingForUpdate = false;
			})
		});
	}

function worldAddTradeRoute (sourceObj, destObj)
	{
	if (sourceObj == null
			|| sourceObj["class"] != "world"
			|| destObj == null
			|| destObj["class"] != "world")
		return;

	//	Set route
	
	$Anacreon.waitingForUpdate = true;
				
	var params = {
		authToken: $UserInfo.authToken, 
		gameID: $Anacreon.gameID,
		sovereignID: $Anacreon.userInfo.sovereignID,
		objID: sourceObj.id,
		sourceObjID: destObj.id,
		allocType: (sourceObj.sovereignID == destObj.sovereignID ? "addDefaultRoute" : "addExportRoute"),
		sequence: $Anacreon.seq
		};

	var request = $.ajax({
		url: "/api/setTradeRoute",
		type: "POST",
		data: JSON.stringify(params),
		contentType: "application/json",
		dataType: "json",

		success: (function (data) {
			$Anacreon.waitingForUpdate = false;

			if ($Hexarc.isError(data))
				{
				$Map.addEffect(new TextMapEffect(destObj.pos[0], destObj.pos[1], $Hexarc.getErrorMessage(data)));
				$Map.refreshSelectionView();
				}
			else
				{
				var i;

				$Anacreon.processUpdate(data);
				$Map.initMapView($Map.curMetrics);
				$Map.refreshSelectionView();

				//	If this is a selling route to another empire, then select 
				//	the route and bring up the sell dialog box.

				if (sourceObj.sovereignID != destObj.sovereignID)
					{
					//	We've updated the objects, so we need to refresh

					destObj = $Anacreon.objList[destObj.id];
					sourceObj = $Anacreon.objList[sourceObj.id];

					//	Look for the route from buyer (destObj) to seller (sourceObj)

					var tradeRoute = null;
					for (i = 0; i < destObj.tradeRoutes.length; i++)
						{
						var theRoute = destObj.tradeRoutes[i];
						if (!theRoute["return"]
								&& theRoute.partnerObjID == sourceObj.id)
							{
							tradeRoute = theRoute;
							break;
							}
						}

					if (tradeRoute == null)
						return;

					//	Select the trade route

					var tradeRouteObj = new TradeRouteObject(destObj, tradeRoute);
					$Map.selectObject(tradeRouteObj);

					//	Figure out which resources we can sell

					var resToSell = sourceObj.calcResourcesToSell(tradeRoute);
					if (resToSell == null)
						{
						infoDialog({ dlgMessage: "You have no other resource types to sell. Import more resource types to " + sourceObj.name + "."});
						return;
						}

					//	Bring up the dialog box

					worldSellResourcesDialog(sourceObj, destObj, null, resToSell);
					}
				}
			}),

		error: (function (jqXHR, textStatus, errorThrown) {
			$Anacreon.waitingForUpdate = false;
			})
		});
	}

function worldBuildImprovementDialog (sourceObj)
	{
	var canvas;
	var improvementListCtrl;
	
	var yListControl = 30;
	var cxListControlTile = 96;
	var cyListControlTile = 96;
	var cySpacing = 13;
	var xInfo = 0;
	var yInfo = yListControl + cyListControlTile + cySpacing;
	var cxInfo = 800;
	var cyInfo = 300;

	function cleanUp ()
		{
		$("#dlgBuildImprovement .ctrlCancel").off("click");
		$("#dlgBuildImprovement .ctrlOK").off("click");
		
		improvementListCtrl.destroy();
		improvementListCtrl = null;
		
		$UI.exitDialog();
		}
	
	function drawInfo (canvas, designType, x, y, cxWidth, cyHeight)
		{
		var ctx = canvas[0].getContext("2d");

		//	Clear

		ctx.clearRect(x, y, cxWidth, cyHeight);

		//	Metrics

		var xText = x + (cxWidth / 2);
		var yText = y;

		//	Draw the name first

		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.font = $Style.tileFontExtraLarge;
		ctx.textBaseline = "top";
		ctx.textAlign = "center";
		ctx.fillText(designType.nameDesc, xText, yText);
		yText += $Style.tileFontExtraLargeHeight;
		yText += 20;

		//	Draw the image

		var cxImage = 128;
		var cyImage = 128;
		var xImage = xText - (cxImage / 2);
		var yImage = yText;
		ctx.fillStyle = "#606060";
		ctx.fillRect(xImage, yImage, cxImage, cyImage);

		//	Draw description text

		var xDesc = xImage - 20;
		var yDesc = yText + 20;
		var cxDesc = xDesc - 20;

		ctx.font = $Style.tileFontMedium;
		ctx.textBaseline = "top";
		ctx.textAlign = "right";
		ctx.fillStyle = $Style.tileTextNormal;

		var description = designType.description;
		$UI.drawText(ctx, xDesc, yDesc, cxDesc, $Style.tileFontMediumHeight, description);

		//	Draw some stats

		var xStat = xImage + cxImage + 20;
		var yStat = yDesc;

		ctx.font = $Style.tileFontMedium;
		ctx.textAlign = "left";

		InfoPaneHelper.paintSmallStat(ctx, xStat, yStat, "build time", $Anacreon.formatDuration(designType.buildTime));
		yStat += $Style.tileFontMediumHeight;

		InfoPaneHelper.paintSmallStat(ctx, xStat, yStat, "minimum tech level", designType.minTechLevel);
		yStat += $Style.tileFontMediumHeight;
		}
		
	function doCancel ()
		{
		cleanUp();
		}

	function doOK (e)
		{
		var i;
		
		if ($Anacreon.waitingForUpdate)
			return;
		
		$Anacreon.waitingForUpdate = true;
		
		var params = {
            authToken: $UserInfo.authToken,
 			gameID: $Anacreon.gameID,
			sovereignID: $Anacreon.userInfo.sovereignID,
			sourceObjID: sourceObj.id,
			improvementID: e.data.longList.getSelectionID(),
			sequence: $Anacreon.seq
			};
			
		var request = $.ajax({
			url: "/api/buildImprovement",
			type: "POST",
			data: JSON.stringify(params),
			contentType: "application/json",
			dataType: "json",
			
			success: (function (data) {
				$Anacreon.waitingForUpdate = false;

				if ($Hexarc.isError(data))
					{
					$UI.showDialogError($Hexarc.getErrorMessage(data));
					}
				else
					{
					cleanUp();

					$Anacreon.processUpdate(data);
					$Map.initMapView($Map.curMetrics);
					$Map.refreshSelectionView();
					}
				}),

			error: (function (jqXHR, textStatus, errorThrown) {
				$Anacreon.waitingForUpdate = false;
				$UI.showDialogError(errorThrown);
				})
			});
		}
		
	function onKeydown (e)
		{
		if ($Anacreon.waitingForUpdate)
			return;

		//	Handle normal dialog keyboard codes
		
		switch (e.which)
			{
			case KEY_ESCAPE:
				{
				doCancel();
				break;
				}
				
			case KEY_ENTER:
				{
				doOK(e);
				break;
				}

			case KEY_ARROW_RIGHT:
				{
				improvementListCtrl.selectNext();
				break;
				}
				
			case KEY_ARROW_LEFT:
				{
				improvementListCtrl.selectPrev();
				break;
				}
			}
		}
		
	function onSelectionChanged (newSelectionID)
		{
		drawInfo(canvas, $Anacreon.designTypes[newSelectionID], xInfo, yInfo, cxInfo, cyInfo);

		$UI.hideDialogError();
		}

	//	worldBuildImprovementDialog --------------------------------------------
	
	canvas = $("#dlgBuildImprovement .ctrlImprovementList");

	//	Show the dialog box.
	//	We start by graying out the page.
	
	$UI.enterDialog("#dlgBuildImprovement");
	
	//	Create a list of all improvements for this world
	
	var listDesc = 
		{
		content: sourceObj.getValidImprovementList(),

		yPos: yListControl,

		onSelectionChanged: onSelectionChanged,
		};
		
	//	Create control
		
	improvementListCtrl = new CanvasLongList(canvas, listDesc, null);
	
	//	Draw

	if (listDesc.content.length > 0)
		drawInfo(canvas, $Anacreon.designTypes[listDesc.content[0].id], xInfo, yInfo, cxInfo, cyInfo);
	
	//	Hook up the buttons
	
	$("#dlgBuildImprovement .ctrlCancel").on("click", doCancel);
	$("#dlgBuildImprovement .ctrlOK").on("click", { longList: improvementListCtrl }, doOK);

	//	Keyboard UI

	$UI.keydown(onKeydown, { longList: improvementListCtrl });
	}

function worldBuyDialog (sourceObj)
	{
	var canvas;
	var itemListCtrl;

	var xHeader = 0;
	var yHeader = 10;
	var cyHeader = 32;
	var cxHeaderIcon = 32;
	var cySpacing = 13;
	var yListControl = yHeader + cyHeader + cySpacing;
	var cxListControlTile = 96;
	var cyListControlTile = 96;
	var xInfo = 0;
	var yInfo = yListControl + cyListControlTile + cySpacing;
	var cxInfo = 800;
	var cyInfo = 300;

	var sellingSovereign = $Anacreon.sovereignList[sourceObj.sovereignID];
	var buyingSovereign = $Anacreon.sovereignList[$Anacreon.userInfo.sovereignID];

	var bureauOfTrade = sellingSovereign.hasBureauOfTrade();
	if (bureauOfTrade == null || bureauOfTrade.sellPrices == null)
		return;

	var fundsLeft;
	if (buyingSovereign.funds && buyingSovereign.funds.length > 0)
		fundsLeft = buyingSovereign.funds[1];
	else
		fundsLeft = 0;

	function cleanUp ()
		{
		$("#dlgBuy .ctrlCancel").off("click");
		$("#dlgBuy .ctrlOK").off("click");
		
		itemListCtrl.destroy();
		itemListCtrl = null;
		
		$UI.exitDialog();
		}
	
	function doCancel ()
		{
		cleanUp();
		}

	function doOK (e)
		{
		var i;
		var tile = itemListCtrl.getSelection();
		var itemToBuy = tile.id;
		var itemCount = tile.data.count;
		
		if ($Anacreon.waitingForUpdate)
			return;

		$Anacreon.waitingForUpdate = true;
		
		var params = {
            authToken: $UserInfo.authToken,
 			gameID: $Anacreon.gameID,
			sovereignID: $Anacreon.userInfo.sovereignID,
			sourceObjID: sourceObj.id,
			itemID: itemToBuy,
			itemCount: itemCount,
			sequence: $Anacreon.seq
			};
			
		var request = $.ajax({
			url: "/api/buyItem",
			type: "POST",
			data: JSON.stringify(params),
			contentType: "application/json",
			dataType: "json",
			
			success: (function (data) {
				$Anacreon.waitingForUpdate = false;

				if ($Hexarc.isError(data))
					{
					$UI.showDialogError($Hexarc.getErrorMessage(data));
					}
				else
					{
					cleanUp();

					$Anacreon.processUpdate(data);
					$Map.initMapView($Map.curMetrics);
					$Map.refreshSelectionView();
					}
				}),

			error: (function (jqXHR, textStatus, errorThrown) {
				$Anacreon.waitingForUpdate = false;
				$UI.showDialogError(errorThrown);
				})
			});
		}

	function drawHeader (canvas)
		{
		var ctx = canvas[0].getContext("2d");

		//	Clear

		ctx.clearRect(xHeader, yHeader, cxInfo, cyHeader);

		//	Selling sovereign icon

		ctx.fillStyle = "#606060";
		ctx.fillRect(xHeader, yHeader, cxHeaderIcon, cyHeader);

		//	Now the sovereign name

		var xText = xHeader + cxHeaderIcon + $Style.cxTilePadding;
		var yText = yHeader;

		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.font = $Style.tileFontLarge;
		ctx.textBaseline = "top";
		ctx.textAlign = "left";
		ctx.fillText(sellingSovereign.name, xText, yText);
		yText += $Style.tileFontLargeHeight;

		//	Paint some stats

		ctx.font = $Style.tileFontSmall;
		InfoPaneHelper.paintSmallStat(ctx, xText, yText, "trading hub", sourceObj.name);
		yText += $Style.tileFontSmallHeight;

		//	Now paint the number of aes available

		xText = cxInfo;
		yText = yHeader;

		ctx.font = $Style.tileFontSmall;
		ctx.fillStyle = $Style.tileTextNormal;
		ctx.textAlign = "right";
		ctx.fillText("aes available:", xText, yText);
		yText += $Style.tileFontSmallHeight;

		ctx.font = $Style.tileFontExtraLargeBold;
		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.fillText($Anacreon.formatNumberAsInteger(fundsLeft), xText, yText);
		}

	function drawInfo (canvas, tile, x, y, cxWidth, cyHeight)
		{
		var i;
		var ctx = canvas[0].getContext("2d");
		var designType = $Anacreon.designTypes[tile.id];

		//	Clear

		ctx.clearRect(x, y, cxWidth, cyHeight);

		//	Metrics

		var xText = x + (cxWidth / 2);
		var yText = y;

		//	Draw the name first

		var nameText = $Anacreon.formatNumberAsInteger(tile.data.count) + " " + designType.nameDesc;
		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.font = $Style.tileFontExtraLarge;
		ctx.textBaseline = "top";
		ctx.textAlign = "center";
		ctx.fillText(nameText, xText, yText);
		yText += $Style.tileFontExtraLargeHeight;
		yText += 10;

		//	Draw the image

		var cxImage = 256;
		var cyImage = 128;
		var xImage = xText - (cxImage / 2);
		var yImage = yText;
		designType.paintIconMedium(ctx, xImage, yImage, cxImage, cyImage);

		//	Draw description text

		var xDesc = xImage - 20;
		var yDesc = yText + 20;
		var cxDesc = xDesc - 20;

		ctx.textBaseline = "top";
		ctx.textAlign = "right";

		//	Find the price for this item

		var totalPrice = tile.data.price * tile.data.count;

		//	Draw the price

		var priceText = $Anacreon.formatNumberAsInteger(totalPrice);
		ctx.font = $Style.tileFontExtraLargeBold;
		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.fillText(priceText, xDesc, yDesc);
		yDesc += $Style.tileFontExtraLargeHeight;

		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = $Style.tileTextNormal;

		var description = "aes for " + $Anacreon.formatNumberAsInteger(tile.data.count) + " units";
		if (totalPrice > fundsLeft)
			description = description + "\n\nUnfortunately, you cannot afford the price.";
		$UI.drawText(ctx, xDesc, yDesc, cxDesc, $Style.tileFontMediumHeight, description);

		//	Draw some stats

		var xStat = xImage + cxImage + 20;
		var yStat = yText + 20;

		//	Compose stats

		var stats = (designType.stats ? $.extend(true, [], designType.stats) : []);

		if (designType.cargoSpace)
			stats.unshift("cargo space", designType.cargoSpace);

		if (designType.isCargo)
			stats.unshift("mass", designType.mass);

		if (designType.FTL)
			stats.unshift("FTL", designType.FTL);

		if (designType.attackValue)
			stats.unshift("power", designType.attackValue);

		//	Stats

		ctx.font = $Style.tileFontMedium;
		ctx.textAlign = "left";
		for (i = 0; i < stats.length; i += 2)
			{
			InfoPaneHelper.paintSmallStat(ctx, xStat, yStat, stats[i], stats[i + 1]);
			yStat += $Style.tileFontMediumHeight;
			}
		}
		
	function onKeydown (e)
		{
		if ($Anacreon.waitingForUpdate)
			return;

		//	Handle normal dialog keyboard codes
		
		switch (e.which)
			{
			case KEY_ESCAPE:
				{
				doCancel();
				break;
				}
				
			case KEY_ENTER:
				{
				doOK(e);
				break;
				}

			case KEY_ARROW_RIGHT:
				{
				itemListCtrl.selectNext();
				break;
				}
				
			case KEY_ARROW_LEFT:
				{
				itemListCtrl.selectPrev();
				break;
				}
			}
		}
		
	function onSelectionChanged (newSelectionID)
		{
		drawInfo(canvas, itemListCtrl.getSelection(), xInfo, yInfo, cxInfo, cyInfo);

		$UI.hideDialogError();
		}

	//	worldBuyDialog ---------------------------------------------------------
	
	var i, j;
	
	canvas = $("#dlgBuy .ctrlItemList");

	//	Create a list of all items that we're selling
	
	var listDesc = {
		content: [ ],

		yPos: yListControl,

		onSelectionChanged: onSelectionChanged,
		};

	for (i = 0; i < bureauOfTrade.sellPrices.length; i += 2)
		{
		var type = $Anacreon.designTypes[bureauOfTrade.sellPrices[i]];
		var price = bureauOfTrade.sellPrices[i + 1];

		listDesc.content.push({
			id: type.id,
			image: type.imageSmall,
			label: type.nameDesc,

			data: {
				price: price,
				count: 1000,
				},
			});
		}

	//	Sort by price

	listDesc.content.sort(function (a, b) { if (a.data.price < b.data.price) return -1; else if (a.data.price > b.data.price) return 1; else return 0; });

	//	Show the dialog box.
	//	We start by graying out the page.
	
	$UI.enterDialog("#dlgBuy");

	//	Create control

	itemListCtrl = new CanvasLongList(canvas, listDesc, null);

	//	Draw

	drawHeader(canvas);
	if (listDesc.content.length > 0)
		drawInfo(canvas, itemListCtrl.getSelection(), xInfo, yInfo, cxInfo, cyInfo);
	
	//	Hook up the buttons
	
	$("#dlgBuy .ctrlCancel").on("click", doCancel);
	$("#dlgBuy .ctrlOK").on("click", { longList: itemListCtrl }, doOK);

	//	Keyboard UI

	$UI.keydown(onKeydown, { longList: itemListCtrl });
	}

function worldDesignateDialog (sourceObj)
	{
	var canvas;
	var designationListCtrl;

	var yListControl = 30;
	var cxListControlTile = 96;
	var cyListControlTile = 96;
	var cySpacing = 13;
	var xInfo = 0;
	var yInfo = yListControl + cyListControlTile + cySpacing;
	var cxInfo = 800;
	var cyInfo = 300;
	
	function cleanUp ()
		{
		$("#dlgDesignateWorld .ctrlCancel").off("click");
		$("#dlgDesignateWorld .ctrlOK").off("click");
		
		designationListCtrl.destroy();
		designationListCtrl = null;
		
		$UI.exitDialog();
		}
	
	function doCancel ()
		{
		cleanUp();
		}

	function doOK (e)
		{
		var i;
		
		var newDesignation = e.data.longList.getSelectionID();
		if (newDesignation == sourceObj.designation)
			{
			cleanUp();
			return;
			}
		
		if ($Anacreon.waitingForUpdate)
			return;

		$Anacreon.waitingForUpdate = true;
		
		var params = {
			authToken: $UserInfo.authToken, 
            gameID: $Anacreon.gameID,
			sovereignID: $Anacreon.userInfo.sovereignID,
			sourceObjID: sourceObj.id,
			newDesignation: newDesignation,
			sequence: $Anacreon.seq
			};
			
		var request = $.ajax({
			url: "/api/designateWorld",
			type: "POST",
			data: JSON.stringify(params),
			contentType: "application/json",
			dataType: "json",
			
			success: (function (data) {
				$Anacreon.waitingForUpdate = false;

				if ($Hexarc.isError(data))
					{
					$UI.showDialogError($Hexarc.getErrorMessage(data));
					}
				else
					{
					cleanUp();

					$Anacreon.processUpdate(data);
					$Map.initMapView($Map.curMetrics);
					$Map.refreshSelectionView();
					}
				}),

			error: (function (jqXHR, textStatus, errorThrown) {
				$Anacreon.waitingForUpdate = false;
				$UI.showDialogError(errorThrown);
				})
			});
		}

    function drawError (canvas, title, desc, x, y, cxWidth, cyHeight)
        {
		var ctx = canvas[0].getContext("2d");

		//	Clear

		ctx.clearRect(x, y, cxWidth, cyHeight);

		//	Metrics

		var xText = x + (cxWidth / 2);
		var yText = y;

		//	Draw the title first

		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.font = $Style.tileFontExtraLarge;
		ctx.textBaseline = "top";
		ctx.textAlign = "center";
		ctx.fillText(title, xText, yText);
		yText += $Style.tileFontExtraLargeHeight;
		yText += 20;

		//	Draw the image

		var cxImage = 128;
		var cyImage = 128;
		var xImage = xText - (cxImage / 2);
		var yImage = yText;
		ctx.fillStyle = "#606060";
		ctx.fillRect(xImage, yImage, cxImage, cyImage);

		//	Draw description text

		var xDesc = xImage - 20;
		var yDesc = yText + 20;
		var cxDesc = xDesc - 20;

		ctx.font = $Style.tileFontMedium;
		ctx.textBaseline = "top";
		ctx.textAlign = "right";
		ctx.fillStyle = $Style.tileTextNormal;

		$UI.drawText(ctx, xDesc, yDesc, cxDesc, $Style.tileFontMediumHeight, desc);
        }

	function drawInfo (canvas, designType, x, y, cxWidth, cyHeight)
		{
		var ctx = canvas[0].getContext("2d");

		//	Clear

		ctx.clearRect(x, y, cxWidth, cyHeight);

		//	Metrics

		var xText = x + (cxWidth / 2);
		var yText = y;

		//	Draw the name first

		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.font = $Style.tileFontExtraLarge;
		ctx.textBaseline = "top";
		ctx.textAlign = "center";
		ctx.fillText(designType.nameDesc, xText, yText);
		yText += $Style.tileFontExtraLargeHeight;
		yText += 20;

		//	Draw the image

		var cxImage = 128;
		var cyImage = 128;
		var xImage = xText - (cxImage / 2);
		var yImage = yText;
		designType.paintIconMedium(ctx, xImage, yImage, cxImage, cyImage);

		//	Draw description text

		var xDesc = xImage - 20;
		var yDesc = yText + 20;
		var cxDesc = xDesc - 20;

		ctx.font = $Style.tileFontMedium;
		ctx.textBaseline = "top";
		ctx.textAlign = "right";
		ctx.fillStyle = $Style.tileTextNormal;

		var description = designType.description;
		$UI.drawText(ctx, xDesc, yDesc, cxDesc, $Style.tileFontMediumHeight, description);

		//	Draw some stats

		var xStat = xImage + cxImage + 20;
		var yStat = yDesc;

		ctx.font = $Style.tileFontMedium;
		ctx.textAlign = "left";

		InfoPaneHelper.paintSmallStat(ctx, xStat, yStat, "minimum tech level", designType.minTechLevel);
		yStat += $Style.tileFontMediumHeight;
		}
		
	function onKeydown (e)
		{
		if ($Anacreon.waitingForUpdate)
			return;

		//	Handle normal dialog keyboard codes
		
		switch (e.which)
			{
			case KEY_ESCAPE:
				{
				doCancel();
				break;
				}
				
			case KEY_ENTER:
				{
				doOK(e);
				break;
				}

			case KEY_ARROW_RIGHT:
				{
				designationListCtrl.selectNext();
				break;
				}
				
			case KEY_ARROW_LEFT:
				{
				designationListCtrl.selectPrev();
				break;
				}
			}
		}
		
	function onSelectionChanged (newSelectionID)
		{
		drawInfo(canvas, $Anacreon.designTypes[newSelectionID], xInfo, yInfo, cxInfo, cyInfo);

		$UI.hideDialogError();
		}

	//	worldDesignateDialog ---------------------------------------------------
	
	var i, j;
	
	canvas = $("#dlgDesignateWorld .ctrlDesignationList");

	//	Show the dialog box.
	//	We start by graying out the page.
	
	$UI.enterDialog("#dlgDesignateWorld");

	//	If we are within 5000 light-years of the imperial capital then we can
	//	be a sector capital.

	var sovereign = $Anacreon.sovereignList[$Anacreon.userInfo.sovereignID];
	var imperialCapital = sovereign.getCapital();
	var canBeSectorCapital = (imperialCapital && sourceObj.calcDistanceTo(imperialCapital) < 5000 && sourceObj.techLevel >= 5);

	//	If we are within 250 light-years of a sector capital then we can have
	//	other designation.

	var sectorCapital = sourceObj.getSectorCapital();
	var canDesignate = (sectorCapital && sourceObj.calcDistanceTo(sectorCapital) < 250);

	//	Create a list of all designations for this world
	
	var listDesc = {
		content: [ ],
		sortList: true,

		yPos: yListControl,

		onSelectionChanged: onSelectionChanged,
		};

	for (i = 0; i < $Anacreon.designTypes.length; i++)
		{
		var type = $Anacreon.designTypes[i];
		if (type != null 
				&& type.category == "designation"
				&& !type.npeOnly
				&& type.role != "imperialCapital"
				&& sourceObj.canBeDesignatedTo(type)
				&& (canDesignate
					|| (canBeSectorCapital && type.role == "sectorCapital")))
			{
			listDesc.content.push({
				id: type.id,
				image: type.imageSmall,
				label: type.nameDesc
				});
			}
		}

	//	Create control
		
	designationListCtrl = new CanvasLongList(canvas, listDesc, null);
	designationListCtrl.selectByID(sourceObj.designation);

	//	Draw

	if (listDesc.content.length > 0)
		drawInfo(canvas, $Anacreon.designTypes[designationListCtrl.getSelectionID()], xInfo, yInfo, cxInfo, cyInfo);
    else
        {
		//	If we cannot designate (no sector capital) and if we can't be
		//	a sector capital (because of tech) then say so.

        if (!canDesignate && !canBeSectorCapital)
    		drawError(canvas, "Unable to Designate", "To designate this world it must be within 250 light-years of an active sector capital. This world must be at least spacefaring tech level to be a sector capital.", xInfo, yInfo, cxInfo, cyInfo);

		//	Otherwise, if we could be a sector capital but the list is still
		//	empty, then it is likely because of our doctrine.

        else if (canBeSectorCapital)
    		drawError(canvas, "Unable to Designate", "You cannot create a starship-building sector capital inside a nebula.", xInfo, yInfo, cxInfo, cyInfo);

		//	Otherwise, we don't know.

		else
    		drawError(canvas, "Unable to designate", "For unknown reasons.", xInfo, yInfo, cxInfo, cyInfo);
        }
	
	//	Hook up the buttons
	
	$("#dlgDesignateWorld .ctrlCancel").on("click", doCancel);
	$("#dlgDesignateWorld .ctrlOK").on("click", { longList: designationListCtrl }, doOK);

	//	Keyboard UI

	$UI.keydown(onKeydown, { longList: designationListCtrl });
	}

function worldDestroyImprovement (sourceObj, improvementID)
	{
	if ($Anacreon.waitingForUpdate)
		return;

	//	Abdicate

	confirmDialog({
		dlgMessage: "Are you sure you wish to destroy this improvement?",
		dlgOKLabel: "Destroy",

		commandURL: "/api/destroyImprovement",
		getCommandParams: (function () {
			return {
				authToken: $UserInfo.authToken, 
				gameID: $Anacreon.gameID,
				sovereignID: $Anacreon.userInfo.sovereignID,
				sourceObjID: sourceObj.id,
				improvementID: improvementID,
				sequence: $Anacreon.seq
				};
			}),

		onSuccess: (function () {
			$Map.selectObjectByID(sourceObj.id, 1);
			}),
		});
	}

function worldEditIndustryAllocationDialog (sourceObj, industryID)
	{
	var cxObjImage = 64;
	var cyObjImage = 64;
	var editCtrl = $("#dlgEditIndustryAllocation .dlgEditControl .ctrlValue");

	function cleanUp ()
		{
		$("#dlgEditIndustryAllocation .ctrlCancel").off("click");
		$("#dlgEditIndustryAllocation .ctrlOK").off("click");
		
		$UI.exitDialog();
		}
	
	function doCancel ()
		{
		cleanUp();
		}

	function doOK (e)
		{
		var i;
		
		if ($Anacreon.waitingForUpdate)
			return;
		
		$Anacreon.waitingForUpdate = true;

		var params = {
		    authToken: $UserInfo.authToken, 
			gameID: $Anacreon.gameID,
			sovereignID: $Anacreon.userInfo.sovereignID,
			objID: sourceObj.id,
			industryID: industryID,
			allocValue: editCtrl.val(),
			sequence: $Anacreon.seq
			};

		var request = $.ajax({
			url: "/api/setIndustryAlloc",
			type: "POST",
			data: JSON.stringify(params),
			contentType: "application/json",
			dataType: "json",
			
			success: (function (data) {
				$Anacreon.waitingForUpdate = false;

				if ($Hexarc.isError(data))
					{
					$UI.showDialogError($Hexarc.getErrorMessage(data));
					}
				else
					{
					cleanUp();

					$Anacreon.processUpdate(data);
					$Map.initMapView($Map.curMetrics);
					$Map.refreshSelectionView();
					}
				}),

			error: (function (jqXHR, textStatus, errorThrown) {
				$Anacreon.waitingForUpdate = false;
				$UI.showDialogError(errorThrown);
				})
			});
		}

	function drawInfo (canvas, industryData)
		{
		var ctx = canvas[0].getContext("2d");

		var x = 0;
		var y = (90 - cyObjImage) / 2;

		//	Draw the industry tile

		ctx.fillStyle = "#606060";
		ctx.fillRect(x, y, cxObjImage, cyObjImage);

		//	Metrics

		var xText = x + cxObjImage + $Style.cxTilePadding;
		var cyText = $Style.tileFontExtraLargeHeight + 2 * $Style.tileFontMediumHeight;
		var yText = y + (cyObjImage - cyText) / 2;

		//	Name of industry

		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.font = $Style.tileFontExtraLarge;
		ctx.textBaseline = "top";
		ctx.textAlign = "left";
		ctx.fillText(industryData.industryType.nameDesc, xText, yText);
		yText += $Style.tileFontExtraLargeHeight;

		ctx.font = $Style.tileFontMedium;
		}
		
	function onKeydown (e)
		{
		switch (e.which)
			{
			case KEY_ESCAPE:
				{
				doCancel();
				break;
				}
				
			case KEY_ENTER:
				{
				doOK();
				break;
				}
			}
		}
		
	//	worldEditIndustryAllocationDialog --------------------------------------
	
	var i;
	
	var industryData = {
		industryID: industryID,
		industryType: $Anacreon.designTypes[industryID],
		industry: sourceObj.getTrait(industryID),
		};

	if (industryData.industry == null)
		return;
		
	//	Show the dialog box.
	//	We start by graying out the page.
	
	$UI.enterDialog("#dlgEditIndustryAllocation");

	//	Initialize

	canvas = $("#dlgEditIndustryAllocation .ctrlFullCanvas");
	var ctx = canvas[0].getContext("2d");
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	//	Edit field

	editCtrl.val(Math.floor(industryData.industry.targetAllocation));
	editCtrl.focus();

	//	Info

	drawInfo(canvas, industryData);

	//	Hook up the buttons
	
	$("#dlgEditIndustryAllocation .ctrlCancel").on("click", doCancel);
	$("#dlgEditIndustryAllocation .ctrlOK").on("click", {  }, doOK);
	$UI.keydown(onKeydown);
	}

var editProductionLastObjID = null;
var editProductionRecentlyChanged = null;

function worldEditProductAllocationDialog (sourceObj, industry, product, curAlloc)
	{
	var cxObjImage = 64;
	var cyObjImage = 64;
	var editCtrl = $("#dlgEditProductAllocation .dlgEditControl .ctrlValue");

	function cleanUp ()
		{
		$("#dlgEditProductAllocation .ctrlCancel").off("click");
		$("#dlgEditProductAllocation .ctrlOK").off("click");
		
		$UI.exitDialog();
		}
	
	function doCancel ()
		{
		cleanUp();
		}

	function doOK (e)
		{
		var i;
		
		if ($Anacreon.waitingForUpdate)
			return;

		//	Update

		editProductionRecentlyChanged.setAlloc(product.id, editCtrl.val());

		//	Change setting
		
		$Anacreon.waitingForUpdate = true;

		var params = {
		    authToken: $UserInfo.authToken, 
			gameID: $Anacreon.gameID,
			sovereignID: $Anacreon.userInfo.sovereignID,
			objID: sourceObj.id,
			industryID: industry.traitID,
			alloc: editProductionRecentlyChanged.getAllocData(),
			sequence: $Anacreon.seq
			};

		var request = $.ajax({
			url: "/api/setProductAlloc",
			type: "POST",
			data: JSON.stringify(params),
			contentType: "application/json",
			dataType: "json",
			
			success: (function (data) {
				$Anacreon.waitingForUpdate = false;

				if ($Hexarc.isError(data))
					{
					$UI.showDialogError($Hexarc.getErrorMessage(data));
					}
				else
					{
					cleanUp();

					$Anacreon.processUpdate(data);
					$Map.initMapView($Map.curMetrics);
					$Map.refreshSelectionView();
					}
				}),

			error: (function (jqXHR, textStatus, errorThrown) {
				$Anacreon.waitingForUpdate = false;
				$UI.showDialogError(errorThrown);
				})
			});
		}

	function drawInfo (canvas, industryData)
		{
		var ctx = canvas[0].getContext("2d");

		var x = 0;
		var y = (90 - cyObjImage) / 2;

		//	Draw the resource tile

		ctx.fillStyle = "#606060";
		ctx.fillRect(x, y, cxObjImage, cyObjImage);

		//	Metrics

		var xText = x + cxObjImage + $Style.cxTilePadding;
		var cyText = $Style.tileFontExtraLargeHeight + 2 * $Style.tileFontMediumHeight;
		var yText = y + (cyObjImage - cyText) / 2;

		//	Name of resource

		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.font = $Style.tileFontExtraLarge;
		ctx.textBaseline = "top";
		ctx.textAlign = "left";
		ctx.fillText(industryData.product.nameDesc, xText, yText);
		yText += $Style.tileFontExtraLargeHeight;

		ctx.font = $Style.tileFontMedium;
		}

	function onKeydown (e)
		{
		switch (e.which)
			{
			case KEY_ESCAPE:
				{
				doCancel();
				break;
				}
				
			case KEY_ENTER:
				{
				doOK();
				break;
				}
			}
		}
		
	//	worldEditProductAllocationDialog --------------------------------------
	
	var i;

	if (industry == null || industry.buildData == null)
		return;
	
	var industryData = {
		industry: industry,
		product: product,
		};

	//	Reset recently changed list

	if (editProductionLastObjID != sourceObj.id)
		{
		editProductionLastObjID = sourceObj.id;
		editProductionRecentlyChanged = new OrderedResourceAllocArray(industry.buildData);
		}
	else
		editProductionRecentlyChanged.update(industry.buildData);

	//	Initialize

	canvas = $("#dlgEditProductAllocation .ctrlFullCanvas");
	var ctx = canvas[0].getContext("2d");
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	//	Edit field

	editCtrl.val(curAlloc);

	//	Info

	drawInfo(canvas, industryData);

	//	Show the dialog box.
	//	We start by graying out the page.
	
	$UI.enterDialog("#dlgEditProductAllocation");
	editCtrl.focus();

	//	Hook up the buttons
	
	$("#dlgEditProductAllocation .ctrlCancel").on("click", doCancel);
	$("#dlgEditProductAllocation .ctrlOK").on("click", {  }, doOK);
	$UI.keydown(onKeydown);
	}

function worldEditTechImportDialog (importerObj, exporterObj, targetTech)
	{
	var cxObjImage = 64;
	var cyObjImage = 64;
	var editCtrl = $("#dlgEditTechImport .dlgEditControl .ctrlValue");

	function cleanUp ()
		{
		$("#dlgEditTechImport .ctrlCancel").off("click");
		$("#dlgEditTechImport .ctrlOK").off("click");
		
		$UI.exitDialog();
		}
	
	function doCancel ()
		{
		cleanUp();
		}

	function doOK (e)
		{
		var i;
		
		if ($Anacreon.waitingForUpdate)
			return;

		//	Validate

		if (editCtrl.val() > exporterObj.techLevel)
			{
			$UI.showDialogError("You may not uplift above the foundation's tech level of " + exporterObj.techLevel + ".");
			return;
			}

		//	Do it

		$Anacreon.waitingForUpdate = true;

		var params = {
		    authToken: $UserInfo.authToken, 
			gameID: $Anacreon.gameID,
			sovereignID: $Anacreon.userInfo.sovereignID,
			objID: importerObj.id,
			sourceObjID: exporterObj.id,
			allocType: "tech",
			allocValue: editCtrl.val(),
			sequence: $Anacreon.seq
			};

		var request = $.ajax({
			url: "/api/setTradeRoute",
			type: "POST",
			data: JSON.stringify(params),
			contentType: "application/json",
			dataType: "json",
			
			success: (function (data) {
				$Anacreon.waitingForUpdate = false;

				if ($Hexarc.isError(data))
					{
					$UI.showDialogError($Hexarc.getErrorMessage(data));
					}
				else
					{
					cleanUp();

					$Anacreon.processUpdate(data);
					$Map.initMapView($Map.curMetrics);
					$Map.refreshSelectionView();
					}
				}),

			error: (function (jqXHR, textStatus, errorThrown) {
				$Anacreon.waitingForUpdate = false;
				$UI.showDialogError(errorThrown);
				})
			});
		}

	function drawInfo (canvas, importerObj)
		{
		var ctx = canvas[0].getContext("2d");

		var x = 0;
		var y = (90 - cyObjImage) / 2;

		//	Draw the resource image

		ctx.fillStyle = "#606060";
		ctx.fillRect(x, y, cxObjImage, cyObjImage);

		//	Metrics

		var xText = x + cxObjImage + $Style.cxTilePadding;
		var cyText = $Style.tileFontExtraLargeHeight + 2 * $Style.tileFontMediumHeight;
		var yText = y + (cyObjImage - cyText) / 2;

		//	Name of world

		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.font = $Style.tileFontExtraLarge;
		ctx.textBaseline = "top";
		ctx.textAlign = "left";
		ctx.fillText(importerObj.name, xText, yText);
		yText += $Style.tileFontExtraLargeHeight;

		ctx.font = $Style.tileFontMedium;

		ctx.fillText("Import tech from: " + exporterObj.name, xText, yText);
		yText += $Style.tileFontMediumHeight;
		}
		
	function onKeydown (e)
		{
		switch (e.which)
			{
			case KEY_ESCAPE:
				{
				doCancel();
				break;
				}
				
			case KEY_ENTER:
				{
				doOK();
				break;
				}
			}
		}
		
	//	worldEditTechImportDialog ----------------------------------------------
	
	var i;

	//	Compute the maximum tech level that we can uplift to.

	var maxTechLevel = exporterObj.techLevel;
	
	//	Initialize

	canvas = $("#dlgEditTechImport .ctrlFullCanvas");
	var ctx = canvas[0].getContext("2d");
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	//	Edit field

	editCtrl.val(targetTech);

	//	Help text

	var capitalText;
	if (maxTechLevel == 10)
		capitalText = "Level 10 is the highest level possible.";
	else
		capitalText = "Build " + $Language.formatIndefiniteArticle($Anacreon.techLevels[maxTechLevel + 1].name + " project") +
				" on the capital to increase the tech level of all foundations.";

	$("#dlgEditTechImport .dlgHelpBox").html(
		"You may uplift to a maximum tech level of " + maxTechLevel + " (" + $Anacreon.techLevels[maxTechLevel].name + ").<br/>" + capitalText);

	//	Info

	drawInfo(canvas, importerObj);

	//	Show the dialog box.
	//	We start by graying out the page.
	
	$UI.enterDialog("#dlgEditTechImport");
	editCtrl.focus();

	//	Hook up the buttons
	
	$("#dlgEditTechImport .ctrlCancel").on("click", doCancel);
	$("#dlgEditTechImport .ctrlOK").on("click", {  }, doOK);
	$UI.keydown(onKeydown);
	}

function worldEditTradeRouteDialog (importerObj, exporterObj, resType)
	{
	var cxObjImage = 64;
	var cyObjImage = 64;
	var editCtrl = $("#dlgEditTradeRoute .dlgEditControl .ctrlValue");

	function cleanUp ()
		{
		$("#dlgEditTradeRoute .ctrlCancel").off("click");
		$("#dlgEditTradeRoute .ctrlOK").off("click");
		
		$UI.exitDialog();
		}
	
	function doCancel ()
		{
		cleanUp();
		}

	function doOK (e)
		{
		var i;
		
		if ($Anacreon.waitingForUpdate)
			return;
		
		$Anacreon.waitingForUpdate = true;

		var params = {
		    authToken: $UserInfo.authToken, 
			gameID: $Anacreon.gameID,
			sovereignID: $Anacreon.userInfo.sovereignID,
			objID: importerObj.id,
			sourceObjID: exporterObj.id,
			resType: resType.id,
			allocType: "consumption",
			allocValue: editCtrl.val(),
			sequence: $Anacreon.seq
			};

		var request = $.ajax({
			url: "/api/setTradeRoute",
			type: "POST",
			data: JSON.stringify(params),
			contentType: "application/json",
			dataType: "json",
			
			success: (function (data) {
				$Anacreon.waitingForUpdate = false;

				if ($Hexarc.isError(data))
					{
					$UI.showDialogError($Hexarc.getErrorMessage(data));
					}
				else
					{
					cleanUp();

					$Anacreon.processUpdate(data);
					$Map.initMapView($Map.curMetrics);
					$Map.refreshSelectionView();
					}
				}),

			error: (function (jqXHR, textStatus, errorThrown) {
				$Anacreon.waitingForUpdate = false;
				$UI.showDialogError(errorThrown);
				})
			});
		}

	function drawInfo (canvas, tradeData)
		{
		var ctx = canvas[0].getContext("2d");

		var x = 0;
		var y = (90 - cyObjImage) / 2;

		//	Draw the resource image

		ctx.fillStyle = "#606060";
		ctx.fillRect(x, y, cxObjImage, cyObjImage);

		//	Metrics

		var xText = x + cxObjImage + $Style.cxTilePadding;
		var cyText = $Style.tileFontExtraLargeHeight + 2 * $Style.tileFontMediumHeight;
		var yText = y + (cyObjImage - cyText) / 2;

		//	Name of resource

		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.font = $Style.tileFontExtraLarge;
		ctx.textBaseline = "top";
		ctx.textAlign = "left";
		ctx.fillText(tradeData.resType.nameDesc, xText, yText);
		yText += $Style.tileFontExtraLargeHeight;

		ctx.font = $Style.tileFontMedium;

		//	Importer/exporter

		ctx.fillText("Importer: " + importerObj.name, xText, yText);
		yText += $Style.tileFontMediumHeight;

		ctx.fillText("Exporter: " + exporterObj.name, xText, yText);
		yText += $Style.tileFontMediumHeight;
		}
		
	function onKeydown (e)
		{
		switch (e.which)
			{
			case KEY_ESCAPE:
				{
				doCancel();
				break;
				}
				
			case KEY_ENTER:
				{
				doOK();
				break;
				}
			}
		}
		
	//	worldEditTradeRouteDialog ----------------------------------------------
	
	var i;
	
	var tradeData = importerObj.getTradeData(exporterObj.id, resType.id);
	if (tradeData == null)
		return;

	//	Show the dialog box.
	//	We start by graying out the page.
	
	$UI.enterDialog("#dlgEditTradeRoute");

	//	Initialize

	canvas = $("#dlgEditTradeRoute .ctrlFullCanvas");
	var ctx = canvas[0].getContext("2d");
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	//	Edit field

	editCtrl.val(tradeData.alloc);
	editCtrl.focus();

	//	Info

	drawInfo(canvas, tradeData);

	//	Hook up the buttons
	
	$("#dlgEditTradeRoute .ctrlCancel").on("click", doCancel);
	$("#dlgEditTradeRoute .ctrlOK").on("click", {  }, doOK);
	$UI.keydown(onKeydown);
	}

function worldRemoveTradeRoute (sourceObj, destObj)
	{
	if ($Anacreon.waitingForUpdate
			|| sourceObj == null
			|| sourceObj["class"] != "world")
		return;

	//	Cancel trade route (in both directions)

	confirmDialog({
		dlgMessage: "Are you sure you wish to remove the trade route between " + sourceObj.name + " and " + destObj.name + "?",
		dlgOKLabel: "Remove",

		commandURL: "/api/stopTradeRoute",
		getCommandParams: (function () {
			return {
				authToken: $UserInfo.authToken, 
				gameID: $Anacreon.gameID,
				sovereignID: $Anacreon.userInfo.sovereignID,
				objID: sourceObj.id,
				sourceObjID: destObj.id,
				sequence: $Anacreon.seq
				};
			}),
		});
	}

function worldLaunchLAMs (sourceObj, targetObj)
	{
	if (sourceObj == null
			|| sourceObj["class"] != "world"
			|| sourceObj.sovereignID != $Anacreon.userInfo.sovereignID
			|| !sourceObj.canAttackWithLAMs(targetObj))
		return;

	//	Attack
				
	$Anacreon.waitingForUpdate = true;
				
	var params = {
		authToken: $UserInfo.authToken, 
		gameID: $Anacreon.gameID,
		sovereignID: $Anacreon.userInfo.sovereignID,
		objID: sourceObj.id,
		targetObjID: targetObj.id,
		sequence: $Anacreon.seq
		};

	var request = $.ajax({
		url: "/api/launchLAMs",
		type: "POST",
		data: JSON.stringify(params),
		contentType: "application/json",
		dataType: "json",

		success: (function (data) {
			$Anacreon.waitingForUpdate = false;

			if ($Hexarc.isError(data))
				{
				$Map.addEffect(new TextMapEffect(sourceObj.pos[0], sourceObj.pos[1], $Hexarc.getErrorMessage(data)));
				}
			else
				{
				$Anacreon.processUpdate(data);
				$Map.initMapView($Map.curMetrics);
				$Map.refreshSelectionView();
				}
			}),

		error: (function (jqXHR, textStatus, errorThrown) {
			$Anacreon.waitingForUpdate = false;
			})
		});
	}

function worldSellResourcesDialog (sellerObj, buyerObj, resType, resList)
	{
	var canvas;
	var cxObjImage = 64;
	var cyObjImage = 64;
	var editCtrl = $("#dlgSellResources .dlgEditControl .ctrlValue");

	var resourcesListCtrl;

	var yListControl = 30;
	var cxListControlTile = 96;
	var cyListControlTile = 96;
	var cySpacing = 13;
	var xInfo = 0;
	var yInfo = yListControl + cyListControlTile + cySpacing;
	var cxInfo = 400;
	var cyInfo = 300;

	function cleanUp ()
		{
		$("#dlgSellResources .ctrlCancel").off("click");
		$("#dlgSellResources .ctrlOK").off("click");
		
		resourcesListCtrl.destroy();
		resourcesListCtrl = null;

		$UI.exitDialog();
		}
	
	function doCancel ()
		{
		cleanUp();
		}

	function doOK (e)
		{
		var i;
		
		if ($Anacreon.waitingForUpdate)
			return;

		var resType = e.data.longList.getSelectionID();
		if (!resType)
			{
			cleanUp();
			return;
			}

		$Anacreon.waitingForUpdate = true;

		var params = {
		    authToken: $UserInfo.authToken, 
			gameID: $Anacreon.gameID,
			sovereignID: $Anacreon.userInfo.sovereignID,
			objID: sellerObj.id,
			sourceObjID: buyerObj.id,
			resType: resType,
			allocType: "setExportQuota",
			allocValue: editCtrl.val(),
			sequence: $Anacreon.seq
			};

		var request = $.ajax({
			url: "/api/setTradeRoute",
			type: "POST",
			data: JSON.stringify(params),
			contentType: "application/json",
			dataType: "json",
			
			success: (function (data) {
				$Anacreon.waitingForUpdate = false;

				if ($Hexarc.isError(data))
					{
					$UI.showDialogError($Hexarc.getErrorMessage(data));
					}
				else
					{
					cleanUp();

					$Anacreon.processUpdate(data);
					$Map.initMapView($Map.curMetrics);
					$Map.refreshSelectionView();
					}
				}),

			error: (function (jqXHR, textStatus, errorThrown) {
				$Anacreon.waitingForUpdate = false;
				$UI.showDialogError(errorThrown);
				})
			});
		}

	function drawInfo (canvas)
		{
		var i;

		var resID = resourcesListCtrl.getSelectionID();
		var resType = $Anacreon.designTypes[resID];
		var buyerSovereign = $Anacreon.sovereignList[buyerObj.sovereignID];
		var service = buyerSovereign.hasBureauOfTrade();
		var prices = (service.buyPrices ? service.buyPrices: []);

		//	Figure out the price

		var price = 0.0;
		for (i = 0; i < prices.length; i += 2)
			if (resID == prices[i])
				{
				price = prices[i + 1];
				break;
				}

		//	Compute the text to display

		var text;
		if (price == 0.0)
			text = buyerSovereign.name + " has not yet set a price for " + resType.nameDesc + ".";
		else if (price < 10.0)
			text = buyerSovereign.name + " will buy 1,000 " + resType.nameDesc + " for " + $Anacreon.formatNumberAsInteger(price * 1000) + " aes.";
		else
			text = buyerSovereign.name + " will buy one " + resType.nameDesc + " for " + $Anacreon.formatNumberAsFloat(price, 1) + " aes.";

		//	Paint

		var ctx = canvas[0].getContext("2d");

		var x = canvas.width() / 2;
		var y = 140;
		var cxInner = canvas.width();
		var cyInner = 200;

		ctx.clearRect(0, y, cxInner, cyInner);

		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.font = $Style.tileFontMedium;
		ctx.textBaseline = "top";
		ctx.textAlign = "center";

		$UI.drawText(ctx, x, y, cxInner, $Style.tileFontMediumHeight, text);
		}
		
	function onKeydown (e)
		{
		switch (e.which)
			{
			case KEY_ESCAPE:
				{
				doCancel();
				break;
				}
				
			case KEY_ENTER:
				{
				doOK(e);
				break;
				}

			case KEY_ARROW_RIGHT:
				{
				resourcesListCtrl.selectNext();
				break;
				}
				
			case KEY_ARROW_LEFT:
				{
				resourcesListCtrl.selectPrev();
				break;
				}
			}
		}
		
	function onSelectionChanged (newSelectionID)
		{
		drawInfo(canvas);

		$UI.hideDialogError();
		}

	//	worldSellResourcesDialog -----------------------------------------------
	
	var i, j;
	canvas = $("#dlgSellResources .ctrlResourceList");

	//	Find the trade route that we're interested in.

	var tradeRoute = null;
	for (i = 0; i < buyerObj.tradeRoutes.length; i++)
		{
		tradeRoute = buyerObj.tradeRoutes[i];
		if (!tradeRoute["return"]
				&& tradeRoute.partnerObjID == sellerObj.id)
			break;
		}

	if (tradeRoute == null)
		return;

	//	Show the dialog box.
	//	We start by graying out the page.
	
	$UI.enterDialog("#dlgSellResources");

	//	Create a list of all resources that we can sell
	
	var listDesc = {
		content: [ ],
		sortList: true,

		yPos: yListControl,

		onSelectionChanged: onSelectionChanged,
		};

	//	If we have a resource type as input then we only add a single entry to 
	//	the list.

	var initialValue = 0;
	if (resType)
		{
		listDesc.content.push({
			id: resType.id,
			image: resType.imageSmall,
			label: resType.nameDesc
			});

		var sellData = buyerObj.getPurchaseData(sellerObj.id, resType.id);
		initialValue = sellData.optimal;
		}
	else if (resList)
		{
		//	Loop over all resources in the list

		for (i = 0; i < resList.length; i++)
			{
			var type = resList[i];

			listDesc.content.push({
				id: type.id,
				image: type.imageSmall,
				label: type.nameDesc
				});
			}
		}

	//	Create control
		
	resourcesListCtrl = new CanvasLongList(canvas, listDesc, null);

	//	Initialize

	var ctx = canvas[0].getContext("2d");
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	//	Edit field

	editCtrl.val(initialValue);
	editCtrl.focus();

	//	Info

	drawInfo(canvas);

	//	Hook up the buttons
	
	$("#dlgSellResources .ctrlCancel").on("click", doCancel);
	$("#dlgSellResources .ctrlOK").on("click", { longList: resourcesListCtrl }, doOK);
	$UI.keydown(onKeydown, { longList: resourcesListCtrl });
	}

//	OrderedResourceAllocArray --------------------------------------------------

function OrderedResourceAllocArray (buildData)
	{
	var i;

	this.orderedArray = [];
	for (i = 0; i < buildData.length; i += 3)
		{
		//	We keep everything in integers to avoid floating point errors.
		//	E.g., 3.7 + 1.1 = 4.80000000001

		this.orderedArray.push({
			resID: buildData[i],
			alloc: Math.round(buildData[i + 1] * 10),
			cannotBuild: (buildData[i + 2] ? true : false)
			});
		}
	}

OrderedResourceAllocArray.prototype.find = function (resID)
	{
	var i;

	for (i = 0; i < this.orderedArray.length; i++)
		if (this.orderedArray[i].resID == resID)
			return i;

	return -1;
	}

OrderedResourceAllocArray.prototype.getAllocData = function ()
	{
	var i;

	var result = [];
	for (i = 0; i < this.orderedArray.length; i++)
		{
		result.push(this.orderedArray[i].resID);
		result.push(this.orderedArray[i].alloc / 10);
		}

	return result;
	}

OrderedResourceAllocArray.prototype.setAlloc = function (resID, newAlloc)
	{
	var i;

	//	New allocation must align on tenth percents

	if (newAlloc > 100)
		newAlloc = 1000;
	else if (newAlloc < 0)
		newAlloc = 0;
	else
		newAlloc = Math.round(newAlloc * 10);

	//	Change and send to back.

	var pos = this.find(resID);
	if (pos != -1)
		{
		var entry = this.orderedArray.slice(pos, pos + 1);
		entry[0].alloc = newAlloc;

		this.orderedArray.splice(pos, 1);
		this.orderedArray.push(entry[0]);
		}

	//	Calculate the total allocation after the chance and see whether we
	//	are over or under.

	var totalAlloc = 0;
	for (i = 0; i < this.orderedArray.length; i++)
		totalAlloc += this.orderedArray[i].alloc;

	//	See if the remaining allocation values are roughly equal. If so, then we
	//	reallocate them proportionally.

	if (this.orderedArray.length >= 3)
		{
		var equalRealloc = true;
		var value = null;
		var remainderCount = 0;
		for (i = 0; (i < this.orderedArray.length - 1) && equalRealloc; i++)
			if (!this.orderedArray[i].cannotBuild)
				{
				if (value == null)
					value = Math.round(this.orderedArray[i].alloc / 10);
				else if (value != Math.round(this.orderedArray[i].alloc / 10))
					equalRealloc = false;

				remainderCount++;
				}

		//	Reallocate the remaining values proportionally

		if (equalRealloc && remainderCount > 0)
			{
			var remainderAlloc = Math.floor((1000 - newAlloc) / remainderCount);
			for (i = 0; i < this.orderedArray.length - 1; i++)
				if (!this.orderedArray[i].cannotBuild)
					this.orderedArray[i].alloc = remainderAlloc;

			totalAlloc = newAlloc + (remainderAlloc * remainderCount);
			}
		}

	//	Reallocate any remaining values

	if (totalAlloc > 1000)
		{
		var left = totalAlloc - 1000;
		for (i = 0; i < this.orderedArray.length && left != 0; i++)
			{
			if (!this.orderedArray[i].cannotBuild)
				{
				if (this.orderedArray[i].alloc > left)
					{
					this.orderedArray[i].alloc -= left;
					left = 0;
					}
				else
					{
					left -= this.orderedArray[i].alloc;
					this.orderedArray[i].alloc = 0;
					}
				}
			}
		}
	else if (totalAlloc < 1000)
	    {
	    for (i = 0; i < this.orderedArray.length; i++)
	        {
	        if (!this.orderedArray[i].cannotBuild)
	            {
	            this.orderedArray[i].alloc += (1000 - totalAlloc);
	            break;
	            }
	        }
	    }
	}

OrderedResourceAllocArray.prototype.update = function (buildData)
	{
	var i;

	for (i = 0; i < buildData.length; i += 3)
		{
		var pos = this.find(buildData[i]);
		if (pos == -1)
			this.orderedArray.push({
				resID: buildData[i],
				alloc: Math.round(buildData[i + 1] * 10),
				cannotBuild: (buildData[i + 2] ? true : false)
				});
		else
			{
			this.orderedArray[pos].alloc = Math.round(buildData[i + 1] * 10);
			this.orderedArray[pos].cannotBuild = (buildData[i + 2] ? true : false);
			}
		}
	}