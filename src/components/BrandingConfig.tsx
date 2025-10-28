/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect } from 'react'

export interface BrandingConfig {
  companyName: string
  logoUrl: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

const defaultBranding: BrandingConfig = {
  companyName: 'Control de Portería',
  logoUrl: '',
  primaryColor: '#2563eb', // blue-600
  secondaryColor: '#4f46e5', // indigo-600
  accentColor: '#059669', // emerald-600
}

export function useBranding() {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    const saved = localStorage.getItem('branding')
    return saved ? JSON.parse(saved) : defaultBranding
  })

  useEffect(() => {
    localStorage.setItem('branding', JSON.stringify(branding))
    
    // Aplicar colores CSS personalizados
    const root = document.documentElement
    root.style.setProperty('--color-primary', branding.primaryColor)
    root.style.setProperty('--color-secondary', branding.secondaryColor)
    root.style.setProperty('--color-accent', branding.accentColor)
  }, [branding])

  return { branding, setBranding }
}

interface BrandingConfigProps {
  isOpen: boolean
  onClose: () => void
  branding: BrandingConfig
  onSave: (config: BrandingConfig) => void
}

export function BrandingConfigModal({ isOpen, onClose, branding, onSave }: BrandingConfigProps) {
  const [config, setConfig] = useState<BrandingConfig>(branding)
  // removed unused: const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>(branding.logoUrl)

  useEffect(() => {
    setConfig(branding)
    setLogoPreview(branding.logoUrl)
  }, [branding])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // removed unused: setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setLogoPreview(result)
        setConfig(prev => ({ ...prev, logoUrl: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    onSave(config)
    onClose()
  }

  const presetColors = [
    { name: 'Azul Corporativo', primary: '#2563eb', secondary: '#4f46e5', accent: '#059669' },
    { name: 'Verde Empresarial', primary: '#059669', secondary: '#0d9488', accent: '#2563eb' },
    { name: 'Naranja Energético', primary: '#ea580c', secondary: '#dc2626', accent: '#7c3aed' },
    { name: 'Púrpura Moderno', primary: '#7c3aed', secondary: '#9333ea', accent: '#059669' },
    { name: 'Rojo Dinámico', primary: '#dc2626', secondary: '#b91c1c', accent: '#2563eb' },
    { name: 'Gris Profesional', primary: '#374151', secondary: '#4b5563', accent: '#059669' },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              🎨 Personalización de Marca
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Nombre de la empresa */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre de la Empresa
            </label>
            <input
              type="text"
              value={config.companyName}
              onChange={(e) => setConfig(prev => ({ ...prev, companyName: e.target.value }))}
              className="input-field"
              placeholder="Mi Empresa S.A."
            />
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Logo de la Empresa
            </label>
            <div className="flex items-center space-x-4">
              <label className="btn-secondary cursor-pointer flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Subir Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
              {logoPreview && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain bg-white" />
                </div>
              )}
            </div>
          </div>

          {/* Colores personalizados */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Paleta de Colores</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Color Primario
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="input-field flex-1"
                    placeholder="#2563eb"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Color Secundario
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.secondaryColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="input-field flex-1"
                    placeholder="#4f46e5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Color de Acento
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={config.accentColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.accentColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="input-field flex-1"
                    placeholder="#059669"
                  />
                </div>
              </div>
            </div>

            {/* Presets de colores */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Paletas Predefinidas
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {presetColors.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      primaryColor: preset.primary,
                      secondaryColor: preset.secondary,
                      accentColor: preset.accent
                    }))}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }}></div>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.secondary }}></div>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }}></div>
                    </div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {preset.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Vista previa del logo y los colores */}
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 bg-white flex items-center justify-center">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-400">Sin logo</span>
                  )}
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: config.primaryColor }}>
                    {config.companyName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Vista previa de la marca
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: config.primaryColor }}></div>
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: config.secondaryColor }}></div>
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: config.accentColor }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  )
}