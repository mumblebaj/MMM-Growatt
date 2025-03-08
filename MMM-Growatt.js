Module.register("MMM-Growatt", {

    defaults: {
        title: "MMM-Growatt",
        updateInterval: 1000*60*15,
        username: "username",
        password: "password",
        mode: "dual"
    },

    getStyles: function() {
        return ["MMM-Growatt.css"]
    },

    getTranslations: function() {

    },

    getTemplate() {

    },

    start: function() {
        Log.info(`Starting module: ${this.name}`);

        // suspended = false;

        this.getGrowattData();
        this.scheduleUpdate();
    },

    stop: function() {
        Log.info('Stopping module ' + this.name);
    },

    // resume: function() {
    //     Log.info('Resuming module ' + this.name);
    //     Log.debug('with config: ' + JSON.stringify(this.config));
    //     this.suspended = false;
    //     this.updateWrapper(this.growattData);
    // },

    // suspend: function() {
    //     Log.info('Suspending module ' + this.name);
    //     this.suspended = true;
    // },

    getGrowattData: function() {
        this.sendSocketNotification("GET_GROWATT_DATA", this.config)

    },

    scheduleUpdate: function(delay) {
        var nextUpdate = this.config.updateInterval
        if (typeof delay != "undefined" && delay >= 0) {
            nextUpdate = delay
        }

        var self = this
        setInterval(function() {
            self.getGrowattData()
        }, nextUpdate)
    },

    socketNotificationReceived: function(notification, payload) {
        var self = this
        if (notification === "GROWATT_DATA") {
            this.growattData = payload
            if (this.config.mode === "dual") {
                this.sendNotification("GROWATT_STATS_DATA", this.growattData)
				if (this.config.view === "table") {
					this.createTable(this.growattData)
				} else {
                this.updateWrapper(this.growattData)
				}
            } else if (this.config.mode === "single"){
				if (this.config.view === "table") {
					this.createTable(this.growattData)
				} else {
                this.updateWrapper(this.growattData);
				}
            }
            
        }
    },

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.id = "growatt-wrapper";

        return wrapper;
    },

    createTable: function() {
		let wrapper = document.getElementById("growatt-wrapper");
		
		while (wrapper.hasChildNodes()) {
            wrapper.removeChild(wrapper.firstChild);
        }
		
		wrapper.id = "growatt-table-wrapper";
		// Create table
        const table = document.createElement("table");
        table.id = "growatt-table";
        table.className = "growatt-table";

        // Define table structure (empty initially)
        const tableContent = `
            <tr>
                <td rowspan="2"><img id="module-icon" src="/modules/MMM-Growatt/images/state_spf5000.png" width="50"></td>
                <td id="module-name" colspan="3">${this.growattData[0].plantName}</td>
            </tr>
            <tr>
                <td id="trees-saved">Deforestation: -- trees saved</td>
                <td id="coal-saved">Coal Saved: -- KG</td>
                <td id="co2-reduced">CO₂ Reduced: -- KG</td>
            </tr>
            <tr>
                <td><img src="/modules/MMM-Growatt/images/state_grid.png" width="40"></td>
                <td colspan="2">Grid Power</td>
                <td id="grid-power">-- W</td>
            </tr>
            <tr>
                <td><img src="/modules/MMM-Growatt/images/state_solor.png" width="40"></td>
                <td colspan="2">Solar Power</td>
                <td id="solar-power">-- W</td>
            </tr>
            <tr>
                <td><img src="/modules/MMM-Growatt/images/state_bat_null.png" width="40"></td>
                <td colspan="2">Battery Power</td>
                <td id="battery-power">-- W</td>
            </tr>
            <tr>
                <td><img src="/modules/MMM-Growatt/images/state_loadS.png" width="40"></td>
                <td colspan="2">Load Power</td>
                <td id="load-power">-- W</td>
            </tr>
            <tr>
                <td colspan="4" id="footer">Static taken at: ${this.growattData[0].staticTakenAt}</td>
            </tr>
        `;

        table.innerHTML = tableContent;
        wrapper.appendChild(table);
		this.updateTable();
		return wrapper;
	},

    updateTable: function () {
        if (!this.growattData) return;
        
        let wrapper = document.getElementById("growatt-wrapper");

        let treesSavedElement = document.getElementById("trees-saved");
        let coalSavedElement = document.getElementById("coal-saved");
        let co2ReducedElement = document.getElementById("co2-reduced");
        let gridPowerElement = document.getElementById("grid-power");
        let solarPowerElement = document.getElementById("solar-power");
        let batteryPowerElement = document.getElementById("battery-power");
        let loadPowerElement = document.getElementById("load-power");

        if (treesSavedElement) {
            treesSavedElement.innerHTML = `Deforestation: ${this.growattData[0].treesSaved} trees saved`;
        }
        if (coalSavedElement) {
            coalSavedElement.innerHTML = `Coal Saved: ${this.growattData[0].coalSaved} KG`;
        }
        if (co2ReducedElement) {
            co2ReducedElement.innerHTML = `CO₂ Reduced: ${this.growattData[0].coalSaved} KG`;
        }
        if (gridPowerElement) {
            gridPowerElement.innerHTML = `${this.growattData[0].gridPower || "--"} W`;
        }
        let solarValue = parseInt(this.growattData[0].ppv1) + parseInt(this.growattData[0].ppv2)
        if (solarPowerElement) {
            solarPowerElement.innerHTML = `${solarValue || "0"} W`;
        }
        let chargeDischarge = "";
        let chargeDischargeValue = 0;
        if (this.growattData[0].charging > 0) {
            chargeDischarge = 'Charging'
            chargeDischargeValue = this.growattData[0].charging
        } else if (this.growattData[0].discharging > 0) {
            chargeDischarge = 'Discharging'
            chargeDischargeValue = this.growattData[0].discharging
        }
        if (batteryPowerElement) {
            batteryPowerElement.innerHTML = `SoC: ${this.growattData[0].stateOfCharge || "0"} % 
            ${chargeDischarge}: ${chargeDischargeValue} W`;
        }
        if (loadPowerElement) {
            loadPowerElement.innerHTML = `${this.growattData[0].consumptionPower || "0"} W / 
            ${this.growattData[0].rateVA || "--"}VA`;
        }
        return wrapper;
    },

    updateWrapper: function(growattData){
        let wrapper = document.getElementById("growatt-wrapper");
        while (wrapper.hasChildNodes()) {
            wrapper.removeChild(wrapper.firstChild);
        }

        wrapper.style.setProperty("--width", "600px");
		wrapper.style.setProperty("--height", "500px");
		wrapper.style.setProperty("--line-width", "7px");

        this.addIcons(wrapper);

        const solarLine = this.generateSolarLine();
        wrapper.appendChild(solarLine);

        const gridLine = this.generateGridLine();
        wrapper.appendChild(gridLine);

        const homeLine = this.generateHomeLine();
        wrapper.appendChild(homeLine);

        const batteryLine = this.generateBatteryLine();
        wrapper.appendChild(batteryLine);

        return wrapper;
    },

    addIcons: function(wrapper) {
        // Solar Icon
        const solarPanel = document.createElement("div");
        solarPanel.className = "images vertical top";

        const solarPanelIcon = document.createElement("i");
        solarPanelIcon.className = "images state_solor";
        solarPanel.appendChild(solarPanelIcon);
        wrapper.appendChild(solarPanel);

        // home icon
        const home = document.createElement("div");
        home.className = "images horizontal right";

        const homeIcon = document.createElement("i");
        homeIcon.className = "images state_load";
        home.appendChild(homeIcon);
        wrapper.appendChild(home);

        // grid icon
        const grid = document.createElement("div");
        grid.className = "images horizontal left";

        const gridIcon = document.createElement("i");
        gridIcon.className = "images state_grid";
        grid.appendChild(gridIcon);
        wrapper.appendChild(grid);

        // battery icon
        const battery = document.createElement("div");
        battery.className = "images vertical bottom";

        const batteryIcon = document.createElement("i");
        batteryIcon.className = "images state_bat_null";
        battery.appendChild(batteryIcon);
        wrapper.appendChild(battery);

        // inverter icon
        const inverter = document.createElement("div");
        inverter.className = "images inv";

        const inverterIcon = document.createElement("i");
        inverterIcon.className = "images state_spf5000";
        inverter.appendChild(inverterIcon);
        wrapper.appendChild(inverter);

    },

    generateSolarLine: function() {
        const solarLine = document.createElement("div");
        solarLine.classList.add("line", "vertical", "top");
        
        const solarLabel = document.createElement("div");
        solarLabel.id = "solar-label";
        solarLabel.classList.add("label");
        var ppvData = this.growattData[0].ppv ? this.growattData[0].ppv : parseInt(this.growattData[0].ppv1) + parseInt(this.growattData[0].ppv2);
        solarLabel.innerHTML =  `Solar: ${ppvData}W`;
        // solarLabel.innerHTML += this.translate("SOLAR_PRODUCING");
        solarLine.appendChild(solarLabel);

        const infoLabel = document.createElement("div");
        infoLabel.id = "info-label";
        infoLabel.classList.add("label");
        infoLabel.innerHTML = `Deforestation: ${this.growattData[0].treesSaved} trees saved <br> Standard Coal Saved: ${this.growattData[0].coalSaved}KG <br> Standard
        Co₂ Reduced: ${this.growattData[0].coalSaved}KG`;
        solarLine.appendChild(infoLabel);

        if(ppvData > 0) {
            solarLine.classList.add("active");

            const solarArrowOut = document.createElement("i");
            solarArrowOut.classList.add("arrow", "down", "active");
            solarLine.appendChild(solarArrowOut);
        } else {
            solarLine.classList.add("dimmed");
        }

        return solarLine;
    },

    generateHomeLine: function() {
        const homeLine = document.createElement("div");
        homeLine.classList.add("line", "horizontal", "right");
        
        const homeLabel = document.createElement("div");
        homeLabel.id = "home-label";
        homeLabel.classList.add("label");
		let rateVA = this.growattData[0].rateVA ? this.growattData[0].rateVA : 0;
        homeLabel.innerHTML = `${this.growattData[0].consumptionPower}W/${rateVA}VA`;
        // homeLabel.innerHTML += this.translate("HOME_CONSUMPTION");
        homeLine.appendChild(homeLabel);

        if(this.growattData[0].consumptionPower > 0) {
            homeLine.classList.add("active");

            const homeArrowIn = document.createElement("div");
            homeArrowIn.classList.add("arrow", "right", "active");
            homeLine.appendChild(homeArrowIn);
        } else {
            homeLine.classList.add("dimmed");
        }

        return homeLine;
    },

    generateGridLine: function() {
        const gridLine = document.createElement("div");
        gridLine.classList.add("line", "horizontal", "left");
                
        if(this.growattData[0].gridPower > 0)
            gridLine.classList.add("gridactive");

        const gridLabel = document.createElement("div");
        gridLabel.id = "grid-label";
        gridLabel.classList.add("label");
		if (this.growattData[0].gridPower) {
        gridLabel.innerHTML = `${this.growattData[0].gridPower}W`; 
		} else if (this.growattData[0].importFromGrid > 0) {
			gridLabel.innerHTML = `${this.growattData[0].importFromGrid}W`;
		} else if (this.growattData[0].exportToGrid > 0) {
			gridLabel.innerHTML = `${this.growattData[0].exportToGrid}W`;
		}
        gridLine.appendChild(gridLabel);

        // Positive value means feeding to grid
        if(this.growattData[0].gridPower > 0) {
            // gridLabel.innerHTML += this.translate("GRID_BACKFEEDING");
            gridLine.classList.add("active-red")
            gridLabel.classList.add("font-red");

            const gridArrowOut = document.createElement("div");
            gridArrowOut.classList.add("arrow", "right", "active");
            gridLine.appendChild(gridArrowOut);
        } else if (this.growattData[0].importFromGrid > 0) {
			gridLine.classList.add("active-red")
            gridLabel.classList.add("font-red");

            const gridArrowOut = document.createElement("div");
            gridArrowOut.classList.add("arrow", "right", "active");
            gridLine.appendChild(gridArrowOut);
		} else if (this.growattData[0].exportToGrid > 0) {
			gridLine.classList.add("active")
            //gridLabel.classList.add("font-red");

            const gridArrowOut = document.createElement("div");
            gridArrowOut.classList.add("arrow", "left", "active");
            gridLine.appendChild(gridArrowOut);
		} else {
            // gridLabel.innerHTML += this.translate("GRID_IDLE");
            gridLine.classList.add("dimmed");
        }

        return gridLine;
    },

    generateBatteryLine: function() {
        const batteryLine = document.createElement("div");
        batteryLine.classList.add("line", "vertical", "down");

        const batteryLabel = document.createElement("div");
        batteryLabel.id = "battery-label";
        batteryLabel.classList.add("label");
		if (this.growattData[0].discharging > 0) {
        batteryLabel.innerHTML = `${this.growattData[0].discharging}W <br> SoC: ${this.growattData[0].stateOfCharge}%`;
		} else if (this.growattData[0].charging > 0 || this.growattData[0].charging <= 0) {
			batteryLabel.innerHTML = `${this.growattData[0].charging}W <br> SoC: ${this.growattData[0].stateOfCharge}%`;
		}
        batteryLine.appendChild(batteryLabel);

        const dateTimeLabel = document.createElement("div");
        dateTimeLabel.id = "static-label";
        dateTimeLabel.classList.add("label");
        dateTimeLabel.innerHTML = `Last Update: <br> ${this.growattData[0].staticTakenAt}`;
        batteryLine.appendChild(dateTimeLabel);

        if(this.growattData[0].discharging > 0)
            batteryLine.classList.add("active-amber");

        // Negative value means charging battery
        if(this.growattData[0].charging < 0 || this.growattData[0].charging > 0) {
            // batteryLabel.innerHTML += this.translate("BATTERY_CHARGING");
            batteryLine.classList.add("active");
            batteryLabel.classList.add("font-green");

            const batteryArrowIn = document.createElement("i");
            batteryArrowIn.classList.add("fas", "fa-caret-down", "arrow", "down", "active");
            batteryLine.appendChild(batteryArrowIn);
        } else if(`${this.growattData[0].stateOfCharge}` > 35 & `${this.growattData[0].discharging}` > 0) {
            // batteryLabel.innerHTML += this.translate("BATTERY_DISCHARGING");
            batteryLabel.classList.add("font-amber");

            const batteryArrowOut = document.createElement("i");
            batteryArrowOut.classList.add("fas", "fa-caret-up", "arrow", "up", "active-amber");
            batteryLine.appendChild(batteryArrowOut);
        } else if(`${this.growattData[0].stateOfCharge}` <= 35 & `${this.growattData[0].discharging}` > 0) {
            // batteryLabel.innerHTML += this.translate("BATTERY_DISCHARGING");
            batteryLine.classList.add("active-red");
            batteryLabel.classList.add("font-red");

            const batteryArrowOut = document.createElement("i");
            batteryArrowOut.classList.add("fas", "fa-caret-up", "arrow", "up", "active-red");
            batteryLine.appendChild(batteryArrowOut);
        }
            else {
            // batteryLabel.innerHTML += this.translate("BATTERY_IDLE");
            batteryLabel.classList.add("font-green");
            batteryLine.classList.add("dimmed");
        }

        return batteryLine;
    }
})