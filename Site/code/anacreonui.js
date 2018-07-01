//	anacreonui.js
//
//	Implements core Anacreon UI functionality
//	Copyright (c) 2012 Kronosaur Productions, LLC. All Rights Reserved.

var $Style = {
	dlgSelectBackground: "#303030",
	dlgHighlightText: "#D9D9FF",
	dlgFadedText: "#808080",
	dlgErrorText: "#FF4040",
	
	dlgFontScale1: "8pt SansationRegular, Verdana, sans-serif",
	dlgFontScale1Height: 14,
	
	dlgFontScale2: "10pt SansationRegular, Verdana, sans-serif",
	dlgFontScale2Bold: "10pt SansationBold, Verdana, sans-serif",
	dlgFontScale2Height: 15,
	
	//	Map
	
	mapActionPath: "#FFFFB2",					//	H:60  S:30  B:100
	mapDisabledWorldText: "#666666",			//	H:0   S:0   B:40
	mapEnemyHighlight: "#FF6666",				//	H:0   S:60  B:100
	mapEnemyPath: "#b25959",					//	H:0   S:50  B:70
	mapEnemySelection: "#FF8080",				//	H:0   S:50  B:100
	mapEnemyTerritory: "#8f4747",				//	H:0   S:50  B:56
	mapEnemyTerritoryHighlight: "#ed7676",		//	H:0   S:50  B:93
	mapEnemyTradeLine: "#4d2828",				//	H:0   S:48  B:30
	mapEnemyUnit: "#FF8C8C",					//	H:0   S:45  B:100
	mapEnemyWorld: "#8f4747",					//	H:0   S:50  B:56
	mapFriendlyFleet: "#FFFFB2",				//	H:60  S:30  B:100
	mapFriendlyPath: "#ffffe5",					//	H:60  S:10  B:100
	mapFriendlyHighlight: "#bfbfff",			//	H:240 S:25  B:100
	mapFriendlyLAMRange: "#1f1e24",				//	H:250 S:17  B:14	(unused)
	mapFriendlySelection: "#D9D9FF",			//	H:240 S:15  B:100
	mapFriendlyTerritory: "#acacbf",			//	H:240 S:10  B:75
	mapFriendlyTerritoryFaded: "#8a8a99",		//	H:240 S:10  B:60
	mapFriendlyTradeLine: "#505059",			//	H:240 S:10  B:35
	mapFriendlyUnit: "#D9D9FF",					//	H:240 S:15  B:100
	mapFriendlyWorld: "#D9D9FF",				//	H:240 S:15  B:100
	mapFriendlyWorldBoxHighlight: "#7c7ca6",	//	H:240 S:25  B:65
	mapFriendlyWorldBoxNormal: "#7e7e8c",		//	H:240 S:10  B:55
	mapFriendlyWorldBoxFaded: "#676773",		//	H:240 S:10  B:45
	mapFriendlyWorldFaded: "#9595a6",			//	H:240 S:10  B:65
	mapIndependentWorldBox: "#4d4d4d",			//	H:0   S:0   B:30
	mapIndependentWorldText: "#999999",			//	H:0   S:0   B:60
	mapJumpBeaconRange: "rgba(77, 77, 69, 0.25)",//	H:60  S:10  B:50
	mapSafeOrbit: "rgba(77, 77, 69, 0.5)",		//	H:60  S:10  B:50
	mapSelectedTradeLine: "#9595a6",			//	H:240 S:10  B:65
	mapSelectedTradeLineArrow: "#acacbf",		//	H:240 S:10  B:75
	mapSelection: "#FFFFFF",					//	H:0   S:0   B:100
	mapSelectionDefaultRadius: 15,
	mapSelectionLineWidth: 2,
	mapTradeLineArrow: "#7e7e8c",				//	H:60  S:10  B:55
	mapWarningText: "#ffffd9",					//	H:60  S:15  B:100

	//	NavBar

	navBarButton: "#5f5f6e",
	
	//	Info Pane Tiles
	
	cxTilePadding: 4,
	cyTilePadding: 2,
	tileFontVerySmall: "6pt SansationRegular, Verdana, sans-serif",
	tileFontVerySmallHeight: 11,
	tileFontSmall: "8pt SansationRegular, Verdana, sans-serif",
	tileFontSmallHeight: 14,
	tileFontMedium: "10pt SansationRegular, Verdana, sans-serif",
	tileFontMediumBold: "10pt SansationBold, Verdana, sans-serif",
	tileFontMediumHeight: 15,
	tileFontLarge: "12pt SansationRegular, Verdana, sans-serif",
	tileFontLargeBold: "12pt SansationBold, Verdana, sans-serif",
	tileFontLargeHeight: 18,
	tileFontExtraLarge: "14pt SansationRegular, Verdana, sans-serif",
	tileFontExtraLargeBold: "14pt SansationBold, Verdana, sans-serif",
	tileFontExtraLargeHeight: 21,
	tileTextBright: "#FFFFD9",
	tileTextFaded: "#808080",
	tileTextHighlight: "#D9D9FF",
	tileTextNormal: "#A0A0A0",
	tileAccentBackground: "#3C1265",
	tileFadedBackground: "#202020",
	tileNormalBackground: "#404040",
	tileHoverBackground: "#808080",
	tileErrorBackground: "#FF4040",
	tileHighlightBackground: "#8080ff",
	};

