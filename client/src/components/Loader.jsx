import React from 'react'
import Lottie from 'lottie-react'
import loaderData from '../assets/Loader.json'

export const Loader = ({ size = 150, message = 'Loading...', fullScreen = true }) => {
  const loaderContent = (
    <div className="flex flex-col items-center justify-center">
      {!loaderData ? (
        <div className="w-12 h-12 border-4 border-fuchsia-200 border-t-fuchsia-600 rounded-full animate-spin mb-4"></div>
      ) : (
        <div style={{ width: size, height: size }}>
          <Lottie animationData={loaderData} loop={true} />
        </div>
      )}
      {message && <p className="mt-2 text-slate-500 font-medium">{message}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
        {loaderContent}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {loaderContent}
    </div>
  )
}
