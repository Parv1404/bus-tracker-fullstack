const http = require('http');
const { Server } = require('socket.io');
const createDriverSocket = require('./sockets/driverSocket');
const driverManager = require('./services/driverManager');
const etaService = require('./services/etaService');

function startServer(app, port) {
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    //   console.log("startServer");


    createDriverSocket(io, driverManager, etaService); // register event listeners on the io object
    //   console.log("startServer again");
    server.listen(port, () => {
        console.log(`Server listening at PORT ${port}`);
    });

    return { server, io };
}

module.exports = { startServer };

