//	core.js
//
//	Core functions and definitions.
//	Copyright (c) 2012 Kronosaur Productions, LLC. All Rights Reserved.
//
//	VERSION
//
//	1:	Initial implementation
//	2:	Enhancements required for Multiverse
//	3:	More Multiverse enhancements
//	4:	Anacreon changes
//	5:	Anacreon: renamed dialogErrorBar to dlgErrorBar
//	6:	Anacreon: bug fixes
//  7:  Multiverse: enhancements
//	8:	Multiverse: bug fixes
//	9:	AuthToken cookie stored for base domain
//	10:	Added showDialogErrorHTML
//	11: drawTiledImage
//	12: Keys
//	13: Added zoomImage

//	UI -------------------------------------------------------------------------

var KEY_ARROW_DOWN = 40;
var KEY_ARROW_LEFT = 37;
var KEY_ARROW_RIGHT = 39;
var KEY_ARROW_UP = 38;
var KEY_BACKSPACE = 8;
var KEY_DELETE = 46;
var KEY_END = 35;
var KEY_ENTER = 13;
var KEY_EQUALS = 61;
var KEY_ESCAPE = 27;
var KEY_HOME = 36;
var KEY_INSERT = 45;
var KEY_MINUS = 45;
var KEY_PAGE_DOWN = 34;
var KEY_PAGE_UP = 33;
var KEY_PLUS = 43;
var KEY_SPACE_BAR = 32;

var KEY_0 = 48;
var KEY_1 = 49;
var KEY_2 = 50;
var KEY_3 = 51;
var KEY_4 = 52;
var KEY_5 = 53;
var KEY_6 = 54;
var KEY_7 = 55;
var KEY_8 = 56;
var KEY_9 = 57;

var KEY_KEYPAD_PLUS = 107;
var KEY_KEYPAD_MINUS = 109;

var $UI = {
	windowKeydown: null,
	windowKeydownSaved: [],
	windowKeypress: null,
	windowKeypressSaved: [],
	
	//	Selector for current dialog element.
	currentDialog: null
	};

$UI.canvasToURL = function (canvas)
	{
	if (navigator.appName == "Netscape")
		{
		//	take apart data URL
		var parts = canvas.toDataURL("image/png").match(/data:([^;]*)(;base64)?,([0-9A-Za-z+/]+)/);

		//	assume base64 encoding
		var binStr = atob(parts[3]);

		//	convert to binary in ArrayBuffer
		var buf = new ArrayBuffer(binStr.length);
		var view = new Uint8Array(buf);
		for (var i = 0; i < view.length; i++)
			view[i] = binStr.charCodeAt(i);

		var blob = new Blob([view], {'type': parts[1]});
		var URL = webkitURL.createObjectURL(blob);

		return URL;
		}
	else
		return canvas.toDataURL("image/png");
	}
	
$UI.centerElement = function (elementSel)
	{
	var dlgTop = Math.floor($(window).scrollTop() + ($(window).height() - $(elementSel).height()) / 3);
	var dlgLeft = Math.floor(($(window).width() - $(elementSel).width()) / 2);
	
	$(elementSel).css({top:dlgTop, left:dlgLeft});
	}

$UI.drawText = function (ctx, x, y, maxWidth, cyLine, text)
	{
	var i, j;
	
	//	Short-circuit
	
	if (text == null || text == "")
		return;
	
	//	Measure the length of a space
	
	var spaceWidth = ctx.measureText(" ").width;
	
	//	Start at the top

	var yPos = y;

	//	Split up into paragraphs

	var paragraphs = text.split("\n");

	for (j = 0; j < paragraphs.length; j++)
		{
		//	Split up the text into words
	
		var textWords = [];
		var spaceTokens = paragraphs[j].split(" ");
		for (i = 0; i < spaceTokens.length; i++)
			{
			var hyphen = spaceTokens[i].indexOf("-");
			if (hyphen == -1 || hyphen == 0 || hyphen + 1 == spaceTokens[i].length)
				textWords.push(spaceTokens[i] + " ");
			else
				{
				textWords.push(spaceTokens[i].substring(0, hyphen + 1));
				textWords.push(spaceTokens[i].substring(hyphen + 1) + " ");
				}
			}
			
		//	Put all the words into lines.

		var curLine = (textWords.length > 0 ? textWords[0] : "");
		var widthLeft = maxWidth - (textWords.length > 0 ? ctx.measureText(textWords[0]).width : 0);
		for (i = 1; i < textWords.length; i++)
			{
			var wordWidth = ctx.measureText(textWords[i]).width;
		
			//	If this word fits on the line, then add it
		
			if (widthLeft >= spaceWidth + wordWidth)
				{
				curLine = curLine + textWords[i];
				widthLeft -= spaceWidth + wordWidth;
				}
			
			//	Otherwise, draw the line and start a new one
		
			else
				{
				ctx.fillText(curLine, x, yPos);
			
				yPos += cyLine;
				curLine = textWords[i];
				widthLeft = maxWidth - wordWidth;
				}
			}
		
		//	Last line
	
		if (j < paragraphs.length - 1 || curLine != "")
			{
			ctx.fillText(curLine, x, yPos);
		
			yPos += cyLine;
			}
		}
		
	//	Return height
	
	return (yPos - y);
	}

