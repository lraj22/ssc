// main.js
// the logic of the operation!

// variablization of all [id]s
document.querySelectorAll("[id]").forEach(function (e) { window[e.id] = e; });

function tick () {
	// update time view
	var d = new Date();
	var hours = (d.getHours() % 12) || 12;
	var minutes = d.getMinutes().toString().padStart(2, "0");
	timeView.textContent = hours + ":" + minutes;
	
	// time left/time since views
	var currentPeriod = getCurrentPeriod();
	if (currentPeriod) {
		timePeriod.textContent = currentPeriod.name;
		timeOver.textContent = msToTimeDiff(d - currentPeriod.starts, Math.ceil) + " over";
		timeLeft.textContent = msToTimeDiff(currentPeriod.ends - d, Math.floor) + " left";
	} else {
		timePeriod.textContent = "";
		timeOver.textContent = "";
		timeLeft.textContent = "";
	}
	
	// to next tick
	requestAnimationFrame(tick);
}

// left 25% of screen to show time over, right 75% to show time left (more common)
window.addEventListener("mousemove", function (e) {
	var percentAcross = (e.clientX / window.innerWidth * 100).toFixed();
	if (percentAcross < 25) document.body.dataset.pointerpos = "left";
	else if (percentAcross > 75) document.body.dataset.pointerpos = "right";
	else document.body.dataset.pointerpos = "center";
});

function getCurrentPeriod () {
	if (lastSavedSchedules === null) return null;
	var d = new Date();
	var today = 1 << d.getDay();
	for (let i = 0; i < lastSavedSchedules.length; i++) {
		let currentSchedule = lastSavedSchedules[i];
		if (!(currentSchedule.days & today)) break;
		for (let j = 0; j < currentSchedule.periods.length; j++) {
			let period = currentSchedule.periods[j];
			let periodStart = timeBitToDate(period.starts);
			let periodEnd = timeBitToDate(period.ends);
			if ((periodStart <= d) && (d <= periodEnd)) {
				return {
					"name": period.name,
					"starts": periodStart,
					"ends": periodEnd,
				};
			}
		}
	}
	return null;
}

function msToTimeDiff (ms, f) {
	var timeSeconds = (f ? f : Math.round)(ms / 1000);
	var outComponents = [];
	var forceAllNext = false;
	if (forceAllNext || (timeSeconds >= 3600)) {
		outComponents.push(Math.floor(timeSeconds / 3600).toString());
		timeSeconds %= 3600;
		forceAllNext = true;
	}
	if (forceAllNext || (timeSeconds >= 60)) {
		outComponents.push(Math.floor(timeSeconds / 60).toString());
		timeSeconds %= 60;
		forceAllNext = true;
	}
	outComponents.push(timeSeconds.toString());
	if (outComponents.length > 2) {
		outComponents[1] = outComponents[1].padStart(2, "0");
	}
	if (outComponents.length > 1) {
		let lastIndex = outComponents.length - 1;
		outComponents[lastIndex] = outComponents[lastIndex].padStart(2, "0");
		return outComponents.join(":");
	} else {
		return outComponents[0] + "s";
	}
}

function pad0 (original) {
	return original.toString().padStart(2, "0");
}

function timeBitToDate (timeBit) {
	var targetDate = new Date();
	var bits = timeBit.split(":");
	var hours = parseInt(bits[0]);
	var minutes = parseInt(bits[1]);
	targetDate.setHours(hours);
	targetDate.setMinutes(minutes);
	targetDate.setSeconds(0);
	targetDate.setMilliseconds(0);
	return targetDate;
}

// page visibility management
var showModes = ["showMain", "showSchedule"];
function setShow (mode) {
	for (var index in showModes) {
		document.body.classList.remove(showModes[index]);
	}
	document.body.classList.add(mode);
}

