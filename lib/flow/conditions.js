// ---------------------------------------INIT FUNCTION----------------------------------------------------------

exports.init = async function (homey) {
    try {
        homey.app.condition_CHECK_ARMING = homey.flow.getConditionCard('condition_CHECK_ARMING')
         .registerRunListener( async ( args, state ) =>
        {
            const value = args.condition_CHECK_ARM_TYPE;
            return await args.device.getCapabilityValue('CMD_SET_ARMING') == value.toString();
        } )

        homey.app.condition_CMD_SET_FLOODLIGHT_MANUAL_SWITCH = homey.flow.getConditionCard('condition_CMD_SET_FLOODLIGHT_MANUAL_SWITCH')
        .registerRunListener( async ( args, state ) =>
       {
           const value = !!parseInt(args.condition_CMD_SET_FLOODLIGHT_MANUAL_SWITCH_TYPE);
           return await args.device.getCapabilityValue('CMD_SET_FLOODLIGHT_MANUAL_SWITCH') == value;
       } )

    } catch (err) {
        homey.app.error(err);
    }
}   


// ---------------------------------------END OF FILE----------------------------------------------------------
    