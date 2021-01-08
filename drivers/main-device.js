const Homey = require('homey');
const { CommandType } = require('eufy-node-client');
const eufyCommandSendHelper = require("../../lib/helpers/eufy-command-send.helper");

module.exports = class mainDevice extends Homey.Device {
    async onCapability_CMD_DEVS_SWITCH( value, opts ) {
        const deviceObject = this.getData();
        try {
            const deviceId = deviceObject.index || 0;
            const CMD_DEVS_SWITCH = value ? 1 : 0;

            await eufyCommandSendHelper.sendCommand(CommandType.CMD_DEVS_SWITCH, CMD_DEVS_SWITCH, deviceId, 'CMD_DEVS_SWITCH');
            return Promise.resolve(true);
        } catch (e) {
            Homey.app.error(e);
            return Promise.reject(e);
        }
    }
    
    async onCapability_CMD_SET_ARMING( value, opts ) {
        try {
            const CMD_SET_ARMING = value;
            await eufyCommandSendHelper.sendCommand(CommandType.CMD_SET_ARMING, CMD_SET_ARMING, null, 'CMD_SET_ARMING');
            return Promise.resolve(true);
        } catch (e) {
            Homey.app.error(e);
            return Promise.reject(e);
        }
	}
}