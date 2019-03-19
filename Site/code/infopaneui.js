//	infopaneui.js
//
//	Info Pane functions
//	Copyright (c) 2012 Kronosaur Productions, LLC. All Rights Reserved.

//	InfoPane -------------------------------------------------------------------
//
//	MEMBER FUNCTIONS
//
//	destroy ()
//		Call when done.
//
//	MEMBER VARIABLES
//
//	canvas: The JQuery canvas object
//	ctx: Canvas context
//	cxWidth, cyHeight: Dimensions of canvas

function InfoPane (canvas)
	{
	//	Initialize our basic members
	
	this.canvas = canvas;
	this.ctx = canvas[0].getContext("2d");
	this.cxWidth = canvas.width();
	this.cyHeight = canvas.height();

	//	Add listeners for mouse events

	this.canvas.on("mousedown", { canvasCtrl: this },
		(function (e)
			{
			//	Convert coordinate to canvas-relative
			
			var canvasOffset = e.data.canvasCtrl.canvas.offset();
			var x = e.pageX - canvasOffset.left;
			var y = e.pageY - canvasOffset.top;
			
			//	Handle it
			
			e.preventDefault();
			e.data.canvasCtrl.onMouseDown(x, y);
			})
		);
		
	this.canvas.on("mousemove", { canvasCtrl: this },
		(function (e)
			{
			//	Convert coordinate to canvas-relative
			
			var canvasOffset = e.data.canvasCtrl.canvas.offset();
			var x = e.pageX - canvasOffset.left;
			var y = e.pageY - canvasOffset.top;

			//	Handle it
			
			e.data.canvasCtrl.onMouseMove(x, y, e.wheelDelta);
			})
		);

	var data = { canvasCtrl: this };

	this.canvas[0].onwheel = $UI.onwheel({ canvasCtrl: this},
		(function (e)
			{
			//	Convert coordinate to canvas-relative
			
			var canvasOffset = e.data.canvasCtrl.canvas.offset();
			var x = e.pageX - canvasOffset.left;
			var y = e.pageY - canvasOffset.top;
			
			e.data.canvasCtrl.onMouseWheel(x, y, e.delta);

			e.preventDefault();
			})
		);
	
	//	Hook up tabs

	this.initTabs();

	//	Edit control

	this.inputCtrl = $("#uiInfoPaneEdit");
	}

InfoPane.prototype.cancelModal = function ()
	{
	if (this.nameCtrl)
		this.nameCtrl.cancelModal();
	}

InfoPane.prototype.destroy = function ()
	{
	this.canvas.off("mousedown");
	this.canvas.off("mousemove");
	
	if (this.animationInterval)
		clearInterval(this.animationInterval);

	return null;
	}

InfoPane.prototype.init = function (obj, paneToSelect, newSelection)
	{
	//	Figure out the tab panes for this object
		
	var objPaneList = (obj ? obj.getInfoPanes() : []);
	if (paneToSelect == null && obj && obj.getInfoPaneDefaultSelect)
		paneToSelect = obj.getInfoPaneDefaultSelect();

	if (paneToSelect != null)
		{
		if (paneToSelect == -1)
			this.infoPaneSelected = objPaneList.length - 1;
		else
			this.infoPaneSelected = paneToSelect;
		}
		
	//	Make sure current pane is in bounds
		
	if (this.infoPaneSelected == null || this.infoPaneSelected >= objPaneList.length)
		this.infoPaneSelected = (objPaneList.length > 0 ? 0 : null);

	var objPaneDesc = (this.infoPaneSelected != null ? objPaneList[this.infoPaneSelected] : null);
			
	//	Configure all the panes and tabs
		
	for (i = 0; i < 6; i++)
		{
		var theTab = $("#uiTabLabel" + (i + 1));
			
		//	If this tab is not used then hide it
			
		if (i >= objPaneList.length)
			{
			theTab.hide();
			}
				
		//	Otherwise, we show the tab
			
		else
			{
			//	Set the text
				
			theTab.show();
			theTab.empty();
			theTab.text(objPaneList[i].tabLabel);
				
			//	Handle the selected tab
				
			if (this.infoPaneSelected == i)
				{
				theTab.removeClass("uiTabLabel");
				theTab.addClass("uiTabLabelSelected");
				}
			else
				{
				theTab.removeClass("uiTabLabelSelected");
				theTab.addClass("uiTabLabel");
				}
			}
		}

	//	Hook up the pane

	this.initPane(obj, objPaneDesc, newSelection);
	}

InfoPane.prototype.initCommands = function (obj, objCommandList)
	{
	function setCommandButton (buttonID, label, func, data)
		{
		var theButton = $("#uiCmd" + buttonID);
			
		if (func == null)
			{
			theButton.hide();
			theButton.off("click.command");
			}
		else
			{
			theButton.show();
			theButton.text(label);
			theButton.off("click.command");
			theButton.on("click.command", data, 
				(function (e)
					{
					$Map.infoPane.cancelModal();
					func(e);
					})
				);
			}
		}
			
	//	initCommands -----------------------------------------------------------
			
	var i;

	//	Set the command buttons
		
	var nextCommand = 1;
		
	//	If we have an object, show info
		
	if (obj != null && objCommandList != null)
		{
		//	Get the list of commands
				
		for (i = 0; i < objCommandList.length && nextCommand <= 4; i++)
			setCommandButton(nextCommand++, objCommandList[i].label, objCommandList[i].onCommand, objCommandList[i].data);
		}
			
	//	Clear out remaining commands
		
	for (i = nextCommand; i <= 4; i++)
		setCommandButton(i);
	}

