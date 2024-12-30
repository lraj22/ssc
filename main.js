// main.js
// the logic of the operation!

function tick () {
	// update time view
	var d = new Date();
	var hours = settings.twentyFourHourTime ? (d.getHours().toString().padStart(2, "0")) : ((d.getHours() % 12) || 12);
	var colon = (settings.blinkingColon ? '<span class="textInvisible">:</span>' : ":");
	if ((d.getSeconds() % 2) === 0) colon = ":";
	var minutes = d.getMinutes().toString().padStart(2, "0");
	timeView.innerHTML = hours + colon + minutes;
	
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
	
	// stopwatch & timer
	if (stopwatchData.running) {
		let timePassed = stopwatchData.total + (performance.now() - stopwatchData.startTime);
		let timePassedStr = msToTimeDiff(Math.floor(timePassed), function (seconds) {
			return parseFloat(seconds.toFixed(2));
		}, 2);
		stopwatchTime.textContent = timePassedStr;
	}
	if (timerData.running) {
		let timeLeft = timerData.total - (performance.now() - timerData.startTime);
		if (timeLeft <= 0) {
			timeLeft = 0;
			timerData.running = false;
			timerData.total = 0;
			timerTime.disabled = false;
			timerBtnPlay.classList.toggle("hidden", true);
			timerBtnPause.classList.toggle("hidden", true);
			timerBtnRestart.classList.toggle("hidden", false);
			if (!timerData.isMuted) audioPlay("timerRing");
		}
		timeLeft = Math.floor(timeLeft);
		let afterDigits = 0;
		if (timeLeft <= 10e3) afterDigits = 1;
		if (timeLeft < 5e3) afterDigits = 2;
		if (timeLeft === 0) afterDigits = 0;
		let timeLeftStr = msToTimeDiff(Math.floor(timeLeft), function (seconds) {
			return afterDigits ? parseFloat(seconds.toFixed(afterDigits)) : Math.ceil(seconds);
		}, afterDigits).replace("s", "");
		timerTime.value = timeLeftStr;
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

// page visibility management
var showModes = ["showMain", "showSchedule", "showSettings"];
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

editSchedulesIcon.addEventListener("click", function () {
	setShow("showSchedule");
	if (!scheduleContainer.childElementCount) addScheduleBlock();
});

function exitScheduleViewAction() {
	var unsavedChangesExist = recalcUnsavedChanges();
	if (unsavedChangesExist) {
		if (confirm("You have unsaved changes - exiting will delete them! Are you sure?")) {
			setCurrentSchedules(lastSavedSchedules);
			recalcUnsavedChanges();
			setShow("showMain");
		}
	} else setShow("showMain");
}
exitScheduleView.addEventListener("click", exitScheduleViewAction);

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

addSchedule.addEventListener("click", function () {
	addScheduleBlock();
});

// load existing schedules
localforage.getItem("savedSchedules").then(function (savedSchedules) {
	if (savedSchedules) {
		setCurrentSchedules(savedSchedules);
		lastSavedSchedules = savedSchedules;
	} else {
		lastSavedSchedules = [];
	}
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
	recalcUnsavedChanges();
});

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
	var schedulesLink = new URL(location.href);
	schedulesLink.searchParams.set("sv1", serialized);
	navigator.clipboard.writeText(schedulesLink.toString()).then(function () {
		alert("The link has been successfully copied! Share it with your classmates!\n" + schedulesLink.toString());
	}).catch(function (error) {
		alert("There was an error. Please copy the link manually:\n" + schedulesLink.toString())
		console.error(error);
	});
});

// settings
localforage.getItem("settings").then(function (settings) {
	if (settings) {
		applySettings(settings);
	}
	updateSettings();
});

settingsIcon.addEventListener("click", function () {
	setShow("showSettings");
});

closeSettingsIcon.addEventListener("click", function () {
	setShow("showMain");
});

closeSchedulesIcon.addEventListener("click", exitScheduleViewAction);