$UI.drawTextMeasure = function (ctx, maxWidth, cyLine, text)
	{
	var i, j;
	
	//	Short-circuit
	
	if (text == null || text == "")
		return { lines: 0, height: 0 };
	
	//	Measure the length of a space
	
	var spaceWidth = ctx.measureText(" ").width;
	
	//	Start at the top

	var yPos = 0;
	var lineCount = 0;

	//	Split up into paragraphs

	var paragraphs = text.split("\n");

	for (j = 0; j < paragraphs.length; j++)
		{
		//	Split up the text into words
	
		var textWords = [];
		var spaceTokens = paragraphs[j].split(" ");
		for (i = 0; i < spaceTokens.length; i++)
			{
			var hyphen = spaceTokens[i].indexOf("-");
			if (hyphen == -1 || hyphen == 0 || hyphen + 1 == spaceTokens[i].length)
				textWords.push(spaceTokens[i] + " ");
			else
				{
				textWords.push(spaceTokens[i].substring(0, hyphen + 1));
				textWords.push(spaceTokens[i].substring(hyphen + 1) + " ");
				}
			}
			
		//	Put all the words into lines.

		var curLine = (textWords.length > 0 ? textWords[0] : "");
		var widthLeft = maxWidth - (textWords.length > 0 ? ctx.measureText(textWords[0]).width : 0);
		for (i = 1; i < textWords.length; i++)
			{
			var wordWidth = ctx.measureText(textWords[i]).width;
		
			//	If this word fits on the line, then add it
		
			if (widthLeft >= spaceWidth + wordWidth)
				{
				curLine = curLine + textWords[i];
				widthLeft -= spaceWidth + wordWidth;
				}
			
			//	Otherwise, draw the line and start a new one
		
			else
				{
				lineCount++;
			
				yPos += cyLine;
				curLine = textWords[i];
				widthLeft = maxWidth - wordWidth;
				}
			}
		
		//	Last line
	
		if (j < paragraphs.length - 1 || curLine != "")
			{
			lineCount++;
		
			yPos += cyLine;
			}
		}
		
	//	Return result
	
	return { lines: lineCount, height: yPos };
	}

$UI.drawTiledImage = function (ctx, imageElement, xDest, yDest, cxDest, cyDest, xSrc, ySrc, cxSrc, cySrc, cxSrcScale, cySrcScale)
	{
	if (cxSrcScale == null)
		cxSrcScale = cxSrc;
	if (cySrcScale == null)
		cySrcScale = cySrc;

	var y = yDest;
	var yEnd = yDest + cyDest;
	while (y < yEnd)
		{
		var x = xDest;
		var xEnd = xDest + cxDest;
		while (x < xEnd)
			{
			ctx.drawImage(imageElement,
					xSrc,
					ySrc,
					cxSrc,
					cySrc,
					x,
					y,
					cxSrcScale,
					cySrcScale);

			x += cxSrcScale;
			}

		y += cySrcScale;
		}
	}
	
$UI.enterDialog = function (dialogFrameSel)
	{
	if ($UI.currentDialog != null)
		return;

	//	Gray out the page
	
	$("#pageCover").show();
	
	//	Center the dialog box
	
	$UI.centerElement(dialogFrameSel);
	
	//	Show it.
	
	$(dialogFrameSel).show();
	
	//	Remember that we have it up
	
	$UI.currentDialog = dialogFrameSel;

	//	Disable keyboard input

	$UI.enterModal();
	
	//	Hide error dialog

	$UI.hideDialogError();
	}

