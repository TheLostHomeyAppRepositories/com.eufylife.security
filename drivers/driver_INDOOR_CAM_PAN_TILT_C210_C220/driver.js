const mainDriver = require('../main-driver');


module.exports = class driver_INDOOR_CAM_PAN_TILT_C210_C220 extends mainDriver {
    deviceType() {
        return this.homey.app.deviceTypes.INDOOR_CAM_PAN_TILT_C210_C220
    }
}