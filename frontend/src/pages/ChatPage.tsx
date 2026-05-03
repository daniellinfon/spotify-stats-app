import Navbar from '../components/layout/Navbar'
import ChatPanel from '../components/chat/ChatPanel'

export default function ChatPage() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', color: 'white', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      <Navbar />
      <div style={{ flex: 1, padding: '0.75rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ChatPanel />
      </div>
    </div>
  )
}