$UI.enterMenu = function (menuDesc)
	{
	function addMenuItems (menuFrame, menuDesc)
		{
		var i;

		for (i = 0; i < menuDesc.content.length; i++)
			{
			var itemDesc = menuDesc.content[i];
			var id = "dlgMenuItem" + i;

			var itemElement = $("<div id='" + id + "' class='menuItem'>" + itemDesc.label + "</div>");
			itemElement.appendTo(menuFrame);
			itemElement.on("click", itemDesc, (function (e) {
				var itemDesc = e.data;
				itemDesc.onClick(itemDesc.data);
				doCloseMenu();
				}));
			}
		}

	function doCloseMenu ()
		{
		var i;
		var menuFrame = $("#dlgMenu");

		$UI.exitModal();
		menuFrame.hide();

		for (i = 0; i < $UI.currentMenu.content.length; i++)
			{
			var id = "dlgMenuItem" + i;
			$(id).off();
			}

		menuFrame.empty();
		$UI.currentMenu = null;
		}

	function onKeydown (e)
		{
		//	Handle normal dialog keyboard codes
		
		switch (e.which)
			{
			case KEY_ESCAPE:
				{
				doCloseMenu();
				break;
				}
			}
		}

	//	Main -------------------------------------------------------------------

	if ($UI.currentMenu != null)
		{
		doCloseMenu();
		return;
		}

	var menuFrameSel = "#dlgMenu";
	var menuFrame = $(menuFrameSel);

	//	Add menu items

	menuFrame.empty();
	addMenuItems(menuFrame, menuDesc);

	//	Position and show

	menuFrame.css({top:menuDesc.posY, left:menuDesc.posX});
	menuFrame.show();

	//	Remember that we have it up

	$UI.currentMenu = menuDesc;

	//	keyboard input

	$UI.enterModal();
	$UI.keydown(onKeydown);
	}

$UI.enterModal = function ()
	{
	//	Disable keyboard input
	
	if ($UI.windowKeydown != null)
		{
		$UI.windowKeydownSaved.push($UI.windowKeydown);
		$UI.windowKeydown = null;
		$(window).off("keydown");
		}
	else
		$UI.windowKeydownSaved.push(null);
	
	if ($UI.windowKeypress != null)
		{
		$UI.windowKeypressSaved.push($UI.windowKeypress);
		$UI.windowKeypress = null;
		$(window).off("keypress");
		}
	else
		$UI.windowKeypressSaved.push(null);
	}

$UI.exitDialog = function ()
	{
	//	Dialog must be up
	
	if ($UI.currentDialog == null)
		return;
		
	//	Hide error, if we displayed it
	
	$UI.hideDialogError();
		
	//	Reenable keyboard input

	$UI.exitModal();
	
	//	Hide the dialog
	
	$($UI.currentDialog).hide();
	$("#pageCover").hide();
	$UI.currentDialog = null;
	}
	
$UI.exitModal = function ()
	{
	//	Remove keyboard events, in case dialog added them.

	if ($UI.windowKeydown != null)
		$UI.keydown(null);
	if ($UI.windowKeypress != null)
		$UI.keypress(null);
	
	$UI.windowKeypress = $UI.windowKeypressSaved.pop();
	if ($UI.windowKeypress != null)
		$(window).on("keypress", $UI.windowKeypress);
		
	$UI.windowKeydown = $UI.windowKeydownSaved.pop();
	if ($UI.windowKeydown != null)
		$(window).on("keydown", $UI.windowKeydown);
	}

$UI.getFilenameExtension = function (filename)
	{
	//	Returns the filename extension (without the leading dot). If there
	//	is no extension we return blank ("")

	if (filename == null || filename.split == null || filename == "")
		return "";
	else
		{
		var parts = filename.split(".");
		if (parts == null || parts.length == 0)
			return "";

		return parts[parts.length - 1];
		}
	}

$UI.hideDialogError = function ()
	{
	if ($UI.currentDialog == null)
		return;

	var errorBar = $($UI.currentDialog + " .dlgErrorBar");
	if (errorBar == null)
		return;
		
	errorBar.hide();	
	}

