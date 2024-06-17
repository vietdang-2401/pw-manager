module.exports.setupIpcHandlers = () => {
    require('./ipc-handlers/hardware-crypto');
    require('./ipc-handlers/native-module-host-proxy');
    require('./ipc-handlers/set-locale');
};
