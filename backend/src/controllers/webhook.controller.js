const { getIO } = require('../websocket/socketHandler');

const handlePokeEvent = async (req, res, next) => {
  try {
    const event = req.body;
    console.log('Webhook Poke reçu:', event.type);

    switch (event.type) {
      case 'message': {
        const io = getIO();
        if (event.sessionId && io) {
          io.to(`session:${event.sessionId}`).emit('poke:message', event);
        }
        break;
      }
      case 'status': {
        const io = getIO();
        if (io) io.emit('poke:status', event);
        break;
      }
      default:
        console.log("Type d'événement non géré:", event.type);
    }

    res.json({ received: true, type: event.type });
  } catch (error) {
    next(error);
  }
};

module.exports = { handlePokeEvent };
