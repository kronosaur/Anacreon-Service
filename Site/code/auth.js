//	auth.js
//
//	Implements Anacreon User Sign In
//	Copyright (c) 2014 Kronosaur Productions, LLC. All Rights Reserved.

//	UserInfo Object ------------------------------------------------------------
//
//	This object represents the currently signed-in user.

function UserInfo (username, rights, authToken)
	{
	this.username = username;
	this.usernameKey = username.toLowerCase();
	this.rights = rights;
	this.authToken = authToken;
	}
	
UserInfo.prototype.canCreateComponent = function (componentType)
	{
	return $Hexarc.hasRights(this.rights, componentType.createRights);
	}
	
//	Register Dialog Box --------------------------------------------------------

function changePasswordDialog ()
	{
	var waitingForResponse = false;

	function cleanUp ()
		{
		$("#dlgChangePassword .ctrlCancel").off("click");
		$("#dlgChangePassword .ctrlOK").off("click");
	
		$UI.exitDialog();
		}
		
	function doCancel ()
		{
		cleanUp();
		}

	function doOK ()
		{
		if (waitingForResponse)
			return;

		//	Make sure password matches

		if ($("#dlgChangePassword .ctrlNewPassword").val() != $("#dlgChangePassword .ctrlConfirmPassword").val())
			{
			$UI.showDialogError("Password does not match the confirmation password. Please re-enter.");
			return;
			}

		//	Call the server

		waitingForResponse = true;

		var params = {
			username: $UserInfo.usernameKey,
			oldPassword: $("#dlgChangePassword .ctrlOldPassword").val(),
			newPassword: $("#dlgChangePassword .ctrlNewPassword").val(),
			};

		var request = $.ajax({
			url: "/api/changePassword",
			type: "POST",
			data: JSON.stringify(params),
			contentType: "application/json",
			dataType: "json",
			
			success: (function (data) {
				waitingForResponse = false;
				
				//	If the result was a Hexarc error, then we display it in the
				//	dialog box (and leave the dialog box up).
				
				if ($Hexarc.isError(data))
					{
					$UI.showDialogError($Hexarc.getErrorMessage(data));
					}
					
				//	Otherwise, creation succeeded
				
				else
					{
					location.reload();
					}
				}),

			error: (function (jqXHR, textStatus, errorThrown) {
				waitingForReponse = false;
				})
			});
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

	//	Show the dialog box.
	//	We start by graying out the page.
	
	$UI.enterDialog("#dlgChangePassword");
	
	//	Buttons
	
	$("#dlgChangePassword .ctrlCancel").on("click", doCancel);
	$("#dlgChangePassword .ctrlOK").on("click", doOK);

	//	Clear

	$("#dlgChangePassword .ctrlOldPassword").val("");
	$("#dlgChangePassword .ctrlNewPassword").val("");
	$("#dlgChangePassword .ctrlConfirmPassword").val("");

	$UI.keydown(onKeydown);

	//	Focus

	$("#dlgChangePassword .ctrlOldPassword").focus();
	}

//	Register Dialog Box --------------------------------------------------------

function registerDialog (onSignIn)
	{
	var waitingForResponse = false;

	function cleanUp ()
		{
		$("#dlgRegister .ctrlCancel").off("click");
		$("#dlgRegister .ctrlOK").off("click");
		$("#dlgRegister .ctrlSignIn").off("click");
		$("#dlgRegister .ctrlTOS").off("click");
	
		$UI.exitDialog();
		}
		
	function doCancel ()
		{
		cleanUp();
		}

	function doOK ()
		{
		if (waitingForResponse)
			return;

		//	Make sure password matches

		if ($("#dlgRegister .ctrlPassword").val() != $("#dlgRegister .ctrlConfirmPassword").val())
			{
			$UI.showDialogError("Password does not match the confirmation password. Please re-enter.");
			return;
			}

		//	Call the server

		waitingForResponse = true;

		var params = {
			username: $("#dlgRegister .ctrlName").val(),
			password: $("#dlgRegister .ctrlPassword").val(),
			email: $("#dlgRegister .ctrlEmail").val(),
			};

		var request = $.ajax({
			url: "/api/register",
			type: "POST",
			data: JSON.stringify(params),
			contentType: "application/json",
			dataType: "json",
			
			success: (function (data) {
				waitingForResponse = false;
				
				//	If the result was a Hexarc error, then we display it in the
				//	dialog box (and leave the dialog box up).
				
				if ($Hexarc.isError(data))
					{
					$UI.showDialogError($Hexarc.getErrorMessage(data));
					}
					
				//	Otherwise, creation succeeded
				
				else
					{
					if (onSignIn)
						{
						$UserInfo = new UserInfo(data.username, data.rights, data.authToken);
						onSignIn();
						}
					else
						location.reload();
					}
				}),

			error: (function (jqXHR, textStatus, errorThrown) {
				waitingForReponse = false;
				})
			});
		}

	function doSignIn ()
		{
		cleanUp();
		signInDialog();
		}

	function doTermsOfService ()
		{
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

	//	Show the dialog box.
	//	We start by graying out the page.
	
	$UI.enterDialog("#dlgRegister");
	
	//	Buttons
	
	$("#dlgRegister .ctrlCancel").on("click", doCancel);
	$("#dlgRegister .ctrlOK").on("click", doOK);
	$("#dlgRegister .ctrlSignIn").on("click", doSignIn);
	$("#dlgRegister .ctrlTOS").on("click", doTermsOfService);

	$UI.keydown(onKeydown);

	//	Focus

	$("#dlgRegister .ctrlName").focus();
	}

//	Sign In Dialog Box ---------------------------------------------------------

function signInDialog (onSignIn)
	{
	var waitingForResponse = false;

	function cleanUp ()
		{
		$("#dlgSignIn .ctrlCancel").off("click");
		$("#dlgSignIn .ctrlOK").off("click");
		$("#dlgSignIn .ctrlRegister").off("click");
		$("#dlgSignIn .ctrlResetPassword").off("click");
	
		$UI.exitDialog();
		}
		
	function doCancel ()
		{
		cleanUp();
		}

	function doOK ()
		{
		if (waitingForResponse)
			return;

		waitingForResponse = true;

		var params = {
			actual: true,
			username: $("#dlgSignIn .ctrlName").val(),
			password: $("#dlgSignIn .ctrlPassword").val()
			};

		var request = $.ajax({
			url: "/api/login",
			type: "POST",
			data: JSON.stringify(params),
			contentType: "application/json",
			dataType: "json",
			
			success: (function (data) {
				waitingForResponse = false;
				
				//	If the result was a Hexarc error, then we display it in the
				//	dialog box (and leave the dialog box up).
				
				if ($Hexarc.isError(data))
					{
					$UI.showDialogError($Hexarc.getErrorMessage(data));
					}
					
				//	Otherwise, creation succeeded
				
				else
					{
					if (onSignIn)
						{
						$UserInfo = new UserInfo(data.username, data.rights, data.authToken);
						onSignIn();
						}
					else
						location.reload();
					}
				}),

			error: (function (jqXHR, textStatus, errorThrown) {
				waitingForReponse = false;
				$UI.showDialogError(errorThrown);
				})
			});
		}

	function doRegister ()
		{
		cleanUp();
		registerDialog(onSignIn);
		}

	function doResetPassword ()
		{
		$UI.showDialogError("Password reset not yet implemented. Please email support@kronosaur.com for help resetting your password.");
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

	//	Show the dialog box.
	//	We start by graying out the page.
	
	$UI.enterDialog("#dlgSignIn");
	
	//	Buttons
	
	$("#dlgSignIn .ctrlCancel").on("click", doCancel);
	$("#dlgSignIn .ctrlOK").on("click", doOK);
	$("#dlgSignIn .ctrlRegister").on("click", doRegister);
	$("#dlgSignIn .ctrlResetPassword").on("click", doResetPassword);

	$UI.keydown(onKeydown);
//	$UI.keypress(onKeypress);

	//	Focus

	$("#dlgSignIn .ctrlName").focus();
	}

function signOut ()
	{
	var request = $.ajax({
		url: "/api/logoff",
		type: "POST",
		data: JSON.stringify({ }),
		contentType: "application/json",
		dataType: "json",
		
		success: (function (data) {
			location.reload();
			}),

		error: (function (jqXHR, textStatus, errorThrown) {
			location.reload();
			})
		});
	}