InfoPane.prototype.initName = function (obj)
	{
	//	Clean up the old name, if necessary

	if (this.nameCtrl)
		this.nameCtrl = this.nameCtrl.destroy();

	//	Create a new name control

	if (obj != null)
		{
		var cxWidth = 200;

		this.nameCtrl = new CanvasEdit(this.canvas,
				{
				xPos: 429 - (cxWidth / 2),
				yPos: 25,
				cxWidth: cxWidth,
				cyHeight: $Style.tileFontExtraLargeHeight,

				text: obj.name,
				textAlign: "center",
				textColor: $Style.tileTextHighlight,
				textFont: $Style.tileFontExtraLargeBold,

				readOnly: !obj.canBeRenamed(),
				editLabel: "rename",
				inputCtrl: this.inputCtrl,

				onChanged: (function (newText, data)
					{
					objRename(data.obj, newText);
					}),
				},
				{
				obj: obj,
				});

		this.nameCtrl.draw(this.ctx);
		}
	else
		this.nameCtrl = null;
	}

InfoPane.prototype.initPane = function (obj, objPaneDesc, newSelection)
	{
	//	Clean up previous pane

	var oldUIState = null;
	if (this.infoPaneCtrl != null)
		{
		//	Remember some context, if necessary. For example, we save the scroll
		//	position.

		if (!newSelection)
			oldUIState = this.infoPaneCtrl.saveUIState();

		//	Destroy old pane

		this.infoPaneCtrl = this.infoPaneCtrl.destroy();
		this.ctx.clearRect(0, 0, this.cxWidth, this.cyHeight);
		}

	//	Draw the name. We don't reinitialize if we're in the middle of
	//	editing the name.

	if (this.nameCtrl == null || newSelection || !this.nameCtrl.inModal() || obj == null)
		this.initName(obj);
	else
		this.nameCtrl.draw(this.ctx);

	//	Initialize Grid

	if (objPaneDesc != null && obj)
		{
		var paneDesc = {
			xPos: 2,
			yPos: 46,
			cxWidth: 857,
			noEvents: true,

			cxStdTile: objPaneDesc.paneDesc.cxStdTile,
			cyStdTile: objPaneDesc.paneDesc.cyStdTile,
			onGetTileList: objPaneDesc.paneDesc.onGetTileList,

			uiState: oldUIState,
			};

		this.infoPaneCtrl = new CanvasGrid(this.canvas, 
				paneDesc,
				{ obj:obj });
		}

	//	Initialize commands

	this.initCommands(obj, (objPaneDesc ? objPaneDesc.getCommandList(obj) : null));
	}

InfoPane.prototype.initTabs = function ()
	{
	var i;
		
	//	Initialize all the tabs
		
	for (i = 0; i < 6; i++)
		{
		var theTab = $("#uiTabLabel" + (i + 1));
			
		//	Hook up the tab
			
		theTab.on("mousedown", 
			(function (tabIndex) 
				{
				return (function (e)
					{
					if ($Map.infoPane.infoPaneSelected != tabIndex)
						{
						var obj = $Map.objSelected;

						//	Restore old tab
							
						if ($Map.infoPane.infoPaneSelected != null)
							{
							var theOldTab = $("#uiTabLabel" + ($Map.infoPane.infoPaneSelected + 1));
							theOldTab.removeClass("uiTabLabelSelected");
							theOldTab.addClass("uiTabLabel");
							}
								
						//	Select new tab
							
						var theTab = $("#uiTabLabel" + (tabIndex + 1));
						theTab.removeClass("uiTabLabel");
						theTab.addClass("uiTabLabelSelected");
							
						$Map.infoPane.infoPaneSelected = tabIndex;
						var objPaneList = obj.getInfoPanes();
						var objPaneDesc = ($Map.infoPane.infoPaneSelected != null ? objPaneList[$Map.infoPane.infoPaneSelected] : null);

						$Map.infoPane.initPane(obj, objPaneDesc, true);
						}
					}); 
				})(i));
		}
	}

InfoPane.prototype.inModal = function ()
	{
	if (this.nameCtrl && this.nameCtrl.inModal())
		return true;

	return false;
	}

InfoPane.prototype.onMouseDown = function (xPos, yPos)
	{
	if (this.nameCtrl)
		this.nameCtrl.onMouseDown(xPos, yPos);

	if (this.infoPaneCtrl)
		this.infoPaneCtrl.onMouseDown(xPos, yPos);
	}

InfoPane.prototype.onMouseMove = function (xPos, yPos)
	{
	//	See if we are hovering over the name region

	if (this.nameCtrl)
		this.nameCtrl.onMouseMove(xPos, yPos);

	//	Grid

	if (this.infoPaneCtrl)
		this.infoPaneCtrl.onMouseMove(xPos, yPos);
	}

InfoPane.prototype.onMouseWheel = function (xPos, yPos, delta)
	{
	if (this.infoPaneCtrl)
		this.infoPaneCtrl.onMouseWheel(xPos, yPos, delta);
	}