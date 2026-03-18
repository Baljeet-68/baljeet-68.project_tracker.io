import React from 'react'
import { getUser } from '../auth'
import AttendanceAdmin from './AttendanceAdmin'
import AttendanceEmployee from './AttendanceEmployee'

export default function Attendance() {
  const user = getUser()
  
  if (!user) return null

  const isHRorAdmin = user.role === 'admin' || user.role === 'hr'
  
  return isHRorAdmin ? <AttendanceAdmin user={user} /> : <AttendanceEmployee user={user} />
}
