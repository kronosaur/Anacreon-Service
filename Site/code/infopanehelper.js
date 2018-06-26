//	infopanehelper.js
//
//	Info Pane Helper functions
//	Copyright (c) 2012 Kronosaur Productions, LLC. All Rights Reserved.

//	CanvasGrid Tile Helpers ----------------------------------------------------

var InfoPaneHelper =
	{
	clickBuildData: (function (canvasGrid, tileID, data)
	
	//	data:
	//
	//		obj: The object that owns the industry
	//		industry: Industry info (trait)
	//		resType: Product to change
	
		{
		worldEditProductAllocationDialog(data.obj,
				data.industry,
				data.resType,
				data.curAlloc);
		}),

    clickIndustryData: (function (canvasGrid, tileID, data)
        {
        var newSel = new BuildDataSelection(data.obj, data.industry);
        $Map.selectObject(newSel, 3);
        }),

	clickSellData: (function (cavasGrid, tileID, data)
		{
		worldSellResourcesDialog(data.sellerObj,
				data.buyerObj,
				data.resType);
		}),
		
	clickTechImportData: (function (cavasGrid, tileID, data)
		{
		worldEditTechImportDialog(data.importerObj,
				data.exporterObj,
				data.targetTech);
		}),
		
	clickTradeData: (function (cavasGrid, tileID, data)
		{
		worldEditTradeRouteDialog(data.importerObj,
				data.exporterObj,
				data.resType);
		}),
		
	createImageTile: (function (label, value, image)
		{
		return {
			cyTile: 1,
			data: { label: label, value: value, image: image },
			onPaint: InfoPaneHelper.paintImageTile,
			};
		}),
		
	createIndustryInfoTiles: (function (tileList, obj, industry)
		{
		var i;
        var designationType = $Anacreon.designTypes[obj.designation];
        var industryType = $Anacreon.designTypes[industry.traitID];

        //  Add an initial tile to describe the industry

        tileList.push({
            cxTile: 180,
			cyTile: 160,
			data: { obj: obj, industry: industry },
			onPaint: InfoPaneHelper.paintIndustryTile
            });
					
		//	List all resources we can (and cannot) build

        if (industry.buildData)
            {
			var enableProductAlloc = (industry.buildData.length > 3
					&& (industry.isFixed || industry.isPrimary)
					&& industryType.playerProductAlloc);

			for (i = 0; i < industry.buildData.length; i += 3)
				{
				var resType = $Anacreon.designTypes[industry.buildData[i]];
				var alloc = industry.buildData[i + 1];
				var cannotBuild = industry.buildData[i + 2];
				var isDisabled = false;

				//	If we cannot build something because it is obsolete, skip it entirely.

				if (cannotBuild && cannotBuild[0] == "obsolete")
					continue;
						
				//	Compose text

				var cannotBuildText;
				if (cannotBuild == null)
					{
					var j;
							
					//	Find current production numbers
							
					var productionCount = 0;
					if (industry.productionData)
						{
						for (j = 0; j < industry.productionData.length; j += 3)
							if (industry.productionData[j] == resType.id)
								{
								var production = industry.productionData[j + 1];
								if (production < 10)
									productionCount = $Anacreon.formatNumberAsFloat(production, 1);
								else
									productionCount = $Anacreon.formatNumberAsInteger(production);
								break;
								}
						}
					
					cannotBuildText = "Producing " + productionCount + " per watch.";
					}
				else if (cannotBuild[0] == "res")
					{
					var neededType = $Anacreon.designTypes[cannotBuild[1]];
							
					cannotBuildText = "Import or produce " + neededType.nameDesc + " to build.";
					isDisabled = true;
					}
				else if (cannotBuild[0] == "tech")
					{
					var techLevel = $Anacreon.techLevels[cannotBuild[1]];
							
					cannotBuildText = "World must be " + techLevel.name + " level to produce.";
					isDisabled = true;
					}
				else if (cannotBuild[0] == "improve")
					{
					var neededType = $Anacreon.designTypes[cannotBuild[1]];
							
					cannotBuildText = "Build " + neededType.nameDesc + " to produce.";
					isDisabled = true;
					}
				else if (cannotBuild[0] == "unavailable")
					{
					cannotBuildText = "Unable to produce " + neededType.nameDesc + " on world.";
					isDisabled = true;
					}
				else
					{
					cannotBuildText = "Cannot build: " + cannotBuild[0];
					isDisabled = true;
					}
						
				//	Create tile descriptor
						
				var theTile = {
					cyTile: 160,
					data: 
						{
						obj: obj,
						industry: industry,
						resType: resType,
						value: alloc + "%",
						text: cannotBuildText,
						disabled: isDisabled,
						curAlloc: alloc
						},
					onPaint: InfoPaneHelper.paintBuildDataTile,
					onClick: ((!isDisabled && enableProductAlloc) ? InfoPaneHelper.clickBuildData : null),
					};
						
				tileList.push(theTile);
				}
            }
		}),
		
	createResourceTiles: (function (tileList, resources)
		{
		var i;
		
		if (resources == null)
			return;
			
		//	Add all resources
		
		for (i = 0; i < resources.length; i += 2)
			{
			tileList.push({
				cyTile: 1,
				data: { resType: resources[i], resCount: $Anacreon.formatNumberAsInteger(resources[i + 1]) },
				onPaint: InfoPaneHelper.paintResourceTile,
				});
			}
		}),
		
	createSalesTiles: (function (tileList, buyerObj, sellerObj, purchases)
		{
		var i;

		if (purchases)
			{
			var sellerSovereign = $Anacreon.sovereignList[sellerObj.sovereignID];
			var canSell = sellerSovereign.exportsResources();
			var isAHub = sellerObj.isTradingHub();
			var isReady = (sellerObj.buildComplete == null);

			for (i = 0; i < purchases.length; i += 4)
				{
				var resType = $Anacreon.designTypes[purchases[i]];
				var optimal = purchases[i + 1];
				var price = purchases[i + 2];
				var actual = purchases[i + 3];

				var value = $Anacreon.formatNumberAsInteger(optimal);

				var text;
				if (!canSell)
					text = "Doctrine must be Trade & Enterprise to sell resources.";
				else if (!isAHub)
					text = sellerObj.name + " must be a trading hub to sell resources.";
				else if (!isReady)
					text = sellerObj.name + " is still being built.";
				else if (optimal == 0)
					text = sellerObj.name + " is not selling " + resType.nameDesc + ".";
				else if (price == 0.0)
					text = sellerObj.name + " is selling " + resType.nameDesc + ".";
				else if (actual == null)
					text = sellerObj.name + " sold " +
							$Anacreon.formatNumberAsInteger(optimal) + " per watch (" + $Anacreon.formatNumberAsInteger(price) + " aes' worth).";
				else
					text = sellerObj.name + " sold " +
							$Anacreon.formatNumberAsInteger(actual) + " per watch (" + $Anacreon.formatNumberAsInteger(price) + " aes' worth).";

				var theTile = {
					cyTile: 160,
					data: 
						{
						disabled: (!canSell || !isAHub || !isReady || optimal == 0),
						buyerObj: buyerObj,
						sellerObj: sellerObj,
						resType: resType,
						value: value,
						text: text
						},
					onPaint: InfoPaneHelper.paintBuildDataTile,
					onClick: ((canSell && isAHub && isReady) ? InfoPaneHelper.clickSellData : null),
					};

				tileList.push(theTile);
				}
			}
		}),

	createStatsTile: (function (label, value, stat)
		{
		return {
			cyTile: 1,
			data: { label: label, value: value, stat: stat },
			onPaint: InfoPaneHelper.paintStatsTile,
			};
		}),

	createTechImportTile: (function (tileList, importerObj, exporterObj, importTech)
		{
		var targetTech = Math.floor(importTech[0]);
		var techCount = Math.ceil(importTech[1]);

		var text;
		if (importTech[2] == "lack")
			text = "Not enough capacity on " + exporterObj.name + " to uplift.";
		else if (targetTech < importerObj.techLevel)
			text = importerObj.name + " is too advanced to be influenced by " + exporterObj.name;
		else if (techCount == 0)
			{
			if (importerObj.techLevel < targetTech)
				text = "Establishing relationship with " + exporterObj.name;
			else
				text = importerObj.name + " is already at this level.";
			}
		else
			text = importerObj.name + " is being uplifted " + techCount + (techCount == 1 ? " tech level" : " tech levels");
		
		var theTile = {
				cyTile: 160,
				data:
					{
					disabled: (targetTech < importerObj.techLevel),
					importerObj: importerObj,
					exporterObj: exporterObj,
					targetTech: targetTech,
					text: text,
					},
				onPaint: InfoPaneHelper.paintTechImportTile,
				onClick: InfoPaneHelper.clickTechImportData,
				};

		tileList.push(theTile);
		}),
		
	createTradeResourceTiles: (function (tileList, importerObj, exporterObj, imports)
		{
		var i;

		if (imports)
			{
			for (i = 0; i < imports.length; i += 4)
				{
				var resType = $Anacreon.designTypes[imports[i]];
				var alloc = imports[i + 1];
				var optimal = imports[i + 2];
				var actual = imports[i + 3];

				var value = (Math.round(alloc * 10) / 10) + "%";

				var text;
				if (alloc == 0)
					text = importerObj.name + " does not need " + resType.nameDesc + ".";
				else if (actual == null)
					text = importerObj.name + " is importing " +
							$Anacreon.formatNumberAsInteger(optimal) + " per watch.";
				else
					text = importerObj.name + " wants to import " +
							$Anacreon.formatNumberAsInteger(optimal) + " per watch (only " + $Anacreon.formatNumberAsInteger(actual) + " available).";

				var theTile = {
					cyTile: 160,
					data: 
						{
						disabled: (alloc == 0),
						importerObj: importerObj,
						exporterObj: exporterObj,
						resType: resType,
						value: value,
						text: text
						},
					onPaint: InfoPaneHelper.paintBuildDataTile,
					onClick: InfoPaneHelper.clickTradeData,
					};

				tileList.push(theTile);
				}
			}
		}),

	paintBuildDataTile: (function (ctx, xPos, yPos, cxWidth, cyHeight, data)
	
	//	data:
	//
	//		resType: Type of resource we are building
	//		value: Main display value
	//		text: Explanation text
	//		disabled: Paint faded text
	
		{
		ctx.textBaseline = "top";
		
		var xInner = xPos + $Style.cxTilePadding;
		var yInner = yPos + $Style.cyTilePadding;
		var cxInner = cxWidth - 2 * $Style.cxTilePadding;
		var cyInner = cyHeight - 2 * $Style.cyTilePadding;
		
		//	Paint the name of the resource at the top.
		
		var xText = xInner + (cxInner / 2);
		var yText = yInner;
		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = (data.disabled ? $Style.tileTextFaded : $Style.tileTextHighlight);
		ctx.textAlign = "center";
		yText += $UI.drawText(ctx, xText, yText, cxInner, $Style.tileFontMediumHeight, data.resType.nameDesc);
		
		//	Paint the resource image
		
		var imageHeight = 48;
		var imageWidth = 64;
		var imageX = xInner + (cxInner - imageWidth) / 2;
		var imageY = yInner + 2 * $Style.tileFontMediumHeight;

		if (data.disabled)
			{
			ctx.globalAlpha = 0.5;
			CanvasUtil.drawImage(ctx, imageX, imageY, imageWidth, imageHeight, data.resType.imageSmall);
			ctx.globalAlpha = 1.0;
			}
		else
			CanvasUtil.drawImage(ctx, imageX, imageY, imageWidth, imageHeight, data.resType.imageSmall);
		
		//	Paint the main value
		
		yText = imageY + imageHeight + $Style.cyTilePadding;
		ctx.font = $Style.tileFontExtraLargeBold;
		ctx.fillStyle = (data.disabled ? $Style.tileTextFaded : $Style.tileTextHighlight);
		yText += $UI.drawText(ctx, xText, yText, cxInner, $Style.tileFontExtraLargeHeight, data.value);
		
		//	Paint the text below
		
		if (data.text != null)
			{
			yText += $Style.tileFontSmallHeight;
			
			ctx.font = $Style.tileFontSmall;
			ctx.fillStyle = $Style.tileTextNormal;
			yText += $UI.drawText(ctx, xText, yText, cxInner, $Style.tileFontSmallHeight, data.text);
			}
		
		ctx.textAlign = "left";
		}),

	paintButton: (function (ctx, buttonImage, buttonLabel, xPos, yPos, cxWidth, cyHeight)
		{
		ctx.drawImage(buttonImage, xPos, yPos);

		//	Label

		ctx.fillStyle = "ffffff";
		ctx.font = $Style.tileFontLargeBold;
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";

		var xText = xPos + (cxWidth / 2);
		var yText = yPos + (cyHeight / 2);

		ctx.fillText(buttonLabel, xText, yText);
		}),
		
	paintFeatureTile: (function (ctx, xPos, yPos, cxWidth, cyHeight, data)
	
	//	data:
	//
	//		obj: The object that owns the industry
	//		trait: Trait object
	//		traitType: Trait definitions
	
		{
		var i;
		var obj = data.obj;
		var trait = data.trait;
		var traitType = data.traitType
		
		ctx.textBaseline = "top";
		
		var xInner = xPos + $Style.cxTilePadding;
		var yInner = yPos + $Style.cyTilePadding;
		var cxInner = cxWidth - 2 * $Style.cxTilePadding;
		var cyInner = cyHeight - 2 * $Style.cyTilePadding;
		
		//	Paint the image
		
		var imageHeight = 32;
		var imageWidth = 32;
		var imageX = xInner;
		var imageY = yInner;
		
		ctx.fillStyle = "#606060";
		ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
		
		//	Name of trait
		
		var xText = imageX + imageWidth + $Style.cxTilePadding;
		var yText = yInner;
		var cxText = cxInner - (imageWidth + $Style.cxTilePadding);
		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = $Style.tileTextHighlight;
		yText += $UI.drawText(ctx, xText, yText, cxText, $Style.tileFontMediumHeight, traitType.nameDesc);
		}),
		
	paintImageTile: (function (ctx, xPos, yPos, cxWidth, cyHeight, data)
		{
		ctx.textBaseline = "top";
		
		var xInner = xPos + $Style.cxTilePadding;
		var yInner = yPos + $Style.cyTilePadding;
		var cxInner = cxWidth - 2 * $Style.cxTilePadding;
		var cyInner = cyHeight - 2 * $Style.cyTilePadding;
		
		var yText = yInner;
		InfoPaneHelper.paintTileLabel(ctx, xInner, yText, data.label);
		yText += $Style.tileFontSmallHeight;
		
		//	Paint the text
		
		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = $Style.tileTextHighlight;
		$UI.drawText(ctx, xInner, yText, cxInner, $Style.tileFontMediumHeight, data.value);
		
		//	Paint the image
		
		var imageHeight = 32;
		var imageWidth = 32;
		var imageX = xInner + cxInner - imageWidth;
		var imageY = yInner + (cyInner - imageHeight) / 2;
		
		ctx.fillStyle = "#606060";
		ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
		}),
		
	paintIndustryTile: (function (ctx, xPos, yPos, cxWidth, cyHeight, data)
	
	//	data:
	//
	//		obj: The object that owns the industry
	//		industry: Industry info (trait)
	
		{
		function paintLine (x, y, cxWidth, label, value, unit)
			{
			var text;
			if (unit)
				text = $Anacreon.formatNumberAsInteger(value) + " " + (value != 1.0 ? unit + "s" : unit);
			else
				text = $Anacreon.formatNumberAsInteger(value);

			ctx.font = $Style.tileFontSmall;
			ctx.fillStyle = "#A0A0A0";
			ctx.fillText(label, x, y);
				
			ctx.textAlign = "right";
			ctx.fillStyle = "#D9D9FF";
			ctx.fillText(text, x + cxWidth, y);
			ctx.textAlign = "left";
			}

		var i;
		var obj = data.obj;
		var industry = data.industry;
		var industryType = $Anacreon.designTypes[industry.traitID];
		
		ctx.textBaseline = "top";
		
		var xInner = xPos + $Style.cxTilePadding;
		var yInner = yPos + $Style.cyTilePadding;
		var cxInner = cxWidth - 2 * $Style.cxTilePadding;
		var cyInner = cyHeight - 2 * $Style.cyTilePadding;
		
		//	Paint the image
		
		var imageHeight = 32;
		var imageWidth = 32;
		var imageX = xInner;
		var imageY = yInner;
		
		ctx.fillStyle = "#606060";
		ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
		
		//	Industry allocation
		
		if (industry.targetAllocation != null)
			{
			ctx.font = $Style.tileFontLarge;
			ctx.fillStyle = $Style.tileTextHighlight;
			ctx.textAlign = "right";
			ctx.fillText($Anacreon.formatNumberAsInteger(industry.workUnits), xInner + cxInner, yInner);
			
			ctx.font = $Style.tileFontSmall;
			ctx.fillStyle = $Style.tileTextLabel;
			var allocText = (industry.targetAllocation == industry.allocation
					? Math.round(10 * industry.allocation) / 10 + "%"
					: Math.round(10 * industry.allocation) / 10 + "% [" + Math.round(10 * industry.targetAllocation) / 10 + "%]");
			
			ctx.fillText(allocText, xInner + cxInner, yInner + $Style.tileFontLargeHeight);
			ctx.textAlign = "left";
			}
		
		//	Name of industry
		
		var xText = imageX + imageWidth + $Style.cxTilePadding;
		var yText = yInner;
		var cxText = (xPos + cxWidth - (imageWidth + 2 * $Style.cxTilePadding)) - xText;
		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = $Style.tileTextHighlight;
		yText += $UI.drawText(ctx, xText, yText, cxText, $Style.tileFontMediumHeight, industryType.nameDesc);
		
		//	Building?
		
		if (industry.buildComplete != null)
			{
			var designationType = $Anacreon.designTypes[obj.designation];

			//	Figure out how many milliseconds until we're done
			
			var complete = $Anacreon.percentComplete(industry.buildComplete, industryType.buildTime);
			
			//	Draw
			
			var xCenter = xInner + (cxInner / 2);
			var yCenter = yInner + imageHeight + 2 * $Style.cyTilePadding + 16;
			
			InfoPaneHelper.paintProgress(ctx, xCenter, yCenter, complete);

			//	Draw time remaining

			yText = yCenter + 20;
			xText = xCenter;
			ctx.font = $Style.tileFontExtraLargeBold;
			ctx.fillStyle = $Style.tileTextHighlight;
			ctx.textAlign = "center";
			ctx.fillText($Anacreon.formatDurationDigits(industry.buildComplete - $Anacreon.update),
					xText,
					yText);
			yText += $Style.tileFontExtraLargeHeight;

			//	Draw explanation, if necessary

			var explanation = null;
			if (designationType.role == "sectorCapital"
					&& industryType.role == "administration")
				explanation = "Sector capital is under construction.";

			if (explanation)
				{
				ctx.font = $Style.tileFontMedium;
				ctx.fillStyle = $Style.tileTextNormal;

				yText += $UI.drawText(ctx, xText, yText, cxInner, $Style.tileFontMediumHeight, explanation);
				}

			ctx.textAlign = "left";
			}
		
		//	Industry description
		
		else
			{
			yText = yInner + imageHeight + 2 * $Style.cyTilePadding;

			//	If we have tech export data, then show it now

			if (industry.techExportData)
				{
				paintLine(xInner, yText, cxInner, "capacity", industry.techExportData[0], "tech level");
				yText += $Style.tileFontSmallHeight;

				paintLine(xInner, yText, cxInner, "used", industry.techExportData[1], "tech level");
				yText += $Style.tileFontSmallHeight;

				var available = industry.techExportData[0] - industry.techExportData[1];
				paintLine(xInner, yText, cxInner, "available", available, "tech level");
				yText += $Style.tileFontSmallHeight;
				}
			}
		}),

	paintMessageBox: (function (ctx, xPos, yPos, cxWidth, cyHeight, message, color)
		{
		//	Create a path for the box outline

		var cyCorner = 32;
		var cxCorner = Math.floor(Math.tan(Math.PI / 6.0) * cyCorner);
		ctx.beginPath();
		ctx.moveTo(xPos + cxCorner, yPos);
		ctx.lineTo(xPos + cxWidth, yPos);
		ctx.lineTo(xPos + cxWidth, yPos + cyHeight - cyCorner);
		ctx.lineTo(xPos + cxWidth - cxCorner, yPos + cyHeight);
		ctx.lineTo(xPos, yPos + cyHeight);
		ctx.lineTo(xPos, yPos + cyCorner);
		ctx.closePath();

		//	Fill an opaque area with the color

		ctx.globalAlpha = 0.5;
		ctx.fillStyle = color;
		ctx.fill();

		//	Stroke an outline

		ctx.globalAlpha = 1.0;
		ctx.strokeStyle = color;
		ctx.stroke();

		//	Now paint the text inside

		var cxSpacing = cxCorner + 4;
		var cySpacing = $Style.tileFontMediumHeight / 2;
		var xText = xPos + cxSpacing;
		var yText = yPos + cySpacing;
		var cxText = cxWidth - (2 * cxSpacing);

		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = $Style.dlgHighlightText;
		ctx.textBaseline = "top";
		ctx.textAlign = "left";
		$UI.drawText(ctx, xText, yText, cxText, $Style.tileFontMediumHeight, message);
		}),

	paintNewsTile: (function (ctx, xPos, yPos, cxWidth, cyHeight, data)
	
	//	data:
	//
	//		obj: The object that owns the industry
	//		entry: News entry
	
		{
		var i;
		var obj = data.obj;
		var entry = data.entry;
		
		ctx.textBaseline = "top";
		
		var xInner = xPos + $Style.cxTilePadding;
		var yInner = yPos + $Style.cyTilePadding;
		var cxInner = cxWidth - 2 * $Style.cxTilePadding;
		var cyInner = cyHeight - 2 * $Style.cyTilePadding;
		
		//	Paint the image
		
		var imageHeight = 24;
		var imageWidth = 24;
		var imageX = xInner;
		var imageY = yInner;
		
		ctx.fillStyle = "#606060";
		ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
		
		//	Text
		
		var xText = imageX + imageWidth + $Style.cxTilePadding;
		var yText = yInner;
		var cxText = cxInner - (imageWidth + $Style.cxTilePadding);
		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = $Style.tileTextNormal;
		$UI.drawText(ctx, xText, yText, cxText, $Style.tileFontMediumHeight, entry.text);
		}),
		
	paintProgress: (function (ctx, x, y, percentDone, clockRadius, clockStyle)
		{
		var radius = (clockRadius ? clockRadius : 16);
		var style = (clockStyle ? clockStyle : $Style.tileTextHighlight);
		
		//	As radians
		
		var sweep = percentDone * 2 * Math.PI;
		var start = 1.5 * Math.PI;
		var end = start + sweep;

		//	Paint the pie wedge
		
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.arc(x, y, radius, start, end, false);
		ctx.closePath();

		ctx.fillStyle = style;
		ctx.fill();

		//	Paint the outline

		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
		ctx.closePath();

		ctx.strokeStyle = style;
		ctx.globalAlpha = 0.5;
		ctx.stroke();
		ctx.globalAlpha = 1;
		}),
		
	paintRebellionInfo: (function (ctx, xPos, yPos, cxWidth, cyHeight, data)
	
	//	data:
	//
	//		obj: The object that owns the industry
	//		rebellion: Rebellion trait
	
		{
		function paintLine (x, y, cxWidth, label, value, unit)
			{
			var text;

			if (typeof(value) == "string")
				text = value;
			else if (unit)
				text = $Anacreon.formatNumberAsInteger(value) + " " + (value != 1.0 ? unit + "s" : unit);
			else
				text = $Anacreon.formatNumberAsInteger(value);

			var xCenter = x + (cxWidth / 2);

			ctx.font = $Style.tileFontMedium;
			ctx.fillStyle = $Style.tileTextNormal;
			ctx.textAlign = "right";
			ctx.fillText(label, xCenter - $Style.cxTilePadding, y);
				
			ctx.fillStyle = $Style.tileTextHighlight;
			ctx.textAlign = "left";
			ctx.fillText(text, xCenter + $Style.cxTilePadding, y);
			}

		var i;
		var obj = data.obj;
		var rebellion = data.rebellion;
		
		ctx.textBaseline = "top";
		
		var xInner = xPos + $Style.cxTilePadding;
		var yInner = yPos + $Style.cyTilePadding;
		var cxInner = cxWidth - 2 * $Style.cxTilePadding;
		var cyInner = cyHeight - 2 * $Style.cyTilePadding;
		
		//	Paint the image
		
		var imageHeight = 24;
		var imageWidth = 24;
		var imageX = xInner;
		var imageY = yInner;
		
		ctx.fillStyle = "#606060";
		ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
		
		//	Text
		
		var xText = imageX + imageWidth + $Style.cxTilePadding;
		var yText = yInner;
		var cxText = cxInner - (imageWidth + $Style.cxTilePadding);
		ctx.font = $Style.tileFontLarge;
		ctx.fillStyle = $Style.tileTextHighlight;
		ctx.fillText("Rebellion", xText, yText);

		yText += $Style.tileFontLargeHeight;

		//	Compute rebellion support

		var support;
		if (rebellion.popularSupport < -3)
			support = "very strong imperial support";
		else if (rebellion.popularSupport > 3)
			support = "unquestioning rebel support";
		else
			support = [
				"strong imperial support",		//	-3
				"imperial support",				//	-2
				"partial imperial support",		//	-1
				"neutral",						//	0
				"rebel support",				//	1
				"strong rebel support",			//	2
				"very strong rebel support",	//	3
				][rebellion.popularSupport + 3];

		//	Paint stats

		paintLine(xText, yText, cxText, "rebel forces", rebellion.rebelForces);
		yText += $Style.tileFontMediumHeight;

		paintLine(xText, yText, cxText, "popular support", support);
		yText += $Style.tileFontMediumHeight;

		paintLine(xText, yText, cxText, "rebellion duration", $Anacreon.formatDuration($Anacreon.update - rebellion.rebellionStart));
		yText += $Style.tileFontMediumHeight;
		}),
		
	paintResourceTile: (function (ctx, xPos, yPos, cxWidth, cyHeight, data)
		{
		ctx.textBaseline = "top";
		
		var xInner = xPos + $Style.cxTilePadding;
		var yInner = yPos + $Style.cyTilePadding;
		var cxInner = cxWidth - 2 * $Style.cxTilePadding;
		var cyInner = cyHeight - 2 * $Style.cyTilePadding;
		
		//	Resource image
		
		var imageWidth = 48;
		var imageHeight = 24;
		var imageX = xInner;
		var imageY = yInner + (cyInner - imageHeight) / 2;
		
		ctx.fillStyle = "#606060";
		ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
		
		//	Name of resource
		
		var yText = yInner;
		ctx.font = $Style.tileFontSmall;
		ctx.fillStyle = $Style.tileTextHighlight;
		yText += $UI.drawText(ctx, 
			xInner, 
			yText, 
			cxInner - (imageWidth + 2 * $Style.cxTilePadding), 
			$Style.tileFontSmallHeight, 
			$Anacreon.designTypes[data.resType].nameDesc);
		
		//	Resource count
		
		var textX = xInner + cxInner;
		var textY = yInner + (cyInner - $Style.tileFontExtraLargeHeight) / 2;
		
		ctx.font = $Style.tileFontExtraLargeBold;
		ctx.fillStyle = $Style.tileTextHighlight;
		ctx.textAlign = "right";
		ctx.fillText(data.resCount, textX, textY);
		ctx.textAlign = "left";
		}),

	paintSiegeInfo: (function (ctx, xPos, yPos, cxWidth, cyHeight, data)
	
		//	data:
		//
		//		obj: The object that is being sieged
		//		siege: Siege object
		
			{
			function paintLine (x, y, cxWidth, label, value, unit)
				{
				var text;
	
				if (typeof(value) == "string")
					text = value;
				else if (unit)
					text = $Anacreon.formatNumberAsInteger(value) + " " + (value != 1.0 ? unit + "s" : unit);
				else
					text = $Anacreon.formatNumberAsInteger(value);
	
				var xCenter = x + (cxWidth / 2);
	
				ctx.font = $Style.tileFontMedium;
				ctx.fillStyle = $Style.tileTextNormal;
				ctx.textAlign = "right";
				ctx.fillText(label, xCenter - $Style.cxTilePadding, y);
					
				ctx.fillStyle = $Style.tileTextHighlight;
				ctx.textAlign = "left";
				ctx.fillText(text, xCenter + $Style.cxTilePadding, y);
				}
	
			var i;
			var obj = data.obj;
			var siege = data.siege;
			
			ctx.textBaseline = "top";
			
			var xInner = xPos + $Style.cxTilePadding;
			var yInner = yPos + $Style.cyTilePadding;
			var cxInner = cxWidth - 2 * $Style.cxTilePadding;
			var cyInner = cyHeight - 2 * $Style.cyTilePadding;
			
			//	Paint the image
			
			var imageHeight = 24;
			var imageWidth = 24;
			var imageX = xInner;
			var imageY = yInner;
			
			ctx.fillStyle = "#606060";
			ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
			
			//	Text
			
			var xText = imageX + imageWidth + $Style.cxTilePadding;
			var yText = yInner;
			var cxText = cxInner - (imageWidth + $Style.cxTilePadding);
			ctx.font = $Style.tileFontLarge;
			ctx.fillStyle = $Style.tileTextHighlight;
			ctx.fillText("Siege", xText, yText);
	
			yText += $Style.tileFontLargeHeight;
			}),
			
	paintSmallStat: (function (ctx, xPos, yPos, label, stat, statStyle)
		{
		var labelToPaint = label + ": ";

		if (ctx.textAlign == "left")
			{
			ctx.fillStyle = $Style.tileTextNormal;
			ctx.fillText(labelToPaint, xPos, yPos);

			var cxLabel = ctx.measureText(labelToPaint).width + 4;
			xPos += cxLabel;

			if (statStyle)
				ctx.fillStyle = statStyle;
			else
				ctx.fillStyle = $Style.tileTextHighlight;
			ctx.fillText(stat, xPos, yPos);
			}
		else
			{
			if (statStyle)
				ctx.fillStyle = statStyle;
			else
				ctx.fillStyle = $Style.tileTextHighlight;
			ctx.fillText(stat, xPos, yPos);

			var cxLabel = ctx.measureText(stat).width + 4;
			xPos -= cxLabel;

			ctx.fillStyle = $Style.tileTextNormal;
			ctx.fillText(labelToPaint, xPos, yPos);
			}
		}),

	paintSovereignStatsTile: (function (ctx, xPos, yPos, cxWidth, cyHeight, data)
		{
		function paintLine (label, value)
			{
			ctx.font = $Style.tileFontMedium;
			ctx.fillStyle = "#A0A0A0";
			ctx.fillText(label, xInner, yText);
				
			ctx.textAlign = "right";
			ctx.fillStyle = "#D9D9FF";
			ctx.fillText(value, xInner + cxInner, yText);
			ctx.textAlign = "left";

			yText += $Style.tileFontMediumHeight;
			}

		var sovereign = data.sovereign;
		if (sovereign == null)
			return;

		var stats = sovereign.stats;

		ctx.textBaseline = "top";
		
		var xInner = xPos + $Style.cxTilePadding;
		var yInner = yPos + $Style.cyTilePadding;
		var cxInner = cxWidth - 2 * $Style.cxTilePadding;
		var cyInner = cyHeight - 2 * $Style.cyTilePadding;

		//	Paint the image
		
		var imageHeight = 32;
		var imageWidth = 32;
		var imageX = xInner;
		var imageY = yInner;
		
		ctx.fillStyle = "#606060";
		ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
		
		//	Name of empire
		
		var xText = imageX + imageWidth + $Style.cxTilePadding;
		var yText = yInner;
		var cxText = (xPos + cxWidth - (imageWidth + 2 * $Style.cxTilePadding)) - xText;
		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = $Style.tileTextHighlight;
		yText += $UI.drawText(ctx, xText, yText, cxText, $Style.tileFontMediumHeight, sovereign.name);

		//	Stats

		yText = yInner + imageHeight + 2 * $Style.cyTilePadding;

		paintLine("founded", $Anacreon.formatAge($Anacreon.update - sovereign.foundedOn));

		if (sovereign.doctrine)
			paintLine("doctrine", $Anacreon.designTypes[sovereign.doctrine].nameDesc);

		paintLine("worlds", stats.worlds);
		paintLine("population", $Anacreon.formatPopulation(stats.population));
		paintLine("tech level", $Anacreon.techLevels[stats.techLevel].name);
		paintLine("imperial might", $Anacreon.formatNumberAsInteger(sovereign.imperialMight));

		if (sovereign.secessionChance != null)
			{
			var chance;
			if (sovereign.secessionChance == 0)
				chance = "none";
			else if (sovereign.secessionChance < 0.01)
				chance = "negligible";
			else if (sovereign.secessionChance < 0.02)
				chance = "very low";
			else if (sovereign.secessionChance < 0.05)
				chance = "low";
			else if (sovereign.secessionChance < 0.1)
				chance = "elevated";
			else if (sovereign.secessionChance < 0.2)
				chance = "high";
			else if (sovereign.secessionChance < 0.5)
				chance = "very high";
			else
				chance = "certain";

			paintLine("risk of secession", chance);
			}
		}),
		
	paintStatsTile: (function (ctx, xPos, yPos, cxWidth, cyHeight, data)
		{
		ctx.textBaseline = "top";
		
		var xInner = xPos + $Style.cxTilePadding;
		var yInner = yPos + $Style.cyTilePadding;
		var cxInner = cxWidth - 2 * $Style.cxTilePadding;
		var cyInner = cyHeight - 2 * $Style.cyTilePadding;
		
		var yText = yInner;
		InfoPaneHelper.paintTileLabel(ctx, xInner, yText, data.label);
		yText += $Style.tileFontSmallHeight;
		
		//	Paint the text
		
		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = $Style.tileTextHighlight;
		$UI.drawText(ctx, xInner, yText, cxInner, $Style.tileFontMediumHeight, data.value);
		
		//	Paint the stat
		
		var textX = xInner + cxInner;
		var textY = yInner + (cyInner - $Style.tileFontExtraLargeHeight) / 2;
		
		ctx.font = $Style.tileFontExtraLargeBold;
		ctx.fillStyle = $Style.tileTextHighlight;
		ctx.textAlign = "right";
		ctx.fillText(data.stat, textX, textY);
		ctx.textAlign = "left";
		}),
		
	paintStructureTile: (function (ctx, xPos, yPos, cxWidth, cyHeight, data)
	
	//	data:
	//
	//		obj: The object that owns the industry
	//		industry: Industry info (trait)
	
		{
		var i;
		var obj = data.obj;
		var industry = data.industry;
		var industryType = $Anacreon.designTypes[industry.traitID];
		
		ctx.textBaseline = "top";
		
		var xInner = xPos + $Style.cxTilePadding;
		var yInner = yPos + $Style.cyTilePadding;
		var cxInner = cxWidth - 2 * $Style.cxTilePadding;
		var cyInner = cyHeight - 2 * $Style.cyTilePadding;
		
		//	Name of industry
		
		var xText = xInner + (cxInner / 2);
		var yText = yInner;
		var cxText = cxInner;
		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = $Style.tileTextHighlight;
        ctx.textAlign = "center";
		yText += $UI.drawText(ctx, xText, yText, cxText, $Style.tileFontMediumHeight, industryType.nameDesc);
        ctx.textAlign = "left";
		
		//	Paint the image
		
		var imageHeight = 32;
		var imageWidth = 64;
		var imageX = xInner + (cxInner - imageWidth) / 2;
		var imageY = yInner + 2 * $Style.tileFontMediumHeight;
		
		ctx.fillStyle = "#606060";
		ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
		
		//	Industry allocation
		
		if (industry.targetAllocation != null)
			{
            //  Paint the % allocation

            if (industry.targetAllocation != 0)
                {
		        yText = imageY + imageHeight;
		        ctx.font = $Style.tileFontExtraLargeBold;
		        ctx.fillStyle = (industry.targetAllocation == industry.allocation ? $Style.tileTextHighlight : $Style.tileTextFaded);
                ctx.textAlign = "center";
		        yText += $UI.drawText(ctx, xText, yText, cxInner, $Style.tileFontExtraLargeHeight, industry.targetAllocation + "%");
                }

            //   Paint actual work units


            if (industry.workUnits != 0)
                {
    		    ctx.textAlign = "right";
			    ctx.font = $Style.tileFontSmall;
			    ctx.fillStyle = $Style.tileTextHighlight;

			    ctx.fillText($Anacreon.formatNumberAsInteger(industry.workUnits), 
                        xInner + cxInner,
                        imageY + imageHeight + $Style.tileFontExtraLargeHeight - $Style.tileFontSmallHeight);
                }

            //  Paint actual allocation, if not the same

			if (industry.allocation != industry.targetAllocation)
                {
       		    ctx.textAlign = "left";
			    ctx.font = $Style.tileFontSmall;
			    ctx.fillStyle = $Style.tileTextLabel;

			    ctx.fillText(Math.round(10 * industry.allocation) / 10 + "%", 
                        xInner,
                        imageY + imageHeight + $Style.tileFontExtraLargeHeight - $Style.tileFontSmallHeight);
                }

            ctx.textAlign = "left";
			}
		
		//	Building?
		
		if (industry.buildComplete != null)
			{
			//	Figure out how many milliseconds until we're done
			
			var complete = $Anacreon.percentComplete(industry.buildComplete, industryType.buildTime);
			
			//	Draw
			
			var xCenter = xInner + (cxInner / 2);
			var yCenter = imageY + (imageHeight / 2);
			
			InfoPaneHelper.paintProgress(ctx, xCenter, yCenter, complete);
			}
		}),
		
	paintTacticalCloseUp: (function (ctx, xPos, yPos, cxWidth, cyHeight, data)
	
	//	data: tactical object
	
		{
		ctx.textBaseline = "top";
		
		var xInner = xPos + $Style.cxTilePadding;
		var yInner = yPos + $Style.cyTilePadding;
		var cxInner = cxWidth - 2 * $Style.cxTilePadding;
		var cyInner = cyHeight - 2 * $Style.cyTilePadding;
		
		//	Draw status at the top
		
		var yText = yInner;
		
		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = $Style.tileTextHighlight;
		$UI.drawText(ctx, xInner, yText, cxInner, $Style.tileFontMediumHeight, data.status);
		}),
		
	paintTechImportTile: (function (ctx, xPos, yPos, cxWidth, cyHeight, data)
	
	//	data:
	//
	//		targetTech: Target tech level
	//		text: Explanation text
	//		disabled: Paint faded text
	
		{
		ctx.textBaseline = "top";
		
		var xInner = xPos + $Style.cxTilePadding;
		var yInner = yPos + $Style.cyTilePadding;
		var cxInner = cxWidth - 2 * $Style.cxTilePadding;
		var cyInner = cyHeight - 2 * $Style.cyTilePadding;
		
		//	Paint the name of the resource at the top.
		
		var xText = xInner + (cxInner / 2);
		var yText = yInner;
		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = (data.disabled ? $Style.tileTextFaded : $Style.tileTextHighlight);
		ctx.textAlign = "center";
		yText += $UI.drawText(ctx, xText, yText, cxInner, $Style.tileFontMediumHeight, "tech level improvement");
		
		//	Paint the tech level image
		
		var imageHeight = 32;
		var imageWidth = 64;
		var imageX = xInner + (cxInner - imageWidth) / 2;
		var imageY = yInner + 3 * $Style.tileFontMediumHeight;
		
		ctx.fillStyle = (data.disabled ? "#404040" : "#606060");
		ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
		
		//	Paint the main value
		
		yText = imageY + imageHeight;
		ctx.font = $Style.tileFontExtraLargeBold;
		ctx.fillStyle = (data.disabled ? $Style.tileTextFaded : $Style.tileTextHighlight);
		$UI.drawText(ctx, xText, yText, cxInner, $Style.tileFontExtraLargeHeight, $Anacreon.techLevels[data.targetTech].name);
		yText += 2 * $Style.tileFontExtraLargeHeight;
		
		//	Paint the text below
		
		if (data.text != null)
			{
			ctx.font = $Style.tileFontSmall;
			ctx.fillStyle = $Style.tileTextNormal;
			yText += $UI.drawText(ctx, xText, yText, cxInner, $Style.tileFontSmallHeight, data.text);
			}
		
		ctx.textAlign = "left";
		}),

	paintTileLabel: (function (ctx, xPos, yPos, value)
		{
		ctx.fillStyle = "#808080";
		ctx.font = $Style.tileFontSmall;
		ctx.fillText(value, xPos, yPos);
		}),
		
	paintUnitStats: (function (ctx, xPos, yPos, cxWidth, cyHeight, data)
	
	//	data:
	//
	//		unitCount: Number of units
	//		unitType: Design type object
	
		{
		var i;
		
		ctx.textBaseline = "top";
		
		var xInner = xPos + $Style.cxTilePadding;
		var yInner = yPos + $Style.cyTilePadding;
		var cxInner = cxWidth - 2 * $Style.cxTilePadding;
		var cyInner = cyHeight - 2 * $Style.cyTilePadding;
		
		var yText = yInner;
		var cyInc;
		
		//	Draw the unit type
		
		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = $Style.tileTextHighlight;
		cyInc = $UI.drawText(ctx, 
			xInner, 
			yText, 
			cxInner - (3 * $Style.tileFontExtraLargeHeight), 
			$Style.tileFontMediumHeight, 
			data.unitType.nameDesc);
			
		//	Draw number of units
		
		ctx.font = $Style.tileFontExtraLargeBold;
		ctx.fillStyle = $Style.tileTextHighlight;
		ctx.textAlign = "right";
		ctx.fillText(data.unitCount, xInner + cxInner, yText);
		ctx.textAlign = "left";
		
		yText += $Style.tileFontExtraLargeHeight;
		
		//	Draw image
		
		var imageWidth = 128;
		var imageHeight = 96;
		var imageX = xInner + (cxInner - imageWidth) / 2;
		var imageY = yText;
		
		CanvasUtil.drawImage(ctx, imageX, imageY, imageWidth, imageHeight, data.unitType.imageLarge);
		yText += imageHeight;
		
		//	Stats
		
		for (i = 0; i < data.unitType.stats.length; i += 2)
			{
			ctx.font = $Style.tileFontSmall;
			ctx.fillStyle = $Style.tileTextNormal;
			ctx.fillText(data.unitType.stats[i], xInner, yText);
			
			ctx.textAlign = "right";
			ctx.fillStyle = $Style.tileTextHighlight;
			ctx.fillText(data.unitType.stats[i + 1], xInner + cxInner, yText);
			ctx.textAlign = "left";
			
			yText += $Style.tileFontSmallHeight;
			}
		}),
		
	paintIconAndText: (function (ctx, x, y, cxWidth, imageDesc, label, text)
		{
		ctx.textBaseline = "top";
		
		//	Paint the icon
		
		var imageHeight = 32;
		var imageWidth = (imageDesc == null ? 1 : 32);
		var imageX = x;
		var imageY = y;

		if (imageDesc == null || imageDesc.length == 0)
			{
			ctx.fillStyle = "#606060";
			ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
			}
		else
			{
			var imageType = $Anacreon.designTypes[imageDesc[0]];
			if (imageType != null)
				{
				ctx.drawImage(imageType.imageElement,
						imageDesc[1],
						imageDesc[2],
						imageDesc[3],
						imageDesc[4],
						imageX,
						imageY,
						imageWidth,
						imageHeight);
				}
			}
		
		//	Paint the label
		
		var xText = x + imageWidth + $Style.cxTilePadding;
		var yText = y;
		InfoPaneHelper.paintTileLabel(ctx, xText, yText, label);
		yText += $Style.tileFontSmallHeight;
		
		//	Paint the text
		
		var cxText = cxWidth - (imageWidth + $Style.cxTilePadding);
		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = $Style.tileTextHighlight;
		$UI.drawText(ctx, xText, yText, cxText, $Style.tileFontMediumHeight, text);
		}),

	paintIconAndTextAndProgress: (function (ctx, x, y, cxWidth, imageDesc, label, text, progress)
		{
		ctx.textBaseline = "top";
		
		//	Paint the icon
		
		var imageHeight = 32;
		var imageWidth = 32;
		var imageX = x;
		var imageY = y;

		if (imageDesc == null || imageDesc.length == 0)
			{
			ctx.fillStyle = "#606060";
			ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
			}
		else
			{
			var imageType = $Anacreon.designTypes[imageDesc[0]];
			if (imageType != null)
				{
				ctx.drawImage(imageType.imageElement,
						imageDesc[1],
						imageDesc[2],
						imageDesc[3],
						imageDesc[4],
						imageX,
						imageY,
						imageWidth,
						imageHeight);
				}
			}
		
		//	Paint the label
		
		var xText = x + imageWidth + $Style.cxTilePadding;
		var yText = y;
		InfoPaneHelper.paintTileLabel(ctx, xText, yText, label);
		yText += $Style.tileFontSmallHeight;
		
		//	Paint the text
		
		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = $Style.tileTextNormal;
		var cxText = ctx.measureText(text).width;
		ctx.fillText(text, xText, yText);

		//	Paint progress

		var radius = 12;
		var xCenter = xText + cxText + $Style.cxTilePadding + radius;
		var yCenter = yText;

		InfoPaneHelper.paintProgress(ctx, xCenter, yCenter, progress, radius, $Style.tileTextNormal);
		}),

	paintResourceProductionTile: (function (ctx, xPos, yPos, cxWidth, cyHeight, data)
		{
		function paintLine (label, value, optimal)
			{
			if (optimal != 0)
				{
				var valueText = (value < 10 ? $Anacreon.formatNumberAsFloat(value, 1) : $Anacreon.formatNumberAsInteger(value));

				ctx.font = $Style.tileFontSmall;
				ctx.fillStyle = "#A0A0A0";
				ctx.fillText(label, xInner, yText);

				ctx.font = $Style.tileFontMedium;
				ctx.textAlign = "right";
				ctx.fillStyle = "#D9D9FF";
				if (value == optimal)
					ctx.fillText(valueText, xInner + cxInner, yText);
				else
					{
					var optimalText = (optimal < 10 ? $Anacreon.formatNumberAsFloat(optimal, 1) : $Anacreon.formatNumberAsInteger(optimal));
					ctx.fillText(valueText + " [" + optimalText + "]", xInner + cxInner, yText);
					}

				ctx.textAlign = "left";

				yText += $Style.tileFontMediumHeight;
				}
			}

		var i;
		var obj = data.obj;
		var resData = data.resData;
		
		ctx.textBaseline = "top";
		
		var xInner = xPos + $Style.cxTilePadding;
		var yInner = yPos + $Style.cyTilePadding;
		var cxInner = cxWidth - 2 * $Style.cxTilePadding;
		var cyInner = cyHeight - 2 * $Style.cyTilePadding;
		
		//	Paint the image
		
		var imageHeight = 32;
		var imageWidth = 32;
		var imageX = xInner;
		var imageY = yInner;
		
		ctx.fillStyle = "#606060";
		ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
		
		//	Name of resource
		
		var xText = imageX + imageWidth + $Style.cxTilePadding;
		var yText = yInner;
		var cxText = cxInner - (imageWidth + $Style.cxTilePadding);
		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = $Style.tileTextHighlight;
		yText += $UI.drawText(ctx, xText, yText, cxText, $Style.tileFontMediumHeight, resData.resType.nameDesc);

		//	Itemized production

		yText = yInner + imageHeight + $Style.cyTilePadding;

		ctx.textBaseline = "alphabetic";
		yText += $Style.tileFontSmallHeight;
		paintLine("produced", resData.produced, resData.producedOptimal);
		paintLine("imported", resData.imported, resData.importedOptimal);
		paintLine("consumed", resData.consumed, resData.consumedOptimal);
		paintLine("exported", resData.exported, resData.exportedOptimal);
		paintLine("available", resData.available, resData.available);
		ctx.textBaseline = "top";
		}),
		
	paintResourceUnit: (function (ctx, x, y, cxResBox, alignment, resType, resCount)
		{
		var cyHeight = 16;
		
		var xPos = x;
		var yPos = y + (cyHeight / 2);
		
		ctx.textBaseline = "middle";
		
		//	Paint image
		
		var imageHeight = 16;
		var imageWidth = 32;
		var imageX = (alignment == "right" ? xPos - imageWidth : xPos);
		var imageY = yPos - (imageHeight / 2);
		
		ctx.fillStyle = "#606060";
		ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
		
		var advance = imageWidth + $Style.cxTilePadding;
		if (alignment == "right")
			advance = -advance;
			
		xPos += advance;
		
		//	Paint the count
		
		ctx.font = $Style.tileFontLarge;
		ctx.fillStyle = $Style.tileTextHighlight;
		ctx.textAlign = alignment;
		ctx.fillText(resCount, xPos, yPos);
		
		advance = ctx.measureText(resCount).width + 2 * $Style.cxTilePadding;
		if (alignment == "right")
			advance = -advance;
			
		xPos += advance;
		
		//	Paint name
		
		ctx.font = $Style.tileFontSmall;
		ctx.fillStyle = $Style.tileTextNormal;
		ctx.fillText(resType.nameDesc, xPos, yPos);
		
		ctx.textAlign = "left";
		}),
		
	paintSmallIconAndText: (function (ctx, x, y, cxResBox, alignment, icon, text)
		{
		var cyHeight = 16;
		
		var xPos = x;
		var yPos = y + (cyHeight / 2);
		
		ctx.textBaseline = "middle";
		
		//	Paint image
		
		var imageHeight = 16;
		var imageWidth = 32;
		var imageX = (alignment == "right" ? xPos - imageWidth : xPos);
		var imageY = yPos - (imageHeight / 2);
		
		ctx.fillStyle = "#606060";
		ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
		
		var advance = imageWidth + $Style.cxTilePadding;
		if (alignment == "right")
			advance = -advance;
			
		xPos += advance;
		
		//	Paint name
		
		ctx.font = $Style.tileFontSmall;
		ctx.fillStyle = $Style.tileTextNormal;
		ctx.textAlign = alignment;
		ctx.fillText(text, xPos, yPos);
		
		ctx.textAlign = "left";
		}),
		
	paintSmallValue: (function (ctx, x, y, cxWidth, label, value)
		{
		ctx.textAlign = "center";
		
		//	Paint the label
		
		var xText = x + (cxWidth / 2);
		var yText = y;
		
		InfoPaneHelper.paintTileLabel(ctx, xText, yText, label);
		yText += $Style.tileFontSmallHeight;

		//	Paint stat
		
		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = $Style.tileTextHighlight;
		ctx.fillText(value, xText, yText);
		
		ctx.textAlign = "left";
		}),

	paintTechLevelIcon: (function (ctx, techLevel, x, y, cxWidth, cyHeight, backgroundColor)
		{
		var imageInfo = TECH_LEVEL_ICONS[techLevel - 1];
		if (imageInfo)
			{
			if (backgroundColor)
				{
				ctx.beginPath();
				ctx.arc(x + cxWidth / 2, y + cyHeight / 2, cxWidth / 2, 0, 2 * Math.PI, false);
				ctx.closePath();

				ctx.fillStyle = backgroundColor;
				ctx.fill();
				}

			ctx.drawImage($Map.techLevelIcons, 
					imageInfo[0],
					imageInfo[1],
					48,
					48,
					x,
					y,
					cxWidth,
					cyHeight);
			}
		}),
		
	paintTechLevelInfo: (function (ctx, x, y, cxWidth, label, techLevel, text)
		{
		ctx.textBaseline = "top";
		
		//	Paint the image
		
		var imageWidth = 32;
		var imageHeight = 32;
		InfoPaneHelper.paintTechLevelIcon(ctx, techLevel, x, y, imageWidth, imageHeight, "#000000");
		
		//	Paint the label
		
		var xText = x + imageWidth + $Style.cxTilePadding;
		var yText = y;
		InfoPaneHelper.paintTileLabel(ctx, xText, yText, label);
		yText += $Style.tileFontSmallHeight;
		
		//	Paint the text
		
		var cxText = cxWidth - (imageWidth + $Style.cxTilePadding);
		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = $Style.tileTextHighlight;
		$UI.drawText(ctx, xText, yText, cxText, $Style.tileFontMediumHeight, text);
		}),

	paintValue: (function (ctx, x, y, cxWidth, label, value, extraValue)
		{
		ctx.textAlign = "center";
		
		//	Paint the label
		
		var xText = x + (cxWidth / 2);
		var yText = y;
		
		InfoPaneHelper.paintTileLabel(ctx, xText, yText, label);
		yText += $Style.tileFontSmallHeight;

		//	Paint stat
		
		if (extraValue)
			{
			ctx.textAlign = "left";
			ctx.font = $Style.tileFontExtraLargeBold;
			var cxValue = ctx.measureText(value).width;

			ctx.font = $Style.tileFontMedium;
			var cxExtraValue = ctx.measureText(extraValue).width;

			var cxTotal = cxValue + cxExtraValue;

			var xValue = xText - (cxTotal / 2);

			ctx.fillStyle = $Style.tileTextHighlight;
			ctx.font = $Style.tileFontExtraLargeBold;
			ctx.fillText(value, xValue, yText);

			xValue += cxValue;
			ctx.font = $Style.tileFontMedium;
			ctx.fillText(extraValue, xValue, yText);
			}
		else
			{
			ctx.font = $Style.tileFontExtraLargeBold;
			ctx.fillStyle = $Style.tileTextHighlight;
			ctx.fillText(value, xText, yText);
		
			ctx.textAlign = "left";
			}
		}),

	paintFleetTile: (function (ctx, xPos, yPos, cxWidth, cyHeight, data)

	//	data:
	//		obj: object
	
		{
		var i;
		var obj = data.obj;
		
		ctx.textBaseline = "top";
		
		var xInner = xPos + $Style.cxTilePadding;
		var yInner = yPos + $Style.cyTilePadding;
		var cxInner = cxWidth - 2 * $Style.cxTilePadding;
		var cyInner = cyHeight - 2 * $Style.cyTilePadding;
		
		var cyRow = cyInner / 4;

		//	Compute some properties
		
		var forces = obj.getForceComposition();
		var speed = obj.getFTLSpeed();
		if (speed == null)
			speed = "N/A";
		else
			speed = speed + " ly per watch";

		//	Compute status
					
		var status;
		if (obj.battlePlan != null)
			{
			if (obj.battlePlan.objective == "invasion")
				status = "invading " + $Anacreon.objList[obj.anchorObjID].name;
			else
				status = "in combat";
			}
		else if (obj.dest != null)
			status = "in transit";
		else
			status = "at destination";

		//	Compute metrics

		var BBoxCount = 1;
		var cxBBox = 140;

		var CBoxCount = 3;
		var cxCBox = 80;

		var ABoxCount = 1;
		var cxABox = 140;
		
		var cxDBox = 64;

		//	Paint top bar

		var x = xInner;
		var y = yInner;
		
		InfoPaneHelper.paintIconAndText(ctx, x, y, cxBBox, [ ], "sovereign", $Anacreon.sovereignList[obj.sovereignID].name);
		x += cxBBox + $Style.cxTilePadding;
		
		InfoPaneHelper.paintIconAndText(ctx, x, y, cxABox, null, "status", status);
		x += cxABox + $Style.cxTilePadding;

		InfoPaneHelper.paintIconAndText(ctx, x, y, cxBBox, null, "speed", speed);
		x += cxBBox + $Style.cxTilePadding;

//		InfoPaneHelper.paintIconAndText(ctx, x, y, cxCBox, null, "space forces", $Anacreon.formatNumberAsFloat(forces.spaceForces / 100.0, 1));
		x += cxCBox + $Style.cxTilePadding;
		
//		InfoPaneHelper.paintIconAndText(ctx, x, y, cxCBox, null, "ground forces", $Anacreon.formatNumberAsFloat(forces.groundForces / 100.0, 1));
		x += cxCBox + $Style.cxTilePadding;
		
		//	Paint ships and cargo

		var resources = obj.resources;
		if (obj.resources)
			{
			var cxUnits = cxWidth - (cxCBox + 2 * cxDBox + 3 * $Style.cxTilePadding);
			var yUnits = yInner + cyRow + $Style.cyTilePadding;
			var cyUnits = cyHeight - (yUnits - yPos);

			UnitRegionHelper.paint(ctx, xPos, yUnits, cxUnits, cyUnits, obj.resources, forces, {
				showCargo:true,
				});
			}
		}),

	paintWorldTile: (function (ctx, xPos, yPos, cxWidth, cyHeight, data)
	
	//	data:
	//		obj: object
	
		{
		var i;
		var obj = data.obj;
		
		ctx.textBaseline = "top";
		
		var xInner = xPos + $Style.cxTilePadding;
		var yInner = yPos + $Style.cyTilePadding;
		var cxInner = cxWidth - 2 * $Style.cxTilePadding;
		var cyInner = cyHeight - 2 * $Style.cyTilePadding;
		
		var cxCol = (cxWidth - (5 * $Style.cxTilePadding)) / 4;
		var xCol1 = xPos + $Style.cxTilePadding;
		var xCol2 = xCol1 + cxCol + $Style.cxTilePadding;
		var xCol3 = xCol2 + cxCol + $Style.cxTilePadding;
		var xCol4 = xCol3 + cxCol + $Style.cxTilePadding;
		
		var cyCol = cyInner;
		var yCol = yInner;
		
		var cyRow = cyCol / 4;
		
		//	Draw the planet horizon

		var worldClass = $Anacreon.designTypes[obj.worldClass];
		var planetR = cxInner / 2;
		var planetH = cyRow;
		var halfAngle = Math.acos((planetR - planetH) / planetR);
		
		var xPlanet = xPos + (cxWidth / 2);
		var yPlanet = yPos + cyHeight + planetR - planetH;
		
		var centerAngle = 1.5 * Math.PI;
		
		if (worldClass.imageLarge != null)
			{
			var imageType = $Anacreon.designTypes[worldClass.imageLarge[0]];

			ctx.save();
			ctx.beginPath();
			ctx.arc(xPlanet, 
					yPos + cyHeight - planetH + (worldClass.imageLarge[4] / 2), 
					worldClass.imageLarge[4] / 2,
					0,
					2 * Math.PI,
					false);
			ctx.clip();

			ctx.drawImage(imageType.imageElement,
					worldClass.imageLarge[1],
					worldClass.imageLarge[2],
					worldClass.imageLarge[3],
					planetH,
					xPlanet - (worldClass.imageLarge[3] / 2),
					yPos + cyHeight - planetH,
					worldClass.imageLarge[3],
					planetH);

			ctx.restore();
			}
		else
			{
			ctx.beginPath();
			ctx.arc(xPlanet, yPlanet, planetR, centerAngle - halfAngle, centerAngle + halfAngle, false);
			ctx.closePath();

			ctx.fillStyle = "#D9D9FF";
			ctx.fill();
			}

		//	Compute metrics

		var BBoxCount = 2;
		var cxBBox = 140;

		var CBoxCount = 3;
		var cxCBox = 80;

		var DBoxCount = 2;
		var cxDBox = 64;

		var cxRemainder = cxInner -
				((cxBBox * BBoxCount)
					+ (cxCBox * CBoxCount)
					+ (cxDBox * DBoxCount)
					+ ($Style.cxTilePadding * (BBoxCount + CBoxCount + DBoxCount - 1)));

		var ABoxCount = 1;
		var cxABox = (cxRemainder - (ABoxCount * $Style.cxTilePadding)) / ABoxCount;
		
		//	Paint top bar

		var longBoxCount = 3;
		var shortBoxCount = 5;
		var cxShortBox = 64;
		var cxLastSection = (shortBoxCount * cxShortBox) + ((shortBoxCount - 1) * $Style.cxTilePadding);
		
		var cxStatsBox = (cxInner - cxLastSection - ((longBoxCount - 1) * $Style.cxTilePadding)) / longBoxCount;
		var x = xInner;
		var y = yInner;
		
		InfoPaneHelper.paintIconAndText(ctx, x, y, cxBBox, [ ], "sovereign", $Anacreon.sovereignList[obj.sovereignID].name);
		x += cxBBox + $Style.cxTilePadding;
		
		var designationType = $Anacreon.designTypes[obj.designation];
		if (obj.buildComplete)
			InfoPaneHelper.paintIconAndTextAndProgress(ctx, x, y, cxABox, designationType.imageSmall, "designation", designationType.nameDesc, $Anacreon.percentComplete(obj.buildComplete, obj.buildTime));
		else
			InfoPaneHelper.paintIconAndText(ctx, x, y, cxABox, designationType.imageSmall, "designation", designationType.nameDesc);
		x += cxABox + $Style.cxTilePadding;
		
        var techLevelValue = $Anacreon.techLevels[obj.techLevel].name + " [" + obj.techLevel;
        if (obj.targetTechLevel)
            {
            if (obj.targetTechLevel > obj.techLevel)
				techLevelValue = techLevelValue + " \u2191" + obj.targetTechLevel;
			else
				techLevelValue = techLevelValue + " \u2193" + obj.targetTechLevel;
            }
		techLevelValue = techLevelValue + "]";

		var forces = obj.getForceComposition();

		var popValue = SpaceObject.populationValue(obj.population);
		var popTargetValue = (obj.targetPopulation ? SpaceObject.populationValue(obj.targetPopulation) : null);
		if (popTargetValue != null && popTargetValue != popValue)
			{
			if (obj.targetPopulation > obj.population)
				popTargetValue = " [\u2191" + popTargetValue + "]";
			else
				popTargetValue = " [\u2193" + popTargetValue + "]";
			}
		else
			popTargetValue = null;

		InfoPaneHelper.paintTechLevelInfo(ctx, x, y, cxBBox, "tech level", obj.techLevel, techLevelValue);
		x += cxBBox + $Style.cxTilePadding;
		
		//InfoPaneHelper.paintIconAndText(ctx, x, y, cxCBox, null, "space forces", $Anacreon.formatNumberAsFloat(forces.spaceForces / 100.0, 1));
		x += cxCBox + $Style.cxTilePadding;
		
		//InfoPaneHelper.paintIconAndText(ctx, x, y, cxCBox, null, "ground forces", $Anacreon.formatNumberAsFloat(forces.groundForces / 100.0, 1));
		x += cxCBox + $Style.cxTilePadding;
		
		InfoPaneHelper.paintIconAndText(ctx, x, y, cxCBox, null, "social order", obj.revIndex);
		x += cxCBox + $Style.cxTilePadding;
		
		InfoPaneHelper.paintValue(ctx, x, y, cxDBox, "population", popValue, popTargetValue);
		x += cxDBox + $Style.cxTilePadding;
		
		InfoPaneHelper.paintValue(ctx, x, y, cxDBox, "efficiency", obj.efficiency + "%");
		x += cxDBox + $Style.cxTilePadding;
		
		//	Paint defenses & ground forces

		if (obj.resources)
			{
			var cxUnits = cxWidth - (cxCBox + 2 * cxDBox + 3 * $Style.cxTilePadding);
			var yUnits = yInner + cyRow + $Style.cyTilePadding;
			var cyUnits = cyHeight - (yUnits - yPos);

			UnitRegionHelper.paint(ctx, xPos, yUnits, cxUnits, cyUnits, obj.resources, forces, {
				alwaysShowGroundForces: true,
				});
			}

		//	Paint features
		
		var cxResBox = cxCol;
		var cyResBox = 18;
		x = xInner + cxInner;
		y = yInner + cyInner - cyResBox;
		
		for (i = 0; i < obj.traits.length; i++)
			{
			var trait = obj.traits[i];
			var traitType = $Anacreon.designTypes[trait.traitID];
			
			if (traitType.category == "feature" && !traitType.hidden)
				{
				InfoPaneHelper.paintSmallIconAndText(ctx, x, y, cxResBox, "right", null, traitType.nameDesc);
				
				y -= cyResBox;
				}
			}
			
		//	Paint world class
		
		y += (cyResBox - ($Style.tileFontMediumHeight + $Style.cyTilePadding));
		
		ctx.font = $Style.tileFontMedium;
		ctx.fillStyle = $Style.tileTextHighlight;
		ctx.textBaseline = "top";
		ctx.textAlign = "right";
		ctx.fillText($Anacreon.designTypes[obj.worldClass].nameDesc, x, y);
		ctx.textAlign = "left";
		}),
	};