document.querySelectorAll("[data-setting-name]").forEach(function (settingEl) {
	settingEl.addEventListener("input", function () {
		updateSettings();
	});
});

// stopwatch
stopwatchIcon.addEventListener("click", function () {
	stopwatchIcon.classList.toggle("btnActive");
	stopwatch.classList.toggle("hidden");
});

stopwatchBtnPlay.addEventListener("click", function () {
	stopwatchData.startTime = performance.now();
	stopwatchData.running = true;
	stopwatchBtnPlay.classList.toggle("hidden", true);
	stopwatchBtnPause.classList.toggle("hidden", false);
	stopwatchBtnRestart.classList.toggle("hidden", false);
});

stopwatchBtnPause.addEventListener("click", function () {
	stopwatchData.total += performance.now() - stopwatchData.startTime;
	stopwatchData.running = false;
	stopwatchBtnPause.classList.toggle("hidden", true);
	stopwatchBtnPlay.classList.toggle("hidden", false);
});

stopwatchBtnRestart.addEventListener("click", function () {
	stopwatchData.total = 0;
	stopwatchData.running = false;
	stopwatchTime.textContent = "0.00";
	stopwatchBtnPlay.classList.toggle("hidden", false);
	stopwatchBtnPause.classList.toggle("hidden", true);
	stopwatchBtnRestart.classList.toggle("hidden", true);
});

var resizer = new ResizeObserver(function (entries) {
	entries.forEach(function (entry) {
		let displayId = entry.target.id + "Time";
		if (window[displayId]) {
			adjustFontSize(window[displayId]);
		}
	});
});
resizer.observe(stopwatch);
resizer.observe(timer);
adjustFontSize(stopwatchTime);
adjustFontSize(timerTime);

makeDraggable(stopwatch, stopwatchDrag);
makeDraggable(timer, timerDrag);

// timer
timerIcon.addEventListener("click", function () {
	timerIcon.classList.toggle("btnActive");
	timer.classList.toggle("hidden");
});

timerBtnPlay.addEventListener("click", function () {
	timerData.startTime = performance.now();
	timerData.running = true;
	timerTime.disabled = true;
	timerBtnPlay.classList.toggle("hidden", true);
	timerBtnPause.classList.toggle("hidden", false);
	timerBtnRestart.classList.toggle("hidden", false);
});

timerBtnPause.addEventListener("click", function () {
	timerData.total -= performance.now() - timerData.startTime;
	timerData.running = false;
	timerTime.disabled = false;
	timerBtnPause.classList.toggle("hidden", true);
	timerBtnPlay.classList.toggle("hidden", false);
});

timerBtnRestart.addEventListener("click", function () {
	timerData.total = timerData.from;
	timerData.running = false;
	timerTime.value = msToTimeDiff(timerData.from).replace("s", "");
	timerTime.disabled = false;
	audioStopReset("timerRing");
	timerBtnPlay.classList.toggle("hidden", false);
	timerBtnPause.classList.toggle("hidden", true);
	timerBtnRestart.classList.toggle("hidden", true);
});

timerTime.addEventListener("input", function () {
	if (timerData.running) return;
	if (timerData.total === 0) {
		timerBtnPlay.classList.toggle("hidden", false);
		timerBtnPause.classList.toggle("hidden", true);
		timerBtnRestart.classList.toggle("hidden", true);
		audioStopReset("timerRing");
	}
	timerData.from = timerData.total = timeDiffToMs(timerTime.value);
});

timerMute.addEventListener("click", function () {
	var isMuted = !timerData.isMuted;
	timerData.isMuted = isMuted;
	timerMute.textContent = isMuted ? "volume_off" : "volume_up";
	timerMute.title = isMuted ? "Click to unmute the timer" : "Click to mute the timer";
	if (isMuted) audioStopReset("timerRing");
});

// general
requestAnimationFrame(tick);

window.addEventListener("load", function () {
	loaded();
});

if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("./sw.js");
}