$UI.htmlDecode = function (value)
	{
	return $('<div/>').html(value).text();
	}
	
$UI.htmlEncode = function (value)
	{
	//create a in-memory div, set it's inner text(which jQuery automatically encodes)
	//then grab the encoded contents back out.  The div never exists on the page.
	return $('<div/>').text(value).html();
	}
	
$UI.keydown = function (onKeydown, data)
	{
	$UI.windowKeydown = onKeydown;
	
	if (onKeydown != null)
		{
		if (data)
			$(window).on("keydown", data, onKeydown);
		else
			$(window).on("keydown", onKeydown);
		}
	else
		$(window).off("keydown");
	}
	
$UI.keypress = function (onKeypress)
	{
	$UI.windowKeypress = onKeypress;
	
	if (onKeypress != null)
		$(window).on("keypress", onKeypress);
	else
		$(window).off("keypress");
	}
	
$UI.showDialogError = function (message)
	{
	if ($UI.currentDialog == null)
		return;
		
	var errorBar = $($UI.currentDialog + " .dlgErrorBar");
	if (errorBar == null)
		return;

	errorBar.show();
	errorBar.text(message);
	}

$UI.showDialogErrorHTML = function (message)
	{
	if ($UI.currentDialog == null)
		return;
		
	var errorBar = $($UI.currentDialog + " .dlgErrorBar");
	if (errorBar == null)
		return;

	errorBar.show();
	errorBar.html(message);
	}

$UI.zoomImage = function (imageURL)
	{
	function cmdClose ()
		{
		$UI.exitDialog();
		$("#dlgImage").remove();
		}

	function onKeydown (e)
		{
		switch (e.which)
			{
			case KEY_ESCAPE:
			case KEY_ENTER:
				{
				cmdClose();
				break;
				}
			}
		}

	//	Create a dialog to show the image

	var bodyObj = $("body");
	bodyObj.append("<div id='dlgImage' class='dialogFrame' style='line-height:0;'>" +
		"<div class='dialogCloseButton' style='line-height:normal;'>Close</div> " +
		"<img class='screenshotFull' src='" + imageURL + "'/>" +
		"</div>");

	//	Hook up the close button

	$("#dlgImage .dialogCloseButton").on("click", (function (e) { cmdClose(); }));
	$("#dlgImage .dialogCloseButton").hide();
	$("#dlgImage img").on("click", (function (e) { cmdClose(); }));
	$("#dlgImage img").hide();

	$UI.centerElement($("#dlgImage"));

	//	Resize once we load the image

	$("#dlgImage img").on("load", (function (e) {
		$("#dlgImage img").show();
		$("#dlgImage .dialogCloseButton").show();

		var ImageHeight = $("#dlgImage img")[0].naturalHeight;
		var ImageWidth = $("#dlgImage img")[0].naturalWidth;

		var DlgHeight = Math.min(ImageHeight, $(window).height() - 80);
		var DlgWidth = Math.ceil(ImageWidth * DlgHeight / ImageHeight);
		$("#dlgImage").css("width", DlgWidth + "px");

		$UI.centerElement($("#dlgImage"));
		}));

	//	Start

	$UI.enterDialog("#dlgImage");
	$UI.keydown(onKeydown);
	}
	
//	Language -------------------------------------------------------------------

var $Language = {};

$Language.capitalizeTitle = function (text)
	{
	function isCapitalized (word)
		{
		var i;
		var doNotCap = [
			"a", "an", "and", "as", "at",
			"but", "by",
			"for",
			"in", "into",
			"of", "off", "on", "onto",
			"than", "the", "to",
			"up", "upon",
			"with", "within", "without"
			];

		for (i = 0; i < doNotCap.length; i++)
			if (word == doNotCap[i])
				return false;

		return true;
		}

	var i;

	var words = text.split(" ");
	var lastWord = words.length - 1;
	for (i = 0; i < words.length; i++)
		{
		var word = words[i];
		if (word.length > 1
				&& (i == 0 || i == lastWord || isCapitalized(word)))
			words[i] = word.charAt(0).toUpperCase() + word.substring(1);
		}

	return words.join(" ");
	}