scheduleBtn.addEventListener("click", function () {
	setShow("showSchedule");
	if (!scheduleContainer.childElementCount) addScheduleBlock();
});
exitScheduleView.addEventListener("click", function () {
	var unsavedChangesExist = recalcUnsavedChanges();
	if (unsavedChangesExist) {
		if (confirm("You have unsaved changes - exiting will delete them! Are you sure?")) {
			setCurrentSchedules(lastSavedSchedules);
			recalcUnsavedChanges();
			setShow("showMain");
		}
	} else setShow("showMain");
});
saveSchedule.addEventListener("click", function () {
	saveState();
	recalcUnsavedChanges();
	setShow("showMain");
});
deleteAll.addEventListener("click", function () {
	if (!confirm("Are you sure you want to delete all schedules? This is irreversible!")) return;
	scheduleContainer.innerHTML = "";
	saveState();
	recalcUnsavedChanges();
	setShow("showMain");
});

// useful variables
var hints = {
	"schName": "Give this schedule a name. For example: 'Regular Schedule', 'Late Start', 'Block A', etc.",
	"schPeriods": "Add some periods. Ex. class periods, passing periods, lunch, and anything else you want to add.",
	"schPeriodName": "Name of period, ex. First period, 1st-2nd passing period, Lunch, etc.",
	"schPeriodStart": "Start of period, ex. 9:00 AM",
	"schPeriodEnd": "End of period, ex. 10:00 AM",
	"schDays": "Which days of the week is this schedule effective? For example, all weekdays, only Monday, etc.",
	"periodMoveUp": "Move this period up",
	"periodRemove": "Remove this period",
	"periodMoveDown": "Move this period down",
};
var lastUsedScheduleId = 1;
var lastUsedPeriodIds = [];
var _ = ""; // ${} placeholder

addSchedule.addEventListener("click", function () {
	addScheduleBlock();
});

function addPeriod (schId) {
	var periods = document.getElementById("periods" + schId);
	var periodId = lastUsedPeriodIds[schId - 1]++;
	var period = document.createElement("div");
	period.id = "period" + schId + "_" + periodId;
	period.setAttribute("data-id", periodId);
	period.classList.add("period");
	var periodNumber = periods.childElementCount + 1;
	period.insertAdjacentHTML("beforeend", `<label for="periodName${schId}_${periodId}">Name: </label>
<input type="text" oninput="recalcUnsavedChanges()" id="periodName${schId}_${periodId}" title="${hints.schPeriodName}" value="Period ${periodNumber}"><br><br>
<label for="periodStart${schId}_${periodId}">Starts: </label>
<input type="time" oninput="recalcUnsavedChanges()" id="periodStart${schId}_${periodId}" title="${hints.schPeriodStart}">
<div class="floatRight">
	<label for="periodEnd${schId}_${periodId}">Ends: </label>
	<input type="time" oninput="recalcUnsavedChanges()" id="periodEnd${schId}_${periodId}" title="${hints.schPeriodEnd}">
</div><br><br>
<div class="topRightBtnMenu">
	<span class="material-symbols-outlined" onclick="movePeriodUp(${schId},${periodId})" data-purpose="moveUp" title="${hints.periodMoveUp}">move_up</span>
	<span class="material-symbols-outlined textDanger" onclick="removePeriod(${schId},${periodId})" data-purpose="remove" title="${hints.periodRemove}">delete</span>
	<span class="material-symbols-outlined" onclick="movePeriodDown(${schId},${periodId})" data-purpose="moveDown" title="${hints.periodMoveDown}">move_down</span>
</div>`);
	periods.appendChild(period);
	recalcUnsavedChanges();
	return periodId;
}