//	BuildDataSelection ---------------------------------------------------------
//
//	MEMBERS
//
//	class: "buildData"
//	id: The ID of the object that owns us.
//	getInfoPanes(): Returns a list of info panes
//	getSpaceObjectID(): Returns the ID of the space object that we are
//		part of (or null).
//	kind: "spaceObjectPart"
//	name: The name of the object
//
//	industry: Industry (trait) that we're showing
//	industryType: Industry design type.
//	obj: The object that owns us.

function BuildDataSelection (obj, industry)
	{
	this["class"] = "buildData";
	this.id = obj.id;
	this.industry = industry;
	this.industryType = $Anacreon.designTypes[industry.traitID];
	this.kind = "spaceObjectPart";
	this.name = obj.name;
	this.obj = obj;

	this.canBeRenamed = obj.canBeRenamed;
	this.isWorld = obj.isWorld;
	this.sovereignID = obj.sovereignID;
	}

BuildDataSelection.prototype.calcImportStatus = function (obj)
	{
	return this.obj.calcImportStatus(obj);
	}

BuildDataSelection.prototype.canImportFrom = function (worldObj)
	{
	return this.obj.canImportFrom(worldObj);
	}
	
BuildDataSelection.prototype.drawGalacticMapBackground = function (ctx, mapMetrics, uiMode)
	{
	this.obj.drawGalacticMapBackground(ctx, mapMetrics, uiMode);
	}

BuildDataSelection.prototype.drawGalacticMapForeground = function (ctx, mapMetrics, uiMode)
	{
	this.obj.drawGalacticMapForeground(ctx, mapMetrics, uiMode);
	}

BuildDataSelection.prototype.drawGalacticMapSelection = function (ctx)
	{
	MapHelper.paintGalacticMapSelection(ctx, this.obj.mapPosX, this.obj.mapPosY, null);
	}
	