$Language.formatDate = function (date, format)
	{
	//	If this is a date object, then we use it to format it.

	if (date.toLocaleDateString != null)
		{
		if (format == "relative")
			{
			var now = new Date();
			var elapsed = now.getTime() - date.getTime();

			if (elapsed < 1000)
				return "just now";
			else
				{
				var elapsedSec = Math.floor(elapsed / 1000);
				if (elapsedSec == 1)
					return "one second ago";
				else if (elapsedSec < 60)
					return "" + elapsedSec + " seconds ago";
				else
					{
					var elapsedMin = Math.floor(elapsedSec / 60);
					if (elapsedMin == 1)
						return "one minute ago";
					else if (elapsedMin < 60)
						return "" + elapsedMin + " minutes ago";
					else
						{
						var elapsedHour = Math.floor(elapsedMin / 60);
						if (elapsedHour == 1)
							return "one hour ago";
						else if (elapsedHour < 24)
							return "" + elapsedHour + " hours ago";
						else
							{
							var elapsedDay = Math.floor(elapsedHour / 24);
							if (elapsedDay == 1)
								return "one day ago";
							else if (elapsedDay < 14)
								return "" + elapsedDay + " days ago";
							else
								return "on " + $Language.formatDate(date, "shortDateOnly");
							}
						}
					}
				}
			}
		else if (format == "shortDateOnly")
			return date.toLocaleDateString();
		else
			return date.toLocaleDateString() + " " + date.toLocaleTimeString();
		}

	//	Otherwise if this is a string, we need to convert to a date

	else if (date.split != null)
		{
		var dateList = date.split("T");
		if (dateList.length == 2)
			{
			var GMTDate = new Date;
			GMTDate.setUTCFullYear(date.substring(0, 4), date.substring(5, 7) - 1, date.substring(8, 10));
			GMTDate.setUTCHours(date.substring(11, 13), date.substring(14, 16), date.substring(17));
			return $Language.formatDate(GMTDate, format);
			}
		else
			return date;
		}

	//	Otherwise we don't know

	else
		return "unknown date";
	}

$Language.formatIndefiniteArticle = function (text)
	{
	var firstLetter = text.charAt(0);
	if (firstLetter == "a" || firstLetter == "e" || firstLetter == "i" || firstLetter == "o" || firstLetter == "u")
		return "an " + text;
	else
		return "a " + text;
	}
	
//	Hexarc ---------------------------------------------------------------------

var $Hexarc = {};

$Hexarc.challengeResponse = function (username, password, challenge)
	{
	//	Generate a string combining the username and password (plus some salt)
	//	so that we can hash it. This is the standard Hexarc algorithm for
	//	hashing a username and password.
	
	var credentialsString = username.toLowerCase() + ":HEXARC01:" + password;
	
	//	Convert the string to an array of bytes.
	
	//	Generate a SHA1 digest of the username+password. This is the password
	//	hash. (The result is also an array of bytes).
	
	//	Convert the challenge from a ipInteger to an array of bytes
	//	(big endian).
	
	//	Concatenate the password hash and the challenge (separated by a colon)
	
	//	Generate a SHA1 digest of the result and return it.
	

	}
	
$Hexarc.errorGetText = function (data)
	{
	return data[3];
	}
	
$Hexarc.getURLParam = function (param)
	{
	name = param.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	var regexS = "[\\?&]" + name + "=([^&#]*)"; 
	var regex = new RegExp(regexS); 
	var results = regex.exec(window.location.search); 
	if (results == null) 
		return ""; 
	else 
		return decodeURIComponent(results[1].replace(/\+/g, " ")); 
	}
	
$Hexarc.hasRights = function (rights, rightsRequired)

//	Returns TRUE if rights is a superset of rightRequired.

	{
	var i;

	if (rights == null)
		return false;
	
	for (i = 0; i < rightsRequired.length; i++)
		if (rights.indexOf(rightsRequired[i]) == -1)
			return false;
			
	return true;
	}
	
$Hexarc.isError = function (data)
	{
	return (data != null && data[0] == "AEON2011:hexeError:v1");
	}
	
$Hexarc.getErrorMessage = function (data)
	{
	return data[3];
	}

$Hexarc.listToString = function (value)
	{
	if (value == null)
        return "";
    else if (value.join)
		return value.join(", ");
	else if (value.toString)
		return value.toString;
    else
        return "";
	}
	
