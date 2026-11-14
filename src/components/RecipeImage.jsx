import { useState, useEffect } from 'react'
import fallbackImage from '../assets/dashboard-meal.svg'
import { getCachedRecipeImage, getOrFetchRecipeImage } from '../utils/recipeImageFallback.js'

export default function RecipeImage({
  recipe,
  alt = '',
  className = '',
  style,
  onResolvedUrl,
  ...props
}) {
  const directUrl = recipe?.image_url || recipe?.image || ''

  // Synchronously check cache for instant display if previously fetched
  const [activeUrl, setActiveUrl] = useState(() => {
    if (directUrl) return directUrl
    if (recipe?.id) {
      const cached = getCachedRecipeImage(recipe.id)
      if (cached) return cached
    }
    return ''
  })

  const [isLoading, setIsLoading] = useState(() => Boolean(activeUrl || (!directUrl && recipe?.name)))
  const [hasError, setHasError] = useState(false)

  // Listen for direct URL or recipe changes
  useEffect(() => {
    let cancelled = false
    const candidate = recipe?.image_url || recipe?.image || ''

    if (candidate) {
      setActiveUrl(candidate)
      setHasError(false)
      setIsLoading(true)
      onResolvedUrl?.(candidate)
      return undefined
    }

    // Attempt client-side lookup via Wikipedia if no image provided
    if (recipe?.id && recipe?.name) {
      const cached = getCachedRecipeImage(recipe.id)
      if (cached !== undefined) {
        if (!cancelled) {
          setActiveUrl(cached || '')
          setHasError(!cached)
          setIsLoading(Boolean(cached))
          onResolvedUrl?.(cached || null)
        }
        return undefined
      }

      setIsLoading(true)
      getOrFetchRecipeImage(recipe).then((found) => {
        if (cancelled) return
        if (found) {
          setActiveUrl(found)
          setHasError(false)
          setIsLoading(true)
          onResolvedUrl?.(found)
        } else {
          setActiveUrl('')
          setHasError(true)
          setIsLoading(false)
          onResolvedUrl?.(null)
        }
      }).catch(() => {
        if (!cancelled) {
          setActiveUrl('')
          setHasError(true)
          setIsLoading(false)
          onResolvedUrl?.(null)
        }
      })
    } else {
      setActiveUrl('')
      setHasError(true)
      setIsLoading(false)
      onResolvedUrl?.(null)
    }

    return () => {
      cancelled = true
    }
  }, [recipe?.id, recipe?.image, recipe?.image_url, recipe?.name])

  function handleImageLoad() {
    setIsLoading(false)
  }

  function handleImageError() {
    setHasError(true)
    setIsLoading(false)
    onResolvedUrl?.(null)
  }

  const finalSrc = !hasError && activeUrl ? activeUrl : fallbackImage

  return (
    <div
      className={`recipe-image-container ${className}`.trim()}
      style={style}
    >
      {isLoading && <div className="recipe-image-shimmer" aria-hidden="true" />}
      <img
        src={finalSrc}
        alt={alt || recipe?.name || 'Recipe'}
        className={`recipe-image-img ${className} ${isLoading ? 'is-loading' : 'is-loaded'}`.trim()}
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
        {...props}
      />
    </div>
  )
}

