const http = require('http');
const { Server } = require('socket.io');
const createDriverSocket = require('./sockets/driverSocket');
const driverManager = require('./services/driverManager');
const etaService = require('./services/etaService');
const { corsOptions } = require('./config/index');

function startServer(app, port) {
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: {
            ...corsOptions,
            methods: ['GET', 'POST'],
        },
    });

    createDriverSocket(io, driverManager, etaService); 
    server.listen(port, () => {
        console.log(`Server listening at PORT ${port}`);
    });

    return { server, io };
}

module.exports = { startServer };

