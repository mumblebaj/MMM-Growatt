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

    deconstructPlantData: function (d, payload) {
        plantDataFiltered = [];
        let keys = "";
        let deviceSerial = "";
        let data = [];

        // const plantId = keys;
        // const loggerId = deviceSerial;

        keys = Object.keys(d);

        keys.forEach(key => {
            let { devices, ...rest } = d[key];
            deviceSerial = Object.keys(devices);
            // console.log("Key: ", deviceSerial);
            let devicesData = [];
            deviceSerial.forEach(sn => {
              // console.log("SN: ", sn)
              // console.log("Growatt Type: ", devices[sn].growattType)
        
              if( devices[sn].growattType === "storage") {
                devicesData.push({
                  sn: sn,
                  data: devices[sn],
                });
                  data.push({
                    plantid: key,
                    data: { ...rest, devicesData }
                  })

                  plantDataFiltered.push({
                    "plantName": data[0].data.plantName,
                    "country": data[0].data.plantData.country,
                    "city": data[0].data.plantData.city,
                    "accountName": data[0].data.plantData.accountName,
                    "inverterPower": data[0].data.plantData.nominalPower,
                    "treesSaved": data[0].data.plantData.tree,
                    "coalSaved": data[0].data.plantData.coal,
                    "ppv1": data[0].data.devicesData[0].data.statusData.ppv1,
                    "ppv2": data[0].data.devicesData[0].data.statusData.ppv2,
                    "gridPower": data[0].data.devicesData[0].data.statusData.gridPower,
                    "discharging": data[0].data.devicesData[0].data.statusData.batPower,
                    "stateOfCharge": data[0].data.devicesData[0].data.statusData.capacity,
                    "consumptionPower": data[0].data.devicesData[0].data.statusData.loadPower,
                    "rateVA": data[0].data.devicesData[0].data.statusData.rateVA,
                    "loadPercentage": data[0].data.devicesData[0].data.statusData.loadPrecent,
                    "staticTakenAt": data[0].data.devicesData[0].data.deviceData.lastUpdateTime
                  })
              }
        
              else if( devices[sn].growattType === "tlxh") {
                devicesData.push({
                  sn: sn,
                  data: devices[sn],
                });
                  data.push({
                    plantid: key,
                    data: { ...rest, devicesData }
                  })
                  plantDataFiltered.push({
                    "plantName": data[0].data.plantName,
                    "country": data[0].data.plantData.country,
                    "city": data[0].data.plantData.city,
                    "accountName": data[0].data.plantData.accountName,
                    "inverterPower": data[0].data.plantData.nominalPower,
                    "treesSaved": data[0].data.plantData.tree,
                    "coalSaved": data[0].data.plantData.coal,
                    "ppv": data[0].data.devicesData[0].data.statusData.ppv,
                    "ppv1": data[0].data.devicesData[0].data.statusData.pPv1,
                    "ppv2": data[0].data.devicesData[0].data.statusData.pPv2,
                    "ppv3": data[0].data.devicesData[0].data.statusData.pPv3,
                    "ppv4": data[0].data.devicesData[0].data.statusData.pPv4,
                    "importFromGrid": data[0].data.devicesData[0].data.statusData.pactouser,
                    "exportToGrid": data[0].data.devicesData[0].data.statusData.pactogrid,
                    "discharging": data[0].data.devicesData[0].data.statusData.pdisCharge,
                    "charging": data[0].data.devicesData[0].data.statusData.chargePower,
                    "stateOfCharge": data[0].data.devicesData[0].data.statusData.SOC,
                    "consumptionPower": data[0].data.devicesData[0].data.statusData.pLocalLoad,
                    "staticTakenAt": data[0].data.devicesData[0].data.deviceData.lastUpdateTime
                  })
              }
        
              else if( devices[sn].growattType === "tlx") {
                devicesData.push({
                  sn: sn,
                  data: devices[sn],
                });
          
                  data.push({
                    plantid: key,
                    data: { ...rest, devicesData }
                  })
              }
        
              else if( devices[sn].growattType === "mix") {
                devicesData.push({
                  sn: sn,
                  data: devices[sn],
                });
          
                  data.push({
                    plantid: key,
                    data: { ...rest, devicesData }
                  })
              }
        
              else if( devices[sn].growattType === "spa") {
                devicesData.push({
                  sn: sn,
                  data: devices[sn],
                });
          
                  data.push({
                    plantid: key,
                    data: { ...rest, devicesData }
                  })
              }
        
              else if( devices[sn].growattType === "hps") {
                devicesData.push({
                  sn: sn,
                  data: devices[sn],
                });
          
                  data.push({
                    plantid: key,
                    data: { ...rest, devicesData }
                  })
              } else { console.log("Inverter not yet supported. Please log a call at module Github page, https://github.com/mumblebaj/MMM-Growatt/issues") }
            });
          }) 

        return plantDataFiltered;
    },

    getGrowattData: async function (payload) {
        // let keys = "";
        // let deviceSerial = "";
        const growatt = new api({})
        let login = await growatt.login(payload.username, payload.password).catch(e => { console.log(e) })
        console.log('login: ', login)

        let getAllPlantData = await growatt.getAllPlantData(options).catch(e => { console.log(e) })

        let logout = await growatt.logout().catch(e => { console.log(e) })
        console.log('logout:', logout)
        
        // Get the Plant ID here
        // keys = Object.keys(getAllPlantData);

        // Get the device serial Number
        //keys.forEach(key => {
        //        let { devices, ...rest } = getAllPlantData[key];
        //        deviceSerial = Object.keys(devices);
        // })

        var plantData = getAllPlantData;

        var parserResponse = this.deconstructPlantData(plantData, payload)

        var growattDataParsed = plantDataFiltered;

        this.sendSocketNotification('GROWATT_DATA', growattDataParsed)
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === 'GET_GROWATT_DATA') {
            this.getGrowattData(payload)
        }
    }
})