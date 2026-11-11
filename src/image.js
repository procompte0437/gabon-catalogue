export function compressImage(file, maxDim = 900, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      let width = image.width
      let height = image.height
      if (width > height && width > maxDim) {
        height = (height * maxDim) / width
        width = maxDim
      } else if (height > maxDim) {
        width = (width * maxDim) / height
        height = maxDim
      }
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(width))
      canvas.height = Math.max(1, Math.round(height))
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url)
        if (!blob) {
          reject(new Error('Impossible de lire cette photo.'))
          return
        }
        resolve(new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
      }, 'image/jpeg', quality)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Impossible de lire cette photo.'))
    }
    image.src = url
  })
}