function addScheduleBlock () {
	var schBlock = document.createElement("div");
	schBlock.classList.add("scheduleBlock");
	var schId = lastUsedScheduleId++;
	lastUsedPeriodIds[schId - 1] = 1;
	schBlock.id = "schedule" + schId;
	schBlock.setAttribute("data-id", schId);
	schBlock.insertAdjacentHTML("beforeend", `<div title="${hints.schName}">
	<label for="schNameInput${schId}" class="schLabel">Schedule name</label>
	<input type="text" oninput="recalcUnsavedChanges()" id="schNameInput${schId}" value="Schedule ${schId}">
</div>
<div title="${hints.schPeriods}">
	<label class="schLabel">Periods</label>
	<div class="periodsBlock" id="periods${schId}"></div>
	<button class="addPeriod" id="addPeriod${schId}" onclick="addPeriod(${schId})">ADD PERIOD</button>
</div>
<div id="days${schId}" title="${hints.schDays}">
	<label class="schLabel">Days of the week</label>
	<input type="checkbox" oninput="recalcUnsavedChanges()" id="sunday${schId}"><label for="sunday${schId}"> Sunday</label><br>
	<input type="checkbox" oninput="recalcUnsavedChanges()" id="monday${schId}"><label for="monday${schId}"> Monday</label><br>
	<input type="checkbox" oninput="recalcUnsavedChanges()" id="tuesday${schId}"><label for="tuesday${schId}"> Tuesday</label><br>
	<input type="checkbox" oninput="recalcUnsavedChanges()" id="wednesday${schId}"><label for="wednesday${schId}"> Wednesday</label><br>
	<input type="checkbox" oninput="recalcUnsavedChanges()" id="thursday${schId}"><label for="thursday${schId}"> Thursday</label><br>
	<input type="checkbox" oninput="recalcUnsavedChanges()" id="friday${schId}"><label for="friday${schId}"> Friday</label><br>
	<input type="checkbox" oninput="recalcUnsavedChanges()" id="saturday${schId}"><label for="saturday${schId}"> Saturday</label><br>
</div>
<div class="buttonContainer">
<button class="btnInfo" onclick="moveScheduleUp(${schId})" data-purpose="moveUp">Move up</button>
<button class="btnDanger" onclick="removeSchedule(${schId})" data-purpose="remove">Remove</button>
	<button class="btnInfo" onclick="moveScheduleDown(${schId})" data-purpose="moveDown">Move down</button>
</div>`);
	scheduleContainer.appendChild(schBlock);
	recalcUnsavedChanges();
	return schId;
}

var daysBitmap = {
	"sunday": 1,
	"monday": 2,
	"tuesday": 4,
	"wednesday": 8,
	"thursday": 16,
	"friday": 32,
	"saturday": 64,
};

function currentSchedulesToJSON () {
	var schedulesObj = [];
	scheduleContainer.querySelectorAll(".scheduleBlock").forEach(function (schBlock) {
		var schObj = {
			"name": "<unset>",
			"periods": [],
			"days": 0,
		};
		var schId = parseInt(schBlock.getAttribute("data-id"));
		schObj.name = document.getElementById("schNameInput" + schId).value;
		var days = document.getElementById("days" + schId);
		var dayBitfield = 0;
		days.querySelectorAll("input").forEach(function (dayCheckbox) {
			var dayName = dayCheckbox.id.replace(schId, "");
			if (dayCheckbox.checked) dayBitfield |= daysBitmap[dayName];
		});
		schObj.days = dayBitfield;
		schBlock.querySelectorAll(".period").forEach(function (period) {
			var periodObj = {
				"name": "<unset>",
				"starts": "",
				"ends": "",
			};
			var periodId = parseInt(period.getAttribute("data-id"));
			var combinedId = schId + "_" + periodId;
			periodObj.name = document.getElementById("periodName" + combinedId).value;
			periodObj.starts = document.getElementById("periodStart" + combinedId).value;
			periodObj.ends = document.getElementById("periodEnd" + combinedId).value;
			schObj.periods.push(periodObj);
		});
		schedulesObj.push(schObj);
	});
	return schedulesObj;
}
function setCurrentSchedules (schedules) {
	try {
		scheduleContainer.innerHTML = "";
		schedules.forEach(function (savedSchedule) {
			var schId = addScheduleBlock();
			document.getElementById("schNameInput" + schId).value = savedSchedule.name;
			Object.keys(daysBitmap).forEach(function (dayName) {
				if (savedSchedule.days & daysBitmap[dayName]) {
					document.getElementById(dayName + schId).checked = true;
				}
			});
			savedSchedule.periods.forEach(function (period) {
				var periodId = addPeriod(schId);
				var combinedId = schId + "_" + periodId;
				document.getElementById("periodName" + combinedId).value = period.name;
				document.getElementById("periodStart" + combinedId).value = period.starts;
				document.getElementById("periodEnd" + combinedId).value = period.ends;
			});
		});
		return true;
	} catch (e) {
		console.error(e);
		return false;
	}
}
var lastSavedSchedules = null;
function saveState () {
	setUsingURL(false);
	lastSavedSchedules = currentSchedulesToJSON();
	localforage.setItem("savedSchedules", lastSavedSchedules);
	unsavedChanges.className = "";
}