BuildDataSelection.prototype.getInfoPanes = function () 
	{
	var industryPane = {
		tabLabel: $Language.capitalizeTitle(this.industryType.nameDesc),
			
		paneDesc: {
			cxStdTile: 120,
			cyStdTile: 42,
			
			onGetTileList: (function (canvasGrid, data)

			//	data:
			//
			//		obj: The selected object. A BuildDataSelection object.
			
				{
				var tileList = [];
				var obj = data.obj.getSpaceObject();
				var industry = data.obj.industry;
				if (industry == null)
					return tileList;

				InfoPaneHelper.createIndustryInfoTiles(tileList, obj, industry);

				return tileList;
				}),
			},
			
		getCommandList: (function (objSelected)
			{
			var commandList = [];
			var obj = objSelected.getSpaceObject();
			var industryType = objSelected.industryType;
			var isForeign = (obj.sovereignID != $Anacreon.userInfo.sovereignID);

			//	Change allocation

			if (!isForeign
					&& industryType.playerAlloc
					&& industryType.buildComplete == null
					&& $Map.uiMode == null)
				{
				commandList.push({
					label: "Allocation",
					data: { obj: objSelected, industryID: industryType.id },
					onCommand: (function (e)
						{
						var obj = e.data.obj.getSpaceObject();
						var industryID = e.data.industryID;
						worldEditIndustryAllocationDialog(obj, industryID);
						})
					});
				}
			
			//	Destroy
			
			if (!isForeign 
					&& industryType.category == "improvement"
					&& !industryType.npeOnly
					&& industryType.buildTime
					&& $Map.uiMode == null)
				{
				commandList.push({
					label: "Destroy",
					data: { obj: objSelected, industryID: industryType.id },
					onCommand: (function (e)
						{
						var obj = e.data.obj.getSpaceObject();
						var industryID = e.data.industryID;
						worldDestroyImprovement(obj, industryID);
						})
					});
				}

			return commandList;
			}),
		};

	return this.obj.getInfoPanes(industryPane);
	}

BuildDataSelection.prototype.getSpaceObject = function ()
	{
	return this.obj;
	}

BuildDataSelection.prototype.getSpaceObjectID = function () 
	{
	return this.id;
	}

BuildDataSelection.prototype.refreshSelection = function ()
	{
	var obj = $Anacreon.objList[this.id];
	var industry = obj.getTrait(this.industry.traitID);

	if (obj && industry)
		return new BuildDataSelection(obj, industry);
	else
		return null;
	}

//	Language Helper ------------------------------------------------------------

var LanguageHelper =
	{
	};

//	Map Helper -----------------------------------------------------------------

