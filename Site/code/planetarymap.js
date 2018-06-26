//	planetarymap.js
//
//	Implements UI for planetary map
//	Copyright (c) 2012 Kronosaur Productions, LLC. All Rights Reserved.

var $PlanetaryMap = {
	};

$PlanetaryMap.onDraw = function (mapMetrics)
	{
	var obj = $Map.objPlanetaryCenter;

	//	Fill the background

	var imageDesc = (obj ? obj.getSpaceBackgroundImage() : $Anacreon.defaultSpaceRegion.backgroundImageTactical);
	if (imageDesc)
		{
		var scale = Math.pow(2, 0.1 * ((Math.log(mapMetrics.pixelsPerUnit) / Math.log(2)) - 2));
		$Map.drawBackground(ctx, imageDesc, scale, obj.pos[0], obj.pos[1]);

		//	If we're transitioning to/from galactic scale, then blend in the
		//	galactic background.

		var zoomLevelFade = 4;
		if (ZOOM_LEVELS[$Map.zoomLevel + zoomLevelFade][1] == "galactic")
			{
			var galImageDesc = $Anacreon.defaultSpaceRegion.backgroundImage;
			if (galImageDesc)
				{
				var galPixelsPerUnit = mapMetrics.pixelsPerUnit * 1717986918.4;
				var galPixelsLog2 = Math.log(galPixelsPerUnit) / Math.log(2);
				var galScale = Math.pow(2, 0.1 * (galPixelsLog2 - 2));

				//	Paint faded

				var pixelsLog2 = Math.log(mapMetrics.pixelsPerUnit) / Math.log(2);
				var basePixelsLog2 = Math.log(ZOOM_LEVELS[36 - zoomLevelFade][2]) / Math.log(2);
				var diff = (basePixelsLog2 - pixelsLog2) / zoomLevelFade;
				var fade = Math.max(0.0, diff);
				ctx.globalAlpha = fade;

				//	Paint

				$Map.drawBackground(ctx, galImageDesc, galScale, obj.pos[0], obj.pos[1]);

				//	Restore

				ctx.globalAlpha = 1.0;
				}
			}
		}
	else
		{
		ctx.fillStyle = $Anacreon.color($Anacreon.defaultSpaceRegion.backgroundColor);
		ctx.fillRect(0, 0, $Map.canvasWidth, $Map.canvasHeight);
		}

	//	Draw object

	if (obj != null)
		{
		var xViewCenter = $Map.canvasCenterX;
		var yViewCenter = $Map.canvasCenterY;

		obj.drawPlanetaryMap(ctx,
				xViewCenter,
				yViewCenter,
				mapMetrics.pixelsPerUnit);
		}

	//	Update pan/zoom animation
	
	if ($Map.updatePanZoomAnimation())
		$Map.initMapView($Map.curMetrics);
	}

$PlanetaryMap.onMouseDown = function (e)
	{
	}

$PlanetaryMap.onMouseUp = function (e)
	{
	}

$PlanetaryMap.onMove = function (e)
	{
	}

$PlanetaryMap.onSelectionChanged = function (newSel)
	{
	}

$PlanetaryMap.onUpdate = function ()
	{
	$Map.invalidate("mapOnly");
	}
