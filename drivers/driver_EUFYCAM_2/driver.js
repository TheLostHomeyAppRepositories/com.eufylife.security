const mainDriver = require('../main-driver');


module.exports = class driver_EUFYCAM_2 extends mainDriver {
    deviceType() {
        return [...this.homey.app.deviceTypes.EUFYCAM_2, ...this.homey.app.deviceTypes.EUFYCAM_2_PRO]
    }
}