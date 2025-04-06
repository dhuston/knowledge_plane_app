import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'

// 1. Define custom theme
const colors = {
  brand: { // Example purple shades - adjust as needed
    900: '#44337A', 
    800: '#5E49A3', 
    700: '#7860CD', 
    600: '#9178F5', // Primary purple?
    500: '#A68FF5', 
    400: '#B9A7F5', 
    300: '#CBC0F5', 
    200: '#DDD8F5', 
    100: '#EFECF5', 
    50: '#F7F5FA', 
  },
}

const theme = extendTheme({ colors })

// 2. Render ChakraProvider with the custom theme
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </StrictMode>,
)
