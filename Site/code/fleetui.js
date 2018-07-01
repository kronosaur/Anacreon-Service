//	fleetui.js
//
//	Implements UI for managing fleets
//	Copyright (c) 2012 Kronosaur Productions, LLC. All Rights Reserved.

function fleetAttackDialog (sourceObj)
	{
	var canvas;
	var listControl;

	var yListControl = 30;
	var cxListControlTile = 128;
	var cyListControlTile = 96;
	var cxSpacing = 13;
	var cySpacing = 13;
	var xInfo = 0;
	var yInfo = yListControl + cyListControlTile + cySpacing;
	var cxInfo = 800;
	var cyInfo = 300;

	function cleanUp ()
		{
		$("#dlgFleetAttack .ctrlCancel").off("click");
		$("#dlgFleetAttack .ctrlOK").off("click");
	
		listControl.destroy();
		listControl = null;

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

		var sel = listControl.getSelection();
		
		$Anacreon.waitingForUpdate = true;

		var params = {
            authToken: $UserInfo.authToken, 
			gameID: $Anacreon.gameID,
			sovereignID: $Anacreon.userInfo.sovereignID,
			attackerObjID: sourceObj.id,
			battlePlan: {
				battleFieldID: sourceObj.id,
				objective: sel.data.objective,
				enemySovereignIDs: sel.data.enemySovereignIDs,
				},
			sequence: $Anacreon.seq
			};
			
		var request = $.ajax({
			url: "/api/attack",
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
		
	function drawInfo (canvas, planTile, x, y, cxWidth, cyHeight)
		{
		function drawLine (ctx, label, left, right, xText, yText, isHeader)
			{
			var cxCenterHalf = 80;

			ctx.font = (isHeader ? $Style.tileFontMediumBold : $Style.tileFontMedium);

			//	Center

			ctx.fillStyle = $Style.tileTextNormal;
			ctx.textAlign = "center";
			ctx.fillText(label, xText, yText);

			//	Left

			ctx.fillStyle = $Style.tileTextHighlight;
			ctx.textAlign = "right";
			ctx.fillText(left, xText - cxCenterHalf, yText);

			//	Right

			ctx.textAlign = "left";
			ctx.fillText(right, xText + cxCenterHalf, yText);
			}

		var ctx = canvas[0].getContext("2d");

		//	Clear

		ctx.clearRect(x, y, cxWidth, cyHeight);

		//	Metrics

		var xText = x + (cxWidth / 2);
		var yText = y;
		var cxText = 400;

		//	Draw the name first

		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.font = $Style.tileFontExtraLarge;
		ctx.textBaseline = "top";
		ctx.textAlign = "center";
		ctx.fillText(planTile.label, xText, yText);
		yText += $Style.tileFontExtraLargeHeight;

		//	Draw the description

		ctx.fillStyle = $Style.tileTextNormal;
		ctx.font = $Style.tileFontMedium;
		$UI.drawText(ctx, xText, yText, cxText, $Style.tileFontMediumHeight, planTile.data.description);
		yText += 2 * $Style.tileFontMediumHeight + cySpacing;

		//	Draw attacker name and banner

		var cxCenterArea = 350;
		var cxIcon = $Style.tileFontMediumHeight * 3;
		var cyIcon = cxIcon;
		var xIcon = xText - (cxCenterArea / 2) - cxIcon;
		var yIcon = yText;

		ctx.fillStyle = "#606060";
		ctx.fillRect(xIcon, yIcon, cxIcon, cyIcon);

		var xName = xIcon - cxSpacing;
		var yName = yText + (cyIcon - $Style.tileFontLargeHeight) / 2;

		ctx.fillStyle = $Style.tileTextHighlight;
		ctx.font = $Style.tileFontLarge;
		ctx.textAlign = "right";
		ctx.fillText($Anacreon.sovereignList[$Anacreon.userInfo.sovereignID].name, xName, yName);

		//	Draw defender name and banner

		xIcon = xText + (cxCenterArea / 2);

		ctx.fillStyle = "#606060";
		ctx.fillRect(xIcon, yIcon, cxIcon, cyIcon);

		xName = xIcon + cxIcon + cxSpacing;

		ctx.fillStyle = $Style.tileTextHighlight;
		ctx.font = $Style.tileFontLarge;
		ctx.textAlign = "left";
		ctx.fillText(planTile.data.sovereignName, xName, yName);

		//	Draw balance of forces

		var yLine = yText;
		drawLine(ctx, "space forces", 
				$Anacreon.formatNumberAsFloat(planTile.data.friendlyForces.spaceForces / 100.0, 1), 
				$Anacreon.formatNumberAsFloat(planTile.data.enemyForces.spaceForces / 100.0, 1), 
				xText, yLine);
		yLine += $Style.tileFontMediumHeight;

		if (planTile.data.groundForcesNeeded)
			{
			drawLine(ctx, "ground forces", 
					$Anacreon.formatNumberAsFloat(planTile.data.friendlyForces.groundForces / 100.0, 1), 
					$Anacreon.formatNumberAsFloat(planTile.data.enemyForces.groundForces / 100.0, 1), 
					xText, yLine);
			yLine += $Style.tileFontMediumHeight;
			}

		if (!planTile.data.sovereign.isIndependent)
			{
			drawLine(ctx, "imperial might", 
				100, 
				$Anacreon.formatNumberAsInteger(planTile.data.sovereign.imperialMight),
				xText, yLine);
			}

		yText += 3 * $Style.tileFontMediumHeight;

		//	Draw warning box

		if (planTile.data.warnings)
			{
			cxText = 400;
			InfoPaneHelper.paintMessageBox(ctx, 
					xText - (cxText / 2), 
					yText + cySpacing, 
					cxText,
					4 * $Style.tileFontMediumHeight,
					planTile.data.warnings,
					$Style.tileErrorBackground);
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

			case KEY_ARROW_RIGHT:
				{
				listControl.selectNext();
				break;
				}
				
			case KEY_ARROW_LEFT:
				{
				listControl.selectPrev();
				break;
				}
			}
		}

	function onSelectionChanged (newSelectionID)
		{
		drawInfo(canvas, listControl.getSelection(), xInfo, yInfo, cxInfo, cyInfo);

		$UI.hideDialogError();
		}

	//	fleetAttackDialog ------------------------------------------------------

	//	Initialize

	canvas = $("#dlgFleetAttack .ctrlFullCanvas");
	var ctx = canvas[0].getContext("2d");
	ctx.clearRect(0, 0, canvas.width(), canvas.height());

	//	Show the dialog box.
	
	$UI.enterDialog("#dlgFleetAttack");
	
	//	Buttons
	
	$("#dlgFleetAttack .ctrlCancel").on("click", doCancel);
	$("#dlgFleetAttack .ctrlOK").on("click", doOK);

	//	Compose a descriptor for the long list

	var listDesc = {
		content: sourceObj.getValidBattlePlans(),

		yPos: yListControl,
		cxTile: cxListControlTile,
		cyTile: cyListControlTile,

		onSelectionChanged: onSelectionChanged,
		};

	//	Create controls
	
	listControl = new CanvasLongList(canvas, listDesc, null);

	//	Draw

	if (listDesc.content.length > 0)
		drawInfo(canvas, listDesc.content[0], xInfo, yInfo, cxInfo, cyInfo);
	
	//	Keyboard UI

	$UI.keydown(onKeydown);
//	$UI.keypress(onKeypress);
	}

function fleetDeployDialog (sourceObj, destObj)
	{
	var canvas;
	var resources;
	var numericTransfer = false;
	var listControl;

	var yListControl = 100;
	var cxListControlTile = 96;
	var cyListControlTile = 128;
	var cxObjImage = 64;
	var cyObjImage = 64;
	var cySpacing = (yListControl - cyObjImage) / 2;
	var xDestInfo = 0;
	var yDestInfo = cySpacing;
	var xSourceInfo = 0;
	var ySourceInfo = yListControl + cyListControlTile + cySpacing;
	var xUnitInfo = 800;
	var yUnitInfo = ySourceInfo;

	var stdCargoSpace = 20;	//	Cargo space of a jumptransport

	function calcCargoSpace (obj, isSource)
		{
		var i;

		var isNew = (obj == null || obj["class"] == null);
		var isFleet = (isNew || obj["class"] == "fleet");

		//	If we're not a fleet, then we have no cargo space limit

		if (!isFleet)
			return 0.0;

		var cargoSpace = 0.0;
		for (i = 0; i < resources.length; i++)
			{
			var resType = resources[i].resType;
			var count = (isSource ? resources[i].sourceCount : resources[i].destCount);
			if (count == 0)
				continue;

			//	Compute cargo space available.

			if (resType.cargoSpace)
				cargoSpace += (resType.cargoSpace * count);
			else if (resType.isCargo)
				cargoSpace -= (resType.mass * count);
			}

		return cargoSpace;
		}

	function calcDefaultTransfer (index)
		{
		//	Figure out the total amount here

		var total = resources[index].sourceCount + resources[index].destCount;

		//	Calc based on totals

		if (total <= 500)
			return 100;
		else if (total <= 2500)
			return 500;
		else if (total <= 5000)
			return 1000;
		else if (total <= 25000)
			return 5000;
		else if (total <= 50000)
			return 10000;
		else
			return 50000;
		}
	
	function cleanUp ()
		{
		$("#transBoxes").empty();
	
		$("#buttonCancel").off("click");
		$("#buttonOK").off("click");

		$("#dlgFleetDeploy .ctrlDown").off("click");
		$("#dlgFleetDeploy .ctrlUp").off("click");

		listControl.destroy();
		listControl = null;

		$UI.exitDialog();
		}
	
	function doCancel ()
		{
		if ($Anacreon.waitingForUpdate)
			return;

		cleanUp();
		}

	function doOK ()
		{
		var i;
		
		if ($Anacreon.waitingForUpdate)
			return;

		//	Make sure cargo is balanced
		//	
		//	NOTE: We check here only to catch gross errors. The server will 
		//	adjust counts to make sure everything is balanced.

		var sourceCargoSpace = 0.0;
		var destCargoSpace = 0.0;
		for (i = 0; i < resources.length; i++)
			{
			var resType = resources[i].resType;

			if (sourceObj == null || sourceObj["class"] == null || sourceObj["class"] == "fleet")
				{
				if (resType.cargoSpace)
					sourceCargoSpace += (resType.cargoSpace * resources[i].sourceCount);
				else if (resType.isCargo)
					sourceCargoSpace -= (resType.mass * resources[i].sourceCount);
				}

			if (destObj == null || destObj["class"] == null || destObj["class"] == "fleet")
				{
				if (resType.cargoSpace)
					destCargoSpace += (resType.cargoSpace * resources[i].destCount);
				else if (resType.isCargo)
					destCargoSpace -= (resType.mass * resources[i].destCount);
				}
			}

		if (sourceCargoSpace < 0.0)
			{
			$UI.showDialogError("Not enough transports in source.");
			return;
			}

		if (destCargoSpace < 0.0)
			{
			$UI.showDialogError("Not enough transports in destination.");
			return;
			}

		//	Compute the transfer array
		
		var resTransfer = [];
		for (i = 0; i < resources.length; i++)
			{
			resTransfer.push(resources[i].type);
			resTransfer.push(resources[i].transCount);
			}
		
		$Anacreon.waitingForUpdate = true;

		var isNew = (destObj["class"] == null);
		
		var params = {
            authToken: $UserInfo.authToken,
			gameID: $Anacreon.gameID,
			sovereignID: $Anacreon.userInfo.sovereignID,
			fleetObjID: (isNew ? null : destObj.id),
			sourceObjID: (isNew ? sourceObj.id : null),
			destObjID: (isNew ? null : sourceObj.id),
			resources: resTransfer,
			sequence: $Anacreon.seq
			};
			
		var request = $.ajax({
			url: (isNew ? "/api/deployFleet" : "/api/transferFleet"),
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

					//	If we have no selection then it means that the destination 
					//	object was destroyed. In that case, select the source.

					if ($Map.objSelected == null)
						$Map.selectObjectByID(sourceObj.id);
					}
				}),

			error: (function (jqXHR, textStatus, errorThrown) {
				$Anacreon.waitingForUpdate = false;
				$UI.showDialogError(errorThrown);
				})
			});
		}

	function doTransferDown ()
		{
		if ($Anacreon.waitingForUpdate)
			return;

		var editBox = $("#transEdit");
		if (editBox.text() != "")
			transfer(listControl.getSelectionID(), -editBox.text(), true);

		setAmountInput(false);
		}

	function doTransferUp ()
		{
		if ($Anacreon.waitingForUpdate)
			return;

		var editBox = $("#transEdit");
		if (editBox.text() != "")
			transfer(listControl.getSelectionID(), editBox.text(), true);

		setAmountInput(false);
		}

	function drawObjectInfo (canvas, obj, x, y, isSource)
		{
		var i;

		var ctx = canvas[0].getContext("2d");
		var isNew = (obj == null || obj["class"] == null);
		var isFleet = (isNew || obj["class"] == "fleet");

		//	Metrics

		var xText = x + cxObjImage + $Style.cxTilePadding;
		var cyText = $Style.tileFontLargeHeight + 4 * $Style.tileFontSmallHeight;
		var yText = y;

		//	Clear

		ctx.clearRect(x, y, 400, Math.max(cyObjImage, cyText));
		
		//	Draw the object image

		ctx.fillStyle = "#606060";
		ctx.fillRect(x, y, cxObjImage, cyObjImage);

		//	Name of the object

		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.font = $Style.tileFontLarge;
		ctx.textBaseline = "top";
		ctx.textAlign = "left";
		ctx.fillText((isNew ? "New Fleet" : obj.name), xText, yText);
		yText += $Style.tileFontLargeHeight;

		ctx.font = $Style.tileFontSmall;

		//	Compute stats

		var FTL = null;
		var cargoSpace = 0.0;
		var spaceForces = 0.0;
		var groundForces = 0.0;
		for (i = 0; i < resources.length; i++)
			{
			var resType = resources[i].resType;
			var count = (isSource ? resources[i].sourceCount : resources[i].destCount);
			if (count == 0)
				continue;

			//	Compute the FTL speed of the fleet.

			if (resType.FTL
					&& (FTL == null || resType.FTL < FTL))
				FTL = resType.FTL;

			//	Compute cargo space available.

			if (resType.cargoSpace)
				cargoSpace += (resType.cargoSpace * count);
			else if (resType.isCargo)
				cargoSpace -= (resType.mass * count);

			//	Compute forces

			if (resType.category == "groundUnit")
				groundForces += count * resType.attackValue;
			else if (resType.category == "maneuveringUnit")
				spaceForces += count * resType.attackValue;
			}

		//	If this is a fleet, then compute FTL and cargo space.

		if (isFleet)
			{
			//	Output

			var value = (FTL ? (FTL + " light-years per watch") : "-");
			InfoPaneHelper.paintSmallStat(ctx, xText, yText, "FTL", value);
			yText += $Style.tileFontSmallHeight;

			value = (cargoSpace != 0 ? $Anacreon.formatNumberAsInteger(cargoSpace / stdCargoSpace) : "-");
			InfoPaneHelper.paintSmallStat(ctx, xText, yText, "cargo space", value, (cargoSpace < 0.0 ? $Style.dlgErrorText : null));
			yText += $Style.tileFontSmallHeight;
			}

		//	Otherwise, just the designation

		else
			{
			ctx.fillText($Anacreon.designTypes[obj.designation].nameDesc, xText, yText);
			yText += $Style.tileFontSmallHeight;
			}

		//	We always add force computations

		InfoPaneHelper.paintSmallStat(ctx, xText, yText, "space forces", $Anacreon.formatNumberAsFloat(spaceForces / 100.0, 1));
		yText += $Style.tileFontSmallHeight;

		InfoPaneHelper.paintSmallStat(ctx, xText, yText, "ground forces", $Anacreon.formatNumberAsFloat(groundForces / 100.0, 1));
		yText += $Style.tileFontSmallHeight;
		}

	function drawUnitInfo (canvas, resType, x, y)
		{
		var i;

		var ctx = canvas[0].getContext("2d");

		//	Clear

		ctx.clearRect(x - 400, y, 400, 200);

		//	Metrics

		var xText = x;
		var yText = y;

		var xMidLine = x - 100;

		//	Unit name

		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.font = $Style.tileFontLarge;
		ctx.textBaseline = "top";
		ctx.textAlign = "right";
		ctx.fillText(resType.nameDesc, xText, yText);
		yText += $Style.tileFontLargeHeight + 2;

		//	Compose stats

		var stats = (resType.stats ? $.extend(true, [], resType.stats) : []);

		if (resType.cargoSpace)
			stats.unshift("cargo space", resType.cargoSpace);

		if (resType.isCargo)
			stats.unshift("mass", resType.mass);

		if (resType.FTL)
			stats.unshift("FTL", resType.FTL);

		if (resType.attackValue)
			stats.unshift("power", resType.attackValue);

		//	Stats

		ctx.font = $Style.tileFontSmall;
		for (i = 0; i < stats.length; i += 2)
			{
			InfoPaneHelper.paintSmallStat(ctx, xText, yText, stats[i], stats[i + 1]);
			yText += $Style.tileFontSmallHeight;
			}

		ctx.textAlign = "left";
		}

	function onKeydown (e)
		{
		if ($Anacreon.waitingForUpdate)
			return;

		//	If we're in modal numeric transfer mode then we handle it here.
		
		if (numericTransfer)
			{
			switch (e.which)
				{
				case KEY_ESCAPE:
					{
					var editBox = $("#transEdit");
					editBox.text(calcDefaultTransfer(listControl.getSelectionID()));
					setAmountInput(false);
					return;
					}
					
				case KEY_ENTER:
					{
					var editBox = $("#transEdit");
					
					//	Do the transfer
					
					transfer(listControl.getSelectionID(), editBox.text());
					if (editBox.text() < 0)
						editBox.text(-editBox.text());

					setAmountInput(false);
					return;
					}
					
				case KEY_BACKSPACE:
					{
					var editBox = $("#transEdit");
					var text = editBox.text();
					if (text != "")
						editBox.text(text.substring(0, text.length - 1));

					//	Do not let backspace turn into back.
					e.preventDefault();
					return;
					}
				}
			}
		
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

			case KEY_ARROW_RIGHT:
				{
				listControl.selectNext();
				break;
				}
				
			case KEY_ARROW_LEFT:
				{
				listControl.selectPrev();
				break;
				}
				
			case KEY_ARROW_UP:
				{
				doTransferUp();
				break;
				}
				
			case KEY_ARROW_DOWN:
				{
				doTransferDown();
				break;
				}
			}
		}
		
	function onKeypress (e)
		{
		if ($Anacreon.waitingForUpdate)
			return;

		if ((e.which >= KEY_0 && e.which <= KEY_9) || e.which == KEY_PLUS || e.which == KEY_MINUS)
			{
			var editBox = $("#transEdit");
			
			if (!numericTransfer)
				{
				editBox.text("");
				setAmountInput(true);
				}
				
			editBox.text(editBox.text() + String.fromCharCode(e.which));
			}
		}

	function onSelectionChanged (newSelectionID)
		{
		var editBox = $("#transEdit");
		editBox.text(calcDefaultTransfer(newSelectionID));

		drawUnitInfo(canvas, resources[newSelectionID].resType, xUnitInfo, yUnitInfo);

		setAmountInput(false);
		$UI.hideDialogError();
		}

	function setAmountInput (inputActive)
		{
		var editBox = $("#transEdit");

		if (inputActive)
			{
			editBox.css("color", "#D9D9FF");
			numericTransfer = true;
			}
		else
			{
			editBox.css("color", "#808080");
			numericTransfer = false;
			}
		}
		
	function transfer (index, amount, adjToCargoSpace)
		{
		//	Positive values move from source to dest
		
		if (amount > 0)
			{
			amount = Math.min(amount, resources[index].sourceCount);
			}
		
		//	Negative values move from dest to source
		
		else if (amount < 0)
			{
			amount = Math.max(amount, -resources[index].destCount);
			}

		//	If necessary, adjust the amount to whatever fits in cargo space

		if (adjToCargoSpace && resources[index].resType.isCargo)
			{
			var spaceAvail = calcCargoSpace((amount > 0 ? destObj : sourceObj), (amount > 0 ? false : true));
			if (spaceAvail > 0.0)
				{
				//	Figure out the maximum number of units that would fit

				var maxCount = Math.floor(spaceAvail / resources[index].resType.mass);
				if (amount > 0 && amount > maxCount)
					amount = maxCount;
				else if (amount < 0 && -amount > maxCount)
					amount = -maxCount;
				}
			}
			
		//	Adjust counts

		if (amount != 0)
			{		
			resources[index].sourceCount -= amount;
			resources[index].destCount += amount;
			resources[index].transCount += amount;
			}

		drawObjectInfo(canvas, destObj, xDestInfo, yDestInfo, false);
		drawObjectInfo(canvas, sourceObj, xSourceInfo, ySourceInfo, true);

		$UI.hideDialogError();
		}

	//	fleetDeployDialog ------------------------------------------------------

	var isNew = (destObj["class"] == null);
		
	//	Generate an array of structures, with each structure containing
	//	information about a single resource type.
	
	resources = $Anacreon.resCreateTransferArray(sourceObj, destObj);
	
	//	If no resources, then nothing to do.
	
	if (resources.length == 0)
		//	LATER: Error message
		return;

	//	Initialize

	canvas = $("#dlgFleetDeploy .ctrlFullCanvas");
	var ctx = canvas[0].getContext("2d");
	ctx.clearRect(0, 0, canvas.width(), canvas.height());

	//	Show the dialog box.
	
	$UI.enterDialog("#dlgFleetDeploy");

	//	Controls

	$("#buttonCancel").on("click", doCancel);
	$("#buttonOK").on("click", doOK);

	$("#dlgFleetDeploy .ctrlDown").on("click", doTransferDown);
	$("#dlgFleetDeploy .ctrlUp").on("click", doTransferUp);

	//	Set the label appropriately

	$("#buttonOK").text((isNew ? "Deploy" : "Transfer"));

	//	Compose a descriptor for the long list

	var listDesc = {
		content: [ ],

		yPos: yListControl,
		cxTile: cxListControlTile,
		cyTile: cyListControlTile,

		onCreateTile: (function (x, y, cxTile, cyTile, desc)
			{
			return new FleetTransferTile(x, y, cxTile, cyTile, desc);
			}),

		onSelectionChanged: onSelectionChanged,
		};

	//	Add all the resource boxes.
	
	for (var i = 0; i < resources.length; i++)
		{
		listDesc.content.push({
			data: resources[i],
			id: i,
			label: resources[i].name,
			image: resources[i].resType.imageSmall,
			});
		}

	//	Create controls
	
	listControl = new CanvasLongList(canvas, listDesc, null);

	//	Paint info

	drawObjectInfo(canvas, destObj, xDestInfo, yDestInfo, false);
	drawObjectInfo(canvas, sourceObj, xSourceInfo, ySourceInfo, true);
	drawUnitInfo(canvas, resources[listControl.getSelectionID()].resType, xUnitInfo, yUnitInfo);

	var editBox = $("#transEdit");
	editBox.text(calcDefaultTransfer(listControl.getSelectionID()));
	setAmountInput(false);

	//	Keyboard UI

	$UI.keydown(onKeydown);
	$UI.keypress(onKeypress);
	}

