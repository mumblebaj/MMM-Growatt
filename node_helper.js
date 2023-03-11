var NodeHelper = require('node_helper')
var api = require('growatt')

const options = {plantData:true,weather:false,totalData:false,statusData:true,deviceData:true,
    deviceType:false,historyLast:true,historyAll:false}

module.exports = NodeHelper.create({
    requiresVersion: '2.21.0',

    start: function() {
        console.log('Starting node helper for ' + this.name)
    },

    deconstructPlantData: function(d, payload) {
        plantDataFiltered = [];

        const plantId = payload.plantId;
        const loggerId = payload.deviceSerial;

        plantDataFiltered.push({
            "plantName": d[plantId].plantName,
            "country": d[plantId].plantData.country,
            "city": d[plantId].plantData.city,
            "accountName": d[plantId].plantData.accountName,
            "inverterPower": d[plantId].plantData.nominalPower,
            "treesSaved": d[plantId].plantData.tree,
            "coalSaved": d[plantId].plantData.coal,
            "ppv1": d[plantId].devices[loggerId].statusData.ppv1,
            "ppv2": d[plantId].devices[loggerId].statusData.ppv2,
            "gridPower": d[plantId].devices[loggerId].statusData.gridPower,
            "discharging": d[plantId].devices[loggerId].historyLast.pBat,
            "stateOfCharge": d[plantId].devices[loggerId].historyLast.capacity,
            "consumptionPower": d[plantId].devices[loggerId].historyLast.outPutPower,
            "rateVA": d[plantId].devices[loggerId].historyLast.rateVA,
            "staticTakenAt": d[ plantId].devices[loggerId].deviceData.lastUpdateTime
        })
        return plantDataFiltered;
    },

    getGrowattData: async function(payload) {
        const growatt = new api({})
        let login = await growatt.login(payload.username, payload.password).catch(e => {console.log(e)})
        console.log('login: ',  login)
        
        let getAllPlantData = await growatt.getAllPlantData(options).catch(e => {console.log(e)})

        let logout = await growatt.logout().catch(e => {console.log(e)})
        console.log('logout:',logout)

        var plantData = getAllPlantData;

        var parserResponse = this.deconstructPlantData(plantData, payload)

        var growattDataParsed = plantDataFiltered;

        this.sendSocketNotification('GROWATT_DATA', growattDataParsed)
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === 'GET_GROWATT_DATA') {
            this.getGrowattData(payload)
        }
    }
})