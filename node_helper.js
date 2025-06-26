var NodeHelper = require('node_helper')
    var api = require('growatt')
    var fs = require('fs')
    var os = require('os')

    const servers = {
    main: 'https://server.growatt.com',
    us: 'https://server-us.growatt.com'
}
const options = {
    plantData: true,
    weather: false,
    totalData: true,
    statusData: true,
    deviceData: true,
    deviceType: false,
    historyLast: true,
    historyAll: false
}

var growattlog = `${__dirname}/growatt.log`;

module.exports = NodeHelper.create({
    requiresVersion: '2.22.0',

    start: function () {
        console.log('Starting node helper for ' + this.name)
    },

    /**
     * Entry function to deconstruct plant data by device type.
     * Supports multiple growattType values with custom parsing per type.
     */
    /**
     * Entry function to deconstruct plant data by device type.
     * Supports multiple growattType values with custom parsing per type.
     */
    deconstructPlantData: function (rawData, payload) {
        let plantDataFiltered = [];

        Object.entries(rawData).forEach(([plantId, plantInfo]) => {
            const {
                devices,
                ...plantMeta
            } = plantInfo;

            Object.entries(devices).forEach(([sn, device]) => {
                let result = null;

                switch (device.growattType) {
                case 'storage':
                    result = this._parseStorage(plantMeta, sn, device);
                    break;
                case 'tlxh':
                case 'tlx':
                case 'mix':
                    result = this._parseInverterWithHistory(plantMeta, sn, device, device.growattType);
                    break;
                case 'noah':
                    result = this._parseNoah(plantMeta, sn, device);
                    break;
                default:
                    console.warn(`Inverter type '${device.growattType}' not supported. Please log a call at https://github.com/mumblebaj/MMM-Growatt/issues`);
                }

                if (result) {
                    plantDataFiltered.push(result);
                }
            });
        });

        return plantDataFiltered;
    },

    /**
     * Parses 'storage' type inverter data
     */
    _parseStorage: function (meta, sn, device) {
        const batPower = device?.statusData?.batPower || 0;
        const charging = batPower <= 0 ? batPower : 0;
        const discharging = batPower > 0 ? batPower : 0;

        return {
            growattType: 'storage',
            plantName: meta.plantName,
            country: meta.plantData?.country,
            city: meta.plantData?.city,
            accountName: meta.plantData?.accountName,
            inverterPower: meta.plantData?.nominalPower,
            treesSaved: meta.plantData?.tree,
            coalSaved: meta.plantData?.coal,
            ppv1: device?.statusData?.ppv1 ?? device?.statusData?.pPv1,
            ppv2: device?.statusData?.ppv2 ?? device?.statusData?.pPv2,
            gridPower: device?.statusData?.gridPower,
            discharging,
            charging,
            stateOfCharge: device?.statusData?.capacity,
            consumptionPower: device?.statusData?.loadPower,
            rateVA: device?.statusData?.rateVA,
            loadPercentage: device?.statusData?.loadPrecent,
            staticTakenAt: device?.deviceData?.lastUpdateTime,
            useEnergyToday: device?.totalData?.useEnergyToday,
            useEnergyTotal: device?.totalData?.useEnergyTotal,
            chargeToday: device?.totalData?.chargeToday,
            chargeTotal: (parseInt(device?.totalData?.chargeTotal) || 0) / 1000,
            eDischargeTotal: (parseInt(device?.totalData?.eDischargeTotal) || 0) / 1000,
            eDischargeToday: device?.totalData?.eDischargeToday,
            eToUserTotal: device?.totalData?.eToUserTotal,
            eToUserToday: device?.totalData?.eToUserToday,
            epvToday: device?.totalData?.epvToday,
            epvTotal: (parseInt(device?.totalData?.epvTotal) || 0) / 1000,
        };
    },

    /**
     * Generic parser for types 'tlxh', 'tlx', and 'mix'
     */
    _parseInverterWithHistory: function (meta, sn, device, type) {
        const h = device?.historyLast || {};
        const s = device?.statusData || {};

        const epvToday = ['epv1Today', 'epv2Today', 'epv3Today', 'epv4Today']
        .map(k => parseInt(h[k]) || 0)
        .reduce((a, b) => a + b, 0);

        const importedFromGridToday = (s.pactouser || 0) / 1000;
        const importedFromGridTotal = (h.elocalLoadToday || 0) - (h.eselfToday || 0);
        const exportedToGridToday = s.pactogrid || 0;
        const exportedToGridTotal = h.pacToGridTotal || 0;

        return {
            growattType: type,
            plantName: meta.plantName,
            country: meta.plantData?.country,
            city: meta.plantData?.city,
            accountName: meta.plantData?.accountName,
            inverterPower: meta.plantData?.nominalPower,
            treesSaved: meta.plantData?.tree,
            coalSaved: meta.plantData?.coal,
            ppv: s.ppv,
            ppv1: s.ppv1 ?? s.pPv1,
            ppv2: s.ppv2 ?? s.pPv2,
            ppv3: s.ppv3 ?? s.pPv3,
            ppv4: s.ppv4 ?? s.pPv4,
            importFromGrid: s.pactouser,
            exportToGrid: s.pactogrid,
            discharging: s.pdisCharge,
            charging: s.chargePower,
            stateOfCharge: s.SOC,
            consumptionPower: s.pLocalLoad,
            staticTakenAt: device?.deviceData?.lastUpdateTime,
            useEnergyToday: h.elocalLoadToday,
            useEnergyTotal: h.elocalLoadTotal,
            chargeToday: h.echargeToday,
            chargeTotal: h.echargeTotal,
            eDischargeTotal: h.edischargeTotal,
            eDischargeToday: h.edischargeToday,
            importedFromGridToday,
            importedFromGridTotal,
            exportedToGridToday,
            exportedToGridTotal,
            eToUserTotal: exportedToGridTotal,
            eToUserToday: exportedToGridToday,
            epvToday,
            epvTotal: h.epvTotal
        };
    },

    /**
     * Custom parser for 'noah' type
     */
    _parseNoah: function (meta, sn, device) {
        const h = device?.historyLast || {};
        const d = device;
        const s = device?.statusData || {};

        const epvToday = ['epv1Today', 'epv2Today', 'epv3Today', 'epv4Today']
        .map(k => parseInt(h[k]) || 0)
        .reduce((a, b) => a + b, 0);

        const power = parseInt(d?.historyLast?.totalBatteryPackChargingPower || 0);
        const charging = power > 0 ? power : 0;
        const discharging = power < 0 ? power : 0;

        const exportedToGridTotal = (parseInt(h.esystemTotal || 0) - parseInt(h.eselfTotal || 0)) || 0;

        return {
            growattType: 'noah',
            plantName: meta.plantName,
            country: meta.plantData?.country,
            city: meta.plantData?.city,
            accountName: meta.plantData?.accountName,
            inverterPower: meta.plantData?.nominalPower,
            treesSaved: meta.plantData?.tree,
            coalSaved: meta.plantData?.coal,
            ppv: d?.historyLast?.ppv,
            discharging,
            charging,
            stateOfCharge: d?.historyLast?.totalBatteryPackSoc,
            consumptionPower: d?.historyLast?.pac,
            staticTakenAt: d?.deviceData?.lastUpdateTime,
            epvToday: d?.totalData?.eToday,
            epvTotal: d?.totalData?.eTotal
        };
    },

    getGrowattData: async function (payload) {
        let growattData = [];
        const server = payload.usServer ? servers.us : servers.main;

        const growatt = new api({
            server: server
        })
            const login = await this.retry(() => growatt.login(payload.username, payload.password));
        const plantData = await this.retry(() => growatt.getAllPlantData(options));

        let logout = await growatt.logout().catch(e => {
            console.log(e)
        })

            if (!plantData) {
                console.warn("No data returned from Growatt API.");
                return;
            }

            if (payload.debug === true) {
                fs.appendFile(growattlog, JSON.stringify(plantData, null, 2) + os.EOL, function (err) {
                    if (err)
                        throw err;
                })
            }

            const parsed = this.deconstructPlantData(plantData, payload)

            if (parsed.length > 1) {
                growattData = parsed.filter(item => item.growattType === "noah");
            } else {
                growattData = parsed;
            }

            this.sendSocketNotification('GROWATT_DATA', growattData)
    },

    retry: async function (fn, retries = 3, delay = 1000) {
        let lastError;
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (e) {
                lastError = e;
                console.warn(`Retry attempt ${i + 1} failed: ${e.message}`);
                if (i < retries - 1)
                    await new Promise(res => setTimeout(res, delay * (i + 1)));
            }
        }
        throw lastError;
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === 'GET_GROWATT_DATA') {
            this.getGrowattData(payload)
        }
    }
})