var UnitRegionHelper = {

	paint: (function (ctx, xPos, yPos, cxWidth, cyHeight, resources, forces, options) 
		{
		var i;

		if (options == null) options = { };

		//	Make separate arrays for all ground units and all space forces

		var groundForces = [];
		var spaceForces = [];
		var cargo = [];
		var cargoMass = 0;
		for (i = 0; i < resources.length; i += 2)
			{
			var resType = $Anacreon.designTypes[resources[i]];
			var resCount = resources[i + 1];

			if (resType.category == "groundUnit")
				groundForces.push({
					unitType: resType,
					unitCount: resources[i + 1]
					});
			else if (resType.category == "fixedUnit" 
					|| resType.category == "orbitalUnit" 
					|| resType.category == "maneuveringUnit" 
					|| resType.category == "LAMUnit")
				spaceForces.push({
					unitType: resType,
					unitCount: resources[i + 1]
					});
			else if (options.showCargo)
				{
				cargo.push({
					unitType: resType,
					unitCount: resources[i + 1]
					});

				cargoMass += resType.mass * resources[i + 1];
				}
			}

		//	Sort the resulting arrays

		spaceForces.sort(this.unitCompare);
		groundForces.sort(this.unitCompare);

		//	Calculate metrics

		var paintDesc = this.calcSize(ctx, cxWidth - (this.TITLE_WIDTH + $Style.cxTilePadding), cyHeight, groundForces, spaceForces, cargo);

		//	Paint space forces

		var xUnits = xPos;
		var yUnits = yPos;

		this.paintUnitGroup(ctx, xUnits, yUnits, cxWidth, paintDesc.spaceForcesPaint, spaceForces);
		InfoPaneHelper.paintIconAndText(ctx, xUnits + $Style.cxTilePadding, yUnits, this.TITLE_WIDTH, null, "space forces", $Anacreon.formatNumberAsFloat(forces.spaceForces / 100.0, 1));
			
		//	Paint ground forces

		if (groundForces.length || options.alwaysShowGroundForces)
			{
			yUnits += (paintDesc.spaceForcesPaint.rows * this.ROW_HEIGHT) + $Style.cyTilePadding;

			this.paintUnitGroup(ctx, xUnits, yUnits, cxWidth, paintDesc.groundForcesPaint, groundForces);
			InfoPaneHelper.paintIconAndText(ctx, xUnits + $Style.cxTilePadding, yUnits, this.TITLE_WIDTH, null, "ground forces", $Anacreon.formatNumberAsFloat(forces.groundForces / 100.0, 1));
			}

		//	Paint cargo, if necessary

		if (cargo.length)
			{
			yUnits += (paintDesc.groundForcesPaint.rows * this.ROW_HEIGHT) + $Style.cyTilePadding;

			this.paintUnitGroup(ctx, xUnits, yUnits, cxWidth, paintDesc.cargoPaint, cargo);
			InfoPaneHelper.paintIconAndText(ctx, xUnits + $Style.cxTilePadding, yUnits, this.TITLE_WIDTH, null, "cargo", $Anacreon.formatNumberAsInteger(cargoMass / this.STD_CARGO_SPACE));
			}
		}),

	//	We have different cell widths, depending on how many units we need 
	//	to show.

	STD_CARGO_SPACE:		20,	//	Cargo space of a jumptransport

	TITLE_WIDTH:			80,
	ROW_HEIGHT:			 	32,
	LARGE_CELL_WIDTH: 		210,
	MEDIUM_CELL_WIDTH:		128,
	SMALL_CELL_WIDTH:		100,

	calcSize: (function (ctx, cxWidth, cyHeight, groundForces, spaceForces, cargo) 
		{
		var LARGE_CELLS_PER_ROW = Math.floor(cxWidth / this.LARGE_CELL_WIDTH);
		var MEDIUM_CELLS_PER_ROW = Math.floor(cxWidth / this.MEDIUM_CELL_WIDTH);
		var SMALL_CELLS_PER_ROW = Math.floor(cxWidth / this.SMALL_CELL_WIDTH);

		//	For medium and small cells, we grow to fit. [But for large cells,
		//	we keep the desired size because otherwise the cells are too 
		//	big.]

		var MEDIUM_CELL_WIDTH = Math.floor(cxWidth / MEDIUM_CELLS_PER_ROW);
		var SMALL_CELL_WIDTH = Math.floor(cxWidth / SMALL_CELLS_PER_ROW);

		//	Figure out how many rows we have to work with.

		var rowCount = Math.floor(cyHeight / this.ROW_HEIGHT);

		//	If we have cargo, we always add a line for it.

		var cargoPaint = null;
		if (cargo.length)
			{
			rowCount--;

			if (cargo.length <= LARGE_CELLS_PER_ROW)
				cargoPaint = {
					cellWidth: this.LARGE_CELL_WIDTH,
					rows: 1,
					cols: LARGE_CELLS_PER_ROW,
					painter: this.paintUnitTileLarge,
					};
			else if (cargo.length <= MEDIUM_CELLS_PER_ROW)
				cargoPaint = {
					cellWidth: MEDIUM_CELL_WIDTH,
					rows: 1,
					cols: MEDIUM_CELLS_PER_ROW,
					painter: this.paintUnitTileMedium,
					};
			else
				cargoPaint = {
					cellWidth: SMALL_CELL_WIDTH,
					rows: 1,
					cols: SMALL_CELLS_PER_ROW,
					painter: this.paintUnitTileSmall,
					};
			}

		//	Figure out how many rows we would need to fit all units
		//	with large tiles.

		var spaceForcesRowsLarge = Math.max(1, Math.ceil(spaceForces.length / LARGE_CELLS_PER_ROW));
		var groundForcesRowsLarge = Math.max(1, Math.ceil(groundForces.length / LARGE_CELLS_PER_ROW));

		//	If we have enough room then we're done.

		if (spaceForcesRowsLarge + groundForcesRowsLarge <= rowCount)
			return { 
				spaceForcesPaint: {
					cellWidth: this.LARGE_CELL_WIDTH,
					rows: spaceForcesRowsLarge,
					cols: LARGE_CELLS_PER_ROW,
					painter: this.paintUnitTileLarge,
					},

				groundForcesPaint: {
					cellWidth: this.LARGE_CELL_WIDTH,
					rows: groundForcesRowsLarge,
					cols: LARGE_CELLS_PER_ROW,
					painter: this.paintUnitTileLarge,
					},

				cargoPaint: cargoPaint,
				};

		//	Compute with medium and small tiles

		var spaceForcesRowsMedium = Math.max(1, Math.ceil(spaceForces.length / MEDIUM_CELLS_PER_ROW));
		var groundForcesRowsMedium = Math.max(1, Math.ceil(groundForces.length / MEDIUM_CELLS_PER_ROW));

		var spaceForcesRowsSmall = Math.max(1, Math.ceil(spaceForces.length / SMALL_CELLS_PER_ROW));
		var groundForcesRowsSmall = Math.max(1, Math.ceil(groundForces.length / SMALL_CELLS_PER_ROW));

		//	Reduce ground forces section to a single row, if possible.

		var groundForcesPaint;
		if (groundForcesRowsLarge == 1)
			groundForcesPaint = {
				cellWidth: this.LARGE_CELL_WIDTH,
				rows: groundForcesRowsLarge,
				cols: LARGE_CELLS_PER_ROW,
				painter: this.paintUnitTileLarge,
				};
		else if (groundForcesRowsMedium == 1)
			groundForcesPaint = {
				cellWidth: MEDIUM_CELL_WIDTH,
				rows: groundForcesRowsMedium,
				cols: MEDIUM_CELLS_PER_ROW,
				painter: this.paintUnitTileMedium,
				};
		else
			groundForcesPaint = {
				cellWidth: SMALL_CELL_WIDTH,
				rows: groundForcesRowsSmall,
				cols: SMALL_CELLS_PER_ROW,
				painter: this.paintUnitTileSmall,
				};

		//	Now shrink space forces until we fit

		if (spaceForcesRowsLarge + groundForcesPaint.rows <= rowCount)
			return { 
				spaceForcesPaint: {
					cellWidth: this.LARGE_CELL_WIDTH,
					rows: spaceForcesRowsLarge,
					cols: LARGE_CELLS_PER_ROW,
					painter: this.paintUnitTileLarge,
					},

				groundForcesPaint: groundForcesPaint,
				cargoPaint: cargoPaint,
				};
		else if (spaceForcesRowsMedium + groundForcesPaint.rows <= rowCount)
			return { 
				spaceForcesPaint: {
					cellWidth: MEDIUM_CELL_WIDTH,
					rows: spaceForcesRowsMedium,
					cols: MEDIUM_CELLS_PER_ROW,
					painter: this.paintUnitTileMedium,
					},

				groundForcesPaint: groundForcesPaint,
				cargoPaint: cargoPaint,
				};
		else
			return { 
				spaceForcesPaint: {
					cellWidth: SMALL_CELL_WIDTH,
					rows: spaceForcesRowsSmall,
					cols: SMALL_CELLS_PER_ROW,
					painter: this.paintUnitTileSmall,
					},

				groundForcesPaint: groundForcesPaint,
				cargoPaint: cargoPaint,
				};
		}),

	paintUnitGroup: (function (ctx, xPos, yPos, cxWidth, paintDesc, units)
		{
		var i;

		//	Metrics

		var xInner = xPos + $Style.cxTilePadding;
		var cxTitle = this.TITLE_WIDTH;
		var xContent = xInner + cxTitle;

		//	Background

		ctx.globalAlpha = 0.2;
		ctx.fillStyle = "#000000";
		ctx.fillRect(xPos, yPos, cxWidth, paintDesc.rows * this.ROW_HEIGHT);
		ctx.globalAlpha = 1.0;

		//	Keep track of position

		var xOffset = xContent;
		var curRow = 0;
		var curCol = 0;

		//	Paint

		for (i = 0; i < units.length; i++)
			{
			paintDesc.painter(ctx, xOffset, yPos + (curRow * this.ROW_HEIGHT), units[i]);
			xOffset += paintDesc.cellWidth;

			curCol++;
			if (curCol == paintDesc.cols)
				{
				curRow++;
				curCol = 0;
				xOffset = xContent;
				}
			}
		}),

	paintUnitTileLarge: (function (ctx, xPos, yPos, unitData)
		{
		var imageHeight = 32;
		var imageWidth = 48;

		//	Paint icon

		CanvasUtil.drawImage(ctx, xPos, yPos, imageWidth, imageHeight, unitData.unitType.imageSmall);
		xPos += imageWidth + $Style.cxTilePadding;

		//	Paint count

		ctx.font = $Style.tileFontLarge;
		ctx.fillStyle = $Style.tileTextHighlight;
		ctx.textAlign = "left";
		ctx.fillText($Anacreon.formatNumberAsInteger(unitData.unitCount), xPos, yPos);
		
		yPos += 18;	//	Height of font

		//	Paint name

		ctx.font = $Style.tileFontSmall;
		ctx.fillStyle = $Style.tileTextNormal;
		ctx.fillText(unitData.unitType.nameDesc, xPos, yPos);
		}),
		
	paintUnitTileMedium: (function (ctx, xPos, yPos, unitData)
		{
		var imageHeight = 32;
		var imageWidth = 48;

		//	Paint icon

		CanvasUtil.drawImage(ctx, xPos, yPos, imageWidth, imageHeight, unitData.unitType.imageSmall);
		xPos += imageWidth + $Style.cxTilePadding;

		//	Paint count

		ctx.font = $Style.tileFontLarge;
		ctx.fillStyle = $Style.tileTextHighlight;
		ctx.textAlign = "left";
		ctx.fillText($Anacreon.formatNumberAsInteger(unitData.unitCount), xPos, yPos);
		
		yPos += 18;	//	Height of font

		//	Paint name

		ctx.font = $Style.tileFontSmall;
		ctx.fillStyle = $Style.tileTextNormal;
		ctx.fillText(unitData.unitType.shortName, xPos, yPos);
		}),
		
	paintUnitTileSmall: (function (ctx, xPos, yPos, unitData)
		{
		var imageWidth = 48;
		var imageHeight = 32;

		//	Paint icon

		CanvasUtil.drawImage(ctx, xPos, yPos, imageWidth, imageHeight, unitData.unitType.imageSmall);
		xPos += imageWidth + $Style.cxTilePadding;

		//	Paint count

		var yOffset = (UnitRegionHelper.ROW_HEIGHT - $Style.tileFontLargeHeight) / 2;

		ctx.font = $Style.tileFontLarge;
		ctx.fillStyle = $Style.tileTextHighlight;
		ctx.textAlign = "left";
		ctx.fillText($Anacreon.formatNumberAsInteger(unitData.unitCount), xPos, yPos + yOffset);
		}),

	unitCompare: (function (a, b) 
		{
		//	Maneuvering units always go first.

		if (a.unitType.category == "maneuveringUnit" && b.unitType.category != "maneuveringUnit")
			return -1;
		else if (a.unitType.category != "maneuveringUnit" && b.unitType.category == "maneuveringUnit")
			return 1;
		
		//	Orbital units go next

		else if (a.unitType.category == "orbitalUnit" && b.unitType.category != "orbitalUnit")
			return -1;
		else if (a.unitType.category != "orbitalUnit" && b.unitType.category == "orbitalUnit")
			return 1;

		//	Otherwise, whichever has the highest combat power goes first.

		else
			return b.unitType.attackValue - a.unitType.attackValue;
		}),
	};
