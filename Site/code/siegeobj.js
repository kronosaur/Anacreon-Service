//	siegeobj.js
//
//	Implements SiegeObject class
//	Copyright (c) 2018 Kronosaur Productions, LLC. All Rights Reserved.
//
//  FIELDS
//
//  id: The numeric ID of the object.
//
//	class: "siege"

function SiegeObject (serverObj)
	{
	$.extend(this, serverObj);
	
	this.kind = "spaceObject";
	}
