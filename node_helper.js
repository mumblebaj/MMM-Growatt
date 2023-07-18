var NodeHelper = require('node_helper')
var api = require('growatt')

const options = {
    plantData: true, weather: false, totalData: false, statusData: true, deviceData: true,
    deviceType: false, historyLast: true, historyAll: false
}

module.exports = NodeHelper.create({
    requiresVersion: '2.22.0',

    start: function () {
        console.log('Starting node helper for ' + this.name)
    },

    deconstructPlantData: function (keys, deviceSerial, d, payload) {
        plantDataFiltered = [];

        const plantId = keys;
        const loggerId = deviceSerial;
        let ppv1 = d[plantId].devices[loggerId].statusData.ppv1 ? d[plantId].devices[loggerId].statusData.ppv1 : 0;
        let ppv2 = d[plantId].devices[loggerId].statusData.ppv2 ? d[plantId].devices[loggerId].statusData.ppv2 : 0;


        plantDataFiltered.push({
            "plantName": d[plantId].plantName,
            "country": d[plantId].plantData.country,
            "city": d[plantId].plantData.city,
            "accountName": d[plantId].plantData.accountName,
            "inverterPower": d[plantId].plantData.nominalPower,
            "treesSaved": d[plantId].plantData.tree,
            "coalSaved": d[plantId].plantData.coal,
            "ppv1": ppv1,
            "ppv2": ppv2,
            "gridPower": d[plantId].devices[loggerId].statusData.gridPower,
            "discharging": d[plantId].devices[loggerId].statusData.batPower,
            "stateOfCharge": d[plantId].devices[loggerId].statusData.capacity,
            "consumptionPower": d[plantId].devices[loggerId].statusData.loadPower,
            "rateVA": d[plantId].devices[loggerId].statusData.rateVA,
            "loadPercentage": d[plantId].devices[loggerId].statusData.loadPrecent,
            "staticTakenAt": d[plantId].devices[loggerId].deviceData.lastUpdateTime
        })
        return plantDataFiltered;
    },

    getGrowattData: async function (payload) {
        let keys = "";
        let deviceSerial = "";
        const growatt = new api({})
        let login = await growatt.login(payload.username, payload.password).catch(e => { console.log(e) })
        console.log('login: ', login)

        let getAllPlantData = await growatt.getAllPlantData(options).catch(e => { console.log(e) })

        let logout = await growatt.logout().catch(e => { console.log(e) })
        console.log('logout:', logout)
        
        // Get the Plant ID here
        keys = Object.keys(getAllPlantData);

        // Get the device serial Number
        keys.forEach(key => {
                let { devices, ...rest } = getAllPlantData[key];
                deviceSerial = Object.keys(devices);
        })

        var plantData = getAllPlantData;

        var parserResponse = this.deconstructPlantData(keys, deviceSerial, plantData, payload)

        var growattDataParsed = plantDataFiltered;

        this.sendSocketNotification('GROWATT_DATA', growattDataParsed)
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === 'GET_GROWATT_DATA') {
            this.getGrowattData(payload)
        }
    }
})