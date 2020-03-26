import React, { useCallback, useState, useEffect, useRef } from 'react';
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
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [items])

  return (
    <div ref={containerRef} className="MessageList" {...props}>
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

const TextInput = ({ value, onEnter, autofocus, clearOnEnter, ...props }) => {
  const inputRef = useRef(null)

  useEffect(() => {
    if (autofocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autofocus, inputRef])

  const handleKeyUp = useCallback((event) => {
    if (event.keyCode !== 13) {
      return
    }

    if (typeof onEnter !== 'function') {
      return
    }

    onEnter(event.target.value)

    if (clearOnEnter) {
      event.target.value = ''
    }
  }, [ onEnter, clearOnEnter ])

  return <input type="text" value={value} onKeyUp={handleKeyUp} ref={inputRef} {...props} />
}

function App() {
  const { client } = useChat()
  const [name, setName] = useState(null)
  const [currentRoomId, setCurrentRoomId] = useState(null)
  const [messageValue, setMessageValue] = useState('')
  const rooms = useChatRooms()
  const users = useChatUsers()
  const messages = useChatMessages()

  const handleItemClick = (item) => {
    client.joinRoom(item.id)
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
    setMessageValue('')
  }, [client])

  const handleOnMessageChange = useCallback((event) => {
    setMessageValue(event.target.value)
  }, [])

  const handleOnCreateRoomEnter = useCallback((name) =>{
    client.createRoom(name)
  }, [client])

  if (!client.connected) {
    return <div>Connecting...</div>
  }

  if (!name) {
    return (
      <div className="NameModal">
        <p style={{fontSize:'3rem', color: '#fff', textAlign: 'center', marginBottom: '2rem'}}>What's your name?</p>
        <TextInput autofocus className="NameTextInput" onEnter={handleOnNameEnter} />
      </div>
    )
  }

  const currentRoom = rooms.find(room => room.id === currentRoomId)

  return (
    <div className="App">
      <div className="LeftColumn">
        <RoomList items={rooms} activeItemId={currentRoomId} onItemClick={handleItemClick} />

        <TextInput className="CreateRoomTextInput" placeholder="Create a room..." onEnter={handleOnCreateRoomEnter} clearOnEnter />
      </div>

      <div className="MiddleColumn">
        {currentRoom ? <div style={{borderBottom: '1px solid #25282c', fontSize: '2rem', padding: '1rem 2rem', color: '#fff'}}>{currentRoom.name}</div> : null}

        <MessageList items={messages} />

        <div style={{marginTop: 'auto'}}>
          <TextInput className="MessageTextInput" placeholder="Type something awesome..." onEnter={handleOnMessageEnter} clearOnEnter />
        </div>
      </div>

      <div className="RightColumn">
        <UserList items={users} />
      </div>
    </div>
  );
}

export default App;
