Module.register("MMM-Growatt", {

    defaults: {
        title: "MMM-Growatt",
        updateInterval: 1000*60*60,
        username: "username",
        password: "password",
        dataLoggerId: "loggerId"
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

        // this.growattData = null;

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
        this.updateWrapper(this.growattData);
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

    socketNotificationReceived: function(notification, payload) {
        var self = this
        if (notification === "GROWATT_DATA") {
            this.growattData = payload
            this.updateWrapper(this.growattData);
        }
    },

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.id = "growatt-wrapper";
        wrapper.style.setProperty("--width", "600px");
        wrapper.style.setProperty("--height", "500px");
        wrapper.style.setProperty("--line-width", "7px");

        return wrapper;
    },

    updateWrapper: function(growattData){
        let wrapper = document.getElementById("growatt-wrapper");
        while (wrapper.hasChildNodes()) {
            wrapper.removeChild(wrapper.firstChild);
        }

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
        var ppvData = parseInt(this.growattData[0].ppv1) + parseInt(this.growattData[0].ppv2);
        solarLabel.innerHTML =  `Solar: ${ppvData}W`;
        // solarLabel.innerHTML += this.translate("SOLAR_PRODUCING");
        solarLine.appendChild(solarLabel);

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
        homeLabel.innerHTML = `${this.growattData[0].consumptionPower}W/${this.growattData[0].rateVA}VA`;
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
        gridLabel.innerHTML = `${this.growattData[0].gridPower}W`; 
        gridLine.appendChild(gridLabel);

        // Positive value means feeding to grid
        if(this.growattData[0].gridPower > 0) {
            // gridLabel.innerHTML += this.translate("GRID_BACKFEEDING");
            gridLine.classList.add("active-red")
            gridLabel.classList.add("font-red");

            const gridArrowOut = document.createElement("div");
            gridArrowOut.classList.add("arrow", "right", "active");
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
        batteryLabel.innerHTML = `${this.growattData[0].discharging}W <br> SoC: ${this.growattData[0].stateOfCharge}%`;
        batteryLine.appendChild(batteryLabel);

        if(this.growattData[0].discharging > 0)
            batteryLine.classList.add("active-amber");

        // Negative value means charging battery
        if(this.growattData[0].discharging < 0) {
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
        } else if(`${this.growattData[0].stateOfCharge}` < 35 & `${this.growattData[0].discharging}` > 0) {
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