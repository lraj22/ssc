/*! loadCSS. [c]2020 Filament Group, Inc. MIT License */
/*! Minifed */
!function(e){"use strict";var n=function(n,t,r,i){var o,d=e.document,a=d.createElement("link");if(t)o=t;else{var f=(d.body||d.getElementsByTagName("head")[0]).childNodes;o=f[f.length-1]}var l=d.styleSheets;if(i)for(var s in i)i.hasOwnProperty(s)&&a.setAttribute(s,i[s]);a.rel="stylesheet",a.href=n,a.media="only x",!function e(n){if(d.body)return n();setTimeout(function(){e(n)})}(function(){o.parentNode.insertBefore(a,t?o:o.nextSibling)});var u=function(e){for(var n=a.href,t=l.length;t--;)if(l[t].href===n)return e();setTimeout(function(){u(e)})};function c(){a.addEventListener&&a.removeEventListener("load",c),a.media=r||"all"}return a.addEventListener&&a.addEventListener("load",c),a.onloadcssdefined=u,u(c),a};"undefined"!=typeof exports?exports.loadCSS=n:e.loadCSS=n}("undefined"!=typeof global?global:this);
/*! onloadCSS. (onload callback for loadCSS) [c]2017 Filament Group, Inc. MIT License */
/*! Minifed */
function onloadCSS(n,a){var d;function t(){!d&&a&&(d=!0,a.call(n))}n.addEventListener&&n.addEventListener("load",t),n.attachEvent&&n.attachEvent("onload",t),"isApplicationInstalled"in navigator&&"onloadcssdefined"in n&&n.onloadcssdefined(t)}
onloadCSS(
	loadCSS("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block"),
	function () {
		document.body.classList.add("materialSymbolsLoaded");
		loaded();
	}
);
onloadCSS(
	loadCSS("./all.min.css"),
	function () {
		loaded();
	}
);

// section: variablization of all [id]s
document.querySelectorAll("[id]").forEach(function (e) { window[e.id] = e; });

// section: useful/common variables
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
var daysBitmap = {
	"sunday": 1,
	"monday": 2,
	"tuesday": 4,
	"wednesday": 8,
	"thursday": 16,
	"friday": 32,
	"saturday": 64,
};
var timeToCharacter = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-".split("");
var usingURL = false;
var lastSavedSchedules = null;
var darkishBgs = ["dark"];
var lightishBgs = ["light", "mistyRose"];
var defaultSettings = {
	"themeBg": "dark",
	"themeFg": "darkLight",
	"themeFont": "lucida",
	"timerRing": "harp",
	"timerRingVolume": "100",
	"alwaysShowIconMenu": true,
	"twentyFourHourTime": false,
	"blinkingColon": false,
};
var settings = cloneObj(defaultSettings);
var stopwatchData = {
	"total": 0,
};
var timerData = {
	"from": 10 * 60 * 1000,
	"total": 10 * 60 * 1000,
	"isMuted": false,
};
var audios = {};
var audioTypes = {
	"timerRing": "timerEndHarp",
};
var audiosCurrentlyPlaying = [];
var loadFlags = 0;
var _ = ""; // ${} placeholder

// section: functions that modify the schedule
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

function removeSchedule (schId) {
	document.getElementById("schedule" + schId).remove();
	recalcUnsavedChanges();
}

// section: functions that interface schedules in the schedules view
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

function recalcUnsavedChanges () {
	if (lastSavedSchedules === null) return false;
	var currentSchedules = currentSchedulesToJSON();
	document.body.classList.toggle("schedulesExist", !!currentSchedules.length);
	if (usingURL) return false;
	var schedulesStr = JSON.stringify(currentSchedules);
	var unsavedChangesExist = (schedulesStr !== JSON.stringify(lastSavedSchedules));
	unsavedChanges.className = (unsavedChangesExist ? "": "hidden");
	return unsavedChangesExist;
}

function saveState (callback) {
	setUsingURL(false);
	lastSavedSchedules = currentSchedulesToJSON();
	unsavedChanges.className = "";
	localforage.setItem("savedSchedules", lastSavedSchedules, callback);
}

// section: functions that deal with (de)serialized schedules somehow
function setUsingURL (value) {
	usingURL = value;
	usingURLNotifier.classList.toggle("hidden", !value);
}
setUsingURL(false);

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
	return pad0(hours) + ":" + pad0(minutes);
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

