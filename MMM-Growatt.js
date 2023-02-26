Module.register("MMM-Growatt", {

    defaults: {
        title: "MMM-Growatt",
        updateInterval: 1000*60*60,
        iconCssClasses: {
            solor: "icons/grwt_solor.png",
            grid: "icons/grwt_grid.png",
            battery: "icons/grwt_bat.png",
            load: "icons/grwt_load.png",
            inverter: "icons/grwt_inverter.png"
        }
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

        this.getGrowattData();
        this.scheduleUpdate();
    },

    stop: function() {
        Log.info('Stopping module ' + this.name);
    },

    resume: function() {
        Log.info('Resuming module ' + this.name);
        Log.debug('with config: ' + JSON.stringify(this.config));
        this.suspend = false;
        this.updateDom();
    },

    suspend: function() {
        Log.info('Suspending module ' + this.name);
        this.suspend = true;
    },

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

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.id = "energymonitor-wrapper";
        wrapper.style.setProperty("--width", "600px");
        wrapper.style.setProperty("--height", "500px");
        wrapper.style.setProperty("--line-width", "7px");

        this.addIcons(wrapper);

        const solarLine = this.generateSolarLine();
        wrapper.appendChild(solarLine);

        const homeLine = this.generateHomeLine();
        wrapper.appendChild(homeLine);

        const gridLine = this.generateGridLine();
        wrapper.appendChild(gridLine);

        const batteryLine = this.generateBatteryLine();
        wrapper.appendChild(batteryLine);

        return wrapper;
    },

    addIcons: function(wrapper) {
        // Solar Icon
        const solarPanel = document.createElement("div");
        solarPanel.className = "icon vertical top";

        const solarPanelIcon = document.createElement("i");
        solarPanelIcon.className = this.config.iconCssClasses.solor;
        solarPanel.appendChild(solarPanelIcon);
        wrapper.appendChild(solarPanel);

        // home icon
        const home = document.createElement("div");
        home.className = "icon horizontal right";

        const homeIcon = document.createElement("i");
        homeIcon.className = this.config.iconCssClasses.load;
        home.appendChild(homeIcon);
        wrapper.appendChild(home);

        // grid icon
        const grid = document.createElement("div");
        grid.className = "icon horizontal left";

        const gridIcon = document.createElement("i");
        gridIcon.className = this.config.iconCssClasses.grid;
        grid.appendChild(gridIcon);
        wrapper.appendChild(grid);

        // battery icon
        const battery = document.createElement("div");
        battery.className = "icon vertical bottom";

        const batteryIcon = document.createElement("i");
        batteryIcon.className = this.config.iconCssClasses.battery;
        battery.appendChild(batteryIcon);
        wrapper.appendChild(battery);

        // inverter icon
        const inverter = document.createElement("div");
        inverter.className = "icon horizontal center";

        const inverterIcon = document.createElement("i");
        inverterIcon.className = this.config.iconCssClasses.inverter;
        inverter.appendChild(inverterIcon);
        wrapper.appendChild(inverter);

    },

    generateSolarLine: function() {
        const solarLine = document.createElement("div");
        solarLine.classList.add("line", "vertical", "top");
        
        const solarLabel = document.createElement("div");
        solarLabel.id = "solar-label";
        solarLabel.classList.add("label");
        solarLabel.innerHTML = `Solar Line Data`; //${this.getWattString(this.currentData.solar)} <br>
        solarLabel.innerHTML += this.translate("SOLAR_PRODUCING");
        solarLine.appendChild(solarLabel);

        if(this.payload.ppv1 > 0) {
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
        this.calculateHomeConsumption();
        const homeLine = document.createElement("div");
        homeLine.classList.add("line", "vertical", "up");
        
        const homeLabel = document.createElement("div");
        homeLabel.id = "home-label";
        homeLabel.classList.add("label");
        homeLabel.innerHTML = `Home Line Data`; //${this.getWattString(this.currentData.home)}<br>
        homeLabel.innerHTML += this.translate("HOME_CONSUMPTION");
        homeLine.appendChild(homeLabel);

        if(this.payload.consumptionPower > 0) {
            homeLine.classList.add("active");

            const homeArrowIn = document.createElement("div");
            homeArrowIn.classList.add("arrow", "up", "active");
            homeLine.appendChild(homeArrowIn);
        } else {
            homeLine.classList.add("dimmed");
        }

        return homeLine;
    },

    generateGridLine: function() {
        const gridLine = document.createElement("div");
        gridLine.classList.add("line", "horizontal", "right");
                
        if(this.payload.gridPower !== 0)
            gridLine.classList.add("active");

        const gridLabel = document.createElement("div");
        gridLabel.id = "grid-label";
        gridLabel.classList.add("label");
        gridLabel.innerHTML = `Grid Line Data`; //${this.getWattString(Math.abs(this.currentData.grid))}<br>
        gridLine.appendChild(gridLabel);

        // Positive value means feeding to grid
        if(this.payload.gridPower > 0) {
            gridLabel.innerHTML += this.translate("GRID_BACKFEEDING");
            gridLabel.classList.add("font-green");

            const gridArrowOut = document.createElement("div");
            gridArrowOut.classList.add("arrow", "right", "active");
            gridLine.appendChild(gridArrowOut);
        } else if(this.payload.gridPower < 0) {
            gridLabel.innerHTML += this.translate("GRID_CONSUMPTION");
            gridLabel.classList.add("font-red");

            const gridArrowIn = document.createElement("div");
            gridArrowIn.classList.add("arrow", "left", "active");
            gridLine.appendChild(gridArrowIn);
        } else {
            gridLabel.innerHTML += this.translate("GRID_IDLE");
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
        batteryLabel.innerHTML = `Battery Line Data`; //${this.getWattString(Math.abs(this.currentData.battery))}<br>
        batteryLine.appendChild(batteryLabel);

        if(this.payload.stateOfCharge !== 0)
            batteryLine.classList.add("active");

        // Positive value means charging battery
        if(this.payload.stateOfCharge > 0) {
            batteryLabel.innerHTML += this.translate("BATTERY_CHARGING");
            batteryLabel.classList.add("font-green");

            const batteryArrowIn = document.createElement("i");
            batteryArrowIn.classList.add("fas", "fa-caret-down", "arrow", "down", "active");
            batteryLine.appendChild(batteryArrowIn);
        } else if(this.paylod.stateOfCharge < 0) {
            batteryLabel.innerHTML += this.translate("BATTERY_DISCHARGING");
            batteryLabel.classList.add("font-red");

            const batteryArrowOut = document.createElement("i");
            batteryArrowOut.classList.add("fas", "fa-caret-up", "arrow", "up", "active");
            batteryLine.appendChild(batteryArrowOut);
        } else {
            batteryLabel.innerHTML += this.translate("BATTERY_IDLE");
            batteryLine.classList.add("dimmed");
        }

        return batteryLine;
    },

    socketNotificationReceived: function(notification, payload) {
        var self = this
        if (notification === "GROWATT_DATA") {
            this.growattData = payload
            this.updateDom()
        }
    }
})