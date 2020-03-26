class ChatClient {

  constructor(wsUrl) {
    this.connected = false
    this.listeners = {}

    this.socket = new WebSocket('ws://localhost:8080');

    this.socket.addEventListener('open', (event) => {
      this._onConnected(event)
    });

    this.socket.addEventListener('message', (event) => {
      let message = null

      try {
        message = JSON.parse(event.data)
      } catch (err) {
        console.error(err)
        return
      }

      if (message === null) {
        return
      }

      if (typeof message.type !== 'string') {
        console.error('Received invalid message', message)
        return
      }

      this._onMessage(message)
    })
  }

  _onConnected() {
    this.connected = true
    console.log('Connected to server')
    this.emit('connected')
  }

  _onDisconnected() {
    this.emit('disconnected')
  }

  _onError(err) {
    this.emit('error', err)
  }

  _onMessage(message) {
    console.log('Message from server ', message);
    this.emit('message', message)
  }

  onMessage(type, callback) {
    this.on('message', (message) => {
      if (message.type !== type) {
        return
      }

      callback(message)
    })
  }

  send(type, payload) {
    let message = { type, payload }

    if (typeof payload === 'undefined') {
      if (typeof type.type !== 'undefined') {
        message = type
      }
    }

    this.socket.send(JSON.stringify(message))
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }

    this.listeners[event].push(callback)
  }

  emit(event, ...args) {
    const listeners = this.listeners[event] || []
    listeners.forEach((listener) => listener(...args))
  }

  setName(name) {
    this.send('SET_NAME', { name })
  }

  joinRoom(id) {
    this.send('JOIN_ROOM', { id })
  }

  leaveRoom(id) {
    this.send('LEAVE_ROOM', { id })
  }

  sendMessage(content) {
    this.send('SEND_MESSAGE', { content })
  }

  createRoom(name) {
    this.send('CREATE_ROOM', { name })
  }
}

const chatClient = new ChatClient()

export default chatClient