// section: settings functions
function applySettings (settingsToApply) {
	var appliedSettings = addObj(defaultSettings, settingsToApply);
	settings = cloneObj(appliedSettings);
	Object.keys(appliedSettings).forEach(function (setting) {
		var settingEl = document.querySelector(`[data-setting-name="${setting}"]`);
		if (!settingEl) {
			console.warn(`Could not apply setting ${JSON.stringify(setting)} (no setting element).`);
			return;
		}
		if (settingEl.type !== "checkbox") settingEl.value = appliedSettings[setting];
		else settingEl.checked = appliedSettings[setting];
	});
	reprocessSettings();
}
function reprocessSettings () {
	if ("themeBg" in settings) {
		document.documentElement.setAttribute("data-theme-bg", settings.themeBg);
		document.documentElement.classList.toggle("darkishBg", darkishBgs.includes(settings.themeBg));
		document.documentElement.classList.toggle("lightishBg", lightishBgs.includes(settings.themeBg));	
	}
	if ("themeFg" in settings) {
		document.documentElement.setAttribute("data-theme-fg", settings.themeFg);
	}
	if ("themeFont" in settings) {
		document.documentElement.setAttribute("data-theme-font", settings.themeFont);
	}
	
	if ("timerRing" in settings) {
		if ((audiosCurrentlyPlaying.includes("timerRing")) && (audioTypes.timerRing !== settings.timerRing)) {
			audioSwitch("timerRing", settings.timerRing);
		}
		audioTypes.timerRing = settings.timerRing;
	}
	if ("timerRingVolume" in settings) {
		setAudioVolume("timerRing", parseInt(settings.timerRingVolume) / 100);
	}
	
	if ("alwaysShowIconMenu" in settings) {
		iconMenu.classList.toggle("hoverToShow", !settings.alwaysShowIconMenu);
	}
}
function updateSettings () {
	var updatedSettings = {};
	document.querySelectorAll("[data-setting-name]").forEach(function (settingEl) {
		var isCheckbox = (settingEl.type === "checkbox");
		updatedSettings[settingEl.getAttribute("data-setting-name")] = (isCheckbox ? settingEl.checked : settingEl.value);
	});
	settings = addObj(defaultSettings, cloneObj(updatedSettings));
	localforage.setItem("settings", settings);
	reprocessSettings();
}

// stopwatch & timer
function makeDraggable(element, dragger) {
	function mousemoveDrag (e) {
		e.preventDefault();
		posX1 = mouseX - e.clientX;
		posY1 = mouseY - e.clientY;
		mouseX = e.clientX;
		mouseY = e.clientY;
		element.style.top = (element.offsetTop - posY1) + "px";
		element.style.left = (element.offsetLeft - posX1) + "px";
	}
	
	var posX1 = 0, posY1 = 0, mouseX = 0, mouseY = 0;
	dragger.addEventListener("mousedown", function (e) {
		e.preventDefault();
		document.body.classList.add("dragging");
		mouseX = e.clientX;
		mouseY = e.clientY;
		document.onmouseup = function () {
			document.body.classList.remove("dragging");
			document.onmouseup = null;
			document.onmousemove = null;
		};
		document.onmousemove = mousemoveDrag;
	});
	
	dragger.addEventListener("touchstart", function (ev) {
		document.body.classList.add("dragging");
		dragger.addEventListener("touchmove", ontouchmove, {
			"passive": false,
		});
		dragger.addEventListener("touchend", ontouchend);
		dragger.addEventListener("touchcancel", ontouchend);
	
		function ontouchmove (e) {
			e.preventDefault();
			for (target of e.targetTouches) {
				var x = target.clientX - dragger.clientWidth/2 + "px";
				var y = target.clientY - dragger.clientHeight/2 + "px";
				element.style.left = x;
				element.style.top = y;
			}
		
		}
		
		function ontouchend () {
			document.body.classList.remove("dragging");
			dragger.removeEventListener('touchmove', ontouchmove);
			dragger.removeEventListener("touchend", ontouchend);
			dragger.removeEventListener("touchcancel", ontouchend);
		}
	
	});
}

function adjustFontSize (textElement) {
	const position = textElement.parentElement.getBoundingClientRect();
	const newFontSize = Math.min(position.width, position.height) * 0.225; // magic number (scale size)
	textElement.style.fontSize = newFontSize + "px";
}

