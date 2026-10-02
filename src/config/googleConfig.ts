/**
 * Configuración oficial de conexión a Google Cloud, Sheets y Drive para el proyecto IMSS Telecom.
 */

// Clave privada institucional y cuenta de servicio aprovisionada en Google Cloud
export const GOOGLE_CONFIG = {
  projectId: import.meta.env.VITE_GOOGLE_PROJECT_ID || 'imss-supervision-telecom',
  clientEmail:
    import.meta.env.VITE_GOOGLE_CLIENT_EMAIL ||
    'sincronizador-telecom@imss-supervision-telecom.iam.gserviceaccount.com',
  spreadsheetId:
    import.meta.env.VITE_GOOGLE_SPREADSHEET_ID || '1IhqNzrvt69biXpSdmmCsRv9wwya14c6vX_YoE3psk_0',
  driveRootFolderId:
    import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || '1Xn86EbqcekpFbwYFp6qqcWBF7YAetmLy',
  // URL opcional de Google Apps Script Web App para subidas en cuentas Gmail sin límite de cuota
  appsScriptUploadUrl:
    import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL ||
    'https://script.google.com/macros/s/AKfycbw-b9rWTt5e617G8s140mr5hSPErbARZ68uE78ngI33p1SWwy8K0JYYpkzwjNLF2spH/exec',
  // Llave privada PKCS#8 oficial descargada en private_key/
  privateKey:
    import.meta.env.VITE_GOOGLE_PRIVATE_KEY ||
    `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDC/ZSHltXdETb2
KWS7CtveOjdUfC47RoufQi8lf+wzTEZuzh6IowNLY8JIhij9qqI0LgT0bfU5SbSR
w5JnybfZ7LOehG0LB7TQP95iC0SPs/phyUcIj7Pz2TX9KV0iiP963JwgVHtHG4xX
ZDQ3YQvMFbC9ptu5Cl1cdeIU8mCNs7XiQD4MtQ7zMLv1VdSF8JJu44vaPCvZ39mN
BXchm391crX1dZXBfiQijOJquU403F/LdQQysyU7bLcSF2ESMGc32T2AvPlXXL5N
Em3A5dFUAPnpsrpWpfdCbFZ8vCX21h6wbUyvTT8NfcASTlTvm9Vfogex1PkL92PJ
ez883QKhAgMBAAECggEAUseRu2BTKbdJtIaNL4TkI7tmSvUvMVX5J2LTHiHpNjvu
+NKDjvFZkDNpQx3FoC9FDk7tJpHZ1fjO8kTrTimKZjeBZ84DdvfOEMzUjZ4H/NPk
+4eWIvHS7TZtH61kTymHAHNQyr7i2SS+V0mAi3QlLH6W2mTQigV27i5TjR361JzV
ZDltRrcYTvEDtP8/d1psM+Oj9F/WCF2HnCBYcAqciwxyWsGgzxIWvweXudV8q8zv
KUl2sqNSqrFRxD2wcfSRhICKrOeYLkQtTSScTEJ8DY+TZ8qt1tG750YO7+K/AwFg
tKci/MDMxT6Mw62qAu0waI1snnM6qcC5SaAMSuD0WwKBgQDi+VSlf96b3/dDN3U6
0pf7T1chyDA4NhlREhGDxGIbHz2tUIB6m30rEXPdFjzgL63kLJYYr2Qc0XnpNkpC
k29MguxED7oDseQH4s9WiN2z3U0UczbIsHq2YUVTUZwzZ9ZXOM7unXuLfnebCu1L
kJGpvWRBzXddLMVCnLSbJ4oErwKBgQDb7S1xtewToX/dLCwg8EziynnME6iocPKV
gyf8w6M1m2efbnkINLsyiUtYJ7mUr4Ij8xxwcjVH0a/2ZgIQzWyg5D8woEVeSvE/
WngThppF5wjCWjG/vL5PMR7I2hMP6tGcOwjs07e7GBPLZeFnu7Gep9LHsSmWw+8J
7MYlFHrhrwKBgQCxc8mwEsbSC0pf7O3kbV2Rh7hRmxfH+tPURFIZOOKS3dv0sqmg
MgysLVrukUJK7DwB1rIK3qVguo2bvWxVnLs5kGpz0+/Uj7H+UF9WAm+C/hQTVviP
8xodmPMAbx+2OQqk6q8uc0VyDBAq0WIw3/hiQsYthBw8ZpJav/WcEE+h1QKBgQC6
w80u3sZv2VuDkOqcwlUY18fdNeiputlXfP0tW1qzwJicPS3NeTJr9Uolv/6KtQ04
yFEjcOmsZvcesXwZlsokTBEZk1G1hMEhAwwr0MgcitnWatAKuxeGmvlAqmk7wDdn
jH7E1/sUiJruxUNJW4y4Zl7KtLnTzeqmrAuNG7pLAwKBgQDIrw+yJ729UYd/dvMb
37+lmYDDqUAQar5PJHgQicllrVBQnKV4b7YdsStxY2lKleWcd55d7v9tSqhmMJTw
DxXB5vyso0DfvJYWUhhyIEXImt9OgMmMXtq3ONfFk12GI8rZ3rxqf2/UEVSQt6O6
+nvU5wOZjYXZ5SjJFzyiJdZrsQ==
-----END PRIVATE KEY-----`
};
