import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  es: {
    translation: {
      app: {
        footer: 'Sistema de gestión de transporte Nefab'
      },
      common: {
        plate: 'Patente',
        driver: 'Conductor',
        company: 'Empresa',
        area: 'Área',
        inbound: 'Inbound',
        outbound: 'Outbound',
        others: 'Otros',
        cancel: 'Cancelar',
        confirm: 'Confirmar',
        photo: 'Foto',
        waiting: 'En espera',
        registeredBy: 'Registrado por:',
        viewMore: 'Ver más',
        viewAll: 'Ver todos',
        scrollTop: 'Ir arriba'
      },
      login: {
        title: 'Sistema de gestión de transporte {{company}}',
        subtitle: 'Ingrese sus datos para continuar',
        name: 'Nombre',
        lastName: 'Apellido',
        roles: {
          guard: 'Guardia',
          operator: 'Operador',
          admin: 'Administración'
        },
        signingIn: 'Ingresando...',
        submit: 'Ingresar al Sistema',
        error: 'Error al iniciar sesión',
        footer: 'Sistema de gestión de transporte Nefab'
      },
      form: {
        title: {
          enter: 'Formulario de Ingreso',
          waiting: 'Registrar en Espera'
        },
        subtitle: {
          enter: 'Complete los datos del camión para registrar el ingreso',
          waiting: 'Complete los datos para registrar en espera'
        },
        fields: {
          plate: 'Patente',
          driver: 'Conductor',
          company: 'Empresa'
        },
        type: {
          enter: '🚛 Ingreso',
          waiting: '⏳ En espera'
        },
        photo: {
          attachTitle: 'Adjuntar fotografía',
          previewAlt: 'Previsualización',
          removeTitle: 'Quitar foto'
        },
        submitting: 'Registrando...',
        submit: {
          enter: 'Registrar Ingreso',
          waiting: 'Registrar en Espera'
        },
        success: {
          enter: '✅ Ingreso registrado correctamente',
          waiting: '✅ Registro en espera creado correctamente'
        },
        errors: {
          missingFields: '❌ Complete patente, conductor y empresa',
          registerEnter: 'Error al registrar ingreso'
        }
      },
      dashboard: {
        title: 'Centro de Control Logístico Nefab',
        subtitle: 'Monitoreo avanzado en tiempo real',
        insideIndicator: 'Ingresados',
        waitingIndicator: 'En espera',
        success: { exit: '✅ Salida registrada correctamente' },
        areaSubtitle: {
          inbound: 'Área Inbound',
          outbound: 'Área Outbound',
          others: 'Área Otros'
        },
        expandArea: 'Expandir área',
        collapseArea: 'Colapsar área',
        waitingSince: 'Espera desde',
        waitingTime: 'Tiempo en espera',
        emptyTitle: 'Área disponible',
        emptySubtitle: 'Los vehículos aparecerán aquí cuando ingresen a esta zona'
      },
      waiting: {
        title: 'En Espera',
        subtitle: 'Gestión de camiones en espera por área',
        stats: {
          totalWaiting: 'Total en espera',
          totalActive: 'Total activos'
        },
        areaHeader: 'Área {{area}}',
        emptyTitle: 'Área disponible',
        emptySubtitle: 'No hay camiones esperando en esta área',
        truckStatus: { waiting: 'En espera' },
        labels: {
          waitingTimeShort: 'Tiempo esperando:',
          since: 'Desde:'
        },
        actions: {
          neverEnter: 'No ingresa',
          enter: 'Ingresar',
          reasonPlaceholder: 'Ingrese el motivo de no ingreso'
        },
        photoAlt: 'Foto del camión',
        photoHint: 'Doble clic para ver foto grande',
        viewMore: 'Ver más',
        viewAll: 'Ver todos',
        scrollTop: 'Ir arriba',
        success: {
          enter: '✅ Camión ingresó correctamente',
          neverEnter: '✅ Marcado como "No ingresa"'
        },
        error: {
          enter: 'No se pudo ingresar',
          neverEnter: 'No se pudo marcar'
        }
      },
      nav: {
        home: 'Inicio',
        form: 'Formulario',
        waiting: 'En espera',
        history: 'Historial',
        dashboard: 'Dashboard',
        openMenu: 'Abrir menú de navegación',
      },
      history: {
        title: 'Historial Completo de Registros',
        subtitle: 'Consulta, filtra y exporta todos los registros históricos',
        filtersTitle: 'Filtros de Búsqueda',
        search: 'Buscar',
        area: 'Área',
        state: 'Estado',
        from: 'Desde',
        to: 'Hasta',
        show: 'Mostrar',
        total: 'Total',
        inbound: 'inbound',
        outbound: 'outbound',
        export: 'Exportar Excel',
        exporting: 'Exportando…',
        options: {
          allAreas: 'Todas',
          others: 'Otros',
          allStatus: 'Todos',
          inside: 'Ingreso',
          waiting: 'En espera',
          exited: 'Salida'
        },
        table: {
          photo: 'Foto',
          plate: 'Patente',
          area: 'Área',
          state: 'Estado',
          entry: 'Entrada',
          exit: 'Salida',
          duration: 'Duración',
          waitingTime: 'Tiempo Espera',
          noEntryReason: 'Motivo No Ingreso',
          guard: 'Guardia'
        },
        emptyTitle: 'No hay registros',
        emptySubtitle: 'No se encontraron registros con los filtros aplicados'
      },
    },
  },
  en: {
    translation: {
      app: {
        footer: 'Nefab transport management system'
      },
      common: {
        plate: 'Plate',
        driver: 'Driver',
        company: 'Company',
        area: 'Area',
        inbound: 'Inbound',
        outbound: 'Outbound',
        others: 'Others',
        cancel: 'Cancel',
        confirm: 'Confirm',
        photo: 'Photo',
        waiting: 'Waiting',
        registeredBy: 'Registered by:',
        viewMore: 'View more',
        viewAll: 'View all',
        scrollTop: 'Scroll to top'
      },
      login: {
        title: '{{company}} transport management system',
        subtitle: 'Enter your details to continue',
        name: 'First name',
        lastName: 'Last name',
        roles: {
          guard: 'Guard',
          operator: 'Operator',
          admin: 'Admin'
        },
        signingIn: 'Signing in...',
        submit: 'Enter the System',
        error: 'Login failed',
        footer: 'Nefab transport management system'
      },
      form: {
        title: {
          enter: 'Entry Form',
          waiting: 'Register as Waiting'
        },
        subtitle: {
          enter: 'Fill in truck details to register entry',
          waiting: 'Fill in details to register waiting'
        },
        fields: {
          plate: 'Plate',
          driver: 'Driver',
          company: 'Company'
        },
        type: {
          enter: '🚛 Entry',
          waiting: '⏳ Waiting'
        },
        photo: {
          attachTitle: 'Attach photo',
          previewAlt: 'Preview',
          removeTitle: 'Remove photo'
        },
        submitting: 'Registering...',
        submit: {
          enter: 'Register Entry',
          waiting: 'Register as Waiting'
        },
        success: {
          enter: '✅ Entry registered successfully',
          waiting: '✅ Waiting record created successfully'
        },
        errors: {
          missingFields: '❌ Fill plate, driver and company',
          registerEnter: 'Error registering entry'
        }
      },
      dashboard: {
        title: 'Nefab Logistics Control Center',
        subtitle: 'Advanced real-time monitoring',
        insideIndicator: 'Inside',
        waitingIndicator: 'Waiting',
        success: { exit: '✅ Exit registered successfully' },
        areaSubtitle: {
          inbound: 'Inbound Area',
          outbound: 'Outbound Area',
          others: 'Others area'
        },
        expandArea: 'Expand area',
        collapseArea: 'Collapse area',
        waitingSince: 'Waiting since',
        waitingTime: 'Waiting time',
        emptyTitle: 'Area available',
        emptySubtitle: 'Vehicles will appear here when they enter this area'
      },
      waiting: {
        title: 'Waiting',
        subtitle: 'Manage waiting trucks by area',
        stats: {
          totalWaiting: 'Total waiting',
          totalActive: 'Total active'
        },
        areaHeader: 'Area {{area}}',
        emptyTitle: 'Area available',
        emptySubtitle: 'No trucks waiting in this area',
        truckStatus: { waiting: 'Waiting' },
        labels: {
          waitingTimeShort: 'Waiting time:',
          since: 'Since:'
        },
        actions: {
          neverEnter: 'Never enters',
          enter: 'Enter',
          reasonPlaceholder: 'Enter the reason for not entering'
        },
        photoAlt: 'Truck photo',
        photoHint: 'Double click to view large photo',
        viewMore: 'View more',
        viewAll: 'View all',
        scrollTop: 'Scroll to top',
        success: {
          enter: '✅ Truck entered successfully',
          neverEnter: '✅ Marked as "Never enters"'
        },
        error: {
          enter: 'Could not enter',
          neverEnter: 'Could not mark'
        }
      },
      nav: {
        home: 'Home',
        form: 'Form',
        waiting: 'Waiting',
        history: 'History',
        dashboard: 'Dashboard',
        openMenu: 'Open navigation menu',
      },
      history: {
        title: 'Complete Records History',
        subtitle: 'Browse, filter and export all historical records',
        filtersTitle: 'Search Filters',
        search: 'Search',
        area: 'Area',
        state: 'State',
        from: 'From',
        to: 'To',
        show: 'Show',
        total: 'Total',
        inbound: 'Inbound',
        outbound: 'Outbound',
        export: 'Export Excel',
        exporting: 'Exporting…',
        options: {
          allAreas: 'All',
          others: 'Others',
          allStatus: 'All',
          inside: 'Inside',
          waiting: 'Waiting',
          exited: 'Exited'
        },
        table: {
          photo: 'Photo',
          plate: 'Plate',
          area: 'Area',
          state: 'Status',
          entry: 'Entry',
          exit: 'Exit',
          duration: 'Duration',
          waitingTime: 'Waiting Time',
          noEntryReason: 'No Entry Reason',
          guard: 'Guard'
        },
        emptyTitle: 'No records',
        emptySubtitle: 'No records found for the selected filters'
      },
    },
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n