function timeDiffToMs (timeDiff) {
	var multipliers = [1e3, 60e3, 3600e3, 24 * 3600e3];
	var parts = timeDiff.replace(/[^\d:.]/g, "").split(":").reverse().map(function (part, i) {
		if (i) part = part.replaceAll(".", "");
		let dotIndex = part.indexOf(".");
		if (dotIndex !== -1) part = part.slice(0, dotIndex) + "." + part.slice(dotIndex).replaceAll(".", "");
		return parseFloat(part || "0") || 0;
	});
	return parts.reduce(function (acc, curr, i) {
		return acc + (curr * (multipliers[i] || 0));
	}, 0);
}

// section: functions used by tick() and general others
function getCurrentPeriod () {
	if (lastSavedSchedules === null) return null;
	var d = new Date();
	var today = 1 << d.getDay(); // bitwise shift left (matches daysBitmap)
	for (let i = 0; i < lastSavedSchedules.length; i++) {
		let currentSchedule = lastSavedSchedules[i];
		if (!(currentSchedule.days & today)) continue; // bitwise AND (checks if dayBitmap has day enabled)
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

function msToTimeDiff (ms, f, afterDigits) {
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
	outComponents.push(afterDigits ? timeSeconds.toFixed(afterDigits) : timeSeconds.toString());
	if (outComponents.length > 2) {
		outComponents[1] = outComponents[1].padStart(2, "0");
	}
	if (outComponents.length > 1) {
		let lastIndex = outComponents.length - 1;
		outComponents[lastIndex] = outComponents[lastIndex].padStart(afterDigits ? (3 + afterDigits) : 2, "0");
		return outComponents.join(":");
	} else {
		return outComponents[0] + (afterDigits ? "" : "s");
	}
}

function pad0 (original) {
	return original.toString().padStart(2, "0");
}

// cloneObj function taken from https://stackoverflow.com/a/7574273
function cloneObj (obj) {
	if (obj == null || typeof (obj) != 'object') {
		return obj;
	}

	var clone = new obj.constructor();
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) {
			clone[key] = cloneObj(obj[key]);
		}
	}

	return clone;
}
function addObj (original, addme) {
	var combined = cloneObj(original);
	if (typeof addme !== "object") return combined;
	for (var key in addme) {
		if (addme.hasOwnProperty(key)) {
			combined[key] = addme[key];
		}
	}
	return combined;
}

// section: audio
function loadAudios () {
	var audioBase = "./audio/";
	var audioList = {
		"silent": {
			"slug": "silent.mp3",
			"loop": true,
		},
		"timerEndHarp": {
			"slug": "timer-end-harp.mp3",
			"loop": true,
		},
		"timerEndQuick": {
			"slug": "timer-end-quick.mp3",
			"loop": true,
		},
	};
	Object.keys(audioList).forEach(function (audioId) {
		var audio = audioList[audioId];
		var audioEl = new Audio(audioBase + audio.slug);
		if ("loop" in audio) audioEl.loop = audio.loop;
		audios[audioId] = audioEl;
	});
}
loadAudios();
function audioPlay (type) {
	let audioKey = audioTypes[type];
	if (!audioKey) return;
	audios[audioKey].play();
	audiosCurrentlyPlaying.push(type);
}
function setAudioVolume (type, volume) {
	let audioKey = audioTypes[type];
	if (!audioKey) return;
	audios[audioKey].volume = volume;
}
function audioSwitch (type, newValue) {
	let audioKey = audioTypes[type];
	if (!audioKey) return;
	let prevVolume = audios[audioKey].volume;
	audioStopReset(type);
	setAudioVolume(type, 1);
	audioTypes[type] = newValue;
	audioPlay(type);
	setAudioVolume(type, prevVolume);
}
function audioStopReset (type) {
	let audioKey = audioTypes[type];
	if (!audioKey) return;
	audios[audioKey].pause();
	audios[audioKey].currentTime = 0;
	audiosCurrentlyPlaying.splice(audiosCurrentlyPlaying.indexOf(type), 1);
}

// section: loading manager
function loaded () {
	var threshold = 3; // waiting for 3 flags: window.onload & 2 onloadCSS
	if (!navigator.onLine) threshold = 1; // just wait for load
	loadFlags++;
	if (loadFlags >= threshold) {
		loadingScreen.className = "exitDown";
		document.body.classList.remove("stillLoading");
	}
}
