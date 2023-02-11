Module.register("MMM-Growatt", {

    defaults: {
        title: "MMM-Growatt",
        updateInterval: 1000*60*60
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

        this.getGrowattData().then()
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

    socketNotificationReceived: function(notification, payload) {
        var self = this
        if (notification === "GROWATT_DATA") {
            this.growattData = payload
            this.updateDom()
        }
    }
})