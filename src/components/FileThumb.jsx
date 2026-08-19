import { useEffect, useState } from 'react'
import { getFileURL } from '../lib/db.js'
import { Icon } from '../lib/icons.jsx'

// Loads a stored file from IndexedDB and shows an image preview when it's an
// image, otherwise a file/pdf icon. Revokes the object URL on unmount.
export default function FileThumb({ file, size = 24 }) {
  const [url, setUrl] = useState(null)
  const isImage = file?.type?.startsWith('image/')

  useEffect(() => {
    let active = true
    let created = null
    if (isImage && file?.id) {
      getFileURL(file.id).then((u) => {
        if (active) { created = u; setUrl(u) }
        else if (u) URL.revokeObjectURL(u)
      })
    }
    return () => { active = false; if (created) URL.revokeObjectURL(created) }
  }, [file?.id, isImage])

  if (isImage && url) return <img src={url} alt={file.name || ''} />
  if (file?.type === 'application/pdf') return <Icon.file size={size} />
  if (isImage) return <Icon.photo size={size} />
  return <Icon.file size={size} />
}
