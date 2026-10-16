'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'

interface QRCodeDisplayProps {
  url: string
  title: string
}

export function QRCodeDisplay({ url, title }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownloadQR = () => {
    // Get the SVG element
    const svg = document.querySelector('.qr-code-container svg')
    if (!svg) return

    // Create a canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size (larger for better quality)
    const size = 400
    canvas.width = size
    canvas.height = size

    // Create an image from the SVG
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      // Fill white background
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, size, size)

      // Draw the QR code
      ctx.drawImage(img, 0, 0, size, size)

      // Download
      const pngUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-qr-code.png`
      link.href = pngUrl
      link.click()

      URL.revokeObjectURL(svgUrl)
    }
    img.src = svgUrl
  }

  return (
    <div className="flex flex-col items-center">
      {/* QR Code */}
      <div className="qr-code-container bg-white p-6 rounded-2xl shadow-lg">
        <QRCodeSVG
          value={url}
          size={200}
          level="H"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#1e3a5f"
        />
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleCopyLink}
          className="btn-secondary inline-flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Link
            </>
          )}
        </button>
        <button
          onClick={handleDownloadQR}
          className="btn-secondary inline-flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download QR
        </button>
      </div>
    </div>
  )
}
