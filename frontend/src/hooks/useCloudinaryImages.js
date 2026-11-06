import { useEffect, useState } from 'react'

const apiBaseUrl = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')

function normalizeImageKey(value) {
  const basename = String(value || '')
    .trim()
    .split(/[?#]/, 1)[0]
    .split(/[\\/]/)
    .pop()
    .replace(/\.[^.]+$/, '')
  return basename.toLowerCase().replace(/[^a-z0-9]/g, '')
}

async function loadCloudinaryImages() {
  const imagesByKey = new Map()
  let cursor = null

  do {
    const query = new URLSearchParams({ page_size: '100' })
    if (cursor) query.set('cursor', cursor)
    const response = await fetch(`${apiBaseUrl}/api/cloudinary/images/?${query}`)
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data.success) {
      throw new Error(data.message || `Cloudinary image lookup failed (status ${response.status}).`)
    }

    for (const image of data.images || []) {
      if (!image.secure_url) continue
      const sourceKey = normalizeImageKey(image.source_id)
      const publicId = String(image.public_id || '').split('/').pop()
      const publicIdKey = normalizeImageKey(publicId)
      if (sourceKey) imagesByKey.set(sourceKey, image.secure_url)
      if (publicIdKey) imagesByKey.set(publicIdKey, image.secure_url)
    }
    cursor = data.next_cursor || null
  } while (cursor)

  return imagesByKey
}

export function findCloudinaryImage(row, imagesByKey) {
  const keys = [
    row.id,
    row.csvRecordId,
    row.observationId,
    row.vehicleNumberPlate,
    row.numberPlate,
    row.vehicleImagePath,
    row.vehicle_image_path,
    row.vehicleImage,
    row.vehicle_image,
  ]
    .map(normalizeImageKey)
    .filter(Boolean)

  return keys.map((key) => imagesByKey.get(key)).find(Boolean) || null
}

export function useCloudinaryImages() {
  const [imagesByKey, setImagesByKey] = useState(() => new Map())
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    loadCloudinaryImages()
      .then((images) => {
        if (active) {
          setImagesByKey(images)
          setError('')
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoaded(true)
      })

    return () => {
      active = false
    }
  }, [])

  return { imagesByKey, error, loaded }
}
