import React, { useCallback, useState, useEffect } from 'react';
import './App.css';
import chatClient from './ChatClient'

const formatTimestamp = (ts) => {
  const date = new Date(ts)
  return `${date.getHours()}:${date.getMinutes()}`
}

const useChat = () => {
  const [ , setConnected ] = useState(chatClient.connected)

  useEffect(() => {
    chatClient.on('connected', () => setConnected(chatClient.connected))
    chatClient.on('disconnected', () => setConnected(chatClient.connected))
  }, []);

  return { client: chatClient }
}

const useChatRooms = () => {
  const [ rooms, setRooms ] = useState([])

  useEffect(() => {
    chatClient.onMessage('ROOM_LIST', ({ payload }) => setRooms(payload))
  }, [])

  return rooms
}

const useChatUsers = () => {
  const [ users, setUsers ] = useState([])

  useEffect(() => {
    chatClient.onMessage('USER_LIST', ({ payload }) => setUsers(payload))
  }, [])

  return users
}

const useChatMessages = () => {
  const [ messages, setMessages ] = useState([])

  useEffect(() => {
    chatClient.onMessage('MESSAGE_LIST', ({ payload }) => setMessages(payload))
    chatClient.onMessage('ROOM_MESSAGE', ({ payload }) => setMessages((messages) => [...messages, payload]))
  }, []);

  return messages
}

const RoomList = ({ items, activeItemId, onItemClick, ...props }) => {
  const handleRoomListItemClick = useCallback((id) => {
    const item = items.find(item => item.id === id)
    onItemClick(item)
  }, [ items, onItemClick ])

  return (
    <div className="RoomList" {...props}>
      {items.map(({ id, ...props }) => (
        <RoomListItem key={id} active={id === activeItemId} id={id} {...props} onClick={handleRoomListItemClick} />
      ))}
    </div>
  )
}

const RoomListItem = ({ id, active, name, onClick }) => {
  const handleOnClick = useCallback(() => {
    if (typeof onClick !== 'function') {
      return
    }

    onClick(id)
  }, [ onClick, id ])

  return (
    <div className={`RoomListItem ${active ? 'RoomListItem--Active' : ''}`} onClick={handleOnClick}>{name}</div>
  )
}

const UserList = ({ items, ...props }) => {
  return (
    <div className="UserList" {...props}>
      {items.map(({ id, ...props }) => (
        <UserListItem key={id} id={id} {...props} />
      ))}
    </div>
  )
}

const UserListItem = ({ name }) => {
  return <div className="UserListItem">{name}</div>
}

const MessageList = ({ items, ...props }) => {
  return (
    <div className="MessageList" {...props}>
      {items.map(({ id, ...props }) => (
        <MessageListItem key={id} id={id} {...props} />
      ))}
    </div>
  )
}

const MessageListItem = ({ from, content, createdAt }) => {
  return (
    <div className="MessageListItem">
      <span className="MessageListItem__From">{from}</span> <span className="MessageListItem__CreatedAt">{formatTimestamp(createdAt)}</span>
      <div className="MessageListItem__Content">{content}</div>
    </div>
  )
}

const TextInput = ({ value, onEnter, ...props }) => {
  const handleKeyUp = useCallback((event) => {
    if (event.keyCode !== 13) {
      return
    }

    if (typeof onEnter !== 'function') {
      return
    }

    onEnter(event.target.value)
  }, [ onEnter ])

  return <input type="text" value={value} onKeyUp={handleKeyUp} {...props} />
}

function App() {
  const { client } = useChat()
  const [name, setName] = useState(null)
  const [currentRoomId, setCurrentRoomId] = useState(null)
  const rooms = useChatRooms()
  const users = useChatUsers()
  const messages = useChatMessages()

  const handleItemClick = (item) => {
    client.joinRoom(item.name)
    setCurrentRoomId(item.id)
  }

  const handleOnNameEnter = useCallback((name) => {
    if (!name) {
      return
    }

    client.setName(name)
    setName(name)
  }, [client])

  const handleOnMessageEnter = useCallback((content) => {
    if (!content) {
      return
    }

    client.sendMessage(content)
  }, [client])

  if (!client.connected) {
    return <div>Connecting...</div>
  }

  if (!name) {
    return (
      <div className="NameModal">
        <p style={{fontSize:'3rem', color: '#fff', textAlign: 'center', marginBottom: '2rem'}}>What's your name?</p>
        <TextInput className="NameTextInput" onEnter={handleOnNameEnter} />
      </div>
    )
  }

  return (
    <div className="App">
      <div className="LeftColumn">
        <RoomList items={rooms} activeItemId={currentRoomId} onItemClick={handleItemClick} />
      </div>

      <div className="MiddleColumn">
        <MessageList items={messages} />

        <div style={{marginTop: 'auto'}}>
          <TextInput className="MessageTextInput" placeholder="Type something awesome..." onEnter={handleOnMessageEnter} />
        </div>
      </div>

      <div className="RightColumn">
        <UserList items={users} />
      </div>
    </div>
  );
}

export default App;