// load existing schedules
var timeToCharacter = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-".split("");
var usingURL = false;
setUsingURL(false);
console.log(usingURL);
localforage.getItem("savedSchedules").then(function (savedSchedules) {
	if (!savedSchedules) return;
	setCurrentSchedules(savedSchedules);
	lastSavedSchedules = savedSchedules;
	recalcUnsavedChanges();
	var loadURL = new URL(location.href);
	var serializedSchedulesV1 = loadURL.searchParams.get("sv1");
	if (serializedSchedulesV1) {
		var deserialized = deserializeSchCode(serializedSchedulesV1);
		if (JSON.stringify(lastSavedSchedules) !== JSON.stringify(deserialized)) {
			setUsingURL(true);
			setCurrentSchedules(deserialized);
			lastSavedSchedules = deserialized;
		}
	} else setUsingURL(false);
});

function recalcUnsavedChanges () {
	if (lastSavedSchedules === null) return false;
	if (usingURL) return false;
	var currentSchedules = currentSchedulesToJSON();
	if (currentSchedules.length) {
		scheduleBtn.innerHTML = `<span class="material-symbols-outlined">edit</span>`;
	} else {
		scheduleBtn.innerHTML = "+ Add Schedule";
	}
	var schedulesStr = JSON.stringify(currentSchedules);
	var unsavedChangesExist = (schedulesStr !== JSON.stringify(lastSavedSchedules));
	unsavedChanges.className = (unsavedChangesExist ? "": "hidden");
	return unsavedChangesExist;
}

function setUsingURL (value) {
	usingURL = value;
	usingURLNotifier.classList.toggle("hidden", !value);
}

function removeSchedule (schId) {
	document.getElementById("schedule" + schId).remove();
	recalcUnsavedChanges();
}

function moveScheduleDown (schId) {
	var currentSchedule = document.getElementById("schedule" + schId);
	var nextSchedule = currentSchedule.nextElementSibling;
	if (nextSchedule) {
		nextSchedule.insertAdjacentElement("afterend", currentSchedule);
	}
	recalcUnsavedChanges();
}

function moveScheduleUp (schId) {
	var currentSchedule = document.getElementById("schedule" + schId);
	var previousSchedule = currentSchedule.previousElementSibling;
	if (previousSchedule) {
		previousSchedule.insertAdjacentElement("beforebegin", currentSchedule);
	}
	recalcUnsavedChanges();
}

function removePeriod (schId, periodId) {
	document.getElementById("period" + schId + "_" + periodId).remove();
	recalcUnsavedChanges();
}

function movePeriodDown (schId, periodId) {
	var currentPeriod = document.getElementById("period" + schId + "_" + periodId);
	var nextPeriod = currentPeriod.nextElementSibling;
	if (nextPeriod) {
		nextPeriod.insertAdjacentElement("afterend", currentPeriod);
	}
	recalcUnsavedChanges();
}

function movePeriodUp (schId, periodId) {
	var currentPeriod = document.getElementById("period" + schId + "_" + periodId);
	var previousPeriod = currentPeriod.previousElementSibling;
	if (previousPeriod) {
		previousPeriod.insertAdjacentElement("beforebegin", currentPeriod);
	}
	recalcUnsavedChanges();
}

backToOwnSchedules.addEventListener("click", function () {
	var currentURL = new URL(location.href);
	currentURL.searchParams.delete("sv1");
	location.assign(currentURL);
});

uploadSchedules.addEventListener("click", function () {
	uploadFileInput.click();
});

