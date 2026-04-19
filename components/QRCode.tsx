'use client'
import { QRCodeSVG } from 'qrcode.react'

export default function QRCode({ url, size = 160 }: { url: string; size?: number }) {
  return (
    <QRCodeSVG
      value={url}
      size={size}
      bgColor="transparent"
      fgColor="#021f35"
      level="M"
    />
  )
}
