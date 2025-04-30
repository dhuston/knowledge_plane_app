// import { StrictMode } from 'react' // Temporarily commented out
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ChakraProvider } from '@chakra-ui/react'
// import { AuthProvider } from './context/AuthContext' // Remove import

// Import our custom theme
import theme from './theme'

// Render ChakraProvider with the custom theme
createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <ChakraProvider theme={theme}>
      {/* <AuthProvider> */}
        <App />
      {/* </AuthProvider> */}
    </ChakraProvider>,
  // </StrictMode>,
)