function fleetOrderRetreat (sourceObj)
	{
	if ($Anacreon.waitingForUpdate)
		return;

	$Anacreon.waitingForUpdate = true;

	var params = {
        authToken: $UserInfo.authToken, 
		gameID: $Anacreon.gameID,
		sovereignID: $Anacreon.userInfo.sovereignID,
		battleFieldID: sourceObj.id,
		sequence: $Anacreon.seq
		};
			
	var request = $.ajax({
		url: "/api/abortAttack",
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

function fleetSellDialog (fleetObj, buyerObj)
	{
	var canvas;
	var cxObjImage = 64;
	var cyObjImage = 64;

	var optionsListCtrl;

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
		$("#dlgFleetSell .ctrlCancel").off("click");
		$("#dlgFleetSell .ctrlOK").off("click");
		
		optionsListCtrl.destroy();
		optionsListCtrl = null;

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

		$Anacreon.waitingForUpdate = true;

		var selection = optionsListCtrl.getSelection();

		var params = {
		    authToken: $UserInfo.authToken, 
			gameID: $Anacreon.gameID,
			sovereignID: $Anacreon.userInfo.sovereignID,
			objID: fleetObj.id,
			buyerObjID: buyerObj.id,
			resources: selection.data.resources,
			sequence: $Anacreon.seq
			};

		var request = $.ajax({
			url: "/api/sellFleet",
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

					//	If we have no selection then it means that the fleet
					//	object was destroyed. In that case, select the buyer.

					if ($Map.objSelected == null)
						$Map.selectObjectByID(buyerObj.id);
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
		//	Paint

		var ctx = canvas[0].getContext("2d");
		var selection = optionsListCtrl.getSelection();

		var x = canvas.width() / 2;
		var y = 140;
		var cxInner = canvas.width();
		var cyInner = 300;

		ctx.clearRect(0, y, cxInner, cyInner);
		ctx.textBaseline = "top";
		ctx.textAlign = "center";

		//	First paint the price

		var priceText = $Anacreon.formatNumberAsInteger(selection.data.price);
		ctx.font = $Style.tileFontExtraLargeBold;
		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.fillText(priceText, x, y);
		y += $Style.tileFontExtraLargeHeight;
		y += $Style.tileFontMediumHeight;

		//	Paint the description

		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = $Style.dlgHighlightText;
		$UI.drawText(ctx, x, y, cxInner - 40, $Style.tileFontMediumHeight, selection.data.desc);
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

			case KEY_ARROW_RIGHT:
				{
				optionsListCtrl.selectNext();
				break;
				}
				
			case KEY_ARROW_LEFT:
				{
				optionsListCtrl.selectPrev();
				break;
				}
			}
		}
		
	function onSelectionChanged (newSelectionID)
		{
		drawInfo(canvas);

		$UI.hideDialogError();
		}

	//	fleetSellDialog --------------------------------------------------------
	
	var i, j;
	canvas = $("#dlgFleetSell .ctrlOptionList");

	//	Compute prices

	var buyerSovereign = $Anacreon.sovereignList[buyerObj.sovereignID];
	var bureau = buyerSovereign.hasBureauOfTrade();

	//	Calculate how roughly how much the buyer will pay for our fleet

	var cargoResources = [ ];
	var cargoPrice = 0.0;
	var fleetResources = [ ];
	var fleetPrice = 0.0;

	for (i = 0; i < fleetObj.resources.length; i += 2)
		{
		var resType = $Anacreon.designTypes[fleetObj.resources[i]];
		var resCount = fleetObj.resources[i + 1];

		//	We buy everything else. Look up the price and add it up.

		var resPrice = 0.0;
		for (j = 0; j < bureau.buyPrices.length; j += 2)
			if (resType.id == bureau.buyPrices[j])
				{
				resPrice = resCount * bureau.buyPrices[j + 1];
				break;
				}

		//	Always add this to the list of fleet resources

		fleetResources.push(resType.id);
		fleetResources.push(resCount);
		fleetPrice += resPrice;

		//	If this is cargo, add it

		if (!resType.isUnit)
			{
			cargoResources.push(resType.id);
			cargoResources.push(resCount);
			cargoPrice += resPrice;
			}
		}

	//	Create the list of options

	var content = [ ];
	if (cargoPrice > 0)
		{
		content.push({
			id:"sellCargo",
			label:"Sell all fleet cargo",
			data:{
				desc:buyerSovereign.name + " will buy all the cargo in your fleet for " + $Anacreon.formatNumberAsInteger(cargoPrice) + " aes.",
				resources:cargoResources,
				price:cargoPrice,
				}
			});
		}

	if (fleetPrice > 0)
		{
		content.push({
			id:"sellFleet",
			label:"Sell entire fleet",
			data:{
				desc:buyerSovereign.name + " will buy the entire fleet for " + $Anacreon.formatNumberAsInteger(fleetPrice) + " aes.",
				resources:fleetResources,
				price:fleetPrice,
				}
			});
		}

	//	If no options, then we're done

	if (content.length == 0)
		{
		infoDialog({ dlgMessage: "Sorry, " + buyerSovereign.name + " will not pay for that fleet." });
		return;
		}

	//	Show the dialog box.
	//	We start by graying out the page.
	
	$UI.enterDialog("#dlgFleetSell");

	//	Create a list of all resources that we can sell
	
	var listDesc = {
		content:content,

		yPos: yListControl,

		onSelectionChanged: onSelectionChanged,
		};

	//	Create control
		
	optionsListCtrl = new CanvasLongList(canvas, listDesc, null);

	//	Initialize

	var ctx = canvas[0].getContext("2d");
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	//	Info

	drawInfo(canvas);

	//	Hook up the buttons
	
	$("#dlgFleetSell .ctrlCancel").on("click", doCancel);
	$("#dlgFleetSell .ctrlOK").on("click", doOK);
	$UI.keydown(onKeydown);
	}

function fleetSetDestination (fleetObj, destObj)
	{
	$Anacreon.waitingForUpdate = true;
			
	var params = {
	    authToken: $UserInfo.authToken, 
		gameID: $Anacreon.gameID,
		sovereignID: $Anacreon.userInfo.sovereignID,
		objID: fleetObj.id,
		dest: destObj.id,
		sequence: $Anacreon.seq
		};
				
	var request = $.ajax({
		url: "/api/setDestination",
		type: "POST",
		data: JSON.stringify(params),
		contentType: "application/json",
		dataType: "json",
				
		success: (function (data) {
			$Anacreon.waitingForUpdate = false;

			if ($Hexarc.isError(data))
				{
				$Map.addEffect(new TextMapEffect(destObj.pos[0], destObj.pos[1], $Hexarc.getErrorMessage(data)));
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

function fleetTransferSourceDialog (fleetObj, sourceList)
	{
	var canvas;
	var cxObjImage = 64;
	var cyObjImage = 64;

	var optionsListCtrl;

	var xLeftPadding = 20;
	var yTopPadding = 20;
	var cxSpacing = 20;
	var cySpacing = 20;
	var yListControl = yTopPadding + $Style.tileFontLargeHeight + (cySpacing / 2);
	var cxListControlTile = 96;
	var cyListControlTile = 96;
	var xInfo = 0;
	var yInfo = yListControl + cyListControlTile + cySpacing;
	var cxInfo = 446;
	var cyInfo = 300;

	function cleanUp ()
		{
		$("#dlgFleetTransfer .ctrlCancel").off("click");
		$("#dlgFleetTransfer .ctrlOK").off("click");
		
		optionsListCtrl.destroy();
		optionsListCtrl = null;

		$UI.exitDialog();
		}
	
	function doCancel ()
		{
		cleanUp();
		}

	function doOK ()
		{
		var selection = optionsListCtrl.getSelection();
		cleanUp();

		fleetDeployDialog(selection.data.obj, fleetObj);
		}

	function drawInfo (canvas)
		{
		var ctx = canvas[0].getContext("2d");

		var selection = optionsListCtrl.getSelection();
		var obj = selection.data.obj;
		var isFleet = (obj["class"] == "fleet");

		var x = canvas.width() / 2;
		var y = yListControl + cyListControlTile + 20;
		var xHalfSpace = cxSpacing / 2;
		var cxInner = canvas.width();
		var cyInner = 300;

		ctx.clearRect(0, y, cxInner, cyInner);
		ctx.textBaseline = "top";

		//	Paint the object image

		ctx.fillStyle = "#606060";
		ctx.fillRect(x - xHalfSpace - cxObjImage, y, cxObjImage, cyObjImage);

		//	The right column has stats about the object

		var xText = x + xHalfSpace;
		var yText = y;

		//	First paint the object name

		ctx.font = $Style.tileFontLarge;
		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.textAlign = "left";
		ctx.fillText(obj.name, xText, yText);
		yText += $Style.tileFontLargeHeight;

		ctx.font = $Style.tileFontSmall;

		//	If this is a fleet, then compute FTL and cargo space.

		if (isFleet)
			{
			var stdCargoSpace = 20;	//	Cargo space of a jumptransport

			var value = obj.getFTLSpeed() + " light-years per watch";
			InfoPaneHelper.paintSmallStat(ctx, xText, yText, "FTL", value);
			yText += $Style.tileFontSmallHeight;

			var cargoSpace = obj.getCargoSpace();
			value = (cargoSpace != 0 ? $Anacreon.formatNumberAsInteger(cargoSpace / stdCargoSpace) : "-");
			InfoPaneHelper.paintSmallStat(ctx, xText, yText, "cargo space", value, (cargoSpace < 0.0 ? $Style.dlgErrorText : null));
			yText += $Style.tileFontSmallHeight;
			}

		//	Otherwise, just the designation

		else
			{
			ctx.fillText($Anacreon.designTypes[obj.designation].nameDesc, xText, yText);
			yText += $Style.tileFontSmallHeight;
			}

		//	We always add force computations

		var forces = SpaceObject.calcForceComposition(obj.resources);
		InfoPaneHelper.paintSmallStat(ctx, xText, yText, "space forces", $Anacreon.formatNumberAsFloat(forces.spaceForces / 100.0, 1));
		yText += $Style.tileFontSmallHeight;

		InfoPaneHelper.paintSmallStat(ctx, xText, yText, "ground forces", $Anacreon.formatNumberAsFloat(forces.groundForces / 100.0, 1));
		yText += $Style.tileFontSmallHeight;
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

			case KEY_ARROW_RIGHT:
				{
				optionsListCtrl.selectNext();
				break;
				}
				
			case KEY_ARROW_LEFT:
				{
				optionsListCtrl.selectPrev();
				break;
				}
			}
		}
		
	function onSelectionChanged (newSelectionID)
		{
		drawInfo(canvas);

		$UI.hideDialogError();
		}

	//	fleetTransferSourceDialog ------------------------------------------------
	
	var i, j;
	canvas = $("#dlgFleetTransfer .ctrlOptionList");

	//	Create the list of destinations

	var content = [ ];
	for (i = 0; i < sourceList.length; i++)
		{
		content.push({
			id:i,
			label:sourceList[i].name,
			data: {
				obj:sourceList[i],
				desc:"Transfer resources and ships to and from " + sourceList[i].name + "."
				}
			});
		}

	//	If no options, then we're done

	if (content.length == 0)
		{
		infoDialog({ dlgMessage: "Sorry, there is no place to transfer to." });
		return;
		}

	//	Show the dialog box.
	//	We start by graying out the page.
	
	$UI.enterDialog("#dlgFleetTransfer");

	//	Create a list of all locations to transfer to
	
	var listDesc = {
		content:content,

		yPos: yListControl,

		onSelectionChanged: onSelectionChanged,
		};

	//	Create control
		
	optionsListCtrl = new CanvasLongList(canvas, listDesc, null);

	//	Initialize

	var ctx = canvas[0].getContext("2d");
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	//	Draw the title

	ctx.font = $Style.tileFontLarge;
	ctx.fillStyle = $Style.dlgHighlightText;
	ctx.textBaseline = "top";
	ctx.textAlign = "left";
	ctx.fillText("Transfer from " + fleetObj.name + " to:", xLeftPadding, yTopPadding);

	//	Info

	drawInfo(canvas);

	//	Hook up the buttons
	
	$("#dlgFleetTransfer .ctrlCancel").on("click", doCancel);
	$("#dlgFleetTransfer .ctrlOK").on("click", doOK);
	$UI.keydown(onKeydown);
	}

//	BattlePlanTile -------------------------------------------------------------
//
//	MEMBER VARIABLES
//
//	cxWidth: The width of the tile
//	cyHeight: The height of the tile
//	data: This item is passed to any functions defined here.
//	id: An ID for the tile.
//	image: Image for the tile.
//	label: Label for the tile.
//	xPos: The position of the tile relative to the origin
//	yPos: The position of the tile relative to the origin
	
function BattlePlanTile (x, y, cxTile, cyTile, desc)
	{
	this.xPos = x;
	this.yPos = y;
	this.cxWidth = cxTile;
	this.cyHeight = cyTile;
	this.id = desc.id;
	this.cxImage = 64;
	this.cyImage = 32;
	this.cxInner = 4;
	this.cyInner = 4;
	this.label = desc.label;
	this.data = desc.data;
	}

BattlePlanTile.prototype.draw = function (ctx, x, y, isSelected)
	{
	//	Selection

	if (isSelected)
		{
		ctx.fillStyle = $Style.dlgSelectBackground;
		ctx.fillRect(x, y, this.cxWidth, this.cyHeight);
		}

	//	Paint the label

	var xText = x + this.cxWidth / 2;
	var yText = y + this.cyInner;
	var cxText = this.cxWidth - 2 * this.cxInner;

	ctx.fillStyle = $Style.dlgHighlightText;
	ctx.font = $Style.tileFontExtraLarge;
	ctx.textBaseline = "top";
	ctx.textAlign = "center";
	$UI.drawText(ctx, xText, yText, cxText, $Style.tileFontExtraLargeHeight, this.label);
	yText += 2 * $Style.tileFontExtraLargeHeight + this.cyInner;

	//	Paint orders

	ctx.font = $Style.tileFontLarge;
	ctx.fillStyle = $Style.tileTextNormal;
	$UI.drawText(ctx, xText, yText, cxText, $Style.tileFontLargeHeight, this.data.orderText);
	}

//	FleetTransferTile ----------------------------------------------------------
//
//	MEMBER VARIABLES
//
//	cxWidth: The width of the tile
//	cyHeight: The height of the tile
//	data: This item is passed to any functions defined here.
//	id: An ID for the tile.
//	image: Image for the tile.
//	label: Label for the tile.
//	xPos: The position of the tile relative to the origin
//	yPos: The position of the tile relative to the origin
	
function FleetTransferTile (x, y, cxTile, cyTile, desc)
	{
	this.xPos = x;
	this.yPos = y;
	this.cxWidth = cxTile;
	this.cyHeight = cyTile;
	this.id = desc.id;
	this.image = desc.image;
	this.cxImage = 96;
	this.cyImage = 48;
	this.cxInner = 4;
	this.cyInner = 4;
	this.label = desc.label;
	this.data = desc.data;
	}

FleetTransferTile.prototype.draw = function (ctx, x, y, isSelected)
	{
	//	Selection

	if (isSelected)
		{
		ctx.fillStyle = $Style.dlgSelectBackground;
		ctx.fillRect(x, y, this.cxWidth, this.cyHeight);
		}

	//	Paint the image

	var xImage = x + (this.cxWidth - this.cxImage) / 2;
	var yImage = y + this.cyInner;
	CanvasUtil.drawImage(ctx, xImage, yImage, this.cxImage, this.cyImage, this.image);

	//	Paint the label

	var xText = x + this.cxWidth / 2;
	var yText = yImage + this.cyImage;
	var cxText = this.cxWidth - 2 * this.cxInner;
	ctx.fillStyle = $Style.dlgHighlightText;
	ctx.font = $Style.dlgFontScale1;
	ctx.textBaseline = "top";
	ctx.textAlign = "center";
	$UI.drawText(ctx, xText, yText, cxText, $Style.dlgFontScale1Height, this.label);
	yText += 2 * $Style.dlgFontScale1Height + this.cyInner;

	//	Paint the resources of the destination

	ctx.font = $Style.tileFontExtraLargeBold;
	ctx.fillText(this.data.destCount, xText, yText);
	yText += $Style.tileFontExtraLargeHeight;

	//	Paint the resource of the source

	ctx.fillText(this.data.sourceCount, xText, yText);

	ctx.textAlign = "left";
	}
