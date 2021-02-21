const Homey = require('homey');
const { CommandType, sleep } = require('eufy-node-client');
const eufyCommandSendHelper = require("../../lib/helpers/eufy-command-send.helper");
const eufyNotificationCheckHelper = require("../../lib/helpers/eufy-notification-check.helper");
let _httpService = undefined;

module.exports = class mainDevice extends Homey.Device {
    async onInit() {
		Homey.app.log('[Device] - init =>', this.getName());
        Homey.app.setDevices(this);
    
        await this.checkCapabilities();

        this.registerCapabilityListener('onoff', this.onCapability_CMD_DEVS_SWITCH.bind(this));
        this.registerCapabilityListener('CMD_SET_ARMING', this.onCapability_CMD_SET_ARMING.bind(this));
        this.registerCapabilityListener('NTFY_MOTION_DETECTION', this.onCapability_CMD_TRIGGER_MOTION.bind(this));

        if(this.hasCapability('CMD_DOORBELL_QUICK_RESPONSE')) {
            await this.setQuickResponseStore();
            this.registerCapabilityListener('CMD_DOORBELL_QUICK_RESPONSE', this.onCapability_CMD_DOORBELL_QUICK_RESPONSE.bind(this));
        }

        await this.initCameraImage();

        this.setAvailable();

        await this.findDeviceIndexInStore();
    }

    async onAdded() {
        const settings = await Homey.app.getSettings();
        await eufyNotificationCheckHelper.init(settings);
    }

    async checkCapabilities() {
        // FEATURE 1.9.6 - Revert Socket class
        this.setClass('camera');

        const driver = this.getDriver();
        const driverManifest = driver.getManifest();
        const driverCapabilities = driverManifest.capabilities;
        const deviceCapabilities = this.getCapabilities();

        Homey.app.log(`[Device] ${this.getName()} - Found capabilities =>`, deviceCapabilities);

        if(driverCapabilities.length > deviceCapabilities.length) {      
            await this.updateCapabilities(driverCapabilities);
            return;
        }

        return;
    }

    async updateCapabilities(driverCapabilities) {
        Homey.app.log('[Device] - Add new capabilities =>', driverCapabilities);
        try {
            driverCapabilities.forEach(c => {
                this.addCapability(c);
            });
            await sleep(2000);
        } catch (error) {
            Homey.app.log(error)
        }
    }
    
    async onCapability_CMD_DEVS_SWITCH( value ) {
        const deviceObject = this.getData();
        const settings = this.getSettings();

        try {
            if(!value && settings && settings.override_onoff) {
                throw new Error('Device always-on enabled in settings');
            }

            const deviceId = this.getStoreValue('device_index');
            let CMD_DEVS_SWITCH = value ? 0 : 1;
            if(this.hasCapability('CMD_REVERSE_DEVS_SWITCH')) {
                CMD_DEVS_SWITCH = value ? 1 : 0;
            }

            await eufyCommandSendHelper.sendCommand(CommandType.CMD_DEVS_SWITCH, CMD_DEVS_SWITCH, deviceId, 'CMD_DEVS_SWITCH', deviceObject.station_sn);
            return Promise.resolve(true);
        } catch (e) {
            Homey.app.error(e);
            return Promise.reject(e);
        }
    }
    
    async onCapability_CMD_SET_ARMING( value ) {
        const deviceObject = this.getData();
        try {
            const CMD_SET_ARMING = value;
            await eufyCommandSendHelper.sendCommand(CommandType.CMD_SET_ARMING, CMD_SET_ARMING, null, 'CMD_SET_ARMING', deviceObject.station_sn);
            return Promise.resolve(true);
        } catch (e) {
            Homey.app.error(e);
            return Promise.reject(e);
        }
    }

    async onCapability_CMD_DOORBELL_QUICK_RESPONSE( value ) {
        const deviceObject = this.getData();
        const specificDeviceType = this.hasCapability('CMD_DOORBELL_QUICK_RESPONSE_POWERED');
        try {
            const quickResponse = this.getStoreValue('quick_response');
            const deviceId = this.getStoreValue('device_index');
            if(quickResponse.length >= value) {
                await eufyCommandSendHelper.sendCommand(CommandType.CMD_START_REALTIME_MEDIA, 1, deviceId, 'CMD_START_REALTIME_MEDIA', deviceObject.station_sn);
                await sleep(500);

                if(specificDeviceType) {
                    await eufyCommandSendHelper.sendCommand(CommandType.CMD_DOORBELL_SET_PAYLOAD, {
                        "commandType": CommandType.CMD_STOP_REALTIME_MEDIA, "data":{"voiceID": quickResponse[value-1]}
                    }, deviceId, 'CMD_DOORBELL_SET_PAYLOAD', deviceObject.station_sn);
                } else {
                    await eufyCommandSendHelper.sendCommand(CommandType.CMD_BAT_DOORBELL_QUICK_RESPONSE, quickResponse[value-1], deviceId, 'CMD_DOORBELL_QUICK_RESPONSE', deviceObject.station_sn);
                    await sleep(3000);
                    await eufyCommandSendHelper.sendCommand(CommandType.CMD_STOP_REALTIME_MEDIA, 1, deviceId, 'CMD_STOP_REALTIME_MEDIA', deviceObject.station_sn);
                }
            }
            return Promise.resolve(true);
        } catch (e) {
            Homey.app.error(e);
            return Promise.reject(e);
        }
    }

    async onCapability_CMD_TRIGGER_MOTION( value ) {
        try {
            this.setCapabilityValue(value, true)
            await sleep(5000);
            this.setCapabilityValue(value, false)
            return Promise.resolve(true);
        } catch (e) {
            Homey.app.error(e);
            return Promise.reject(e);
        }
    }

    initCameraImage() {
        Homey.app.log(`[Device] ${this.getName()} - Set initial image`);
        const deviceObject = this.getData();
        this._image = new Homey.Image();
        this._image.setPath('assets/images/large.jpg');
        this._image.register()
            .then(() => this.setCameraImage(deviceObject.station_sn, this.getName(), this._image))
            .catch(this.error);
    }

    async findDeviceIndexInStore() {
        try {
            await sleep(9000);
            const deviceObject = this.getData();
            const deviceStore = Homey.app.getDeviceStore();
            if(deviceStore) {
                const deviceMatch = deviceStore && deviceStore.find(d => d.device_sn === deviceObject.device_sn);
                this.setStoreValue('device_index', deviceMatch.index);
            }
            
            return Promise.resolve(true);
        } catch (e) {
            Homey.app.error(e);
            return Promise.reject(e);
        }
    }

    async setQuickResponseStore() {
        try {
            _httpService = Homey.app.getHttpService();
            const deviceObject = this.getData();

            let quickResponse = await _httpService.voiceList(deviceObject.device_sn);
            Homey.app.log(`[Device] ${this.getName()} - Set quickResponse`, quickResponse);

            quickResponse = quickResponse.map(v => v.voice_id);
            Homey.app.log(`[Device] ${this.getName()} - Mapped quickResponse`, quickResponse);

            if(quickResponse) {
                this.setStoreValue('quick_response', quickResponse);
            }
            
            return Promise.resolve(true);
        } catch (e) {
            Homey.app.error(e);
            return Promise.reject(e);
        }
    }
}