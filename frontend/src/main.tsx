import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ChakraProvider } from '@chakra-ui/react'

// Import our custom theme
import theme from './theme'

// Render app with ChakraProvider and custom theme
createRoot(document.getElementById('root')!).render(
  <ChakraProvider theme={theme}>
    <App />
  </ChakraProvider>
)