$Hexarc.setAuthTokenCookie = function (authToken)
	{
	//	Set the base domain (works for all sub-domains)

	var domainList = document.domain.split(".").reverse();
	var cookieDomain = "." + domainList[1] + "." + domainList[0];

	//	Expiration date

	var expirationDate = new Date();
	expirationDate.setDate(expirationDate.getDate() + 30);
	
	var cookieValue = "";
	cookieValue += "authToken=";
	cookieValue += encodeURIComponent(authToken);
	cookieValue += "; path=/; domain=";
	cookieValue += cookieDomain;
	cookieValue += "; expires=";
	cookieValue += expirationDate.toUTCString();
	
	//	Set
	
	document.cookie = cookieValue;
	
	//	More...
	
	cookieValue = "";
	cookieValue += "username=";
	cookieValue += encodeURIComponent(authToken);
	cookieValue += "; path=/; domain=";
	cookieValue += cookieDomain;
	cookieValue += "; expires=";
	cookieValue += expirationDate.toUTCString();
	
	//	Set
	
	document.cookie = cookieValue;

	//	We previously used the explicit subdomain, so we need to clear those old
	//	cookies (we do this by setting the expiration date to 1 millisecond in 
	//	the past).

	var thePast = new Date();
	thePast.setTime(thePast.getTime() - 1);
	document.cookie = "authToken=; path=/; expires=" + thePast.toGMTString() + "; domain=" + document.domain;
	document.cookie = "username=; path=/; expires=" + thePast.toGMTString() + "; domain=" + document.domain;
	}
	
$Hexarc.stringToList = function (value, options)
	{
	var makeLowercase = (options != null && options.lowercase == true);

    if (value == null)
        return [];
    else if (value.split == null)
		{
		if (value.join != null)
			return value;
		else
			{
			if (makeLowercase)
				return [value.toLowerCase()];
			else
				return [value];
			}
		}
    else
        {
	    var i;
	    var theList = value.split(",");
	
	    for (i = 0; i < theList.length; i++)
			{
		    //	trim leading an trailing spaces
		    theList[i] = theList[i].replace(/^\s*/, "").replace(/\s*$/, "");

			if (makeLowercase)
				theList[i] = theList[i].toLowerCase();
			}
		
	    if (theList.length == 1 && theList[0] == "")
		    return [];
	
	    return theList;
        }
	}
	
$Hexarc.stringToUsernameList = function (value)
	{
    return $Hexarc.stringToList(value, { lowercase: true });
	}
	
$Hexarc.usernameListToString = function (value)
	{
    return $Hexarc.listToString(value);
	}
	
//	EditBar Object -------------------------------------------------------------

function EditBar (barInfo)
	{
	this.barInfo = barInfo;
	this.editMode = false;
	
	this.editButton = $(barInfo.editBarID + " .editBarEdit");
	this.saveButton = $(barInfo.editBarID + " .editBarSave");
	this.cancelButton = $(barInfo.editBarID + " .editBarCancel");
	this.errorLine = $(barInfo.editBarID + " .editBarError");
	
	this.saveButton.hide();
	this.cancelButton.hide();
	this.errorLine.hide();
	
	//	Add code to buttons
	
	this.editButton.on("mousedown",
		(function (editBar) {
			return (function (e)
				{
				editBar.editButton.hide();
				editBar.saveButton.show();
				editBar.cancelButton.show();
				editBar.errorLine.hide();
				
				editBar.barInfo.onEdit();
				});
			})(this)
		);

	this.saveButton.on("mousedown", 
		(function (editBar) {
			return (function (e)
				{
				editBar.barInfo.onSave();
				editBar.errorLine.hide();
				
				editBar.editButton.show();
				editBar.saveButton.hide();
				editBar.cancelButton.hide();
				});
			})(this)
		);
		
	this.cancelButton.on("mousedown",
		(function (editBar) {
			return (function (e)
				{
				editBar.barInfo.onCancel();
				editBar.errorLine.hide();
				
				editBar.editButton.show();
				editBar.saveButton.hide();
				editBar.cancelButton.hide();
				});
			})(this)
		);
	}
	
