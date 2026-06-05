'use client'

import React, { useEffect, useState } from 'react'
import { Save, Loader2, Globe, FileText, Search, LayoutGrid, ToggleLeft, Image } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useAdminStore } from '@/store/admin-store'
import { toast } from 'sonner'

interface SettingField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'image'
  description: string
  icon: React.ReactNode
  group: 'general' | 'seo' | 'display'
}

const SETTINGS_FIELDS: SettingField[] = [
  {
    key: 'site_name',
    label: 'Nombre del Sitio',
    type: 'text',
    description: 'El nombre que se muestra en la pestaña del navegador y la cabecera',
    icon: <Globe className="h-4 w-4" />,
    group: 'general',
  },
  {
    key: 'site_logo',
    label: 'Logo del Sitio',
    type: 'image',
    description: 'El logotipo del portal de noticias (se puede subir un archivo)',
    icon: <Image className="h-4 w-4" />,
    group: 'general',
  },
  {
    key: 'site_favicon',
    label: 'Icono del Sitio (Favicon)',
    type: 'image',
    description: 'El icono de la pestaña del navegador (favicon, preferiblemente .ico, .png o .svg)',
    icon: <Globe className="h-4 w-4" />,
    group: 'general',
  },
  {
    key: 'site_description',
    label: 'Descripción del Sitio',
    type: 'textarea',
    description: 'Una breve descripción de tu portal de noticias',
    icon: <FileText className="h-4 w-4" />,
    group: 'general',
  },
  {
    key: 'seo_title',
    label: 'Título SEO',
    type: 'text',
    description: 'Título predeterminado para los resultados del motor de búsqueda',
    icon: <Search className="h-4 w-4" />,
    group: 'seo',
  },
  {
    key: 'seo_description',
    label: 'Descripción SEO',
    type: 'textarea',
    description: 'Descripción meta predeterminada para motores de búsqueda',
    icon: <Search className="h-4 w-4" />,
    group: 'seo',
  },
  {
    key: 'banner_enabled',
    label: 'Habilitar Banner',
    type: 'boolean',
    description: 'Mostrar el banner de anuncio en la parte superior del sitio',
    icon: <ToggleLeft className="h-4 w-4" />,
    group: 'display',
  },
  {
    key: 'banner_text',
    label: 'Texto del Banner',
    type: 'text',
    description: 'Texto mostrado en el banner de anuncio',
    icon: <LayoutGrid className="h-4 w-4" />,
    group: 'display',
  },
  {
    key: 'articles_per_page',
    label: 'Artículos por Página',
    type: 'number',
    description: 'Número de artículos que se muestran en cada página (por defecto: 12)',
    icon: <LayoutGrid className="h-4 w-4" />,
    group: 'display',
  },
]

const GROUP_LABELS: Record<string, string> = {
  general: 'General',
  seo: 'SEO',
  display: 'Visualización',
}

