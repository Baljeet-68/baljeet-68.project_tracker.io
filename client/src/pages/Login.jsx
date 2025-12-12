import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveToken, getToken, saveUser } from '../auth'
import { API_BASE_URL } from '../apiConfig';
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import { motion } from 'framer-motion'

export default function Login() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [remember, setRemember] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    const token = getToken()
    if (token) nav('/', { replace: true })
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) throw new Error('Invalid credentials')
      const data = await res.json()
      saveToken(data.token)
      saveUser(data.user)
      if (remember) localStorage.setItem('username', email)
      nav('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed..')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #51cbce 0%, #26bcbf 100%)',
        backgroundAttachment: 'fixed'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Paper elevation={12} sx={{ width: 440, p: 4, borderRadius: 2, backgroundColor: '#ffffff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: '#51cbce', width: 60, height: 60 }}>
              <LockOutlinedIcon sx={{ fontSize: 32 }} />
            </Avatar>
          </Box>

          <Typography variant="h4" sx={{ textAlign: 'center', mb: 1, fontWeight: 700, color: '#3c4858' }}>
            Welcome!
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', mb: 3, color: '#9A9A9A' }}>
            Sign in to your Project Tracker account to continue
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Box component="form" onSubmit={submit} noValidate>
            <TextField
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              required
              autoComplete="email"
              variant="outlined"
              placeholder="admin@example.com"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: '#51cbce' }
                }
              }}
            />

            <TextField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPwd ? 'text' : 'password'}
              fullWidth
              margin="normal"
              required
              autoComplete="current-password"
              variant="outlined"
              placeholder="Enter your password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPwd((s) => !s)} edge="end" size="small">
                      {showPwd ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: '#51cbce' }
                }
              }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, mb: 2 }}>
              <FormControlLabel
                control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} size="small" />}
                label={<Typography variant="body2">Remember me</Typography>}
              />
            </Box>

            {error && (
              <Box sx={{ p: 1.5, mb: 2, bgcolor: '#ffebee', borderRadius: 1, border: '1px solid #ef5350' }}>
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 3, mb: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ textTransform: 'uppercase', fontWeight: 600, py: 1.5 }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Sign in'}
              </Button>
            </Box>
          </Box>




        </Paper>
      </motion.div>
    </Box>
  )
}
////check CICD