var MapHelper =
	{
	hitTestGalacticMapSidePane: (function (xPos, yPos, obj)
		{
		//	Compute some metrics

		var maxRadius = $Map.maxWorldRadius;
		var worldRadius = maxRadius * obj.getSizeAdj();
		var outerRadius = worldRadius * 1.2;
		var inner = outerRadius + 10;

		var paneWidth = (obj.sidePaneMetrics ? obj.sidePaneMetrics.width : 150 + inner);
		var paneHeight = (obj.sidePaneMetrics ? obj.sidePaneMetrics.height : 3 * $Style.tileFontSmallHeight + 2 * $Style.cyTilePadding + 20);

		var xLeft = obj.mapPosX - paneWidth;
		var xRight = obj.mapPosX;
		var yTop = obj.mapPosY - paneHeight;
		var yBottom = obj.mapPosY;

		return (xPos >= xLeft && xPos < xRight && yPos >= yTop && yPos < yBottom);
		}),

	paintGalacticMapSidePane: (function (ctx, obj, text, cmdIcon, cmdLabel, isHovering)
		{
		var xCenter = obj.mapPosX;
		var yCenter = obj.mapPosY;

		//	Compute some metrics

		var maxRadius = $Map.maxWorldRadius;
		var worldRadius = maxRadius * obj.getSizeAdj();
		var outerRadius = worldRadius * 1.2;
		var inner = outerRadius + 10;

		var paneWidth = 150 + inner;
		var cxText = paneWidth - 4 * $Style.cxTilePadding;

		//	Compute the number of lines in the text

		ctx.font = $Style.tileFontSmall;
		var lineCount = Math.max(3, $UI.drawTextMeasure(ctx, cxText, $Style.tileFontSmallHeight, text).lines);

		//	If we have too many lines, then make the pane wider

		if (lineCount > 9)
			{
			paneWidth = 300 + inner;
			cxText = paneWidth - 4 * $Style.cxTilePadding;
			lineCount = $UI.drawTextMeasure(ctx, cxText, $Style.tileFontSmallHeight, text).lines;
			}

		var paneHeight = lineCount * $Style.tileFontSmallHeight + 4 * $Style.cyTilePadding + 20;

		//	Remember the pane height in the object (so we can hit test)

		obj.sidePaneMetrics = { height: paneHeight, width: paneWidth };

		//	Draw background
		
		var halfGap = 4;
		var startArc = 1.5 * Math.PI - (Math.sin(halfGap / inner));
		var endArc = Math.PI;
	
		ctx.save();
		ctx.beginPath();
		ctx.arc(xCenter, yCenter, inner, startArc, endArc, true);
		ctx.lineTo(xCenter - paneWidth, yCenter);
		ctx.lineTo(xCenter - paneWidth, yCenter - paneHeight);
		ctx.lineTo(xCenter - halfGap, yCenter - paneHeight);
		ctx.closePath();

		ctx.fillStyle = "#404040";
		ctx.fill();

		//	Clip to the background shape

		ctx.clip();

		//	Text metrics
		
		var xText = xCenter - paneWidth + 2 * $Style.cxTilePadding;
		var yText = yCenter - paneHeight + 2 * $Style.cyTilePadding;

		//	Zoom in button

		ctx.fillStyle = (isHovering ? $Style.tileHoverBackground : "#606060");
		ctx.fillRect(xCenter - paneWidth, yCenter - 20, paneWidth, 20);

		if (cmdIcon)
			$Map.drawIcon(ctx, cmdIcon, xCenter - paneWidth, yCenter - 20);

		ctx.fillStyle = $Style.tileTextNormal;
		ctx.font = $Style.tileFontSmall;
		ctx.textBaseline = "middle";
		ctx.textAlign = "left";
		ctx.fillText(cmdLabel, xCenter - paneWidth + 24, yCenter - 10);
	
		//	Draw text

		ctx.fillStyle = $Style.tileTextBright;
		ctx.font = $Style.tileFontSmall;
		ctx.textBaseline = "top";
		$UI.drawText(ctx, xText, yText, cxText, $Style.tileFontSmallHeight, text);

		ctx.restore();
		}),

	paintGalacticMapSelection: (function (ctx, x, y, radius)
		{
		if (radius == null)
			radius = $Style.mapSelectionDefaultRadius;

		ctx.strokeStyle = $Style.mapSelection;
		ctx.lineWidth = $Style.mapSelectionLineWidth;
		ctx.lineCap = "square";
		
		var arcSize = 0.33 * Math.PI;
		var arcInc = 0.5 * Math.PI;

		//	Draw four arcs around object
		
		var angle = 0.0;
		ctx.beginPath();
		ctx.arc(x, y, radius, angle, angle + arcSize, false);
		ctx.stroke();
		
		angle += arcInc;
		ctx.beginPath();
		ctx.arc(x, y, radius, angle, angle + arcSize, false);
		ctx.stroke();
		
		angle += arcInc;
		ctx.beginPath();
		ctx.arc(x, y, radius, angle, angle + arcSize, false);
		ctx.stroke();
		
		angle += arcInc;
		ctx.beginPath();
		ctx.arc(x, y, radius, angle, angle + arcSize, false);
		ctx.stroke();
		}),

	paintTacticalBoxSelection: (function (ctx, xLeft, yTop, xRight, yBottom, isEnemy)
		{
		var radius = 5;
		ctx.strokeStyle = (isEnemy ? $Style.mapEnemySelection : $Style.mapFriendlySelection);
		ctx.lineWidth = 2;
		ctx.lineCap = "square";
		
		var arcSize = 0.33 * Math.PI;
		var arcInc = 0.5 * Math.PI;
		var angle = (arcInc - arcSize) / 2;

		//	Draw four arcs around the corners
		
		ctx.beginPath();
		ctx.arc(xRight, yBottom, radius, angle, angle + arcSize, false);
		ctx.stroke();
		
		angle += arcInc;
		ctx.beginPath();
		ctx.arc(xLeft, yBottom, radius, angle, angle + arcSize, false);
		ctx.stroke();
		
		angle += arcInc;
		ctx.beginPath();
		ctx.arc(xLeft, yTop, radius, angle, angle + arcSize, false);
		ctx.stroke();
		
		angle += arcInc;
		ctx.beginPath();
		ctx.arc(xRight, yTop, radius, angle, angle + arcSize, false);
		ctx.stroke();

		//	Draw lines

		var radius2 = 2 * radius;

		ctx.beginPath();
		if (Math.abs(xLeft - xRight) > radius2)
			{
			ctx.moveTo(xLeft + radius, yTop - radius);
			ctx.lineTo(xRight - radius, yTop - radius);

			ctx.moveTo(xLeft + radius, yBottom + radius + 1);
			ctx.lineTo(xRight - radius, yBottom + radius + 1);
			}

		if (Math.abs(yTop - yBottom) > radius2)
			{
			ctx.moveTo(xRight + radius + 1, yTop + radius);
			ctx.lineTo(xRight + radius + 1, yBottom - radius);

			ctx.moveTo(xLeft - radius, yTop + radius);
			ctx.lineTo(xLeft - radius, yBottom - radius);
			}

		ctx.stroke();
		}),

	paintTacticalSelection: (function (ctx, x, y, isEnemy)
		{
		var radius = 5;
		ctx.strokeStyle = (isEnemy ? $Style.mapEnemySelection : $Style.mapFriendlySelection);
		ctx.lineWidth = 2;
		ctx.lineCap = "square";
		
		var arcSize = 0.33 * Math.PI;
		var arcInc = 0.5 * Math.PI;
		var angle = (arcInc - arcSize) / 2;

		//	Draw four arcs around object
		
		ctx.beginPath();
		ctx.arc(x, y, radius, angle, angle + arcSize, false);
		ctx.stroke();
		
		angle += arcInc;
		ctx.beginPath();
		ctx.arc(x, y, radius, angle, angle + arcSize, false);
		ctx.stroke();
		
		angle += arcInc;
		ctx.beginPath();
		ctx.arc(x, y, radius, angle, angle + arcSize, false);
		ctx.stroke();
		
		angle += arcInc;
		ctx.beginPath();
		ctx.arc(x, y, radius, angle, angle + arcSize, false);
		ctx.stroke();
		}),

	paintTimeLeftBox: (function (ctx, x, y, watchesLeft)
		{
		ctx.save();

		//	If less than 150 watches then we express the time in watches

		var label;
		if (watchesLeft < 60)
			{
			label = watchesLeft;
			var cxHalfText = (ctx.measureText(label).width / 2);

			ctx.lineWidth = $Style.dlgFontScale2Height + 2;
			ctx.lineCap = "round";

			ctx.beginPath();
			ctx.moveTo(x - cxHalfText, y);
			ctx.lineTo(x + cxHalfText, y);
			ctx.stroke();
			}

		//	Express in cycles

		else
			{
			var label = $Anacreon.formatDurationDigits(watchesLeft);
			var cxHalfText = (ctx.measureText(label).width / 2);
			var cyMargin = 2;
			var cxMargin = 12;

			var xLeft = x - (cxHalfText + cxMargin);
			var xRight = x + (cxHalfText + cxMargin);
			var yTop = y - (($Style.dlgFontScale2Height / 2) + cyMargin);
			var yBottom = y + (($Style.dlgFontScale2Height / 2) + cyMargin);

			var cyShort = cyMargin * 2;
			var cyLong = (yBottom - yTop) - cyShort;
			var cxLong = cyLong * 0.5773;	//	tan (30 degrees)

			ctx.beginPath();
			ctx.moveTo(xLeft, yBottom);
			ctx.lineTo(xLeft, yBottom - cyShort);
			ctx.lineTo(xLeft + cxLong, yTop);
			ctx.lineTo(xRight, yTop);
			ctx.lineTo(xRight, yTop + cyShort);
			ctx.lineTo(xRight - cxLong, yBottom);
			ctx.closePath();
			ctx.fill();
			}

		ctx.font = $Style.dlgFontScale2Bold;
		ctx.fillStyle = "#000000";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(label, x, y);

		ctx.restore();
		}),
	};

