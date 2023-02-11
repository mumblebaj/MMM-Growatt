var NodeHelper = require('node_helper')
var api = require('growatt')

const options = {plantData:true,deviceData:false,weather:false,totalData:false,statusData:true,
    deviceType:false,historyLast:true,historyAll:false}

module.exports = NodeHelper.create({
    requiresVersion: '2.21.0',

    start: function() {
        console.log('Starting node helper for ' + this.name)
    },

    deconstructPlantData: function(d, payload) {
        plantDataFiltered = [];

        const plantId = payload.plantId;

        plantDataFiltered.push({
            "plantName": d[plantId].plantName,
            "country": d[plantId].plantData.country,
            "city": d[plantId].plantData.city,
            "accountName": d[plantId].plantData.accountName,
            "inverterPower": d[plantId].plantData.nominalPower,
            "treesSaved": d[plantId].plantData.tree,
            "coalSaved": d[plantId].plantData.coal,
            "ppv1": d[plantId].devices.RKG8CGL0JP.statusData.ppv1,
            "ppv2": d[plantId].devices.RKG8CGL0JP.statusData.ppv2,
            "gridPower": d[plantId].devices.RKG8CGL0JP.statusData.gridPower,
            "discharging": d[plantId].devices.RKG8CGL0JP.historyLast.pBat,
            "stateOfCharge": d[plantId].devices.RKG8CGL0JP.historyLast.capacity,
            "consumptionPower": d[plantId].devices.RKG8CGL0JP.historyLast.outPutPower,
            "rateVA": d[plantId].devices.RKG8CGL0JP.historyLast.rateVA
        })
        return plantDataFiltered;
    },

    getGrowattData: async function(payload) {
        const growatt = new api({})
        let login = await growatt.login(payload.username, payload.password).catch(e => {console.log(e)})
        console.log('login: ',  login)
        
        let getAllPlantData = await growatt.getAllPlantData(options).catch(e => {console.log(e)})

        var plantData = getAllPlantData;

        var parserResponse = deconstructPlantData(plantData, payload)

        var growattDataParsed = plantDataFiltered;

        console.log(growattDataParsed);

        this.sendSocketNotification('GROWATT_DATA', growattDataParsed)
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === 'GET_GROWATT_DATA') {
            this.getGrowattData(payload)
        }
    }
})