EditBar.prototype.showError = function (errorText)
	{
	this.errorLine.show();
	this.errorLine.text(errorText);
	
	//	Back to edit mode
	
	this.editButton.hide();
	this.saveButton.show();
	this.cancelButton.show();
	
	this.barInfo.onEdit();
	}
	
//	FileUpload Object ----------------------------------------------------------

function FileUpload (uploadInfo)
	{
	this.uploadInfo = uploadInfo;
	
	this.fileCtrl = $(uploadInfo.fileUploadID + " input")[0];
	this.errorLine = $(uploadInfo.fileUploadID + " .fileUploadError");
	
	this.errorLine.hide();
	
	//	When the user selects a file, upload it
	
	$(uploadInfo.fileUploadID + " input").on("change",
		(function (fileUpload) {
			return (function (e)
				{
				fileUpload.errorLine.hide();
				
				fileUpload.uploadInfo.onUpload(fileUpload, fileUpload.fileCtrl.files[0]);
				});
			})(this)
		);
	}

FileUpload.prototype.showError = function (errorText)
	{
	this.errorLine.show();
	this.errorLine.text(errorText);
	}
	
//	TabBar Object --------------------------------------------------------------

function TabBar (tabInfo, options)
	{
	this.tabInfo = tabInfo;
	this.curTab = null;
	this.classDisabled = ((options && options.classDisabled) ? options.classDisabled : "ctrlTabBarItemDisabled");
	this.classEnabled = ((options && options.classEnabled) ? options.classEnabled : "ctrlTabBarItemEnabled");
	this.classSelected = ((options && options.classSelected) ? options.classSelected : "ctrlTabBarItemSelected");
	
	//	Initialize all the tabs ------------------------------------------------
	
	var i;
	var firstTab = null;
	for (i = 0; i < tabInfo.length; i++)
		{
		var tabElement = $(tabInfo[i].tabID);
		
        //  OK if null; it means the tab is omitted

        if (tabElement == null)
            continue;
		
		//	If this tab is enabled, hook it up.
		
		if (tabInfo[i].isEnabled)
			{
			//	Enabled
			
			tabElement.addClass(this.classEnabled);
			
			//	Hook up the tab so that we can select it.
			
			tabElement.on("mousedown", (function (tabBar, tabToSelect) { return (function (e) { tabBar.selectTab(tabToSelect); }); })(this, i));
			
			//	Keep track of the first tab
			
			if (firstTab == null)
				firstTab = i;
			}
			
		//	Disable this tab
		
		else
			{
			//	tabElement.hide();
			tabElement.addClass(this.classDisabled);
			}
			
		$(tabInfo[i].sectionID).hide();
		}
		
	//	If we have a fragment ID then select the appropriate tab
	
	if (location.hash)
		{
		var found = this.onHashChange();
				
		if (!found)
			this.selectTab(firstTab);
		}
		
	//	Select the first tab
	
	else
		this.selectTab(firstTab);

	//	Register an event in case the hash changes

	$(window).on("hashchange", { tabBar:this }, function(e) {
		if (!e.data.tabBar.onHashChange())
			e.data.tabBar.selectTab(0);
		});
	}

TabBar.prototype.onHashChange = function ()
	{
	var i;
	var tabID = "#tab" + location.hash.substring(1);
		
	//	Look for the proper tab
		
	for (i = 0; i < this.tabInfo.length; i++)
		if (this.tabInfo[i].tabID == tabID)
			{
			this.selectTab(i);
			return true;
			}

	return false;
	}

TabBar.prototype.selectTab = function (tab)
	{
	if (this.curTab != tab)
		{
		//	Deselect the old tab
		
		if (this.curTab != null)
			{
			var oldTabElement = $(this.tabInfo[this.curTab].tabID);
			oldTabElement.removeClass(this.classSelected);
			oldTabElement.addClass(this.classEnabled);
			
			$(this.tabInfo[this.curTab].sectionID).hide();
			}
			
		//	Select the new tab

		if (tab != null)
			{
			var newTabElement = $(this.tabInfo[tab].tabID);
			newTabElement.removeClass(this.classEnabled);
			newTabElement.addClass(this.classSelected);
			
			$(this.tabInfo[tab].sectionID).show();

			if (tab == 0)
				location.hash = "";
			else
				location.hash = "#" + this.tabInfo[tab].tabID.substring(4);
			}
			
		this.curTab = tab;
		}
	}