uploadFileInput.addEventListener("change", function (changeEvent) {
	var file = changeEvent.target.files[0];
	if (!file) return;
	var reader = new FileReader();
	reader.readAsText(file, "utf-8");
	reader.onload = function (readerEvent) {
		try {
			var schedulesJSON = JSON.parse(readerEvent.target.result);
			var success = setCurrentSchedules(schedulesJSON);
			if (!success) {
				alert("The file you uploaded may be corrupted - there was an error in loading the schedules.");
			}
		} catch (e) {
			alert("The file you uploaded could not be parsed correctly. It may be corrupted, or it may just be the wrong file.");
		}
	};
});

shareSchedules.addEventListener("click", function () {
	shareMenu.classList.toggle("hidden");
});

downloadSchedules.addEventListener("click", function () {
	if (recalcUnsavedChanges()) {
		alert("You have unsaved changes. Please save/discard first, then download your schedules.");
		return;
	}
	var fileTitle = prompt("Give your schedules a title (hint: school name, regular schedules, etc.)");
	if (fileTitle === null) return;
	fileTitle = fileTitle.trim() || "Schedules";
	var downloadLink = document.createElement("a");
	downloadLink.setAttribute("href", "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lastSavedSchedules, null, "\t")));
	downloadLink.setAttribute("download", fileTitle + ".json");
	downloadLink.click();
});

copySchedulesLink.addEventListener("click", function () {
	if (recalcUnsavedChanges()) {
		alert("You have unsaved changes. Please save/discard first, then download your schedules.");
		return;
	}
	var serialized = serializeSchedules();
	console.log(serialized);
	var schedulesLink = new URL(location.href);
	schedulesLink.searchParams.set("sv1", serialized);
	navigator.clipboard.writeText(schedulesLink.toString()).then(function () {
		alert("The link has been successfully copied! Share it with your classmates!\n" + schedulesLink.toString());
	}).catch(function (error) {
		alert("There was an error. Please copy the link manually:\n" + schedulesLink.toString())
		console.log(error);
	});
});

function serializeSchedules () {
	return lastSavedSchedules.map(function (schedule) {
		var scheduleParts = [];
		scheduleParts.push(userTextToBase64(schedule.name));
		scheduleParts.push(schedule.days.toString(16));
		for (let i = 0; i < schedule.periods.length; i++) {
			let period = schedule.periods[i];
			scheduleParts.push(compressTimeBit(period.starts) + compressTimeBit(period.ends) + userTextToBase64(period.name));
		}
		return scheduleParts.join(",");
	}).join(";");
}

function deserializeSchCode (schCode) {
	return schCode.split(";").map(function (scheduleCode) {
		var scheduleParts = scheduleCode.split(",");
		return {
			"name": base64ToUserText(scheduleParts[0]),
			"periods": scheduleParts.slice(2).map(function (periodCode) {
				return {
					"name": base64ToUserText(periodCode.slice(4)),
					"starts": decompressTimeBit(periodCode.slice(0, 2)),
					"ends": decompressTimeBit(periodCode.slice(2, 4)),
				};
			}),
			"days": parseInt(scheduleParts[1], 16),
		};
	});
}

function compressTimeBit (timeBit) {
	var parts = timeBit.split(":");
	var hours = parseInt(parts[0]);
	var minutes = parseInt(parts[1]);
	return timeToCharacter[hours] + timeToCharacter[minutes];
}

function decompressTimeBit (compressedTimeBit) {
	var hours = timeToCharacter.findIndex(function (char) { return char === compressedTimeBit[0] });
	var minutes = timeToCharacter.findIndex(function (char) { return char === compressedTimeBit[1] });
	return hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
}

function userTextToBase64 (userText) {
	return btoa(Array.from(new TextEncoder().encode(userText), function (byte) {
		return String.fromCodePoint(byte);
	}).join("")).replaceAll("/", "-");
}

function base64ToUserText (base64) {
	return new TextDecoder().decode(Uint8Array.from(atob(base64.replaceAll("-", "/")), function (m) {
		return m.codePointAt(0);
	}));
}

requestAnimationFrame(tick);