export default function SettingsManager() {
  const { settings, fetchSettings, updateSettings } = useAdminStore()
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadingMap, setIsUploadingMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchSettings().finally(() => setIsLoading(false))
  }, [fetchSettings])

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      // Sync store settings to local form state (deferred to avoid cascading render lint)
      const s = { ...settings }
      void Promise.resolve().then(() => setLocalSettings(s))
    }
  }, [settings])

  const handleSettingChange = (key: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleBooleanChange = (key: string, checked: boolean) => {
    setLocalSettings((prev) => ({ ...prev, [key]: checked ? 'true' : 'false' }))
  }

  const handleFileUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingMap((prev) => ({ ...prev, [key]: true }))
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        handleSettingChange(key, data.url)
        toast.success('Logotipo subido correctamente')
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || 'Error al subir el archivo')
      }
    } catch (err) {
      toast.error('Ocurrió un error al subir el archivo')
    } finally {
      setIsUploadingMap((prev) => ({ ...prev, [key]: false }))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    const result = await updateSettings(localSettings)
    if (result) {
      toast.success('Configuración guardada correctamente')
    } else {
      toast.error('Error al guardar la configuración')
    }
    setIsSaving(false)
  }

  const getSettingValue = (key: string): string => {
    return localSettings[key] || ''
  }

  const renderField = (field: SettingField) => {
    const value = getSettingValue(field.key)

    switch (field.type) {
      case 'text':
        return (
          <div className="space-y-2" key={field.key}>
            <Label htmlFor={field.key} className="flex items-center gap-2">
              {field.icon}
              {field.label}
            </Label>
            <Input
              id={field.key}
              value={value}
              onChange={(e) => handleSettingChange(field.key, e.target.value)}
              placeholder={`Introduce el ${field.label.toLowerCase()}...`}
            />
            <p className="text-xs text-muted-foreground">{field.description}</p>
          </div>
        )

      case 'image':
        return (
          <div className="space-y-2" key={field.key}>
            <Label htmlFor={field.key} className="flex items-center gap-2">
              {field.icon}
              {field.label}
            </Label>
            <div className="flex gap-2">
              <Input
                id={field.key}
                value={value}
                onChange={(e) => handleSettingChange(field.key, e.target.value)}
                placeholder={`Introduce la URL del ${field.label.toLowerCase()} o sube un archivo...`}
              />
              <div className="relative">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isUploadingMap[field.key]}
                  onClick={() => document.getElementById(`upload-${field.key}`)?.click()}
                >
                  {isUploadingMap[field.key] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Subir'
                  )}
                </Button>
                <input
                  id={`upload-${field.key}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(field.key, e)}
                />
              </div>
            </div>
            {value && (
              <div className="mt-2">
                <img
                  src={value}
                  alt={field.label}
                  className="h-16 object-contain rounded-md border p-1 max-w-[200px]"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">{field.description}</p>
          </div>
        )

      case 'textarea':
        return (
          <div className="space-y-2" key={field.key}>
            <Label htmlFor={field.key} className="flex items-center gap-2">
              {field.icon}
              {field.label}
            </Label>
            <Textarea
              id={field.key}
              value={value}
              onChange={(e) => handleSettingChange(field.key, e.target.value)}
              placeholder={`Introduce el ${field.label.toLowerCase()}...`}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{field.description}</p>
          </div>
        )

      case 'number':
        return (
          <div className="space-y-2" key={field.key}>
            <Label htmlFor={field.key} className="flex items-center gap-2">
              {field.icon}
              {field.label}
            </Label>
            <Input
              id={field.key}
              type="number"
              value={value}
              onChange={(e) => handleSettingChange(field.key, e.target.value)}
              min={1}
              max={100}
            />
            <p className="text-xs text-muted-foreground">{field.description}</p>
          </div>
        )

      case 'boolean':
        return (
          <div className="flex items-center justify-between gap-4 py-2" key={field.key}>
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                {field.icon}
                {field.label}
              </Label>
              <p className="text-xs text-muted-foreground">{field.description}</p>
            </div>
            <Switch
              checked={value === 'true'}
              onCheckedChange={(checked) => handleBooleanChange(field.key, checked)}
            />
          </div>
        )

      default:
        return null
    }
  }

  // Group fields
  const groupedFields = SETTINGS_FIELDS.reduce<Record<string, SettingField[]>>((acc, field) => {
    if (!acc[field.group]) acc[field.group] = []
    acc[field.group].push(field)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Configuración del Sitio</h2>
          <p className="text-sm text-muted-foreground">
            Configura los ajustes de tu portal de noticias
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFields).map(([group, fields]) => (
            <Card key={group}>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">{GROUP_LABELS[group]}</CardTitle>
                <CardDescription>
                  {group === 'general' && 'Configuración básica del sitio'}
                  {group === 'seo' && 'Configuración de optimización para motores de búsqueda'}
                  {group === 'display' && 'Opciones de visualización y diseño de contenido'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map(renderField)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bottom Save Button (for long forms) */}
      {!isLoading && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Toda la Configuración
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
